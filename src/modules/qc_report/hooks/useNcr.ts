import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  closeNcrViaAction,
  containNcrViaAction,
  createCapa,
  createNcr,
  exportNcrs,
  exportPareto,
  getCapa,
  getNcr,
  getParetoReport,
  listCapas,
  listDefectOptions,
  listItemOptions,
  listNcrs,
  startCapaViaAction,
  startInvestigationViaAction,
  updateCapaViaAction,
  updateNcrViaAction,
  voidNcrViaAction,
} from '../api/ncrApi'
import {
  parseEvidenceFileIds,
  projectCapaRow,
  projectNcrRow,
  projectParetoRows,
  resolveMutationUiState,
  resolveNcrListState,
  resolveParetoState,
  validateCapaCreateForm,
  validateCloseEvidence,
  validateContainForm,
  validateNcrCreateForm,
  validateVoidReason,
} from '../lib/ncrProjection'
import type {
  CapaCreateRequest,
  CapaUpdateRequest,
  ContainRequest,
  NcrCreateRequest,
  NcrUpdateRequest,
  VoidRequest,
} from '../types/ncr'

export type NcrTab = 'ncrs' | 'capas' | 'pareto'

const NCRS_KEY = ['qms03', 'ncrs'] as const
const NCR_DETAIL_KEY = ['qms03', 'ncr'] as const
const CAPAS_KEY = ['qms03', 'capas'] as const
const CAPA_DETAIL_KEY = ['qms03', 'capa'] as const
const PARETO_KEY = ['qms03', 'pareto'] as const
const ITEMS_KEY = ['qms03', 'items'] as const
const DEFECTS_KEY = ['qms03', 'defects'] as const

const EMPTY_CREATE: NcrCreateRequest = {
  source: 'IQC',
  item_code: '',
  lot_code: '',
  work_order_code: '',
  defect_code: '',
  qty_affected: 1,
  severity: '',
}

const EMPTY_CAPA_CREATE: CapaCreateRequest = {
  ncr_id: 0,
  root_cause: '',
  corrective_action: '',
  preventive_action: '',
  owner_id: 0,
  due_date: '',
  effectiveness: 'PENDING_VERIFY',
}

function mutationStatus(mutation: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
}): 'idle' | 'pending' | 'success' | 'error' {
  if (mutation.isPending) return 'pending'
  if (mutation.isSuccess) return 'success'
  if (mutation.isError) return 'error'
  return 'idle'
}

