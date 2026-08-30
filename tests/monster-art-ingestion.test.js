import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildAttributeQueue,
  buildReviewLedger,
  validateCurrent,
  TYPE_OWNER_ORDER,
  loadCurrent,
  stableStringify,
} from '../scripts/monster-art/attribute-queue.mjs';
import {
  MAX_WEBP_BYTES,
  assertActiveSpeciesId,
  assertWebP,
  executeIngestion,
  planIngestion,
  sha256,
} from '../scripts/monster-art/candidate-ingestion.mjs';
import {
  planPromotion,
  runCli as runPromotionCli,
} from '../scripts/monster-art/promote-formal.mjs';

const FAMILY_TYPES = {
  1:'grass',2:'fire',3:'water',4:'normal',5:'normal',6:'flying',7:'bug',8:'bug',9:'electric',10:'electric',11:'ground',12:'rock',13:'water',14:'grass',15:'poison',16:'fight',17:'fairy',18:'psychic',19:'fire',20:'fire',21:'ground',22:'rock',23:'steel',24:'electric',25:'water',26:'water',27:'poison',28:'grass',29:'grass',30:'fight',31:'fight',32:'flying',33:'psychic',34:'normal',35:'ice',36:'dark',37:'ghost',38:'ghost',39:'fairy',40:'normal',41:'ice',42:'ice',43:'ice',44:'water',45:'water',46:'grass',47:'bug',48:'bug',49:'psychic',50:'ghost',51:'dark',52:'dark',53:'steel',54:'rock',55:'ground',56:'ground',57:'poison',58:'fight',59:'flying',60:'fairy',61:'electric',62:'normal',63:'dragon',64:'dragon',65:'dragon',66:'psychic',67:'steel',68:'steel',69:'ghost',70:'dark',71:'fairy',72:'fire',73:'water',74:'electric',75:'fight',76:'flying',77:'bug',78:'poison',79:'normal',80:'grass',81:'psychic',82:'ground',83:'rock'
};

function currentDescriptions() {
  const ranges = [];
  let no = 1;
  for (let f = 1; f <= 38; f += 1) { ranges.push([f, no, no + 2]); no += 3; }
  for (const f of [39, 40]) { ranges.push([f, no, no + 1]); no += 2; }
  for (let f = 41; f <= 48; f += 1) { ranges.push([f, no, no + 2]); no += 3; }
  ranges.push([49, no, no + 1]); no += 2;
  for (let f = 50; f <= 79; f += 1) { ranges.push([f, no, no + 2]); no += 3; }
  for (let f = 80; f <= 83; f += 1) { ranges.push([f, no, no]); no += 1; }
  assert.equal(no, 239);
  return ranges.flatMap(([familyNo, start, end]) =>
    Array.from({ length: end - start + 1 }, (_, index) => {
      const n = start + index;
      return { no: n, speciesId: `m${String(n).padStart(3, '0')}`, familyNo, stage: index + 1, type: FAMILY_TYPES[familyNo] };
    })
  );
}

function currentManifest() {
  const assets = {};
  for (let i = 1; i <= 238; i += 1) assets[`m${String(i).padStart(3, '0')}`] = { state: i <= 20 ? 'CANDIDATE' : 'PLACEHOLDER' };
  return {
    canonicalScope: { firstId: 'm001', lastId: 'm238', speciesCount: 238, familyCount: 83, excludedReferenceIds: ['m239'] },
    counts: { FORMAL: 0, CANDIDATE: 20, PLACEHOLDER: 218 },
    candidatePreference: [
      { ids: 'm001-m010', candidateAsset: '/monsters/{speciesId}.webp' },
      { ids: 'm011-m020', candidateAsset: '/monsters/{speciesId}.svg' },
    ],
    assets,
  };
}

function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mana-evo-w302-'));
  fs.mkdirSync(path.join(root, 'design/current'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public/monsters'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design/current/monster-asset-manifest.json'), JSON.stringify(currentManifest()));
  return root;
}

function fakeWebP(size = 64, fill = 0x41) {
  const buffer = Buffer.alloc(Math.max(size, 12), fill);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WEBP', 8, 'ascii');
  return buffer;
}

test('attribute queue covers 238 species / 83 families / 18 types exactly once', () => {
  const descriptions = currentDescriptions();
  const manifest = currentManifest();
  const queue = buildAttributeQueue(descriptions, manifest, { sourceCommit: 'test' });
  const ledger = buildReviewLedger(descriptions, manifest, queue, { sourceCommit: 'test' });

  assert.equal(queue.attributes.length, 18);
  assert.equal(TYPE_OWNER_ORDER.length, 18);
  assert.equal(queue.attributes.reduce((n, a) => n + a.familyNos.length, 0), 83);
  assert.equal(queue.attributes.reduce((n, a) => n + a.speciesIds.length, 0), 238);
  assert.equal(new Set(queue.attributes.flatMap((a) => a.familyNos)).size, 83);
  assert.equal(new Set(queue.attributes.flatMap((a) => a.speciesIds)).size, 238);
  assert.equal(ledger.rows.length, 238);
  assert.equal(new Set(ledger.rows.map((x) => x[0])).size, 238);
  assert.equal(ledger.rows.some((x) => x[0] === 'm239'), false);
});

