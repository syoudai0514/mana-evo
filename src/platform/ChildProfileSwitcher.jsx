import React, { useEffect, useState } from 'react'
import { rememberDeviceProfile } from './deviceProfile.js'
import { profileDisplayName } from './profileUi.js'
import { isChildProfileSwitchLocked, subscribeChildProfileSwitchLock } from './childProfileSwitchLock.js'

export default function ChildProfileSwitcher({ learning, dispatch, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [interactionLocked, setInteractionLocked] = useState(isChildProfileSwitchLocked)
  const profiles = Object.entries(learning?.profiles || {})
  const activeId = learning?.activeProfileId || profiles[0]?.[0] || 'child-1'
  const activeProfile = learning?.profiles?.[activeId]
  const activeName = profileDisplayName(activeProfile)
  const effectivelyDisabled = disabled || interactionLocked

  useEffect(() => subscribeChildProfileSwitchLock((locked) => {
    setInteractionLocked(locked)
    if (locked) setOpen(false)
  }), [])

  const choose = (profileId) => {
    if (effectivelyDisabled || profileId === activeId) {
      setOpen(false)
      return
    }
    rememberDeviceProfile(profileId)
    dispatch({ type: 'SWITCH_PROFILE', profileId })
    setOpen(false)
  }

  return <>
    <button
      type="button"
      className="child-profile-trigger"
      aria-label={`いまのプレイヤー ${activeName}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      disabled={effectivelyDisabled}
      onClick={() => !effectivelyDisabled && setOpen(true)}
    >
      <span aria-hidden="true">👤</span><strong>{activeName}</strong><b aria-hidden="true">⌄</b>
    </button>
    {open && <div className="child-profile-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="child-profile-dialog" role="dialog" aria-modal="true" aria-label="だれが つかう？">
        <header><div><small>PLAYER</small><h2>だれが つかう？</h2></div><button type="button" aria-label="とじる" onClick={() => setOpen(false)}>×</button></header>
        <div className="child-profile-options">
          {profiles.map(([id, profile]) => {
            const name = profileDisplayName(profile)
            const active = id === activeId
            return <button key={id} type="button" className={active ? 'active' : ''} aria-current={active ? 'true' : undefined} onClick={() => choose(id)}>
              <span aria-hidden="true">{active ? '✓' : '👤'}</span><strong>{name}</strong><small>{active ? 'いま つかっているよ' : 'このひとに きりかえる'}</small>
            </button>
          })}
        </div>
        <p>なまえを ふやしたり かえたりするときは、おうちのひとに おねがいしてね。</p>
      </section>
    </div>}
  </>
}
