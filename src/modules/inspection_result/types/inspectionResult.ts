export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type InspectionResultRecord = {
  id: number
  code: string
  plan_id: number
  inspection_stage_id: number
  work_order_id?: number | null
  lot_id?: number | null
  finished_lot_id?: number | null
  sample_size: number
  overall_result?: string | null
  inspector_id: number
  inspected_at?: string | null
  approved_by?: number | null
  status: string
  is_retest: boolean
  retest_ncr_id?: number | null
  inspection_plan_code?: string
  inspection_stage_code?: string
  lot_code?: string
  work_order_code?: string
  finished_lot_code?: string
  details?: InspectionDetailRecord[]
  ncr_code?: string | null
  allowed_actions?: AllowedAction[]
}

export type InspectionDetailRecord = {
  id: number
  code: string
  result_id: number
  sample_no: number
  char_id: number
  measured_value?: number | null
  judgment: string
  spec_min_snapshot?: number | null
  spec_max_snapshot?: number | null
  characteristic_code?: string
}

export type SpcDataRecord = {
  id: number
  code?: string
  characteristic_code?: string
  subgroup_no?: number
  sample_no?: number
  measured_value?: number | null
  measured_at?: string
  work_order_code?: string
  machine_code?: string
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type InspectionListPage = {
  items: InspectionResultRecord[]
  page: PageMeta
}

export type SpcListPage = {
  items: SpcDataRecord[]
  page: PageMeta
}

export type ListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export type InspectionVoidRequest = {
  void_reason: string
}

export type InspectionResultRow = {
  code: string
  status: string
  overallResult: string
  planLabel: string
  stageLabel: string
  lotLabel: string
  workOrderLabel: string
  finishedLotLabel: string
  sampleSize: number
  inspectedAt: string
  isRetest: boolean
  ncrLabel: string
  canVoid: boolean
  voidAction: AllowedAction | null
  voidDisabledReason: string | null
}
