import React, { useEffect, useRef, useState } from 'react'
import { speciesOf, typeLabel } from './content.js'
import { monsterSpriteFrame } from './monsterSprite.js'

export default function PlaceholderMonster({ speciesId, stage = null, excited = false, compact = false }) {
  const species = speciesOf(speciesId)
  const resolvedStage = stage || species?.stage || 1
  const frame = monsterSpriteFrame(speciesId)
  const size = compact ? 46 : 118
  const canvasRef = useRef(null)
  const [spriteFailed, setSpriteFailed] = useState(false)

  useEffect(() => {
    setSpriteFailed(false)
    if (!frame || !canvasRef.current) return undefined

    let cancelled = false
    const image = new Image()
    image.decoding = 'async'

    image.onload = () => {
      if (cancelled || !canvasRef.current) return

      const canvas = canvasRef.current
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3))
      const pixelSize = Math.round(size * dpr)
      canvas.width = pixelSize
      canvas.height = pixelSize

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setSpriteFailed(true)
        return
      }

      const cellWidth = image.naturalWidth / frame.cols
      const cellHeight = image.naturalHeight / frame.rows
      const sourceX = frame.col * cellWidth
      const sourceY = frame.row * cellHeight

      ctx.clearRect(0, 0, pixelSize, pixelSize)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        cellWidth,
        cellHeight,
        0,
        0,
        pixelSize,
        pixelSize
      )
    }

    image.onerror = () => {
      if (!cancelled) setSpriteFailed(true)
    }

    image.src = frame.src

    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [frame?.src, frame?.col, frame?.row, frame?.cols, frame?.rows, size])

  if (frame && !spriteFailed) {
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
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            display: 'block',
            width: size,
            height: size,
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
