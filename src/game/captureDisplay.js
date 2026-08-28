export const CAPTURE_DISPLAY = Object.freeze({
  star: { label: 'ほしボール', shortLabel: 'ほし', theme: 'star' },
  silver: { label: 'ぎんボール', shortLabel: 'ぎん', theme: 'silver' },
  gold: { label: 'きんボール', shortLabel: 'きん', theme: 'gold' },
  rainbow: { label: 'にじボール', shortLabel: 'にじ', theme: 'rainbow' }
})

export function captureDisplayOf(itemType) {
  return CAPTURE_DISPLAY[itemType] || CAPTURE_DISPLAY.star
}
