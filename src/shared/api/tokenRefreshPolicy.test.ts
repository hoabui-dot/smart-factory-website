import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { shouldAttemptTokenRefresh } from './tokenRefreshPolicy.ts'

describe('shouldAttemptTokenRefresh', () => {
  it('retries once for ACCESS_TOKEN_EXPIRED', () => {
    assert.equal(shouldAttemptTokenRefresh('ACCESS_TOKEN_EXPIRED', false), true)
  })

  it('does not retry a second time', () => {
    assert.equal(shouldAttemptTokenRefresh('ACCESS_TOKEN_EXPIRED', true), false)
  })

  it('does not refresh for INVALID_ACCESS_TOKEN', () => {
    assert.equal(shouldAttemptTokenRefresh('INVALID_ACCESS_TOKEN', false), false)
  })

  it('does not refresh for AUTHENTICATION_REQUIRED', () => {
    assert.equal(shouldAttemptTokenRefresh('AUTHENTICATION_REQUIRED', false), false)
  })
})
