import React, { useEffect, useMemo, useState } from 'react'
import { speciesOf, typeLabel } from './content.js'
import { fallbackMonsterArt, resolveMonsterArt } from './monsterArt.js'
import { monsterSpriteFrame } from './monsterSprite.js'

// Preview-branch-only switch. This branch is for hands-on playtesting with
// CANDIDATE artwork and does not promote or reinterpret any asset as FORMAL.
const CANDIDATE_ART_PLAYTEST = true

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

export function MonsterArt({ speciesId, stage = null, excited = false, compact = false, size: requestedSize = null }) {
  const species = speciesOf(speciesId)
  const resolvedStage = stage || species?.stage || 1
  const size = requestedSize || (compact ? 50 : 124)
  const legacyFrame = monsterSpriteFrame(speciesId)
  const runtimeArt = useMemo(() => resolveMonsterArt(speciesId, 'runtime'), [speciesId])
  const reviewArt = useMemo(() => resolveMonsterArt(speciesId, 'review'), [speciesId])
  const art = CANDIDATE_ART_PLAYTEST ? reviewArt : runtimeArt
  const [failedArtSrc, setFailedArtSrc] = useState(null)
  const playableImageUrl = (art.isFormal || art.isCandidatePreview) && art.src && failedArtSrc !== art.src
    ? resolvePublicAsset(art.src)
    : null
  const no = Number(species?.no || 0)

  useEffect(() => { setFailedArtSrc(null) }, [speciesId, art.src])

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

  // Legacy sprite support exists only for old saved IDs outside the active m001-m238
  // registry. It is not an artwork source for active monsters.
  if (!species?.no && legacyFrame) {
    return <div className={`placeholder-monster monster-art legacy-art ${compact ? 'compact' : ''}`} style={legacySpriteStyle(legacyFrame, size)} role="img" aria-label={species?.name || 'モンスター'} />
  }

  if (playableImageUrl) {
    const artClass = art.isFormal ? 'formal-art' : 'candidate-preview-art'
    return (
      <div className={`placeholder-monster monster-art official-art ${artClass} stage-${resolvedStage} ${excited ? 'excited' : ''} ${compact ? 'compact' : ''}`} style={{ width: size, height: size, minWidth: size, flexBasis: size }} role="img" aria-label={species?.name || 'モンスター'}>
        <img
          src={playableImageUrl}
          alt={species?.name || 'モンスター'}
          onError={() => {
            const reason = art.isFormal ? 'formal-asset-load-error' : 'candidate-preview-load-error'
            const fallback = fallbackMonsterArt(art, reason)
            console.error('[MonsterArt] asset failed to load; using canonical placeholder', fallback)
            setFailedArtSrc(art.src)
          }}
          loading="lazy"
          decoding="async"
        />
      </div>
    )
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

export default MonsterArt
