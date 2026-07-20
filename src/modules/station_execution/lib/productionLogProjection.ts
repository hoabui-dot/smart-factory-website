import type {
  AllowedAction,
  ProductionLogRecord,
  ProductionLogRow,
} from '../types/productionLog'
import { formatDateTime } from '../../../shared/lib/formatDate.ts'

const UNAVAILABLE = '-'

export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

/** Never infer void from status — server allowed_actions is authoritative. */
export function projectProductionLogRow(row: ProductionLogRecord): ProductionLogRow {
  const voidAction = findAllowedAction(row.allowed_actions, 'void')
  return {
    code: row.code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    workOrderLabel: row.work_order_code || UNAVAILABLE,
    operationLabel: row.operation_code || UNAVAILABLE,
    operatorLabel: row.operator_code || UNAVAILABLE,
    shiftLabel: row.shift_code || UNAVAILABLE,
    startedAt: row.started_at ? formatDateTime(row.started_at) : UNAVAILABLE,
    endedAt: row.ended_at ? formatDateTime(row.ended_at) : UNAVAILABLE,
    recordedAt: row.recorded_at ? formatDateTime(row.recorded_at) : UNAVAILABLE,
    goodQty: row.good_qty,
    scrapQty: row.scrap_qty,
    reworkQty: row.rework_qty,
    lossQty: row.loss_qty,
    inputQty: row.input_qty ?? null,
    voidReason: row.void_reason || null,
    canVoid: voidAction?.enabled === true,
    voidAction,
    voidDisabledReason: voidAction?.enabled ? null : (voidAction?.disabled_reason_code ?? null),
  }
}

export function resolveProductionListState(input: {
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

/** MES05-008 requires void_reason length >= 10. */
export function validateVoidReason(reason: string): string[] {
  return reason.trim().length >= 10 ? [] : ['void_reason']
}
