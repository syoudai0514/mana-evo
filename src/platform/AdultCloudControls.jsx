import React, { useState } from 'react'
import { PARENT_PIN_KEY } from '../parent/ParentGate.jsx'

function storedPin() {
  try { return localStorage.getItem(PARENT_PIN_KEY) || '' } catch { return '' }
}

export default function AdultCloudControls({ children, alreadyVerified = false }) {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')
  const pinExists = storedPin().length === 4
  // ParentScreen can only exist after ParentGate has already verified the local
  // Parent PIN. Requiring the same PIN again inside the cloud modal is redundant.
  const parentAlreadyVerified = alreadyVerified || (typeof document !== 'undefined' && !!document.querySelector('.parent-screen'))

  if (parentAlreadyVerified || unlocked) return <>{children}</>

  const unlock = () => {
    if (!pinExists) {
      setMessage('この端末で保護者PINを設定してから使ってください')
      return
    }
    if (pin !== storedPin()) {
      setMessage('PINが ちがいます')
      return
    }
    setUnlocked(true)
    setPin('')
    setMessage('')
  }

  return <section className="cloud-card adult-cloud-gate">
    <div className="adult-cloud-gate__icon">🔒</div>
    <div>
      <h3>保護者専用</h3>
      <p>TESTデータ・競合解決・バックアップ復元などは、保護者PINを確認してから操作します。</p>
    </div>
    {pinExists ? <>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={4}
        value={pin}
        placeholder="4けたの保護者PIN"
        onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
        onKeyDown={(event) => { if (event.key === 'Enter' && pin.length === 4) unlock() }}
      />
      <button disabled={pin.length !== 4} onClick={unlock}>🔓 保護者メニューをひらく</button>
    </> : <>
      <div className="cloud-gate-note">この端末には保護者PINがまだありません。</div>
      <small>ホームの「保護者メニュー」でPINを設定すると、クラウドの高度な操作やテストデータを使えます。</small>
    </>}
    {message && <div className="cloud-gate-message">{message}</div>}
  </section>
}
