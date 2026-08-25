import React from 'react'
import { CAPTURE_CONFIG } from '../content.js'
import { MAX_CAPTURE_ATTEMPTS, canAttemptCapture, captureChance } from '../engine.js'
import { CAPTURE_ITEM_IDS } from '../progression.js'

const CAPTURE_META = CAPTURE_CONFIG

export function CapturePanel({ game, battle, captureDisabled = false, onCapture }) {
  if (captureDisabled) {
    return <section className="battle-tools"><strong>👑 このバトルでは GETできないよ</strong><p>「わ」は なげられない バトルだよ。たおして、クリアほうしゅうを ねらおう！</p></section>
  }

  const captureHpReady = battle.enemy.hp > 0 && battle.enemy.hp / battle.enemy.maxHp <= 0.5
  const captureAttemptsLeft = Math.max(0, MAX_CAPTURE_ATTEMPTS - (battle.captureAttempts || 0))

  return <section className={`battle-tools capture-panel ${captureHpReady ? 'capture-open' : 'capture-locked'}`}>
    <div className={'capture-main-cta ' + (captureHpReady && captureAttemptsLeft > 0 ? 'ready' : 'locked')}><span>⭕</span><strong>わを なげる</strong><small>{captureHpReady ? 'いま なげられる！' : 'HPを はんぶんいかに！'}</small></div>
    <div className="capture-stars" aria-label="捕獲4段階">{Array.from({ length: 4 }, (_, i) => <span key={i}>{i < battle.captureStars ? '★' : '☆'}</span>)}</div>
    <h2>{captureAttemptsLeft <= 0 ? '「わ」は 3かい なげたよ' : captureHpReady ? '⭐ 「わ」を なげる！' : '🔒 「わ」を なげるには HPを はんぶんいかに！'}</h2>
    <p>{captureAttemptsLeft <= 0 ? 'このバトルでは もう「わ」を なげられないよ。たおすか、バトルを つづけよう。' : captureHpReady ? `いま なげられるよ！ のこり ${captureAttemptsLeft}かい。つかう「わ」を えらぼう。` : `あいての HPを ${Math.floor(battle.enemy.maxHp / 2)} いかまで へらそう。いまは ${battle.enemy.hp}。`}</p>
    <div className="capture-item-grid">{CAPTURE_ITEM_IDS.map((id) => {
      const meta = CAPTURE_META[id]
      const ready = canAttemptCapture(game, battle, id)
      const chance = captureChance(battle, id)
      const owned = game.captureItems?.[id] || 0
      return <button key={id} className={ready ? 'capture-ready' : ''} disabled={!ready} onClick={() => onCapture(id)}><strong>{meta.icon} {meta.label}を なげる</strong><small>もってる：{owned}こ　{captureHpReady && captureAttemptsLeft > 0 && owned > 0 ? `GET ${Math.round(chance * 100)}%` : 'いまは なげられない'}</small></button>
    })}</div>
  </section>
}
