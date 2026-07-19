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

export const NCR_STATUSES = [
  'OPEN',
  'INVESTIGATING',
  'CONTAINMENT',
  'CAPA_IN_PROGRESS',
  'CLOSED',
  'VOIDED',
] as const
export type NcrStatus = (typeof NCR_STATUSES)[number]

export const NCR_SOURCES = ['IQC', 'IPQC', 'OQC', 'CUSTOMER', 'SUPPLIER'] as const
export type NcrSource = (typeof NCR_SOURCES)[number]

export const NCR_SEVERITIES = ['MINOR', 'MAJOR', 'CRITICAL'] as const
export type NcrSeverity = (typeof NCR_SEVERITIES)[number]

export const NCR_DISPOSITIONS = [
  'SCRAP',
  'REWORK',
  'USE_AS_IS',
  'RETURN_TO_SUPPLIER',
  'SORT_100PCT',
] as const
export type NcrDisposition = (typeof NCR_DISPOSITIONS)[number]

/** QMS03-001..009 non_conformance_report record. Physical FK ids kept for CAPA create only. */
export type NcrRecord = {
  id: number
  code: string
  source: NcrSource | string
  work_order_id?: number | null
  item_id: number
  lot_id?: number | null
  defect_code_id: number
  qty_affected: number
  severity: NcrSeverity | string
  disposition?: string | null
  opened_by: number
  opened_at: string
  updated_at: string
  status: NcrStatus | string
  item_code?: string
  lot_code?: string
  defect_code?: string
  work_order_code?: string
  allowed_actions?: AllowedAction[]
}

export type NcrListPage = { items: NcrRecord[]; page: PageMeta }
export type NcrListQuery = { limit?: number; cursor?: string; sort?: string; q?: string }

/** QMS03-003 — create uses business codes (not physical FKs). */
export type NcrCreateRequest = {
  source: string
  item_code: string
  lot_code?: string
  work_order_code?: string
  defect_code: string
  qty_affected: number
  severity?: string
}

/** QMS03-004 sparse PATCH. */
export type NcrUpdateRequest = {
  qty_affected?: number
  severity?: string
}

/** QMS03-006 contain body. */
export type ContainRequest = {
  disposition: string
  disposition_scope: {
    lot_code: string
    from_location_code?: string
    to_location_code?: string
    qty: number
  }
}

/** QMS03-008 close body. */
export type CloseRequest = {
  evidence_file_ids: number[]
}

/** QMS03-009 void body. */
export type VoidRequest = {
  reason: string
}

/** QMS03-010..013 corrective_preventive_action. */
export type CapaRecord = {
  id: number
  code: string
  ncr_id: number
  root_cause: string
  corrective_action: string
  preventive_action: string
  owner_id: number
  due_date: string
  verified_by?: number | null
  verified_at?: string | null
  effectiveness: string
  created_at: string
  updated_at: string
  ncr_code?: string
  allowed_actions?: AllowedAction[]
}

export type CapaListPage = { items: CapaRecord[]; page: PageMeta }
export type CapaListQuery = { limit?: number; cursor?: string; sort?: string; q?: string }

export type CapaCreateRequest = {
  ncr_id: number
  root_cause: string
  corrective_action: string
  preventive_action: string
  owner_id: number
  due_date: string
  effectiveness?: string
}

export type CapaUpdateRequest = {
  root_cause?: string
  corrective_action?: string
  preventive_action?: string
  owner_id?: number
  due_date?: string
  verified_by?: number | null
  effectiveness?: string
}

export type ItemLookupRecord = { id: number; code: string; item_name?: string; is_active?: boolean }
export type DefectLookupRecord = { id: number; code: string; default_severity?: string; is_active?: boolean }

export type NcrRow = {
  code: string
  status: string
  source: string
  itemLabel: string
  lotLabel: string
  defectLabel: string
  workOrderLabel: string
  qtyAffected: number
  severity: string
  disposition: string
  openedAt: string
  openedByLabel: string
  canUpdate: boolean
  canStartInvestigation: boolean
  canContain: boolean
  canStartCapa: boolean
  canClose: boolean
  canVoid: boolean
  updateAction: AllowedAction | null
  startInvestigationAction: AllowedAction | null
  containAction: AllowedAction | null
  startCapaAction: AllowedAction | null
  closeAction: AllowedAction | null
  voidAction: AllowedAction | null
}

export type CapaRow = {
  code: string
  ncrLabel: string
  rootCause: string
  correctiveAction: string
  preventiveAction: string
  ownerLabel: string
  dueDate: string
  effectiveness: string
  canUpdate: boolean
  updateAction: AllowedAction | null
}

/** GET /api/qms/reports/pareto */
export type ParetoRowRecord = {
  group_key: string
  group_label: string
  qty: number
  pct: number
  cum_pct: number
}

export type ParetoReportRecord = {
  group_by: string
  from?: string
  to?: string
  total_qty: number
  rows: ParetoRowRecord[]
}

export type ParetoQuery = {
  from?: string
  to?: string
  group_by?: string
  source?: string
}

export type ParetoRowView = {
  groupKey: string
  groupLabel: string
  qty: string
  pct: string
  cumPct: string
}

