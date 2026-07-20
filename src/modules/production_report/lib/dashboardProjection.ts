import type {
  AllowedAction,
  DashboardRowView,
  DowntimeLogRecord,
  DowntimeRowView,
  ProductionDashboard,
} from '../types/dashboard'
import { formatDateTime } from '../../../shared/lib/formatDate.ts'

const UNAVAILABLE = '-'

export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function projectDashboard(summary: ProductionDashboard): DashboardRowView {
  const exportAction = findAllowedAction(summary.allowed_actions, 'export')
  return {
    canExport: exportAction?.enabled === true,
    exportAction,
    kpis: summary.kpis ?? [],
    goodOutput: summary.production_output?.good_output ?? 0,
    totalProcessed: summary.production_output?.total_processed_input ?? 0,
    finishedGoods: summary.production_output?.finished_goods_output ?? 0,
    openDowntimes: summary.open_downtime_count ?? 0,
    workOrders: summary.work_orders ?? [],
    machines: summary.machines ?? [],
  }
}

export function projectDowntimeRow(row: DowntimeLogRecord): DowntimeRowView {
  const updateAction = findAllowedAction(row.allowed_actions, 'update')
  return {
    code: row.code || UNAVAILABLE,
    status: row.status || UNAVAILABLE,
    machineLabel: row.machine_code || UNAVAILABLE,
    workOrderLabel: row.work_order_code || UNAVAILABLE,
    shiftLabel: row.shift_code || UNAVAILABLE,
    startedAt: row.started_at ? formatDateTime(row.started_at) : UNAVAILABLE,
    endedAt: row.ended_at ? formatDateTime(row.ended_at) : UNAVAILABLE,
    durationMin: row.duration_min != null ? String(row.duration_min) : UNAVAILABLE,
    reasonCode: row.reason_code || UNAVAILABLE,
    category: row.category || UNAVAILABLE,
    description: row.description || UNAVAILABLE,
    canUpdate: updateAction?.enabled === true,
    updateAction,
    updateDisabledReason: updateAction?.enabled
      ? null
      : (updateAction?.disabled_reason_code ?? null),
  }
}

export function resolveDashboardState(input: {
  status: 'loading' | 'success' | 'error'
  errorCode: string | null
}): 'loading' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  return 'ready'
}

export function resolveDowntimeListState(input: {
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

export function resolveExportUiState(input: {
  status: 'idle' | 'pending' | 'success' | 'error'
  jobCode?: string | null
  errorCode?: string | null
}): 'idle' | 'async-processing' | 'queued' | 'permission-denied' | 'error' {
  if (input.status === 'pending') return 'async-processing'
  if (input.status === 'success') return 'queued'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  return 'idle'
}

export function formatKpiValue(value: number | null | undefined, unit: string): string {
  if (value == null || Number.isNaN(value)) return UNAVAILABLE
  const rounded = Number(value.toFixed(2))
  return unit ? `${rounded} ${unit}` : String(rounded)
}
