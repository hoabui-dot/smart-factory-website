import type {
  AllowedAction,
  AsnLineRecord,
  AsnLineRow,
  AsnRecord,
  AsnRow,
  AttachmentRow,
  EntityAttachmentRecord,
  GoodsReceiptLineRecord,
  GoodsReceiptLineRow,
  GoodsReceiptRecord,
  GoodsReceiptRow,
  GoodsReceiptLookups,
  ItemLookupRecord,
  LocationLookupRecord,
  PurchaseOrderLineRecord,
  PurchaseOrderLineRow,
  PurchaseOrderRecord,
  PurchaseOrderRow,
  SupplierLookupRecord,
  UomLookupRecord,
} from '../types/goodsReceipt'

const UNAVAILABLE = '-'

/** Never infer mutation availability from status/fields — server allowed_actions is authoritative. */
export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function isActionEnabled(actions: AllowedAction[] | undefined, action: string): boolean {
  return findAllowedAction(actions, action)?.enabled === true
}

/** Builds id->record lookup maps so raw FK ids are never rendered (WEB-WMS-03-GOODS-RECEIPT §C). */
export function buildGoodsReceiptLookups(input: {
  items: ItemLookupRecord[]
  suppliers: SupplierLookupRecord[]
  uoms: UomLookupRecord[]
  locations: LocationLookupRecord[]
}): GoodsReceiptLookups {
  const itemById = new Map<number, ItemLookupRecord>()
  for (const item of input.items) itemById.set(item.id, item)

  const supplierById = new Map<number, SupplierLookupRecord>()
  for (const supplier of input.suppliers) supplierById.set(supplier.id, supplier)

  const uomById = new Map<number, UomLookupRecord>()
  for (const uom of input.uoms) uomById.set(uom.id, uom)

  const locationById = new Map<number, LocationLookupRecord>()
  for (const location of input.locations) locationById.set(location.id, location)

  return { itemById, supplierById, uomById, locationById }
}

export function projectPurchaseOrderLineRow(
  line: PurchaseOrderLineRecord,
  lookups: GoodsReceiptLookups,
): PurchaseOrderLineRow {
  const remaining = line.ordered_qty - line.received_qty
  return {
    code: line.code || UNAVAILABLE,
    itemLabel: line.item_code || lookups.itemById.get(line.item_id)?.code || UNAVAILABLE,
    supplierItemCode: line.supplier_item_code || UNAVAILABLE,
    orderedQty: String(line.ordered_qty),
    receivedQty: String(line.received_qty),
    remainingQty: String(remaining),
    uomLabel: line.uom_code || lookups.uomById.get(line.uom_id)?.code || UNAVAILABLE,
    requestedDeliveryDate: line.requested_delivery_date || UNAVAILABLE,
    lineStatus: line.line_status || UNAVAILABLE,
  }
}

export function projectPurchaseOrderRow(
  po: PurchaseOrderRecord,
  lookups: GoodsReceiptLookups,
): PurchaseOrderRow {
  const updateAction = findAllowedAction(po.allowed_actions, 'update')
  const cancelAction = findAllowedAction(po.allowed_actions, 'cancel')
  const closeAction = findAllowedAction(po.allowed_actions, 'close')
  return {
    code: po.code || UNAVAILABLE,
    supplierLabel: po.supplier_code || lookups.supplierById.get(po.supplier_id)?.code || UNAVAILABLE,
    orderDate: po.order_date || UNAVAILABLE,
    expectedDeliveryDate: po.expected_delivery_date || UNAVAILABLE,
    status: po.status || UNAVAILABLE,
    notes: po.notes || UNAVAILABLE,
    lineRows: (po.lines ?? []).map((line) => projectPurchaseOrderLineRow(line, lookups)),
    canUpdate: updateAction?.enabled === true,
    canCancel: cancelAction?.enabled === true,
    canClose: closeAction?.enabled === true,
    updateAction,
    cancelAction,
    closeAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    cancelDisabledReason: cancelAction?.enabled ? null : cancelAction?.disabled_reason_code ?? null,
    closeDisabledReason: closeAction?.enabled ? null : closeAction?.disabled_reason_code ?? null,
  }
}

