import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildRoutingLookups,
  findAllowedAction,
  isActionEnabled,
  projectMachineRow,
  projectRoutingRow,
  projectWorkCenterRow,
  resolveMutationUiState,
  resolveRoutingListState,
  validateMachineCreateForm,
  validateRoutingCreateForm,
  validateWorkCenterCreateForm,
} from './routingProjection.ts'
import type {
  ItemLookupRecord,
  MachineRecord,
  RoutingHeaderRecord,
  UomLookupRecord,
  WorkCenterRecord,
} from '../types/routing.ts'

const uoms: UomLookupRecord[] = [{ id: 1, code: 'hour', uom_name: 'Giờ', is_active: true }]

const workCenters: WorkCenterRecord[] = [
  {
    id: 5,
    code: 'WC-MIX',
    name: 'Line trộn',
    capacity_per_hour: 120,
    capacity_uom_id: 1,
    capacity_uom_code: 'hour',
    allowed_actions: [
      { action: 'update', method: 'PATCH', href: '/api/mes/work-centers/WC-MIX', enabled: true },
      { action: 'deactivate', method: 'DELETE', href: '/api/mes/work-centers/WC-MIX', enabled: true },
    ],
  },
]

const items: ItemLookupRecord[] = [{ id: 10, code: 'FG-001', item_name: 'Sản phẩm A', is_active: true }]

const machineActive: MachineRecord = {
  id: 1,
  code: 'M-001',
  work_center_id: 5,
  last_pm_date: '2026-06-01',
  next_pm_due: '2026-09-01',
  status: 'RUNNING',
  work_center_code: 'WC-MIX',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/mes/machines/M-001', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/machines/M-001', enabled: true },
  ],
}

