import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  listWorkerJobRuns,
  listWorkerJobs,
  runWorkerJobNow,
  toggleWorkerJob,
  updateWorkerJob,
} from '../api/workerJobsApi'
import { projectWorkerJobRow, resolveWorkerListState } from '../lib/workerJobProjection'

const JOBS_KEY = ['nb10', 'worker-jobs'] as const
const RUNS_KEY = ['nb10', 'worker-runs'] as const

export function useWorkerJobConsole() {
  const queryClient = useQueryClient()
  const [draftFilters, setDraftFilters] = useState({
    q: '',
    job_category: '',
    module_scope: '',
    enabled: '',
  })
  const [filters, setFilters] = useState(draftFilters)
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [cronDraft, setCronDraft] = useState('')

  const jobsQuery = useQuery({
    queryKey: [...JOBS_KEY, filters, cursor],
    queryFn: () =>
      listWorkerJobs({
        ...filters,
        enabled: filters.enabled === '' ? undefined : filters.enabled === 'true',
        cursor,
        limit: 50,
        sort: 'job_key_asc',
      }),
  })

  const runsQuery = useQuery({
    queryKey: [...RUNS_KEY, selectedKey],
    queryFn: () => listWorkerJobRuns(selectedKey as string),
    enabled: Boolean(selectedKey),
  })

  const rows = useMemo(
    () => (jobsQuery.data?.items ?? []).map(projectWorkerJobRow),
    [jobsQuery.data?.items],
  )
  const selectedJob = useMemo(
    () => jobsQuery.data?.items.find((job) => job.job_key === selectedKey) ?? null,
    [jobsQuery.data?.items, selectedKey],
  )
  const detailRow = selectedJob ? projectWorkerJobRow(selectedJob) : null

  const listError = jobsQuery.error instanceof ApiError ? jobsQuery.error : null
  const listState = resolveWorkerListState({
    status:
      jobsQuery.isLoading || jobsQuery.isFetching
        ? 'loading'
        : jobsQuery.isError
          ? 'error'
          : 'success',
    itemCount: rows.length,
    hasFilters: Object.values(filters).some(Boolean),
    errorCode: listError?.code ?? null,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    void queryClient.invalidateQueries({ queryKey: RUNS_KEY })
  }

  const toggleMutation = useMutation({
    mutationFn: () =>
      toggleWorkerJob(selectedKey as string, {
        enabled: !(selectedJob?.enabled ?? false),
        updated_reason: reason.trim(),
      }),
    onSuccess: invalidate,
  })
  const runMutation = useMutation({
    mutationFn: () => runWorkerJobNow(selectedKey as string),
    onSuccess: invalidate,
  })
  const updateMutation = useMutation({
    mutationFn: () =>
      updateWorkerJob(selectedKey as string, {
        cron_expr: cronDraft.trim() || null,
        updated_reason: reason.trim(),
      }),
    onSuccess: invalidate,
  })

  return {
    draftFilters,
    setDraftFilter: (key: keyof typeof draftFilters, value: string) =>
      setDraftFilters((current) => ({ ...current, [key]: value })),
    applyFilters: () => {
      setCursor(undefined)
      setFilters(draftFilters)
    },
    clearFilters: () => {
      const empty = { q: '', job_category: '', module_scope: '', enabled: '' }
      setCursor(undefined)
      setDraftFilters(empty)
      setFilters(empty)
    },
    refresh: invalidate,
    listState,
    listError,
    rows,
    hasMore: Boolean(jobsQuery.data?.page.has_more),
    loadMore: () => {
      const next = jobsQuery.data?.page.next_cursor
      if (next) setCursor(next)
    },
    selectedKey,
    setSelectedKey: (key: string) => {
      setSelectedKey(key)
      const job = jobsQuery.data?.items.find((item) => item.job_key === key)
      setCronDraft(job?.cron_expr ?? '')
    },
    detailRow,
    selectedJob,
    reason,
    setReason,
    cronDraft,
    setCronDraft,
    runs: runsQuery.data?.items ?? [],
    runsLoading: runsQuery.isLoading,
    runsError: runsQuery.error instanceof ApiError ? runsQuery.error : null,
    toggle: () => toggleMutation.mutate(),
    runNow: () => runMutation.mutate(),
    saveCron: () => updateMutation.mutate(),
    actionPending:
      toggleMutation.isPending || runMutation.isPending || updateMutation.isPending,
    actionError:
      toggleMutation.error instanceof ApiError
        ? toggleMutation.error
        : runMutation.error instanceof ApiError
          ? runMutation.error
          : updateMutation.error instanceof ApiError
            ? updateMutation.error
            : null,
  }
}
