export const LAYOUT_SURFACES = Object.freeze({
  COMPACT: 'compact',
  WORKSPACE: 'workspace',
  CONTEXTUAL: 'contextual'
})

const workspaceViews = new Set(['activity', 'free', 'review', 'trial', 'dictionary', 'parent'])

export function layoutSurfaceForApp({ view, activeBattle = false, monsterSurface = LAYOUT_SURFACES.COMPACT } = {}) {
  if (activeBattle) return LAYOUT_SURFACES.CONTEXTUAL
  if (view === 'monsters') {
    return monsterSurface === LAYOUT_SURFACES.WORKSPACE
      ? LAYOUT_SURFACES.WORKSPACE
      : LAYOUT_SURFACES.COMPACT
  }
  return workspaceViews.has(view) ? LAYOUT_SURFACES.WORKSPACE : LAYOUT_SURFACES.COMPACT
}
