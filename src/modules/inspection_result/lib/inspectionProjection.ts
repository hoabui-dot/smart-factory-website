import type {
  AllowedAction,
  InspectionResultRecord,
  InspectionResultRow,
} from '../types/inspectionResult'

const UNAVAILABLE = '-'

export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

/** Never infer void availability from status — server allowed_actions is authoritative. */
export function projectInspectionResultRow(row: InspectionResultRecord): InspectionResultRow {
  const voidAction = findAllowedAction(row.allowed_actions, 'void')
  return {
    code: row.code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    overallResult: row.overall_result || UNAVAILABLE,
    planLabel: row.inspection_plan_code || UNAVAILABLE,
    stageLabel: row.inspection_stage_code || UNAVAILABLE,
    lotLabel: row.lot_code || UNAVAILABLE,
    workOrderLabel: row.work_order_code || UNAVAILABLE,
    finishedLotLabel: row.finished_lot_code || UNAVAILABLE,
    sampleSize: row.sample_size,
    inspectedAt: row.inspected_at || UNAVAILABLE,
    isRetest: row.is_retest,
    ncrLabel: row.ncr_code || UNAVAILABLE,
    canVoid: voidAction?.enabled === true,
    voidAction,
    voidDisabledReason: voidAction?.enabled ? null : voidAction?.disabled_reason_code ?? null,
  }
}

export function resolveInspectionListState(input: {
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

export function validateVoidReason(reason: string): string[] {
  return reason.trim() ? [] : ['void_reason']
}
