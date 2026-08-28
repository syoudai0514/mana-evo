// Browser-safe public configuration for the shared personal-app Supabase project.
// Values are injected by the deployment environment; keep secret/service-role keys out of this repository.
export const SHARED_SUPABASE_URL = String(import.meta.env.VITE_SHARED_SUPABASE_URL || '')
export const SHARED_SUPABASE_PUBLISHABLE_KEY = String(import.meta.env.VITE_SHARED_SUPABASE_PUBLISHABLE_KEY || '')
