import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CAPTURE_CONFIG } from '../content.js'
import { MAX_CAPTURE_ATTEMPTS, canAttemptCapture, captureChance } from '../engine.js'
import { CAPTURE_ITEM_IDS } from '../progression.js'
import { captureDisplayOf } from '../captureDisplay.js'
import PlaceholderMonster from '../PlaceholderMonster.jsx'

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

export function CaptureBallIcon({ itemType = 'star', compact = false }) {
  const display = captureDisplayOf(itemType)
  return <span className={`capture-ball-icon capture-ball-icon--${display.theme}${compact ? ' compact' : ''}`} aria-hidden="true">
    <span className="capture-ball-shine" />
    <span className="capture-ball-band" />
    <span className="capture-ball-core">◆</span>
  </span>
}

function frameDuration(type, defaultInterval) {
  if (type === 'throw') return 680
  if (type === 'impact') return 760
  if (type === 'ring_closed') return 620
  if (type === 'caught') return 920
  if (type === 'ring_scatter' || type === 'escaped') return 760
  return defaultInterval
}

export function CapturePresentation({ sequence, onComplete, intervalMs = 520 }) {
  const frames = Array.isArray(sequence?.frames) ? sequence.frames : []
  const visualFrames = useMemo(
    () => frames.length ? [{ type: 'throw' }, { type: 'impact' }, ...frames] : [],
    [sequence?.id, frames]
  )
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    setFrameIndex(0)
  }, [sequence?.id])

  useEffect(() => {
    if (!visualFrames.length) return undefined
    const current = visualFrames[Math.min(frameIndex, visualFrames.length - 1)] || {}
    const timer = setTimeout(() => {
      if (frameIndex < visualFrames.length - 1) setFrameIndex((index) => index + 1)
      else onComplete?.()
    }, frameDuration(current.type, intervalMs))
    return () => clearTimeout(timer)
  }, [frameIndex, visualFrames, intervalMs, onComplete])

  if (!visualFrames.length) return null
  const frame = visualFrames[Math.min(frameIndex, visualFrames.length - 1)] || {}
  const successSequence = frames.some((entry) => entry?.type === 'ring_closed' || entry?.type === 'caught')
  const highestStarFrame = frames.reduce((max, entry) => entry?.type === 'stars' ? Math.max(max, Number(entry.lit) || 0) : max, 0)
  let lit = 0
  if (frame.type === 'stars') lit = Number(frame.lit) || 0
  else if (frame.type === 'ring_closed' || frame.type === 'caught') lit = 4
  else if (frame.type === 'ring_scatter' || frame.type === 'escaped') lit = highestStarFrame
  // A failed sequence must never visually impersonate four completed stars.
  lit = Math.max(0, Math.min(successSequence ? 4 : 3, lit))

  const display = captureDisplayOf(sequence?.itemType)
  const message = frame.type === 'throw' ? `${display.label}を なげた！`
    : frame.type === 'impact' ? 'ヒット！ ボールが ひかる…'
      : frame.type === 'ring_closed' ? '4つ そろった！'
        : frame.type === 'caught' ? 'ゲット！'
          : frame.type === 'ring_scatter' ? 'あとすこし！ ひかりが ほどけた…'
            : frame.type === 'escaped' ? 'ボールから とびだした！'
              : `${Math.max(1, lit)}つめの ほしが ひかった！`

  const phaseClass = frame.type === 'throw' ? 'is-throwing'
    : frame.type === 'impact' ? 'is-impact'
      : frame.type === 'caught' ? 'is-caught'
        : frame.type === 'ring_scatter' || frame.type === 'escaped' ? 'is-escaped'
          : frame.type === 'ring_closed' ? 'is-sealed'
            : 'is-waiting'
  const stateClass = `${frame.type === 'throw' ? '' : 'has-impact'} ${phaseClass}`.trim()

  return <div className="evolution-overlay capture-sequence-overlay" role="dialog" aria-modal="true" aria-label="捕獲演出">
    <section className={`evolution-celebration-card capture-cinematic ${stateClass}`} data-testid="capture-sequence" data-frame-type={frame.type || 'stars'} data-lit-stars={lit} aria-live="polite">
      <p className="evolution-kicker">GET CHANCE</p>
      <div className="capture-cinematic-stage">
        <div className="capture-target">
          {sequence?.speciesId && <PlaceholderMonster speciesId={sequence.speciesId} size={148} />}
        </div>
        <div className="capture-energy" aria-hidden="true" />
        <div className="capture-ball-flight"><CaptureBallIcon itemType={sequence?.itemType} /></div>
        <div className="capture-stars" aria-label={`4つのうち ${lit}つ点灯`}>
          {Array.from({ length: 4 }, (_, index) => <span key={index} className={index < lit ? 'lit' : ''}>★</span>)}
        </div>
      </div>
      <h2>{message}</h2>
      <p className="capture-cinematic-note">{frame.type === 'caught' ? `${display.label}が しっかり とじた！` : frame.type === 'escaped' || frame.type === 'ring_scatter' ? 'バトルは まだ つづくよ' : '4つ ひかったら GET！'}</p>
    </section>
  </div>
}

