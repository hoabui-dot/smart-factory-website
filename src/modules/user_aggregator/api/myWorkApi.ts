import { httpClient, unwrapSuccessData } from '@/shared/api'

import type { MyWorkPage, MyWorkTask } from '../types/myWork'

export async function listMyWork(query: { q?: string; cursor?: string; limit?: number; sort?: string } = {}): Promise<MyWorkPage> {
  const { data } = await httpClient.get('/api/shared/my-work', { params: query })
  const payload = unwrapSuccessData<Record<string, unknown>>(data)
  const page = (payload.page ?? {}) as Record<string, unknown>
  return {
    items: Array.isArray(payload.items) ? payload.items as MyWorkTask[] : [],
    page: {
      limit: typeof page.limit === 'number' ? page.limit : 50,
      has_more: Boolean(page.has_more),
      next_cursor: typeof page.next_cursor === 'string' ? page.next_cursor : null,
    },
  }
}
