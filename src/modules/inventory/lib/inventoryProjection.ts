import type {
  AllowedAction,
  BalanceRow,
  StockBalanceRecord,
  StockTransactionLineRecord,
  StockTransactionRecord,
  StocktakeCountRecord,
  StocktakeCountRow,
  StocktakeRecord,
  StocktakeRow,
  TransactionLineRow,
  TransactionRow,
  TransferLineRequest,
  VarianceReviewRequest,
} from '../types/inventory.ts'

const UNAVAILABLE = '-'

export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function projectBalanceRow(row: StockBalanceRecord): BalanceRow {
  return {
    code: row.code || UNAVAILABLE,
    locationLabel: row.location_code || UNAVAILABLE,
    itemLabel: row.item_code || UNAVAILABLE,
    lotLabel: row.lot_code || UNAVAILABLE,
    onHandQty: String(row.qty_on_hand),
    reservedQty: String(row.qty_reserved),
    availableQty: String(row.qty_available),
    lastMovementAt: row.last_movement_at || UNAVAILABLE,
  }
}

function projectTransactionLine(row: StockTransactionLineRecord): TransactionLineRow {
  return {
    code: row.code || UNAVAILABLE,
    itemLabel: row.item_code || UNAVAILABLE,
    lotLabel: row.lot_code || UNAVAILABLE,
    fromLocationLabel: row.from_location_code || UNAVAILABLE,
    toLocationLabel: row.to_location_code || UNAVAILABLE,
    qty: String(row.qty_in_base_uom ?? row.qty),
  }
}

function userLabel(id: number | null | undefined): string {
  return id != null && id > 0 ? `User #${id}` : UNAVAILABLE
}

export function projectStockTransactionRow(row: StockTransactionRecord): TransactionRow {
  return {
    code: row.code || UNAVAILABLE,
    transactionTypeLabel: row.transaction_type_code || UNAVAILABLE,
    referenceLabel: row.reference_type || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    performedAt: row.performed_at || UNAVAILABLE,
    performedByLabel: userLabel(row.performed_by),
    lineRows: (row.lines ?? []).map(projectTransactionLine),
  }
}

function projectStocktakeCount(row: StocktakeCountRecord): StocktakeCountRow {
  return {
    code: row.code || UNAVAILABLE,
    locationLabel: row.location_code || UNAVAILABLE,
    itemLabel: row.item_code || UNAVAILABLE,
    lotLabel: row.lot_code || UNAVAILABLE,
    bookQty: String(row.book_qty),
    countedQty: row.counted_qty == null ? UNAVAILABLE : String(row.counted_qty),
    variance: String(row.variance),
    variancePct: String(row.variance_pct),
    recountRequired: row.recount_required === true,
  }
}

export function projectStocktakeRow(row: StocktakeRecord): StocktakeRow {
  const startAction = findAllowedAction(row.allowed_actions, 'start')
  const requestAdjustmentAction = findAllowedAction(row.allowed_actions, 'request_adjustment')
  const retryAdjustmentAction = findAllowedAction(row.allowed_actions, 'retry_adjustment')
  const cancelAction = findAllowedAction(row.allowed_actions, 'cancel')
  return {
    code: row.code || UNAVAILABLE,
    scopeType: row.scope_type || UNAVAILABLE,
    scopeFilterLabel: row.scope_filter ? JSON.stringify(row.scope_filter) : UNAVAILABLE,
    cutoffAt: row.cutoff_at || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    totalBins: row.total_bins == null ? UNAVAILABLE : String(row.total_bins),
    note: row.note || UNAVAILABLE,
    countRows: (row.counts ?? []).map(projectStocktakeCount),
    canStart: startAction?.enabled === true,
    canRequestAdjustment: requestAdjustmentAction?.enabled === true,
    canRetryAdjustment: retryAdjustmentAction?.enabled === true,
    canCancel: cancelAction?.enabled === true,
    startAction,
    requestAdjustmentAction,
    retryAdjustmentAction,
    cancelAction,
  }
}

export function buildVarianceReviews(
  counts: StocktakeCountRecord[],
  reason: string,
  note: string,
): VarianceReviewRequest[] {
  const trimmedReason = reason.trim()
  if (!trimmedReason) return []
  return counts
    .filter((row) => row.variance !== 0 && row.location_code && row.item_code)
    .map((row) => ({
      location_code: row.location_code as string,
      item_code: row.item_code as string,
      lot_code: row.lot_code ?? null,
      variance_reason: trimmedReason,
      note: note.trim() || null,
    }))
}

export function validateStocktakeCreate(input: {
  scope_type: string
  scope_filter_text: string
  cutoff_at: string
}): string[] {
  const errors: string[] = []
  if ((input.scope_type === 'ZONE' || input.scope_type === 'CYCLE') && !input.scope_filter_text.trim()) {
    errors.push('scope_filter')
  }
  if (!input.cutoff_at.trim()) errors.push('cutoff_at')
  return errors
}

export function validateTransferLine(input: TransferLineRequest): string[] {
  const errors: string[] = []
  if (!input.item_code.trim()) errors.push('item_code')
  if (!input.from_location_code.trim()) errors.push('from_location_code')
  if (!input.to_location_code.trim()) errors.push('to_location_code')
  if (!(input.quantity > 0)) errors.push('quantity')
  return errors
}

export function resolveListState(
  status: 'loading' | 'success' | 'error',
  itemCount: number,
  hasQuery: boolean,
  errorCode: string | null,
): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (status === 'loading') return 'loading'
  if (status === 'error') return errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  if (itemCount === 0) return hasQuery ? 'no-result' : 'empty'
  return 'ready'
}