test('m239 and unknown active IDs are rejected', () => {
  assert.throws(() => assertActiveSpeciesId('m239'), /rejected/);
  assert.throws(() => assertActiveSpeciesId('m000'), /rejected/);
  assert.throws(() => assertActiveSpeciesId('m999'), /rejected/);

  const descriptions = currentDescriptions();
  descriptions.pop();
  descriptions.push({ no: 239, speciesId: 'm239', familyNo: 83, stage: 2, type: 'rock' });
  assert.throws(() => validateCurrent(descriptions, currentManifest()), /m239|Inactive\/unknown/);
});

test('mixed-type family fails closed instead of being split across owners', () => {
  const descriptions = currentDescriptions();
  descriptions.find((x) => x.speciesId === 'm002').type = 'water';
  assert.throws(() => buildAttributeQueue(descriptions, currentManifest()), /mixed-type.*BLOCKED/i);
});

test('candidate ingestion accepts only valid WebP strictly below 1 MB', () => {
  const root = makeRoot();
  const valid = path.join(root, 'valid.webp');
  fs.writeFileSync(valid, fakeWebP(128));
  assert.equal(assertWebP(valid), 128);

  const tooLarge = path.join(root, 'large.webp');
  fs.writeFileSync(tooLarge, fakeWebP(MAX_WEBP_BYTES));
  assert.throws(() => assertWebP(tooLarge), /under 1 MB/);

  const bad = path.join(root, 'bad.webp');
  fs.writeFileSync(bad, Buffer.from('not-a-webp'));
  assert.throws(() => assertWebP(bad), /signature/);
});

test('candidate replacement preserves previous checksum/archive and appends old/new provenance', () => {
  const root = makeRoot();
  const oldPath = path.join(root, 'public/monsters/m001.webp');
  const oldBytes = fakeWebP(100, 0x31);
  fs.writeFileSync(oldPath, oldBytes);
  const incoming = path.join(root, 'incoming.webp');
  const newBytes = fakeWebP(120, 0x42);
  fs.writeFileSync(incoming, newBytes);

  const plan = planIngestion({ root, speciesId: 'm001', sourcePath: incoming });
  assert.equal(plan.previous.checksum, sha256(oldBytes));
  assert.equal(plan.newChecksum, sha256(newBytes));
  assert.equal(plan.formalPromotion, false);

  const provenance = executeIngestion(plan, { sourceLabel: 'unit-test', timestamp: '2026-08-25T00:00:00Z' });
  assert.equal(fs.existsSync(plan.previous.archivePath), true);
  assert.equal(sha256(plan.previous.archivePath), sha256(oldBytes));
  assert.equal(sha256(oldPath), sha256(newBytes));
  assert.equal(provenance.events.length, 1);
  assert.equal(provenance.events[0].previous.sha256, sha256(oldBytes));
  assert.equal(provenance.events[0].candidate.sha256, sha256(newBytes));
  assert.equal(provenance.events[0].formalPromotion, false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'design/current/monster-asset-manifest.json'))).counts.FORMAL, 0);
});

test('candidate ingestion rejects m239 before any repository write', () => {
  const root = makeRoot();
  const incoming = path.join(root, 'incoming.webp');
  fs.writeFileSync(incoming, fakeWebP(64));
  assert.throws(() => planIngestion({ root, speciesId: 'm239', sourcePath: incoming }), /rejected/);
  assert.equal(fs.existsSync(path.join(root, 'public/monsters/m239.webp')), false);
});

test('FORMAL promotion refuses missing approval evidence and dry-run leaves manifest unchanged', () => {
  const root = makeRoot();
  const candidate = path.join(root, 'public/monsters/m001.webp');
  fs.writeFileSync(candidate, fakeWebP(64));
  const manifestPath = path.join(root, 'design/current/monster-asset-manifest.json');
  const before = fs.readFileSync(manifestPath, 'utf8');

  assert.throws(() => planPromotion({ root, speciesId: 'm001', evidencePath: null }), /without --approval-evidence/);

  const evidencePath = path.join(root, 'approval.json');
  fs.writeFileSync(evidencePath, JSON.stringify({
    speciesId: 'm001', approved: true, approvalType: 'CURRENT_FORMAL', approvedBy: 'explicit-test-approver',
    approvedAt: '2026-08-25T00:00:00Z', source: 'test-evidence'
  }));
  const result = runPromotionCli(['--root', root, '--species', 'm001', '--approval-evidence', evidencePath]);
  assert.equal(result.mode, 'DRY_RUN');
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), before);
  assert.equal(JSON.parse(before).counts.FORMAL, 0);
});

test('committed queue and ledger are fresh against repository CURRENT shards', () => {
  const root = path.resolve(new URL('..', import.meta.url).pathname);
  const { descriptions, manifest } = loadCurrent(root);
  const sourceCommit = process.env.GITHUB_SHA ?? null;
  const queue = buildAttributeQueue(descriptions, manifest, { sourceCommit });
  const ledger = buildReviewLedger(descriptions, manifest, queue, { sourceCommit });
  const queuePath = path.join(root, 'design/rebuild/asset-production/PHASE-4-ATTRIBUTE-QUEUE.json');
  const ledgerPath = path.join(root, 'design/rebuild/asset-production/PHASE-4-REVIEW-LEDGER.json');
  assert.equal(fs.readFileSync(queuePath, 'utf8'), stableStringify(queue));
  assert.equal(fs.readFileSync(ledgerPath, 'utf8'), stableStringify(ledger));
});
