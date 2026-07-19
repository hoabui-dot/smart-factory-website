import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import { listDeliveryLogs, retryDelivery } from '../api/notificationDeliveryApi'
import { projectDeliveryLogRow, resolveDeliveryListState } from '../lib/deliveryProjection'

const LOGS_KEY = ['nb09', 'delivery-logs'] as const

export function useNotificationDeliveryAdmin() {
  const queryClient = useQueryClient()
  const [draftQ, setDraftQ] = useState('')
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const logsQuery = useQuery({
    queryKey: [...LOGS_KEY, q, cursor],
    queryFn: () =>
      listDeliveryLogs({ q: q || undefined, cursor, limit: 50, sort: 'attempted_at_desc' }),
  })

  const rows = useMemo(
    () => (logsQuery.data?.items ?? []).map(projectDeliveryLogRow),
    [logsQuery.data?.items],
  )
  const selected = rows.find((row) => row.id === selectedId) ?? null
  const listError = logsQuery.error instanceof ApiError ? logsQuery.error : null
  const listState = resolveDeliveryListState({
    status:
      logsQuery.isLoading || logsQuery.isFetching
        ? 'loading'
        : logsQuery.isError
          ? 'error'
          : 'success',
    itemCount: rows.length,
    hasFilters: Boolean(q),
    errorCode: listError?.code ?? null,
  })

  const retryMutation = useMutation({
    mutationFn: () => retryDelivery(selectedId as number),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: LOGS_KEY }),
  })

  return {
    draftQ,
    setDraftQ,
    applyFilters: () => {
      setCursor(undefined)
      setQ(draftQ.trim())
    },
    clearFilters: () => {
      setCursor(undefined)
      setDraftQ('')
      setQ('')
    },
    refresh: () => void queryClient.invalidateQueries({ queryKey: LOGS_KEY }),
    listState,
    listError,
    rows,
    hasMore: Boolean(logsQuery.data?.page.has_more),
    loadMore: () => {
      const next = logsQuery.data?.page.next_cursor
      if (next) setCursor(next)
    },
    selectedId,
    setSelectedId,
    selected,
    retry: () => retryMutation.mutate(),
    retryPending: retryMutation.isPending,
    retryError: retryMutation.error instanceof ApiError ? retryMutation.error : null,
    retrySuccess: retryMutation.isSuccess,
  }
}
