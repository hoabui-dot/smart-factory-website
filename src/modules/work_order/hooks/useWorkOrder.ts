import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  cancelWorkOrderViaAction,
  closeWorkOrderViaAction,
  createWorkOrder,
  getWorkOrder,
  listItemOptions,
  listItemRevisionOptions,
  listMaterialRequests,
  listWorkOrders,
  pauseWorkOrderViaAction,
  planWorkOrderViaAction,
  releaseWorkOrderViaAction,
  resumeWorkOrderViaAction,
  updateWorkOrderViaAction,
} from '../api/workOrderApi'
import {
  buildWorkOrderLookups,
  projectMaterialRequestRow,
  projectWorkOrderRow,
  resolveMutationUiState,
  resolveWorkOrderListState,
  validateReasonForm,
  validateWorkOrderCreateForm,
} from '../lib/workOrderProjection'
import type { ReasonRequest, WorkOrderCreateRequest, WorkOrderUpdateRequest } from '../types/workOrder'

const WORK_ORDERS_KEY = ['mes04', 'work-orders'] as const
const WORK_ORDER_DETAIL_KEY = ['mes04', 'work-order'] as const
const MATERIAL_REQUESTS_KEY = ['mes04', 'material-requests'] as const
const ITEMS_KEY = ['mes04', 'items'] as const
const REVISIONS_KEY = ['mes04', 'item-revisions'] as const

const EMPTY_CREATE_FORM: WorkOrderCreateRequest = {
  code: '',
  item_id: 0,
  item_revision_id: null,
  planned_qty: 0,
  planned_start: '',
}

const EMPTY_REASON_FORM: ReasonRequest = { reason: '' }

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

