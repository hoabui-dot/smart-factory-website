export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type PageMeta = { limit: number; next_cursor: string | null; has_more: boolean }
export type ListQuery = { limit?: number; cursor?: string; sort?: string; q?: string; status?: string }

export type StockBalanceRecord = {
  id: number
  code: string
  location_id: number
  item_id: number
  lot_id?: number | null
  qty_on_hand: number
  qty_reserved: number
  qty_available: number
  last_movement_at: string
  location_code?: string
  item_code?: string
  lot_code?: string | null
}

export type StockTransactionLineRecord = {
  id: number
  code: string
  transaction_header_id: number
  item_id: number
  lot_id?: number | null
  from_location_id?: number | null
  to_location_id?: number | null
  qty: number
  uom_id: number
  qty_in_base_uom: number
  item_code?: string
  lot_code?: string | null
  from_location_code?: string | null
  to_location_code?: string | null
}

export type StockTransactionRecord = {
  id: number
  code: string
  transaction_type_id: number
  transaction_type_code?: string
  reference_type: string
  reference_id?: number | null
  performed_by: number
  performed_at: string
  approved_by?: number | null
  status: string
  device_code_snapshot?: string | null
  lines?: StockTransactionLineRecord[]
}

export type StocktakeCountRecord = {
  id: number
  code: string
  stocktake_id: number
  location_id: number
  item_id: number
  lot_id?: number | null
  book_qty: number
  counted_qty?: number | null
  counted_qty_2?: number | null
  variance: number
  variance_pct: number
  variance_reason?: string | null
  counted_by?: number | null
  counted_at?: string | null
  adjust_txn_id?: number | null
  note?: string | null
  location_code?: string
  item_code?: string
  lot_code?: string | null
  recount_required?: boolean
}

export type StocktakeRecord = {
  id: number
  code: string
  scope_type: string
  scope_filter?: Record<string, unknown> | null
  cutoff_at: string
  status: string
  opened_by?: number | null
  opened_at?: string | null
  reconciled_by?: number | null
  approved_by?: number | null
  closed_at?: string | null
  total_bins?: number | null
  note?: string | null
  counts?: StocktakeCountRecord[]
  allowed_actions?: AllowedAction[]
}

export type ListPage<T> = { items: T[]; page: PageMeta }
export type TransferLineRequest = {
  item_code: string
  lot_code?: string | null
  from_location_code: string
  to_location_code: string
  quantity: number
}
export type CreateStocktakeRequest = {
  scope_type: string
  scope_filter?: Record<string, unknown> | null
  cutoff_at: string
  note?: string | null
}
export type VarianceReviewRequest = {
  location_code: string
  item_code: string
  lot_code?: string | null
  variance_reason: string
  note?: string | null
}

export type BalanceRow = {
  code: string
  locationLabel: string
  itemLabel: string
  lotLabel: string
  onHandQty: string
  reservedQty: string
  availableQty: string
  lastMovementAt: string
}
export type TransactionLineRow = {
  code: string
  itemLabel: string
  lotLabel: string
  fromLocationLabel: string
  toLocationLabel: string
  qty: string
}
export type TransactionRow = {
  code: string
  transactionTypeLabel: string
  referenceLabel: string
  status: string
  performedAt: string
  performedByLabel: string
  lineRows: TransactionLineRow[]
}
export type StocktakeCountRow = {
  code: string
  locationLabel: string
  itemLabel: string
  lotLabel: string
  bookQty: string
  countedQty: string
  variance: string
  variancePct: string
  recountRequired: boolean
}
export type StocktakeRow = {
  code: string
  scopeType: string
  scopeFilterLabel: string
  cutoffAt: string
  status: string
  totalBins: string
  note: string
  countRows: StocktakeCountRow[]
  canStart: boolean
  canRequestAdjustment: boolean
  canRetryAdjustment: boolean
  canCancel: boolean
  startAction: AllowedAction | null
  requestAdjustmentAction: AllowedAction | null
  retryAdjustmentAction: AllowedAction | null
  cancelAction: AllowedAction | null
}
