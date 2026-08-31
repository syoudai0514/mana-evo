import React, { useEffect, useRef, useState } from 'react'
import {
  auditDexArtPack,
  deleteDexArtPack,
  dexStorageEstimate,
  downloadDexArtPack,
  formatBytes,
  loadDexArtManifest,
  requestPersistentDexStorage
} from '../platform/dexArtPack.js'

function initialStatus() {
  return { complete: 0, total: 238, downloadedBytes: 0, totalBytes: 0, isComplete: false, missing: [] }
}

export default function DexArtPackControls() {
  const [status, setStatus] = useState(initialStatus)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('保存状態を確認しています…')
  const [estimate, setEstimate] = useState(null)
  const abortRef = useRef(null)

  const refresh = async () => {
    try {
      const manifest = await loadDexArtManifest({ cache: 'no-store', refresh: true })
      const next = await auditDexArtPack(manifest)
      setStatus(next)
      setMessage(next.isComplete ? '✅ 現在の238体を保存済みです' : next.complete ? `不足分があります（${next.complete}/238）` : 'この端末にはまだ一括保存されていません')
      setEstimate(await dexStorageEstimate())
    } catch (error) {
      setMessage(`⚠️ 保存状態を確認できません: ${error.message}`)
    }
  }

  useEffect(() => {
    refresh()
    return () => abortRef.current?.abort()
  }, [])

  const startDownload = async () => {
    if (busy) return
    const expected = status.totalBytes ? `（約 ${formatBytes(status.totalBytes)}）` : ''
    if (!window.confirm(`No.001〜238の正式モンスター画像をこの端末に保存します${expected}。続けますか？`)) return
    setBusy(true)
    setMessage('保存を開始します…')
    await requestPersistentDexStorage()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const result = await downloadDexArtPack({
        signal: controller.signal,
        concurrency: 4,
        onProgress: (progress) => {
          setStatus(progress)
          setMessage(`保存中… ${progress.complete}/${progress.total}`)
        }
      })
      setStatus(result)
      setMessage(result.isComplete && !result.updateAvailable
        ? '✅ 238/238 保存済みです。オフラインでも確認できます。'
        : `更新または不足があります（${result.complete}/${result.total}）`)
    } catch (error) {
      if (error?.name === 'AbortError') setMessage('一時停止しました。保存済みの画像は残っています。')
      else setMessage(`⚠️ 保存を完了できませんでした: ${error.message}`)
      try { setStatus(await auditDexArtPack()) } catch {}
    } finally {
      abortRef.current = null
      setBusy(false)
      setEstimate(await dexStorageEstimate())
    }
  }

  const cancelDownload = () => abortRef.current?.abort()

  const removePack = async () => {
    if (busy) return
    if (!window.confirm('この端末に保存したモンスター画像を削除します。ゲームの進捗やクラウドセーブは消えません。よろしいですか？')) return
    await deleteDexArtPack()
    setStatus(initialStatus())
    setMessage('保存画像を削除しました。必要な画像はオンライン時に再取得できます。')
    setEstimate(await dexStorageEstimate())
  }

  const percent = status.total ? Math.round(status.complete / status.total * 100) : 0
  const approxFree = estimate?.quota != null && estimate?.usage != null ? Math.max(0, estimate.quota - estimate.usage) : null

  return <div className="card dex-art-pack-card" data-testid="dex-art-pack-controls">
    <div className="dex-art-pack-status">
      <div><small>この端末のモンスター画像</small><strong>{status.complete}/{status.total || 238}</strong></div>
      <span>{status.isComplete ? '✅ 保存済み' : status.complete ? '⬇️ 途中' : '☁️ オンライン'}</span>
    </div>
    <div className="dex-art-pack-progress" aria-label={`モンスター画像 ${status.complete}/${status.total || 238} 保存`}><span style={{ width: `${percent}%` }} /></div>
    <p className="dex-art-pack-note">{message}</p>
    <p className="dex-art-pack-note">画像合計: {status.totalBytes ? `約 ${formatBytes(status.totalBytes)}` : '計算中'}{approxFree != null ? ` ／ 端末のWeb保存領域の空き目安: ${formatBytes(approxFree)}` : ''}</p>
    <p className="dex-art-pack-note">iPhoneの容量不足などで保存画像が削除されることがあります。その場合は「不足分を修復」で足りない画像だけ戻します。</p>
    <div className="dex-art-pack-actions">
      {!busy && <button className="btn btn--sun" onClick={startDownload}>{status.complete === 0 ? '⬇️ モンスター画像を全部保存' : status.isComplete ? '🔎 更新を確認' : '🛠️ 不足分を修復'}</button>}
      {busy && <button className="btn btn--ghost" onClick={cancelDownload}>⏸ 保存を中断</button>}
      <button className="btn btn--ghost" disabled={busy} onClick={refresh}>🔄 保存状態を確認</button>
      <button className="btn btn--ghost" disabled={busy || status.complete === 0} onClick={removePack}>🗑️ 保存画像を削除</button>
    </div>
  </div>
}
