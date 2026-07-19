import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildGoodsReceiptLookups,
  findAllowedAction,
  isActionEnabled,
  projectAsnLineRow,
  projectAsnRow,
  projectAttachmentRow,
  projectGoodsReceiptLineRow,
  projectGoodsReceiptRow,
  projectPurchaseOrderLineRow,
  projectPurchaseOrderRow,
  resolveListState,
  resolveMutationUiState,
  validateAsnCreateForm,
  validateAttachCertificateForm,
  validateCancelReason,
  validatePurchaseOrderCreateForm,
} from './goodsReceiptProjection.ts'
import type {
  AsnLineRecord,
  AsnRecord,
  EntityAttachmentRecord,
  GoodsReceiptLineRecord,
  GoodsReceiptRecord,
  PurchaseOrderLineRecord,
  PurchaseOrderRecord,
} from '../types/goodsReceipt.ts'

const emptyLookups = buildGoodsReceiptLookups({ items: [], suppliers: [], uoms: [], locations: [] })

test('findAllowedAction / isActionEnabled resolve by action name', () => {
  const actions = [
    { action: 'update', method: 'PATCH', href: '/api/x', enabled: true },
    { action: 'cancel', method: 'POST', href: '/api/x/cancel', enabled: false, disabled_reason_code: 'NOT_ALLOWED_BY_STATUS' },
  ]
  assert.equal(findAllowedAction(actions, 'update')?.enabled, true)
  assert.equal(isActionEnabled(actions, 'cancel'), false)
  assert.equal(findAllowedAction(actions, 'missing'), null)
  assert.equal(isActionEnabled(undefined, 'update'), false)
})

test('buildGoodsReceiptLookups indexes by id', () => {
  const lookups = buildGoodsReceiptLookups({
    items: [{ id: 5, code: 'ITM-0100', item_name: 'Steel coil', is_active: true }],
    suppliers: [{ id: 10, code: 'SUP-ACME', supplier_name: 'Acme', is_active: true }],
    uoms: [{ id: 2, code: 'KG', uom_name: 'Kilogram', is_active: true }],
    locations: [{ id: 3, code: 'WH-RAW-A1', location_name: 'Raw A1', is_active: true }],
  })
  assert.equal(lookups.itemById.get(5)?.code, 'ITM-0100')
  assert.equal(lookups.supplierById.get(10)?.code, 'SUP-ACME')
  assert.equal(lookups.uomById.get(2)?.code, 'KG')
  assert.equal(lookups.locationById.get(3)?.code, 'WH-RAW-A1')
})

test('projectPurchaseOrderRow uses server allowed_actions, never status inference', () => {
  const row: PurchaseOrderRecord = {
    id: 1,
    code: 'PO-001',
    supplier_id: 10,
    order_date: '2026-07-01',
    expected_delivery_date: '2026-07-10',
    status: 'OPEN',
    created_by: 1,
    supplier_code: 'SUP-ACME',
    lines: [],
    allowed_actions: [
      { action: 'update', method: 'PATCH', href: '/api/wms/purchase-orders/PO-001', enabled: true },
      { action: 'cancel', method: 'POST', href: '/api/wms/purchase-orders/PO-001/cancel', enabled: true },
      {
        action: 'close',
        method: 'POST',
        href: '/api/wms/purchase-orders/PO-001/close',
        enabled: false,
        disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
      },
    ],
  }
  const projected = projectPurchaseOrderRow(row, emptyLookups)
  assert.equal(projected.supplierLabel, 'SUP-ACME')
  assert.equal(projected.canUpdate, true)
  assert.equal(projected.canCancel, true)
  assert.equal(projected.canClose, false)
  assert.equal(projected.closeDisabledReason, 'NOT_ALLOWED_BY_STATUS')
})

test('projectPurchaseOrderRow falls back to lookup map when supplier_code missing', () => {
  const row: PurchaseOrderRecord = {
    id: 2,
    code: 'PO-002',
    supplier_id: 7,
    order_date: '2026-07-01',
    expected_delivery_date: '2026-07-10',
    status: 'OPEN',
    created_by: 1,
  }
  const lookups = buildGoodsReceiptLookups({
    items: [],
    suppliers: [{ id: 7, code: 'SUP-FALLBACK', supplier_name: 'x', is_active: true }],
    uoms: [],
    locations: [],
  })
  assert.equal(projectPurchaseOrderRow(row, lookups).supplierLabel, 'SUP-FALLBACK')
})

