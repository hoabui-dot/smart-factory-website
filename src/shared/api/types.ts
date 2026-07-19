export type ApiErrorBody = {
  code: string
  message: string
  context?: Record<string, unknown>
}

export type ApiErrorEnvelope = {
  success: false
  error: ApiErrorBody
  request_id?: string
}

export class ApiError extends Error {
  readonly code: string
  readonly httpStatus: number
  readonly context?: Record<string, unknown>
  readonly requestId?: string

  constructor(
    code: string,
    message: string,
    httpStatus: number,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.httpStatus = httpStatus
    this.context = context
    this.requestId = requestId
  }
}

/** Session context from GET /api/auth/session (API-SPEC NB01-004). */
export type AppSessionContext = {
  user: {
    user_code: string
    full_name: string
  }
  roles: string[]
  locations: string[]
  app_type: string
  permissions: string[]
}
