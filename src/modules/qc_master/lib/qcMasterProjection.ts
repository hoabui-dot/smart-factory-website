import type {
  AllowedAction,
  CharacteristicCategoryLookupRecord,
  CharacteristicMasterRecord,
  CharacteristicMasterRow,
  DefectCodeRecord,
  DefectCodeRow,
  InspectionFrequencyRecord,
  InspectionPlanRecord,
  InspectionPlanRow,
  InspectionStageRecord,
  ItemLookupRecord,
  ItemRevisionLookupRecord,
  QcMasterLookups,
  SamplingMethodRecord,
} from '../types/qcMaster'

const UNAVAILABLE = '-'

export const STAGE_GROUP_IQC = 'IQC'
export const STAGE_GROUP_IPQC = 'IPQC'
export const STAGE_GROUP_OQC = 'OQC'
export const STAGE_GROUP_SPECIAL = 'SPECIAL'

export const ITEM_TYPE_RAW = 'RAW'
export const ITEM_TYPE_COMPONENT = 'COMPONENT'
export const ITEM_TYPE_SEMI_FINISHED = 'SEMI_FINISHED'
export const ITEM_TYPE_FINISHED = 'FINISHED'

/** Mirrors qc_master/production.go isProductionStageGroup. */
export function isProductionStageGroup(stageGroup: string | undefined | null): boolean {
  const g = (stageGroup ?? '').trim().toUpperCase()
  return g === STAGE_GROUP_IPQC || g === STAGE_GROUP_OQC || g === STAGE_GROUP_SPECIAL
}

/** Mirrors productionPlanRequiresRevision — FG/SF need item_revision_id. */
export function productionPlanRequiresRevision(itemTypeCode: string | undefined | null): boolean {
  const t = (itemTypeCode ?? '').trim().toUpperCase()
  return t === ITEM_TYPE_SEMI_FINISHED || t === ITEM_TYPE_FINISHED
}

/** Mirrors productionPlanRejectsItemType — RAW/COMPONENT rejected on production stages. */
export function productionPlanRejectsItemType(itemTypeCode: string | undefined | null): boolean {
  const t = (itemTypeCode ?? '').trim().toUpperCase()
  return t === ITEM_TYPE_RAW || t === ITEM_TYPE_COMPONENT
}

export function itemTypeCodeOf(item: ItemLookupRecord | undefined): string {
  if (!item) return ''
  return (item.item_type_code || item.item_type || '').trim()
}

/** Prefer items matching stage-group rules; if type codes are missing, return all (server validates). */
export function filterItemsForStage(
  items: ItemLookupRecord[],
  stageGroup: string | undefined | null,
): ItemLookupRecord[] {
  const typed = items.filter((item) => itemTypeCodeOf(item).length > 0)
  if (typed.length === 0) return items

  if (isProductionStageGroup(stageGroup)) {
    return items.filter((item) => {
      const t = itemTypeCodeOf(item)
      if (!t) return true
      return !productionPlanRejectsItemType(t)
    })
  }
  if ((stageGroup ?? '').trim().toUpperCase() === STAGE_GROUP_IQC) {
    return items.filter((item) => {
      const t = itemTypeCodeOf(item).toUpperCase()
      if (!t) return true
      return t === ITEM_TYPE_RAW || t === ITEM_TYPE_COMPONENT
    })
  }
  return items
}

/**
 * Maps SHARED01-009 REFDATA rows (`/api/shared/reference-data/characteristic_category`) into
 * the category lookup shape used by create-form selectors. The facade encodes each row's
 * numeric id as `row_version` and never emits it under `fields` (see `projectRefRow` on the
 * backend), so `row_version` is the only source of the id needed for FK submission.
 */
export function projectCharacteristicCategoryLookups(
  rows: { code: string; label: string; is_active: boolean; row_version: string }[],
): CharacteristicCategoryLookupRecord[] {
  return rows
    .map((row) => ({
      id: Number.parseInt(row.row_version, 10),
      code: row.code,
      name_vi: row.label,
      is_active: row.is_active,
    }))
    .filter((row) => Number.isInteger(row.id) && row.id > 0)
}

