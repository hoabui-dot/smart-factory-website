import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  isActionEnabled,
  projectItemRow,
  resolveItemListState,
  resolveMutationUiState,
  validateItemCreateForm,
} from './itemProjection.ts'
import type { ItemRecord } from '../types/itemMaster.ts'

const activeItem: ItemRecord = {
  id: 10,
  code: 'ITM-0001',
  item_name: 'Bulong M6',
  item_type_id: 1,
  category_id: 2,
  base_uom_id: 3,
  is_lot_tracked: true,
  is_serial_tracked: false,
  is_phantom: false,
  shelf_life_days: null,
  current_revision_id: null,
  is_active: true,
  item_type_code: 'RAW',
  category_code: 'HARDWARE',
  base_uom_code: 'pcs',
  current_revision_code: null,
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/mes/items/ITM-0001', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/items/ITM-0001', enabled: true },
  ],
}

const inactiveItem: ItemRecord = {
  ...activeItem,
  code: 'ITM-0002',
  is_active: false,
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/mes/items/ITM-0002',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'deactivate',
      method: 'DELETE',
      href: '/api/mes/items/ITM-0002',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

describe('projectItemRow', () => {
  it('projects business codes instead of raw FK ids', () => {
    const row = projectItemRow(activeItem)
    assert.equal(row.itemTypeLabel, 'RAW')
    assert.equal(row.categoryLabel, 'HARDWARE')
    assert.equal(row.baseUomLabel, 'pcs')
  })

  it('gates update/deactivate strictly from server allowed_actions, not is_active', () => {
    const row = projectItemRow(activeItem)
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)

    const disabledRow = projectItemRow(inactiveItem)
    assert.equal(disabledRow.canUpdate, false)
    assert.equal(disabledRow.canDeactivate, false)
    assert.equal(disabledRow.updateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
    assert.equal(disabledRow.deactivateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('does not infer enabled mutation when server omits allowed_actions entirely', () => {
    const row = projectItemRow({ ...activeItem, allowed_actions: undefined })
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, false)
  })
})

describe('findAllowedAction / isActionEnabled', () => {
  it('resolves action envelope by action name', () => {
    const action = findAllowedAction(activeItem.allowed_actions, 'update')
    assert.equal(action?.href, '/api/mes/items/ITM-0001')
    assert.equal(isActionEnabled(activeItem.allowed_actions, 'update'), true)
    assert.equal(isActionEnabled(inactiveItem.allowed_actions, 'deactivate'), false)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('resolveItemListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveItemListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveItemListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveItemListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveItemListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveItemListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveItemListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
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

describe('validateItemCreateForm', () => {
  it('requires code, item_name and FK selections', () => {
    const errors = validateItemCreateForm({
      code: '',
      itemName: '',
      itemTypeId: 0,
      categoryId: 0,
      baseUomId: 0,
    })
    assert.deepEqual(errors, ['code', 'item_name', 'item_type_id', 'category_id', 'base_uom_id'])
  })

  it('passes when all fields are valid', () => {
    const errors = validateItemCreateForm({
      code: 'ITM-0003',
      itemName: 'Ốc vít',
      itemTypeId: 1,
      categoryId: 2,
      baseUomId: 3,
    })
    assert.deepEqual(errors, [])
  })
})
