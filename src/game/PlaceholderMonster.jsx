import React from 'react'
import { speciesOf, typeLabel } from './content.js'
import { monsterSpriteFrame } from './monsterSprite.js'

export default function PlaceholderMonster({ speciesId, stage = null, excited = false, compact = false }) {
  const species = speciesOf(speciesId)
  const resolvedStage = stage || species?.stage || 1
  const frame = monsterSpriteFrame(speciesId)

  if (frame) {
    const size = compact ? 46 : 118
    const frameHeight = Math.round(size * 5 / 6)
    return (
      <div
        className={`placeholder-monster monster-art stage-${resolvedStage} ${excited ? 'excited' : ''} ${compact ? 'compact' : ''}`}
        aria-label={species?.name || 'モンスター'}
        role="img"
        style={{
          position: 'relative',
          width: size,
          height: size,
          flexBasis: size,
          overflow: 'hidden',
          border: 0,
          borderRadius: 0,
          boxShadow: 'none',
          background: 'transparent'
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: Math.round((size - frameHeight) / 2),
            width: size,
            height: frameHeight,
            overflow: 'hidden'
          }}
        >
          <img
            src={frame.src}
            alt=""
            draggable="false"
            style={{
              position: 'absolute',
              left: `${-frame.col * 100}%`,
              top: `${-frame.row * 100}%`,
              width: `${frame.cols * 100}%`,
              height: `${frame.rows * 100}%`,
              maxWidth: 'none',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>
    )
  }

  const types = species?.types || ['normal']
  return (
    <div className={`placeholder-monster stage-${resolvedStage} ${excited ? 'excited' : ''} ${compact ? 'compact' : ''}`} aria-label="仮キャラクター">
      <div className="monster-ear left" />
      <div className="monster-ear right" />
      <div className="monster-face"><span>●</span><span>●</span><span className="mouth">⌣</span></div>
      <div className="monster-gem">◆</div>
      <small>{types.map(typeLabel).join(' / ')}・仮画像</small>
    </div>
  )
}