/** Never infer mutation availability from status — server allowed_actions is authoritative. */
export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function isActionEnabled(actions: AllowedAction[] | undefined, action: string): boolean {
  return findAllowedAction(actions, action)?.enabled === true
}

/** Builds id->record lookup maps so raw FK ids are never rendered on the checksheet screens. */
export function buildQcMasterLookups(input: {
  stages: InspectionStageRecord[]
  samplingMethods: SamplingMethodRecord[]
  frequencies: InspectionFrequencyRecord[]
  items: ItemLookupRecord[]
  revisions: ItemRevisionLookupRecord[]
  charMasters: CharacteristicMasterRecord[]
}): QcMasterLookups {
  const stageById = new Map<number, InspectionStageRecord>()
  for (const s of input.stages) stageById.set(s.id, s)

  const samplingMethodById = new Map<number, SamplingMethodRecord>()
  for (const m of input.samplingMethods) samplingMethodById.set(m.id, m)

  const frequencyById = new Map<number, InspectionFrequencyRecord>()
  for (const f of input.frequencies) frequencyById.set(f.id, f)

  const itemById = new Map<number, ItemLookupRecord>()
  for (const i of input.items) itemById.set(i.id, i)

  const revisionById = new Map<number, ItemRevisionLookupRecord>()
  for (const r of input.revisions) revisionById.set(r.id, r)

  const charMasterById = new Map<number, CharacteristicMasterRecord>()
  for (const c of input.charMasters) charMasterById.set(c.id, c)

  return { stageById, samplingMethodById, frequencyById, itemById, revisionById, charMasterById }
}

