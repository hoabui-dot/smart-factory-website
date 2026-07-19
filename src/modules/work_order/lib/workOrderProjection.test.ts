import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildWorkOrderLookups,
  findAllowedAction,
  isActionEnabled,
  projectMaterialRequestRow,
  projectWorkOrderRow,
  resolveMutationUiState,
  resolveWorkOrderListState,
  validateReasonForm,
  validateWorkOrderCreateForm,
} from './workOrderProjection.ts'
import type {
  ItemLookupRecord,
  ItemRevisionLookupRecord,
  MaterialRequestRecord,
  WorkOrderRecord,
} from '../types/workOrder.ts'

const items: ItemLookupRecord[] = [
  { id: 10, code: 'FG-001', item_name: 'Sản phẩm A', is_active: true },
]

const revisions: ItemRevisionLookupRecord[] = [{ id: 50, code: 'REV-A', item_id: 10, status: 'ACTIVE' }]

const draftWo: WorkOrderRecord = {
  id: 1,
  code: 'WO-2026-07-0001',
  item_id: 10,
  item_revision_id: 50,
  bom_id: 100,
  routing_id: 200,
  planned_qty: 100,
  produced_qty: 0,
  scrap_qty: 0,
  planned_start: '2026-07-20T08:00:00Z',
  status: 'DRAFT',
  item_code: 'FG-001',
  bom_code: 'BOM-001',
  routing_code: 'RT-001',
  item_revision_code: 'REV-A',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/mes/work-orders/1', enabled: true },
    { action: 'plan', method: 'POST', href: '/api/mes/work-orders/1/plan', enabled: true },
    { action: 'cancel', method: 'POST', href: '/api/mes/work-orders/1/cancel', enabled: true },
  ],
}

const inProgressWo: WorkOrderRecord = {
  id: 2,
  code: 'WO-2026-07-0002',
  item_id: 10,
  item_revision_id: 50,
  bom_id: 100,
  routing_id: 200,
  planned_qty: 50,
  produced_qty: 10,
  scrap_qty: 1,
  planned_start: '2026-07-18T08:00:00Z',
  actual_start: '2026-07-18T08:05:00Z',
  status: 'IN_PROGRESS',
  item_code: 'FG-001',
  bom_code: 'BOM-001',
  routing_code: 'RT-001',
  item_revision_code: 'REV-A',
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/mes/work-orders/2',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    {
      action: 'plan',
      method: 'POST',
      href: '/api/mes/work-orders/2/plan',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
    { action: 'pause', method: 'POST', href: '/api/mes/work-orders/2/pause', enabled: true },
  ],
}

const materialRequest: MaterialRequestRecord = {
  id: 1,
  code: 'MR-WO-2026-07-0001-01',
  work_order_id: 1,
  item_id: 20,
  required_qty: 25.5,
  uom_id: 1,
  target_location_id: 5,
  status: 'PENDING',
  created_by: 1,
  item_code: 'RM-001',
  uom_code: 'kg',
  target_location_code: 'SHOP-CS-01',
}

