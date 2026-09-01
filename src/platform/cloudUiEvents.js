export const OPEN_ADULT_CLOUD_CONTROLS_EVENT = 'manaevo:open-adult-cloud-controls'

export function openAdultCloudControls() {
  if (typeof document === 'undefined') return
  // CloudAccountShell already exposes its launcher while ParentScreen is open.
  // Reuse that owned entry point rather than creating a second cloud modal owner.
  const clickLauncher = () => {
    const launcher = document.querySelector('.cloud-account-fab')
    if (!(launcher instanceof HTMLElement)) return false
    launcher.click()
    return true
  }
  if (clickLauncher()) return
  // MutationObserver in CloudAccountShell may still be publishing the Parent FAB
  // on the same paint that ParentScreen became visible. Retry briefly without
  // creating a second modal owner or new persistent state.
  window.requestAnimationFrame(() => {
    if (clickLauncher()) return
    window.setTimeout(clickLauncher, 80)
  })
}
