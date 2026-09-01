export const OPEN_ADULT_CLOUD_CONTROLS_EVENT = 'manaevo:open-adult-cloud-controls'

export function openAdultCloudControls() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(OPEN_ADULT_CLOUD_CONTROLS_EVENT))
}
