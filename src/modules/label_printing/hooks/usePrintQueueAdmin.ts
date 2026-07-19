import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  approveReprint,
  archiveLabelTemplate,
  archivePrinter,
  cancelPrintJob,
  createLabelTemplate,
  createPrinter,
  enqueuePrintJob,
  listLabelTemplates,
  listPrinters,
  listPrintJobs,
  requestReprint,
  retryPrintJob,
} from '../api/labelPrintingApi'
import {
  projectPrintJobRow,
  resolveActionUiState,
  resolvePrintListState,
} from '../lib/printProjection'
import type {
  EnqueuePrintJobRequest,
  LabelTemplateCreateRequest,
  PrintJobAction,
  PrinterCreateRequest,
} from '../types/labelPrinting'

const JOBS_KEY = ['nb05', 'print-jobs'] as const
const PRINTERS_KEY = ['nb05', 'printers'] as const
const TEMPLATES_KEY = ['nb05', 'templates'] as const

export type PrintQueueTab = 'jobs' | 'printers' | 'templates'

export function usePrintQueueAdmin(initialQuery = '') {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<PrintQueueTab>('jobs')
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [appliedQuery, setAppliedQuery] = useState(initialQuery)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<PrintJobAction | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [selectedPrinterCode, setSelectedPrinterCode] = useState<string | null>(null)
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string | null>(null)
  const [confirmArchivePrinter, setConfirmArchivePrinter] = useState(false)
  const [confirmArchiveTemplate, setConfirmArchiveTemplate] = useState(false)

  const printersQuery = useQuery({
    queryKey: [...PRINTERS_KEY, { limit: 200 }],
    queryFn: () => listPrinters({ limit: 200 }),
  })

  const templatesQuery = useQuery({
    queryKey: [...TEMPLATES_KEY, { limit: 200 }],
    queryFn: () => listLabelTemplates({ limit: 200 }),
  })

  const jobsQuery = useQuery({
    queryKey: [...JOBS_KEY, { q: appliedQuery, cursor }],
    queryFn: () =>
      listPrintJobs({
        q: appliedQuery || undefined,
        cursor,
        limit: 50,
        sort: 'requested_at_desc',
      }),
    enabled: tab === 'jobs',
  })

  const lookups = useMemo(() => {
    const printersById = new Map<number, string>()
    for (const p of printersQuery.data?.items ?? []) {
      printersById.set(p.id, p.code)
    }
    const templatesById = new Map<number, string>()
    for (const t of templatesQuery.data?.items ?? []) {
      templatesById.set(t.id, t.code)
    }
    return { printersById, templatesById }
  }, [printersQuery.data?.items, templatesQuery.data?.items])

  const selectedJob = useMemo(
    () => jobsQuery.data?.items.find((item) => item.code === selectedCode) ?? null,
    [jobsQuery.data?.items, selectedCode],
  )

  const jobRows = useMemo(
    () => (jobsQuery.data?.items ?? []).map((job) => projectPrintJobRow(job, lookups)),
    [jobsQuery.data?.items, lookups],
  )

  const detailRow = useMemo(
    () => (selectedJob ? projectPrintJobRow(selectedJob, lookups) : null),
    [selectedJob, lookups],
  )

  const listState = resolvePrintListState({
    status:
      jobsQuery.isLoading || jobsQuery.isFetching
        ? 'loading'
        : jobsQuery.isError
          ? 'error'
          : 'success',
    itemCount: jobsQuery.data?.items.length ?? 0,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: jobsQuery.error instanceof ApiError ? jobsQuery.error.code : null,
  })

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    void queryClient.invalidateQueries({ queryKey: PRINTERS_KEY })
    void queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY })
  }, [queryClient])

  const jobActionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCode || !confirmAction) {
        throw new ApiError('VALIDATION_ERROR', 'Chưa chọn job/action.', 400)
      }
      switch (confirmAction) {
        case 'retry':
          return retryPrintJob(selectedCode)
        case 'cancel':
          return cancelPrintJob(selectedCode, actionReason.trim())
        case 'request_reprint':
          return requestReprint(selectedCode, actionReason.trim())
        case 'approve_reprint':
          return approveReprint(selectedCode)
        default:
          throw new ApiError('VALIDATION_ERROR', 'Action không hợp lệ.', 400)
      }
    },
    onSuccess: () => {
      setConfirmAction(null)
      setActionReason('')
      void queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    },
  })

  const enqueueMutation = useMutation({
    mutationFn: (body: EnqueuePrintJobRequest) => enqueuePrintJob(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_KEY })
    },
  })

  const createPrinterMutation = useMutation({
    mutationFn: (body: PrinterCreateRequest) => createPrinter(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRINTERS_KEY })
    },
  })

  const archivePrinterMutation = useMutation({
    mutationFn: () => archivePrinter(selectedPrinterCode as string),
    onSuccess: () => {
      setConfirmArchivePrinter(false)
      setSelectedPrinterCode(null)
      void queryClient.invalidateQueries({ queryKey: PRINTERS_KEY })
    },
  })

  const createTemplateMutation = useMutation({
    mutationFn: (body: LabelTemplateCreateRequest) => createLabelTemplate(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY })
    },
  })

  const archiveTemplateMutation = useMutation({
    mutationFn: () => archiveLabelTemplate(selectedTemplateCode as string),
    onSuccess: () => {
      setConfirmArchiveTemplate(false)
      setSelectedTemplateCode(null)
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY })
    },
  })

  const actionError = jobActionMutation.error instanceof ApiError ? jobActionMutation.error : null
  const actionState = resolveActionUiState({
    confirmOpen: confirmAction !== null,
    status: jobActionMutation.isPending
      ? 'pending'
      : jobActionMutation.isSuccess
        ? 'success'
        : jobActionMutation.isError
          ? 'error'
          : 'idle',
    errorCode: actionError?.code ?? null,
  })

  const applySearch = useCallback(() => {
    setCursor(undefined)
    setAppliedQuery(searchInput.trim())
  }, [searchInput])

  const loadMore = useCallback(() => {
    const next = jobsQuery.data?.page.next_cursor
    if (next) {
      setCursor(next)
    }
  }, [jobsQuery.data?.page.next_cursor])

  const reasonRequired =
    confirmAction === 'cancel' || confirmAction === 'request_reprint'

  return {
    tab,
    setTab,
    searchInput,
    setSearchInput,
    applySearch,
    loadMore,
    refresh: invalidateAll,
    listState,
    jobRows,
    hasMore: Boolean(jobsQuery.data?.page.has_more),
    selectedCode,
    setSelectedCode,
    detailRow,
    confirmAction,
    setConfirmAction,
    actionReason,
    setActionReason,
    reasonRequired,
    actionState,
    actionError,
    requestJobAction: () => jobActionMutation.mutate(),
    printers: printersQuery.data?.items ?? [],
    printersLoading: printersQuery.isLoading || printersQuery.isFetching,
    printersError: printersQuery.error instanceof ApiError ? printersQuery.error : null,
    selectedPrinterCode,
    setSelectedPrinterCode,
    confirmArchivePrinter,
    setConfirmArchivePrinter,
    archivePrinterState: archivePrinterMutation.isPending
      ? 'pending'
      : archivePrinterMutation.isError
        ? 'error'
        : archivePrinterMutation.isSuccess
          ? 'success'
          : 'idle',
    archivePrinterError:
      archivePrinterMutation.error instanceof ApiError ? archivePrinterMutation.error : null,
    requestArchivePrinter: () => archivePrinterMutation.mutate(),
    createPrinter: (body: PrinterCreateRequest) => createPrinterMutation.mutate(body),
    createPrinterPending: createPrinterMutation.isPending,
    createPrinterError:
      createPrinterMutation.error instanceof ApiError ? createPrinterMutation.error : null,
    templates: templatesQuery.data?.items ?? [],
    templatesLoading: templatesQuery.isLoading || templatesQuery.isFetching,
    templatesError: templatesQuery.error instanceof ApiError ? templatesQuery.error : null,
    selectedTemplateCode,
    setSelectedTemplateCode,
    confirmArchiveTemplate,
    setConfirmArchiveTemplate,
    archiveTemplateState: archiveTemplateMutation.isPending
      ? 'pending'
      : archiveTemplateMutation.isError
        ? 'error'
        : archiveTemplateMutation.isSuccess
          ? 'success'
          : 'idle',
    archiveTemplateError:
      archiveTemplateMutation.error instanceof ApiError ? archiveTemplateMutation.error : null,
    requestArchiveTemplate: () => archiveTemplateMutation.mutate(),
    createTemplate: (body: LabelTemplateCreateRequest) => createTemplateMutation.mutate(body),
    createTemplatePending: createTemplateMutation.isPending,
    createTemplateError:
      createTemplateMutation.error instanceof ApiError ? createTemplateMutation.error : null,
    enqueue: (body: EnqueuePrintJobRequest) => enqueueMutation.mutate(body),
    enqueuePending: enqueueMutation.isPending,
    enqueueError: enqueueMutation.error instanceof ApiError ? enqueueMutation.error : null,
    enqueueSuccess: enqueueMutation.isSuccess,
  }
}
