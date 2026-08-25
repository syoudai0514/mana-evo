export const TOP_LEVEL_CHILD_VIEWS = Object.freeze(['home', 'study', 'adventure', 'monsters', 'howto'])
export const FOCUSED_APP_VIEWS = Object.freeze(['activity', 'free', 'review', 'trial', 'dictionary', 'parent'])
export const CONTEXTUAL_CHILD_FLOWS = Object.freeze(['battle', 'capture', 'dex', 'evolution'])

const topLevelViewSet = new Set(TOP_LEVEL_CHILD_VIEWS)
const focusedViewSet = new Set(FOCUSED_APP_VIEWS)

export function isTopLevelChildView(view) {
  return topLevelViewSet.has(view)
}

export function isFocusedAppView(view) {
  return focusedViewSet.has(view)
}

export function shouldShowTopLevelNavigation(view, { activeBattle = false } = {}) {
  return isTopLevelChildView(view) && !activeBattle
}
