import { payloadHash } from './cloudSaveModel.js'

export function localSnapshotStillCurrent(capturedHash, captureLocal) {
  return payloadHash(captureLocal()) === capturedHash
}

export async function waitForRemoteWithLocalGuard({ capturedHash, captureLocal, remoteOperation }) {
  const value = await remoteOperation()
  return {
    value,
    localUnchanged: localSnapshotStillCurrent(capturedHash, captureLocal)
  }
}

export function applyRemotePayloadIfLocalUnchanged({ capturedHash, captureLocal, remotePayload, applyRemote }) {
  if (!localSnapshotStillCurrent(capturedHash, captureLocal)) return false
  applyRemote(remotePayload)
  return true
}

export function sameCloudSnapshot(left, right) {
  if (!left || !right) return left === right
  return Number(left.revision) === Number(right.revision)
    && payloadHash(left.payload) === payloadHash(right.payload)
}
