import React, { useEffect, useMemo, useState } from 'react'
import { speciesOf, typeLabel } from './content.js'
import { monsterSpriteFrame } from './monsterSprite.js'

function legacySpriteStyle(frame, size) {
  return {
    width: size,
    height: size,
    backgroundImage: `url(${frame.src})`,
    backgroundSize: `${frame.cols * size}px ${frame.rows * size}px`,
    backgroundPosition: `${-frame.col * size}px ${-frame.row * size}px`,
    backgroundRepeat: 'no-repeat'
  }
}

function resolvePublicAsset(url) {
  if (!url) return null
  if (/^(https?:|data:|blob:)/.test(url)) return url
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${String(url).replace(/^\/+/, '')}`
}

export default function PlaceholderMonster({ speciesId, stage = null, excited = false, compact = false, size: requestedSize = null }) {
  const species = speciesOf(speciesId)
  const resolvedStage = stage || species?.stage || 1
  const size = requestedSize || (compact ? 50 : 124)
  const legacyFrame = monsterSpriteFrame(speciesId)
  const officialUrl = resolvePublicAsset(species?.officialImageUrl)
  const no = Number(species?.no || 0)
  const formalSvgUrl = no >= 1 && no <= 20 ? resolvePublicAsset(`/monsters/${speciesId}.svg`) : null
  const imageSources = [formalSvgUrl, officialUrl].filter(Boolean)
  const [imageSourceIndex, setImageSourceIndex] = useState(0)
  const imageUrl = imageSources[imageSourceIndex] || null

  useEffect(() => { setImageSourceIndex(0) }, [officialUrl, formalSvgUrl])

  const fallbackStyle = useMemo(() => {
    const hue = (no * 47 + resolvedStage * 23) % 360
    return {
      '--monster-hue': hue,
      width: size,
      height: size,
      minWidth: size,
      flexBasis: size
    }
  }, [no, resolvedStage, size])

  if (imageUrl) {
    return (
      <div className={`placeholder-monster monster-art official-art stage-${resolvedStage} ${excited ? 'excited' : ''} ${compact ? 'compact' : ''}`} style={{ width: size, height: size, minWidth: size, flexBasis: size }} role="img" aria-label={species?.name || 'モンスター'}>
        <img src={imageUrl} alt={species?.name || 'モンスター'} onError={() => setImageSourceIndex((index) => index + 1)} loading="lazy" decoding="async" />
      </div>
    )
  }

  if (!species?.no && legacyFrame) {
    return <div className={`placeholder-monster monster-art legacy-art ${compact ? 'compact' : ''}`} style={legacySpriteStyle(legacyFrame, size)} role="img" aria-label={species?.name || 'モンスター'} />
  }

  const type = species?.types?.[0] || 'normal'
  const typeText = typeLabel(type)
  const initial = (species?.name || 'マ').slice(0, 1)
  return (
    <div className={`placeholder-monster generated-monster stage-${resolvedStage} ${excited ? 'excited' : ''} ${compact ? 'compact' : ''}`} style={fallbackStyle} role="img" aria-label={`${species?.name || 'モンスター'} 画像準備中`}>
      <div className="generated-aura" />
      <div className="generated-body">
        <span className="generated-stage">{'◆'.repeat(Math.max(1, Math.min(3, resolvedStage)))}</span>
        <b>{initial}</b>
        <span className="generated-eyes">•　•</span>
      </div>
      {!compact && <small>No.{species?.no || '---'}　{typeText}<br />画像準備中</small>}
    </div>
  )
}
