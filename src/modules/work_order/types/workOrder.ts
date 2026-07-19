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

export const WORK_ORDER_STATUSES = [
  'DRAFT',
  'PLANNED',
  'RELEASED',
  'MATERIAL_PREPARING',
  'MATERIAL_READY',
  'IN_PROGRESS',
  'PAUSED',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
] as const
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number]

export const MATERIAL_REQUEST_STATUSES = ['PENDING', 'PICKING', 'ISSUED', 'CANCELLED'] as const
export type MaterialRequestStatus = (typeof MATERIAL_REQUEST_STATUSES)[number]

/**
 * MES04-001..004/006/007/009..012 work_order record. `id` is the physical route identifier
 * (API-SPEC §15.4.4 MES04-002 — explicit Phase 1 MES-04 exception, unlike code-keyed screens
 * elsewhere); `code`/`item_code`/`item_revision_code`/`bom_code`/`routing_code` are the projected
 * business labels the UI renders, raw FK ids are never shown.
 */
export type WorkOrderRecord = {
  id: number
  code: string
  item_id: number
  item_revision_id?: number | null
  bom_id: number
  routing_id: number
  planned_qty: number
  produced_qty: number
  scrap_qty: number
  planned_start: string
  actual_start?: string | null
  released_at?: string | null
  material_ready_at?: string | null
  actual_end?: string | null
  status: WorkOrderStatus | string
  customer_order_id?: number | null
  item_code?: string
  item_name?: string
  bom_code?: string
  routing_code?: string
  item_revision_code?: string
  allowed_actions?: AllowedAction[]
}

export type WorkOrderListPage = { items: WorkOrderRecord[]; page: PageMeta }
export type WorkOrderListQuery = { limit?: number; cursor?: string; sort?: string; q?: string }

/** MES04-003 body — code/item_id/planned_qty/planned_start required; item_revision_id optional
 * (server auto-resolves to the item's current active revision when omitted). */
export type WorkOrderCreateRequest = {
  code: string
  item_id: number
  item_revision_id?: number | null
  planned_qty: number
  planned_start: string
}

/** MES04-004 sparse PATCH body — server rejects PATCH unless WO is DRAFT|PLANNED
 * (NOT_ALLOWED_BY_STATUS); gated client-side by `allowed_actions.update`. */
export type WorkOrderUpdateRequest = {
  code?: string
  item_id?: number
  item_revision_id?: number | null
  planned_qty?: number
  planned_start?: string
}

/** MES04-009/012 shared reason-required request DTO. */
export type ReasonRequest = {
  reason: string
}

/** MES04-013 material_request record — physical FK ids kept for resolution only. */
export type MaterialRequestRecord = {
  id: number
  code: string
  work_order_id: number
  operation_id?: number | null
  item_id: number
  required_qty: number
  uom_id: number
  source_location_id?: number | null
  target_location_id: number
  picked_lot_id?: number | null
  status: MaterialRequestStatus | string
  issued_txn_header_id?: number | null
  created_by: number
  issued_by?: number | null
  item_code?: string
  item_name?: string
  uom_code?: string
  target_location_code?: string
}

export type MaterialRequestListPage = { items: MaterialRequestRecord[]; page: PageMeta }

export type ItemLookupRecord = {
  id: number
  code: string
  item_name: string
  is_active: boolean
}

/** MES01-006 item_revision record — code is the business identifier shown in the UI. */
export type ItemRevisionLookupRecord = {
  id: number
  code: string
  item_id: number
  status: string
}

export type WorkOrderLookups = {
  itemById: Map<number, ItemLookupRecord>
  revisionById: Map<number, ItemRevisionLookupRecord>
}

export type WorkOrderRow = {
  id: number
  code: string
  itemLabel: string
  itemRevisionLabel: string
  bomLabel: string
  routingLabel: string
  status: string
  plannedQty: number
  producedQty: number
  scrapQty: number
  plannedStart: string
  actualStart: string
  actualEnd: string
  releasedAt: string
  materialReadyAt: string
  canUpdate: boolean
  canPlan: boolean
  canRelease: boolean
  canPause: boolean
  canResume: boolean
  canClose: boolean
  canCancel: boolean
  updateAction: AllowedAction | null
  planAction: AllowedAction | null
  releaseAction: AllowedAction | null
  pauseAction: AllowedAction | null
  resumeAction: AllowedAction | null
  closeAction: AllowedAction | null
  cancelAction: AllowedAction | null
  updateDisabledReason: string | null
  planDisabledReason: string | null
  releaseDisabledReason: string | null
  pauseDisabledReason: string | null
  resumeDisabledReason: string | null
  closeDisabledReason: string | null
  cancelDisabledReason: string | null
}

export type MaterialRequestRow = {
  code: string
  itemLabel: string
  requiredQty: number
  uomLabel: string
  targetLocationLabel: string
  status: string
}
