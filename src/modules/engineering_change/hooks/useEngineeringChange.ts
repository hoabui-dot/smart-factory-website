import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createChangeRequest,
  getChangeRequest,
  lifecycleViaAction,
  listApprovals,
  listChangeRequests,
  updateChangeRequestViaAction,
} from '../api/changeRequestApi'
import { projectChangeRequestRow, resolveListState } from '../lib/changeRequestProjection'
import type {
  ChangeRequestCreateRequest,
  ChangeRequestUpdateRequest,
  ImplementLinkInput,
} from '../types/changeRequest'

const LIST_KEY = ['mes11', 'change-requests'] as const
const DETAIL_KEY = ['mes11', 'change-request'] as const
const APPROVAL_KEY = ['mes11', 'approvals'] as const

export function useEngineeringChange() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [createForm, setCreateForm] = useState<ChangeRequestCreateRequest>({
    change_type: 'BOM_REV',
    reason: '',
    impact_customer: false,
    impact_assessment: '',
  })
  const [editForm, setEditForm] = useState<ChangeRequestUpdateRequest>({})
  const [implementLinks, setImplementLinks] = useState<ImplementLinkInput[]>([
    { target_entity_type: 'BOM_HEADER', target_entity_id: 0, action: 'SUPERSEDE' },
  ])

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listChangeRequests({ q: appliedQuery || undefined, cursor, limit: 50 }),
  })
  const detailQuery = useQuery({
    queryKey: [...DETAIL_KEY, selectedCode],
    queryFn: () => getChangeRequest(selectedCode as string),
    enabled: Boolean(selectedCode),
  })
  const approvalsQuery = useQuery({
    queryKey: [...APPROVAL_KEY, selectedCode],
    queryFn: () => listApprovals(selectedCode as string),
    enabled: Boolean(selectedCode),
  })

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectChangeRequestRow),
    [listQuery.data?.items],
  )
  const detailRow = detailQuery.data ? projectChangeRequestRow(detailQuery.data) : null
  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveListState({
    status:
      listQuery.isLoading || listQuery.isFetching
        ? 'loading'
        : listQuery.isError
          ? 'error'
          : 'success',
    itemCount: rows.length,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listError?.code ?? null,
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: DETAIL_KEY })
    await queryClient.invalidateQueries({ queryKey: APPROVAL_KEY })
  }

  const createMutation = useMutation({
    mutationFn: () => createChangeRequest(createForm),
    onSuccess: async (row) => {
      setSelectedCode(row.code)
      await invalidate()
    },
  })
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!detailRow?.updateAction?.enabled) {
        throw new ApiError('PERMISSION_DENIED', 'Update không được phép.', 403)
      }
      return updateChangeRequestViaAction(detailRow.updateAction, editForm)
    },
    onSuccess: invalidate,
  })
  const lifecycleMutation = useMutation({
    mutationFn: async (kind: string) => {
      const action =
        kind === 'submit'
          ? detailRow?.submitAction
          : kind === 'start_review'
            ? detailRow?.startReviewAction
            : kind === 'approve'
              ? detailRow?.approveAction
              : kind === 'reject'
                ? detailRow?.rejectAction
                : kind === 'implement'
                  ? detailRow?.implementAction
                  : detailRow?.closeAction
      if (!action || action.enabled !== true) {
        throw new ApiError('PERMISSION_DENIED', `${kind} không được phép.`, 403)
      }
      if (kind === 'reject') {
        return lifecycleViaAction(action, { reason: rejectReason.trim() })
      }
      if (kind === 'implement') {
        return lifecycleViaAction(action, { implementation_links: implementLinks })
      }
      return lifecycleViaAction(action, kind === 'approve' ? {} : undefined)
    },
    onSuccess: async () => {
      setRejectReason('')
      await invalidate()
    },
  })

  return {
    searchInput,
    setSearchInput,
    applySearch: () => {
      setCursor(undefined)
      setAppliedQuery(searchInput.trim())
    },
    listState,
    listError,
    rows,
    hasMore: Boolean(listQuery.data?.page.has_more),
    loadMore: () => {
      const next = listQuery.data?.page.next_cursor
      if (next) setCursor(next)
    },
    selectedCode,
    select: (code: string) => {
      setSelectedCode(code)
      setEditForm({})
      lifecycleMutation.reset()
      updateMutation.reset()
    },
    detailLoading: detailQuery.isLoading || detailQuery.isFetching,
    detail: detailQuery.data ?? null,
    detailRow,
    approvals: approvalsQuery.data ?? [],
    createForm,
    setCreateForm,
    create: () => createMutation.mutate(),
    createPending: createMutation.isPending,
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,
    editForm,
    setEditForm,
    saveUpdate: () => updateMutation.mutate(),
    updatePending: updateMutation.isPending,
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,
    rejectReason,
    setRejectReason,
    implementLinks,
    setImplementLinks,
    runLifecycle: (kind: string) => lifecycleMutation.mutate(kind),
    lifecyclePending: lifecycleMutation.isPending,
    lifecycleError: lifecycleMutation.error instanceof ApiError ? lifecycleMutation.error : null,
  }
}
