export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type ReferenceListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export const PO_STATUSES = [
  'OPEN',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CLOSED',
  'CANCELLED',
] as const
export type PoStatus = (typeof PO_STATUSES)[number]

export const ASN_STATUSES = ['EXPECTED', 'ARRIVED', 'RECEIVING', 'RECEIVED', 'CANCELLED'] as const
export type AsnStatus = (typeof ASN_STATUSES)[number]

export const GRN_STATUSES = ['DRAFT', 'CONFIRMED', 'CANCELLED'] as const
export type GrnStatus = (typeof GRN_STATUSES)[number]

/** WMS03-001..005 purchase_order_line — physical FK ids kept for resolution only (API-SPEC §6.4). */
export type PurchaseOrderLineRecord = {
  id: number
  code: string
  purchase_order_id: number
  item_id: number
  supplier_item_code?: string | null
  ordered_qty: number
  uom_id: number
  received_qty: number
  requested_delivery_date: string
  line_status: string
  item_code?: string
  uom_code?: string
}

/** WMS03-001..005 purchase_order_header record. */
export type PurchaseOrderRecord = {
  id: number
  code: string
  supplier_id: number
  order_date: string
  expected_delivery_date: string
  status: PoStatus | string
  created_by: number
  notes?: string | null
  supplier_code?: string
  lines?: PurchaseOrderLineRecord[]
  allowed_actions?: AllowedAction[]
}

export type PurchaseOrderListPage = { items: PurchaseOrderRecord[]; page: PageMeta }
export type PurchaseOrderListQuery = { limit?: number; cursor?: string; sort?: string; q?: string }

/** WMS03-003 PO line create input. */
export type PurchaseOrderLineCreateInput = {
  code: string
  item_code: string
  supplier_item_code?: string | null
  ordered_qty: number
  uom_code: string
  requested_delivery_date: string
}

/** WMS03-003 request DTO. */
export type PurchaseOrderCreateRequest = {
  code: string
  supplier_code: string
  order_date: string
  expected_delivery_date: string
  notes?: string | null
  lines: PurchaseOrderLineCreateInput[]
}

/** WMS03-004 sparse PATCH body. */
export type PurchaseOrderUpdateRequest = {
  expected_delivery_date?: string
  notes?: string | null
}

/** WMS03-005/012/018 shared cancel-reason request DTO. */
export type CancelRequest = {
  reason: string
}

/** WMS03-006..009 asn_line — physical FK ids kept for resolution only. */
export type AsnLineRecord = {
  id: number
  code: string
  asn_header_id: number
  purchase_order_line_id?: number | null
  item_id: number
  supplier_lot: string
  shipped_qty: number
  uom_id: number
  manufacturing_date?: string | null
  expiry_date?: string | null
  item_code?: string
  uom_code?: string
}

/** WMS03-006..012 asn_header record. */
export type AsnRecord = {
  id: number
  code: string
  purchase_order_id?: number | null
  supplier_id: number
  expected_arrival_at: string
  vehicle_no?: string | null
  status: AsnStatus | string
  created_by: number
  supplier_code?: string
  purchase_order_code?: string | null
  lines?: AsnLineRecord[]
  allowed_actions?: AllowedAction[]
}

export type AsnListPage = { items: AsnRecord[]; page: PageMeta }
export type AsnListQuery = { limit?: number; cursor?: string; sort?: string; q?: string }

/** WMS03-008 ASN line create input. */
export type AsnLineCreateInput = {
  code: string
  purchase_order_line_code?: string | null
  item_code: string
  supplier_lot: string
  shipped_qty: number
  uom_code: string
  manufacturing_date?: string | null
  expiry_date?: string | null
}

/** WMS03-008 request DTO. */
export type AsnCreateRequest = {
  code: string
  purchase_order_code?: string | null
  supplier_code: string
  expected_arrival_at: string
  vehicle_no?: string | null
  lines: AsnLineCreateInput[]
}

/** WMS03-009 sparse PATCH body. */
export type AsnUpdateRequest = {
  expected_arrival_at?: string
  vehicle_no?: string | null
}

/** WMS03-013..016 goods_receipt_line — physical FK ids kept for resolution only. */
export type GoodsReceiptLineRecord = {
  id: number
  code: string
  goods_receipt_header_id: number
  purchase_order_line_id?: number | null
  asn_line_id?: number | null
  item_id: number
  lot_id: number
  finished_lot_id?: number | null
  received_qty: number
  uom_id: number
  received_location_id: number
  qc_status_initial: string
  remark?: string | null
  item_code?: string
  lot_code?: string
  uom_code?: string
  received_location_code?: string
}

/** WMS03-013..018 goods_receipt_header record. */
export type GoodsReceiptRecord = {
  id: number
  code: string
  source_type: string
  source_ref_id?: number | null
  supplier_id?: number | null
  received_at: string
  received_by: number
  status: GrnStatus | string
  stock_transaction_header_id?: number | null
  inspection_result_id?: number | null
  supplier_code?: string | null
  source_ref_code?: string | null
  lines?: GoodsReceiptLineRecord[]
  allowed_actions?: AllowedAction[]
}

