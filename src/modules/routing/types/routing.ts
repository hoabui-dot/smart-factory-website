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

/** MES03-001..005 work_center record — capacity_uom_code projected alongside FK id. */
export type WorkCenterRecord = {
  id: number
  code: string
  name: string
  capacity_per_hour: number
  capacity_uom_id: number
  capacity_uom_code?: string
  allowed_actions?: AllowedAction[]
}

export type WorkCenterListPage = {
  items: WorkCenterRecord[]
  page: PageMeta
}

export type WorkCenterListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** MES03-003 body. */
export type WorkCenterCreateRequest = {
  code: string
  name: string
  capacity_per_hour: number
  capacity_uom_id: number
}

/** MES03-004 sparse PATCH body. */
export type WorkCenterUpdateRequest = {
  code?: string
  name?: string
  capacity_per_hour?: number
  capacity_uom_id?: number
}

export const MACHINE_STATUSES = ['RUNNING', 'IDLE', 'BREAKDOWN', 'PM'] as const
export type MachineStatus = (typeof MACHINE_STATUSES)[number]

/** MES03-006..010 machine record — work_center_code projected alongside FK id. */
export type MachineRecord = {
  id: number
  code: string
  work_center_id: number
  last_pm_date: string
  next_pm_due: string
  status: MachineStatus | string
  work_center_code?: string
  allowed_actions?: AllowedAction[]
}

export type MachineListPage = {
  items: MachineRecord[]
  page: PageMeta
}

export type MachineListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** MES03-008 body. */
export type MachineCreateRequest = {
  code: string
  work_center_id: number
  last_pm_date: string
  next_pm_due: string
  status: string
}

/** MES03-009 sparse PATCH body. */
export type MachineUpdateRequest = {
  code?: string
  work_center_id?: number
  last_pm_date?: string
  next_pm_due?: string
  status?: string
}

export const ROUTING_STATUSES = ['DRAFT', 'RELEASED', 'OBSOLETE'] as const
export type RoutingStatus = (typeof ROUTING_STATUSES)[number]

/** MES03-011..018 routing_header record — product_item_code projected alongside FK id. */
export type RoutingHeaderRecord = {
  id: number
  code: string
  product_item_id: number
  version: string
  status: RoutingStatus | string
  effective_from: string
  effective_to?: string | null
  approved_by?: number | null
  product_item_code?: string
  allowed_actions?: AllowedAction[]
}

export type RoutingListPage = {
  items: RoutingHeaderRecord[]
  page: PageMeta
}

export type RoutingListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** MES03-013 body. */
export type RoutingCreateRequest = {
  code: string
  product_item_id: number
  version: string
  status: string
  effective_from: string
  effective_to?: string | null
}

/**
 * MES03-014 sparse PATCH body — never include `status`, server rejects PATCH with status
 * (state transitions go through the dedicated release/obsolete action endpoints).
 */
export type RoutingUpdateRequest = {
  code?: string
  product_item_id?: number
  version?: string
  effective_from?: string
  effective_to?: string | null
}

/** MES03-017 routing_operation record — projected codes alongside FK ids (read-only on this screen). */
export type RoutingOperationRecord = {
  id: number
  code: string
  routing_id: number
  operation_code: string
  operation_name: string
  work_center_id: number
  standard_cycle_time: number
  standard_cycle_time_uom_id: number
  setup_time: number
  setup_time_uom_id: number
  generated_input: boolean
  work_center_code?: string
  standard_cycle_time_uom_code?: string
  setup_time_uom_code?: string
}

export type UomLookupRecord = {
  id: number
  code: string
  uom_name: string
  is_active: boolean
}

export type ItemLookupRecord = {
  id: number
  code: string
  item_name: string
  is_active: boolean
}

export type RoutingLookups = {
  uomCodeById: Map<number, string>
  workCenterCodeById: Map<number, string>
  itemCodeById: Map<number, string>
}

export type WorkCenterRow = {
  code: string
  name: string
  capacityPerHour: number
  capacityUomLabel: string
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type MachineRow = {
  code: string
  workCenterLabel: string
  lastPmDate: string
  nextPmDue: string
  status: string
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type RoutingRow = {
  code: string
  productItemLabel: string
  version: string
  status: string
  effectiveFrom: string
  effectiveTo: string
  canUpdate: boolean
  canDeactivate: boolean
  canRelease: boolean
  canObsolete: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  releaseAction: AllowedAction | null
  obsoleteAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
  releaseDisabledReason: string | null
  obsoleteDisabledReason: string | null
}
