import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isSystemAdminSession,
  unwrapSuccessData,
} from '../../../shared/api/envelope.ts'

describe('unwrapSuccessData', () => {
  it('unwraps success envelope data', () => {
    const data = unwrapSuccessData<{ items: number[] }>({
      success: true,
      data: { items: [1, 2] },
    })
    assert.deepEqual(data, { items: [1, 2] })
  })

  it('returns bare payload when envelope is absent', () => {
    const data = unwrapSuccessData<{ code: string }>({ code: 'ACTIVITY-EVENTS-0001' })
    assert.equal(data.code, 'ACTIVITY-EVENTS-0001')
  })
})

describe('isSystemAdminSession', () => {
  it('requires system_admin role code', () => {
    assert.equal(isSystemAdminSession({ roles: ['system_admin'] }), true)
    assert.equal(isSystemAdminSession({ roles: ['production_manager'] }), false)
    assert.equal(isSystemAdminSession(null), false)
  })
})
