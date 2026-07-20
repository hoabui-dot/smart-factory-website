import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  approveGoodsIssueViaAction,
  cancelMaterialRequestViaAction,
  getGoodsIssue,
  getMaterialRequest,
  listGoodsIssues,
  listMaterialRequests,
  rejectGoodsIssueViaAction,
} from '../api/goodsIssueApi'
import {
  projectGoodsIssueRow,
  projectMaterialRequestRow,
  resolveListState,
  resolveMutationUiState,
  validateReason,
} from '../lib/goodsIssueProjection'

const MR_LIST_KEY = ['wms04', 'material-requests'] as const
const MR_DETAIL_KEY = ['wms04', 'material-request'] as const
const GI_LIST_KEY = ['wms04', 'goods-issues'] as const
const GI_DETAIL_KEY = ['wms04', 'goods-issue'] as const

export type GoodsIssueTab = 'material-requests' | 'goods-issues'

export function useGoodsIssue() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<GoodsIssueTab>('material-requests')
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [mrCursor, setMrCursor] = useState<string | undefined>()
  const [giCursor, setGiCursor] = useState<string | undefined>()
  const [selectedMrCode, setSelectedMrCode] = useState<string | null>(null)
  const [selectedGiCode, setSelectedGiCode] = useState<string | null>(null)

  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const mrListQuery = useQuery({
    queryKey: [...MR_LIST_KEY, { q: appliedQuery, cursor: mrCursor }],
    queryFn: () => listMaterialRequests({ q: appliedQuery || undefined, cursor: mrCursor, limit: 50 }),
    enabled: tab === 'material-requests',
  })

  const mrDetailQuery = useQuery({
    queryKey: [...MR_DETAIL_KEY, selectedMrCode],
    queryFn: () => getMaterialRequest(selectedMrCode as string),
    enabled: Boolean(selectedMrCode) && tab === 'material-requests',
  })

  const giListQuery = useQuery({
    queryKey: [...GI_LIST_KEY, { q: appliedQuery, cursor: giCursor }],
    queryFn: () => listGoodsIssues({ q: appliedQuery || undefined, cursor: giCursor, limit: 50 }),
    enabled: tab === 'goods-issues',
  })

  const giDetailQuery = useQuery({
    queryKey: [...GI_DETAIL_KEY, selectedGiCode],
    queryFn: () => getGoodsIssue(selectedGiCode as string),
    enabled: Boolean(selectedGiCode) && tab === 'goods-issues',
  })

  const invalidateMr = async () => {
    await queryClient.invalidateQueries({ queryKey: MR_LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: MR_DETAIL_KEY })
  }

  const invalidateGi = async () => {
    await queryClient.invalidateQueries({ queryKey: GI_LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: GI_DETAIL_KEY })
  }

  const mrRows = useMemo(
    () => (mrListQuery.data?.items ?? []).map(projectMaterialRequestRow),
    [mrListQuery.data?.items],
  )
  const mrDetailRow = mrDetailQuery.data
    ? projectMaterialRequestRow(mrDetailQuery.data)
    : null

  const giRows = useMemo(
    () => (giListQuery.data?.items ?? []).map(projectGoodsIssueRow),
    [giListQuery.data?.items],
  )
  const giDetailRow = giDetailQuery.data ? projectGoodsIssueRow(giDetailQuery.data) : null

  const mrListError = mrListQuery.error instanceof ApiError ? mrListQuery.error : null
  const mrListState = resolveListState({
    status:
      mrListQuery.isLoading || mrListQuery.isFetching
        ? 'loading'
        : mrListQuery.isError
          ? 'error'
          : 'success',
    itemCount: mrRows.length,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: mrListError?.code ?? null,
  })

  const giListError = giListQuery.error instanceof ApiError ? giListQuery.error : null
  const giListState = resolveListState({
    status:
      giListQuery.isLoading || giListQuery.isFetching
        ? 'loading'
        : giListQuery.isError
          ? 'error'
          : 'success',
    itemCount: giRows.length,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: giListError?.code ?? null,
  })

  const cancelMutation = useMutation({
    mutationFn: () => {
      const action = mrDetailRow?.cancelAction
      if (!action?.enabled) {
        throw new ApiError('PERMISSION_DENIED', 'Cancel không được server cho phép.', 403)
      }
      return cancelMaterialRequestViaAction(action, { reason: cancelReason.trim() })
    },
    onSuccess: () => {
      setConfirmCancel(false)
      setCancelReason('')
      return invalidateMr()
    },
  })

  const approveMutation = useMutation({
    mutationFn: () => {
      const action = giDetailRow?.approveAction
      if (!action?.enabled) {
        throw new ApiError('PERMISSION_DENIED', 'Approve không được server cho phép.', 403)
      }
      return approveGoodsIssueViaAction(action)
    },
    onSuccess: () => {
      setConfirmApprove(false)
      return invalidateGi()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => {
      const action = giDetailRow?.rejectAction
      if (!action?.enabled) {
        throw new ApiError('PERMISSION_DENIED', 'Reject không được server cho phép.', 403)
      }
      return rejectGoodsIssueViaAction(action, { reason: rejectReason.trim() })
    },
    onSuccess: () => {
      setConfirmReject(false)
      setRejectReason('')
      return invalidateGi()
    },
  })

  const cancelErrors = validateReason(cancelReason)
  const rejectErrors = validateReason(rejectReason)
  const cancelError = cancelMutation.error instanceof ApiError ? cancelMutation.error : null
  const approveError = approveMutation.error instanceof ApiError ? approveMutation.error : null
  const rejectError = rejectMutation.error instanceof ApiError ? rejectMutation.error : null

  const cancelState = resolveMutationUiState({
    confirmOpen: confirmCancel,
    status: cancelMutation.isPending
      ? 'pending'
      : cancelMutation.isSuccess
        ? 'success'
        : cancelMutation.isError
          ? 'error'
          : 'idle',
    errorCode: cancelError?.code ?? null,
  })

  const approveState = resolveMutationUiState({
    confirmOpen: confirmApprove,
    status: approveMutation.isPending
      ? 'pending'
      : approveMutation.isSuccess
        ? 'success'
        : approveMutation.isError
          ? 'error'
          : 'idle',
    errorCode: approveError?.code ?? null,
  })

  const rejectState = resolveMutationUiState({
    confirmOpen: confirmReject,
    status: rejectMutation.isPending
      ? 'pending'
      : rejectMutation.isSuccess
        ? 'success'
        : rejectMutation.isError
          ? 'error'
          : 'idle',
    errorCode: rejectError?.code ?? null,
  })

  return {
    tab,
    setTab: (next: GoodsIssueTab) => {
      setTab(next)
      setSearchInput('')
      setAppliedQuery('')
      setMrCursor(undefined)
      setGiCursor(undefined)
    },
    searchInput,
    setSearchInput,
    applySearch: () => {
      if (tab === 'material-requests') setMrCursor(undefined)
      else setGiCursor(undefined)
      setAppliedQuery(searchInput.trim())
    },

    mrListState,
    mrListError,
    mrRows,
    mrHasMore: Boolean(mrListQuery.data?.page.has_more),
    loadMoreMr: () => {
      const next = mrListQuery.data?.page.next_cursor
      if (next) setMrCursor(next)
    },
    selectedMrCode,
    selectMr: (code: string | null) => {
      setSelectedMrCode(code)
      setConfirmCancel(false)
      setCancelReason('')
      cancelMutation.reset()
    },
    mrDetail: mrDetailQuery.data ?? null,
    mrDetailRow,
    mrDetailLoading: mrDetailQuery.isLoading,

    confirmCancel,
    setConfirmCancel,
    cancelReason,
    setCancelReason,
    cancelErrors,
    cancel: () => cancelMutation.mutate(),
    cancelState,
    cancelError,

    giListState,
    giListError,
    giRows,
    giHasMore: Boolean(giListQuery.data?.page.has_more),
    loadMoreGi: () => {
      const next = giListQuery.data?.page.next_cursor
      if (next) setGiCursor(next)
    },
    selectedGiCode,
    selectGi: (code: string | null) => {
      setSelectedGiCode(code)
      setConfirmApprove(false)
      setConfirmReject(false)
      setRejectReason('')
      approveMutation.reset()
      rejectMutation.reset()
    },
    giDetail: giDetailQuery.data ?? null,
    giDetailRow,
    giDetailLoading: giDetailQuery.isLoading,

    confirmApprove,
    setConfirmApprove,
    approve: () => approveMutation.mutate(),
    approveState,
    approveError,

    confirmReject,
    setConfirmReject,
    rejectReason,
    setRejectReason,
    rejectErrors,
    reject: () => rejectMutation.mutate(),
    rejectState,
    rejectError,
  }
}
