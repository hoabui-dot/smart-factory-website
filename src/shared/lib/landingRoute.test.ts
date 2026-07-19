import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isSafeInternalPath, resolveLandingRoute } from './landingRoute.ts'

describe('resolveLandingRoute', () => {
  it('prefers safe returnUrl over role default', () => {
    assert.equal(
      resolveLandingRoute(['system_admin'], '/web/admin/users'),
      '/web/admin/users',
    )
  })

  it('maps system_admin to /admin', () => {
    assert.equal(resolveLandingRoute(['system_admin']), '/admin')
  })

  it('maps director to /dashboard', () => {
    assert.equal(resolveLandingRoute(['director']), '/dashboard')
  })

  it('maps viewer to /reports', () => {
    assert.equal(resolveLandingRoute(['viewer']), '/reports')
  })

  it('maps operational managers to My Work', () => {
    assert.equal(resolveLandingRoute(['production_manager']), '/web/shared/my-work')
    assert.equal(resolveLandingRoute(['warehouse_manager']), '/web/shared/my-work')
    assert.equal(resolveLandingRoute(['qc_manager']), '/web/shared/my-work')
  })

  it('rejects external returnUrl', () => {
    assert.equal(isSafeInternalPath('https://evil.example'), false)
    assert.equal(isSafeInternalPath('//evil.example'), false)
    assert.equal(resolveLandingRoute(['system_admin'], '//evil'), '/admin')
  })
})
