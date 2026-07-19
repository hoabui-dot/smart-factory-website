import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  parseEvidenceFileIds,
  projectCapaRow,
  projectNcrRow,
  projectParetoRows,
  resolveMutationUiState,
  resolveNcrListState,
  resolveParetoState,
  validateCloseEvidence,
  validateContainForm,
  validateNcrCreateForm,
  validateVoidReason,
} from './ncrProjection.ts'
import type { CapaRecord, NcrRecord } from '../types/ncr.ts'

const openNcr: NcrRecord = {
  id: 1,
  code: 'NCR-2026-07-0001',
  source: 'IQC',
  item_id: 10,
  defect_code_id: 20,
  qty_affected: 5,
  severity: 'MAJOR',
  opened_by: 42,
  opened_at: '2026-07-18T08:00:00Z',
  updated_at: '2026-07-18T08:00:00Z',
  status: 'OPEN',
  item_code: 'RAW-001',
  lot_code: 'LOT-001',
  defect_code: 'DEF-CRACK',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/qms/ncr/NCR-2026-07-0001', enabled: true },
    {
      action: 'start_investigation',
      method: 'POST',
      href: '/api/qms/ncr/NCR-2026-07-0001/start-investigation',
      enabled: true,
    },
    { action: 'void', method: 'POST', href: '/api/qms/ncr/NCR-2026-07-0001/void', enabled: true },
  ],
}

describe('projectNcrRow', () => {
  it('gates mutations strictly from allowed_actions, never status alone', () => {
    const row = projectNcrRow(openNcr)
    assert.equal(row.canUpdate, true)
    assert.equal(row.canStartInvestigation, true)
    assert.equal(row.canVoid, true)
    assert.equal(row.canContain, false)
    assert.equal(row.itemLabel, 'RAW-001')
    assert.equal(row.lotLabel, 'LOT-001')
    assert.equal(row.defectLabel, 'DEF-CRACK')
    assert.equal(row.openedByLabel, 'User #42')
  })

  it('disables update when server marks update disabled', () => {
    const closed: NcrRecord = {
      ...openNcr,
      status: 'CLOSED',
      allowed_actions: [
        {
          action: 'update',
          method: 'PATCH',
          href: '/api/qms/ncr/NCR-2026-07-0001',
          enabled: false,
          disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
        },
      ],
    }
    const row = projectNcrRow(closed)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canVoid, false)
    assert.equal(row.canClose, false)
  })

  it('does not invent contain from INVESTIGATING without allowed_actions', () => {
    const row = projectNcrRow({
      ...openNcr,
      status: 'INVESTIGATING',
      allowed_actions: [],
    })
    assert.equal(row.canContain, false)
    assert.equal(row.canStartInvestigation, false)
  })
})

describe('projectCapaRow', () => {
  it('projects ncr_code and update gate from allowed_actions', () => {
    const capa: CapaRecord = {
      id: 9,
      code: 'CAPA-001',
      ncr_id: 1,
      root_cause: 'Root',
      corrective_action: 'Fix',
      preventive_action: 'Prevent',
      owner_id: 7,
      due_date: '2026-08-01',
      effectiveness: 'PENDING_VERIFY',
      created_at: '2026-07-18T08:00:00Z',
      updated_at: '2026-07-18T08:00:00Z',
      ncr_code: 'NCR-2026-07-0001',
      allowed_actions: [
        { action: 'update', method: 'PATCH', href: '/api/qms/capas/CAPA-001', enabled: true },
      ],
    }
    const row = projectCapaRow(capa)
    assert.equal(row.ncrLabel, 'NCR-2026-07-0001')
    assert.equal(row.canUpdate, true)
    assert.equal(row.ownerLabel, 'User #7')
  })
})

describe('projectParetoRows / resolveParetoState', () => {
  it('projects pareto buckets and maps list states', () => {
    const rows = projectParetoRows({
      group_by: 'defect_code',
      total_qty: 10,
      rows: [
        { group_key: 'DEF-1', group_label: 'Scratch', qty: 6, pct: 60, cum_pct: 60 },
        { group_key: 'DEF-2', group_label: 'Dent', qty: 4, pct: 40, cum_pct: 100 },
      ],
    })
    assert.equal(rows.length, 2)
    assert.equal(rows[0]?.groupKey, 'DEF-1')
    assert.equal(rows[0]?.pct, '60.00%')
    assert.equal(
      resolveParetoState({ status: 'success', rowCount: 0, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveParetoState({ status: 'error', rowCount: 0, errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
  })
})

describe('findAllowedAction', () => {
  it('returns matching action or null', () => {
    assert.equal(findAllowedAction(openNcr.allowed_actions, 'void')?.action, 'void')
    assert.equal(findAllowedAction(openNcr.allowed_actions, 'close'), null)
  })
})

describe('resolveNcrListState', () => {
  it('maps loading/empty/permission/error/ready', () => {
    assert.equal(
      resolveNcrListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveNcrListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveNcrListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveNcrListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveNcrListState({ status: 'success', itemCount: 1, hasQuery: false, errorCode: null }),
      'ready',
    )
  })
})

describe('resolveMutationUiState', () => {
  it('maps confirm/pending/permission/not-allowed', () => {
    assert.equal(
      resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }),
      'confirm',
    )
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'pending', errorCode: null }),
      'pending',
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

describe('validators', () => {
  it('validateNcrCreateForm requires source/item/defect/qty', () => {
    assert.deepEqual(
      validateNcrCreateForm({ source: '', item_code: '', defect_code: '', qty_affected: 0 }),
      ['source', 'item_code', 'defect_code', 'qty_affected'],
    )
    assert.deepEqual(
      validateNcrCreateForm({
        source: 'IQC',
        item_code: 'RAW-001',
        defect_code: 'DEF-1',
        qty_affected: 2,
      }),
      [],
    )
  })

  it('validateVoidReason / contain / close evidence', () => {
    assert.deepEqual(validateVoidReason(''), ['reason'])
    assert.deepEqual(validateVoidReason('opened by mistake'), [])
    assert.deepEqual(
      validateContainForm({ disposition: '', lot_code: '', qty: 0 }),
      ['disposition', 'lot_code', 'qty'],
    )
    assert.deepEqual(validateCloseEvidence([]), ['evidence_file_ids'])
    assert.deepEqual(validateCloseEvidence([1, 2]), [])
  })

  it('parseEvidenceFileIds', () => {
    assert.deepEqual(parseEvidenceFileIds('1, 2 3'), [1, 2, 3])
    assert.deepEqual(parseEvidenceFileIds('a,0,-1'), [])
  })
})
