import React from 'react'
import { typeLabel } from '../content.js'

export function TypePills({ types = [] }) {
  return <div className="type-pills">{types.map((type) => <span key={type}>{typeLabel(type)}</span>)}</div>
}

export function HpBar({ value, max }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return <div className="hp-wrap"><div className="hp-fill" style={{ width: `${ratio * 100}%` }} /></div>
}
