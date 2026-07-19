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

/** PRODUCT-OVERVIEW §13.4 comment.entity_type whitelist (backend CommentEntityTypeWhitelist). */
export const COMMENT_ENTITY_TYPES = [
  'work_order',
  'production_log',
  'lot',
  'non_conformance_report',
  'inspection_result_header',
  'material_request',
  'goods_receipt_header',
  'stocktake',
] as const
export type CommentEntityType = (typeof COMMENT_ENTITY_TYPES)[number]

/** entity_attachments.parent_type whitelist (backend file_storage.ParentTypeWhitelist) — a
 * different set than comment.entity_type; attachments are DEFINED-but-unsupported outside it. */
export const ATTACHMENT_PARENT_TYPES = [
  'lot',
  'inspection_result_detail',
  'non_conformance_report',
  'document_revision',
  'coc',
  'stocktake',
  'shipment',
  'comment',
] as const

/** SHARED02-001..006 comment record — created_by/deleted_at kept for client-side projection
 * only (API-SPEC §15.33.2). */
export type CommentRecord = {
  id: number
  code: string
  entity_type: string
  entity_id: number
  parent_comment_id?: number | null
  body: string
  created_by: number
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
}

/** entity_attachments record shared with NB-04 (API-SPEC §15.25.2/§15.33.2). */
export type EntityAttachmentRecord = {
  id: number
  code: string
  file_id: number
  parent_type: string
  parent_id: number
  attachment_type: string
  caption?: string | null
  uploaded_by: number
  uploaded_at: string
}

/** activity_events row surfaced read-only in the merged timeline (NB-03). */
export type ActivityEventRecord = {
  id: number
  code: string
  event_type: string
  entity_type: string
  entity_id: number
  actor_user_id?: number | null
  action: string
  from_state?: string | null
  to_state?: string | null
  payload?: unknown
  occurred_at: string
}

export type TimelineItemKind = 'comment' | 'attachment' | 'activity_event'

export type TimelineItem = {
  kind: TimelineItemKind
  occurred_at: string
  comment?: CommentRecord
  attachment?: EntityAttachmentRecord
  activity_event?: ActivityEventRecord
}

export type CommentListPage = { items: CommentRecord[]; page: PageMeta }
export type AttachmentListPage = { items: EntityAttachmentRecord[]; page: PageMeta }
export type TimelineListPage = { items: TimelineItem[]; page: PageMeta }

/** SHARED02-002 request DTO. */
export type CreateCommentRequest = {
  body: string
  parent_comment_id?: number | null
}

/** SHARED02-004 request DTO — attachment_type/caption required server-side alongside file_id
 * (backend AttachFileInput), even though the endpoint table only calls out file_id. */
export type AttachFileRequest = {
  file_id: number
  attachment_type: string
  caption?: string
}

/** Canonical attachment_type samples from API-SPEC §15.33.2; free-form beyond this is accepted
 * server-side but these cover the documented business categories. */
export const ATTACHMENT_TYPES = [
  'COMMENT_ATTACHMENT',
  'MILL_CERTIFICATE',
  'DEFECT_PHOTO',
  'NCR_EVIDENCE',
  'CONTROL_PLAN',
  'DRAWING',
  'SOP',
  'PPAP_ELEMENT',
  'COC_PDF',
  'STOCKTAKE_RECORD',
] as const

/** NB04-001 request DTO. */
export type AuthorizeUploadRequest = {
  file_purpose: string
  owner_module: string
  entity_type: string
  entity_id: number
  file_name: string
  mime_type: string
  size_bytes: number
  checksum_sha256: string
}

/** NB04-001 response DTO — `upload_id` doubles as the finalize/attach `file_id`. */
export type AuthorizeUploadResult = {
  upload_id: number
  upload_url: string
  upload_method: string
  upload_headers?: Record<string, string>
  expires_at: string
  max_size_bytes: number
}

/** NB04-002 request DTO. */
export type FinalizeUploadRequest = {
  storage_etag: string
  checksum?: string
}

/** NB04-002 response DTO (file_storage record; storage_path never projected). */
export type FileStorageRecord = {
  id: number
  code: string
  original_filename: string
  mime_type: string
  size_bytes: number
  storage_provider: string
  sha256_checksum: string
  uploaded_by: number
  uploaded_at: string
  is_deleted: boolean
}

export type CommentRow = {
  id: number
  code: string
  body: string
  createdAtLabel: string
  updatedAtLabel: string
  uploadedByLabel: string
  isReply: boolean
  parentCode: string | null
  isDeleted: boolean
}

export type AttachmentRow = {
  id: number
  code: string
  fileId: number
  attachmentType: string
  caption: string
  uploadedAtLabel: string
  uploadedByLabel: string
}

export type ReplyTarget = {
  id: number
  code: string
}

export type TimelineRow = {
  key: string
  kind: TimelineItemKind
  occurredAtLabel: string
  title: string
  summary: string
}
