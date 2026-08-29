import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  cloudConfig,
  consumeAuthHash,
  createBackup,
  fetchMainSave,
  getValidSession,
  insertMainSave,
  listBackups,
  requestPasswordReset,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updateMainSave,
  updatePassword
} from './sharedSupabaseRest.js'
import {
  beginTestMode,
  captureCloudPayload,
  endTestMode,
  getLocalProfiles,
  getTestMode,
  applyCloudPayload,
  switchDeviceProfile
} from './cloudSnapshot.js'
import { decideSync, payloadHash, payloadPartHashes, syncMetaKey } from './cloudSaveModel.js'
import AdultCloudControls from './AdultCloudControls.jsx'

const LOCAL_SAVE_EVENT = 'manaevo:local-save-changed'
const LOCAL_SAVE_AT_KEY = 'manaevo:last-local-save-at:v1'
const DAILY_BACKUP_KEY = 'manaevo:cloud-daily-backup:v1'
export const CLOUD_SYNC_DEBOUNCE_MS = 800
export const CLOUD_SYNC_MAX_DIRTY_MS = 4000

function readJson(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null } catch { return null }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}
function todayKey() { return new Date().toISOString().slice(0, 10) }

function sessionLabel(session) {
  return session?.user?.email || session?.user?.phone || 'ログイン済み'
}

function formatSaveTime(value) {
  if (!value) return '不明'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '不明' : date.toLocaleString('ja-JP')
}

function profileIdsForConflict(conflict) {
  const explicit = (conflict?.conflicts || []).filter((id) => id && id !== '__global__')
  if (explicit.length) return explicit
  const ids = new Set([
    ...Object.keys(conflict?.localPayload?.learning?.profiles || {}),
    ...Object.keys(conflict?.cloud?.payload?.learning?.profiles || {})
  ])
  return [...ids].sort()
}

function profileProgressSummary(payload, profileId) {
  const learning = payload?.learning?.profiles?.[profileId]
  const game = payload?.gameEnvelope?.gameByProfile?.[profileId] || {}
  const caught = Object.keys(game?.dex?.caught || {}).filter((id) => game.dex.caught[id]).length
  return {
    name: learning?.name || profileId,
    battlesWon: Math.max(0, Number(game?.battlesWon) || 0),
    monstersCaught: Math.max(0, Number(game?.monstersCaught) || 0),
    boxCount: Object.keys(game?.box || {}).length,
    dexCaught: caught,
    stagesCleared: Array.isArray(game?.stagesCleared) ? game.stagesCleared.length : 0,
    hasLearning: !!learning?.state
  }
}

function ProgressSummary({ title, payload, profileId }) {
  const summary = profileProgressSummary(payload, profileId)
  return <div className="cloud-card">
    <strong>{title}：{summary.name}</strong>
    <p>バトル勝利 {summary.battlesWon} / 捕獲 {summary.monstersCaught} / 所持 {summary.boxCount}体 / 図鑑捕獲 {summary.dexCaught}種 / クリア {summary.stagesCleared}</p>
    <small>{summary.hasLearning ? '学習データにも差があります。詳細な学習履歴は日時だけで自動判定しません。' : '学習データなし'}</small>
  </div>
}

