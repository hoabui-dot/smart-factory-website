import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  OperatorSkillCreateRequest,
  OperatorSkillListPage,
  OperatorSkillListQuery,
  OperatorSkillRecord,
  ShiftAssignmentCreateRequest,
  ShiftAssignmentListPage,
  ShiftAssignmentListQuery,
  ShiftAssignmentRecord,
  ShiftCreateRequest,
  ShiftListPage,
  ShiftListQuery,
  ShiftRecord,
  SkillMasterCreateRequest,
  SkillMasterListPage,
  SkillMasterListQuery,
  SkillMasterRecord,
  TrainingRecordCreateRequest,
  TrainingRecordListPage,
  TrainingRecordListQuery,
  TrainingRecordRecord,
} from '../types/shiftSkill'

function normalizePage<T>(raw: unknown): { items: T[]; page: ShiftListPage['page'] } {
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

function assertActionHref(action: AllowedAction, kind: string): void {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', `${kind} href không hợp lệ.`, 400)
  }
}

/** MES09-001 GET /api/mes/shifts */
export async function listShifts(query: ShiftListQuery = {}): Promise<ShiftListPage> {
  const { data } = await httpClient.get('/api/mes/shifts', { params: query })
  return normalizePage<ShiftRecord>(data)
}

/** MES09-002 GET /api/mes/shifts/{shift_code} */
export async function getShift(shiftCode: string): Promise<ShiftRecord> {
  const code = shiftCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'shift_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/shifts/${encodeURIComponent(code)}`)
  return unwrapSuccessData<ShiftRecord>(data)
}

/** MES09-003 POST /api/mes/shifts — always shown; server enforces create permission. */
export async function createShift(
  body: ShiftCreateRequest,
  idempotencyKey?: string,
): Promise<ShiftRecord> {
  const { data } = await httpClient.post('/api/mes/shifts', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-shift-create') },
  })
  return unwrapSuccessData<ShiftRecord>(data)
}

/** MES09-004 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateShiftViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<ShiftRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-shift-update') },
  })
  return unwrapSuccessData<ShiftRecord>(data)
}

/** MES09-005 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateShiftViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<ShiftRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-shift-deactivate') },
  })
  return unwrapSuccessData<ShiftRecord>(data)
}

/** MES09-006 GET /api/mes/shift-assignments */
export async function listShiftAssignments(
  query: ShiftAssignmentListQuery = {},
): Promise<ShiftAssignmentListPage> {
  const { data } = await httpClient.get('/api/mes/shift-assignments', { params: query })
  return normalizePage<ShiftAssignmentRecord>(data)
}

/** MES09-007 GET /api/mes/shift-assignments/{shift_assignment_code} */
export async function getShiftAssignment(code: string): Promise<ShiftAssignmentRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'shift_assignment_code không hợp lệ.', 400)
  const { data } = await httpClient.get(
    `/api/mes/shift-assignments/${encodeURIComponent(trimmed)}`,
  )
  return unwrapSuccessData<ShiftAssignmentRecord>(data)
}

/** MES09-008 POST /api/mes/shift-assignments — always shown; server enforces create permission. */
export async function createShiftAssignment(
  body: ShiftAssignmentCreateRequest,
  idempotencyKey?: string,
): Promise<ShiftAssignmentRecord> {
  const { data } = await httpClient.post('/api/mes/shift-assignments', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-shift-assignment-create') },
  })
  return unwrapSuccessData<ShiftAssignmentRecord>(data)
}

/** MES09-009 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateShiftAssignmentViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<ShiftAssignmentRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-shift-assignment-update'),
    },
  })
  return unwrapSuccessData<ShiftAssignmentRecord>(data)
}

/** MES09-010 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateShiftAssignmentViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<ShiftAssignmentRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-shift-assignment-deactivate'),
    },
  })
  return unwrapSuccessData<ShiftAssignmentRecord>(data)
}

/** MES09-011 GET /api/mes/skills */
export async function listSkillMasters(
  query: SkillMasterListQuery = {},
): Promise<SkillMasterListPage> {
  const { data } = await httpClient.get('/api/mes/skills', { params: query })
  return normalizePage<SkillMasterRecord>(data)
}