export type GoodsReceiptListPage = { items: GoodsReceiptRecord[]; page: PageMeta }
export type GoodsReceiptListQuery = { limit?: number; cursor?: string; sort?: string; q?: string }

/** WMS03-016 sparse PATCH body — Web only exposes received_at; line re-submission is out of scope. */
export type GoodsReceiptUpdateRequest = {
  received_at?: string
}

/** WMS03-019 request DTO — file_id is a finalized NB-04 upload id, lot_code is the received lot. */
export type AttachMillCertificateRequest = {
  file_id: number
  lot_code: string
}

export type ItemLookupRecord = {
  id: number
  code: string
  item_name: string
  is_active: boolean
}

export type SupplierLookupRecord = {
  id: number
  code: string
  supplier_name: string
  is_active: boolean
}

export type UomLookupRecord = {
  id: number
  code: string
  uom_name: string
  is_active: boolean
}

export type LocationLookupRecord = {
  id: number
  code: string
  location_name: string
  is_active: boolean
}

export type GoodsReceiptLookups = {
  itemById: Map<number, ItemLookupRecord>
  supplierById: Map<number, SupplierLookupRecord>
  uomById: Map<number, UomLookupRecord>
  locationById: Map<number, LocationLookupRecord>
}

/** entity_attachments record shared with NB-04 (API-SPEC §15.25.2). */
export type EntityAttachmentRecord = {
  id: number
  code: string
  file_id: number
  parent_type: string
  parent_id: number
  attachment_type: string
  caption?: string | null
  uploaded_by: number
  uploaded_at: string
}

export type AttachmentListPage = { items: EntityAttachmentRecord[]; page: PageMeta }

/** NB04-001 request DTO. */
export type AuthorizeUploadRequest = {
  file_purpose: string
  owner_module: string
  entity_type: string
  entity_id: number
  file_name: string
  mime_type: string
  size_bytes: number
  checksum_sha256: string
}

/** NB04-001 response DTO — `upload_id` doubles as the finalize/attach `file_id`. */
export type AuthorizeUploadResult = {
  upload_id: number
  upload_url: string
  upload_method: string
  upload_headers?: Record<string, string>
  expires_at: string
  max_size_bytes: number
}

/** NB04-002 request DTO. */
export type FinalizeUploadRequest = {
  storage_etag: string
  checksum?: string
}

export type FileStorageRecord = {
  id: number
  code: string
  original_filename: string
  mime_type: string
  size_bytes: number
  is_deleted: boolean
}

export type PurchaseOrderLineRow = {
  code: string
  itemLabel: string
  supplierItemCode: string
  orderedQty: string
  receivedQty: string
  remainingQty: string
  uomLabel: string
  requestedDeliveryDate: string
  lineStatus: string
}

export type PurchaseOrderRow = {
  code: string
  supplierLabel: string
  orderDate: string
  expectedDeliveryDate: string
  status: string
  notes: string
  lineRows: PurchaseOrderLineRow[]
  canUpdate: boolean
  canCancel: boolean
  canClose: boolean
  updateAction: AllowedAction | null
  cancelAction: AllowedAction | null
  closeAction: AllowedAction | null
  updateDisabledReason: string | null
  cancelDisabledReason: string | null
  closeDisabledReason: string | null
}

export type AsnLineRow = {
  code: string
  itemLabel: string
  supplierLot: string
  shippedQty: string
  uomLabel: string
  manufacturingDate: string
  expiryDate: string
}

export type AsnRow = {
  code: string
  purchaseOrderLabel: string
  supplierLabel: string
  expectedArrivalAt: string
  vehicleNo: string
  status: string
  lineRows: AsnLineRow[]
  canUpdate: boolean
  canArrive: boolean
  canStartReceiving: boolean
  canCancel: boolean
  updateAction: AllowedAction | null
  arriveAction: AllowedAction | null
  startReceivingAction: AllowedAction | null
  cancelAction: AllowedAction | null
  updateDisabledReason: string | null
  arriveDisabledReason: string | null
  startReceivingDisabledReason: string | null
  cancelDisabledReason: string | null
}

export type GoodsReceiptLineRow = {
  code: string
  itemLabel: string
  lotLabel: string
  lotId: number
  receivedQty: string
  uomLabel: string
  receivedLocationLabel: string
  qcStatusInitial: string
  remark: string
}

export type GoodsReceiptRow = {
  code: string
  sourceLabel: string
  supplierLabel: string
  receivedAt: string
  status: string
  lineRows: GoodsReceiptLineRow[]
  canUpdate: boolean
  canCancel: boolean
  canAttachMillCertificate: boolean
  updateAction: AllowedAction | null
  cancelAction: AllowedAction | null
  attachMillCertificateAction: AllowedAction | null
  updateDisabledReason: string | null
  cancelDisabledReason: string | null
}

export type AttachmentRow = {
  id: number
  fileId: number
  attachmentType: string
  caption: string
  uploadedAtLabel: string
}
