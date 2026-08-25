import React from 'react'
import { TOP_LEVEL_CHILD_VIEWS } from './viewOwnership.js'

const NAV_ITEMS = Object.freeze({
  home: ['🏰', 'ホーム'],
  study: ['📖', 'まなぶ'],
  adventure: ['🗺️', 'ぼうけん'],
  monsters: ['🐾', 'モンスター'],
  howto: ['📜', 'あそびかた']
})

export default function AppNavigation({ view, onNavigate }) {
  return <nav className="game-bottom-nav" aria-label="メインメニュー">
    {TOP_LEVEL_CHILD_VIEWS.map((id) => {
      const [icon, label] = NAV_ITEMS[id]
      return <button key={id} className={view === id ? 'active' : ''} onClick={() => onNavigate(id)}>{icon}<span>{label}</span></button>
    })}
  </nav>
}
