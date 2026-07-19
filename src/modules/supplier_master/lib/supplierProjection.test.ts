import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildSupplierLookups,
  findAllowedAction,
  isActionEnabled,
  projectSupplierEvaluationRow,
  projectSupplierItemRow,
  projectSupplierRow,
  resolveMutationUiState,
  resolveSupplierListState,
  validateSupplierCreateForm,
  validateSupplierEvaluationCreateForm,
  validateSupplierItemCreateForm,
} from './supplierProjection.ts'
import type {
  ItemLookupRecord,
  SupplierEvaluationRecord,
  SupplierItemRecord,
  SupplierRecord,
} from '../types/supplier.ts'

const activeSupplier: SupplierRecord = {
  id: 1,
  code: 'SUP-ACME',
  supplier_name: 'Acme Steel Co',
  country_code: 'VN',
  supplier_tier: 'TIER1',
  iatf_certified: true,
  iatf_cert_no: 'IATF-001',
  iatf_cert_expiry: '2027-01-01',
  iso9001_certified: true,
  approval_status: 'CONDITIONAL',
  contact_email: 'qa@acme.example',
  is_active: true,
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/wms/suppliers/SUP-ACME', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/wms/suppliers/SUP-ACME', enabled: true },
  ],
}

const inactiveSupplier: SupplierRecord = {
  ...activeSupplier,
  id: 2,
  code: 'SUP-OLD',
  is_active: false,
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/wms/suppliers/SUP-OLD',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'deactivate',
      method: 'DELETE',
      href: '/api/wms/suppliers/SUP-OLD',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

const items: ItemLookupRecord[] = [{ id: 10, code: 'RAW-001', item_name: 'Steel coil', is_active: true }]

const supplierItemActive: SupplierItemRecord = {
  id: 5,
  code: 'SI-001',
  supplier_id: 1,
  item_id: 10,
  unit_price: 12.5,
  lead_time_days: 7,
  moq: 100,
  is_default: true,
  is_active: true,
  supplier_code: 'SUP-ACME',
  item_code: 'RAW-001',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/wms/supplier-items/SI-001', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/wms/supplier-items/SI-001', enabled: true },
  ],
}

const evaluationA: SupplierEvaluationRecord = {
  id: 20,
  code: 'EVAL-001',
  supplier_id: 1,
  evaluation_period: '2026-Q2',
  quality_score: 92,
  delivery_score: 88,
  service_score: 90,
  total_score: 90,
  grade: 'A',
  evaluated_by: 7,
  evaluated_at: '2026-07-01',
  action_required: null,
  supplier_code: 'SUP-ACME',
}

