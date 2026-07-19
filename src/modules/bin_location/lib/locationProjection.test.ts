import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildLocationLookups,
  findAllowedAction,
  isActionEnabled,
  projectLocationRow,
  resolveLocationListState,
  resolveMutationUiState,
  validateLocationCreateForm,
} from './locationProjection.ts'
import type { LocationRecord, LocationTypeRecord, WarehouseCategoryRecord } from '../types/binLocation.ts'

const locationTypes: LocationTypeRecord[] = [
  { id: 1, code: 'WAREHOUSE', name_vi: 'Kho', name_en: 'Warehouse', level_hint: 0, is_active: true },
  { id: 5, code: 'BIN', name_vi: 'Ô kệ', name_en: 'Bin', level_hint: 5, is_active: true },
]

const warehouseCategories: WarehouseCategoryRecord[] = [
  { id: 2, code: 'RAW', name_vi: 'NVL', name_en: 'Raw', is_active: true },
]

const rootLocation: LocationRecord = {
  id: 100,
  code: 'WH-RAW',
  parent_location_id: null,
  location_name: 'Kho NVL',
  location_type_id: 1,
  level: 0,
  path: '/WH-RAW',
  warehouse_category_id: 2,
  manager_user_id: null,
  barcode: null,
  capacity_qty: null,
  capacity_uom_id: null,
  is_active: true,
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/wms/locations/WH-RAW', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/wms/locations/WH-RAW', enabled: true },
  ],
}

const binLocation: LocationRecord = {
  id: 200,
  code: 'BIN-001',
  parent_location_id: 100,
  location_name: 'Ô kệ 001',
  location_type_id: 5,
  level: 5,
  path: '/WH-RAW/.../BIN-001',
  warehouse_category_id: null,
  manager_user_id: null,
  barcode: 'BC-001',
  capacity_qty: 120.5,
  capacity_uom_id: 9,
  is_active: false,
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/wms/locations/BIN-001',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'deactivate',
      method: 'DELETE',
      href: '/api/wms/locations/BIN-001',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

describe('buildLocationLookups / projectLocationRow', () => {
  it('projects business codes instead of raw FK ids', () => {
    const lookups = buildLocationLookups({
      locations: [rootLocation, binLocation],
      locationTypes,
      warehouseCategories,
    })
    const row = projectLocationRow(rootLocation, lookups)
    assert.equal(row.locationTypeLabel, 'WAREHOUSE')
    assert.equal(row.warehouseCategoryLabel, 'RAW')
    assert.equal(row.parentLabel, '-')

    const childRow = projectLocationRow(binLocation, lookups)
    assert.equal(childRow.locationTypeLabel, 'BIN')
    assert.equal(childRow.parentLabel, 'WH-RAW')
  })

  it('gates update/deactivate strictly from server allowed_actions, not is_active', () => {
    const lookups = buildLocationLookups({
      locations: [rootLocation, binLocation],
      locationTypes,
      warehouseCategories,
    })
    const activeRow = projectLocationRow(rootLocation, lookups)
    assert.equal(activeRow.canUpdate, true)
    assert.equal(activeRow.canDeactivate, true)

    const inactiveRow = projectLocationRow(binLocation, lookups)
    assert.equal(inactiveRow.canUpdate, false)
    assert.equal(inactiveRow.canDeactivate, false)
    assert.equal(inactiveRow.updateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
    assert.equal(inactiveRow.deactivateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('does not infer enabled mutation when server omits allowed_actions entirely', () => {
    const lookups = buildLocationLookups({ locations: [], locationTypes: [], warehouseCategories: [] })
    const row = projectLocationRow({ ...rootLocation, allowed_actions: undefined }, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, false)
  })

  it('falls back to "-" when a lookup is unresolvable', () => {
    const lookups = buildLocationLookups({ locations: [], locationTypes: [], warehouseCategories: [] })
    const row = projectLocationRow(rootLocation, lookups)
    assert.equal(row.locationTypeLabel, '-')
    assert.equal(row.warehouseCategoryLabel, '-')
  })
})

describe('findAllowedAction / isActionEnabled', () => {
  it('resolves action envelope by action name', () => {
    const action = findAllowedAction(rootLocation.allowed_actions, 'update')
    assert.equal(action?.href, '/api/wms/locations/WH-RAW')
    assert.equal(isActionEnabled(rootLocation.allowed_actions, 'update'), true)
    assert.equal(isActionEnabled(binLocation.allowed_actions, 'deactivate'), false)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('resolveLocationListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveLocationListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveLocationListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveLocationListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveLocationListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveLocationListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveLocationListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
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
    assert.equal(
      resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'X' }),
      'error',
    )
  })
})

describe('validateLocationCreateForm', () => {
  it('requires code, location_name and location_type_id', () => {
    const errors = validateLocationCreateForm({ code: '', locationName: '', locationTypeId: 0 })
    assert.deepEqual(errors, ['code', 'location_name', 'location_type_id'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateLocationCreateForm({
      code: 'BIN-002',
      locationName: 'Ô kệ 002',
      locationTypeId: 5,
    })
    assert.deepEqual(errors, [])
  })
})
