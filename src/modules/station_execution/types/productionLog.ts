export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type MaterialLogRecord = {
  code: string
  input_lot_code?: string
  input_item_code?: string
  uom_code?: string
  consumed_qty: number
}

export type MachineLogRecord = {
  code: string
  machine_code?: string
  run_minutes: number
  setup_minutes: number
  role: string
}

export type DefectLogRecord = {
  code: string
  defect_code?: string
  scrap_qty: number
  rework_qty: number
  uom_code?: string
}

export type ProductionLogRecord = {
  id: number
  code: string
  work_order_id: number
  operation_id: number
  operator_id: number
  shift_id: number
  good_qty: number
  scrap_qty: number
  rework_qty: number
  loss_qty: number
  input_qty?: number | null
  started_at: string
  ended_at?: string | null
  recorded_at: string
  status: string
  void_reason?: string | null
  work_order_code?: string
  operation_code?: string
  operator_code?: string
  shift_code?: string
  materials?: MaterialLogRecord[]
  machines?: MachineLogRecord[]
  defects?: DefectLogRecord[]
  allowed_actions?: AllowedAction[]
}

export type ProductionLogRow = {
  code: string
  status: string
  workOrderLabel: string
  operationLabel: string
  operatorLabel: string
  shiftLabel: string
  startedAt: string
  endedAt: string
  recordedAt: string
  goodQty: number
  scrapQty: number
  reworkQty: number
  lossQty: number
  inputQty: number | null
  voidReason: string | null
  canVoid: boolean
  voidAction: AllowedAction | null
  voidDisabledReason: string | null
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type ProductionLogListPage = {
  items: ProductionLogRecord[]
  page: PageMeta
}

export type ListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export type ProductionVoidRequest = {
  void_reason: string
}
