import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AllowedAction,
  ItemCategoryRecord,
  ItemCreateRequest,
  ItemListPage,
  ItemListQuery,
  ItemRecord,
  ItemTypeRecord,
  ReferenceListQuery,
  UomRecord,
} from '../types/itemMaster'

function normalizePage<T>(raw: unknown): { items: T[]; page: ItemListPage['page'] } {
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

/** MES01-001 GET /api/mes/items */
export async function listItems(query: ItemListQuery = {}): Promise<ItemListPage> {
  const { data } = await httpClient.get('/api/mes/items', { params: query })
  return normalizePage<ItemRecord>(data)
}

/** MES01-002 GET /api/mes/items/{item_code} */
export async function getItem(itemCode: string): Promise<ItemRecord> {
  const code = itemCode.trim()
  if (!code) throw new ApiError('VALIDATION_ERROR', 'item_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/mes/items/${encodeURIComponent(code)}`)
  return unwrapSuccessData<ItemRecord>(data)
}

/** MES01-003 POST /api/mes/items — always shown; server enforces create permission. */
export async function createItem(
  body: ItemCreateRequest,
  idempotencyKey?: string,
): Promise<ItemRecord> {
  const { data } = await httpClient.post('/api/mes/items', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes01-item-create'),
    },
  })
  return unwrapSuccessData<ItemRecord>(data)
}

/**
 * MES01-004 PATCH — invoked only via server-issued `allowed_actions[].href`.
 * Never build this URL from item_code directly; enabling is server-gated.
 */
export async function updateItemViaAction(
  action: AllowedAction,
  body: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<ItemRecord> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'update href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'PATCH',
    url: action.href,
    data: body,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes01-item-update'),
    },
  })
  return unwrapSuccessData<ItemRecord>(data)
}

/**
 * MES01-005 DELETE (soft-deactivate) — invoked only via server-issued
 * `allowed_actions[].href`; caller must confirm before calling.
 */
export async function deactivateItemViaAction(
  action: AllowedAction,
  idempotencyKey?: string,
): Promise<ItemRecord> {
  if (!action.href.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'deactivate href không hợp lệ.', 400)
  }
  const { data } = await httpClient.request({
    method: action.method || 'DELETE',
    url: action.href,
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('mes01-item-deactivate'),
    },
  })
  return unwrapSuccessData<ItemRecord>(data)
}

/** MES01-010 GET /api/mes/reference/item-types */
export async function listItemTypes(query: ReferenceListQuery = {}): Promise<ItemTypeRecord[]> {
  const { data } = await httpClient.get('/api/mes/reference/item-types', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<ItemTypeRecord>(data)
}

/** MES01-011 GET /api/mes/reference/item-categories */
export async function listItemCategories(
  query: ReferenceListQuery = {},
): Promise<ItemCategoryRecord[]> {
  const { data } = await httpClient.get('/api/mes/reference/item-categories', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<ItemCategoryRecord>(data)
}

/** MES01-012 GET /api/mes/reference/uoms */
export async function listUoms(query: ReferenceListQuery = {}): Promise<UomRecord[]> {
  const { data } = await httpClient.get('/api/mes/reference/uoms', {
    params: { limit: 200, ...query },
  })
  return unwrapItems<UomRecord>(data)
}
