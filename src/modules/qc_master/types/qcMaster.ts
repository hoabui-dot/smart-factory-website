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

export const PLAN_STATUSES = ['DRAFT', 'RELEASED', 'OBSOLETE'] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]

export const CHAR_TYPES = ['NUMERIC', 'ATTRIBUTE', 'VISUAL', 'COUNT'] as const
export type CharType = (typeof CHAR_TYPES)[number]

export const CRITICALITIES = ['CC', 'SC', 'NORMAL'] as const
export type Criticality = (typeof CRITICALITIES)[number]

export const SEVERITIES = ['MINOR', 'MAJOR', 'CRITICAL'] as const
export type Severity = (typeof SEVERITIES)[number]

/** QMS01-018 reference record. */
export type InspectionStageRecord = {
  id: number
  code: string
  name_vi: string
  name_en: string
  stage_group: string
}

/** QMS01-019 reference record. */
export type SamplingMethodRecord = {
  id: number
  code: string
  name_vi: string
  name_en: string
  standard_ref?: string | null
}

/** QMS01-020 reference record. */
export type InspectionFrequencyRecord = {
  id: number
  code: string
  name_vi: string
  name_en: string
  requires_interval: boolean
}

/**
 * characteristic_category lookup for the characteristic_master / defect_code category
 * selector — sourced from the SHARED-01e REFDATA hub (`/api/shared/reference-data/...`)
 * since QMS-01 does not own a dedicated list endpoint for this owned-but-shared table.
 */
export type CharacteristicCategoryLookupRecord = {
  id: number
  code: string
  name_vi: string
  is_active: boolean
}

/** MES-01 item lookup for the plan item_id selector. */
export type ItemLookupRecord = {
  id: number
  code: string
  item_name: string
  /** Prefer item_type_code from MES-01; item_type kept for older fixtures. */
  item_type_code?: string
  item_type?: string
  is_active: boolean
}

/** MES01-006 item_revision lookup for the plan item_revision_id selector, scoped to one item. */
export type ItemRevisionLookupRecord = {
  id: number
  code: string
  item_id: number
  status: string
}

/** Read-only line owned by inspection_characteristic — import-managed only (NB-07 QC_CHECKSHEET_IMPORT). */
export type InspectionCharacteristicRecord = {
  id: number
  code: string
  plan_id: number
  char_master_id: number
  char_type: string
  nominal?: number | null
  lsl?: number | null
  usl?: number | null
  uom: string
  gauge_type_id?: number | null
  criticality: string
  char_master_code?: string
  plan_code?: string
}

/** QMS01-001..007 inspection_plan record — projected `_code` fields alongside FK ids. */
export type InspectionPlanRecord = {
  id: number
  code: string
  inspection_stage_id: number
  item_id: number
  item_revision_id?: number | null
  sampling_method_id: number
  inspection_frequency_id: number
  sampling_param: string
  status: PlanStatus | string
  is_active: boolean
  inspection_stage_code?: string
  item_code?: string
  sampling_method_code?: string
  inspection_frequency_code?: string
  allowed_actions?: AllowedAction[]
}

/** QMS01-002 detail response — nests import-managed characteristics (read-only on this screen). */
export type InspectionPlanDetailRecord = InspectionPlanRecord & {
  characteristics: InspectionCharacteristicRecord[]
}

export type InspectionPlanListPage = {
  items: InspectionPlanRecord[]
  page: PageMeta
}

export type InspectionPlanListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** QMS01-003 body. */
export type InspectionPlanCreateRequest = {
  code: string
  inspection_stage_id: number
  item_id: number
  item_revision_id?: number | null
  sampling_method_id: number
  inspection_frequency_id: number
  sampling_param: string
}

/** QMS01-004 sparse PATCH body — server only accepts this while plan is DRAFT. */
export type InspectionPlanUpdateRequest = {
  code?: string
  inspection_stage_id?: number
  item_id?: number
  item_revision_id?: number | null
  sampling_method_id?: number
  inspection_frequency_id?: number
  sampling_param?: string
}

/** QMS01-008..012 characteristic_master record. */
export type CharacteristicMasterRecord = {
  id: number
  code: string
  name_vi: string
  name_en: string
  characteristic_category_id: number
  default_char_type: string
  default_uom: string
  is_active: boolean
  characteristic_category_code?: string
  allowed_actions?: AllowedAction[]
}

export type CharacteristicMasterListPage = {
  items: CharacteristicMasterRecord[]
  page: PageMeta
}

/** QMS01-010 body. */
export type CharacteristicMasterCreateRequest = {
  code: string
  name_vi: string
  name_en: string
  characteristic_category_id: number
  default_char_type: string
  default_uom: string
}

/** QMS01-011 sparse PATCH body. */
export type CharacteristicMasterUpdateRequest = {
  code?: string
  name_vi?: string
  name_en?: string
  characteristic_category_id?: number
  default_char_type?: string
  default_uom?: string
}

/** QMS01-013..017 defect_code record. */
export type DefectCodeRecord = {
  id: number
  code: string
  name_vi: string
  name_en: string
  characteristic_category_id: number
  default_severity: string
  is_active: boolean
  characteristic_category_code?: string
  allowed_actions?: AllowedAction[]
}

export type DefectCodeListPage = {
  items: DefectCodeRecord[]
  page: PageMeta
}

/** QMS01-015 body. */
export type DefectCodeCreateRequest = {
  code: string
  name_vi: string
  name_en: string
  characteristic_category_id: number
  default_severity: string
  is_active: boolean
}

/** QMS01-016 sparse PATCH body. */
export type DefectCodeUpdateRequest = {
  code?: string
  name_vi?: string
  name_en?: string
  characteristic_category_id?: number
  default_severity?: string
  is_active?: boolean
}

export type QcMasterLookups = {
  stageById: Map<number, InspectionStageRecord>
  samplingMethodById: Map<number, SamplingMethodRecord>
  frequencyById: Map<number, InspectionFrequencyRecord>
  itemById: Map<number, ItemLookupRecord>
  revisionById: Map<number, ItemRevisionLookupRecord>
  charMasterById: Map<number, CharacteristicMasterRecord>
}

export type InspectionPlanRow = {
  code: string
  stageLabel: string
  itemLabel: string
  revisionLabel: string
  samplingMethodLabel: string
  frequencyLabel: string
  samplingParam: string
  status: string
  isActive: boolean
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

export type CharacteristicMasterRow = {
  code: string
  nameVi: string
  nameEn: string
  categoryLabel: string
  defaultCharType: string
  defaultUom: string
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type DefectCodeRow = {
  code: string
  nameVi: string
  nameEn: string
  categoryLabel: string
  defaultSeverity: string
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}
