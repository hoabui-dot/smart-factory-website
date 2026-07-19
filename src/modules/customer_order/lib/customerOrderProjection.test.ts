import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  projectCustomerItemRow,
  projectCustomerOrderRow,
  projectCustomerRow,
  projectShipmentRow,
  resolveListState,
  validateCancelReason,
  validateCustomerCreate,
  validateCustomerOrderCreate,
} from './customerOrderProjection.ts'
import type {
  CustomerItemRecord,
  CustomerOrderRecord,
  CustomerRecord,
} from '../types/customerOrder.ts'

const customer: CustomerRecord = {
  id: 1,
  code: 'CUS-001',
  customer_name: 'Acme',
  country_code: 'VN',
  iatf_required: true,
  ppap_level_default: '3',
  target_ppm: 50,
  contact_email: 'a@b.c',
  is_active: true,
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/mes/customers/CUS-001', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/mes/customers/CUS-001', enabled: true },
  ],
}

describe('projectCustomerRow', () => {
  it('gates update/deactivate from allowed_actions only', () => {
    const row = projectCustomerRow(customer)
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
    assert.equal(row.customerName, 'Acme')
  })

  it('does not invent deactivate from is_active alone', () => {
    const row = projectCustomerRow({ ...customer, is_active: true, allowed_actions: [] })
    assert.equal(row.canDeactivate, false)
  })
})

describe('projectCustomerItemRow', () => {
  it('projects business codes', () => {
    const item: CustomerItemRecord = {
      id: 2,
      code: 'CI-001',
      customer_id: 1,
      item_id: 10,
      customer_part_name: 'Part',
      characteristic_class: 'SC',
      packaging_spec: 'box',
      is_active: true,
      customer_code: 'CUS-001',
      item_code: 'FG-001',
      allowed_actions: [
        { action: 'update', method: 'PATCH', href: '/api/mes/customer-items/CI-001', enabled: true },
      ],
    }
    const row = projectCustomerItemRow(item)
    assert.equal(row.customerLabel, 'CUS-001')
    assert.equal(row.itemLabel, 'FG-001')
    assert.equal(row.canUpdate, true)
  })
})

describe('projectCustomerOrderRow', () => {
  it('gates lifecycle from allowed_actions, never status alone', () => {
    const draft: CustomerOrderRecord = {
      id: 3,
      code: 'CO-001',
      customer_id: 1,
      customer_po_no: 'PO-1',
      received_date: '2026-07-01',
      requested_delivery_date: '2026-08-01',
      incoterm: 'FOB',
      status: 'DRAFT',
      created_by: 9,
      customer_code: 'CUS-001',
      allowed_actions: [
        { action: 'update', method: 'PATCH', href: '/api/mes/customer-orders/CO-001', enabled: true },
        {
          action: 'confirm',
          method: 'POST',
          href: '/api/mes/customer-orders/CO-001/confirm',
          enabled: true,
        },
        {
          action: 'cancel',
          method: 'POST',
          href: '/api/mes/customer-orders/CO-001/cancel',
          enabled: true,
        },
      ],
    }
    const row = projectCustomerOrderRow(draft)
    assert.equal(row.canConfirm, true)
    assert.equal(row.canCancel, true)
    assert.equal(row.canClose, false)
    assert.equal(row.createdByLabel, 'User #9')

    const noActions = projectCustomerOrderRow({ ...draft, status: 'DRAFT', allowed_actions: [] })
    assert.equal(noActions.canConfirm, false)
  })
})

describe('findAllowedAction / resolveListState / validators', () => {
  it('helpers', () => {
    assert.equal(findAllowedAction(customer.allowed_actions, 'update')?.enabled, true)
    assert.equal(
      resolveListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.deepEqual(
      validateCustomerCreate({ code: '', customer_name: '', country_code: '', contact_email: '' }),
      ['code', 'customer_name', 'country_code', 'contact_email'],
    )
    assert.deepEqual(validateCancelReason(''), ['reason'])
    assert.deepEqual(
      validateCustomerOrderCreate({
        code: 'CO-1',
        customer_id: 1,
        customer_po_no: 'P',
        received_date: '2026-07-01',
        requested_delivery_date: '2026-08-01',
        incoterm: 'FOB',
        lines: [],
      }),
      ['lines'],
    )
  })
})

describe('projectShipmentRow', () => {
  it('gates ship from allowed_actions and surfaces ERR_COC_REQUIRED', () => {
    const row = projectShipmentRow({
      id: 1,
      code: 'SHP-1',
      customer_id: 2,
      shipped_at: '2026-07-18T00:00:00Z',
      carrier: 'VNPost',
      status: 'PICKED',
      customer_code: 'CUS-1',
      allowed_actions: [
        {
          action: 'ship',
          method: 'POST',
          href: '/api/mes/shipments/SHP-1/ship',
          enabled: false,
          disabled_reason_code: 'ERR_COC_REQUIRED',
        },
        {
          action: 'coc-generate',
          method: 'POST',
          href: '/api/mes/shipments/SHP-1/coc:generate',
          enabled: true,
        },
      ],
    })
    assert.equal(row.canShip, false)
    assert.equal(row.shipDisabledReason, 'ERR_COC_REQUIRED')
    assert.equal(row.canCocGenerate, true)
    assert.equal(row.customerLabel, 'CUS-1')
  })
})