export default function CloudAccountShell({ children }) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('端末に保存中')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [conflict, setConflict] = useState(null)
  const [backups, setBackups] = useState([])
  const [busy, setBusy] = useState(false)
  const [parentScreenOpen, setParentScreenOpen] = useState(false)
  const syncTimer = useRef(null)
  const syncMaxTimer = useRef(null)
  const syncInFlight = useRef(null)
  const syncRerunRequested = useRef(false)
  const testMode = getTestMode()
  const config = cloudConfig()
  const profileInfo = useMemo(() => getLocalProfiles(), [open, status, testMode?.kind])

  const setMeta = useCallback((userId, row) => {
    const hash = payloadHash(row.payload)
    writeJson(syncMetaKey(userId), {
      revision: Number(row.revision) || 0,
      hash,
      parts: payloadPartHashes(row.payload),
      syncedAt: Date.now()
    })
    return hash
  }, [])

  const maybeBackupCloud = useCallback(async (cloud, reason = 'auto-daily') => {
    if (!cloud?.payload) return
    const marker = readJson(DAILY_BACKUP_KEY)
    if (reason === 'auto-daily' && marker?.day === todayKey() && marker?.revision === cloud.revision) return
    await createBackup(cloud.payload, cloud.revision, reason)
    if (reason === 'auto-daily') writeJson(DAILY_BACKUP_KEY, { day: todayKey(), revision: cloud.revision })
  }, [])

  const refreshBackups = useCallback(async () => {
    if (!session) return
    try { setBackups(await listBackups(20)) } catch {}
  }, [session])

  const syncNow = useCallback(async ({ quiet = false } = {}) => {
    if (testMode) {
      setStatus('TEST中・クラウド同期停止')
      return
    }
    const valid = await getValidSession()
    if (!valid) {
      setSession(null)
      setStatus(config.configured ? '未ログイン・端末保存' : 'クラウド未設定・端末保存')
      return
    }
    setSession(valid)
    if (!quiet) setStatus('同期中…')
    const localPayload = captureCloudPayload()
    const localHash = payloadHash(localPayload)
    const cloud = await fetchMainSave()
    const meta = readJson(syncMetaKey(valid.user.id))
    const decision = decideSync({ localHash, localPayload, meta, cloud })

    if (decision.action === 'push-new') {
      const row = await insertMainSave(localPayload)
      setMeta(valid.user.id, row)
      setConflict(null)
      setStatus('クラウド同期済み')
      return
    }
    if (decision.action === 'adopt' || decision.action === 'noop') {
      setMeta(valid.user.id, cloud)
      setConflict(null)
      setStatus('クラウド同期済み')
      return
    }
    if (decision.action === 'push') {
      await maybeBackupCloud(cloud)
      const row = await updateMainSave(localPayload, cloud.revision)
      if (!row) throw new Error('別の端末で更新されました。もう一度同期してください')
      setMeta(valid.user.id, row)
      setConflict(null)
      setStatus('クラウド同期済み')
      return
    }
    if (decision.action === 'merge') {
      await maybeBackupCloud(cloud)
      const row = await updateMainSave(decision.payload, cloud.revision)
      if (!row) throw new Error('統合中に別の端末で更新されました。もう一度同期してください')
      setMeta(valid.user.id, row)
      setConflict(null)
      setStatus('別プレイヤーの変更を安全に統合')
      applyCloudPayload(row.payload)
      window.location.reload()
      return
    }
    if (decision.action === 'pull') {
      setMeta(valid.user.id, cloud)
      setConflict(null)
      setStatus('別端末の最新データを取得')
      applyCloudPayload(cloud.payload)
      window.location.reload()
      return
    }
    setConflict({
      cloud,
      localPayload,
      conflicts: decision.conflicts || [],
      localSavedAt: readJson(LOCAL_SAVE_AT_KEY)?.at || null
    })
    setStatus('同期保留・端末には保存済み')
  }, [config.configured, maybeBackupCloud, setMeta, testMode])

  const clearSyncTimers = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current)
    if (syncMaxTimer.current) clearTimeout(syncMaxTimer.current)
    syncTimer.current = null
    syncMaxTimer.current = null
  }, [])

  const flushSync = useCallback(async ({ quiet = true } = {}) => {
    clearSyncTimers()
    if (syncInFlight.current) {
      syncRerunRequested.current = true
      return syncInFlight.current
    }

    const runSerialized = async () => {
      let nextQuiet = quiet
      do {
        syncRerunRequested.current = false
        await syncNow({ quiet: nextQuiet })
        nextQuiet = true
      } while (syncRerunRequested.current)
    }

    const pending = runSerialized()
      .catch((error) => {
        setStatus('同期待ち・端末には保存済み')
        throw error
      })
      .finally(() => {
        syncInFlight.current = null
      })
    syncInFlight.current = pending
    return pending
  }, [clearSyncTimers, syncNow])

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      flushSync({ quiet: true }).catch(() => {})
    }, CLOUD_SYNC_DEBOUNCE_MS)
    if (!syncMaxTimer.current) {
      syncMaxTimer.current = setTimeout(() => {
        flushSync({ quiet: true }).catch(() => {})
      }, CLOUD_SYNC_MAX_DIRTY_MS)
    }
    setStatus((current) => current.includes('保留') ? current : 'クラウド同期待ち・端末には保存済み')
  }, [flushSync])

  useEffect(() => {
    const auth = consumeAuthHash()
    if (auth?.type === 'recovery') { setRecoveryMode(true); setOpen(true) }
    getValidSession().then((value) => {
      setSession(value)
      if (value) flushSync({ quiet: false }).catch((error) => { setStatus('同期エラー・端末には保存済み'); setMessage(error.message) })
      else setStatus(config.configured ? '未ログイン・端末保存' : 'クラウド未設定・端末保存')
    })
  }, [])

  useEffect(() => {
    const root = document.getElementById('root') || document.body
    const updateParentScreen = () => setParentScreenOpen(!!document.querySelector('.parent-screen'))
    updateParentScreen()
    const observer = new MutationObserver(updateParentScreen)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onSave = () => {
      writeJson(LOCAL_SAVE_AT_KEY, { at: new Date().toISOString() })
      scheduleSync()
    }
    const flushQuietly = () => flushSync({ quiet: true }).catch(() => {})
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') flushQuietly() }
    window.addEventListener(LOCAL_SAVE_EVENT, onSave)
    window.addEventListener('online', flushQuietly)
    window.addEventListener('focus', flushQuietly)
    window.addEventListener('pagehide', flushQuietly)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener(LOCAL_SAVE_EVENT, onSave)
      window.removeEventListener('online', flushQuietly)
      window.removeEventListener('focus', flushQuietly)
      window.removeEventListener('pagehide', flushQuietly)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearSyncTimers()
    }
  }, [clearSyncTimers, flushSync, scheduleSync])

  useEffect(() => { if (open && session) refreshBackups() }, [open, session, refreshBackups])

  const run = async (fn) => {
    setBusy(true); setMessage('')
    try { await fn() } catch (error) { setMessage(error?.message || 'エラーが発生しました') }
    finally { setBusy(false) }
  }

  const doSignIn = () => run(async () => {
    const value = await signInWithPassword(email.trim(), password)
    setSession(value); setPassword(''); setMessage('ログインしました')
    await flushSync({ quiet: false })
  })
  const doSignUp = () => run(async () => {
    const redirect = `${window.location.origin}${window.location.pathname}`
    const value = await signUpWithPassword(email.trim(), password, redirect)
    if (value?.access_token) {
      setSession(await getValidSession()); setMessage('アカウントを作成しました'); await flushSync({ quiet: false })
    } else setMessage('確認メールを送りました。メールのリンクを開いて登録を完了してください。')
  })
  const doReset = () => run(async () => {
    const redirect = `${window.location.origin}${window.location.pathname}`
    await requestPasswordReset(email.trim(), redirect)
    setMessage('パスワード再設定メールを送りました')
  })
  const doUpdatePassword = () => run(async () => {
    await updatePassword(newPassword); setNewPassword(''); setRecoveryMode(false); setMessage('パスワードを変更しました')
  })
  const doSignOut = () => run(async () => {
    await signOut(); setSession(null); setStatus('未ログイン・端末保存'); setMessage('ログアウトしました')
  })

  const chooseCloud = () => run(async () => {
    const valid = await getValidSession(); if (!valid || !conflict?.cloud) return
    await maybeBackupCloud(conflict.cloud, 'before-conflict-pull')
    setMeta(valid.user.id, conflict.cloud)
    applyCloudPayload(conflict.cloud.payload)
    setConflict(null); window.location.reload()
  })
  const chooseLocal = () => run(async () => {
    const valid = await getValidSession(); if (!valid || !conflict?.cloud) return
    await maybeBackupCloud(conflict.cloud, 'before-conflict-overwrite')
    const row = await updateMainSave(conflict.localPayload, conflict.cloud.revision)
    if (!row) throw new Error('別端末でさらに更新されました')
    setMeta(valid.user.id, row); setConflict(null); setStatus('この端末のデータを同期しました')
  })

  const manualBackup = () => run(async () => {
    const cloud = await fetchMainSave()
    const payload = captureCloudPayload()
    await createBackup(payload, cloud?.revision || 0, 'manual')
    setMessage('バックアップを作成しました')
    await refreshBackups()
  })

  const restoreBackup = (backup) => run(async () => {
    if (!window.confirm('このバックアップへ戻しますか？ 現在のデータも復元前バックアップとして残します。')) return
    const valid = await getValidSession(); const cloud = await fetchMainSave()
    if (!valid || !cloud) throw new Error('クラウドセーブが見つかりません')
    await createBackup(cloud.payload, cloud.revision, 'before-restore')
    const row = await updateMainSave(backup.payload, cloud.revision)
    if (!row) throw new Error('別端末で更新されました。もう一度やり直してください')
    setMeta(valid.user.id, row)
    applyCloudPayload(backup.payload)
    window.location.reload()
  })

  const switchProfile = (profileId) => run(async () => {
    if (profileId === profileInfo.activeProfileId) return
    await flushSync({ quiet: true })
    switchDeviceProfile(profileId)
    window.location.reload()
  })
  const startTest = (kind) => {
    if (!window.confirm('実データを退避してテストモードへ入ります。テスト中はクラウド同期されません。')) return
    beginTestMode(kind); window.location.reload()
  }
  const stopTest = () => {
    endTestMode(); window.location.reload()
  }

  const needsCloudAttention = !!conflict || status.includes('エラー') || status.includes('選んで') || status.includes('保留')
  const childCloudAttention = !!session && !parentScreenOpen && (!!conflict || status.includes('同期エラー'))
  const showAccountFab = !session || recoveryMode || parentScreenOpen || childCloudAttention
  const accountFabWarn = (parentScreenOpen || childCloudAttention) && needsCloudAttention
  const conflictProfileIds = profileIdsForConflict(conflict)

  return <>
    {children}
    {testMode && <div className="cloud-test-banner"><strong>🧪 TEST：{testMode.label}</strong><button onClick={() => setOpen(true)}>テスト管理</button></div>}
    {showAccountFab && <button className={`cloud-account-fab${accountFabWarn ? ' warn' : ''}`} aria-label="アカウントとクラウド保存" onClick={() => setOpen(true)}>
      <span>{accountFabWarn ? '⚠️' : testMode ? '🧪' : session ? '☁️' : '👤'}</span><small>{accountFabWarn ? '保存確認' : parentScreenOpen ? 'クラウド' : profileInfo.profiles?.[profileInfo.activeProfileId]?.name || 'ログイン'}</small>
    </button>}

    {open && <div className="cloud-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <section className="cloud-modal" role="dialog" aria-modal="true" aria-label="アカウントとクラウド保存">
        <header><div><p className="eyebrow">ACCOUNT / CLOUD SAVE</p><h2>アカウントと保存</h2></div><button className="cloud-close" onClick={() => setOpen(false)}>×</button></header>
        <div className={`cloud-status ${needsCloudAttention ? 'warn' : ''}`}><strong>{status}</strong><small>{config.configured ? '学習・モンスター・Lv・XP・BOX・冒険をまとめて保存' : '共通Supabaseを接続すると端末間同期できます'}</small></div>

        {!config.configured && <div className="cloud-card"><strong>🔧 共通バックエンド設定待ち</strong><p>アプリ側の実装は有効です。共通SupabaseのURLとpublishable keyを設定するとクラウド機能が開始します。</p></div>}

        {recoveryMode && <div className="cloud-card"><h3>🔑 新しいパスワード</h3><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="新しいパスワード"/><button disabled={busy || newPassword.length < 8} onClick={doUpdatePassword}>パスワードを変更</button></div>}

        {!session ? <div className="cloud-card"><h3>☁️ 保護者アカウント</h3><label>メールアドレス<input type="email" autoCapitalize="none" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}/></label><label>パスワード<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}/></label><div className="cloud-actions"><button disabled={busy || !config.configured || !email || !password} onClick={doSignIn}>ログイン</button><button className="secondary" disabled={busy || !config.configured || !email || password.length < 8} onClick={doSignUp}>新規登録</button></div><button className="cloud-link" disabled={busy || !config.configured || !email} onClick={doReset}>パスワードを忘れた</button><small>一度ログインした端末はセッションを保持します。</small></div> : <div className="cloud-card"><div className="cloud-row"><div><h3>👤 {sessionLabel(session)}</h3><small>共通アカウント</small></div><span>☁️</span></div>{conflict ? <p><strong>同期は保護者確認待ちです。</strong><br/><small>端末のデータは保存されています。下の「保護者専用」で比較して残すデータを選んでください。</small></p> : <button disabled={busy || !!testMode} onClick={() => run(() => flushSync({ quiet: false }))}>☁️ 今すぐ同期</button>}</div>}

        <AdultCloudControls>
          {session && conflict && <div className="cloud-card cloud-conflict"><h3>⚠️ iPhone/iPadの同じプレイヤーに両方の変更があります</h3><p>更新日時だけで自動的に新しい方を採用しません。下の時刻・revision・進捗差を判断材料にしてください。どちらを選んでも現在のクラウドは事前バックアップします。</p><div className="cloud-card"><strong>📱 この端末</strong><p>最終ローカル保存目安: {formatSaveTime(conflict.localSavedAt)}</p><small>この時刻は端末内保存イベントの目安です。</small></div><div className="cloud-card"><strong>☁️ クラウド</strong><p>最終更新: {formatSaveTime(conflict.cloud?.updated_at)} / revision {Number(conflict.cloud?.revision) || 0}</p><small>クラウドDBが最後に更新された時刻です。</small></div>{conflictProfileIds.map((profileId) => <div key={profileId}><ProgressSummary title="📱 端末" payload={conflict.localPayload} profileId={profileId}/><ProgressSummary title="☁️ クラウド" payload={conflict.cloud?.payload} profileId={profileId}/></div>)}<p><small>※ 時刻が新しいだけで正しいとは限りません。たとえば別端末でバトル、こちらで学習を進めた場合などがあるため、進捗内容も確認してください。</small></p><button disabled={busy} onClick={chooseCloud}>☁️ クラウド側を使う</button><button className="secondary" disabled={busy} onClick={chooseLocal}>📱 この端末側を使う</button></div>}

          <div className="cloud-card"><h3>👨‍👩‍👧 プレイヤー</h3><p>この端末で開く人だけを切り替えます。他の端末の選択は変わりません。</p><div className="cloud-profile-list">{Object.entries(profileInfo.profiles || {}).map(([id, profile]) => <button key={id} className={id === profileInfo.activeProfileId ? 'active' : ''} disabled={busy} onClick={() => switchProfile(id)}>{id === profileInfo.activeProfileId ? '✓ ' : ''}{profile.name || id}</button>)}</div><small>パパ・まさき・ウタノなどのプロフィール追加は保護者メニューからできます。</small></div>

          <div className="cloud-card"><h3>🧪 テストデータ</h3>{testMode ? <><p><b>{testMode.label}</b> で確認中。実データとクラウドは変更されません。</p><button onClick={stopTest}>テストを終了して実データへ戻る</button></> : <div className="test-fixture-grid"><button onClick={() => startTest('all')}>全開放・全キャラ</button><button onClick={() => startTest('stage1')}>第1形態・進化直前</button><button onClick={() => startTest('stage2')}>第2形態・最終進化直前</button></div>}<small>進化fixtureはレベル進化/持ち物進化を次の1XP直前、石進化は必要アイテム所持にします。</small></div>

          {session && <div className="cloud-card"><div className="cloud-row"><h3>📦 バックアップ</h3><button className="secondary" disabled={busy || !!testMode} onClick={manualBackup}>今の状態を保存</button></div><p>日次の同期前・競合解決前・復元前にも自動で世代を残します。</p><div className="cloud-backups">{backups.length ? backups.map((backup) => <div key={backup.id}><span><strong>{new Date(backup.created_at).toLocaleString('ja-JP')}</strong><small>rev.{backup.revision} / {backup.reason}</small></span><button className="secondary" disabled={busy || !!testMode} onClick={() => restoreBackup(backup)}>復元</button></div>) : <small>バックアップはまだありません。</small>}</div><button className="secondary" disabled={busy} onClick={doSignOut}>この端末からログアウト</button></div>}
        </AdultCloudControls>

        {message && <div className="cloud-message">{message}</div>}
      </section>
    </div>}
  </>
}