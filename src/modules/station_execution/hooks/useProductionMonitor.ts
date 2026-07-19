import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  getProductionLog,
  listProductionLogs,
  voidProductionLogViaAction,
} from '../api/productionLogApi'
import {
  projectProductionLogRow,
  resolveMutationUiState,
  resolveProductionListState,
  validateVoidReason,
} from '../lib/productionLogProjection'

const LIST_KEY = ['mes05', 'production-logs'] as const
const DETAIL_KEY = ['mes05', 'production-log'] as const

export function useProductionMonitor() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [confirmVoid, setConfirmVoid] = useState(false)
  const [voidReason, setVoidReason] = useState('')

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listProductionLogs({ q: appliedQuery || undefined, cursor, limit: 50 }),
  })

  const detailQuery = useQuery({
    queryKey: [...DETAIL_KEY, selectedCode],
    queryFn: () => getProductionLog(selectedCode as string),
    enabled: Boolean(selectedCode),
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: DETAIL_KEY })
  }

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectProductionLogRow),
    [listQuery.data?.items],
  )
  const detailRow = detailQuery.data ? projectProductionLogRow(detailQuery.data) : null

  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveProductionListState({
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
      return voidProductionLogViaAction(action, { void_reason: voidReason.trim() })
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
    selectLog: (code: string) => {
      setSelectedCode(code)
      setConfirmVoid(false)
      setVoidReason('')
      voidMutation.reset()
    },
    detailLoading: detailQuery.isLoading || detailQuery.isFetching,
    detail: detailQuery.data ?? null,
    detailRow,
    confirmVoid,
    setConfirmVoid,
    voidReason,
    setVoidReason,
    voidErrors,
    void: () => voidMutation.mutate(),
    voidState,
    voidError,
  }
}
