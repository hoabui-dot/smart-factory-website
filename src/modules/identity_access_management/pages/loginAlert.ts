export type LoginAlert = {
  code: string
  message: string
}

type LoginAlertInput = {
  status: string
  errorCode: string | null
  errorMessage: string | null
}

const SESSION_EXPIRED_MESSAGE =
  'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'

const BLOCKED_MESSAGE = 'Tài khoản không được phép đăng nhập ứng dụng Web.'

const INVALID_CREDENTIALS_MESSAGE = 'Email hoặc mật khẩu không đúng.'

/**
 * Maps auth store state to login-page alert copy (logic uses error.code, not message parsing).
 */
export function resolveLoginAlert(input: LoginAlertInput): LoginAlert | null {
  if (input.status === 'session_expired') {
    return {
      code: input.errorCode ?? 'ACCESS_TOKEN_EXPIRED',
      message: SESSION_EXPIRED_MESSAGE,
    }
  }

  if (input.status === 'blocked') {
    return {
      code: input.errorCode ?? 'APP_TYPE_NOT_ALLOWED_FOR_ROLE',
      message: input.errorMessage ?? BLOCKED_MESSAGE,
    }
  }

  if (!input.errorCode) {
    return null
  }

  if (input.errorCode === 'INVALID_CREDENTIALS') {
    return {
      code: input.errorCode,
      message: input.errorMessage ?? INVALID_CREDENTIALS_MESSAGE,
    }
  }

  return {
    code: input.errorCode,
    message: input.errorMessage ?? 'Không thể đăng nhập. Vui lòng thử lại.',
  }
}