test('projectPurchaseOrderLineRow projects business codes and remaining qty, never raw ids', () => {
  const line: PurchaseOrderLineRecord = {
    id: 1,
    code: 'PO-001-L1',
    purchase_order_id: 1,
    item_id: 5,
    ordered_qty: 100,
    uom_id: 2,
    received_qty: 40,
    requested_delivery_date: '2026-07-05',
    line_status: 'PARTIAL',
    item_code: 'ITM-0100',
    uom_code: 'KG',
  }
  const row = projectPurchaseOrderLineRow(line, emptyLookups)
  assert.equal(row.itemLabel, 'ITM-0100')
  assert.equal(row.uomLabel, 'KG')
  assert.equal(row.orderedQty, '100')
  assert.equal(row.receivedQty, '40')
  assert.equal(row.remainingQty, '60')
})

test('projectAsnRow and projectAsnLineRow', () => {
  const asn: AsnRecord = {
    id: 1,
    code: 'ASN-001',
    supplier_id: 10,
    expected_arrival_at: '2026-07-02T08:00:00Z',
    status: 'EXPECTED',
    created_by: 1,
    supplier_code: 'SUP-ACME',
    purchase_order_code: 'PO-001',
    lines: [],
    allowed_actions: [
      { action: 'arrive', method: 'POST', href: '/api/wms/asns/ASN-001/arrive', enabled: true },
      {
        action: 'start_receiving',
        method: 'POST',
        href: '/api/wms/asns/ASN-001/start-receiving',
        enabled: false,
        disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
      },
    ],
  }
  const row = projectAsnRow(asn, emptyLookups)
  assert.equal(row.purchaseOrderLabel, 'PO-001')
  assert.equal(row.canArrive, true)
  assert.equal(row.canStartReceiving, false)
  assert.equal(row.startReceivingDisabledReason, 'NOT_ALLOWED_BY_STATUS')

  const line: AsnLineRecord = {
    id: 1,
    code: 'ASN-001-L1',
    asn_header_id: 1,
    item_id: 5,
    supplier_lot: 'SL-9',
    shipped_qty: 50,
    uom_id: 2,
    item_code: 'ITM-0100',
    uom_code: 'KG',
  }
  const lineRow = projectAsnLineRow(line, emptyLookups)
  assert.equal(lineRow.itemLabel, 'ITM-0100')
  assert.equal(lineRow.supplierLot, 'SL-9')
  assert.equal(lineRow.shippedQty, '50')
})

test('projectGoodsReceiptRow and projectGoodsReceiptLineRow', () => {
  const gr: GoodsReceiptRecord = {
    id: 1,
    code: 'GRN-001',
    source_type: 'PO',
    source_ref_code: 'PO-001',
    supplier_code: 'SUP-ACME',
    received_at: '2026-07-03T09:00:00Z',
    received_by: 1,
    status: 'DRAFT',
    lines: [],
    allowed_actions: [
      { action: 'update', method: 'PATCH', href: '/api/wms/goods-receipts/GRN-001', enabled: true },
      {
        action: 'mill_certificate',
        method: 'POST',
        href: '/api/wms/goods-receipts/GRN-001/mill-certificates',
        enabled: true,
      },
    ],
  }
  const row = projectGoodsReceiptRow(gr, emptyLookups)
  assert.equal(row.sourceLabel, 'PO · PO-001')
  assert.equal(row.canUpdate, true)
  assert.equal(row.canAttachMillCertificate, true)
  assert.equal(row.canCancel, false)

  const line: GoodsReceiptLineRecord = {
    id: 1,
    code: 'GRN-001-L1',
    goods_receipt_header_id: 1,
    item_id: 5,
    lot_id: 9,
    received_qty: 40,
    uom_id: 2,
    received_location_id: 3,
    qc_status_initial: 'PENDING',
    item_code: 'ITM-0100',
    lot_code: 'LOT-0009',
    uom_code: 'KG',
    received_location_code: 'WH-RAW-A1',
  }
  const lineRow = projectGoodsReceiptLineRow(line, emptyLookups)
  assert.equal(lineRow.lotLabel, 'LOT-0009')
  assert.equal(lineRow.lotId, 9)
  assert.equal(lineRow.receivedLocationLabel, 'WH-RAW-A1')
})

test('projectAttachmentRow', () => {
  const record: EntityAttachmentRecord = {
    id: 1,
    code: 'ATT-001',
    file_id: 42,
    parent_type: 'lot',
    parent_id: 9,
    attachment_type: 'MILL_CERTIFICATE',
    caption: 'Mill cert',
    uploaded_by: 1,
    uploaded_at: '2026-07-04T00:00:00Z',
  }
  const row = projectAttachmentRow(record)
  assert.equal(row.fileId, 42)
  assert.equal(row.attachmentType, 'MILL_CERTIFICATE')
})

