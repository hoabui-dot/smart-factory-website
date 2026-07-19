import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'

import type { AuthClient, AuthSession, SignInCredentials } from './types'
import { AuthError } from './types'

function mapSession(session: Session | null): AuthSession | null {
  if (!session?.access_token) {
    return null
  }
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    email: session.user.email,
  }
}

export class SupabaseAuthClient implements AuthClient {
  private readonly client: SupabaseClient

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  async signInWithPassword(credentials: SignInCredentials): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword(credentials)
    if (error || !data.session) {
      throw new AuthError('INVALID_CREDENTIALS', error?.message ?? 'Sign-in failed')
    }
    const mapped = mapSession(data.session)
    if (!mapped) {
      throw new AuthError('INVALID_CREDENTIALS', 'Sign-in returned empty session')
    }
    return mapped
  }

  async refreshSession(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.refreshSession()
    if (error) {
      throw new AuthError('ACCESS_TOKEN_EXPIRED', error.message)
    }
    return mapSession(data.session)
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) {
      throw new AuthError('SIGNOUT_FAILED', error.message)
    }
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this.client.auth.getSession()
    return data.session?.access_token ?? null
  }

  onAuthStateChange(listener: (session: AuthSession | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(mapSession(session))
    })
    return () => {
      data.subscription.unsubscribe()
    }
  }
}
