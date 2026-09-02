import React, { useEffect } from 'react'
import { MonsterArt } from '../PlaceholderMonster.jsx'
import { speciesOf } from '../content.js'
import { statsFor } from '../engine.js'
import { setChildProfileSwitchLock } from '../../platform/childProfileSwitchLock.js'

export function EvolutionPrompt({ prompt, onConfirm, onLater }) {
  useEffect(() => {
    if (!prompt) return undefined
    setChildProfileSwitchLock('evolution-prompt', true)
    return () => setChildProfileSwitchLock('evolution-prompt', false)
  }, [prompt])

  if (!prompt) return null
  const pending = prompt.pendingEvolution || prompt.pending || null
  const from = speciesOf(pending?.fromSpeciesId)
  const to = speciesOf(pending?.toSpeciesId)
  if (!pending || !from || !to) return null

  return <div className="evolution-overlay evolution-prompt-overlay" data-layout-surface="contextual" role="dialog" aria-modal="true" aria-label="シンカできる！">
    <section className="evolution-celebration-card evolution-prompt-card">
      <p className="evolution-kicker">✨ シンカできる！ ✨</p>
      <div className="evolution-pair evolution-prompt-pair">
        <div className="evolution-old"><MonsterArt speciesId={from.id} /><strong>{from.name}</strong></div>
        <span className="evolution-arrow">→</span>
        <div className="evolution-new"><div className="evolution-glow"/><MonsterArt speciesId={to.id} excited /><strong>{to.name}</strong></div>
      </div>
      <h2>{from.name}を<br/><b>{to.name}</b>に シンカさせる？</h2>
      <p>じぶんで ボタンを おして シンカさせよう！</p>
      <div className="evolution-prompt-actions">
        <button className="primary huge" onClick={() => onConfirm?.(prompt)}>✨ シンカする！</button>
        <button className="secondary" onClick={() => onLater?.(prompt)}>あとで</button>
      </div>
      <small className="evolution-prompt-note">あとでを えらんでも、モンスターから いつでも シンカできるよ。</small>
    </section>
  </div>
}

export function EvolutionCelebration({ reveal, onClose }) {
  useEffect(() => {
    if (!reveal) return undefined
    setChildProfileSwitchLock('evolution-acknowledgement', true)
    return () => setChildProfileSwitchLock('evolution-acknowledgement', false)
  }, [reveal])

  if (!reveal) return null
  const from = speciesOf(reveal.fromId)
  const to = speciesOf(reveal.toId)
  const before = statsFor(reveal.fromId, reveal.level)
  const after = statsFor(reveal.toId, reveal.level)
  const gain = (key) => Math.max(0, (after?.[key] || 0) - (before?.[key] || 0))
  const discoveryMessage = reveal.firstEvolutionDiscovery
    ? '🗺️ じぶんで シンカした きろくが のこった！ この すがたは、これからの ぼうけんで であえる こうほに なったよ。'
    : '📖 じぶんで シンカした きろくが のこった！ ずかんの GET も こうしんされたよ。'

  return <div className="evolution-overlay" data-layout-surface="contextual" role="dialog" aria-modal="true" aria-label="シンカ！" aria-live="polite">
    <div className="evolution-stars">✦　✧　✦　✧　✦</div>
    <section className="evolution-celebration-card">
      <p className="evolution-kicker">✨ シンカ！ ✨</p>
      <p className="eyebrow">Lv.{reveal.level} まで そだてた！</p>
      <div className="evolution-pair">
        <div className="evolution-old"><MonsterArt speciesId={reveal.fromId} /><strong>{from?.name}</strong></div>
        <span className="evolution-arrow">→</span>
        <div className="evolution-new"><div className="evolution-glow"/><MonsterArt speciesId={reveal.toId} excited /><strong>{to?.name}</strong></div>
      </div>
      <h2>{from?.name} は<br/><b>{to?.name}</b> に シンカした！</h2>
      <p>じぶんで そだてたから たどりついた すがただよ！</p>
      <div className="evolution-stat-gains">
        <span>HP <b>+{gain('hp')}</b></span>
        <span>こうげき <b>+{gain('attack')}</b></span>
        <span>ぼうぎょ <b>+{gain('defense')}</b></span>
        <span>すばやさ <b>+{gain('speed')}</b></span>
      </div>
      <div className="evolution-unlock-note">{discoveryMessage}</div>
      <button className="primary huge" onClick={onClose}>つづける！</button>
    </section>
  </div>
}