test('resolveListState covers all deterministic states', () => {
  assert.equal(
    resolveListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
    'loading',
  )
  assert.equal(
    resolveListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'PERMISSION_DENIED' }),
    'permission-denied',
  )
  assert.equal(
    resolveListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'SOMETHING' }),
    'error',
  )
  assert.equal(
    resolveListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
    'empty',
  )
  assert.equal(
    resolveListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
    'no-result',
  )
  assert.equal(
    resolveListState({ status: 'success', itemCount: 3, hasQuery: false, errorCode: null }),
    'ready',
  )
})

test('resolveMutationUiState maps canonical error codes deterministically', () => {
  assert.equal(
    resolveMutationUiState({ confirmOpen: false, status: 'idle', errorCode: null }),
    'idle',
  )
  assert.equal(
    resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }),
    'confirm',
  )
  assert.equal(
    resolveMutationUiState({ confirmOpen: false, status: 'pending', errorCode: null }),
    'pending',
  )
  assert.equal(
    resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'PERMISSION_DENIED' }),
    'permission-denied',
  )
  assert.equal(
    resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'NOT_ALLOWED_BY_STATUS' }),
    'not-allowed',
  )
  assert.equal(
    resolveMutationUiState({ confirmOpen: false, status: 'error', errorCode: 'OTHER' }),
    'error',
  )
})

test('validatePurchaseOrderCreateForm requires header fields, at least one line, and valid line fields', () => {
  assert.deepEqual(
    validatePurchaseOrderCreateForm({
      code: '',
      supplierCode: '',
      orderDate: '',
      expectedDeliveryDate: '',
      lines: [],
    }),
    ['code', 'supplier_code', 'order_date', 'expected_delivery_date', 'lines'],
  )
  assert.deepEqual(
    validatePurchaseOrderCreateForm({
      code: 'PO-1',
      supplierCode: 'SUP-1',
      orderDate: '2026-07-01',
      expectedDeliveryDate: '2026-07-10',
      lines: [
        {
          code: 'L1',
          itemCode: 'ITM-1',
          orderedQty: 10,
          uomCode: 'KG',
          requestedDeliveryDate: '2026-07-10',
        },
      ],
    }),
    [],
  )
  assert.deepEqual(
    validatePurchaseOrderCreateForm({
      code: 'PO-1',
      supplierCode: 'SUP-1',
      orderDate: '2026-07-01',
      expectedDeliveryDate: '2026-07-10',
      lines: [{ code: '', itemCode: '', orderedQty: 0, uomCode: '', requestedDeliveryDate: '' }],
    }),
    [
      'lines[0].code',
      'lines[0].item_code',
      'lines[0].ordered_qty',
      'lines[0].uom_code',
      'lines[0].requested_delivery_date',
    ],
  )
})

test('validateAsnCreateForm requires header fields, at least one line, and valid line fields', () => {
  assert.deepEqual(
    validateAsnCreateForm({ code: '', supplierCode: '', expectedArrivalAt: '', lines: [] }),
    ['code', 'supplier_code', 'expected_arrival_at', 'lines'],
  )
  assert.deepEqual(
    validateAsnCreateForm({
      code: 'ASN-1',
      supplierCode: 'SUP-1',
      expectedArrivalAt: '2026-07-02T08:00',
      lines: [
        { code: 'L1', itemCode: 'ITM-1', supplierLot: 'SL-1', shippedQty: 5, uomCode: 'KG' },
      ],
    }),
    [],
  )
  assert.deepEqual(
    validateAsnCreateForm({
      code: 'ASN-1',
      supplierCode: 'SUP-1',
      expectedArrivalAt: '2026-07-02T08:00',
      lines: [{ code: '', itemCode: '', supplierLot: '', shippedQty: 0, uomCode: '' }],
    }),
    ['lines[0].code', 'lines[0].item_code', 'lines[0].supplier_lot', 'lines[0].shipped_qty', 'lines[0].uom_code'],
  )
})

test('validateCancelReason requires non-empty reason', () => {
  assert.deepEqual(validateCancelReason(''), ['reason'])
  assert.deepEqual(validateCancelReason('  '), ['reason'])
  assert.deepEqual(validateCancelReason('Damaged shipment'), [])
})

test('validateAttachCertificateForm requires file and lot code', () => {
  assert.deepEqual(validateAttachCertificateForm({ hasFile: false, lotCode: '' }), ['file', 'lot_code'])
  assert.deepEqual(validateAttachCertificateForm({ hasFile: true, lotCode: 'LOT-0009' }), [])
})
