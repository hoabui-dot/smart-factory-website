import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mapAuthFailure } from './authFailure.ts'

describe('mapAuthFailure', () => {
  it('maps APP_TYPE_NOT_ALLOWED_FOR_ROLE to blocked', () => {
    const result = mapAuthFailure({
      kind: 'api',
      code: 'APP_TYPE_NOT_ALLOWED_FOR_ROLE',
      message: 'Tài khoản không được phép đăng nhập ứng dụng này.',
    })
    assert.equal(result.status, 'blocked')
    assert.equal(result.errorCode, 'APP_TYPE_NOT_ALLOWED_FOR_ROLE')
  })

  it('maps ACCESS_TOKEN_EXPIRED to session_expired', () => {
    const result = mapAuthFailure({
      kind: 'api',
      code: 'ACCESS_TOKEN_EXPIRED',
      message: 'Token expired',
    })
    assert.equal(result.status, 'session_expired')
  })

  it('maps INVALID_ACCESS_TOKEN to session_expired', () => {
    const result = mapAuthFailure({
      kind: 'api',
      code: 'INVALID_ACCESS_TOKEN',
      message: 'Invalid token',
    })
    assert.equal(result.status, 'session_expired')
  })

  it('maps AuthError ACCESS_TOKEN_EXPIRED to session_expired', () => {
    const result = mapAuthFailure({
      kind: 'auth',
      code: 'ACCESS_TOKEN_EXPIRED',
      message: 'refresh failed',
    })
    assert.equal(result.status, 'session_expired')
  })

  it('maps invalid credentials to unauthenticated', () => {
    const result = mapAuthFailure({
      kind: 'auth',
      code: 'INVALID_CREDENTIALS',
      message: 'Sign-in failed',
    })
    assert.equal(result.status, 'unauthenticated')
    assert.equal(result.errorCode, 'INVALID_CREDENTIALS')
  })
})
