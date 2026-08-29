import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildOAuthAuthorizeUrl } from '../src/platform/sharedSupabaseRest.js'

test('Google OAuth authorize URL is restricted to the supported provider and preserves the app return URL', () => {
  const url = new URL(buildOAuthAuthorizeUrl('https://example.supabase.co/', 'google', 'https://mana-evo.vercel.app/'))
  assert.equal(url.origin, 'https://example.supabase.co')
  assert.equal(url.pathname, '/auth/v1/authorize')
  assert.equal(url.searchParams.get('provider'), 'google')
  assert.equal(url.searchParams.get('redirect_to'), 'https://mana-evo.vercel.app/')
  assert.throws(() => buildOAuthAuthorizeUrl('https://example.supabase.co', 'github', 'https://mana-evo.vercel.app/'), /未対応/)
})

test('parent account UI separates Google sign-in from ManaEvo password credentials', () => {
  const source = fs.readFileSync(new URL('../src/platform/CloudAccountShell.jsx', import.meta.url), 'utf8')
  assert.match(source, />Googleでログイン</)
  assert.match(source, /ManaEvo用パスワード/)
  assert.match(source, /Googleアカウントのパスワードを入力しないでください/)
  assert.match(source, /getAuthProviderAvailability/)
  assert.match(source, /beginGoogleSignIn/)
})
