import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildVarianceReviews,
  projectBalanceRow,
  projectStockTransactionRow,
  projectStocktakeRow,
  resolveListState,
  validateStocktakeCreate,
  validateTransferLine,
} from './inventoryProjection.ts'
import type {
  StockBalanceRecord,
  StockTransactionRecord,
  StocktakeRecord,
} from '../types/inventory.ts'

const balance: StockBalanceRecord = {
  id: 91,
  code: 'BAL-001',
  location_id: 10,
  item_id: 20,
  lot_id: 30,
  qty_on_hand: 100,
  qty_reserved: 25,
  qty_available: 75,
  last_movement_at: '2026-07-18T01:00:00Z',
  location_code: 'BIN-A01',
  item_code: 'MAT-001',
  lot_code: 'LOT-001',
}

const transaction: StockTransactionRecord = {
  id: 41,
  code: 'TX-001',
  transaction_type_id: 1,
  transaction_type_code: 'TRANSFER',
  reference_type: 'TRANSFER_ORDER',
  performed_by: 7,
  performed_at: '2026-07-18T02:00:00Z',
  status: 'POSTED',
  lines: [
    {
      id: 42,
      code: 'TX-001-L01',
      transaction_header_id: 41,
      item_id: 20,
      lot_id: 30,
      from_location_id: 10,
      to_location_id: 11,
      qty: 5,
      uom_id: 2,
      qty_in_base_uom: 5,
      item_code: 'MAT-001',
      lot_code: 'LOT-001',
      from_location_code: 'BIN-A01',
      to_location_code: 'BIN-B01',
    },
  ],
}

const stocktake: StocktakeRecord = {
  id: 1,
  code: 'ST-2026-07-0001',
  scope_type: 'ZONE',
  scope_filter: { location_codes: ['BIN-A01'] },
  cutoff_at: '2026-07-18T03:00:00Z',
  status: 'RECONCILED',
  total_bins: 1,
  counts: [
    {
      id: 2,
      code: 'STC-001',
      stocktake_id: 1,
      location_id: 10,
      item_id: 20,
      lot_id: 30,
      book_qty: 100,
      counted_qty: 95,
      variance: -5,
      variance_pct: -5,
      location_code: 'BIN-A01',
      item_code: 'MAT-001',
      lot_code: 'LOT-001',
      recount_required: true,
    },
  ],
  allowed_actions: [
    {
      action: 'request_adjustment',
      method: 'POST',
      href: '/api/wms/stocktakes/ST-2026-07-0001/request-adjustment',
      enabled: true,
    },
    {
      action: 'cancel',
      method: 'POST',
      href: '/api/wms/stocktakes/ST-2026-07-0001/cancel',
      enabled: true,
    },
  ],
}

describe('inventory projections', () => {
  it('projects balance business codes and quantities without raw ids', () => {
    const row = projectBalanceRow(balance)
    assert.equal(row.locationLabel, 'BIN-A01')
    assert.equal(row.itemLabel, 'MAT-001')
    assert.equal(row.lotLabel, 'LOT-001')
    assert.equal(row.availableQty, '75')
    assert.equal('locationId' in row, false)
  })

  it('projects transaction detail using joined business codes', () => {
    const row = projectStockTransactionRow(transaction)
    assert.equal(row.transactionTypeLabel, 'TRANSFER')
    assert.equal(row.performedByLabel, 'User #7')
    assert.equal(row.lineRows[0]?.fromLocationLabel, 'BIN-A01')
    assert.equal(row.lineRows[0]?.toLocationLabel, 'BIN-B01')
  })

  it('gates stocktake actions strictly from server allowed_actions', () => {
    const row = projectStocktakeRow(stocktake)
    assert.equal(row.canRequestAdjustment, true)
    assert.equal(row.canCancel, true)
    assert.equal(row.canStart, false)

    const withoutActions = projectStocktakeRow({ ...stocktake, allowed_actions: undefined })
    assert.equal(withoutActions.canRequestAdjustment, false)
    assert.equal(withoutActions.canCancel, false)
  })

  it('builds variance reviews only for nonzero variances with a reason', () => {
    const reviews = buildVarianceReviews(stocktake.counts ?? [], 'COUNT_ERROR', 'Verified')
    assert.deepEqual(reviews, [
      {
        location_code: 'BIN-A01',
        item_code: 'MAT-001',
        lot_code: 'LOT-001',
        variance_reason: 'COUNT_ERROR',
        note: 'Verified',
      },
    ])
    assert.deepEqual(buildVarianceReviews(stocktake.counts ?? [], '', ''), [])
  })
})

describe('inventory validation and states', () => {
  it('requires scope_filter for ZONE/CYCLE but not FULL', () => {
    assert.deepEqual(
      validateStocktakeCreate({ scope_type: 'ZONE', scope_filter_text: '', cutoff_at: '' }),
      ['scope_filter', 'cutoff_at'],
    )
    assert.deepEqual(
      validateStocktakeCreate({
        scope_type: 'FULL',
        scope_filter_text: '',
        cutoff_at: '2026-07-18T03:00',
      }),
      [],
    )
  })

  it('requires transfer business codes and positive quantity', () => {
    assert.deepEqual(
      validateTransferLine({
        item_code: '',
        lot_code: '',
        from_location_code: '',
        to_location_code: '',
        quantity: 0,
      }),
      ['item_code', 'from_location_code', 'to_location_code', 'quantity'],
    )
  })

  it('distinguishes loading, empty, no-result, permission and ready', () => {
    assert.equal(resolveListState('loading', 0, false, null), 'loading')
    assert.equal(resolveListState('success', 0, false, null), 'empty')
    assert.equal(resolveListState('success', 0, true, null), 'no-result')
    assert.equal(resolveListState('error', 0, false, 'PERMISSION_DENIED'), 'permission-denied')
    assert.equal(resolveListState('success', 1, false, null), 'ready')
  })
})
