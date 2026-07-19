export type AuthStatus =
  | 'booting'
  | 'unauthenticated'
  | 'authenticating'
  | 'bootstrapping'
  | 'ready'
  | 'blocked'
  | 'session_expired'

export type AuthFailureInput = {
  kind: 'api' | 'auth' | 'unknown'
  code: string
  message: string
}

export type AuthFailureResult = {
  status: AuthStatus
  errorCode: string | null
  errorMessage: string | null
}

const SESSION_CLEAR_CODES = new Set([
  'ACCESS_TOKEN_EXPIRED',
  'INVALID_ACCESS_TOKEN',
  'AUTHENTICATION_REQUIRED',
])

export function mapAuthFailure(error: AuthFailureInput): AuthFailureResult {
  if (error.kind === 'api' && error.code === 'APP_TYPE_NOT_ALLOWED_FOR_ROLE') {
    return {
      status: 'blocked',
      errorCode: error.code,
      errorMessage: error.message,
    }
  }

  if (SESSION_CLEAR_CODES.has(error.code)) {
    return {
      status: 'session_expired',
      errorCode: error.code,
      errorMessage: error.message,
    }
  }

  if (error.kind === 'unknown') {
    return {
      status: 'unauthenticated',
      errorCode: 'DEPENDENCY_UNAVAILABLE',
      errorMessage: 'Không thể khởi tạo phiên đăng nhập.',
    }
  }

  return {
    status: 'unauthenticated',
    errorCode: error.code,
    errorMessage: error.message,
  }
}
