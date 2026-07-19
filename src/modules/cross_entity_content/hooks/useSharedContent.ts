import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  attachFile,
  authorizeUpload,
  computeSha256Hex,
  createComment,
  detachAttachment,
  finalizeUpload,
  getEntityTimeline,
  listComments,
  listEntityAttachments,
  uploadFileToSignedTarget,
} from '../api/sharedContentApi'
import {
  projectAttachmentRow,
  projectCommentRow,
  projectTimelineRow,
  resolveFilePurpose,
  resolveSectionState,
  validateAttachForm,
  validateCommentBody,
} from '../lib/sharedContentProjection'
import type { AttachFileRequest, CommentRecord, ReplyTarget } from '../types/sharedContent'

export type SharedContentTab = 'comments' | 'attachments' | 'timeline'

const OWNER_MODULE = 'SHARED-02'

function queryKeys(entityType: string, entityId: number) {
  return {
    comments: ['shared02', 'comments', entityType, entityId] as const,
    attachments: ['shared02', 'attachments', entityType, entityId] as const,
    timeline: ['shared02', 'timeline', entityType, entityId] as const,
  }
}

export function useSharedContent(entityType: string, entityId: number) {
  const queryClient = useQueryClient()
  const keys = queryKeys(entityType, entityId)
  const enabled = Boolean(entityType) && Number.isInteger(entityId) && entityId > 0

  const [tab, setTab] = useState<SharedContentTab>('comments')
  const [commentBody, setCommentBody] = useState('')
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null)
  const [attachFileSelection, setAttachFileSelection] = useState<File | null>(null)
  const [attachmentType, setAttachmentType] = useState('COMMENT_ATTACHMENT')
  const [caption, setCaption] = useState('')
  const [confirmDetachId, setConfirmDetachId] = useState<number | null>(null)
  const [uploadStage, setUploadStage] = useState<
    'idle' | 'checksum' | 'authorize' | 'upload' | 'finalize' | 'attach'
  >('idle')

  const commentsQuery = useQuery({
    queryKey: keys.comments,
    queryFn: () => listComments(entityType, entityId, { limit: 50 }),
    enabled,
  })

  const attachmentsQuery = useQuery({
    queryKey: keys.attachments,
    queryFn: () => listEntityAttachments(entityType, entityId, { limit: 50 }),
    enabled,
  })

  const timelineQuery = useQuery({
    queryKey: keys.timeline,
    queryFn: () => getEntityTimeline(entityType, entityId, { limit: 50 }),
    enabled,
  })

  const commentsById = useMemo(() => {
    const map = new Map<number, CommentRecord>()
    for (const c of commentsQuery.data?.items ?? []) map.set(c.id, c)
    return map
  }, [commentsQuery.data?.items])

  const commentRows = useMemo(
    () => (commentsQuery.data?.items ?? []).map((c) => projectCommentRow(c, commentsById)),
    [commentsQuery.data?.items, commentsById],
  )
  const attachmentRows = useMemo(
    () => (attachmentsQuery.data?.items ?? []).map(projectAttachmentRow),
    [attachmentsQuery.data?.items],
  )
  const timelineRows = useMemo(
    () => (timelineQuery.data?.items ?? []).map(projectTimelineRow),
    [timelineQuery.data?.items],
  )

  const commentsError = commentsQuery.error instanceof ApiError ? commentsQuery.error : null
  const attachmentsError =
    attachmentsQuery.error instanceof ApiError ? attachmentsQuery.error : null
  const timelineError = timelineQuery.error instanceof ApiError ? timelineQuery.error : null

  const commentsState = resolveSectionState({
    status: commentsQuery.isLoading ? 'loading' : commentsQuery.isError ? 'error' : 'success',
    itemCount: commentRows.length,
    hasQuery: false,
    errorCode: commentsError?.code ?? null,
  })
  const attachmentsState = resolveSectionState({
    status: attachmentsQuery.isLoading ? 'loading' : attachmentsQuery.isError ? 'error' : 'success',
    itemCount: attachmentRows.length,
    hasQuery: false,
    errorCode: attachmentsError?.code ?? null,
  })
  const timelineState = resolveSectionState({
    status: timelineQuery.isLoading ? 'loading' : timelineQuery.isError ? 'error' : 'success',
    itemCount: timelineRows.length,
    hasQuery: false,
    errorCode: timelineError?.code ?? null,
  })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.comments }),
      queryClient.invalidateQueries({ queryKey: keys.attachments }),
      queryClient.invalidateQueries({ queryKey: keys.timeline }),
    ])
  }

  const createCommentMutation = useMutation({
    mutationFn: () =>
      createComment(entityType, entityId, {
        body: commentBody.trim(),
        parent_comment_id: replyTarget?.id ?? null,
      }),
    onSuccess: async () => {
      setCommentBody('')
      setReplyTarget(null)
      await invalidateAll()
    },
  })

  const attachMutation = useMutation({
    mutationFn: async () => {
      const file = attachFileSelection
      if (!file) throw new ApiError('VALIDATION_ERROR', 'Chưa chọn file.', 400)

      setUploadStage('checksum')
      const checksum = await computeSha256Hex(file)

      setUploadStage('authorize')
      const authorized = await authorizeUpload({
        file_purpose: resolveFilePurpose(),
        owner_module: OWNER_MODULE,
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        checksum_sha256: checksum,
      })

      setUploadStage('upload')
      const etag = await uploadFileToSignedTarget(authorized, file)

      setUploadStage('finalize')
      await finalizeUpload(authorized.upload_id, {
        storage_etag: etag ?? checksum,
        checksum,
      })

      setUploadStage('attach')
      const body: AttachFileRequest = {
        file_id: authorized.upload_id,
        attachment_type: attachmentType.trim(),
        caption: caption.trim() || undefined,
      }
      return attachFile(entityType, entityId, body)
    },
    onSuccess: async () => {
      setUploadStage('idle')
      setAttachFileSelection(null)
      setCaption('')
      await invalidateAll()
    },
    onError: () => {
      setUploadStage('idle')
    },
  })

  const detachMutation = useMutation({
    mutationFn: (attachmentId: number) => detachAttachment(entityType, entityId, attachmentId),
    onSuccess: async () => {
      setConfirmDetachId(null)
      await invalidateAll()
    },
  })

  const commentBodyErrors = validateCommentBody(commentBody)
  const attachFormErrors = validateAttachForm({
    hasFile: Boolean(attachFileSelection),
    attachmentType,
  })

  return {
    entityType,
    entityId,
    enabled,

    tab,
    setTab,

    commentsState,
    commentRows,
    commentsError,
    refreshComments: () => queryClient.invalidateQueries({ queryKey: keys.comments }),

    commentBody,
    setCommentBody,
    commentBodyErrors,
    replyTarget,
    setReplyTarget,
    submitComment: () => createCommentMutation.mutate(),
    commentPending: createCommentMutation.isPending,
    commentError:
      createCommentMutation.error instanceof ApiError ? createCommentMutation.error : null,

    attachmentsState,
    attachmentRows,
    attachmentsError,
    refreshAttachments: () => queryClient.invalidateQueries({ queryKey: keys.attachments }),

    attachFileSelection,
    setAttachFileSelection,
    attachmentType,
    setAttachmentType,
    caption,
    setCaption,
    attachFormErrors,
    submitAttach: () => attachMutation.mutate(),
    attachPending: attachMutation.isPending,
    attachError: attachMutation.error instanceof ApiError ? attachMutation.error : null,
    attachSuccess: attachMutation.isSuccess,
    uploadStage,

    confirmDetachId,
    requestDetach: (id: number) => setConfirmDetachId(id),
    cancelDetach: () => setConfirmDetachId(null),
    confirmDetach: () => {
      if (confirmDetachId != null) detachMutation.mutate(confirmDetachId)
    },
    detachPending: detachMutation.isPending,
    detachError: detachMutation.error instanceof ApiError ? detachMutation.error : null,

    timelineState,
    timelineRows,
    timelineError,
    refreshTimeline: () => queryClient.invalidateQueries({ queryKey: keys.timeline }),

    refreshAll: () => invalidateAll(),
  }
}
