import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import { projectCharacteristicCategoryLookups } from '../lib/qcMasterProjection'
import type {
  AllowedAction,
  CharacteristicCategoryLookupRecord,
  CharacteristicMasterCreateRequest,
  CharacteristicMasterListPage,
  CharacteristicMasterRecord,
  DefectCodeCreateRequest,
  DefectCodeListPage,
  DefectCodeRecord,
  InspectionFrequencyRecord,
  InspectionPlanCreateRequest,
  InspectionPlanDetailRecord,
  InspectionPlanListPage,
  InspectionPlanListQuery,
  InspectionPlanRecord,
  InspectionStageRecord,
  ItemLookupRecord,
  ItemRevisionLookupRecord,
  ReferenceListQuery,
  SamplingMethodRecord,
} from '../types/qcMaster'

function normalizePage<T>(raw: unknown): { items: T[]; page: InspectionPlanListPage['page'] } {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const page = (data.page ?? {}) as Record<string, unknown>
  return {
    items: Array.isArray(data.items) ? (data.items as T[]) : [],
    page: {
      limit: typeof page.limit === 'number' ? page.limit : 50,
      next_cursor: typeof page.next_cursor === 'string' ? page.next_cursor : null,
      has_more: Boolean(page.has_more),
    },
  }
}

function unwrapItems<T>(raw: unknown): T[] {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  return Array.isArray(data.items) ? (data.items as T[]) : []
}

function assertActionHref(action: AllowedAction, kind: string): void {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', `${kind} href không hợp lệ.`, 400)
  }
}

/** QMS01-001 GET /api/qms/checksheets */
export async function listInspectionPlans(
  query: InspectionPlanListQuery = {},
): Promise<InspectionPlanListPage> {
  const { data } = await httpClient.get('/api/qms/checksheets', { params: query })
  return normalizePage<InspectionPlanRecord>(data)
}

/** QMS01-002 GET /api/qms/checksheets/{inspection_plan_code} */
export async function getInspectionPlan(planCode: string): Promise<InspectionPlanDetailRecord> {
  const code = planCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'plan_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/qms/checksheets/${encodeURIComponent(code)}`)
  return unwrapSuccessData<InspectionPlanDetailRecord>(data)
}

/** QMS01-003 POST /api/qms/checksheets — always shown; server enforces create permission. */
export async function createInspectionPlan(
  body: InspectionPlanCreateRequest,
  idempotencyKey?: string,
): Promise<InspectionPlanRecord> {
  const { data } = await httpClient.post('/api/qms/checksheets', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-plan-create') },
  })
  return unwrapSuccessData<InspectionPlanRecord>(data)
}

/**
 * QMS01-004 PATCH — invoked only via server-issued `allowed_actions[].href`; server rejects
 * PATCH unless plan is DRAFT (NOT_ALLOWED_BY_STATUS), so this is gated client-side by `allowed_actions`.
 */
export async function updateInspectionPlanViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<InspectionPlanRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-plan-update') },
  })
  return unwrapSuccessData<InspectionPlanRecord>(data)
}

/** QMS01-005 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateInspectionPlanViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<InspectionPlanRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-plan-deactivate') },
  })
  return unwrapSuccessData<InspectionPlanRecord>(data)
}

/**
 * QMS01-006 POST .../release — invoked only via server-issued `allowed_actions[].href`;
 * caller must confirm (previously RELEASED plans in the same item/stage/revision scope
 * transition to OBSOLETE).
 */
export async function releaseInspectionPlanViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<InspectionPlanRecord> {
  assertActionHref(action, 'release')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-plan-release') },
  })
  return unwrapSuccessData<InspectionPlanRecord>(data)
}

/** QMS01-007 POST .../obsolete — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function obsoleteInspectionPlanViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<InspectionPlanRecord> {
  assertActionHref(action, 'obsolete')
  const { data } = await httpClient.request({
    method: action.method || 'POST',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-plan-obsolete') },
  })
  return unwrapSuccessData<InspectionPlanRecord>(data)
}

/** QMS01-008 GET /api/qms/characteristics */
export async function listCharacteristicMasters(
  query: ReferenceListQuery = {},
): Promise<CharacteristicMasterListPage> {
  const { data } = await httpClient.get('/api/qms/characteristics', { params: query })
  return normalizePage<CharacteristicMasterRecord>(data)
}

/** QMS01-009 GET /api/qms/characteristics/{characteristic_master_code} */
export async function getCharacteristicMaster(code: string): Promise<CharacteristicMasterRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'characteristic_master_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/qms/characteristics/${encodeURIComponent(c)}`)
  return unwrapSuccessData<CharacteristicMasterRecord>(data)
}

