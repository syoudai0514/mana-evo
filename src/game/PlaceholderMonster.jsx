import React from 'react'
import { speciesOf, typeLabel } from './content.js'
import { monsterSpriteStyle } from './monsterSprite.js'

export default function PlaceholderMonster({ speciesId, stage = null, excited = false, compact = false }) {
  const species = speciesOf(speciesId)
  const resolvedStage = stage || species?.stage || 1
  const spriteStyle = monsterSpriteStyle(speciesId)

  if (spriteStyle) {
    const size = compact ? 46 : 118
    return (
      <div
        className={`placeholder-monster monster-art stage-${resolvedStage} ${excited ? 'excited' : ''} ${compact ? 'compact' : ''}`}
        aria-label={species?.name || 'モンスター'}
        role="img"
        style={{
          ...spriteStyle,
          width: size,
          height: size,
          flexBasis: size,
          border: 0,
          borderRadius: 0,
          boxShadow: 'none',
          backgroundColor: 'transparent',
          backgroundRepeat: 'no-repeat'
        }}
      />
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
