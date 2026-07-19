import type {
  ActivityEventRecord,
  AttachmentRow,
  CommentRecord,
  CommentRow,
  EntityAttachmentRecord,
  TimelineItem,
  TimelineRow,
} from '../types/sharedContent'

const UNAVAILABLE = '-'

export type SectionState =
  | 'loading'
  | 'empty'
  | 'no-result'
  | 'permission-denied'
  | 'not-found'
  | 'unsupported'
  | 'dependency-unavailable'
  | 'error'
  | 'ready'

/** Maps canonical API error codes to a deterministic section UI state — never invents a new
 * error code, only projects the existing canonical one into a UI state (WEB-SCREENS §F). */
export function resolveSectionState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode: string | null
}): SectionState {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    switch (input.errorCode) {
      case 'PERMISSION_DENIED':
        return 'permission-denied'
      case 'POLYMORPHIC_TARGET_NOT_FOUND':
        return 'not-found'
      case 'INVALID_POLYMORPHIC_TYPE':
        return 'unsupported'
      case 'DEPENDENCY_UNAVAILABLE':
        return 'dependency-unavailable'
      default:
        return 'error'
    }
  }
  if (input.itemCount === 0) return input.hasQuery ? 'no-result' : 'empty'
  return 'ready'
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return UNAVAILABLE
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('vi-VN')
}

/** `/api/admin/users` is system_admin_only and has no numeric-id-safe lookup for non-admin
 * sessions — same documented gap as WMS-01b `manager_user_id` / MES-09 operator selectors.
 * Never render the raw physical id as if it were a business code; label it explicitly. */
export function userLabel(userId: number | null | undefined): string {
  if (userId == null) return UNAVAILABLE
  return `User #${userId}`
}

export function projectCommentRow(
  comment: CommentRecord,
  commentsById: Map<number, CommentRecord>,
): CommentRow {
  const parent =
    comment.parent_comment_id != null ? commentsById.get(comment.parent_comment_id) : undefined
  return {
    id: comment.id,
    code: comment.code || UNAVAILABLE,
    body: comment.body,
    createdAtLabel: formatDateTime(comment.created_at),
    updatedAtLabel: comment.updated_at ? formatDateTime(comment.updated_at) : UNAVAILABLE,
    uploadedByLabel: userLabel(comment.created_by),
    isReply: comment.parent_comment_id != null,
    parentCode: parent?.code ?? (comment.parent_comment_id != null ? UNAVAILABLE : null),
    isDeleted: Boolean(comment.deleted_at),
  }
}

export function projectAttachmentRow(attachment: EntityAttachmentRecord): AttachmentRow {
  return {
    id: attachment.id,
    code: attachment.code || UNAVAILABLE,
    fileId: attachment.file_id,
    attachmentType: attachment.attachment_type || UNAVAILABLE,
    caption: attachment.caption?.trim() ? attachment.caption : UNAVAILABLE,
    uploadedAtLabel: formatDateTime(attachment.uploaded_at),
    uploadedByLabel: userLabel(attachment.uploaded_by),
  }
}

function activityEventSummary(event: ActivityEventRecord): string {
  const transition =
    event.from_state || event.to_state
      ? ` (${event.from_state ?? UNAVAILABLE} → ${event.to_state ?? UNAVAILABLE})`
      : ''
  return `${event.action}${transition}`
}

export function projectTimelineRow(item: TimelineItem): TimelineRow {
  const occurredAtLabel = formatDateTime(item.occurred_at)
  switch (item.kind) {
    case 'comment':
      return {
        key: `comment-${item.comment?.id}`,
        kind: 'comment',
        occurredAtLabel,
        title: `Bình luận · ${item.comment?.code ?? UNAVAILABLE}`,
        summary: item.comment?.body ?? UNAVAILABLE,
      }
    case 'attachment':
      return {
        key: `attachment-${item.attachment?.id}`,
        kind: 'attachment',
        occurredAtLabel,
        title: `Tệp đính kèm · ${item.attachment?.code ?? UNAVAILABLE}`,
        summary: `${item.attachment?.attachment_type ?? UNAVAILABLE}${
          item.attachment?.caption ? ` — ${item.attachment.caption}` : ''
        }`,
      }
    case 'activity_event':
      return {
        key: `activity-${item.activity_event?.id}`,
        kind: 'activity_event',
        occurredAtLabel,
        title: `Hoạt động · ${item.activity_event?.event_type ?? UNAVAILABLE}`,
        summary: item.activity_event ? activityEventSummary(item.activity_event) : UNAVAILABLE,
      }
    default:
      return { key: 'unknown', kind: 'activity_event', occurredAtLabel, title: UNAVAILABLE, summary: UNAVAILABLE }
  }
}

export function validateCommentBody(body: string): string[] {
  return body.trim() === '' ? ['body'] : []
}

export function validateAttachForm(input: { hasFile: boolean; attachmentType: string }): string[] {
  const errors: string[] = []
  if (!input.hasFile) errors.push('file')
  if (input.attachmentType.trim() === '') errors.push('attachment_type')
  return errors
}

/** Generic Comments & Attachments screen always authorizes uploads under the NB-04
 * `GENERIC_ATTACHMENT` policy (pdf/jpg/jpeg/png/webp up to 25 MB) — business-specific surfaces
 * (mill certificate, PPAP, …) own their own stricter policy on their own screens. */
export function resolveFilePurpose(): string {
  return 'GENERIC_ATTACHMENT'
}
