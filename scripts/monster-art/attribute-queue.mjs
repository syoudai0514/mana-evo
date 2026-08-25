#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ACTIVE_FIRST = 1;
export const ACTIVE_LAST = 238;
export const EXPECTED_SPECIES_COUNT = 238;
export const EXPECTED_FAMILY_COUNT = 83;
export const TYPE_OWNER_ORDER = [
  ['grass', 'W-303'], ['fire', 'W-304'], ['water', 'W-305'], ['electric', 'W-306'],
  ['normal', 'W-307'], ['flying', 'W-308'], ['bug', 'W-309'], ['ground', 'W-310'],
  ['rock', 'W-311'], ['steel', 'W-312'], ['poison', 'W-313'], ['fight', 'W-314'],
  ['fairy', 'W-315'], ['psychic', 'W-316'], ['ice', 'W-317'], ['ghost', 'W-318'],
  ['dark', 'W-319'], ['dragon', 'W-320'],
];
export const EXPECTED_TYPE_COUNT = TYPE_OWNER_ORDER.length;

const DESCRIPTION_SHARDS = [
  'design/current/monsters/descriptions-001-080.json',
  'design/current/monsters/descriptions-081-160.json',
  'design/current/monsters/descriptions-161-238.json',
];
const MANIFEST_PATH = 'design/current/monster-asset-manifest.json';
const HISTORICAL_INDEX_PATH = 'design/rebuild/asset-reference/0822/HISTORICAL-REFERENCE-INDEX.md';

export function speciesId(no) {
  return `m${String(no).padStart(3, '0')}`;
}

