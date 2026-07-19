import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  projectProductionLogRow,
  resolveProductionListState,
  resolveMutationUiState,
  validateVoidReason,
} from './productionLogProjection.ts'
import type { ProductionLogRecord } from '../types/productionLog.ts'

const draft: ProductionLogRecord = {
  id: 1,
  code: 'PL-0001',
  work_order_id: 10,
  operation_id: 20,
  operator_id: 5,
  shift_id: 1,
  good_qty: 100,
  scrap_qty: 2,
  rework_qty: 1,
  loss_qty: 0,
  started_at: '2026-07-18T01:00:00Z',
  recorded_at: '2026-07-18T01:05:00Z',
  status: 'DRAFT',
  work_order_code: 'WO-100',
  operation_code: 'OP-01',
  operator_code: 'EMP-01',
  shift_code: 'A',
  allowed_actions: [
    {
      action: 'void',
      method: 'POST',
      href: '/api/mes/production-logs/PL-0001/void',
      enabled: true,
    },
  ],
}

const posted: ProductionLogRecord = {
  ...draft,
  code: 'PL-0002',
  status: 'POSTED',
  ended_at: '2026-07-18T02:00:00Z',
  input_qty: 103,
  allowed_actions: [
    {
      action: 'void',
      method: 'POST',
      href: '/api/mes/production-logs/PL-0002/void',
      enabled: false,
      disabled_reason_code: 'PERMISSION_DENIED',
    },
  ],
}

describe('projectProductionLogRow', () => {
  it('projects business codes and gates void from server allowed_actions only', () => {
    const row = projectProductionLogRow(draft)
    assert.equal(row.code, 'PL-0001')
    assert.equal(row.workOrderLabel, 'WO-100')
    assert.equal(row.operationLabel, 'OP-01')
    assert.equal(row.operatorLabel, 'EMP-01')
    assert.equal(row.shiftLabel, 'A')
    assert.equal(row.canVoid, true)
    assert.equal(row.voidAction?.href, '/api/mes/production-logs/PL-0001/void')
  })

  it('does not infer void from POSTED status when server disables action', () => {
    const row = projectProductionLogRow(posted)
    assert.equal(row.status, 'POSTED')
    assert.equal(row.canVoid, false)
    assert.equal(row.voidDisabledReason, 'PERMISSION_DENIED')
  })

  it('does not enable void when allowed_actions omitted', () => {
    const row = projectProductionLogRow({ ...draft, allowed_actions: undefined })
    assert.equal(row.canVoid, false)
  })

  it('does not invent void_posted client action', () => {
    assert.equal(findAllowedAction(draft.allowed_actions, 'void_posted'), null)
    assert.equal(findAllowedAction(draft.allowed_actions, 'void')?.action, 'void')
  })
})

describe('resolveProductionListState', () => {
  it('maps empty and permission states', () => {
    assert.equal(
      resolveProductionListState({
        status: 'success',
        itemCount: 0,
        hasQuery: false,
        errorCode: null,
      }),
      'empty',
    )
    assert.equal(
      resolveProductionListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })
})

describe('validateVoidReason', () => {
  it('requires min 10 characters matching MES05-008', () => {
    assert.deepEqual(validateVoidReason('short'), ['void_reason'])
    assert.deepEqual(validateVoidReason('long enough reason'), [])
  })
})

describe('resolveMutationUiState', () => {
  it('surfaces confirm and error codes', () => {
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