describe('findAllowedAction / isActionEnabled', () => {
  it('resolves action envelope by action name', () => {
    const action = findAllowedAction(activeSupplier.allowed_actions, 'update')
    assert.equal(action?.href, '/api/wms/suppliers/SUP-ACME')
    assert.equal(isActionEnabled(activeSupplier.allowed_actions, 'update'), true)
    assert.equal(isActionEnabled(inactiveSupplier.allowed_actions, 'update'), false)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('projectSupplierRow', () => {
  it('projects fields and gates strictly from allowed_actions when active', () => {
    const row = projectSupplierRow(activeSupplier)
    assert.equal(row.code, 'SUP-ACME')
    assert.equal(row.supplierTier, 'TIER1')
    assert.equal(row.approvalStatus, 'CONDITIONAL')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
  })

  it('blocks mutation when disabled by server allowed_actions', () => {
    const row = projectSupplierRow(inactiveSupplier)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, false)
    assert.equal(row.updateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('does not infer enabled mutation when server omits allowed_actions entirely', () => {
    const row = projectSupplierRow({ ...activeSupplier, allowed_actions: undefined })
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, false)
  })
})

describe('projectSupplierItemRow', () => {
  it('projects business codes and gates strictly from allowed_actions', () => {
    const lookups = buildSupplierLookups({ suppliers: [activeSupplier], items })
    const row = projectSupplierItemRow(supplierItemActive, lookups)
    assert.equal(row.supplierLabel, 'SUP-ACME')
    assert.equal(row.itemLabel, 'RAW-001')
    assert.equal(row.leadTimeDays, 7)
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
  })

  it('falls back to lookup map when supplier_code/item_code are absent from the payload', () => {
    const lookups = buildSupplierLookups({ suppliers: [activeSupplier], items })
    const row = projectSupplierItemRow(
      { ...supplierItemActive, supplier_code: undefined, item_code: undefined },
      lookups,
    )
    assert.equal(row.supplierLabel, 'SUP-ACME')
    assert.equal(row.itemLabel, 'RAW-001')
  })

  it('renders unavailable placeholder when unit_price/moq are null', () => {
    const lookups = buildSupplierLookups({ suppliers: [activeSupplier], items })
    const row = projectSupplierItemRow(
      { ...supplierItemActive, unit_price: null, moq: null },
      lookups,
    )
    assert.equal(row.unitPrice, '-')
    assert.equal(row.moq, '-')
  })
})

describe('projectSupplierEvaluationRow', () => {
  it('projects supplier label, scores and evaluated_by user projection', () => {
    const lookups = buildSupplierLookups({ suppliers: [activeSupplier], items })
    const row = projectSupplierEvaluationRow(evaluationA, lookups)
    assert.equal(row.supplierLabel, 'SUP-ACME')
    assert.equal(row.grade, 'A')
    assert.equal(row.totalScore, 90)
    assert.equal(row.evaluatedByLabel, 'user #7')
    assert.equal(row.actionRequired, '-')
  })

  it('falls back to lookup map when supplier_code is absent from the payload', () => {
    const lookups = buildSupplierLookups({ suppliers: [activeSupplier], items })
    const row = projectSupplierEvaluationRow({ ...evaluationA, supplier_code: undefined }, lookups)
    assert.equal(row.supplierLabel, 'SUP-ACME')
  })
})

describe('resolveSupplierListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveSupplierListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveSupplierListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveSupplierListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveSupplierListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveSupplierListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveSupplierListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
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

describe('validateSupplierCreateForm', () => {
  it('requires code, supplier_name, country_code, supplier_tier and contact_email', () => {
    const errors = validateSupplierCreateForm({
      code: '',
      supplierName: '',
      countryCode: '',
      supplierTier: '',
      contactEmail: '',
    })
    assert.deepEqual(errors, ['code', 'supplier_name', 'country_code', 'supplier_tier', 'contact_email'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateSupplierCreateForm({
      code: 'SUP-002',
      supplierName: 'Beta Supplier',
      countryCode: 'VN',
      supplierTier: 'TIER2',
      contactEmail: 'qa@beta.example',
    })
    assert.deepEqual(errors, [])
  })

  it('rejects an invalid supplier_tier enum value', () => {
    const errors = validateSupplierCreateForm({
      code: 'SUP-003',
      supplierName: 'Gamma',
      countryCode: 'VN',
      supplierTier: 'TIER9',
      contactEmail: 'qa@gamma.example',
    })
    assert.deepEqual(errors, ['supplier_tier'])
  })
})

describe('validateSupplierItemCreateForm', () => {
  it('requires code, supplier_id, item_id and non-negative lead_time_days', () => {
    const errors = validateSupplierItemCreateForm({
      code: '',
      supplierId: 0,
      itemId: 0,
      leadTimeDays: -1,
    })
    assert.deepEqual(errors, ['code', 'supplier_id', 'item_id', 'lead_time_days'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateSupplierItemCreateForm({
      code: 'SI-002',
      supplierId: 1,
      itemId: 10,
      leadTimeDays: 5,
    })
    assert.deepEqual(errors, [])
  })
})

describe('validateSupplierEvaluationCreateForm', () => {
  it('requires code, supplier_id, evaluation_period, score range and evaluated_at', () => {
    const errors = validateSupplierEvaluationCreateForm({
      code: '',
      supplierId: 0,
      evaluationPeriod: '',
      qualityScore: -1,
      deliveryScore: 101,
      serviceScore: 50,
      evaluatedAt: '',
    })
    assert.deepEqual(errors, [
      'code',
      'supplier_id',
      'evaluation_period',
      'quality_score',
      'delivery_score',
      'evaluated_at',
    ])
  })

  it('passes when required fields are valid', () => {
    const errors = validateSupplierEvaluationCreateForm({
      code: 'EVAL-002',
      supplierId: 1,
      evaluationPeriod: '2026-Q3',
      qualityScore: 80,
      deliveryScore: 75,
      serviceScore: 90,
      evaluatedAt: '2026-07-10',
    })
    assert.deepEqual(errors, [])
  })
})
