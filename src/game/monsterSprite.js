import spriteUrl from './manaevo-monsters-v3.webp'

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

export function monsterSpriteFrame(speciesId) {
  const coord = COORDS[speciesId]
  if (!coord) return null
  const [col, row] = coord
  return {
    src: spriteUrl,
    fallbackSrc: spriteUrl,
    col,
    row,
    cols: COLS,
    rows: ROWS
  }
}
