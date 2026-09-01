export const OPEN_ADULT_CLOUD_CONTROLS_EVENT = 'manaevo:open-adult-cloud-controls'

export function openAdultCloudControls() {
  if (typeof document === 'undefined') return
  // CloudAccountShell already exposes its launcher while ParentScreen is open.
  // Reuse that owned entry point rather than creating a second cloud modal owner.
  const launcher = document.querySelector('.cloud-account-fab')
  if (launcher instanceof HTMLElement) launcher.click()
}
