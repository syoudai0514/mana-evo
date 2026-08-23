const COLS = 5
const ROWS = 4

const COORDS = Object.freeze({
  'starter-fire-1': [0, 0],
  'starter-fire-2': [1, 0],
  'starter-fire-3': [2, 0],
  'wild-grass-1': [3, 0],
  'wild-grass-2': [4, 0],
  'wild-grass-3': [0, 1],
  'wild-water-1': [1, 1],
  'wild-water-2': [2, 1],
  'wild-water-3': [3, 1],
  'wild-electric-1': [4, 1],
  'wild-electric-2': [0, 2],
  'wild-electric-3': [1, 2],
  'wild-bug-1': [2, 2],
  'wild-bug-2': [3, 2],
  'wild-bug-3': [4, 2],
  'wild-stone-1': [0, 3],
  'wild-stone-2': [1, 3],
  'wild-charm-1': [2, 3],
  'wild-charm-2': [3, 3]
})

const SPRITE_FILE = 'monsters/manaevo-monsters-v1.webp'
const RAW_FALLBACK = 'https://raw.githubusercontent.com/syoudai0514/mana-evo/main/public/monsters/manaevo-monsters-v1.webp'

function localSpriteUrl() {
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    return `/mana-evo/${SPRITE_FILE}`
  }
  return `/${SPRITE_FILE}`
}

export function monsterSpriteStyle(speciesId) {
  const coord = COORDS[speciesId]
  if (!coord) return null
  const [col, row] = coord
  const x = COLS === 1 ? 0 : (col / (COLS - 1)) * 100
  const y = ROWS === 1 ? 0 : (row / (ROWS - 1)) * 100
  const local = localSpriteUrl()
  return {
    backgroundImage: `url("${local}"), url("${RAW_FALLBACK}")`,
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%, ${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${x}% ${y}%, ${x}% ${y}%`
  }
}
