import React from 'react'
import PlaceholderMonster from '../PlaceholderMonster.jsx'
import { speciesOf } from '../content.js'
import { statsFor } from '../engine.js'

export function EvolutionCelebration({ reveal, onClose }) {
  if (!reveal) return null
  const from = speciesOf(reveal.fromId)
  const to = speciesOf(reveal.toId)
  const before = statsFor(reveal.fromId, reveal.level)
  const after = statsFor(reveal.toId, reveal.level)
  const gain = (key) => Math.max(0, (after?.[key] || 0) - (before?.[key] || 0))

  return <div className="evolution-overlay" role="dialog" aria-modal="true" aria-label="シンカ！">
    <div className="evolution-stars">✦　✧　✦　✧　✦</div>
    <section className="evolution-celebration-card">
      <p className="evolution-kicker">✨ シンカ！ ✨</p>
      <div className="evolution-pair"><div className="evolution-old"><PlaceholderMonster speciesId={reveal.fromId} /><strong>{from?.name}</strong></div><span className="evolution-arrow">→</span><div className="evolution-new"><div className="evolution-glow"/><PlaceholderMonster speciesId={reveal.toId} /><strong>{to?.name}</strong></div></div>
      <h2>{from?.name} は<br/><b>{to?.name}</b> に シンカした！</h2>
      <p>じぶんで そだてたから たどりついた すがただよ！</p>
      <div className="evolution-stat-gains"><span>HP <b>+{gain('hp')}</b></span><span>こうげき <b>+{gain('attack')}</b></span><span>ぼうぎょ <b>+{gain('defense')}</b></span><span>すばやさ <b>+{gain('speed')}</b></span></div>
      <div className="evolution-unlock-note">🗺️ この すがたが ずかんに とうろく！<br/>こうレベルの おくちで であえる ばしょも あるよ。</div>
      <button className="primary huge" onClick={onClose}>つづける！</button>
    </section>
  </div>
}
