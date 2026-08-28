import fs from 'node:fs/promises'

const projectUrl = 'https://wdwbmvpipbdpomqulsrj.supabase.co'
const endpoint = `${projectUrl}/functions/v1/public-client-config`
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 8000)

try {
  const response = await fetch(endpoint, {
    headers: { 'x-app-config-bootstrap': 'mana-evo-public-bootstrap-v1' },
    signal: controller.signal
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || data?.url !== projectUrl || typeof data?.key !== 'string' || !data.key) {
    throw new Error(`shared cloud bootstrap failed (${response.status})`)
  }
  const content = [
    `VITE_SHARED_SUPABASE_URL=${data.url}`,
    `VITE_SHARED_SUPABASE_PUBLISHABLE_KEY=${data.key}`,
    ''
  ].join('\n')
  await fs.writeFile('.env.local', content, { mode: 0o600 })
  console.log('Shared cloud public config ready')
} finally {
  clearTimeout(timeout)
}
