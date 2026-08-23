import React, { useMemo, useState } from 'react'
import ParentScreen from '../kids-quest-study/screens/ParentScreen.jsx'

export const PARENT_PIN_KEY = 'mana-evo-parent-pin-v1'

function storedPin() {
  try { return localStorage.getItem(PARENT_PIN_KEY) || '' } catch { return '' }
}

function savePin(pin) {
  try { localStorage.setItem(PARENT_PIN_KEY, pin) } catch {}
}

function makeAdultCheck() {
  const a = 13 + Math.floor(Math.random() * 7)
  const b = 6 + Math.floor(Math.random() * 4)
  return { label: `${a} × ${b}`, answer: String(a * b) }
}

function PinInput({ value, onChange, placeholder = '4けたのPIN' }) {
  return <input
    className="parent-pin-input"
    type="password"
    inputMode="numeric"
    pattern="[0-9]*"
    autoComplete="off"
    maxLength={4}
    value={value}
    placeholder={placeholder}
    onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
  />
}

export default function ParentGate({ onBack }) {
  const [pinExists, setPinExists] = useState(() => storedPin().length === 4)
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [adultAnswer, setAdultAnswer] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [message, setMessage] = useState('')
  const challenge = useMemo(makeAdultCheck, [recovering, pinExists])

  const exit = () => {
    setUnlocked(false)
    setPin('')
    setPinConfirm('')
    setAdultAnswer('')
    setMessage('')
    onBack()
  }

  if (unlocked) return <ParentScreen onBack={exit} />

  const unlock = () => {
    if (pin === storedPin()) {
      setUnlocked(true)
      setPin('')
      setMessage('')
    } else {
      setMessage('PINが ちがいます')
    }
  }

  const createOrResetPin = () => {
    if (adultAnswer.trim() !== challenge.answer) {
      setMessage('おとなの かくにんの こたえが ちがいます')
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setMessage('PINは 4けたの すうじに してください')
      return
    }
    if (pin !== pinConfirm) {
      setMessage('PINが 2かいとも おなじか かくにんしてください')
      return
    }
    savePin(pin)
    setPinExists(true)
    setRecovering(false)
    setUnlocked(true)
    setPin('')
    setPinConfirm('')
    setAdultAnswer('')
    setMessage('')
  }

  const setupMode = !pinExists || recovering

  return <main className="screen parent-gate-screen">
    <button className="back" onClick={onBack}>← ホーム</button>
    <section className="parent-gate-card">
      <div className="parent-gate-icon">🔒</div>
      <p className="eyebrow">おうちのひと せんよう</p>
      <h1>{setupMode ? '保護者PINを設定' : '保護者PIN'}</h1>
      <p className="parent-gate-note">学年・先取り・むずかしさ・つくよみちゃん・プロフィール・バックアップは、ここからだけ変更できます。</p>

      {setupMode ? <>
        <div className="adult-check">
          <strong>おとなの かくにん</strong>
          <span>{challenge.label} = ?</span>
          <input inputMode="numeric" value={adultAnswer} onChange={(e)=>setAdultAnswer(e.target.value.replace(/\D/g,''))} placeholder="こたえ" />
        </div>
        <PinInput value={pin} onChange={setPin} />
        <PinInput value={pinConfirm} onChange={setPinConfirm} placeholder="PINを もういちど" />
        <button className="primary huge" onClick={createOrResetPin}>{pinExists ? 'PINを さいせっていして ひらく' : 'PINを きめて ひらく'}</button>
        {pinExists && <button className="text-button" onClick={()=>{setRecovering(false);setPin('');setPinConfirm('');setAdultAnswer('');setMessage('')}}>PIN入力に もどる</button>}
      </> : <>
        <PinInput value={pin} onChange={setPin} />
        <button className="primary huge" disabled={pin.length !== 4} onClick={unlock}>🔓 保護者メニューを ひらく</button>
        <button className="text-button" onClick={()=>{setRecovering(true);setPin('');setMessage('')}}>PINを わすれたとき</button>
      </>}

      {message && <div className="parent-gate-message">{message}</div>}
      <small>※ このPINは、子どもの誤操作を防ぐための端末内ロックです。</small>
    </section>
  </main>
}
