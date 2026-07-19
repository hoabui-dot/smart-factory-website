import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createSubscription,
  listEvents,
  listSubscriptions,
  replayEvent,
  revokeSubscription,
} from '../api/realtimeEventsApi'
import {
  projectEventRow,
  resolveEventListState,
  resolveReplayUiState,
} from '../lib/eventProjection'
import type { EventListQuery, SubscriptionCreateRequest } from '../types/realtimeEvent'

const EVENTS_KEY = ['nb06', 'events'] as const
const SUBSCRIPTIONS_KEY = ['nb06', 'subscriptions'] as const

const EMPTY_FILTERS: EventListQuery = {
  event_type: '',
  source_module: '',
  entity_type: '',
  status: '',
  request_id: '',
}

export function useEventMonitor() {
  const queryClient = useQueryClient()
  const [draftFilters, setDraftFilters] = useState<EventListQuery>(EMPTY_FILTERS)
  const [filters, setFilters] = useState<EventListQuery>(EMPTY_FILTERS)
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [confirmReplay, setConfirmReplay] = useState(false)
  const [replayReason, setReplayReason] = useState('')
  const [selectedSubscriptionCode, setSelectedSubscriptionCode] = useState<string | null>(null)

  const eventsQuery = useQuery({
    queryKey: [...EVENTS_KEY, filters, cursor],
    queryFn: () =>
      listEvents({
        ...filters,
        cursor,
        limit: 50,
        sort: 'occurred_at_desc',
      }),
  })

  const subscriptionsQuery = useQuery({
    queryKey: SUBSCRIPTIONS_KEY,
    queryFn: listSubscriptions,
  })

  const selectedEvent = useMemo(
    () => eventsQuery.data?.items.find((event) => event.id === selectedId) ?? null,
    [eventsQuery.data?.items, selectedId],
  )

  const rows = useMemo(
    () => (eventsQuery.data?.items ?? []).map(projectEventRow),
    [eventsQuery.data?.items],
  )
  const detailRow = selectedEvent ? projectEventRow(selectedEvent) : null
  const hasFilters = Object.values(filters).some((value) => Boolean(value))
  const listError = eventsQuery.error instanceof ApiError ? eventsQuery.error : null
  const listState = resolveEventListState({
    status:
      eventsQuery.isLoading || eventsQuery.isFetching
        ? 'loading'
        : eventsQuery.isError
          ? 'error'
          : 'success',
    itemCount: rows.length,
    hasFilters,
    errorCode: listError?.code ?? null,
  })

  const replayMutation = useMutation({
    mutationFn: () => replayEvent(selectedId as number, replayReason.trim()),
    onSuccess: () => {
      setConfirmReplay(false)
      setReplayReason('')
      void queryClient.invalidateQueries({ queryKey: EVENTS_KEY })
    },
  })
  const replayError = replayMutation.error instanceof ApiError ? replayMutation.error : null
  const replayState = resolveReplayUiState({
    confirmOpen: confirmReplay,
    status: replayMutation.isPending
      ? 'pending'
      : replayMutation.isSuccess
        ? 'success'
        : replayMutation.isError
          ? 'error'
          : 'idle',
    errorCode: replayError?.code ?? null,
  })

  const createMutation = useMutation({
    mutationFn: (body: SubscriptionCreateRequest) => createSubscription(body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY }),
  })
  const revokeMutation = useMutation({
    mutationFn: () => revokeSubscription(selectedSubscriptionCode as string),
    onSuccess: () => {
      setSelectedSubscriptionCode(null)
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY })
    },
  })

  return {
    draftFilters,
    setDraftFilter: (key: keyof EventListQuery, value: string) =>
      setDraftFilters((current) => ({ ...current, [key]: value })),
    applyFilters: () => {
      setCursor(undefined)
      setFilters(draftFilters)
    },
    clearFilters: () => {
      setCursor(undefined)
      setDraftFilters(EMPTY_FILTERS)
      setFilters(EMPTY_FILTERS)
    },
    refresh: () => void queryClient.invalidateQueries({ queryKey: EVENTS_KEY }),
    listState,
    listError,
    rows,
    hasMore: Boolean(eventsQuery.data?.page.has_more),
    loadMore: () => {
      const next = eventsQuery.data?.page.next_cursor
      if (next) setCursor(next)
    },
    selectedId,
    setSelectedId,
    detailRow,
    confirmReplay,
    setConfirmReplay,
    replayReason,
    setReplayReason,
    replayState,
    replayError,
    requestReplay: () => replayMutation.mutate(),
    subscriptions: subscriptionsQuery.data?.items ?? [],
    subscriptionsLoading: subscriptionsQuery.isLoading,
    subscriptionsError:
      subscriptionsQuery.error instanceof ApiError ? subscriptionsQuery.error : null,
    selectedSubscriptionCode,
    setSelectedSubscriptionCode,
    createSubscription: (body: SubscriptionCreateRequest) => createMutation.mutate(body),
    createPending: createMutation.isPending,
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,
    revokeSubscription: () => revokeMutation.mutate(),
    revokePending: revokeMutation.isPending,
    revokeError: revokeMutation.error instanceof ApiError ? revokeMutation.error : null,
  }
}
