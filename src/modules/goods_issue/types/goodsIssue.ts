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

export type ListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** WMS04-001/002 material_request — physical FK ids kept for resolution only. */
export type MaterialRequestRecord = {
  id: number
  code: string
  work_order_id: number
  item_id: number
  required_qty: number
  uom_id: number
  source_location_id?: number | null
  target_location_id: number
  picked_lot_id?: number | null
  status: string
  issued_txn_header_id?: number | null
  created_by: number
  issued_by?: number | null
  item_code?: string
  item_name?: string
  uom_code?: string
  target_location_code?: string
  work_order_code?: string
  allowed_actions?: AllowedAction[]
}

export type MaterialRequestListPage = {
  items: MaterialRequestRecord[]
  page: PageMeta
}

/** WMS04-008/009 stock_transaction_header projection for goods issues. */
export type GoodsIssueLineRecord = {
  code: string
  item_code: string
  lot_code?: string | null
  from_location_code?: string | null
  to_location_code?: string | null
  qty: number
  uom_code?: string
}

export type GoodsIssueRecord = {
  id: number
  code: string
  transaction_type_code: string
  reference_type: string
  reference_id?: number | null
  performed_by: number
  performed_at: string
  approved_by?: number | null
  status: string
  device_code_snapshot?: string | null
  lines?: GoodsIssueLineRecord[]
  allowed_actions?: AllowedAction[]
}

export type GoodsIssueListPage = {
  items: GoodsIssueRecord[]
  page: PageMeta
}

/** BE CancelRequest / RejectRequest — reason required server-side (wins over WEB-SCREENS "no body"). */
export type ReasonRequest = {
  reason: string
}

export type MaterialRequestRow = {
  code: string
  workOrderLabel: string
  workOrderId: number
  itemLabel: string
  requiredQty: string
  uomLabel: string
  targetLocationLabel: string
  status: string
  canCancel: boolean
  cancelAction: AllowedAction | null
  cancelDisabledReason: string | null
}

export type GoodsIssueLineRow = {
  code: string
  itemLabel: string
  lotLabel: string
  fromLocationLabel: string
  toLocationLabel: string
  qty: string
  uomLabel: string
}

export type GoodsIssueRow = {
  code: string
  transactionTypeLabel: string
  referenceLabel: string
  status: string
  performedAt: string
  performedByLabel: string
  approvedByLabel: string
  deviceSnapshot: string
  lineRows: GoodsIssueLineRow[]
  canApprove: boolean
  canReject: boolean
  approveAction: AllowedAction | null
  rejectAction: AllowedAction | null
  approveDisabledReason: string | null
  rejectDisabledReason: string | null
}
