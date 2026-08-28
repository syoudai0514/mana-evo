// Browser-safe bootstrap for the shared personal-app Supabase project.
// No service-role/secret key is shipped in the app. The public bootstrap endpoint
// returns only the browser-safe anonymous key; table authorization is enforced by RLS.
export const SHARED_SUPABASE_URL = 'https://wdwbmvpipbdpomqulsrj.supabase.co'
export const SHARED_SUPABASE_BOOTSTRAP_URL = `${SHARED_SUPABASE_URL}/functions/v1/public-client-config`
export const SHARED_SUPABASE_BOOTSTRAP_HEADER = 'mana-evo-public-bootstrap-v1'
