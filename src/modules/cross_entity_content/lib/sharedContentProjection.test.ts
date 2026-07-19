import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatDateTime,
  projectAttachmentRow,
  projectCommentRow,
  projectTimelineRow,
  resolveFilePurpose,
  resolveSectionState,
  userLabel,
  validateAttachForm,
  validateCommentBody,
} from './sharedContentProjection.ts'
import type {
  ActivityEventRecord,
  CommentRecord,
  EntityAttachmentRecord,
  TimelineItem,
} from '../types/sharedContent.ts'

const rootComment: CommentRecord = {
  id: 1,
  code: 'CMT-0001',
  entity_type: 'lot',
  entity_id: 42,
  parent_comment_id: null,
  body: 'Lot arrived with minor packaging damage.',
  created_by: 7,
  created_at: '2026-07-18T02:00:00Z',
}

const replyComment: CommentRecord = {
  id: 2,
  code: 'CMT-0002',
  entity_type: 'lot',
  entity_id: 42,
  parent_comment_id: 1,
  body: 'Confirmed with supplier, replacement lot inbound.',
  created_by: 8,
  created_at: '2026-07-18T03:00:00Z',
  updated_at: '2026-07-18T03:05:00Z',
}

const attachment: EntityAttachmentRecord = {
  id: 10,
  code: 'ATT-0010',
  file_id: 900,
  parent_type: 'lot',
  parent_id: 42,
  attachment_type: 'DEFECT_PHOTO',
  caption: 'Ảnh bao bì bị rách',
  uploaded_by: 7,
  uploaded_at: '2026-07-18T02:10:00Z',
}

const activityEvent: ActivityEventRecord = {
  id: 55,
  code: 'EVT-0055',
  event_type: 'lot.updated',
  entity_type: 'lot',
  entity_id: 42,
  action: 'UPDATE',
  from_state: 'PENDING',
  to_state: 'PASSED',
  occurred_at: '2026-07-18T01:00:00Z',
}

describe('resolveSectionState', () => {
  it('maps loading, empty, no-result and ready', () => {
    assert.equal(
      resolveSectionState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveSectionState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveSectionState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveSectionState({ status: 'success', itemCount: 2, hasQuery: false, errorCode: null }),
      'ready',
    )
  })

  it('maps canonical error codes to deterministic UI states without inventing new codes', () => {
    assert.equal(
      resolveSectionState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(
      resolveSectionState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'POLYMORPHIC_TARGET_NOT_FOUND',
      }),
      'not-found',
    )
    assert.equal(
      resolveSectionState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'INVALID_POLYMORPHIC_TYPE',
      }),
      'unsupported',
    )
    assert.equal(
      resolveSectionState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'DEPENDENCY_UNAVAILABLE',
      }),
      'dependency-unavailable',
    )
    assert.equal(
      resolveSectionState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }),
      'error',
    )
  })
})

describe('formatDateTime / userLabel', () => {
  it('formats ISO timestamps and falls back for missing values', () => {
    assert.notEqual(formatDateTime('2026-07-18T02:00:00Z'), '-')
    assert.equal(formatDateTime(null), '-')
    assert.equal(formatDateTime(undefined), '-')
  })

  it('never renders a raw user id as a business code', () => {
    assert.equal(userLabel(7), 'User #7')
    assert.equal(userLabel(null), '-')
  })
})

describe('projectCommentRow', () => {
  it('projects a root comment with no parent', () => {
    const byId = new Map([[rootComment.id, rootComment]])
    const row = projectCommentRow(rootComment, byId)
    assert.equal(row.code, 'CMT-0001')
    assert.equal(row.isReply, false)
    assert.equal(row.parentCode, null)
    assert.equal(row.isDeleted, false)
  })

  it('resolves the parent code for a reply from the loaded page', () => {
    const byId = new Map([
      [rootComment.id, rootComment],
      [replyComment.id, replyComment],
    ])
    const row = projectCommentRow(replyComment, byId)
    assert.equal(row.isReply, true)
    assert.equal(row.parentCode, 'CMT-0001')
    assert.equal(row.updatedAtLabel !== '-', true)
  })

  it('falls back to a placeholder parent code when the parent is outside the loaded page', () => {
    const byId = new Map([[replyComment.id, replyComment]])
    const row = projectCommentRow(replyComment, byId)
    assert.equal(row.isReply, true)
    assert.equal(row.parentCode, '-')
  })
})

describe('projectAttachmentRow', () => {
  it('projects file_id/attachment_type/caption without rendering raw uploader id', () => {
    const row = projectAttachmentRow(attachment)
    assert.equal(row.fileId, 900)
    assert.equal(row.attachmentType, 'DEFECT_PHOTO')
    assert.equal(row.caption, 'Ảnh bao bì bị rách')
    assert.equal(row.uploadedByLabel, 'User #7')
  })

  it('falls back to placeholder when caption is blank', () => {
    const row = projectAttachmentRow({ ...attachment, caption: null })
    assert.equal(row.caption, '-')
  })
})

describe('projectTimelineRow', () => {
  it('projects comment, attachment and activity_event kinds', () => {
    const commentItem: TimelineItem = {
      kind: 'comment',
      occurred_at: rootComment.created_at,
      comment: rootComment,
    }
    const attachmentItem: TimelineItem = {
      kind: 'attachment',
      occurred_at: attachment.uploaded_at,
      attachment,
    }
    const activityItem: TimelineItem = {
      kind: 'activity_event',
      occurred_at: activityEvent.occurred_at,
      activity_event: activityEvent,
    }

    const commentRow = projectTimelineRow(commentItem)
    assert.equal(commentRow.kind, 'comment')
    assert.equal(commentRow.summary, rootComment.body)

    const attachmentRow = projectTimelineRow(attachmentItem)
    assert.equal(attachmentRow.kind, 'attachment')
    assert.match(attachmentRow.summary, /DEFECT_PHOTO/)

    const activityRow = projectTimelineRow(activityItem)
    assert.equal(activityRow.kind, 'activity_event')
    assert.match(activityRow.summary, /PENDING/)
    assert.match(activityRow.summary, /PASSED/)
  })
})

describe('validateCommentBody / validateAttachForm', () => {
  it('requires non-empty comment body', () => {
    assert.deepEqual(validateCommentBody(''), ['body'])
    assert.deepEqual(validateCommentBody('   '), ['body'])
    assert.deepEqual(validateCommentBody('ok'), [])
  })

  it('requires a selected file and attachment_type', () => {
    assert.deepEqual(validateAttachForm({ hasFile: false, attachmentType: '' }), [
      'file',
      'attachment_type',
    ])
    assert.deepEqual(validateAttachForm({ hasFile: true, attachmentType: 'DEFECT_PHOTO' }), [])
  })
})

describe('resolveFilePurpose', () => {
  it('always resolves to the generic attachment policy for this cross-entity screen', () => {
    assert.equal(resolveFilePurpose(), 'GENERIC_ATTACHMENT')
  })
})