const draftRouting: RoutingHeaderRecord = {
  id: 100,
  code: 'RT-001',
  product_item_id: 10,
  version: 'v1.0',
  status: 'DRAFT',
  effective_from: '2026-07-01',
  effective_to: null,
  approved_by: null,
  product_item_code: 'FG-001',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/mes/routings/RT-001', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/routings/RT-001', enabled: true },
    { action: 'release', method: 'POST', href: '/api/mes/routings/RT-001/release', enabled: true },
    {
      action: 'obsolete',
      method: 'POST',
      href: '/api/mes/routings/RT-001/obsolete',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

const releasedRouting: RoutingHeaderRecord = {
  id: 101,
  code: 'RT-002',
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
      href: '/api/mes/routings/RT-002',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/routings/RT-002', enabled: true },
    {
      action: 'release',
      method: 'POST',
      href: '/api/mes/routings/RT-002/release',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    { action: 'obsolete', method: 'POST', href: '/api/mes/routings/RT-002/obsolete', enabled: true },
  ],
}

const obsoleteRouting: RoutingHeaderRecord = {
  id: 102,
  code: 'RT-003',
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
      href: '/api/mes/routings/RT-003',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'deactivate',
      method: 'DELETE',
      href: '/api/mes/routings/RT-003',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'release',
      method: 'POST',
      href: '/api/mes/routings/RT-003/release',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'obsolete',
      method: 'POST',
      href: '/api/mes/routings/RT-003/obsolete',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

describe('findAllowedAction / isActionEnabled', () => {
  it('resolves action envelope by action name', () => {
    const action = findAllowedAction(draftRouting.allowed_actions, 'release')
    assert.equal(action?.href, '/api/mes/routings/RT-001/release')
    assert.equal(isActionEnabled(draftRouting.allowed_actions, 'release'), true)
    assert.equal(isActionEnabled(draftRouting.allowed_actions, 'obsolete'), false)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('projectWorkCenterRow', () => {
  it('projects business codes and gates strictly from allowed_actions', () => {
    const lookups = buildRoutingLookups({ uoms, workCenters, items })
    const row = projectWorkCenterRow(workCenters[0], lookups)
    assert.equal(row.capacityUomLabel, 'hour')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
  })

  it('does not infer enabled mutation when server omits allowed_actions entirely', () => {
    const lookups = buildRoutingLookups({ uoms: [], workCenters: [], items: [] })
    const row = projectWorkCenterRow({ ...workCenters[0], allowed_actions: undefined }, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, false)
  })
})

describe('projectMachineRow', () => {
  it('projects work_center_code and gates strictly from allowed_actions', () => {
    const lookups = buildRoutingLookups({ uoms, workCenters, items })
    const row = projectMachineRow(machineActive, lookups)
    assert.equal(row.workCenterLabel, 'WC-MIX')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
  })

  it('falls back to lookup map when work_center_code is absent from the payload', () => {
    const lookups = buildRoutingLookups({ uoms, workCenters, items })
    const row = projectMachineRow({ ...machineActive, work_center_code: undefined }, lookups)
    assert.equal(row.workCenterLabel, 'WC-MIX')
  })
})

describe('projectRoutingRow', () => {
  it('gates update/release from DRAFT and blocks obsolete', () => {
    const lookups = buildRoutingLookups({ uoms, workCenters, items })
    const row = projectRoutingRow(draftRouting, lookups)
    assert.equal(row.productItemLabel, 'FG-001')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
    assert.equal(row.canRelease, true)
    assert.equal(row.canObsolete, false)
    assert.equal(row.obsoleteDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('gates obsolete/deactivate from RELEASED and blocks update/release', () => {
    const lookups = buildRoutingLookups({ uoms, workCenters, items })
    const row = projectRoutingRow(releasedRouting, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, true)
    assert.equal(row.canRelease, false)
    assert.equal(row.canObsolete, true)
    assert.equal(row.updateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('blocks every mutation once OBSOLETE', () => {
    const lookups = buildRoutingLookups({ uoms, workCenters, items })
    const row = projectRoutingRow(obsoleteRouting, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, false)
    assert.equal(row.canRelease, false)
    assert.equal(row.canObsolete, false)
  })

  it('never infers gating from status when allowed_actions is omitted', () => {
    const lookups = buildRoutingLookups({ uoms: [], workCenters: [], items: [] })
    const row = projectRoutingRow({ ...draftRouting, allowed_actions: undefined }, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canRelease, false)
  })

  it('falls back to lookup map when product_item_code is absent from the payload', () => {
    const lookups = buildRoutingLookups({ uoms, workCenters, items })
    const row = projectRoutingRow({ ...draftRouting, product_item_code: undefined }, lookups)
    assert.equal(row.productItemLabel, 'FG-001')
  })
})

describe('resolveRoutingListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveRoutingListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveRoutingListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveRoutingListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveRoutingListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveRoutingListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveRoutingListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
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

describe('validateWorkCenterCreateForm', () => {
  it('requires code, name, capacity_per_hour and capacity_uom_id', () => {
    const errors = validateWorkCenterCreateForm({
      code: '',
      name: '',
      capacityPerHour: 0,
      capacityUomId: 0,
    })
    assert.deepEqual(errors, ['code', 'name', 'capacity_per_hour', 'capacity_uom_id'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateWorkCenterCreateForm({
      code: 'WC-002',
      name: 'Line ép',
      capacityPerHour: 80,
      capacityUomId: 1,
    })
    assert.deepEqual(errors, [])
  })
})

describe('validateMachineCreateForm', () => {
  it('requires code, work_center_id, dates and status', () => {
    const errors = validateMachineCreateForm({
      code: '',
      workCenterId: 0,
      lastPmDate: '',
      nextPmDue: '',
      status: '',
    })
    assert.deepEqual(errors, ['code', 'work_center_id', 'last_pm_date', 'next_pm_due', 'status'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateMachineCreateForm({
      code: 'M-002',
      workCenterId: 5,
      lastPmDate: '2026-06-01',
      nextPmDue: '2026-09-01',
      status: 'IDLE',
    })
    assert.deepEqual(errors, [])
  })
})

describe('validateRoutingCreateForm', () => {
  it('requires code, product_item_id, version, status and effective_from', () => {
    const errors = validateRoutingCreateForm({
      code: '',
      productItemId: 0,
      version: '',
      status: '',
      effectiveFrom: '',
    })
    assert.deepEqual(errors, ['code', 'product_item_id', 'version', 'status', 'effective_from'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateRoutingCreateForm({
      code: 'RT-004',
      productItemId: 10,
      version: 'v1.0',
      status: 'DRAFT',
      effectiveFrom: '2026-07-01',
    })
    assert.deepEqual(errors, [])
  })
})