export function projectInspectionPlanRow(
  plan: InspectionPlanRecord,
  lookups: QcMasterLookups,
): InspectionPlanRow {
  const updateAction = findAllowedAction(plan.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(plan.allowed_actions, 'deactivate')
  const releaseAction = findAllowedAction(plan.allowed_actions, 'release')
  const obsoleteAction = findAllowedAction(plan.allowed_actions, 'obsolete')

  const stage = lookups.stageById.get(plan.inspection_stage_id)
  const item = lookups.itemById.get(plan.item_id)
  const revision =
    plan.item_revision_id != null ? lookups.revisionById.get(plan.item_revision_id) : undefined
  const samplingMethod = lookups.samplingMethodById.get(plan.sampling_method_id)
  const frequency = lookups.frequencyById.get(plan.inspection_frequency_id)

  return {
    code: plan.code || UNAVAILABLE,
    stageLabel: plan.inspection_stage_code || stage?.code || UNAVAILABLE,
    itemLabel: plan.item_code || item?.code || UNAVAILABLE,
    revisionLabel: plan.item_revision_id == null ? UNAVAILABLE : revision?.code ?? UNAVAILABLE,
    samplingMethodLabel: plan.sampling_method_code || samplingMethod?.code || UNAVAILABLE,
    frequencyLabel: plan.inspection_frequency_code || frequency?.code || UNAVAILABLE,
    samplingParam: plan.sampling_param || UNAVAILABLE,
    status: plan.status || UNAVAILABLE,
    isActive: plan.is_active,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    canRelease: releaseAction?.enabled === true,
    canObsolete: obsoleteAction?.enabled === true,
    updateAction,
    deactivateAction,
    releaseAction,
    obsoleteAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    deactivateDisabledReason: deactivateAction?.enabled
      ? null
      : deactivateAction?.disabled_reason_code ?? null,
    releaseDisabledReason: releaseAction?.enabled ? null : releaseAction?.disabled_reason_code ?? null,
    obsoleteDisabledReason: obsoleteAction?.enabled
      ? null
      : obsoleteAction?.disabled_reason_code ?? null,
  }
}

export function projectCharacteristicMasterRow(cm: CharacteristicMasterRecord): CharacteristicMasterRow {
  const updateAction = findAllowedAction(cm.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(cm.allowed_actions, 'deactivate')
  return {
    code: cm.code || UNAVAILABLE,
    nameVi: cm.name_vi || UNAVAILABLE,
    nameEn: cm.name_en || UNAVAILABLE,
    categoryLabel: cm.characteristic_category_code || String(cm.characteristic_category_id),
    defaultCharType: cm.default_char_type || UNAVAILABLE,
    defaultUom: cm.default_uom || UNAVAILABLE,
    isActive: cm.is_active,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    updateAction,
    deactivateAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    deactivateDisabledReason: deactivateAction?.enabled
      ? null
      : deactivateAction?.disabled_reason_code ?? null,
  }
}

export function projectDefectCodeRow(dc: DefectCodeRecord): DefectCodeRow {
  const updateAction = findAllowedAction(dc.allowed_actions, 'update')
  const deactivateAction = findAllowedAction(dc.allowed_actions, 'deactivate')
  return {
    code: dc.code || UNAVAILABLE,
    nameVi: dc.name_vi || UNAVAILABLE,
    nameEn: dc.name_en || UNAVAILABLE,
    categoryLabel: dc.characteristic_category_code || String(dc.characteristic_category_id),
    defaultSeverity: dc.default_severity || UNAVAILABLE,
    isActive: dc.is_active,
    canUpdate: updateAction?.enabled === true,
    canDeactivate: deactivateAction?.enabled === true,
    updateAction,
    deactivateAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    deactivateDisabledReason: deactivateAction?.enabled
      ? null
      : deactivateAction?.disabled_reason_code ?? null,
  }
}

export function resolveQcListState(input: {
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

export function validateInspectionPlanCreateForm(input: {
  code: string
  inspectionStageId: number
  itemId: number
  samplingMethodId: number
  inspectionFrequencyId: number
  samplingParam: string
  /** Optional QMS-01b production rules — omit to keep IQC-only required set. */
  stageGroup?: string | null
  itemTypeCode?: string | null
  itemRevisionId?: number | null
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!Number.isInteger(input.inspectionStageId) || input.inspectionStageId <= 0) {
    errors.push('inspection_stage_id')
  }
  if (!Number.isInteger(input.itemId) || input.itemId <= 0) errors.push('item_id')
  if (!Number.isInteger(input.samplingMethodId) || input.samplingMethodId <= 0) {
    errors.push('sampling_method_id')
  }
  if (!Number.isInteger(input.inspectionFrequencyId) || input.inspectionFrequencyId <= 0) {
    errors.push('inspection_frequency_id')
  }
  if (!input.samplingParam.trim()) errors.push('sampling_param')

  if (isProductionStageGroup(input.stageGroup)) {
    if (productionPlanRejectsItemType(input.itemTypeCode)) {
      errors.push('item_id')
    }
    if (
      productionPlanRequiresRevision(input.itemTypeCode) &&
      (!Number.isInteger(input.itemRevisionId) || (input.itemRevisionId ?? 0) <= 0)
    ) {
      errors.push('item_revision_id')
    }
  } else if ((input.stageGroup ?? '').trim().toUpperCase() === STAGE_GROUP_IQC) {
    const t = (input.itemTypeCode ?? '').trim().toUpperCase()
    if (t && t !== ITEM_TYPE_RAW && t !== ITEM_TYPE_COMPONENT) {
      errors.push('item_id')
    }
  }

  return errors
}

export function validateCharacteristicMasterCreateForm(input: {
  code: string
  nameVi: string
  nameEn: string
  characteristicCategoryId: number
  defaultCharType: string
  defaultUom: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.nameVi.trim()) errors.push('name_vi')
  if (!input.nameEn.trim()) errors.push('name_en')
  if (!Number.isInteger(input.characteristicCategoryId) || input.characteristicCategoryId <= 0) {
    errors.push('characteristic_category_id')
  }
  if (!input.defaultCharType.trim()) errors.push('default_char_type')
  if (!input.defaultUom.trim()) errors.push('default_uom')
  return errors
}

export function validateDefectCodeCreateForm(input: {
  code: string
  nameVi: string
  nameEn: string
  characteristicCategoryId: number
  defaultSeverity: string
}): string[] {
  const errors: string[] = []
  if (!input.code.trim()) errors.push('code')
  if (!input.nameVi.trim()) errors.push('name_vi')
  if (!input.nameEn.trim()) errors.push('name_en')
  if (!Number.isInteger(input.characteristicCategoryId) || input.characteristicCategoryId <= 0) {
    errors.push('characteristic_category_id')
  }
  if (!input.defaultSeverity.trim()) errors.push('default_severity')
  return errors
}
