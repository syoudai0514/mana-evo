import React from 'react'
import { speciesOf, typeLabel } from './content.js'
import { monsterSpriteFrame } from './monsterSprite.js'

export default function PlaceholderMonster({ speciesId, stage = null, excited = false, compact = false }) {
  const species = speciesOf(speciesId)
  const resolvedStage = stage || species?.stage || 1
  const frame = monsterSpriteFrame(speciesId)

  if (frame) {
    const size = compact ? 46 : 118
    const handleImageError = (event) => {
      const image = event.currentTarget
      if (image.dataset.fallbackTried === '1') return
      image.dataset.fallbackTried = '1'
      image.src = frame.fallbackSrc
    }

    return (
      <div
        className={`placeholder-monster monster-art stage-${resolvedStage} ${excited ? 'excited' : ''} ${compact ? 'compact' : ''}`}
        aria-label={species?.name || 'モンスター'}
        role="img"
        style={{
          position: 'relative',
          width: size,
          height: size,
          minWidth: size,
          flexBasis: size,
          overflow: 'hidden',
          border: 0,
          borderRadius: 0,
          boxShadow: 'none',
          background: 'transparent'
        }}
      >
        <img
          src={frame.src}
          alt=""
          draggable="false"
          onError={handleImageError}
          style={{
            position: 'absolute',
            display: 'block',
            left: -frame.col * size,
            top: -frame.row * size,
            width: frame.cols * size,
            height: frame.rows * size,
            maxWidth: 'none',
            maxHeight: 'none',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        />
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
