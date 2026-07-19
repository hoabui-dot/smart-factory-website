import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationApi'
import {
  projectNotificationRow,
  resolveMarkReadUiState,
  resolveNotificationListState,
} from '../lib/notificationProjection'

const LIST_KEY = ['nb08', 'notifications'] as const
const UNREAD_KEY = ['nb08', 'unread'] as const

export function useNotificationCenter() {
  const queryClient = useQueryClient()
  const [draftQ, setDraftQ] = useState('')
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, q, cursor],
    queryFn: () =>
      listNotifications({
        q: q || undefined,
        cursor,
        limit: 50,
        sort: 'created_at_desc',
      }),
  })

  const unreadQuery = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: getUnreadCount,
  })

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectNotificationRow),
    [listQuery.data?.items],
  )
  const selected = useMemo(
    () => listQuery.data?.items.find((item) => item.code === selectedCode) ?? null,
    [listQuery.data?.items, selectedCode],
  )
  const detailRow = selected ? projectNotificationRow(selected) : null

  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveNotificationListState({
    status:
      listQuery.isLoading || listQuery.isFetching
        ? 'loading'
        : listQuery.isError
          ? 'error'
          : 'success',
    itemCount: rows.length,
    hasFilters: Boolean(q),
    errorCode: listError?.code ?? null,
  })

  const markOneMutation = useMutation({
    mutationFn: () => markNotificationRead(selectedCode as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_KEY })
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_KEY })
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })

  const markError =
    markOneMutation.error instanceof ApiError
      ? markOneMutation.error
      : markAllMutation.error instanceof ApiError
        ? markAllMutation.error
        : null
  const markState = resolveMarkReadUiState({
    status:
      markOneMutation.isPending || markAllMutation.isPending
        ? 'pending'
        : markOneMutation.isSuccess || markAllMutation.isSuccess
          ? 'success'
          : markOneMutation.isError || markAllMutation.isError
            ? 'error'
            : 'idle',
    errorCode: markError?.code ?? null,
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
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_KEY })
      void queryClient.invalidateQueries({ queryKey: UNREAD_KEY })
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
    setSelectedCode,
    detailRow,
    unreadCount: unreadQuery.data?.unread_count ?? 0,
    markRead: () => markOneMutation.mutate(),
    markAllRead: () => markAllMutation.mutate(),
    markState,
    markError,
  }
}