export function useWorkOrder() {
  const queryClient = useQueryClient()

  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })

  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<WorkOrderCreateRequest>(EMPTY_CREATE_FORM)
  const [createItemCode, setCreateItemCode] = useState<string | null>(null)

  const [confirmPlan, setConfirmPlan] = useState(false)
  const [confirmRelease, setConfirmRelease] = useState(false)
  const [confirmResume, setConfirmResume] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [showPause, setShowPause] = useState(false)
  const [pauseForm, setPauseForm] = useState<ReasonRequest>(EMPTY_REASON_FORM)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelForm, setCancelForm] = useState<ReasonRequest>(EMPTY_REASON_FORM)

  const listQuery = useQuery({
    queryKey: [...WORK_ORDERS_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listWorkOrders({ q: appliedQuery || undefined, cursor, limit: 50 }),
  })

  const detailQuery = useQuery({
    queryKey: [...WORK_ORDER_DETAIL_KEY, selectedId],
    queryFn: () => getWorkOrder(selectedId as number),
    enabled: Boolean(selectedId),
  })

  const detailItemCode = detailQuery.data?.item_code ?? null
  const detailRevisionsQuery = useQuery({
    queryKey: [...REVISIONS_KEY, detailItemCode],
    queryFn: () => listItemRevisionOptions(detailItemCode as string),
    enabled: Boolean(detailItemCode),
  })

  const createRevisionsQuery = useQuery({
    queryKey: [...REVISIONS_KEY, createItemCode],
    queryFn: () => listItemRevisionOptions(createItemCode as string),
    enabled: Boolean(createItemCode),
  })

  const materialRequestsQuery = useQuery({
    queryKey: [...MATERIAL_REQUESTS_KEY, selectedId],
    queryFn: () => listMaterialRequests(selectedId as number),
    enabled: Boolean(selectedId),
  })

  const lookups = useMemo(
    () =>
      buildWorkOrderLookups({
        items: itemsQuery.data ?? [],
        revisions: detailRevisionsQuery.data ?? [],
      }),
    [itemsQuery.data, detailRevisionsQuery.data],
  )

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map((wo) => projectWorkOrderRow(wo, lookups)),
    [listQuery.data?.items, lookups],
  )

  const detailRow = detailQuery.data ? projectWorkOrderRow(detailQuery.data, lookups) : null

  const materialRequestRows = useMemo(
    () => (materialRequestsQuery.data?.items ?? []).map((mr) => projectMaterialRequestRow(mr)),
    [materialRequestsQuery.data?.items],
  )

  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveWorkOrderListState({
    status: listQuery.isLoading || listQuery.isFetching ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: rows.length,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listError?.code ?? null,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: WORK_ORDERS_KEY })
    void queryClient.invalidateQueries({ queryKey: WORK_ORDER_DETAIL_KEY })
    void queryClient.invalidateQueries({ queryKey: MATERIAL_REQUESTS_KEY })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createWorkOrder({
        ...createForm,
        code: createForm.code.trim(),
        item_revision_id: createForm.item_revision_id || null,
      }),
    onSuccess: (wo) => {
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE_FORM)
      setCreateItemCode(null)
      invalidate()
      setSelectedId(wo.id)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: WorkOrderUpdateRequest) => {
      const action = detailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateWorkOrderViaAction(action, body)
    },
    onSuccess: () => invalidate(),
  })

  const planMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.planAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Plan không được server cho phép.', 403)
      return planWorkOrderViaAction(action)
    },
    onSuccess: () => {
      setConfirmPlan(false)
      invalidate()
    },
  })

  const releaseMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.releaseAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Release không được server cho phép.', 403)
      return releaseWorkOrderViaAction(action)
    },
    onSuccess: () => {
      setConfirmRelease(false)
      invalidate()
    },
  })

  const pauseMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.pauseAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Pause không được server cho phép.', 403)
      return pauseWorkOrderViaAction(action, { reason: pauseForm.reason.trim() })
    },
    onSuccess: () => {
      setShowPause(false)
      setPauseForm(EMPTY_REASON_FORM)
      invalidate()
    },
  })

  const resumeMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.resumeAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Resume không được server cho phép.', 403)
      return resumeWorkOrderViaAction(action)
    },
    onSuccess: () => {
      setConfirmResume(false)
      invalidate()
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.closeAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Close không được server cho phép.', 403)
      return closeWorkOrderViaAction(action)
    },
    onSuccess: () => {
      setConfirmClose(false)
      invalidate()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.cancelAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Cancel không được server cho phép.', 403)
      return cancelWorkOrderViaAction(action, { reason: cancelForm.reason.trim() })
    },
    onSuccess: () => {
      setShowCancel(false)
      setCancelForm(EMPTY_REASON_FORM)
      invalidate()
    },
  })

  const createErrors = validateWorkOrderCreateForm({
    code: createForm.code,
    itemId: createForm.item_id,
    plannedQty: createForm.planned_qty,
    plannedStart: createForm.planned_start,
  })

  const pauseErrors = validateReasonForm({ reason: pauseForm.reason })
  const cancelErrors = validateReasonForm({ reason: cancelForm.reason })

  return {
    items: itemsQuery.data ?? [],
    createRevisions: createRevisionsQuery.data ?? [],
    detailRevisions: detailRevisionsQuery.data ?? [],

    searchInput,
    setSearchInput,
    appliedQuery,
    applySearch: () => {
      setCursor(undefined)
      setAppliedQuery(searchInput.trim())
    },
    clearSearch: () => {
      setCursor(undefined)
      setSearchInput('')
      setAppliedQuery('')
    },
    listState,
    listError,
    rows,
    hasMore: Boolean(listQuery.data?.page.has_more),
    loadMore: () => {
      const next = listQuery.data?.page.next_cursor
      if (next) setCursor(next)
    },

    selectedId,
    selectWorkOrder: (id: number) => {
      setSelectedId(id)
      setShowCreate(false)
      setConfirmPlan(false)
      setConfirmRelease(false)
      setConfirmResume(false)
      setConfirmClose(false)
      setShowPause(false)
      setShowCancel(false)
      setPauseForm(EMPTY_REASON_FORM)
      setCancelForm(EMPTY_REASON_FORM)
      updateMutation.reset()
      planMutation.reset()
      releaseMutation.reset()
      pauseMutation.reset()
      resumeMutation.reset()
      closeMutation.reset()
      cancelMutation.reset()
    },
    detail: detailQuery.data ?? null,
    detailRow,
    detailLoading: detailQuery.isLoading,
    detailError: detailQuery.error instanceof ApiError ? detailQuery.error : null,

    materialRequestRows,
    materialRequestsLoading: materialRequestsQuery.isLoading,

    showCreate,
    openCreate: () => {
      setSelectedId(null)
      setCreateItemCode(null)
      setShowCreate(true)
    },
    closeCreate: () => setShowCreate(false),
    createForm,
    setCreateForm,
    setCreateItemCode,
    createErrors,
    create: () => createMutation.mutate(),
    createPending: createMutation.isPending,
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,

    saveEdit: (body: WorkOrderUpdateRequest) => updateMutation.mutate(body),
    updatePending: updateMutation.isPending,
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,
    updateSuccess: updateMutation.isSuccess,

    confirmPlan,
    setConfirmPlan,
    plan: () => planMutation.mutate(),
    planState: resolveMutationUiState({
      confirmOpen: confirmPlan,
      status: mutationStatus(planMutation),
      errorCode: planMutation.error instanceof ApiError ? planMutation.error.code : null,
    }),
    planError: planMutation.error instanceof ApiError ? planMutation.error : null,

    confirmRelease,
    setConfirmRelease,
    release: () => releaseMutation.mutate(),
    releaseState: resolveMutationUiState({
      confirmOpen: confirmRelease,
      status: mutationStatus(releaseMutation),
      errorCode: releaseMutation.error instanceof ApiError ? releaseMutation.error.code : null,
    }),
    releaseError: releaseMutation.error instanceof ApiError ? releaseMutation.error : null,

    showPause,
    openPause: () => {
      setPauseForm(EMPTY_REASON_FORM)
      pauseMutation.reset()
      setShowPause(true)
    },
    closePause: () => setShowPause(false),
    pauseForm,
    setPauseForm,
    pauseErrors,
    pause: () => pauseMutation.mutate(),
    pauseState: resolveMutationUiState({
      confirmOpen: showPause,
      status: mutationStatus(pauseMutation),
      errorCode: pauseMutation.error instanceof ApiError ? pauseMutation.error.code : null,
    }),
    pauseError: pauseMutation.error instanceof ApiError ? pauseMutation.error : null,

    confirmResume,
    setConfirmResume,
    resume: () => resumeMutation.mutate(),
    resumeState: resolveMutationUiState({
      confirmOpen: confirmResume,
      status: mutationStatus(resumeMutation),
      errorCode: resumeMutation.error instanceof ApiError ? resumeMutation.error.code : null,
    }),
    resumeError: resumeMutation.error instanceof ApiError ? resumeMutation.error : null,

    confirmClose,
    setConfirmClose,
    close: () => closeMutation.mutate(),
    closeState: resolveMutationUiState({
      confirmOpen: confirmClose,
      status: mutationStatus(closeMutation),
      errorCode: closeMutation.error instanceof ApiError ? closeMutation.error.code : null,
    }),
    closeError: closeMutation.error instanceof ApiError ? closeMutation.error : null,

    showCancel,
    openCancel: () => {
      setCancelForm(EMPTY_REASON_FORM)
      cancelMutation.reset()
      setShowCancel(true)
    },
    closeCancel: () => setShowCancel(false),
    cancelForm,
    setCancelForm,
    cancelErrors,
    cancel: () => cancelMutation.mutate(),
    cancelState: resolveMutationUiState({
      confirmOpen: showCancel,
      status: mutationStatus(cancelMutation),
      errorCode: cancelMutation.error instanceof ApiError ? cancelMutation.error.code : null,
    }),
    cancelError: cancelMutation.error instanceof ApiError ? cancelMutation.error : null,
  }
}