/** MES09-012 GET /api/mes/skills/{skill_master_code} */
export async function getSkillMaster(code: string): Promise<SkillMasterRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'skill_master_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/skills/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<SkillMasterRecord>(data)
}

/** MES09-013 POST /api/mes/skills — always shown; server enforces create permission. */
export async function createSkillMaster(
  body: SkillMasterCreateRequest,
  idempotencyKey?: string,
): Promise<SkillMasterRecord> {
  const { data } = await httpClient.post('/api/mes/skills', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-skill-create') },
  })
  return unwrapSuccessData<SkillMasterRecord>(data)
}

/** MES09-014 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateSkillMasterViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<SkillMasterRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-skill-update') },
  })
  return unwrapSuccessData<SkillMasterRecord>(data)
}

/** MES09-015 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateSkillMasterViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<SkillMasterRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-skill-deactivate') },
  })
  return unwrapSuccessData<SkillMasterRecord>(data)
}

/** MES09-016 GET /api/mes/operator-skills */
export async function listOperatorSkills(
  query: OperatorSkillListQuery = {},
): Promise<OperatorSkillListPage> {
  const { data } = await httpClient.get('/api/mes/operator-skills', { params: query })
  return normalizePage<OperatorSkillRecord>(data)
}

/** MES09-017 GET /api/mes/operator-skills/{operator_skill_code} */
export async function getOperatorSkill(code: string): Promise<OperatorSkillRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'operator_skill_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/operator-skills/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<OperatorSkillRecord>(data)
}

/** MES09-018 POST /api/mes/operator-skills — always shown; server enforces create permission. */
export async function createOperatorSkill(
  body: OperatorSkillCreateRequest,
  idempotencyKey?: string,
): Promise<OperatorSkillRecord> {
  const { data } = await httpClient.post('/api/mes/operator-skills', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-operator-skill-create') },
  })
  return unwrapSuccessData<OperatorSkillRecord>(data)
}

/** MES09-019 PATCH — invoked only via server-issued `allowed_actions[].href`. */
export async function updateOperatorSkillViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<OperatorSkillRecord> {
  assertActionHref(action, 'update')
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-operator-skill-update'),
    },
  })
  return unwrapSuccessData<OperatorSkillRecord>(data)
}

/** MES09-020 DELETE — invoked only via server-issued `allowed_actions[].href`; caller must confirm. */
export async function deactivateOperatorSkillViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<OperatorSkillRecord> {
  assertActionHref(action, 'deactivate')
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-operator-skill-deactivate'),
    },
  })
  return unwrapSuccessData<OperatorSkillRecord>(data)
}

/** MES09-021 GET /api/mes/training-records */
export async function listTrainingRecords(
  query: TrainingRecordListQuery = {},
): Promise<TrainingRecordListPage> {
  const { data } = await httpClient.get('/api/mes/training-records', { params: query })
  return normalizePage<TrainingRecordRecord>(data)
}

/** MES09-022 GET /api/mes/training-records/{training_record_code} */
export async function getTrainingRecord(code: string): Promise<TrainingRecordRecord> {
  const trimmed = code.trim()
  if (!trimmed) throw new ApiError('VALIDATION_ERROR', 'training_record_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/training-records/${encodeURIComponent(trimmed)}`)
  return unwrapSuccessData<TrainingRecordRecord>(data)
}

/** MES09-023 POST /api/mes/training-records — always shown; server enforces create permission. */
export async function createTrainingRecord(
  body: TrainingRecordCreateRequest,
  idempotencyKey?: string,
): Promise<TrainingRecordRecord> {
  const { data } = await httpClient.post('/api/mes/training-records', body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes09-training-record-create') },
  })
  return unwrapSuccessData<TrainingRecordRecord>(data)
}