describe('findAllowedAction / isActionEnabled', () => {
  it('resolves action envelope by action name', () => {
    const action = findAllowedAction(draftWo.allowed_actions, 'plan')
    assert.equal(action?.href, '/api/mes/work-orders/1/plan')
    assert.equal(isActionEnabled(draftWo.allowed_actions, 'plan'), true)
    assert.equal(isActionEnabled(draftWo.allowed_actions, 'release'), false)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('projectWorkOrderRow', () => {
  it('gates update/plan/cancel from DRAFT and blocks release/pause', () => {
    const lookups = buildWorkOrderLookups({ items, revisions })
    const row = projectWorkOrderRow(draftWo, lookups)
    assert.equal(row.itemLabel, 'FG-001')
    assert.equal(row.itemRevisionLabel, 'REV-A')
    assert.equal(row.bomLabel, 'BOM-001')
    assert.equal(row.routingLabel, 'RT-001')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canPlan, true)
    assert.equal(row.canCancel, true)
    assert.equal(row.canRelease, false)
    assert.equal(row.canPause, false)
  })

  it('gates pause from IN_PROGRESS and blocks update/plan with NOT_ALLOWED_BY_STATUS', () => {
    const lookups = buildWorkOrderLookups({ items, revisions })
    const row = projectWorkOrderRow(inProgressWo, lookups)
    assert.equal(row.canPause, true)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canPlan, false)
    assert.equal(row.updateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
    assert.equal(row.planDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('never infers gating from status when allowed_actions is omitted', () => {
    const lookups = buildWorkOrderLookups({ items: [], revisions: [] })
    const row = projectWorkOrderRow({ ...draftWo, allowed_actions: undefined }, lookups)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canPlan, false)
    assert.equal(row.canCancel, false)
  })

  it('falls back to lookup maps when business codes are absent from the payload', () => {
    const lookups = buildWorkOrderLookups({ items, revisions })
    const row = projectWorkOrderRow(
      { ...draftWo, item_code: undefined, item_revision_code: undefined },
      lookups,
    )
    assert.equal(row.itemLabel, 'FG-001')
    assert.equal(row.itemRevisionLabel, 'REV-A')
  })

  it('shows "-" when item_revision_id is null and no code is projected', () => {
    const lookups = buildWorkOrderLookups({ items, revisions })
    const row = projectWorkOrderRow(
      { ...draftWo, item_revision_id: null, item_revision_code: undefined },
      lookups,
    )
    assert.equal(row.itemRevisionLabel, '-')
  })
})

describe('projectMaterialRequestRow', () => {
  it('projects item_code/uom_code/target_location_code business labels', () => {
    const row = projectMaterialRequestRow(materialRequest)
    assert.equal(row.code, 'MR-WO-2026-07-0001-01')
    assert.equal(row.itemLabel, 'RM-001')
    assert.equal(row.requiredQty, 25.5)
    assert.equal(row.uomLabel, 'kg')
    assert.equal(row.targetLocationLabel, 'SHOP-CS-01')
    assert.equal(row.status, 'PENDING')
  })

  it('falls back to "-" when business codes are absent from the payload', () => {
    const row = projectMaterialRequestRow({
      ...materialRequest,
      item_code: undefined,
      uom_code: undefined,
      target_location_code: undefined,
    })
    assert.equal(row.itemLabel, '-')
    assert.equal(row.uomLabel, '-')
    assert.equal(row.targetLocationLabel, '-')
  })
})

describe('resolveWorkOrderListState', () => {
  it('maps loading, empty, no-result, permission and error states', () => {
    assert.equal(
      resolveWorkOrderListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveWorkOrderListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveWorkOrderListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveWorkOrderListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
      'ready',
    )
    assert.equal(
      resolveWorkOrderListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
    assert.equal(
      resolveWorkOrderListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
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

describe('validateWorkOrderCreateForm', () => {
  it('requires code, item_id, planned_qty and planned_start', () => {
    const errors = validateWorkOrderCreateForm({ code: '', itemId: 0, plannedQty: 0, plannedStart: '' })
    assert.deepEqual(errors, ['code', 'item_id', 'planned_qty', 'planned_start'])
  })

  it('passes when required fields are valid', () => {
    const errors = validateWorkOrderCreateForm({
      code: 'WO-2026-07-0003',
      itemId: 10,
      plannedQty: 20,
      plannedStart: '2026-07-20T08:00',
    })
    assert.deepEqual(errors, [])
  })
})

describe('validateReasonForm', () => {
  it('requires a non-empty reason', () => {
    assert.deepEqual(validateReasonForm({ reason: '' }), ['reason'])
    assert.deepEqual(validateReasonForm({ reason: '   ' }), ['reason'])
    assert.deepEqual(validateReasonForm({ reason: 'Máy hỏng' }), [])
  })
})
