import { create } from 'zustand'

import { fetchAppSession, type AppSessionContext, ApiError } from '@/shared/api'
import { authClient, AuthError, type SignInCredentials } from '@/shared/auth'

import { mapAuthFailure, type AuthStatus } from './authFailure'

type AuthState = {
  status: AuthStatus
  session: AppSessionContext | null
  errorCode: string | null
  errorMessage: string | null
  bootstrap: () => Promise<void>
  signIn: (credentials: SignInCredentials) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

type SessionClearHandler = () => void

let onSessionCleared: SessionClearHandler | null = null

/** Register React Query / cache clear hook used on logout and forced session clear. */
export function setSessionClearedHandler(handler: SessionClearHandler | null): void {
  onSessionCleared = handler
}

function clearProtectedCaches(): void {
  onSessionCleared?.()
}

function failureFromUnknown(error: unknown): ReturnType<typeof mapAuthFailure> {
  if (error instanceof ApiError) {
    return mapAuthFailure({ kind: 'api', code: error.code, message: error.message })
  }
  if (error instanceof AuthError) {
    return mapAuthFailure({ kind: 'auth', code: error.code, message: error.message })
  }
  return mapAuthFailure({
    kind: 'unknown',
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'Không thể khởi tạo phiên đăng nhập.',
  })
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  session: null,
  errorCode: null,
  errorMessage: null,
  clearError: () => set({ errorCode: null, errorMessage: null }),
  bootstrap: async () => {
    set({ status: 'booting', errorCode: null, errorMessage: null })
    try {
      const token = await authClient.getAccessToken()
      if (!token) {
        set({ status: 'unauthenticated', session: null })
        return
      }
      set({ status: 'bootstrapping' })
      const session = await fetchAppSession()
      set({ status: 'ready', session, errorCode: null, errorMessage: null })
    } catch (error) {
      try {
        await authClient.signOut()
      } catch {
        /* ignore */
      }
      clearProtectedCaches()
      set({ session: null, ...failureFromUnknown(error) })
    }
  },
  signIn: async (credentials) => {
    set({ status: 'authenticating', errorCode: null, errorMessage: null })
    try {
      await authClient.signInWithPassword(credentials)
      set({ status: 'bootstrapping' })
      const session = await fetchAppSession()
      set({ status: 'ready', session, errorCode: null, errorMessage: null })
    } catch (error) {
      try {
        await authClient.signOut()
      } catch {
        /* ignore */
      }
      clearProtectedCaches()
      set({ session: null, ...failureFromUnknown(error) })
      throw error
    }
  },
  signOut: async () => {
    try {
      await authClient.signOut()
    } finally {
      clearProtectedCaches()
      set({
        status: 'unauthenticated',
        session: null,
        errorCode: null,
        errorMessage: null,
      })
    }
  },
}))

export type { AuthStatus }
