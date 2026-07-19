import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  getDowntimeLog,
  getKpiSeries,
  getProductionDashboard,
  listDowntimeLogs,
  requestProductionExportViaAction,
  updateDowntimeViaAction,
} from '../api/dashboardApi'
import {
  projectDashboard,
  projectDowntimeRow,
  resolveDashboardState,
  resolveDowntimeListState,
  resolveExportUiState,
} from '../lib/dashboardProjection'
import type { DashboardFilter, DowntimeUpdateRequest } from '../types/dashboard'

const DASH_KEY = ['mes08', 'dashboard'] as const
const KPI_KEY = ['mes08', 'kpi-series'] as const
const DT_LIST_KEY = ['mes08', 'downtime-logs'] as const
const DT_DETAIL_KEY = ['mes08', 'downtime-log'] as const

export type DashboardTab = 'kpis' | 'downtime'

const DEFAULT_KPI = 'YIELD_RATE'

export function useProductionDashboard() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<DashboardTab>('kpis')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [appliedFilter, setAppliedFilter] = useState<DashboardFilter>({})
  const [kpiCode, setKpiCode] = useState(DEFAULT_KPI)
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<DowntimeUpdateRequest>({})

  const filter: DashboardFilter = {
    ...appliedFilter,
    group_by: appliedFilter.group_by || 'day',
  }

  const dashQuery = useQuery({
    queryKey: [...DASH_KEY, filter],
    queryFn: () => getProductionDashboard(filter),
    enabled: tab === 'kpis',
  })

  const kpiQuery = useQuery({
    queryKey: [...KPI_KEY, kpiCode, filter],
    queryFn: () => getKpiSeries(kpiCode, filter),
    enabled: tab === 'kpis' && Boolean(kpiCode),
  })

  const listQuery = useQuery({
    queryKey: [...DT_LIST_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listDowntimeLogs({ q: appliedQuery || undefined, cursor, limit: 50 }),
    enabled: tab === 'downtime',
  })

  const detailQuery = useQuery({
    queryKey: [...DT_DETAIL_KEY, selectedCode],
    queryFn: () => getDowntimeLog(selectedCode as string),
    enabled: Boolean(selectedCode) && tab === 'downtime',
  })

  const dashView = dashQuery.data ? projectDashboard(dashQuery.data) : null
  const dashError = dashQuery.error instanceof ApiError ? dashQuery.error : null
  const dashState = resolveDashboardState({
    status:
      dashQuery.isLoading || dashQuery.isFetching
        ? 'loading'
        : dashQuery.isError
          ? 'error'
          : 'success',
    errorCode: dashError?.code ?? null,
  })

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectDowntimeRow),
    [listQuery.data?.items],
  )
  const detailRow = detailQuery.data ? projectDowntimeRow(detailQuery.data) : null
  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveDowntimeListState({
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

  const exportMutation = useMutation({
    mutationFn: () => {
      const action = dashView?.exportAction
      if (!action?.enabled) {
        throw new ApiError('PERMISSION_DENIED', 'Export không được server cho phép.', 403)
      }
      return requestProductionExportViaAction(action, { ...filter })
    },
  })
  const exportError = exportMutation.error instanceof ApiError ? exportMutation.error : null
  const exportState = resolveExportUiState({
    status: exportMutation.isPending
      ? 'pending'
      : exportMutation.isSuccess
        ? 'success'
        : exportMutation.isError
          ? 'error'
          : 'idle',
    jobCode: exportMutation.data?.code ?? null,
    errorCode: exportError?.code ?? null,
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.updateAction
      if (!action?.enabled) {
        throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      }
      return updateDowntimeViaAction(action, editForm)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DT_LIST_KEY })
      await queryClient.invalidateQueries({ queryKey: DT_DETAIL_KEY })
    },
  })
  const updateError = updateMutation.error instanceof ApiError ? updateMutation.error : null

  return {
    tab,
    setTab,
    from,
    setFrom,
    to,
    setTo,
    applyFilter: () => {
      setAppliedFilter({
        from: from.trim() || undefined,
        to: to.trim() || undefined,
      })
    },
    dashState,
    dashError,
    dashView,
    kpiCode,
    setKpiCode,
    kpiSeries: kpiQuery.data?.series ?? [],
    kpiLoading: kpiQuery.isLoading || kpiQuery.isFetching,
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
    selectDowntime: (code: string) => {
      setSelectedCode(code)
      setEditForm({})
      updateMutation.reset()
    },
    detailLoading: detailQuery.isLoading || detailQuery.isFetching,
    detail: detailQuery.data ?? null,
    detailRow,
    editForm,
    setEditForm,
    saveUpdate: () => updateMutation.mutate(),
    updatePending: updateMutation.isPending,
    updateError,
    updateSuccess: updateMutation.isSuccess,
    export: () => exportMutation.mutate(),
    exportState,
    exportError,
    exportJobCode: exportMutation.data?.code ?? null,
  }
}
