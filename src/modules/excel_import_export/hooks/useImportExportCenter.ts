import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createExportJob,
  createImportBatch,
  downloadImportTemplate,
  getImportBatch,
  listImportErrors,
  postImportAction,
} from '../api/importExportApi'
import {
  EXPORT_TEMPLATES,
  IMPORT_TEMPLATES,
  findImportTemplate,
  projectImportBatch,
  resolveBatchUiState,
  resolveMutationUiState,
} from '../lib/importExportProjection'

const BATCH_KEY = ['nb07', 'batch'] as const
const ERRORS_KEY = ['nb07', 'errors'] as const

export function useImportExportCenter() {
  const queryClient = useQueryClient()
  const [templateCode, setTemplateCode] = useState(IMPORT_TEMPLATES[0]?.templateCode ?? '')
  const [batchCodeInput, setBatchCodeInput] = useState('')
  const [activeBatchCode, setActiveBatchCode] = useState<string | null>(null)
  const [sourceFileId, setSourceFileId] = useState('')
  const [mode, setMode] = useState('ALL_OR_NOTHING')
  const [importMode, setImportMode] = useState('UPSERT')
  const [confirmAction, setConfirmAction] = useState<'commit' | 'cancel' | null>(null)
  const [exportTemplateCode, setExportTemplateCode] = useState(
    EXPORT_TEMPLATES[0]?.templateCode ?? '',
  )
  const [sessionBatches, setSessionBatches] = useState<string[]>([])

  const template = findImportTemplate(templateCode)

  const batchQuery = useQuery({
    queryKey: [...BATCH_KEY, templateCode, activeBatchCode],
    queryFn: () => getImportBatch(templateCode, activeBatchCode as string),
    enabled: Boolean(templateCode && activeBatchCode),
  })

  const errorsQuery = useQuery({
    queryKey: [...ERRORS_KEY, templateCode, activeBatchCode],
    queryFn: () => listImportErrors(templateCode, activeBatchCode as string),
    enabled: Boolean(templateCode && activeBatchCode && batchQuery.isSuccess),
  })

  const detailRow = useMemo(
    () => (batchQuery.data ? projectImportBatch(batchQuery.data) : null),
    [batchQuery.data],
  )

  const batchError = batchQuery.error instanceof ApiError ? batchQuery.error : null
  const batchState = resolveBatchUiState({
    status: !activeBatchCode
      ? 'idle'
      : batchQuery.isLoading || batchQuery.isFetching
        ? 'loading'
        : batchQuery.isError
          ? 'error'
          : 'success',
    hasBatch: Boolean(batchQuery.data),
    errorCode: batchError?.code ?? null,
  })

  const rememberBatch = (code: string) => {
    setActiveBatchCode(code)
    setBatchCodeInput(code)
    setSessionBatches((current) =>
      current.includes(code) ? current : [code, ...current].slice(0, 20),
    )
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createImportBatch(templateCode, {
        source_file_id: Number(sourceFileId),
        mode,
        import_mode: importMode,
      }),
    onSuccess: (batch) => {
      rememberBatch(batch.code)
      void queryClient.invalidateQueries({ queryKey: BATCH_KEY })
    },
  })

  const actionMutation = useMutation({
    mutationFn: (href: string) => postImportAction(href),
    onSuccess: (batch) => {
      setConfirmAction(null)
      rememberBatch(batch.code)
      void queryClient.invalidateQueries({ queryKey: BATCH_KEY })
      void queryClient.invalidateQueries({ queryKey: ERRORS_KEY })
    },
  })

  const exportMutation = useMutation({
    mutationFn: () => createExportJob(exportTemplateCode),
  })

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const blob = await downloadImportTemplate(templateCode)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${templateCode}.xlsx`
      anchor.click()
      URL.revokeObjectURL(url)
    },
  })

  const actionError = actionMutation.error instanceof ApiError ? actionMutation.error : null
  const mutationState = resolveMutationUiState({
    confirmOpen: confirmAction !== null,
    status: actionMutation.isPending
      ? 'pending'
      : actionMutation.isSuccess
        ? 'success'
        : actionMutation.isError
          ? 'error'
          : 'idle',
    errorCode: actionError?.code ?? null,
  })

  return {
    templates: IMPORT_TEMPLATES,
    exportTemplates: EXPORT_TEMPLATES,
    templateCode,
    setTemplateCode: (code: string) => {
      setTemplateCode(code)
      const next = findImportTemplate(code)
      if (next) {
        setImportMode(next.importModes[0] ?? 'UPSERT')
        setMode(next.commitModes[0] ?? 'ALL_OR_NOTHING')
      }
      setActiveBatchCode(null)
    },
    template,
    batchCodeInput,
    setBatchCodeInput,
    loadBatch: () => {
      const code = batchCodeInput.trim()
      if (code) rememberBatch(code)
    },
    sessionBatches,
    selectSessionBatch: (code: string) => rememberBatch(code),
    sourceFileId,
    setSourceFileId,
    mode,
    setMode,
    importMode,
    setImportMode,
    createBatch: () => createMutation.mutate(),
    createPending: createMutation.isPending,
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,
    downloadTemplate: () => downloadMutation.mutate(),
    downloadPending: downloadMutation.isPending,
    downloadError: downloadMutation.error instanceof ApiError ? downloadMutation.error : null,
    batchState,
    batchError,
    detailRow,
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEY })
      void queryClient.invalidateQueries({ queryKey: ERRORS_KEY })
    },
    errors: errorsQuery.data ?? [],
    errorsLoading: errorsQuery.isLoading,
    errorsError: errorsQuery.error instanceof ApiError ? errorsQuery.error : null,
    confirmAction,
    setConfirmAction,
    mutationState,
    actionError,
    runValidate: () => {
      if (detailRow?.canValidate && detailRow.validateHref) {
        actionMutation.mutate(detailRow.validateHref)
      }
    },
    runConfirmedAction: () => {
      if (confirmAction === 'commit' && detailRow?.canCommit && detailRow.commitHref) {
        actionMutation.mutate(detailRow.commitHref)
      }
      if (confirmAction === 'cancel' && detailRow?.canCancel && detailRow.cancelHref) {
        actionMutation.mutate(detailRow.cancelHref)
      }
    },
    exportTemplateCode,
    setExportTemplateCode,
    createExport: () => exportMutation.mutate(),
    exportPending: exportMutation.isPending,
    exportError: exportMutation.error instanceof ApiError ? exportMutation.error : null,
    exportResult: exportMutation.data ?? null,
  }
}
