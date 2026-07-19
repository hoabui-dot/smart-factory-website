import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  AttachFileRequest,
  AttachmentListPage,
  AuthorizeUploadRequest,
  AuthorizeUploadResult,
  CommentListPage,
  CreateCommentRequest,
  EntityAttachmentRecord,
  FileStorageRecord,
  FinalizeUploadRequest,
  ReferenceListQuery,
  TimelineListPage,
} from '../types/sharedContent'

function entityBase(entityType: string, entityId: number): string {
  return `/api/shared/entities/${encodeURIComponent(entityType)}/${entityId}`
}

function normalizePage<T>(raw: unknown): { items: T[]; page: { limit: number; next_cursor: string | null; has_more: boolean } } {
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

/** SHARED02-001 GET /api/shared/entities/{entity_type}/{entity_id}/comments */
export async function listComments(
  entityType: string,
  entityId: number,
  query: ReferenceListQuery = {},
): Promise<CommentListPage> {
  const { data } = await httpClient.get(`${entityBase(entityType, entityId)}/comments`, {
    params: query,
  })
  return normalizePage(data) as CommentListPage
}

/** SHARED02-002 POST /api/shared/entities/{entity_type}/{entity_id}/comments */
export async function createComment(
  entityType: string,
  entityId: number,
  body: CreateCommentRequest,
  idempotencyKey?: string,
) {
  const { data } = await httpClient.post(`${entityBase(entityType, entityId)}/comments`, body, {
    headers: { 'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('shared02-comment-create') },
  })
  return unwrapSuccessData(data)
}

/** SHARED02-003 GET /api/shared/entities/{entity_type}/{entity_id}/attachments */
export async function listEntityAttachments(
  entityType: string,
  entityId: number,
  query: ReferenceListQuery = {},
): Promise<AttachmentListPage> {
  const { data } = await httpClient.get(`${entityBase(entityType, entityId)}/attachments`, {
    params: query,
  })
  return normalizePage(data) as AttachmentListPage
}

/** SHARED02-004 POST /api/shared/entities/{entity_type}/{entity_id}/attachments */
export async function attachFile(
  entityType: string,
  entityId: number,
  body: AttachFileRequest,
  idempotencyKey?: string,
): Promise<EntityAttachmentRecord> {
  const { data } = await httpClient.post(`${entityBase(entityType, entityId)}/attachments`, body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('shared02-attachment-create'),
    },
  })
  return unwrapSuccessData<EntityAttachmentRecord>(data)
}

/** SHARED02-005 DELETE /api/shared/entities/{entity_type}/{entity_id}/attachments/{attachment_id} */
export async function detachAttachment(
  entityType: string,
  entityId: number,
  attachmentId: number,
  idempotencyKey?: string,
): Promise<void> {
  await httpClient.delete(`${entityBase(entityType, entityId)}/attachments/${attachmentId}`, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('shared02-attachment-detach'),
    },
  })
}

/** SHARED02-006 GET /api/shared/entities/{entity_type}/{entity_id}/timeline */
export async function getEntityTimeline(
  entityType: string,
  entityId: number,
  query: ReferenceListQuery = {},
): Promise<TimelineListPage> {
  const { data } = await httpClient.get(`${entityBase(entityType, entityId)}/timeline`, {
    params: query,
  })
  return normalizePage(data) as TimelineListPage
}

/** NB04-001 POST /api/files/uploads:authorize — used ahead of SHARED02-004 attach. */
export async function authorizeUpload(
  body: AuthorizeUploadRequest,
  idempotencyKey?: string,
): Promise<AuthorizeUploadResult> {
  const { data } = await httpClient.post('/api/files/uploads:authorize', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb04-upload-authorize'),
    },
  })
  return unwrapSuccessData<AuthorizeUploadResult>(data)
}

/**
 * Uploads the raw file bytes to the NB-04 signed quarantine target. Runs outside `httpClient`
 * (different origin/base URL, no auth/App-Type headers). Returns the storage ETag when the
 * storage backend exposes it; callers must fall back to the checksum otherwise (CORS may hide
 * response headers on cross-origin signed URLs).
 */
export async function uploadFileToSignedTarget(
  authorized: AuthorizeUploadResult,
  file: File | Blob,
): Promise<string | null> {
  const res = await fetch(authorized.upload_url, {
    method: authorized.upload_method || 'PUT',
    headers: {
      'Content-Type': (file as File).type || 'application/octet-stream',
      ...(authorized.upload_headers ?? {}),
    },
    body: file,
  })
  if (!res.ok) {
    throw new ApiError('DEPENDENCY_UNAVAILABLE', 'Tải file lên storage thất bại.', res.status)
  }
  return res.headers.get('ETag')
}

/** NB04-002 POST /api/files/{file_id}/finalize */
export async function finalizeUpload(
  fileId: number,
  body: FinalizeUploadRequest,
  idempotencyKey?: string,
): Promise<FileStorageRecord> {
  const { data } = await httpClient.post(`/api/files/${fileId}/finalize`, body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb04-upload-finalize'),
    },
  })
  return unwrapSuccessData<FileStorageRecord>(data)
}

/** Computes the hex SHA-256 checksum NB04-001/002 requires, using the browser Web Crypto API. */
export async function computeSha256Hex(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
