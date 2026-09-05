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
const DAILY_BACKUP_KEY = 'manaevo:cloud-daily-backup:v1'

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

function cloudUpdatedLabel(cloud) {
  if (!cloud?.updated_at) return '更新時刻なし'
  try { return new Date(cloud.updated_at).toLocaleString('ja-JP') } catch { return '更新時刻なし' }
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
  const resolvingConflict = useRef(false)
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
    if (resolvingConflict.current) return
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
    setConflict({ cloud, localPayload })
    setStatus('保存データを選んでください')
    setOpen(true)
  }, [config.configured, maybeBackupCloud, setMeta, testMode])

  const scheduleSync = useCallback(() => {
    if (resolvingConflict.current) return
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => syncNow({ quiet: true }).catch(() => setStatus('同期待ち・端末には保存済み')), 1400)
  }, [syncNow])

  useEffect(() => {
    const auth = consumeAuthHash()
    if (auth?.type === 'recovery') { setRecoveryMode(true); setOpen(true) }
    getValidSession().then((value) => {
      setSession(value)
      if (value) syncNow().catch((error) => { setStatus('同期エラー・端末には保存済み'); setMessage(error.message) })
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
    const onSave = () => scheduleSync()
    const onOnline = () => syncNow({ quiet: true }).catch(() => {})
    window.addEventListener(LOCAL_SAVE_EVENT, onSave)
    window.addEventListener('online', onOnline)
    window.addEventListener('focus', onOnline)
    return () => {
      window.removeEventListener(LOCAL_SAVE_EVENT, onSave)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('focus', onOnline)
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
  }, [scheduleSync, syncNow])

  useEffect(() => { if (open && session) refreshBackups() }, [open, session, refreshBackups])

  const run = async (fn) => {
    setBusy(true); setMessage('')
    try { await fn() } catch (error) { setMessage(error?.message || 'エラーが発生しました') }
    finally { setBusy(false) }
  }

  const doSignIn = () => run(async () => {
    const value = await signInWithPassword(email.trim(), password)
    setSession(value); setPassword(''); setMessage('ログインしました')
    await syncNow()
  })
  const doSignUp = () => run(async () => {
    const redirect = `${window.location.origin}${window.location.pathname}`
    const value = await signUpWithPassword(email.trim(), password, redirect)
    if (value?.access_token) {
      setSession(await getValidSession()); setMessage('アカウントを作成しました'); await syncNow()
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
    const valid = await getValidSession()
    const chosenCloud = conflict?.cloud
    if (!valid || !chosenCloud) return
    resolvingConflict.current = true
    if (syncTimer.current) clearTimeout(syncTimer.current)
    try {
      await maybeBackupCloud(chosenCloud, 'before-conflict-pull')
      applyCloudPayload(chosenCloud.payload)

      // Import normalization must not leave local state immediately divergent from the chosen cloud.
      const settledLocalPayload = captureCloudPayload()
      let settledRow = chosenCloud
      if (payloadHash(settledLocalPayload) !== payloadHash(chosenCloud.payload)) {
        settledRow = await updateMainSave(settledLocalPayload, chosenCloud.revision)
        if (!settledRow) throw new Error('別端末でさらに更新されました。もう一度選んでください')
      }
      setMeta(valid.user.id, settledRow)
      setConflict(null)
      setStatus('クラウドのデータにそろえました')
      setOpen(false)
      window.location.reload()
    } finally {
      resolvingConflict.current = false
    }
  })

  const chooseLocal = () => run(async () => {
    const valid = await getValidSession()
    const chosenConflict = conflict
    if (!valid || !chosenConflict?.cloud) return
    resolvingConflict.current = true
    if (syncTimer.current) clearTimeout(syncTimer.current)
    try {
      await maybeBackupCloud(chosenConflict.cloud, 'before-conflict-overwrite')
      const row = await updateMainSave(chosenConflict.localPayload, chosenConflict.cloud.revision)
      if (!row) throw new Error('別端末でさらに更新されました。もう一度選んでください')
      setMeta(valid.user.id, row)
      setConflict(null)
      setStatus('この端末のデータをクラウドに保存しました')
      setOpen(false)
    } finally {
      resolvingConflict.current = false
    }
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

  const switchProfile = (profileId) => {
    if (profileId === profileInfo.activeProfileId) return
    switchDeviceProfile(profileId)
    window.location.reload()
  }
  const startTest = (kind) => {
    if (!window.confirm('実データを退避してテストモードへ入ります。テスト中はクラウド同期されません。')) return
    beginTestMode(kind); window.location.reload()
  }
  const stopTest = () => {
    endTestMode(); window.location.reload()
  }

  const needsCloudAttention = !!conflict || status.includes('エラー') || status.includes('選んで')
  const showAccountFab = !session || recoveryMode || parentScreenOpen || needsCloudAttention

  return <>
    {children}
    {testMode && <div className="cloud-test-banner"><strong>🧪 TEST：{testMode.label}</strong><button onClick={() => setOpen(true)}>テスト管理</button></div>}
    {showAccountFab && <button className={`cloud-account-fab${needsCloudAttention ? ' warn' : ''}`} aria-label="アカウントとクラウド保存" onClick={() => setOpen(true)}>
      <span>{needsCloudAttention ? '⚠️' : testMode ? '🧪' : session ? '☁️' : '👤'}</span><small>{needsCloudAttention ? '保存確認' : parentScreenOpen ? 'クラウド' : profileInfo.profiles?.[profileInfo.activeProfileId]?.name || 'ログイン'}</small>
    </button>}

    {open && <div className="cloud-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <section className="cloud-modal" role="dialog" aria-modal="true" aria-label="アカウントとクラウド保存">
        <header><div><p className="eyebrow">ACCOUNT / CLOUD SAVE</p><h2>アカウントと保存</h2></div><button className="cloud-close" onClick={() => setOpen(false)}>×</button></header>
        <div className={`cloud-status ${status.includes('エラー') || status.includes('選んで') ? 'warn' : ''}`}><strong>{status}</strong><small>{config.configured ? '学習・モンスター・Lv・XP・BOX・冒険をまとめて保存' : '共通Supabaseを接続すると端末間同期できます'}</small></div>

        {!config.configured && <div className="cloud-card"><strong>🔧 共通バックエンド設定待ち</strong><p>アプリ側の実装は有効です。共通SupabaseのURLとpublishable keyを設定するとクラウド機能が開始します。</p></div>}

        <AdultCloudControls alreadyVerified={parentScreenOpen}>
          {recoveryMode && <div className="cloud-card"><h3>🔑 新しいパスワード</h3><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="新しいパスワード"/><button disabled={busy || newPassword.length < 8} onClick={doUpdatePassword}>パスワードを変更</button></div>}

          {!session ? <div className="cloud-card"><h3>☁️ 保護者アカウント</h3><label>メールアドレス<input type="email" autoCapitalize="none" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}/></label><label>パスワード<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}/></label><div className="cloud-actions"><button disabled={busy || !config.configured || !email || !password} onClick={doSignIn}>ログイン</button><button className="secondary" disabled={busy || !config.configured || !email || password.length < 8} onClick={doSignUp}>新規登録</button></div><button className="cloud-link" disabled={busy || !config.configured || !email} onClick={doReset}>パスワードを忘れた</button><small>一度ログインした端末はセッションを保持します。</small></div> : <div className="cloud-card"><div className="cloud-row"><div><h3>👤 {sessionLabel(session)}</h3><small>共通アカウント</small></div><span>☁️</span></div><button disabled={busy || !!testMode || !!conflict} onClick={() => run(() => syncNow())}>☁️ 今すぐ同期</button></div>}

          {session && conflict && <div className="cloud-card cloud-conflict">
            <h3>⚠️ 保存データが2つあります</h3>
            <p>同じプレイヤーがiPhone/iPadの両方で変わりました。<strong>残したい方を1つ選ぶと、この保存確認は終わります。</strong> 選ぶ前のクラウドデータは自動でバックアップします。</p>
            <div className="cloud-conflict-option">
              <span><strong>☁️ クラウドの保存データ</strong><small>更新：{cloudUpdatedLabel(conflict.cloud)}</small></span>
              <button disabled={busy} onClick={chooseCloud}>クラウドのデータにそろえる</button>
            </div>
            <div className="cloud-conflict-option local">
              <span><strong>📱 この端末の現在のデータ</strong><small>このiPhone/iPadで今見えている進み具合</small></span>
              <button className="secondary" disabled={busy} onClick={chooseLocal}>この端末のデータを残す</button>
            </div>
            <small>迷う場合は、モンスター・Lv・マナなど今残したい進み具合が見えている端末側を選んでください。</small>
          </div>}

          <div className="cloud-card"><h3>👨‍👩‍👧 プレイヤー</h3><p>この端末で開く人だけを切り替えます。他の端末の選択は変わりません。</p><div className="cloud-profile-list">{Object.entries(profileInfo.profiles || {}).map(([id, profile]) => <button key={id} className={id === profileInfo.activeProfileId ? 'active' : ''} onClick={() => switchProfile(id)}>{id === profileInfo.activeProfileId ? '✓ ' : ''}{profile.name || id}</button>)}</div><small>パパ・まさき・ウタノなどのプロフィール追加は保護者メニューからできます。</small></div>

          <div className="cloud-card"><h3>🧪 テストデータ</h3>{testMode ? <><p><b>{testMode.label}</b> で確認中。実データとクラウドは変更されません。</p><button onClick={stopTest}>テストを終了して実データへ戻る</button></> : <div className="test-fixture-grid"><button onClick={() => startTest('all')}>全開放・全キャラ</button><button onClick={() => startTest('stage1')}>第1形態・進化直前</button><button onClick={() => startTest('stage2')}>第2形態・最終進化直前</button></div>}<small>進化fixtureはレベル進化/持ち物進化を次の1XP直前、石進化は必要アイテム所持にします。</small></div>

          {session && <details className="cloud-card cloud-recovery"><summary>📦 バックアップ・復元（困ったとき）</summary><div className="cloud-recovery-body"><div className="cloud-row"><p>通常の同期では使いません。データを以前の状態へ戻したいときだけ開いてください。</p><button className="secondary" disabled={busy || !!testMode} onClick={manualBackup}>今の状態を保存</button></div><div className="cloud-backups">{backups.length ? backups.map((backup) => <div key={backup.id}><span><strong>{new Date(backup.created_at).toLocaleString('ja-JP')}</strong><small>rev.{backup.revision} / {backup.reason}</small></span><button className="secondary" disabled={busy || !!testMode} onClick={() => restoreBackup(backup)}>復元</button></div>) : <small>バックアップはまだありません。</small>}</div><button className="secondary" disabled={busy} onClick={doSignOut}>この端末からログアウト</button></div></details>}
        </AdultCloudControls>

        {message && <div className="cloud-message">{message}</div>}
      </section>
    </div>}
  </>
}
