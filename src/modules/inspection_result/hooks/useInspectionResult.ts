import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  getInspectionResult,
  listInspectionResults,
  listSpcData,
  voidInspectionViaAction,
} from '../api/inspectionResultApi'
import {
  projectInspectionResultRow,
  resolveInspectionListState,
  resolveMutationUiState,
  validateVoidReason,
} from '../lib/inspectionProjection'

const LIST_KEY = ['qms02', 'inspection-results'] as const
const DETAIL_KEY = ['qms02', 'inspection-result'] as const
const SPC_KEY = ['qms02', 'spc-data'] as const

export type InspectionTab = 'results' | 'spc'

export function useInspectionResult() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<InspectionTab>('results')
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [confirmVoid, setConfirmVoid] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [spcCursor, setSpcCursor] = useState<string | undefined>()

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listInspectionResults({ q: appliedQuery || undefined, cursor, limit: 50 }),
    enabled: tab === 'results',
  })

  const detailQuery = useQuery({
    queryKey: [...DETAIL_KEY, selectedCode],
    queryFn: () => getInspectionResult(selectedCode as string),
    enabled: Boolean(selectedCode) && tab === 'results',
  })

  const spcQuery = useQuery({
    queryKey: [...SPC_KEY, { cursor: spcCursor }],
    queryFn: () => listSpcData({ cursor: spcCursor, limit: 50 }),
    enabled: tab === 'spc',
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: DETAIL_KEY })
  }

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectInspectionResultRow),
    [listQuery.data?.items],
  )
  const detailRow = detailQuery.data ? projectInspectionResultRow(detailQuery.data) : null

  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveInspectionListState({
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

  const voidMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.voidAction
      if (!action?.enabled) {
        throw new ApiError('PERMISSION_DENIED', 'Void không được server cho phép.', 403)
      }
      return voidInspectionViaAction(action, { void_reason: voidReason.trim() })
    },
    onSuccess: () => {
      setConfirmVoid(false)
      setVoidReason('')
      return invalidate()
    },
  })

  const voidErrors = validateVoidReason(voidReason)
  const voidError = voidMutation.error instanceof ApiError ? voidMutation.error : null
  const voidState = resolveMutationUiState({
    confirmOpen: confirmVoid,
    status: voidMutation.isPending
      ? 'pending'
      : voidMutation.isSuccess
        ? 'success'
        : voidMutation.isError
          ? 'error'
          : 'idle',
    errorCode: voidError?.code ?? null,
  })

  const spcError = spcQuery.error instanceof ApiError ? spcQuery.error : null
  const spcState = resolveInspectionListState({
    status:
      spcQuery.isLoading || spcQuery.isFetching
        ? 'loading'
        : spcQuery.isError
          ? 'error'
          : 'success',
    itemCount: spcQuery.data?.items.length ?? 0,
    hasQuery: false,
    errorCode: spcError?.code ?? null,
  })

  return {
    tab,
    setTab,
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
    selectResult: (code: string) => {
      setSelectedCode(code)
      setConfirmVoid(false)
      setVoidReason('')
      voidMutation.reset()
    },
    detail: detailQuery.data ?? null,
    detailRow,
    detailLoading: detailQuery.isLoading,
    detailError: detailQuery.error instanceof ApiError ? detailQuery.error : null,

    confirmVoid,
    setConfirmVoid,
    voidReason,
    setVoidReason,
    voidErrors,
    void: () => voidMutation.mutate(),
    voidState,
    voidError,

    spcState,
    spcError,
    spcItems: spcQuery.data?.items ?? [],
    spcHasMore: Boolean(spcQuery.data?.page.has_more),
    loadMoreSpc: () => {
      const next = spcQuery.data?.page.next_cursor
      if (next) setSpcCursor(next)
    },
  }
}
