import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  getAuditEvent,
  listAuditEvents,
  mapExportFailure,
  requestAuditExport,
} from '../api/auditEventsApi'
import {
  projectAuditEventRow,
  resolveAuditListState,
  resolveExportUiState,
} from '../lib/auditProjection'

const LIST_KEY = ['nb03', 'audit-events'] as const

export function useAuditViewer(initialQuery = '') {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [appliedQuery, setAppliedQuery] = useState(initialQuery)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, { q: appliedQuery, cursor }],
    queryFn: () =>
      listAuditEvents({
        q: appliedQuery || undefined,
        cursor,
        limit: 50,
      }),
  })

  const detailQuery = useQuery({
    queryKey: [...LIST_KEY, 'detail', selectedId],
    queryFn: () => getAuditEvent(selectedId as number),
    enabled: selectedId != null && selectedId > 0,
  })

  const exportMutation = useMutation({
    mutationFn: () => requestAuditExport(),
    onError: () => {
      /* surfaced via resolveExportUiState */
    },
  })

  const listState = resolveAuditListState({
    status: listQuery.isLoading || listQuery.isFetching ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: listQuery.data?.items.length ?? 0,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listQuery.error instanceof ApiError ? listQuery.error.code : null,
  })

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectAuditEventRow),
    [listQuery.data?.items],
  )

  const detailRow = useMemo(
    () => (detailQuery.data ? projectAuditEventRow(detailQuery.data) : null),
    [detailQuery.data],
  )

  const exportError = exportMutation.error ? mapExportFailure(exportMutation.error) : null
  const exportState = resolveExportUiState({
    status: exportMutation.isPending
      ? 'pending'
      : exportMutation.isSuccess
        ? 'success'
        : exportMutation.isError
          ? 'error'
          : 'idle',
    jobCode:
      exportMutation.data?.job?.code ?? exportMutation.data?.job_code ?? null,
    errorCode: exportError?.code ?? null,
  })

  const applySearch = useCallback(() => {
    setCursor(undefined)
    setAppliedQuery(searchInput.trim())
  }, [searchInput])

  const loadMore = useCallback(() => {
    const next = listQuery.data?.page.next_cursor
    if (next) {
      setCursor(next)
    }
  }, [listQuery.data?.page.next_cursor])

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: LIST_KEY })
  }, [queryClient])

  return {
    searchInput,
    setSearchInput,
    applySearch,
    appliedQuery,
    listState,
    rows,
    page: listQuery.data?.page,
    listError: listQuery.error instanceof ApiError ? listQuery.error : null,
    selectedId,
    setSelectedId,
    detailRow,
    detailEvent: detailQuery.data ?? null,
    detailLoading: detailQuery.isLoading,
    detailError: detailQuery.error instanceof ApiError ? detailQuery.error : null,
    exportState,
    exportError,
    exportResult: exportMutation.data ?? null,
    requestExport: () => exportMutation.mutate(),
    loadMore,
    refresh,
    isRefreshing: listQuery.isFetching && !listQuery.isLoading,
  }
}
