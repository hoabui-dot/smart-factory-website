export type AuthSession = {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  email?: string
}

export type SignInCredentials = {
  email: string
  password: string
}

export interface AuthClient {
  signInWithPassword(credentials: SignInCredentials): Promise<AuthSession>
  refreshSession(): Promise<AuthSession | null>
  signOut(): Promise<void>
  getAccessToken(): Promise<string | null>
  onAuthStateChange(listener: (session: AuthSession | null) => void): () => void
}

export class AuthError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}