export function CapturePanel({ game, battle, captureDisabled = false, onCapture, onCancel }) {
  const [selectedBall, setSelectedBall] = useState(null)
  const panelRef = useRef(null)
  const captureHpReady = battle.enemy.hp > 0 && battle.enemy.hp / battle.enemy.maxHp <= 0.5
  const captureAttemptsLeft = Math.max(0, MAX_CAPTURE_ATTEMPTS - (battle.captureAttempts || 0))
  const options = CAPTURE_ITEM_IDS.map((id) => {
    const meta = CAPTURE_META[id]
    const display = captureDisplayOf(id)
    const ready = !captureDisabled && canAttemptCapture(game, battle, id)
    const chance = captureChance(battle, id)
    return {
      id,
      meta,
      display,
      ready,
      chance,
      owned: game.captureItems?.[id] || 0,
      stars: starRating(chance, !!meta.guaranteed)
    }
  })
  const recommended = [...options].filter((option) => option.ready).sort((a, b) => b.chance - a.chance)[0]?.id || null
  const selected = options.find((option) => option.id === selectedBall && option.ready) || null

  useEffect(() => {
    // Capture selection is a focused sub-flow inside the battle document. WebKit
    // can settle at the document's scroll ceiling while the preceding battle
    // layout is being replaced. Reserve real internal height (not a collapsing
    // outer margin) so portrait WebKit has enough scroll range for the first tap.
    let frame = 0
    let timer = 0
    const positionPanel = () => {
      const panel = panelRef.current
      if (!panel) return
      const top = panel.getBoundingClientRect().top + window.scrollY - 12
      window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'auto' })
    }
    frame = window.requestAnimationFrame(positionPanel)
    timer = window.setTimeout(positionPanel, 80)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (selectedBall && options.some((option) => option.id === selectedBall && option.ready)) return
    setSelectedBall(recommended)
  }, [battle.battleId, battle.captureAttempts, recommended, selectedBall])

  const focusedTailStyle = { paddingBottom: '28px' }

  if (captureDisabled) {
    return <section ref={panelRef} style={focusedTailStyle} className="battle-tools capture-panel" role="dialog" aria-label="つかまえる"><strong>👑 このバトルでは GETできないよ</strong><p>ボールは なげられない バトルだよ。たおして すすもう！</p><button className="secondary" onClick={onCancel}>バトルへ もどる</button></section>
  }

  return <section ref={panelRef} style={focusedTailStyle} className={`battle-tools capture-panel ${captureHpReady ? 'capture-open' : 'capture-locked'}`} role="dialog" aria-label="どのボールをつかう？">
    <div className={'capture-main-cta ' + (captureHpReady && captureAttemptsLeft > 0 ? 'ready' : 'locked')}><CaptureBallIcon itemType={selected?.id || recommended || 'star'} compact /><div><strong>どのボールを つかう？</strong><small>のこり {captureAttemptsLeft}かい</small></div></div>
    <h2>{captureAttemptsLeft <= 0 ? 'ボールは 3かい なげたよ' : captureHpReady ? 'ボールを えらぼう！' : '🔒 HPを はんぶんいかに！'}</h2>
    <p>{captureAttemptsLeft <= 0 ? 'このバトルでは もう ボールを なげられないよ。' : captureHpReady ? '★と「おすすめ！」を みて えらぼう。' : `あいての HPを ${Math.floor(battle.enemy.maxHp / 2)} いかまで へらそう。いまは ${battle.enemy.hp}。`}</p>

    <div className="capture-item-grid">{options.map((option) => {
      const isSelected = option.id === selectedBall
      const isRecommended = option.id === recommended
      return <button
        key={option.id}
        type="button"
        className={`${option.ready ? 'capture-ready' : ''} ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`.trim()}
        disabled={!option.ready}
        aria-pressed={isSelected}
        onClick={() => setSelectedBall(option.id)}
      >
        <CaptureBallIcon itemType={option.id} compact />
        <span className="capture-item-copy"><strong>{option.display.label}</strong><StarCue count={option.stars} /><small>もってる：{option.owned}こ</small></span>
        {isRecommended && option.ready && <b className="capture-recommended-badge">おすすめ！</b>}
      </button>
    })}</div>

    <details className="capture-details">
      <summary>くわしい かくりつ</summary>
      {options.map((option) => <p key={option.id}>{option.display.label}：{Math.round(option.chance * 100)}%</p>)}
    </details>

    <div className="battle-action-row capture-actions">
      <button className="primary" disabled={!selected} onClick={() => selected && onCapture(selected.id)}>{selected ? `${selected.display.label}を なげる！` : 'ボールを えらんでね'}</button>
      <button className="secondary" onClick={onCancel}>バトルへ もどる</button>
    </div>
  </section>
}
