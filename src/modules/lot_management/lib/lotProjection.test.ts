import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildLotLookups,
  findAllowedAction,
  isActionEnabled,
  projectLotRow,
  resolveLotListState,
  resolveMutationUiState,
  validatePrintForm,
} from './lotProjection.ts'
import type {
  ItemLookupRecord,
  ItemRevisionLookupRecord,
  LotRecord,
  SupplierLookupRecord,
} from '../types/lot.ts'

const items: ItemLookupRecord[] = [
  { id: 10, code: 'RAW-EPDM-15', item_name: 'EPDM compound', is_active: true },
]

const suppliers: SupplierLookupRecord[] = [
  { id: 1, code: 'SUP-ACME', supplier_name: 'Acme Rubber Co', is_active: true },
]

const revisions: ItemRevisionLookupRecord[] = [
  { id: 100, code: 'REV-A', item_id: 10, status: 'RELEASED' },
]

const addressableLot: LotRecord = {
  id: 1,
  code: 'LOT-26B-EPDM-15',
  item_id: 10,
  item_revision_id: 100,
  supplier_id: 1,
  supplier_lot: 'SL-001',
  mill_certificate_no: 'MC-001',
  received_date: '2026-07-01',
  expiry_date: '2027-07-01',
  qc_status: 'PASSED',
  received_qty: 500,
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/wms/lots/LOT-26B-EPDM-15', enabled: true },
    {
      action: 'print',
      method: 'POST',
      href: '/api/wms/lots/LOT-26B-EPDM-15/labels',
      enabled: true,
    },
  ],
}

const lotWithoutServerActions: LotRecord = {
  ...addressableLot,
  code: 'LOT-NO-ACTIONS',
  allowed_actions: undefined,
}

describe('findAllowedAction / isActionEnabled', () => {
  it('resolves action envelope by action name', () => {
    const action = findAllowedAction(addressableLot.allowed_actions, 'update')
    assert.equal(action?.href, '/api/wms/lots/LOT-26B-EPDM-15')
    assert.equal(isActionEnabled(addressableLot.allowed_actions, 'update'), true)
    assert.equal(isActionEnabled(addressableLot.allowed_actions, 'print'), true)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('projectLotRow', () => {
  it('projects business labels via lookups and gates strictly from allowed_actions', () => {
    const lookups = buildLotLookups({ items, suppliers, revisions })
    const row = projectLotRow(addressableLot, lookups)
    assert.equal(row.code, 'LOT-26B-EPDM-15')
    assert.equal(row.itemLabel, 'RAW-EPDM-15')
    assert.equal(row.revisionLabel, 'REV-A')
    assert.equal(row.supplierLabel, 'SUP-ACME')
    assert.equal(row.qcStatus, 'PASSED')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canPrint, true)
  })

  it('falls back to lookup map when item_code/supplier_code are absent from the payload', () => {
    const lookups = buildLotLookups({ items, suppliers, revisions })
    const row = projectLotRow(
      { ...addressableLot, item_code: undefined, supplier_code: undefined },
      lookups,
    )
    assert.equal(row.itemLabel, 'RAW-EPDM-15')
    assert.equal(row.supplierLabel, 'SUP-ACME')
  })

  it('does not infer enabled mutation when server omits allowed_actions entirely', () => {
    const lookups = buildLotLookups({ items, suppliers, revisions })
    const row = projectLotRow(lotWithoutServerActions, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canPrint, false)
  })

  it('surfaces disabled_reason_code when server disables an action', () => {
    const lookups = buildLotLookups({ items, suppliers, revisions })
    const row = projectLotRow(
      {
        ...addressableLot,
        allowed_actions: [
          {
            action: 'update',
            method: 'PATCH',
            href: '/api/wms/lots/LOT-26B-EPDM-15',
            enabled: false,
            disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
          },
        ],
      },
      lookups,
    )
    assert.equal(row.canUpdate, false)
    assert.equal(row.updateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('renders unavailable placeholder when item_revision_id/supplier_id are null', () => {
    const lookups = buildLotLookups({ items, suppliers, revisions })
    const row = projectLotRow(
      { ...addressableLot, item_revision_id: null, supplier_id: null, supplier_code: undefined },
      lookups,
    )
    assert.equal(row.revisionLabel, '-')
    assert.equal(row.supplierLabel, '-')
  })
})

describe('resolveLotListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveLotListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveLotListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveLotListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveLotListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveLotListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveLotListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
      'error',
    )
  })
})

describe('resolveMutationUiState', () => {
  it('requires confirmation and preserves canonical error codes', () => {
    assert.equal(resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }), 'confirm')
    assert.equal(resolveMutationUiState({ confirmOpen: false, status: 'idle', errorCode: null }), 'idle')
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'pending', errorCode: null }),
      'pending',
    )
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'success', errorCode: null }),
      'success',
    )
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(
      resolveMutationUiState({
        confirmOpen: false,
        status: 'error',
        errorCode: 'NOT_ALLOWED_BY_STATUS',
      }),
      'not-allowed',
    )
    assert.equal(resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'X' }), 'error')
  })
})

describe('validatePrintForm', () => {
  it('requires a positive integer copies value', () => {
    assert.deepEqual(validatePrintForm({ copies: 0 }), ['copies'])
    assert.deepEqual(validatePrintForm({ copies: -1 }), ['copies'])
    assert.deepEqual(validatePrintForm({ copies: 1.5 }), ['copies'])
    assert.deepEqual(validatePrintForm({ copies: 1 }), [])
    assert.deepEqual(validatePrintForm({ copies: 3 }), [])
  })
})
