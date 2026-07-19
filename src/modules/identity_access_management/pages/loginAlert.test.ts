import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveLoginAlert } from '../pages/loginAlert.ts'

describe('resolveLoginAlert', () => {
  it('shows session expired copy for session_expired', () => {
    const alert = resolveLoginAlert({
      status: 'session_expired',
      errorCode: 'ACCESS_TOKEN_EXPIRED',
      errorMessage: null,
    })
    assert.equal(alert?.code, 'ACCESS_TOKEN_EXPIRED')
    assert.match(alert?.message ?? '', /hết hạn|đăng nhập lại/i)
  })

  it('shows blocked copy for APP_TYPE_NOT_ALLOWED_FOR_ROLE', () => {
    const alert = resolveLoginAlert({
      status: 'blocked',
      errorCode: 'APP_TYPE_NOT_ALLOWED_FOR_ROLE',
      errorMessage: 'Tài khoản không được phép đăng nhập ứng dụng này.',
    })
    assert.equal(alert?.code, 'APP_TYPE_NOT_ALLOWED_FOR_ROLE')
    assert.match(alert?.message ?? '', /không được phép/)
  })

  it('prefers store errorMessage for invalid credentials', () => {
    const alert = resolveLoginAlert({
      status: 'unauthenticated',
      errorCode: 'INVALID_CREDENTIALS',
      errorMessage: 'Email hoặc mật khẩu không đúng.',
    })
    assert.equal(alert?.message, 'Email hoặc mật khẩu không đúng.')
  })
})
