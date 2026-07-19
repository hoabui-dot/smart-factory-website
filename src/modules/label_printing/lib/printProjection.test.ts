import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  projectPrintJobRow,
  resolveJobActions,
  resolvePrintListState,
  resolveActionUiState,
} from './printProjection.ts'
import type { PrintJobRecord } from '../types/labelPrinting.ts'

const sample: PrintJobRecord = {
  id: 7,
  code: 'PJ-000007',
  printer_id: 3,
  template_id: 5,
  label_type: 'LOT',
  parent_type: 'lot',
  parent_id: 99,
  copies: 2,
  payload: { lot_no: 'L-1', qr_payload: 'SF|LOT|L-1|v1' },
  requested_by: 10,
  requested_at: '2026-07-18T01:00:00Z',
  status: 'FAILED',
  printed_at: null,
  error_message: 'paper out',
  reprint_of_id: null,
}

describe('projectPrintJobRow', () => {
  it('projects business fields and resolves printer/template codes without exposing raw ids in labels', () => {
    const printers = new Map<number, string>([[3, 'PRN-LINE-A']])
    const templates = new Map<number, string>([[5, 'LT-LOT-v1']])
    const row = projectPrintJobRow(sample, { printersById: printers, templatesById: templates })
    assert.equal(row.code, 'PJ-000007')
    assert.equal(row.status, 'FAILED')
    assert.equal(row.printerLabel, 'PRN-LINE-A')
    assert.equal(row.templateLabel, 'LT-LOT-v1')
    assert.equal(row.errorMessage, 'paper out')
    assert.equal('printerId' in row, false)
    assert.equal('templateId' in row, false)
  })

  it('falls back when lookup missing', () => {
    const row = projectPrintJobRow(sample, {
      printersById: new Map(),
      templatesById: new Map(),
    })
    assert.equal(row.printerLabel, '—')
    assert.equal(row.templateLabel, '—')
  })
})

describe('resolveJobActions', () => {
  it('derives lifecycle actions from print_job status machine', () => {
    assert.deepEqual(resolveJobActions('FAILED'), ['retry'])
    assert.deepEqual(resolveJobActions('QUEUED'), ['cancel'])
    assert.deepEqual(resolveJobActions('SENDING'), ['cancel'])
    assert.deepEqual(resolveJobActions('PRINTED'), ['request_reprint'])
    assert.deepEqual(resolveJobActions('REPRINT_REQUESTED'), ['approve_reprint'])
    assert.deepEqual(resolveJobActions('CANCELLED'), [])
  })
})

describe('resolvePrintListState', () => {
  it('maps loading/empty/no-result/permission/error states', () => {
    assert.equal(
      resolvePrintListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolvePrintListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolvePrintListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolvePrintListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolvePrintListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
      'error',
    )
  })
})

describe('resolveActionUiState', () => {
  it('requires confirm then surfaces success/error', () => {
    assert.equal(resolveActionUiState({ confirmOpen: false, status: 'idle', errorCode: null }), 'idle')
    assert.equal(resolveActionUiState({ confirmOpen: true, status: 'idle', errorCode: null }), 'confirm')
    assert.equal(resolveActionUiState({ confirmOpen: true, status: 'pending', errorCode: null }), 'pending')
    assert.equal(resolveActionUiState({ confirmOpen: false, status: 'success', errorCode: null }), 'success')
    assert.equal(
      resolveActionUiState({ confirmOpen: false, status: 'error', errorCode: 'NOT_ALLOWED_BY_STATUS' }),
      'error',
    )
    assert.equal(
      resolveActionUiState({ confirmOpen: false, status: 'error', errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
  })
})
