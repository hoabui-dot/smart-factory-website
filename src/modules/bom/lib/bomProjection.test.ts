import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildBomLookups,
  findAllowedAction,
  isActionEnabled,
  projectBomLineRow,
  projectBomRow,
  resolveBomListState,
  resolveMutationUiState,
  validateBomCopyForm,
  validateBomCreateForm,
} from './bomProjection.ts'
import type { BomHeaderRecord, BomLineRecord, ItemLookupRecord, UomLookupRecord } from '../types/bom.ts'

const uoms: UomLookupRecord[] = [{ id: 1, code: 'kg', uom_name: 'Kilogram', is_active: true }]

const items: ItemLookupRecord[] = [
  { id: 10, code: 'FG-001', item_name: 'Sản phẩm A', is_active: true },
  { id: 20, code: 'RM-001', item_name: 'NVL A', is_active: true },
]

const draftBom: BomHeaderRecord = {
  id: 100,
  code: 'BOM-001',
  product_item_id: 10,
  version: 'v1.0',
  status: 'DRAFT',
  effective_from: '2026-07-01',
  effective_to: null,
  approved_by: null,
  product_item_code: 'FG-001',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/mes/boms/BOM-001', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/boms/BOM-001', enabled: true },
    { action: 'copy', method: 'POST', href: '/api/mes/boms/BOM-001/copy', enabled: true },
    { action: 'release', method: 'POST', href: '/api/mes/boms/BOM-001/release', enabled: true },
    {
      action: 'obsolete',
      method: 'POST',
      href: '/api/mes/boms/BOM-001/obsolete',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

const releasedBom: BomHeaderRecord = {
  id: 101,
  code: 'BOM-002',
  product_item_id: 10,
  version: 'v1.0',
  status: 'RELEASED',
  effective_from: '2026-07-01',
  effective_to: null,
  approved_by: 1,
  product_item_code: 'FG-001',
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/mes/boms/BOM-002',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/boms/BOM-002', enabled: true },
    { action: 'copy', method: 'POST', href: '/api/mes/boms/BOM-002/copy', enabled: true },
    {
      action: 'release',
      method: 'POST',
      href: '/api/mes/boms/BOM-002/release',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    { action: 'obsolete', method: 'POST', href: '/api/mes/boms/BOM-002/obsolete', enabled: true },
  ],
}

const obsoleteBom: BomHeaderRecord = {
  id: 102,
  code: 'BOM-003',
  product_item_id: 10,
  version: 'v1.0',
  status: 'OBSOLETE',
  effective_from: '2026-01-01',
  effective_to: '2026-07-01',
  approved_by: 1,
  product_item_code: 'FG-001',
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/mes/boms/BOM-003',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'deactivate',
      method: 'DELETE',
      href: '/api/mes/boms/BOM-003',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    { action: 'copy', method: 'POST', href: '/api/mes/boms/BOM-003/copy', enabled: true },
    {
      action: 'release',
      method: 'POST',
      href: '/api/mes/boms/BOM-003/release',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'obsolete',
      method: 'POST',
      href: '/api/mes/boms/BOM-003/obsolete',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

const line: BomLineRecord = {
  id: 1,
  code: 'BOM-001-01',
  bom_id: 100,
  material_item_id: 20,
  qty_per_unit: 2.5,
  scrap_rate: 1.5,
  uom_id: 1,
  material_item_code: 'RM-001',
  uom_code: 'kg',
  material_item_type: 'RAW',
}

describe('findAllowedAction / isActionEnabled', () => {
  it('resolves action envelope by action name', () => {
    const action = findAllowedAction(draftBom.allowed_actions, 'release')
    assert.equal(action?.href, '/api/mes/boms/BOM-001/release')
    assert.equal(isActionEnabled(draftBom.allowed_actions, 'release'), true)
    assert.equal(isActionEnabled(draftBom.allowed_actions, 'obsolete'), false)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('projectBomRow', () => {
  it('gates update/release/copy from DRAFT and blocks obsolete', () => {
    const lookups = buildBomLookups({ uoms, items })
    const row = projectBomRow(draftBom, lookups)
    assert.equal(row.productItemLabel, 'FG-001')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
    assert.equal(row.canCopy, true)
    assert.equal(row.canRelease, true)
    assert.equal(row.canObsolete, false)
    assert.equal(row.obsoleteDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('gates obsolete/deactivate/copy from RELEASED and blocks update/release', () => {
    const lookups = buildBomLookups({ uoms, items })
    const row = projectBomRow(releasedBom, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, true)
    assert.equal(row.canCopy, true)
    assert.equal(row.canRelease, false)
    assert.equal(row.canObsolete, true)
    assert.equal(row.updateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('blocks update/deactivate/release/obsolete once OBSOLETE but still allows copy', () => {
    const lookups = buildBomLookups({ uoms, items })
    const row = projectBomRow(obsoleteBom, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, false)
    assert.equal(row.canRelease, false)
    assert.equal(row.canObsolete, false)
    assert.equal(row.canCopy, true)
  })

  it('never infers gating from status when allowed_actions is omitted', () => {
    const lookups = buildBomLookups({ uoms: [], items: [] })
    const row = projectBomRow({ ...draftBom, allowed_actions: undefined }, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canRelease, false)
    assert.equal(row.canCopy, false)
  })

  it('falls back to lookup map when product_item_code is absent from the payload', () => {
    const lookups = buildBomLookups({ uoms, items })
    const row = projectBomRow({ ...draftBom, product_item_code: undefined }, lookups)
    assert.equal(row.productItemLabel, 'FG-001')
  })
})

describe('projectBomLineRow', () => {
  it('projects material_item_code/uom_code and falls back to lookup map', () => {
    const lookups = buildBomLookups({ uoms, items })
    const row = projectBomLineRow(line, lookups)
    assert.equal(row.materialItemLabel, 'RM-001')
    assert.equal(row.uomLabel, 'kg')
    assert.equal(row.qtyPerUnit, 2.5)
    assert.equal(row.scrapRate, 1.5)
  })

  it('falls back to lookup map when codes are absent from the payload', () => {
    const lookups = buildBomLookups({ uoms, items })
    const row = projectBomLineRow({ ...line, material_item_code: undefined, uom_code: undefined }, lookups)
    assert.equal(row.materialItemLabel, 'RM-001')
    assert.equal(row.uomLabel, 'kg')
  })
})

describe('resolveBomListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveBomListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveBomListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveBomListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveBomListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveBomListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveBomListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
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

describe('validateBomCreateForm', () => {
  it('requires code, product_item_id, version, status and effective_from', () => {
    const errors = validateBomCreateForm({
      code: '',
      productItemId: 0,
      version: '',
      status: '',
      effectiveFrom: '',
    })
    assert.deepEqual(errors, ['code', 'product_item_id', 'version', 'status', 'effective_from'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateBomCreateForm({
      code: 'BOM-004',
      productItemId: 10,
      version: 'v1.0',
      status: 'DRAFT',
      effectiveFrom: '2026-07-01',
    })
    assert.deepEqual(errors, [])
  })
})

describe('validateBomCopyForm', () => {
  it('requires new_code, new_version and effective_from', () => {
    const errors = validateBomCopyForm({ newCode: '', newVersion: '', effectiveFrom: '' })
    assert.deepEqual(errors, ['new_code', 'new_version', 'effective_from'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateBomCopyForm({
      newCode: 'BOM-005',
      newVersion: 'v2.0',
      effectiveFrom: '2026-08-01',
    })
    assert.deepEqual(errors, [])
  })
})
