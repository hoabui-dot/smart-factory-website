import { useAuthStore } from '@/shared/store/authStore'
import type { SignInCredentials } from '@/shared/auth'

/**
 * Module-facing login hook — business code must not import @supabase/supabase-js.
 */
export function useLogin() {
  const status = useAuthStore((s) => s.status)
  const errorCode = useAuthStore((s) => s.errorCode)
  const errorMessage = useAuthStore((s) => s.errorMessage)
  const session = useAuthStore((s) => s.session)
  const signIn = useAuthStore((s) => s.signIn)
  const clearError = useAuthStore((s) => s.clearError)

  return {
    status,
    errorCode,
    errorMessage,
    session,
    clearError,
    signIn: (credentials: SignInCredentials) => signIn(credentials),
    isBusy: status === 'authenticating' || status === 'bootstrapping',
  }
}
