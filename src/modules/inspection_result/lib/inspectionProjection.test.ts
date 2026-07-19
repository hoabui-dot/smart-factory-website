import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  projectInspectionResultRow,
  resolveInspectionListState,
  resolveMutationUiState,
  validateVoidReason,
} from './inspectionProjection.ts'
import type { InspectionResultRecord } from '../types/inspectionResult.ts'

const draft: InspectionResultRecord = {
  id: 1,
  code: 'IR-0001',
  plan_id: 10,
  inspection_stage_id: 1,
  sample_size: 5,
  inspector_id: 9,
  status: 'DRAFT',
  is_retest: false,
  inspection_plan_code: 'IP-IQC-1',
  inspection_stage_code: 'IQC',
  lot_code: 'LOT-1',
  allowed_actions: [
    { action: 'void', method: 'POST', href: '/api/qms/inspection-results/IR-0001/void', enabled: true },
  ],
}

const voided: InspectionResultRecord = {
  ...draft,
  code: 'IR-0002',
  status: 'VOIDED',
  allowed_actions: [
    {
      action: 'void',
      method: 'POST',
      href: '/api/qms/inspection-results/IR-0002/void',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

describe('projectInspectionResultRow', () => {
  it('projects business codes and gates void from server allowed_actions only', () => {
    const row = projectInspectionResultRow(draft)
    assert.equal(row.planLabel, 'IP-IQC-1')
    assert.equal(row.stageLabel, 'IQC')
    assert.equal(row.lotLabel, 'LOT-1')
    assert.equal(row.canVoid, true)
    assert.equal(row.voidAction?.href, '/api/qms/inspection-results/IR-0001/void')
  })

  it('projects work_order_code and finished_lot_code for production stages (QMS-02b)', () => {
    const row = projectInspectionResultRow({
      ...draft,
      inspection_stage_code: 'FQC',
      work_order_code: 'WO-200',
      finished_lot_code: 'FG-LOT-9',
      lot_code: undefined,
    })
    assert.equal(row.stageLabel, 'FQC')
    assert.equal(row.workOrderLabel, 'WO-200')
    assert.equal(row.finishedLotLabel, 'FG-LOT-9')
    assert.equal(row.lotLabel, '-')
  })

  it('does not infer void from status when server disables action', () => {
    const row = projectInspectionResultRow(voided)
    assert.equal(row.canVoid, false)
    assert.equal(row.voidDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('does not enable void when allowed_actions omitted', () => {
    const row = projectInspectionResultRow({ ...draft, allowed_actions: undefined })
    assert.equal(row.canVoid, false)
  })
})

describe('findAllowedAction', () => {
  it('resolves void envelope', () => {
    assert.equal(findAllowedAction(draft.allowed_actions, 'void')?.enabled, true)
    assert.equal(findAllowedAction(undefined, 'void'), null)
  })
})

describe('resolveInspectionListState', () => {
  it('maps states', () => {
    assert.equal(
      resolveInspectionListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveInspectionListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveInspectionListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveInspectionListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })
})

describe('resolveMutationUiState / validateVoidReason', () => {
  it('requires reason and confirm', () => {
    assert.deepEqual(validateVoidReason(''), ['void_reason'])
    assert.deepEqual(validateVoidReason('sai lot'), [])
    assert.equal(resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }), 'confirm')
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'NOT_ALLOWED_BY_STATUS' }),
      'not-allowed',
    )
  })
})
