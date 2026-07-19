import { httpClient, ApiError, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  FileListPage,
  FileListQuery,
  FileStorageRecord,
  SignedDownload,
} from '../types/fileStorage'

function normalizeListPage(raw: unknown): FileListPage {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const items = Array.isArray(data.items) ? (data.items as FileStorageRecord[]) : []
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

/** NB04-008 GET /api/admin/files */
export async function listAdminFiles(query: FileListQuery = {}): Promise<FileListPage> {
  const { data } = await httpClient.get('/api/admin/files', {
    params: {
      limit: query.limit,
      cursor: query.cursor,
      sort: query.sort,
      q: query.q,
      is_deleted: query.is_deleted,
    },
  })
  return normalizeListPage(data)
}

/** NB04-003 GET /api/files/{file_id}/download-url */
export async function getFileDownloadUrl(fileId: number): Promise<SignedDownload> {
  if (!Number.isInteger(fileId) || fileId <= 0) {
    throw new ApiError('VALIDATION_ERROR', 'file_id không hợp lệ.', 400)
  }
  const { data } = await httpClient.get(`/api/files/${fileId}/download-url`)
  return unwrapSuccessData<SignedDownload>(data)
}

/** NB04-004 POST /api/admin/files/{file_id}/archive */
export async function archiveAdminFile(
  fileId: number,
  reason: string,
  idempotencyKey?: string,
): Promise<FileStorageRecord> {
  if (!Number.isInteger(fileId) || fileId <= 0) {
    throw new ApiError('VALIDATION_ERROR', 'file_id không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(
    `/api/admin/files/${fileId}/archive`,
    { reason },
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb04-archive'),
      },
    },
  )
  return unwrapSuccessData<FileStorageRecord>(data)
}

export { newIdempotencyKey }