/** QMS01-010 POST /api/qms/characteristics — always shown; server enforces create permission. */
export async function createCharacteristicMaster(
  body: CharacteristicMasterCreateRequest,
  idempotencyKey?: string,
): Promise<CharacteristicMasterRecord> {
  const { data } = await httpClient.post('/api/qms/characteristics', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-charm-create') },
  })
  return unwrapSuccessData<CharacteristicMasterRecord>(data)
}

/** QMS01-011 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateCharacteristicMasterViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<CharacteristicMasterRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-charm-update') },
  })
  return unwrapSuccessData<CharacteristicMasterRecord>(data)
}

/** QMS01-012 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateCharacteristicMasterViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<CharacteristicMasterRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-charm-deactivate') },
  })
  return unwrapSuccessData<CharacteristicMasterRecord>(data)
}

/** QMS01-013 GET /api/qms/defect-codes */
export async function listDefectCodes(query: ReferenceListQuery = {}): Promise<DefectCodeListPage> {
  const { data } = await httpClient.get('/api/qms/defect-codes', { params: query })
  return normalizePage<DefectCodeRecord>(data)
}

/** QMS01-014 GET /api/qms/defect-codes/{defect_code_code} */
export async function getDefectCode(code: string): Promise<DefectCodeRecord> {
  const c = code.trim()
  if (!c) throw new ApiError('VALIDATION_ERROR', 'defect_code_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/qms/defect-codes/${encodeURIComponent(c)}`)
  return unwrapSuccessData<DefectCodeRecord>(data)
}

/** QMS01-015 POST /api/qms/defect-codes — always shown; server enforces create permission. */
export async function createDefectCode(
  body: DefectCodeCreateRequest,
  idempotencyKey?: string,
): Promise<DefectCodeRecord> {
  const { data } = await httpClient.post('/api/qms/defect-codes', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-defect-create') },
  })
  return unwrapSuccessData<DefectCodeRecord>(data)
}

/** QMS01-016 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateDefectCodeViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<DefectCodeRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-defect-update') },
  })
  return unwrapSuccessData<DefectCodeRecord>(data)
}

/** QMS01-017 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateDefectCodeViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<DefectCodeRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('qms01-defect-deactivate') },
  })
  return unwrapSuccessData<DefectCodeRecord>(data)
}

/** QMS01-018 GET /api/qms/reference/inspection-stages */
export async function listInspectionStages(
  query: ReferenceListQuery = {},
): Promise<InspectionStageRecord[]> {
  const { data } = await httpClient.get('/api/qms/reference/inspection-stages', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<InspectionStageRecord>(data)
}

/** QMS01-019 GET /api/qms/reference/sampling-methods */
export async function listSamplingMethods(
  query: ReferenceListQuery = {},
): Promise<SamplingMethodRecord[]> {
  const { data } = await httpClient.get('/api/qms/reference/sampling-methods', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<SamplingMethodRecord>(data)
}

/** QMS01-020 GET /api/qms/reference/inspection-frequencies */
export async function listInspectionFrequencies(
  query: ReferenceListQuery = {},
): Promise<InspectionFrequencyRecord[]> {
  const { data } = await httpClient.get('/api/qms/reference/inspection-frequencies', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<InspectionFrequencyRecord>(data)
}

/** MES-01 item lookup for the plan item_id selector. */
export async function listItemOptions(query: ReferenceListQuery = {}): Promise<ItemLookupRecord[]> {
  const { data } = await httpClient.get('/api/mes/items', { params: { limit: 200, ...query } })
  return unwrapItems<ItemLookupRecord>(data)
}

/** MES01-006 item_revision lookup for the plan item_revision_id selector, scoped to one item. */
export async function listItemRevisionOptions(
  itemCode: string,
  query: ReferenceListQuery = {},
): Promise<ItemRevisionLookupRecord[]> {
  const code = itemCode.trim()
  if (!code) return []
  const { data } = await httpClient.get(`/api/mes/items/${encodeURIComponent(code)}/revisions`, {
    params: { limit: 200, ...query },
  })
  return unwrapItems<ItemRevisionLookupRecord>(data)
}

/**
 * SHARED01-009 GET /api/shared/reference-data/characteristic_category — QMS-01 owns this
 * allowlisted REFDATA table but exposes no dedicated list endpoint of its own, so the
 * characteristic_master / defect_code category selector resolves ids via the shared facade.
 */
export async function listCharacteristicCategories(
  query: ReferenceListQuery = {},
): Promise<CharacteristicCategoryLookupRecord[]> {
  const { data } = await httpClient.get('/api/shared/reference-data/characteristic_category', {
    params: { limit: 200, ...query },
  })
  const rows = unwrapItems<{ code: string; label: string; is_active: boolean; row_version: string }>(data)
  return projectCharacteristicCategoryLookups(rows)
}