export function useNcr() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<NcrTab>('ncrs')

  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })
  const defectsQuery = useQuery({ queryKey: DEFECTS_KEY, queryFn: () => listDefectOptions() })

  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<NcrCreateRequest>(EMPTY_CREATE)
  const [createErrors, setCreateErrors] = useState<string[]>([])

  const [confirmStartInv, setConfirmStartInv] = useState(false)
  const [confirmStartCapa, setConfirmStartCapa] = useState(false)
  const [showContain, setShowContain] = useState(false)
  const [containForm, setContainForm] = useState<ContainRequest>({
    disposition: 'USE_AS_IS',
    disposition_scope: { lot_code: '', qty: 1 },
  })
  const [containErrors, setContainErrors] = useState<string[]>([])
  const [showClose, setShowClose] = useState(false)
  const [evidenceRaw, setEvidenceRaw] = useState('')
  const [closeErrors, setCloseErrors] = useState<string[]>([])
  const [showVoid, setShowVoid] = useState(false)
  const [voidForm, setVoidForm] = useState<VoidRequest>({ reason: '' })
  const [voidErrors, setVoidErrors] = useState<string[]>([])

  const [capaSearchInput, setCapaSearchInput] = useState('')
  const [capaAppliedQuery, setCapaAppliedQuery] = useState('')
  const [capaCursor, setCapaCursor] = useState<string | undefined>()
  const [selectedCapaCode, setSelectedCapaCode] = useState<string | null>(null)
  const [showCapaCreate, setShowCapaCreate] = useState(false)
  const [capaCreateForm, setCapaCreateForm] = useState<CapaCreateRequest>(EMPTY_CAPA_CREATE)
  const [capaCreateErrors, setCapaCreateErrors] = useState<string[]>([])

  const [paretoFrom, setParetoFrom] = useState('')
  const [paretoTo, setParetoTo] = useState('')
  const [paretoGroupBy, setParetoGroupBy] = useState('defect_code')
  const [paretoSource, setParetoSource] = useState('')
  const [paretoApplied, setParetoApplied] = useState({
    from: '',
    to: '',
    group_by: 'defect_code',
    source: '',
  })

  const listQuery = useQuery({
    queryKey: [...NCRS_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listNcrs({ q: appliedQuery || undefined, cursor, limit: 50 }),
    enabled: tab === 'ncrs',
  })

  const detailQuery = useQuery({
    queryKey: [...NCR_DETAIL_KEY, selectedCode],
    queryFn: () => getNcr(selectedCode as string),
    enabled: tab === 'ncrs' && Boolean(selectedCode),
  })

  const capaListQuery = useQuery({
    queryKey: [...CAPAS_KEY, { q: capaAppliedQuery, cursor: capaCursor }],
    queryFn: () => listCapas({ q: capaAppliedQuery || undefined, cursor: capaCursor, limit: 50 }),
    enabled: tab === 'capas',
  })

  const capaDetailQuery = useQuery({
    queryKey: [...CAPA_DETAIL_KEY, selectedCapaCode],
    queryFn: () => getCapa(selectedCapaCode as string),
    enabled: tab === 'capas' && Boolean(selectedCapaCode),
  })

  const paretoQuery = useQuery({
    queryKey: [...PARETO_KEY, paretoApplied],
    queryFn: () =>
      getParetoReport({
        from: paretoApplied.from || undefined,
        to: paretoApplied.to || undefined,
        group_by: paretoApplied.group_by || 'defect_code',
        source: paretoApplied.source || undefined,
      }),
    enabled: tab === 'pareto',
  })

  const detailRow = detailQuery.data ? projectNcrRow(detailQuery.data) : null
  const capaDetailRow = capaDetailQuery.data ? projectCapaRow(capaDetailQuery.data) : null
  const paretoRows = useMemo(() => projectParetoRows(paretoQuery.data), [paretoQuery.data])
  const paretoError = paretoQuery.error instanceof ApiError ? paretoQuery.error : null
  const paretoState = resolveParetoState({
    status:
      paretoQuery.isLoading || paretoQuery.isFetching
        ? 'loading'
        : paretoQuery.isError
          ? 'error'
          : 'success',
    rowCount: paretoRows.length,
    errorCode: paretoError?.code ?? null,
  })

  const invalidateNcrs = async () => {
    await queryClient.invalidateQueries({ queryKey: NCRS_KEY })
    await queryClient.invalidateQueries({ queryKey: NCR_DETAIL_KEY })
  }

  const invalidateCapas = async () => {
    await queryClient.invalidateQueries({ queryKey: CAPAS_KEY })
    await queryClient.invalidateQueries({ queryKey: CAPA_DETAIL_KEY })
  }

  const createMutation = useMutation({
    mutationFn: () => createNcr(createForm),
    onSuccess: async (row) => {
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
      setSelectedCode(row.code)
      await invalidateNcrs()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: NcrUpdateRequest) => {
      const action = detailRow?.updateAction
      if (!action || !action.enabled) throw new ApiError('VALIDATION_ERROR', 'Update không khả dụng.', 400)
      return updateNcrViaAction(action, body)
    },
    onSuccess: invalidateNcrs,
  })

  const startInvMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.startInvestigationAction
      if (!action || !action.enabled) throw new ApiError('VALIDATION_ERROR', 'Start investigation không khả dụng.', 400)
      return startInvestigationViaAction(action)
    },
    onSuccess: async () => {
      setConfirmStartInv(false)
      await invalidateNcrs()
    },
  })

  const containMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.containAction
      if (!action || !action.enabled) throw new ApiError('VALIDATION_ERROR', 'Contain không khả dụng.', 400)
      return containNcrViaAction(action, containForm)
    },
    onSuccess: async () => {
      setShowContain(false)
      await invalidateNcrs()
    },
  })

  const startCapaMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.startCapaAction
      if (!action || !action.enabled) throw new ApiError('VALIDATION_ERROR', 'Start CAPA không khả dụng.', 400)
      return startCapaViaAction(action)
    },
    onSuccess: async () => {
      setConfirmStartCapa(false)
      await invalidateNcrs()
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.closeAction
      if (!action || !action.enabled) throw new ApiError('VALIDATION_ERROR', 'Close không khả dụng.', 400)
      return closeNcrViaAction(action, { evidence_file_ids: parseEvidenceFileIds(evidenceRaw) })
    },
    onSuccess: async () => {
      setShowClose(false)
      setEvidenceRaw('')
      await invalidateNcrs()
    },
  })

  const voidMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.voidAction
      if (!action || !action.enabled) throw new ApiError('VALIDATION_ERROR', 'Void không khả dụng.', 400)
      return voidNcrViaAction(action, voidForm)
    },
    onSuccess: async () => {
      setShowVoid(false)
      setVoidForm({ reason: '' })
      await invalidateNcrs()
    },
  })

  const capaCreateMutation = useMutation({
    mutationFn: () => createCapa(capaCreateForm),
    onSuccess: async (row) => {
      setShowCapaCreate(false)
      setCapaCreateForm(EMPTY_CAPA_CREATE)
      setSelectedCapaCode(row.code)
      await invalidateCapas()
    },
  })

  const capaUpdateMutation = useMutation({
    mutationFn: (body: CapaUpdateRequest) => {
      const action = capaDetailRow?.updateAction
      if (!action || !action.enabled) throw new ApiError('VALIDATION_ERROR', 'Update CAPA không khả dụng.', 400)
      return updateCapaViaAction(action, body)
    },
    onSuccess: invalidateCapas,
  })

  const ncrExportMutation = useMutation({ mutationFn: () => exportNcrs() })
  const paretoExportMutation = useMutation({
    mutationFn: () =>
      exportPareto({
        from: paretoApplied.from || undefined,
        to: paretoApplied.to || undefined,
        group_by: paretoApplied.group_by || 'defect_code',
        source: paretoApplied.source || undefined,
      }),
  })

  const listError = listQuery.error instanceof ApiError ? listQuery.error.code : null
  const listState = resolveNcrListState({
    status: listQuery.isLoading ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: listQuery.data?.items.length ?? 0,
    hasQuery: Boolean(appliedQuery),
    errorCode: listError,
  })

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectNcrRow),
    [listQuery.data?.items],
  )

  const capaListError = capaListQuery.error instanceof ApiError ? capaListQuery.error.code : null
  const capaListState = resolveNcrListState({
    status: capaListQuery.isLoading ? 'loading' : capaListQuery.isError ? 'error' : 'success',
    itemCount: capaListQuery.data?.items.length ?? 0,
    hasQuery: Boolean(capaAppliedQuery),
    errorCode: capaListError,
  })
  const capaRows = useMemo(
    () => (capaListQuery.data?.items ?? []).map(projectCapaRow),
    [capaListQuery.data?.items],
  )

  return {
    tab,
    setTab,
    items: itemsQuery.data ?? [],
    defects: defectsQuery.data ?? [],

    searchInput,
    setSearchInput,
    applySearch: () => {
      setCursor(undefined)
      setAppliedQuery(searchInput.trim())
    },
    listState,
    listError,
    rows,
    page: listQuery.data?.page,
    loadMore: () => {
      if (listQuery.data?.page.next_cursor) setCursor(listQuery.data.page.next_cursor)
    },
    selectedCode,
    selectNcr: (code: string) => setSelectedCode(code),
    detail: detailQuery.data ?? null,
    detailRow,
    detailLoading: detailQuery.isLoading,

    showCreate,
    setShowCreate,
    createForm,
    setCreateForm,
    createErrors,
    submitCreate: () => {
      const errors = validateNcrCreateForm(createForm)
      setCreateErrors(errors)
      if (errors.length) return
      createMutation.mutate()
    },
    createUi: resolveMutationUiState({
      confirmOpen: showCreate,
      status: mutationStatus(createMutation),
      errorCode: createMutation.error instanceof ApiError ? createMutation.error.code : null,
    }),
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,

    submitUpdate: (body: NcrUpdateRequest) => updateMutation.mutate(body),
    updateUi: resolveMutationUiState({
      confirmOpen: false,
      status: mutationStatus(updateMutation),
      errorCode: updateMutation.error instanceof ApiError ? updateMutation.error.code : null,
    }),
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,

    confirmStartInv,
    setConfirmStartInv,
    submitStartInv: () => startInvMutation.mutate(),
    startInvUi: resolveMutationUiState({
      confirmOpen: confirmStartInv,
      status: mutationStatus(startInvMutation),
      errorCode: startInvMutation.error instanceof ApiError ? startInvMutation.error.code : null,
    }),

    showContain,
    setShowContain,
    containForm,
    setContainForm,
    containErrors,
    openContain: () => {
      setContainForm({
        disposition: 'USE_AS_IS',
        disposition_scope: {
          lot_code: detailQuery.data?.lot_code ?? '',
          qty: detailQuery.data?.qty_affected ?? 1,
        },
      })
      setContainErrors([])
      setShowContain(true)
    },
    submitContain: () => {
      const errors = validateContainForm({
        disposition: containForm.disposition,
        lot_code: containForm.disposition_scope.lot_code,
        qty: containForm.disposition_scope.qty,
      })
      setContainErrors(errors)
      if (errors.length) return
      containMutation.mutate()
    },
    containUi: resolveMutationUiState({
      confirmOpen: showContain,
      status: mutationStatus(containMutation),
      errorCode: containMutation.error instanceof ApiError ? containMutation.error.code : null,
    }),
    containError: containMutation.error instanceof ApiError ? containMutation.error : null,

    confirmStartCapa,
    setConfirmStartCapa,
    submitStartCapa: () => startCapaMutation.mutate(),
    startCapaUi: resolveMutationUiState({
      confirmOpen: confirmStartCapa,
      status: mutationStatus(startCapaMutation),
      errorCode: startCapaMutation.error instanceof ApiError ? startCapaMutation.error.code : null,
    }),

    showClose,
    setShowClose,
    evidenceRaw,
    setEvidenceRaw,
    closeErrors,
    submitClose: () => {
      const ids = parseEvidenceFileIds(evidenceRaw)
      const errors = validateCloseEvidence(ids)
      setCloseErrors(errors)
      if (errors.length) return
      closeMutation.mutate()
    },
    closeUi: resolveMutationUiState({
      confirmOpen: showClose,
      status: mutationStatus(closeMutation),
      errorCode: closeMutation.error instanceof ApiError ? closeMutation.error.code : null,
    }),
    closeError: closeMutation.error instanceof ApiError ? closeMutation.error : null,

    showVoid,
    setShowVoid,
    voidForm,
    setVoidForm,
    voidErrors,
    submitVoid: () => {
      const errors = validateVoidReason(voidForm.reason)
      setVoidErrors(errors)
      if (errors.length) return
      voidMutation.mutate()
    },
    voidUi: resolveMutationUiState({
      confirmOpen: showVoid,
      status: mutationStatus(voidMutation),
      errorCode: voidMutation.error instanceof ApiError ? voidMutation.error.code : null,
    }),
    voidError: voidMutation.error instanceof ApiError ? voidMutation.error : null,

    capaSearchInput,
    setCapaSearchInput,
    applyCapaSearch: () => {
      setCapaCursor(undefined)
      setCapaAppliedQuery(capaSearchInput.trim())
    },
    capaListState,
    capaListError,
    capaRows,
    capaPage: capaListQuery.data?.page,
    loadMoreCapas: () => {
      if (capaListQuery.data?.page.next_cursor) setCapaCursor(capaListQuery.data.page.next_cursor)
    },
    selectedCapaCode,
    selectCapa: (code: string) => setSelectedCapaCode(code),
    capaDetail: capaDetailQuery.data ?? null,
    capaDetailRow,
    capaDetailLoading: capaDetailQuery.isLoading,

    showCapaCreate,
    setShowCapaCreate,
    capaCreateForm,
    setCapaCreateForm,
    capaCreateErrors,
    openCapaCreateFromNcr: () => {
      if (!detailQuery.data) return
      setTab('capas')
      setCapaCreateForm({ ...EMPTY_CAPA_CREATE, ncr_id: detailQuery.data.id })
      setShowCapaCreate(true)
    },
    submitCapaCreate: () => {
      const errors = validateCapaCreateForm(capaCreateForm)
      setCapaCreateErrors(errors)
      if (errors.length) return
      capaCreateMutation.mutate()
    },
    capaCreateUi: resolveMutationUiState({
      confirmOpen: showCapaCreate,
      status: mutationStatus(capaCreateMutation),
      errorCode: capaCreateMutation.error instanceof ApiError ? capaCreateMutation.error.code : null,
    }),
    capaCreateError: capaCreateMutation.error instanceof ApiError ? capaCreateMutation.error : null,

    submitCapaUpdate: (body: CapaUpdateRequest) => capaUpdateMutation.mutate(body),
    capaUpdateUi: resolveMutationUiState({
      confirmOpen: false,
      status: mutationStatus(capaUpdateMutation),
      errorCode: capaUpdateMutation.error instanceof ApiError ? capaUpdateMutation.error.code : null,
    }),
    capaUpdateError: capaUpdateMutation.error instanceof ApiError ? capaUpdateMutation.error : null,

    paretoFrom,
    setParetoFrom,
    paretoTo,
    setParetoTo,
    paretoGroupBy,
    setParetoGroupBy,
    paretoSource,
    setParetoSource,
    applyParetoFilters: () =>
      setParetoApplied({
        from: paretoFrom.trim(),
        to: paretoTo.trim(),
        group_by: paretoGroupBy.trim() || 'defect_code',
        source: paretoSource.trim(),
      }),
    paretoState,
    paretoError,
    paretoRows,
    paretoTotal: paretoQuery.data?.total_qty ?? 0,
    paretoGroupByApplied: paretoQuery.data?.group_by ?? paretoApplied.group_by,
    exportNcrs: () => ncrExportMutation.mutate(),
    ncrExportPending: ncrExportMutation.isPending,
    ncrExportError: ncrExportMutation.error instanceof ApiError ? ncrExportMutation.error : null,
    ncrExportSuccess: ncrExportMutation.isSuccess,
    exportPareto: () => paretoExportMutation.mutate(),
    paretoExportPending: paretoExportMutation.isPending,
    paretoExportError:
      paretoExportMutation.error instanceof ApiError ? paretoExportMutation.error : null,
    paretoExportSuccess: paretoExportMutation.isSuccess,
  }
}
