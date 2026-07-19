export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type DashboardFilter = {
  from?: string
  to?: string
  shift_code?: string
  location_code?: string
  work_order_code?: string
  item_code?: string
  operation_code?: string
  machine_code?: string
  group_by?: string
}

export type KpiValue = {
  kpi_code: string
  value: number | null
  unit: string
  numerator?: number | null
  denominator?: number | null
  status: string
}

export type ProductionOutputSummary = {
  good_output: number
  total_processed_input: number
  finished_goods_output: number
}

export type WoSnapshot = {
  work_order_code: string
  status: string
  planned_qty: number
  good_qty: number
}

export type MachineStatus = {
  machine_code: string
  open_downtime: boolean
  last_good_qty: number
  last_production_log_code?: string | null
}

export type ProductionDashboard = {
  filters_applied: DashboardFilter
  kpis: KpiValue[]
  production_output: ProductionOutputSummary
  work_orders: WoSnapshot[]
  machines: MachineStatus[]
  open_downtime_count: number
  allowed_actions?: AllowedAction[]
}

export type KpiSeriesPoint = {
  dimension_key: string
  dimension_label: string
  value: number | null
}

export type KpiSeriesResponse = {
  kpi_code: string
  group_by: string
  filters_applied: DashboardFilter
  series: KpiSeriesPoint[]
}

export type DowntimeLogRecord = {
  id: number
  code: string
  status: string
  source: string
  started_at: string
  ended_at?: string | null
  duration_min?: number | null
  reason_code?: string | null
  planned_flag?: boolean | null
  category?: string | null
  description?: string | null
  maintenance_note?: string | null
  machine_code?: string
  work_order_code?: string | null
  shift_code?: string | null
  reported_by_code?: string
  allowed_actions?: AllowedAction[]
}

export type DowntimeUpdateRequest = {
  reason_code?: string | null
  planned_flag?: boolean | null
  category?: string | null
  description?: string | null
  maintenance_note?: string | null
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type DowntimeListPage = {
  items: DowntimeLogRecord[]
  page: PageMeta
}

export type ListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export type ExportJobRef = {
  id?: number
  code: string
  type?: string
  status?: string
  status_url?: string
}

export type DashboardRowView = {
  canExport: boolean
  exportAction: AllowedAction | null
  kpis: KpiValue[]
  goodOutput: number
  totalProcessed: number
  finishedGoods: number
  openDowntimes: number
  workOrders: WoSnapshot[]
  machines: MachineStatus[]
}

export type DowntimeRowView = {
  code: string
  status: string
  machineLabel: string
  workOrderLabel: string
  shiftLabel: string
  startedAt: string
  endedAt: string
  durationMin: string
  reasonCode: string
  category: string
  description: string
  canUpdate: boolean
  updateAction: AllowedAction | null
  updateDisabledReason: string | null
}