export function projectAsnLineRow(line: AsnLineRecord, lookups: GoodsReceiptLookups): AsnLineRow {
  return {
    code: line.code || UNAVAILABLE,
    itemLabel: line.item_code || lookups.itemById.get(line.item_id)?.code || UNAVAILABLE,
    supplierLot: line.supplier_lot || UNAVAILABLE,
    shippedQty: String(line.shipped_qty),
    uomLabel: line.uom_code || lookups.uomById.get(line.uom_id)?.code || UNAVAILABLE,
    manufacturingDate: line.manufacturing_date || UNAVAILABLE,
    expiryDate: line.expiry_date || UNAVAILABLE,
  }
}

export function projectAsnRow(asn: AsnRecord, lookups: GoodsReceiptLookups): AsnRow {
  const updateAction = findAllowedAction(asn.allowed_actions, 'update')
  const arriveAction = findAllowedAction(asn.allowed_actions, 'arrive')
  const startReceivingAction = findAllowedAction(asn.allowed_actions, 'start_receiving')
  const cancelAction = findAllowedAction(asn.allowed_actions, 'cancel')
  return {
    code: asn.code || UNAVAILABLE,
    purchaseOrderLabel: asn.purchase_order_code || UNAVAILABLE,
    supplierLabel:
      asn.supplier_code || lookups.supplierById.get(asn.supplier_id)?.code || UNAVAILABLE,
    expectedArrivalAt: asn.expected_arrival_at || UNAVAILABLE,
    vehicleNo: asn.vehicle_no || UNAVAILABLE,
    status: asn.status || UNAVAILABLE,
    lineRows: (asn.lines ?? []).map((line) => projectAsnLineRow(line, lookups)),
    canUpdate: updateAction?.enabled === true,
    canArrive: arriveAction?.enabled === true,
    canStartReceiving: startReceivingAction?.enabled === true,
    canCancel: cancelAction?.enabled === true,
    updateAction,
    arriveAction,
    startReceivingAction,
    cancelAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    arriveDisabledReason: arriveAction?.enabled ? null : arriveAction?.disabled_reason_code ?? null,
    startReceivingDisabledReason: startReceivingAction?.enabled
      ? null
      : startReceivingAction?.disabled_reason_code ?? null,
    cancelDisabledReason: cancelAction?.enabled ? null : cancelAction?.disabled_reason_code ?? null,
  }
}

export function projectGoodsReceiptLineRow(
  line: GoodsReceiptLineRecord,
  lookups: GoodsReceiptLookups,
): GoodsReceiptLineRow {
  return {
    code: line.code || UNAVAILABLE,
    itemLabel: line.item_code || lookups.itemById.get(line.item_id)?.code || UNAVAILABLE,
    lotLabel: line.lot_code || UNAVAILABLE,
    lotId: line.lot_id,
    receivedQty: String(line.received_qty),
    uomLabel: line.uom_code || lookups.uomById.get(line.uom_id)?.code || UNAVAILABLE,
    receivedLocationLabel:
      line.received_location_code ||
      lookups.locationById.get(line.received_location_id)?.code ||
      UNAVAILABLE,
    qcStatusInitial: line.qc_status_initial || UNAVAILABLE,
    remark: line.remark || UNAVAILABLE,
  }
}

export function projectGoodsReceiptRow(
  grn: GoodsReceiptRecord,
  lookups: GoodsReceiptLookups,
): GoodsReceiptRow {
  const updateAction = findAllowedAction(grn.allowed_actions, 'update')
  const cancelAction = findAllowedAction(grn.allowed_actions, 'cancel')
  const attachAction = findAllowedAction(grn.allowed_actions, 'mill_certificate')
  const supplierLabel =
    grn.supplier_code ||
    (grn.supplier_id != null ? lookups.supplierById.get(grn.supplier_id)?.code : undefined) ||
    UNAVAILABLE
  return {
    code: grn.code || UNAVAILABLE,
    sourceLabel: `${grn.source_type}${grn.source_ref_code ? ` · ${grn.source_ref_code}` : ''}`,
    supplierLabel,
    receivedAt: grn.received_at || UNAVAILABLE,
    status: grn.status || UNAVAILABLE,
    lineRows: (grn.lines ?? []).map((line) => projectGoodsReceiptLineRow(line, lookups)),
    canUpdate: updateAction?.enabled === true,
    canCancel: cancelAction?.enabled === true,
    canAttachMillCertificate: attachAction?.enabled === true,
    updateAction,
    cancelAction,
    attachMillCertificateAction: attachAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    cancelDisabledReason: cancelAction?.enabled ? null : cancelAction?.disabled_reason_code ?? null,
  }
}

