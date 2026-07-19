import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { projectChangeRequestRow, resolveListState } from './changeRequestProjection.ts'
import type { ChangeRequestRecord } from '../types/changeRequest.ts'

const draft: ChangeRequestRecord = {
  id: 1,
  code: 'ECR-1',
  change_type: 'BOM_REV',
  reason: 'Fix BOM',
  requested_by: 1,
  requested_at: '2026-07-18T01:00:00Z',
  impact_customer: false,
  impact_assessment: 'none',
  status: 'DRAFT',
  target_item_code: 'ITM-1',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/mes/change-requests/ECR-1', enabled: true },
    { action: 'submit', method: 'POST', href: '/api/mes/change-requests/ECR-1/submit', enabled: true },
    {
      action: 'approve',
      method: 'POST',
      href: '/api/mes/change-requests/ECR-1/approve',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

describe('projectChangeRequestRow', () => {
  it('gates lifecycle from allowed_actions only', () => {
    const row = projectChangeRequestRow(draft)
    assert.equal(row.itemLabel, 'ITM-1')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canSubmit, true)
    assert.equal(row.canApprove, false)
  })

  it('does not invent actions from DRAFT status alone', () => {
    const row = projectChangeRequestRow({ ...draft, allowed_actions: undefined })
    assert.equal(row.canSubmit, false)
    assert.equal(row.canUpdate, false)
  })
})

describe('resolveListState', () => {
  it('maps empty and permission', () => {
    assert.equal(
      resolveListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })
})
