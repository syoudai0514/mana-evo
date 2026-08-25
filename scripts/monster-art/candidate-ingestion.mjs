#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const MAX_WEBP_BYTES = 1_000_000;

export function assertActiveSpeciesId(id) {
  if (!/^m\d{3}$/.test(id ?? '')) throw new Error(`Invalid speciesId: ${id}`);
  const no = Number(id.slice(1));
  if (no < 1 || no > 238 || id === 'm239') throw new Error(`Inactive/unknown speciesId rejected: ${id}`);
  return no;
}

export function sha256(bufferOrPath) {
  const buffer = Buffer.isBuffer(bufferOrPath) ? bufferOrPath : fs.readFileSync(bufferOrPath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function assertWebP(filePath) {
  if (path.extname(filePath).toLowerCase() !== '.webp') throw new Error('Candidate ingestion accepts WebP only');
  const stat = fs.statSync(filePath);
  if (stat.size >= MAX_WEBP_BYTES) throw new Error(`WebP must be under 1 MB (${MAX_WEBP_BYTES} bytes); got ${stat.size}`);
  const head = fs.readFileSync(filePath).subarray(0, 12);
  if (head.length < 12 || head.toString('ascii', 0, 4) !== 'RIFF' || head.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('File extension is .webp but RIFF/WEBP signature is invalid');
  }
  return stat.size;
}

function manifestCandidatePath(manifest, id) {
  for (const row of manifest?.candidatePreference ?? []) {
    const match = /^m(\d{3})-m(\d{3})$/.exec(row.ids ?? '');
    if (!match) continue;
    const no = Number(id.slice(1));
    if (no >= Number(match[1]) && no <= Number(match[2])) return String(row.candidateAsset).replace('{speciesId}', id);
  }
  return null;
}

function resolveRepoAsset(root, publicPath) {
  if (!publicPath) return null;
  const relative = publicPath.startsWith('/') ? `public${publicPath}` : publicPath;
  return path.join(root, relative);
}

export function planIngestion({ root, speciesId, sourcePath }) {
  assertActiveSpeciesId(speciesId);
  const sourceBytes = assertWebP(sourcePath);
  const manifestPath = path.join(root, 'design/current/monster-asset-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest?.assets?.[speciesId] == null) throw new Error(`Species ${speciesId} is not present in CURRENT manifest`);
  if (manifest.assets[speciesId].state === 'FORMAL') throw new Error(`Refusing to replace FORMAL asset ${speciesId} through candidate ingestion`);

  const destination = path.join(root, 'public/monsters', `${speciesId}.webp`);
  const currentCandidatePublicPath = manifestCandidatePath(manifest, speciesId);
  const currentCandidatePath = resolveRepoAsset(root, currentCandidatePublicPath);
  const currentCandidateExists = currentCandidatePath && fs.existsSync(currentCandidatePath);
  const destinationExists = fs.existsSync(destination);
  const oldPath = currentCandidateExists ? currentCandidatePath : destinationExists ? destination : null;
  const oldChecksum = oldPath ? sha256(oldPath) : null;
  const newChecksum = sha256(sourcePath);
  const oldExt = oldPath ? path.extname(oldPath).toLowerCase() : null;
  const historyPath = oldPath
    ? path.join(root, 'design/rebuild/asset-production/candidate-history', speciesId, `${oldChecksum}${oldExt}`)
    : null;
  const provenancePath = path.join(root, 'design/rebuild/asset-production/candidate-provenance', `${speciesId}.json`);

  return {
    root,
    speciesId,
    sourcePath: path.resolve(sourcePath),
    sourceBytes,
    destination,
    newChecksum,
    previous: oldPath ? { path: oldPath, checksum: oldChecksum, archivePath: historyPath } : null,
    provenancePath,
    manifestState: manifest.assets[speciesId].state,
    formalPromotion: false,
  };
}

function readProvenance(filePath, speciesId) {
  if (!fs.existsSync(filePath)) return { schemaVersion: 1, speciesId, events: [] };
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (value.speciesId !== speciesId || !Array.isArray(value.events)) throw new Error(`Malformed provenance file for ${speciesId}`);
  return value;
}

export function executeIngestion(plan, { sourceLabel = null, timestamp = new Date().toISOString() } = {}) {
  if (plan.previous?.archivePath) {
    fs.mkdirSync(path.dirname(plan.previous.archivePath), { recursive: true });
    if (!fs.existsSync(plan.previous.archivePath)) fs.copyFileSync(plan.previous.path, plan.previous.archivePath);
  }
  fs.mkdirSync(path.dirname(plan.destination), { recursive: true });
  fs.copyFileSync(plan.sourcePath, plan.destination);

  const provenance = readProvenance(plan.provenancePath, plan.speciesId);
  provenance.events.push({
    timestamp,
    sourceLabel,
    previous: plan.previous ? {
      repositoryPath: path.relative(plan.root, plan.previous.path).replaceAll('\\', '/'),
      sha256: plan.previous.checksum,
      archivePath: path.relative(plan.root, plan.previous.archivePath).replaceAll('\\', '/'),
    } : null,
    candidate: {
      repositoryPath: `public/monsters/${plan.speciesId}.webp`,
      sha256: plan.newChecksum,
      bytes: plan.sourceBytes,
    },
    manifestStateBefore: plan.manifestState,
    formalPromotion: false,
  });
  fs.mkdirSync(path.dirname(plan.provenancePath), { recursive: true });
  fs.writeFileSync(plan.provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
  return provenance;
}

function parseArgs(argv) {
  const args = { root: process.cwd(), execute: false, sourceLabel: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') args.root = path.resolve(argv[++i]);
    else if (arg === '--species') args.speciesId = argv[++i];
    else if (arg === '--source') args.sourcePath = path.resolve(argv[++i]);
    else if (arg === '--source-label') args.sourceLabel = argv[++i];
    else if (arg === '--execute') args.execute = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.speciesId || !args.sourcePath) throw new Error('Usage: candidate-ingestion.mjs --species mNNN --source file.webp [--execute]');
  return args;
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const plan = planIngestion(args);
  if (!args.execute) return { mode: 'DRY_RUN', plan };
  const provenance = executeIngestion(plan, { sourceLabel: args.sourceLabel });
  return { mode: 'EXECUTED', plan, provenance };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = runCli();
    console.log(`${result.mode} ${result.plan.speciesId} -> public/monsters/${result.plan.speciesId}.webp sha256=${result.plan.newChecksum}`);
    if (result.mode === 'DRY_RUN') console.log('No repository files changed. Pass --execute only after candidate review is intended.');
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  }
}