export function descriptionPointer(no) {
  const shard = no <= 80 ? DESCRIPTION_SHARDS[0] : no <= 160 ? DESCRIPTION_SHARDS[1] : DESCRIPTION_SHARDS[2];
  return {
    shard,
    selector: `speciesId=${speciesId(no)}`,
    fields: ['motif', 'familyConcept'],
  };
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function loadCurrent(root = process.cwd()) {
  const descriptions = DESCRIPTION_SHARDS.flatMap((relative) => readJson(path.join(root, relative)));
  const manifest = readJson(path.join(root, MANIFEST_PATH));
  return { descriptions, manifest };
}

function stateFor(manifest, id) {
  return manifest?.assets?.[id]?.state ?? 'UNKNOWN';
}

function expandCandidatePreference(preference = []) {
  const map = new Map();
  for (const row of preference) {
    const match = /^m(\d{3})-m(\d{3})$/.exec(row.ids ?? '');
    if (!match) continue;
    const first = Number(match[1]);
    const last = Number(match[2]);
    for (let no = first; no <= last; no += 1) {
      const id = speciesId(no);
      map.set(id, String(row.candidateAsset).replace('{speciesId}', id));
    }
  }
  return map;
}

export function validateCurrent(descriptions, manifest) {
  if (!Array.isArray(descriptions)) throw new Error('CURRENT descriptions must be an array');
  if (descriptions.length !== EXPECTED_SPECIES_COUNT) {
    throw new Error(`Expected ${EXPECTED_SPECIES_COUNT} active species, got ${descriptions.length}`);
  }

  const byId = new Map();
  for (const item of descriptions) {
    if (!/^m\d{3}$/.test(item.speciesId ?? '')) throw new Error(`Invalid speciesId: ${item.speciesId}`);
    const no = Number(item.speciesId.slice(1));
    if (no < ACTIVE_FIRST || no > ACTIVE_LAST) throw new Error(`Inactive/unknown speciesId in CURRENT: ${item.speciesId}`);
    if (item.speciesId === 'm239') throw new Error('m239 is excluded from CURRENT active scope');
    if (byId.has(item.speciesId)) throw new Error(`Duplicate speciesId: ${item.speciesId}`);
    byId.set(item.speciesId, item);
  }
  for (let no = ACTIVE_FIRST; no <= ACTIVE_LAST; no += 1) {
    const id = speciesId(no);
    if (!byId.has(id)) throw new Error(`Missing active speciesId: ${id}`);
  }
  if (byId.has('m239')) throw new Error('m239 must not be active');

  const familyMap = new Map();
  for (const item of descriptions) {
    if (!Number.isInteger(item.familyNo) || item.familyNo < 1) throw new Error(`Invalid familyNo for ${item.speciesId}`);
    if (!Number.isInteger(item.stage) || item.stage < 1) throw new Error(`Invalid stage for ${item.speciesId}`);
    if (!item.type) throw new Error(`Missing type for ${item.speciesId}`);
    if (!familyMap.has(item.familyNo)) familyMap.set(item.familyNo, []);
    familyMap.get(item.familyNo).push(item);
  }
  if (familyMap.size !== EXPECTED_FAMILY_COUNT) {
    throw new Error(`Expected ${EXPECTED_FAMILY_COUNT} active families, got ${familyMap.size}`);
  }

  for (let familyNo = 1; familyNo <= EXPECTED_FAMILY_COUNT; familyNo += 1) {
    const members = familyMap.get(familyNo);
    if (!members?.length) throw new Error(`Missing family ${familyNo}`);
    const types = new Set(members.map((x) => x.type));
    if (types.size !== 1) {
      throw new Error(`Family ${familyNo} is mixed-type and must be BLOCKED, not split: ${[...types].join(', ')}`);
    }
    const stages = members.map((x) => x.stage);
    if (new Set(stages).size !== stages.length) throw new Error(`Family ${familyNo} has duplicate stage values`);
  }

  const types = new Set(descriptions.map((x) => x.type));
  if (types.size !== EXPECTED_TYPE_COUNT) {
    throw new Error(`Expected ${EXPECTED_TYPE_COUNT} CURRENT types, got ${types.size}`);
  }
  const expectedTypes = new Set(TYPE_OWNER_ORDER.map(([type]) => type));
  for (const type of types) if (!expectedTypes.has(type)) throw new Error(`Unexpected CURRENT type: ${type}`);
  for (const type of expectedTypes) if (!types.has(type)) throw new Error(`Missing CURRENT type: ${type}`);

  if (manifest?.canonicalScope?.firstId !== 'm001' || manifest?.canonicalScope?.lastId !== 'm238') {
    throw new Error('monster-asset-manifest canonicalScope must remain m001-m238');
  }
  if (manifest?.canonicalScope?.excludedReferenceIds?.includes('m239') !== true) {
    throw new Error('monster-asset-manifest must retain m239 in excludedReferenceIds');
  }
  return { byId, familyMap, types };
}

export function buildAttributeQueue(descriptions, manifest, { sourceCommit = null } = {}) {
  const { familyMap } = validateCurrent(descriptions, manifest);
  const candidatePath = expandCandidatePreference(manifest.candidatePreference);
  const familyOwnerSeen = new Set();
  const speciesSeen = new Set();

  const attributes = TYPE_OWNER_ORDER.map(([type, workItem]) => {
    const families = [...familyMap.entries()]
      .filter(([, members]) => members[0].type === type)
      .sort(([a], [b]) => a - b)
      .map(([familyNo, members]) => {
        if (familyOwnerSeen.has(familyNo)) throw new Error(`Family ${familyNo} assigned more than once`);
        familyOwnerSeen.add(familyNo);
        const sorted = [...members].sort((a, b) => a.stage - b.stage || a.no - b.no);
        const speciesIds = sorted.map((x) => x.speciesId);
        for (const id of speciesIds) {
          if (speciesSeen.has(id)) throw new Error(`Species ${id} assigned more than once`);
          speciesSeen.add(id);
        }
        const pointer = descriptionPointer(sorted[0].no);
        return {
          familyNo,
          speciesIds,
          stages: sorted.map((x) => x.stage),
          currentDescriptionShard: pointer.shard,
          currentMotifFamilyConceptPointer: `familyNo=${familyNo};fields=motif,familyConcept`,
          existingCurrentCandidates: speciesIds
            .map((id) => ({ speciesId: id, state: stateFor(manifest, id), path: candidatePath.get(id) ?? null }))
            .filter((x) => x.state === 'CANDIDATE' || x.path),
          historicalReferenceAvailability: 'PACK_LEVEL_REVIEW_REQUIRED',
          reviewState: 'PENDING_ATTRIBUTE_REVIEW',
        };
      });

    return {
      type,
      ownerWorkItem: workItem,
      familyNos: families.map((x) => x.familyNo),
      speciesIds: families.flatMap((x) => x.speciesIds),
      families,
    };
  });

  if (familyOwnerSeen.size !== EXPECTED_FAMILY_COUNT) throw new Error('Not all families have exactly one attribute owner');
  if (speciesSeen.size !== EXPECTED_SPECIES_COUNT) throw new Error('Queue does not cover all active species exactly once');
  if (speciesSeen.has('m239')) throw new Error('Queue must reject m239');

  return {
    schemaVersion: 1,
    generatedBy: 'scripts/monster-art/attribute-queue.mjs',
    source: {
      currentDescriptionShards: DESCRIPTION_SHARDS,
      monsterAssetManifest: MANIFEST_PATH,
      sourceCommit,
    },
    activeScope: {
      firstId: 'm001', lastId: 'm238', speciesCount: 238, familyCount: 83, typeCount: 18,
      excludedReferenceIds: ['m239'],
    },
    invariants: {
      eachFamilyExactlyOneOwner: true,
      familyNeverSplitAcrossTypes: true,
      m239Rejected: true,
      formalPromotionPerformedByW302: false,
    },
    historicalReference: {
      availability: 'PACK_LEVEL_REVIEW_REQUIRED',
      index: HISTORICAL_INDEX_PATH,
      manifest: 'design/rebuild/asset-reference/0822/REFERENCE-MANIFEST.json',
      contactSheetIndex: 'design/rebuild/asset-reference/0822/CONTACT-SHEET-INDEX.md',
      policy: 'REFERENCE_ONLY_CURRENT_IDENTITY_WINS',
    },
    attributes,
  };
}

export function buildReviewLedger(descriptions, manifest, queue, { sourceCommit = null } = {}) {
  validateCurrent(descriptions, manifest);
  const candidatePath = expandCandidatePreference(manifest.candidatePreference);
  const attributeOwner = new Map(queue.attributes.flatMap((a) => a.speciesIds.map((id) => [id, a.ownerWorkItem])));
  const rows = [...descriptions]
    .sort((a, b) => a.no - b.no)
    .map((item) => [
      item.speciesId,
      item.familyNo,
      item.stage,
      item.type,
      attributeOwner.get(item.speciesId),
      stateFor(manifest, item.speciesId),
      candidatePath.get(item.speciesId) ?? null,
      null,
      'PENDING',
      null,
      '',
      `${descriptionPointer(item.no).shard}#speciesId=${item.speciesId};fields=motif,familyConcept`,
      'design/rebuild/asset-reference/0822/CONTACT-SHEET-INDEX.md',
    ]);
  if (rows.length !== 238 || new Set(rows.map((x) => x[0])).size !== 238 || rows.some((x) => x[0] === 'm239')) {
    throw new Error('Review ledger scope validation failed');
  }
  return {
    schemaVersion: 1,
    generatedBy: 'scripts/monster-art/attribute-queue.mjs',
    sourceCommit,
    activeScope: { firstId: 'm001', lastId: 'm238', speciesCount: 238, familyCount: 83, typeCount: 18, excludedReferenceIds: ['m239'] },
    columns: ['speciesId','familyNo','stage','type','ownerWorkItem','currentManifestState','candidatePath','checksum','reviewStatus','disposition','notes','currentDescriptionPointer','historicalReferencePointer'],
    checksumAlgorithm: 'sha256',
    checksumPolicy: 'Populated by candidate-ingestion.mjs when a repository WebP candidate is ingested; null means no W-302 ingestion event recorded.',
    formalPromotionPerformedByW302: false,
    rows,
  };
}

export function stableStringify(value) {
  return `${JSON.stringify(value)}\n`;
}

export function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function parseArgs(argv) {
  const args = { root: process.cwd(), check: false, sourceCommit: process.env.GITHUB_SHA ?? null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--root') args.root = path.resolve(argv[++i]);
    else if (argv[i] === '--check') args.check = true;
    else if (argv[i] === '--source-commit') args.sourceCommit = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const { descriptions, manifest } = loadCurrent(args.root);
  const queue = buildAttributeQueue(descriptions, manifest, { sourceCommit: args.sourceCommit });
  const ledger = buildReviewLedger(descriptions, manifest, queue, { sourceCommit: args.sourceCommit });
  const outputs = [
    ['design/rebuild/asset-production/PHASE-4-ATTRIBUTE-QUEUE.json', stableStringify(queue)],
    ['design/rebuild/asset-production/PHASE-4-REVIEW-LEDGER.json', stableStringify(ledger)],
  ];
  for (const [relative, content] of outputs) {
    const target = path.join(args.root, relative);
    if (args.check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) {
        throw new Error(`Generated artifact is stale: ${relative}`);
      }
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
  }
  return { queue, ledger };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const { queue, ledger } = runCli();
    console.log(`PASS attribute queue: ${queue.activeScope.speciesCount} species / ${queue.activeScope.familyCount} families / ${queue.activeScope.typeCount} types`);
    console.log(`PASS review ledger: ${ledger.rows.length} rows / m239 excluded / FORMAL promotion=false`);
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  }
}
