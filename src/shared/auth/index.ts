import { SupabaseAuthClient } from './supabaseAuthImpl'
import type { AuthClient } from './types'
import { AuthError } from './types'

export type { AuthClient, AuthSession, SignInCredentials } from './types'
export { AuthError }

function createAuthClient(): AuthClient {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co'
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'example-anon-key'
  return new SupabaseAuthClient(url, anonKey)
}

export const authClient: AuthClient = createAuthClient()