export function projectAttachmentRow(row: EntityAttachmentRecord): AttachmentRow {
  return {
    id: row.id,
    fileId: row.file_id,
    attachmentType: row.attachment_type || UNAVAILABLE,
    caption: row.caption || UNAVAILABLE,
    uploadedAtLabel: row.uploaded_at || UNAVAILABLE,
  }
}

export function resolveListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode: string | null
}): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) return input.hasQuery ? 'no-result' : 'empty'
  return 'ready'
}

export function resolveMutationUiState(input: {
  confirmOpen: boolean
  status: 'idle' | 'pending' | 'success' | 'error'
  errorCode: string | null
}): 'idle' | 'confirm' | 'pending' | 'success' | 'permission-denied' | 'not-allowed' | 'error' {
  if (input.status === 'pending') return 'pending'
  if (input.status === 'success') return 'success'
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
    if (input.errorCode === 'NOT_ALLOWED_BY_STATUS') return 'not-allowed'
    return 'error'
  }
  return input.confirmOpen ? 'confirm' : 'idle'
}

export function validatePurchaseOrderCreateForm(input: {
  code: string
  supplierCode: string
  orderDate: string
  expectedDeliveryDate: string
  lines: Array<{ code: string; itemCode: string; orderedQty: number; uomCode: string; requestedDeliveryDate: string }>
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.supplierCode.trim()) errors.push('supplier_code')
  if (!input.orderDate.trim()) errors.push('order_date')
  if (!input.expectedDeliveryDate.trim()) errors.push('expected_delivery_date')
  if (input.lines.length === 0) errors.push('lines')
  input.lines.forEach((line, idx) => {
    if (!line.code.trim()) errors.push(`lines[${idx}].code`)
    if (!line.itemCode.trim()) errors.push(`lines[${idx}].item_code`)
    if (!Number.isFinite(line.orderedQty) || line.orderedQty <= 0) {
      errors.push(`lines[${idx}].ordered_qty`)
    }
    if (!line.uomCode.trim()) errors.push(`lines[${idx}].uom_code`)
    if (!line.requestedDeliveryDate.trim()) errors.push(`lines[${idx}].requested_delivery_date`)
  })
  return errors
}

export function validateAsnCreateForm(input: {
  code: string
  supplierCode: string
  expectedArrivalAt: string
  lines: Array<{ code: string; itemCode: string; supplierLot: string; shippedQty: number; uomCode: string }>
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.supplierCode.trim()) errors.push('supplier_code')
  if (!input.expectedArrivalAt.trim()) errors.push('expected_arrival_at')
  if (input.lines.length === 0) errors.push('lines')
  input.lines.forEach((line, idx) => {
    if (!line.code.trim()) errors.push(`lines[${idx}].code`)
    if (!line.itemCode.trim()) errors.push(`lines[${idx}].item_code`)
    if (!line.supplierLot.trim()) errors.push(`lines[${idx}].supplier_lot`)
    if (!Number.isFinite(line.shippedQty) || line.shippedQty <= 0) {
      errors.push(`lines[${idx}].shipped_qty`)
    }
    if (!line.uomCode.trim()) errors.push(`lines[${idx}].uom_code`)
  })
  return errors
}

/** WMS03-005/012/018: reason is a defined API field (not client-invented); required non-empty. */
export function validateCancelReason(reason: string): string[] {
  return reason.trim() ? [] : ['reason']
}

export function validateAttachCertificateForm(input: {
  hasFile: boolean
  lotCode: string
}): string[] {
  const errors: string[] = []
  if (!input.hasFile) errors.push('file')
  if (!input.lotCode.trim()) errors.push('lot_code')
  return errors
}
