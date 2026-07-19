import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  projectApprovalItem,
  projectSearchHit,
  resolveApprovalListState,
} from './approvalInboxProjection.ts'

describe('approvalInboxProjection', () => {
  it('gates approve/reject only from server allowed_actions strings', () => {
    const row = projectApprovalItem({
      approval_key: 'WMS-05:stocktake:ST-1',
      source_module: 'WMS-05',
      source_entity_type: 'stocktake',
      source_entity_code: 'ST-1',
      source_version: '3',
      title: 'Stocktake ST-1',
      requested_at: '2026-07-18T01:00:00Z',
      allowed_actions: ['APPROVE'],
    })
    assert.equal(row.canApprove, true)
    assert.equal(row.canReject, false)
    assert.equal(row.sourceLabel, 'WMS-05 · stocktake · ST-1')
  })

  it('accepts only internal /web/ search routes', () => {
    assert.equal(
      projectSearchHit({
        result_type: 'work_order',
        source_module: 'MES-04',
        business_code: 'WO-1',
        label: 'WO-1',
        route: '/web/mes/work-orders',
      }).deepLink,
      '/web/mes/work-orders',
    )
    assert.equal(
      projectSearchHit({
        result_type: 'lot',
        source_module: 'WMS-02',
        business_code: 'LOT-1',
        label: 'LOT-1',
        route: 'https://evil.example',
      }).deepLink,
      null,
    )
  })

  it('maps list states', () => {
    assert.equal(resolveApprovalListState('success', 0, false, null), 'empty')
    assert.equal(resolveApprovalListState('success', 0, true, null), 'no-result')
    assert.equal(
      resolveApprovalListState('error', 0, false, 'PERMISSION_DENIED'),
      'permission-denied',
    )
  })
})
