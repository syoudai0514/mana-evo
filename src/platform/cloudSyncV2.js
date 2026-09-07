import { payloadHash } from './cloudSaveModel.js'

export function buildRecoveryCandidate({ decision, localPayload, localHash, cloud, meta = null, deviceProfileId = null }) {
  if (decision?.action !== 'recover-pull') throw new Error('recovery candidate requires recover-pull decision')
  if (!localPayload || !cloud?.payload) throw new Error('recovery candidate requires both local and cloud payloads')

  return {
    reason: decision.recoveryReason || 'LOCAL_DIVERGENCE',
    baseRevision: meta?.revision == null ? null : Number(meta.revision) || 0,
    baseHash: meta?.hash || null,
    cloudRevision: Number(cloud.revision) || 0,
    cloudHash: decision.cloudHash || payloadHash(cloud.payload),
    localHash: localHash || payloadHash(localPayload),
    localPayload,
    cloudPayload: cloud.payload,
    deviceProfileId: deviceProfileId || null
  }
}

/**
 * D-032 destructive-boundary guard.
 *
 * A divergent LOCAL snapshot must be durably persisted before CLOUD is allowed
 * to replace it. If candidate persistence fails, or LOCAL changes after sync
 * classification while network work is in flight, CLOUD is not applied. The
 * caller retries from the newer LOCAL snapshot on the next serialized pass.
 */
export async function adoptCloudAuthoritatively({
  decision,
  localPayload,
  localHash,
  cloud,
  meta = null,
  deviceProfileId = null,
  persistRecoveryCandidate,
  captureCurrentLocalPayload = null,
  applyCloudPayload,
  commitSyncMeta
}) {
  if (!['pull', 'recover-pull'].includes(decision?.action)) throw new Error('cloud adoption requires pull decision')
  if (!cloud?.payload) throw new Error('cloud payload is required')
  if (typeof applyCloudPayload !== 'function' || typeof commitSyncMeta !== 'function') throw new Error('cloud adoption callbacks are required')

  let recoveryCandidate = null
  if (decision.action === 'recover-pull') {
    if (typeof persistRecoveryCandidate !== 'function') throw new Error('recovery persistence is required')
    recoveryCandidate = buildRecoveryCandidate({ decision, localPayload, localHash, cloud, meta, deviceProfileId })
    const receipt = await persistRecoveryCandidate(recoveryCandidate)
    // The production PostgREST adapter returns either the inserted row or null.
    // A fulfilled request without a returned row is not evidence that the exact
    // recovery snapshot became durable, so do not cross the destructive boundary.
    if (receipt === null) throw new Error('復旧候補を永続化できませんでした')
  }

  // Child activity may continue while cloud/recovery network work is in flight.
  // Capture again immediately before apply. There is intentionally no await
  // between this check and applyCloudPayload, so no UI event can interleave and
  // create an unprotected LOCAL write in that boundary.
  if (typeof captureCurrentLocalPayload === 'function') {
    const latestLocalPayload = captureCurrentLocalPayload()
    if (payloadHash(latestLocalPayload) !== (localHash || payloadHash(localPayload))) {
      return { recoveryCandidate, deferred: true, reason: 'LOCAL_CHANGED_DURING_SYNC' }
    }
  }

  applyCloudPayload(cloud.payload)
  commitSyncMeta(cloud)
  return { recoveryCandidate, deferred: false }
}
