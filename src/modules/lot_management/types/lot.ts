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

export const QC_STATUSES = ['PENDING', 'PASSED', 'FAILED', 'HOLD', 'EXPIRED'] as const
export type QcStatus = (typeof QC_STATUSES)[number]

/** WMS02-001..006 lot record — physical FK ids kept for client-side resolution only (API-SPEC §6.4). */
export type LotRecord = {
  id: number
  code: string
  item_id: number
  item_revision_id?: number | null
  supplier_id?: number | null
  supplier_lot: string
  mill_certificate_no: string
  received_date: string
  expiry_date: string
  qc_status: QcStatus | string
  received_qty: number
  item_code?: string
  supplier_code?: string
  qr_payload?: string
  allowed_actions?: AllowedAction[]
}

export type LotListPage = {
  items: LotRecord[]
  page: PageMeta
}

export type LotListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** WMS02-003 sparse PATCH body. */
export type LotUpdateRequest = {
  code?: string
  item_id?: number
  item_revision_id?: number | null
  supplier_id?: number | null
  supplier_lot?: string
  mill_certificate_no?: string
  received_date?: string
  expiry_date?: string
  qc_status?: string
  received_qty?: number
}

/** WMS02-005 request body — printer_code omitted from Web UI; server auto-resolves from the
 * caller's active device location (same as PDA) since printer listing is system_admin_only. */
export type EnqueueLabelRequest = {
  reason?: string
  copies: number
}

export type EnqueueLabelResult = {
  print_job_code: string
  job_code?: string
  status?: string
  is_reprint: boolean
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

/** MES01-006 item_revision record — code is the business identifier shown in the UI. */
export type ItemRevisionLookupRecord = {
  id: number
  code: string
  item_id: number
  status: string
}

export type LotLookups = {
  itemById: Map<number, ItemLookupRecord>
  supplierById: Map<number, SupplierLookupRecord>
  revisionById: Map<number, ItemRevisionLookupRecord>
}

export type LotRow = {
  code: string
  itemLabel: string
  revisionLabel: string
  supplierLabel: string
  supplierLot: string
  millCertificateNo: string
  qcStatus: string
  receivedDate: string
  expiryDate: string
  receivedQty: string
  canUpdate: boolean
  canPrint: boolean
  updateAction: AllowedAction | null
  printAction: AllowedAction | null
  updateDisabledReason: string | null
  printDisabledReason: string | null
}
