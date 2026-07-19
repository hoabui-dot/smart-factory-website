import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  projectGoodsIssueRow,
  projectMaterialRequestRow,
  resolveListState,
  resolveMutationUiState,
  validateReason,
} from './goodsIssueProjection.ts'
import type { GoodsIssueRecord, MaterialRequestRecord } from '../types/goodsIssue.ts'

const pendingMr: MaterialRequestRecord = {
  id: 1,
  code: 'MR-0001',
  work_order_id: 10,
  item_id: 2,
  required_qty: 5,
  uom_id: 3,
  target_location_id: 4,
  status: 'PENDING',
  created_by: 9,
  item_code: 'ITM-A',
  item_name: 'Steel',
  uom_code: 'KG',
  target_location_code: 'BIN-01',
  work_order_code: 'WO-100',
  allowed_actions: [
    {
      action: 'cancel',
      method: 'POST',
      href: '/api/wms/material-requests/MR-0001/cancel',
      enabled: true,
    },
  ],
}

const issuedMr: MaterialRequestRecord = {
  ...pendingMr,
  code: 'MR-0002',
  status: 'ISSUED',
  allowed_actions: [
    {
      action: 'cancel',
      method: 'POST',
      href: '/api/wms/material-requests/MR-0002/cancel',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

const pendingGi: GoodsIssueRecord = {
  id: 1,
  code: 'GI-0001',
  transaction_type_code: 'TRANSFER',
  reference_type: 'MATERIAL_REQUEST',
  reference_id: 99,
  performed_by: 7,
  performed_at: '2026-07-18T01:00:00Z',
  status: 'PENDING_APPROVAL',
  device_code_snapshot: 'PDA-1',
  lines: [
    {
      code: 'GIL-1',
      item_code: 'ITM-A',
      lot_code: 'LOT-1',
      from_location_code: 'WH-A',
      to_location_code: 'LINE-1',
      qty: 5,
      uom_code: 'KG',
    },
  ],
  allowed_actions: [
    {
      action: 'approve',
      method: 'POST',
      href: '/api/wms/goods-issues/GI-0001/approve',
      enabled: true,
    },
    {
      action: 'reject',
      method: 'POST',
      href: '/api/wms/goods-issues/GI-0001/reject',
      enabled: true,
    },
  ],
}

const postedGi: GoodsIssueRecord = {
  ...pendingGi,
  code: 'GI-0002',
  status: 'POSTED',
  approved_by: 8,
  allowed_actions: [
    {
      action: 'approve',
      method: 'POST',
      href: '/api/wms/goods-issues/GI-0002/approve',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'reject',
      method: 'POST',
      href: '/api/wms/goods-issues/GI-0002/reject',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

describe('projectMaterialRequestRow', () => {
  it('projects business codes and gates cancel from server allowed_actions only', () => {
    const row = projectMaterialRequestRow(pendingMr)
    assert.equal(row.workOrderLabel, 'WO-100')
    assert.equal(row.itemLabel, 'ITM-A · Steel')
    assert.equal(row.targetLocationLabel, 'BIN-01')
    assert.equal(row.canCancel, true)
    assert.equal(row.cancelAction?.href, '/api/wms/material-requests/MR-0001/cancel')
  })

  it('does not infer cancel from status when server disables action', () => {
    const row = projectMaterialRequestRow(issuedMr)
    assert.equal(row.canCancel, false)
    assert.equal(row.cancelDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('does not enable cancel when allowed_actions omitted', () => {
    const row = projectMaterialRequestRow({ ...pendingMr, allowed_actions: undefined })
    assert.equal(row.canCancel, false)
  })
})

describe('projectGoodsIssueRow', () => {
  it('projects codes/lines and gates approve/reject from allowed_actions only', () => {
    const row = projectGoodsIssueRow(pendingGi)
    assert.equal(row.transactionTypeLabel, 'TRANSFER')
    assert.equal(row.referenceLabel, 'MATERIAL_REQUEST')
    assert.equal(row.performedByLabel, 'User #7')
    assert.equal(row.lineRows[0]?.lotLabel, 'LOT-1')
    assert.equal(row.canApprove, true)
    assert.equal(row.canReject, true)
    assert.equal(row.approveAction?.href, '/api/wms/goods-issues/GI-0001/approve')
  })

  it('never renders raw reference_id as a business code', () => {
    const row = projectGoodsIssueRow(pendingGi)
    assert.equal(row.referenceLabel.includes('99'), false)
  })

  it('does not infer approve/reject from status when server disables', () => {
    const row = projectGoodsIssueRow(postedGi)
    assert.equal(row.canApprove, false)
    assert.equal(row.canReject, false)
    assert.equal(row.approveDisabledReason, 'NOT_ALLOWED_BY_STATUS')
    assert.equal(row.approvedByLabel, 'User #8')
  })

  it('does not enable mutations when allowed_actions omitted', () => {
    const row = projectGoodsIssueRow({ ...pendingGi, allowed_actions: undefined })
    assert.equal(row.canApprove, false)
    assert.equal(row.canReject, false)
  })
})

describe('findAllowedAction', () => {
  it('resolves cancel/approve envelopes', () => {
    assert.equal(findAllowedAction(pendingMr.allowed_actions, 'cancel')?.enabled, true)
    assert.equal(findAllowedAction(pendingGi.allowed_actions, 'approve')?.enabled, true)
    assert.equal(findAllowedAction(undefined, 'cancel'), null)
  })
})

describe('resolveListState / resolveMutationUiState / validateReason', () => {
  it('maps list and mutation states; requires reason for cancel/reject', () => {
    assert.equal(
      resolveListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
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
    assert.deepEqual(validateReason(''), ['reason'])
    assert.deepEqual(validateReason('PDA stuck'), [])
    assert.equal(
      resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }),
      'confirm',
    )
    assert.equal(
      resolveMutationUiState({
        confirmOpen: false,
        status: 'error',
        errorCode: 'NOT_ALLOWED_BY_STATUS',
      }),
      'not-allowed',
    )
  })
})
