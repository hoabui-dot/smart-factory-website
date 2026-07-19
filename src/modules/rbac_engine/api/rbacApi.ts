import { httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  Permission,
  PermissionListPage,
  PermissionListQuery,
  RolePermissionView,
} from '../types/rbac'

function normalizeListPage(raw: unknown): PermissionListPage {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const items = Array.isArray(data.items) ? (data.items as Permission[]) : []
  const pageRaw = (data.page ?? {}) as Record<string, unknown>
  return {
    items,
    page: {
      limit: typeof pageRaw.limit === 'number' ? pageRaw.limit : 50,
      next_cursor: typeof pageRaw.next_cursor === 'string' ? pageRaw.next_cursor : null,
      has_more: Boolean(pageRaw.has_more),
    },
  }
}

/** NB02-001 */
export async function listPermissions(query: PermissionListQuery = {}): Promise<PermissionListPage> {
  const { data } = await httpClient.get('/api/admin/rbac/permissions', {
    params: {
      limit: query.limit ?? 200,
      cursor: query.cursor,
      sort: query.sort,
      q: query.q,
    },
  })
  return normalizeListPage(data)
}

/** NB02-002 */
export async function getRolePermissions(roleCode: string): Promise<RolePermissionView> {
  const { data } = await httpClient.get(`/api/admin/rbac/roles/${encodeURIComponent(roleCode)}/permissions`)
  return unwrapSuccessData<RolePermissionView>(data)
}

/** NB02-003 */
export async function replaceRolePermissions(
  roleCode: string,
  permissionCodes: string[],
  idempotencyKey = newIdempotencyKey('nb02-rbac'),
): Promise<RolePermissionView> {
  const { data } = await httpClient.put(
    `/api/admin/rbac/roles/${encodeURIComponent(roleCode)}/permissions`,
    { permission_codes: permissionCodes },
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    },
  )
  return unwrapSuccessData<RolePermissionView>(data)
}
