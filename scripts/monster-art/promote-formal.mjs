#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertActiveSpeciesId, assertWebP, sha256 } from './candidate-ingestion.mjs';

export function validateApprovalEvidence(evidence, speciesId) {
  if (!evidence || typeof evidence !== 'object') throw new Error('Approval evidence is required');
  if (evidence.speciesId !== speciesId) throw new Error('Approval evidence speciesId mismatch');
  if (evidence.approved !== true) throw new Error('Approval evidence must contain approved=true');
  if (evidence.approvalType !== 'CURRENT_FORMAL') throw new Error('approvalType must be CURRENT_FORMAL');
  for (const field of ['approvedBy', 'approvedAt', 'source']) {
    if (typeof evidence[field] !== 'string' || !evidence[field].trim()) throw new Error(`Approval evidence missing ${field}`);
  }
  if (Number.isNaN(Date.parse(evidence.approvedAt))) throw new Error('approvedAt must be an ISO-compatible timestamp');
  return evidence;
}

export function planPromotion({ root, speciesId, evidencePath }) {
  assertActiveSpeciesId(speciesId);
  if (!evidencePath) throw new Error('Refusing FORMAL promotion without --approval-evidence');
  const evidence = validateApprovalEvidence(JSON.parse(fs.readFileSync(evidencePath, 'utf8')), speciesId);
  const manifestPath = path.join(root, 'design/current/monster-asset-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const asset = manifest?.assets?.[speciesId];
  if (!asset) throw new Error(`Unknown CURRENT speciesId: ${speciesId}`);
  if (asset.state === 'FORMAL') throw new Error(`${speciesId} is already FORMAL`);
  const candidatePath = path.join(root, 'public/monsters', `${speciesId}.webp`);
  if (!fs.existsSync(candidatePath)) throw new Error(`FORMAL promotion requires candidate WebP at public/monsters/${speciesId}.webp`);
  assertWebP(candidatePath);
  return {
    speciesId,
    manifestPath,
    candidatePath,
    candidateSha256: sha256(candidatePath),
    evidence,
    manifestBefore: manifest,
  };
}

export function executePromotion(plan) {
  const manifest = structuredClone(plan.manifestBefore);
  manifest.assets[plan.speciesId] = {
    ...manifest.assets[plan.speciesId],
    state: 'FORMAL',
    formalAsset: `/monsters/${plan.speciesId}.webp`,
    formalSha256: plan.candidateSha256,
    approvalEvidence: plan.evidence,
  };
  const counts = { FORMAL: 0, CANDIDATE: 0, PLACEHOLDER: 0 };
  for (const row of Object.values(manifest.assets)) {
    if (counts[row.state] == null) throw new Error(`Unknown manifest state: ${row.state}`);
    counts[row.state] += 1;
  }
  manifest.counts = counts;
  fs.writeFileSync(plan.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function parseArgs(argv) {
  const args = { root: process.cwd(), execute: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') args.root = path.resolve(argv[++i]);
    else if (arg === '--species') args.speciesId = argv[++i];
    else if (arg === '--approval-evidence') args.evidencePath = path.resolve(argv[++i]);
    else if (arg === '--execute') args.execute = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.speciesId) throw new Error('Usage: promote-formal.mjs --species mNNN --approval-evidence evidence.json [--execute]');
  return args;
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const plan = planPromotion(args);
  if (!args.execute) return { mode: 'DRY_RUN', plan };
  return { mode: 'EXECUTED', plan, manifest: executePromotion(plan) };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = runCli();
    console.log(`${result.mode} FORMAL promotion ${result.plan.speciesId}; candidate sha256=${result.plan.candidateSha256}`);
    if (result.mode === 'DRY_RUN') console.log('No manifest change. W-302 must not pass --execute.');
  } catch (error) {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  }
}
