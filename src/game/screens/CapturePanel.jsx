import React, { useEffect, useState } from 'react'
import { CAPTURE_CONFIG } from '../content.js'
import { MAX_CAPTURE_ATTEMPTS, canAttemptCapture, captureChance } from '../engine.js'
import { CAPTURE_ITEM_IDS } from '../progression.js'

const CAPTURE_META = CAPTURE_CONFIG

function starRating(chance, guaranteed = false) {
  if (guaranteed) return 5
  // Display-only child cue. CURRENT intentionally does not freeze the numeric
  // thresholds behind the five-step wording as a product probability rule.
  return Math.max(1, Math.min(5, Math.ceil(Math.max(0, Math.min(1, chance)) * 5)))
}

function StarCue({ count, max = 5 }) {
  return <span className="capture-ease-stars" aria-label={`つかまえやすさ ${count}/${max}`}>{Array.from({ length: max }, (_, index) => index < count ? '★' : '☆').join('')}</span>
}

export function CapturePresentation({ sequence, onComplete, intervalMs = 480 }) {
  const frames = Array.isArray(sequence?.frames) ? sequence.frames : []
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    setFrameIndex(0)
  }, [sequence?.id])

  useEffect(() => {
    if (!frames.length) return undefined
    const timer = setTimeout(() => {
      if (frameIndex < frames.length - 1) setFrameIndex((index) => index + 1)
      else onComplete?.()
    }, intervalMs)
    return () => clearTimeout(timer)
  }, [frameIndex, frames.length, intervalMs, onComplete])

  if (!frames.length) return null
  const frame = frames[Math.min(frameIndex, frames.length - 1)] || {}
  const successSequence = frames.some((entry) => entry?.type === 'ring_closed' || entry?.type === 'caught')
  const highestStarFrame = frames.reduce((max, entry) => entry?.type === 'stars' ? Math.max(max, Number(entry.lit) || 0) : max, 0)
  const rawLit = frame.type === 'stars'
    ? Number(frame.lit) || 0
    : Number(frame.lit) || (successSequence ? 4 : highestStarFrame)
  // Even if malformed persisted presentation data is encountered, a failed
  // sequence must never visually impersonate four completed stars.
  const lit = Math.max(0, Math.min(successSequence ? 4 : 3, rawLit))
  const message = frame.type === 'ring_closed' ? '4つ ひかった！ 「わ」が とじた！'
    : frame.type === 'caught' ? 'ゲット！'
      : frame.type === 'ring_scatter' ? `${lit}つ ひかったところで 「わ」が ほどけた…`
        : frame.type === 'escaped' ? 'おしい！ バトルは つづくよ。'
          : `${lit}つめの ほしが ひかった！`

  return <div className="evolution-overlay capture-sequence-overlay" role="dialog" aria-modal="true" aria-label="捕獲演出">
    <section className="evolution-celebration-card" data-testid="capture-sequence" data-frame-type={frame.type || 'stars'} data-lit-stars={lit} aria-live="polite">
      <p className="evolution-kicker">⭕ 「わ」が ひかる！</p>
      <div className="capture-stars" aria-label={`4つのうち ${lit}つ点灯`}>
        {Array.from({ length: 4 }, (_, index) => <span key={index}>{index < lit ? '★' : '☆'}</span>)}
      </div>
      <h2>{message}</h2>
    </section>
  </div>
}

export function CapturePanel({ game, battle, captureDisabled = false, onCapture, onCancel }) {
  const [selectedRing, setSelectedRing] = useState(null)
  const captureHpReady = battle.enemy.hp > 0 && battle.enemy.hp / battle.enemy.maxHp <= 0.5
  const captureAttemptsLeft = Math.max(0, MAX_CAPTURE_ATTEMPTS - (battle.captureAttempts || 0))
  const options = CAPTURE_ITEM_IDS.map((id) => {
    const meta = CAPTURE_META[id]
    const ready = !captureDisabled && canAttemptCapture(game, battle, id)
    const chance = captureChance(battle, id)
    return {
      id,
      meta,
      ready,
      chance,
      owned: game.captureItems?.[id] || 0,
      stars: starRating(chance, !!meta.guaranteed)
    }
  })
  const recommended = [...options].filter((option) => option.ready).sort((a, b) => b.chance - a.chance)[0]?.id || null
  const selected = options.find((option) => option.id === selectedRing && option.ready) || null

  useEffect(() => {
    if (selectedRing && options.some((option) => option.id === selectedRing && option.ready)) return
    setSelectedRing(recommended)
  }, [battle.battleId, battle.captureAttempts, recommended, selectedRing])

  if (captureDisabled) {
    return <section className="battle-tools capture-panel" role="dialog" aria-label="つかまえる"><strong>👑 このバトルでは GETできないよ</strong><p>「わ」は なげられない バトルだよ。たおして すすもう！</p><button className="secondary" onClick={onCancel}>バトルへ もどる</button></section>
  }

  return <section className={`battle-tools capture-panel ${captureHpReady ? 'capture-open' : 'capture-locked'}`} role="dialog" aria-label="どの「わ」をつかう？">
    <div className={'capture-main-cta ' + (captureHpReady && captureAttemptsLeft > 0 ? 'ready' : 'locked')}><span>⭕</span><strong>どの「わ」を つかう？</strong><small>のこり {captureAttemptsLeft}かい</small></div>
    <h2>{captureAttemptsLeft <= 0 ? '「わ」は 3かい なげたよ' : captureHpReady ? '⭐ つかう「わ」を えらぼう！' : '🔒 HPを はんぶんいかに！'}</h2>
    <p>{captureAttemptsLeft <= 0 ? 'このバトルでは もう「わ」を なげられないよ。' : captureHpReady ? '★と「おすすめ！」を みて えらぼう。' : `あいての HPを ${Math.floor(battle.enemy.maxHp / 2)} いかまで へらそう。いまは ${battle.enemy.hp}。`}</p>

    <div className="capture-item-grid">{options.map((option) => {
      const isSelected = option.id === selectedRing
      const isRecommended = option.id === recommended
      return <button
        key={option.id}
        type="button"
        className={`${option.ready ? 'capture-ready' : ''} ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`.trim()}
        disabled={!option.ready}
        aria-pressed={isSelected}
        onClick={() => setSelectedRing(option.id)}
      >
        <strong>{option.meta.icon} {option.meta.label}</strong>
        <StarCue count={option.stars} />
        <small>もってる：{option.owned}こ {isRecommended && option.ready ? '　おすすめ！' : ''}</small>
      </button>
    })}</div>

    <details className="capture-details">
      <summary>くわしい かくりつ</summary>
      {options.map((option) => <p key={option.id}>{option.meta.icon} {option.meta.label}：{Math.round(option.chance * 100)}%</p>)}
    </details>

    <div className="battle-action-row">
      <button className="primary" disabled={!selected} onClick={() => selected && onCapture(selected.id)}>{selected ? `${selected.meta.label}を なげる！` : '「わ」を えらんでね'}</button>
      <button className="secondary" onClick={onCancel}>バトルへ もどる</button>
    </div>
  </section>
}
