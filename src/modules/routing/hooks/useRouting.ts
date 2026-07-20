import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createMachine,
  createRouting,
  createWorkCenter,
  deactivateMachineViaAction,
  deactivateRoutingViaAction,
  deactivateWorkCenterViaAction,
  getMachine,
  getRouting,
  getWorkCenter,
  listItemOptions,
  listMachines,
  listRoutingOperations,
  listRoutings,
  listUoms,
  listWorkCenters,
  obsoleteRoutingViaAction,
  releaseRoutingViaAction,
  updateMachineViaAction,
  updateRoutingViaAction,
  updateWorkCenterViaAction,
} from '../api/routingApi'
import {
  buildRoutingLookups,
  projectMachineRow,
  projectRoutingRow,
  projectWorkCenterRow,
  resolveMutationUiState,
  resolveRoutingListState,
  validateMachineCreateForm,
  validateRoutingCreateForm,
  validateWorkCenterCreateForm,
} from '../lib/routingProjection'
import type {
  MachineCreateRequest,
  MachineUpdateRequest,
  RoutingCreateRequest,
  RoutingUpdateRequest,
  WorkCenterCreateRequest,
  WorkCenterUpdateRequest,
} from '../types/routing'

export type RoutingTab = 'routings' | 'work_centers' | 'machines'

const ROUTINGS_KEY = ['mes03', 'routings'] as const
const ROUTING_DETAIL_KEY = ['mes03', 'routing'] as const
const ROUTING_OPS_KEY = ['mes03', 'routing-operations'] as const
const WORK_CENTERS_KEY = ['mes03', 'work-centers'] as const
const WORK_CENTER_DETAIL_KEY = ['mes03', 'work-center'] as const
const MACHINES_KEY = ['mes03', 'machines'] as const
const MACHINE_DETAIL_KEY = ['mes03', 'machine'] as const
const UOMS_KEY = ['mes03', 'uoms'] as const
const ITEMS_KEY = ['mes03', 'items'] as const

const EMPTY_WORK_CENTER_FORM: WorkCenterCreateRequest = {
  code: '',
  name: '',
  capacity_per_hour: 0,
  capacity_uom_id: 0,
}

const EMPTY_MACHINE_FORM: MachineCreateRequest = {
  code: '',
  work_center_id: 0,
  last_pm_date: '',
  next_pm_due: '',
  status: 'IDLE',
}

const EMPTY_ROUTING_FORM: RoutingCreateRequest = {
  code: '',
  product_item_id: 0,
  version: 'v1.0',
  status: 'DRAFT',
  effective_from: '',
  effective_to: null,
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

export function useRouting() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<RoutingTab>('routings')

  const uomsQuery = useQuery({ queryKey: UOMS_KEY, queryFn: () => listUoms() })
  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })

  // ---- Work centers ----
  const [wcSearchInput, setWcSearchInput] = useState('')
  const [wcAppliedQuery, setWcAppliedQuery] = useState('')
  const [wcCursor, setWcCursor] = useState<string | undefined>()
  const [selectedWcCode, setSelectedWcCode] = useState<string | null>(null)
  const [showWcCreate, setShowWcCreate] = useState(false)
  const [wcCreateForm, setWcCreateForm] = useState<WorkCenterCreateRequest>(EMPTY_WORK_CENTER_FORM)
  const [confirmWcDeactivate, setConfirmWcDeactivate] = useState(false)

  const workCentersQuery = useQuery({
    queryKey: [...WORK_CENTERS_KEY, { q: wcAppliedQuery, cursor: wcCursor }],
    queryFn: () => listWorkCenters({ q: wcAppliedQuery || undefined, cursor: wcCursor, limit: 50 }),
    enabled: tab === 'work_centers' || tab === 'machines',
  })

  const wcDetailQuery = useQuery({
    queryKey: [...WORK_CENTER_DETAIL_KEY, selectedWcCode],
    queryFn: () => getWorkCenter(selectedWcCode as string),
    enabled: Boolean(selectedWcCode),
  })

  // ---- Machines ----
  const [mSearchInput, setMSearchInput] = useState('')
  const [mAppliedQuery, setMAppliedQuery] = useState('')
  const [mCursor, setMCursor] = useState<string | undefined>()
  const [selectedMachineCode, setSelectedMachineCode] = useState<string | null>(null)
  const [showMachineCreate, setShowMachineCreate] = useState(false)
  const [machineCreateForm, setMachineCreateForm] = useState<MachineCreateRequest>(EMPTY_MACHINE_FORM)
  const [confirmMachineDeactivate, setConfirmMachineDeactivate] = useState(false)

  const machinesQuery = useQuery({
    queryKey: [...MACHINES_KEY, { q: mAppliedQuery, cursor: mCursor }],
    queryFn: () => listMachines({ q: mAppliedQuery || undefined, cursor: mCursor, limit: 50 }),
    enabled: tab === 'machines',
  })

  const machineDetailQuery = useQuery({
    queryKey: [...MACHINE_DETAIL_KEY, selectedMachineCode],
    queryFn: () => getMachine(selectedMachineCode as string),
    enabled: Boolean(selectedMachineCode),
  })

  // ---- Routings ----
  const [rtSearchInput, setRtSearchInput] = useState('')
  const [rtAppliedQuery, setRtAppliedQuery] = useState('')
  const [rtCursor, setRtCursor] = useState<string | undefined>()
  const [selectedRoutingCode, setSelectedRoutingCode] = useState<string | null>(null)
  const [showRoutingCreate, setShowRoutingCreate] = useState(false)
  const [routingCreateForm, setRoutingCreateForm] = useState<RoutingCreateRequest>(EMPTY_ROUTING_FORM)
  const [confirmRoutingDeactivate, setConfirmRoutingDeactivate] = useState(false)
  const [confirmRoutingRelease, setConfirmRoutingRelease] = useState(false)
  const [confirmRoutingObsolete, setConfirmRoutingObsolete] = useState(false)

  const routingsQuery = useQuery({
    queryKey: [...ROUTINGS_KEY, { q: rtAppliedQuery, cursor: rtCursor }],
    queryFn: () => listRoutings({ q: rtAppliedQuery || undefined, cursor: rtCursor, limit: 50 }),
    enabled: tab === 'routings',
  })

  const routingDetailQuery = useQuery({
    queryKey: [...ROUTING_DETAIL_KEY, selectedRoutingCode],
    queryFn: () => getRouting(selectedRoutingCode as string),
    enabled: Boolean(selectedRoutingCode),
  })

  const routingOpsQuery = useQuery({
    queryKey: [...ROUTING_OPS_KEY, selectedRoutingCode],
    queryFn: () => listRoutingOperations(selectedRoutingCode as string),
    enabled: Boolean(selectedRoutingCode),
  })

  const lookups = useMemo(
    () =>
      buildRoutingLookups({
        uoms: uomsQuery.data ?? [],
        workCenters: workCentersQuery.data?.items ?? [],
        items: itemsQuery.data ?? [],
      }),
    [uomsQuery.data, workCentersQuery.data?.items, itemsQuery.data],
  )

  const wcRows = useMemo(
    () => (workCentersQuery.data?.items ?? []).map((wc) => projectWorkCenterRow(wc, lookups)),
    [workCentersQuery.data?.items, lookups],
  )
  const machineRows = useMemo(
    () => (machinesQuery.data?.items ?? []).map((m) => projectMachineRow(m, lookups)),
    [machinesQuery.data?.items, lookups],
  )
  const routingRows = useMemo(
    () => (routingsQuery.data?.items ?? []).map((rh) => projectRoutingRow(rh, lookups)),
    [routingsQuery.data?.items, lookups],
  )

  const wcDetailRow = wcDetailQuery.data ? projectWorkCenterRow(wcDetailQuery.data, lookups) : null
  const machineDetailRow = machineDetailQuery.data
    ? projectMachineRow(machineDetailQuery.data, lookups)
    : null
  const routingDetailRow = routingDetailQuery.data
    ? projectRoutingRow(routingDetailQuery.data, lookups)
    : null

  const wcListState = resolveRoutingListState({
    status:
      workCentersQuery.isLoading || workCentersQuery.isFetching
        ? 'loading'
        : workCentersQuery.isError
          ? 'error'
          : 'success',
    itemCount: wcRows.length,
    hasQuery: wcAppliedQuery.trim().length > 0,
    errorCode: workCentersQuery.error instanceof ApiError ? workCentersQuery.error.code : null,
  })

  const machineListState = resolveRoutingListState({
    status:
      machinesQuery.isLoading || machinesQuery.isFetching
        ? 'loading'
        : machinesQuery.isError
          ? 'error'
          : 'success',
    itemCount: machineRows.length,
    hasQuery: mAppliedQuery.trim().length > 0,
    errorCode: machinesQuery.error instanceof ApiError ? machinesQuery.error.code : null,
  })

  const routingListState = resolveRoutingListState({
    status:
      routingsQuery.isLoading || routingsQuery.isFetching
        ? 'loading'
        : routingsQuery.isError
          ? 'error'
          : 'success',
    itemCount: routingRows.length,
    hasQuery: rtAppliedQuery.trim().length > 0,
    errorCode: routingsQuery.error instanceof ApiError ? routingsQuery.error.code : null,
  })

  const invalidateWorkCenters = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: WORK_CENTERS_KEY })
    void queryClient.invalidateQueries({ queryKey: WORK_CENTER_DETAIL_KEY })
  }, [queryClient])

  const invalidateMachines = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: MACHINES_KEY })
    void queryClient.invalidateQueries({ queryKey: MACHINE_DETAIL_KEY })
  }, [queryClient])

  const invalidateRoutings = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ROUTINGS_KEY })
    void queryClient.invalidateQueries({ queryKey: ROUTING_DETAIL_KEY })
    void queryClient.invalidateQueries({ queryKey: ROUTING_OPS_KEY })
  }, [queryClient])

  // ---- Work center mutations ----
  const createWcMutation = useMutation({
    mutationFn: () =>
      createWorkCenter({
        ...wcCreateForm,
        code: wcCreateForm.code.trim(),
        name: wcCreateForm.name.trim(),
      }),
    onSuccess: (wc) => {
      setShowWcCreate(false)
      setWcCreateForm(EMPTY_WORK_CENTER_FORM)
      invalidateWorkCenters()
      setSelectedWcCode(wc.code)
    },
  })

  const updateWcMutation = useMutation({
    mutationFn: (body: WorkCenterUpdateRequest) => {
      const action = wcDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateWorkCenterViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateWorkCenters(),
  })

  const deactivateWcMutation = useMutation({
    mutationFn: () => {
      const action = wcDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateWorkCenterViaAction(action)
    },
    onSuccess: () => {
      setConfirmWcDeactivate(false)
      invalidateWorkCenters()
    },
  })

  // ---- Machine mutations ----
  const createMachineMutation = useMutation({
    mutationFn: () =>
      createMachine({
        ...machineCreateForm,
        code: machineCreateForm.code.trim(),
      }),
    onSuccess: (m) => {
      setShowMachineCreate(false)
      setMachineCreateForm(EMPTY_MACHINE_FORM)
      invalidateMachines()
      setSelectedMachineCode(m.code)
    },
  })

  const updateMachineMutation = useMutation({
    mutationFn: (body: MachineUpdateRequest) => {
      const action = machineDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateMachineViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateMachines(),
  })

  const deactivateMachineMutation = useMutation({
    mutationFn: () => {
      const action = machineDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateMachineViaAction(action)
    },
    onSuccess: () => {
      setConfirmMachineDeactivate(false)
      invalidateMachines()
    },
  })

  // ---- Routing mutations ----
  const createRoutingMutation = useMutation({
    mutationFn: () =>
      createRouting({
        ...routingCreateForm,
        code: routingCreateForm.code.trim(),
        version: routingCreateForm.version.trim(),
      }),
    onSuccess: (rh) => {
      setShowRoutingCreate(false)
      setRoutingCreateForm(EMPTY_ROUTING_FORM)
      invalidateRoutings()
      setSelectedRoutingCode(rh.code)
    },
  })

  const updateRoutingMutation = useMutation({
    mutationFn: (body: RoutingUpdateRequest) => {
      const action = routingDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateRoutingViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateRoutings(),
  })

  const deactivateRoutingMutation = useMutation({
    mutationFn: () => {
      const action = routingDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateRoutingViaAction(action)
    },
    onSuccess: () => {
      setConfirmRoutingDeactivate(false)
      invalidateRoutings()
    },
  })

  const releaseRoutingMutation = useMutation({
    mutationFn: () => {
      const action = routingDetailRow?.releaseAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Release không được server cho phép.', 403)
      return releaseRoutingViaAction(action)
    },
    onSuccess: () => {
      setConfirmRoutingRelease(false)
      invalidateRoutings()
    },
  })

  const obsoleteRoutingMutation = useMutation({
    mutationFn: () => {
      const action = routingDetailRow?.obsoleteAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Obsolete không được server cho phép.', 403)
      return obsoleteRoutingViaAction(action)
    },
    onSuccess: () => {
      setConfirmRoutingObsolete(false)
      invalidateRoutings()
    },
  })

  const wcCreateErrors = validateWorkCenterCreateForm({
    code: wcCreateForm.code,
    name: wcCreateForm.name,
    capacityPerHour: wcCreateForm.capacity_per_hour,
    capacityUomId: wcCreateForm.capacity_uom_id,
  })

  const machineCreateErrors = validateMachineCreateForm({
    code: machineCreateForm.code,
    workCenterId: machineCreateForm.work_center_id,
    lastPmDate: machineCreateForm.last_pm_date,
    nextPmDue: machineCreateForm.next_pm_due,
    status: machineCreateForm.status,
  })

  const routingCreateErrors = validateRoutingCreateForm({
    code: routingCreateForm.code,
    productItemId: routingCreateForm.product_item_id,
    version: routingCreateForm.version,
    status: routingCreateForm.status,
    effectiveFrom: routingCreateForm.effective_from,
  })

  return {
    tab,
    setTab,

    uoms: uomsQuery.data ?? [],
    items: itemsQuery.data ?? [],

    // Work centers
    wcSearchInput,
    setWcSearchInput,
    wcAppliedQuery,
    applyWcSearch: () => {
      setWcCursor(undefined)
      setWcAppliedQuery(wcSearchInput.trim())
    },
    clearWcSearch: () => {
      setWcCursor(undefined)
      setWcSearchInput('')
      setWcAppliedQuery('')
    },
    wcListState,
    wcListError: workCentersQuery.error instanceof ApiError ? workCentersQuery.error : null,
    wcRows,
    wcHasMore: Boolean(workCentersQuery.data?.page.has_more),
    wcLoadMore: () => {
      const next = workCentersQuery.data?.page.next_cursor
      if (next) setWcCursor(next)
    },
    selectedWcCode,
    selectWorkCenter: (code: string) => {
      setSelectedWcCode(code)
      setShowWcCreate(false)
      setConfirmWcDeactivate(false)
      updateWcMutation.reset()
      deactivateWcMutation.reset()
    },
    wcDetail: wcDetailQuery.data ?? null,
    wcDetailRow,
    wcDetailLoading: wcDetailQuery.isLoading,
    workCenterOptions: workCentersQuery.data?.items ?? [],
    showWcCreate,
    openWcCreate: () => {
      setSelectedWcCode(null)
      setShowWcCreate(true)
    },
    closeWcCreate: () => setShowWcCreate(false),
    wcCreateForm,
    setWcCreateForm,
    wcCreateErrors,
    createWorkCenter: () => createWcMutation.mutate(),
    createWcPending: createWcMutation.isPending,
    createWcError: createWcMutation.error instanceof ApiError ? createWcMutation.error : null,
    saveWcEdit: (body: WorkCenterUpdateRequest) => updateWcMutation.mutate(body),
    updateWcPending: updateWcMutation.isPending,
    updateWcError: updateWcMutation.error instanceof ApiError ? updateWcMutation.error : null,
    updateWcSuccess: updateWcMutation.isSuccess,
    confirmWcDeactivate,
    setConfirmWcDeactivate,
    deactivateWorkCenter: () => deactivateWcMutation.mutate(),
    deactivateWcState: resolveMutationUiState({
      confirmOpen: confirmWcDeactivate,
      status: mutationStatus(deactivateWcMutation),
      errorCode: deactivateWcMutation.error instanceof ApiError ? deactivateWcMutation.error.code : null,
    }),
    deactivateWcError: deactivateWcMutation.error instanceof ApiError ? deactivateWcMutation.error : null,

    // Machines
    mSearchInput,
    setMSearchInput,
    mAppliedQuery,
    applyMachineSearch: () => {
      setMCursor(undefined)
      setMAppliedQuery(mSearchInput.trim())
    },
    clearMachineSearch: () => {
      setMCursor(undefined)
      setMSearchInput('')
      setMAppliedQuery('')
    },
    machineListState,
    machineListError: machinesQuery.error instanceof ApiError ? machinesQuery.error : null,
    machineRows,
    machineHasMore: Boolean(machinesQuery.data?.page.has_more),
    machineLoadMore: () => {
      const next = machinesQuery.data?.page.next_cursor
      if (next) setMCursor(next)
    },
    selectedMachineCode,
    selectMachine: (code: string) => {
      setSelectedMachineCode(code)
      setShowMachineCreate(false)
      setConfirmMachineDeactivate(false)
      updateMachineMutation.reset()
      deactivateMachineMutation.reset()
    },
    machineDetail: machineDetailQuery.data ?? null,
    machineDetailRow,
    machineDetailLoading: machineDetailQuery.isLoading,
    showMachineCreate,
    openMachineCreate: () => {
      setSelectedMachineCode(null)
      setShowMachineCreate(true)
    },
    closeMachineCreate: () => setShowMachineCreate(false),
    machineCreateForm,
    setMachineCreateForm,
    machineCreateErrors,
    createMachine: () => createMachineMutation.mutate(),
    createMachinePending: createMachineMutation.isPending,
    createMachineError:
      createMachineMutation.error instanceof ApiError ? createMachineMutation.error : null,
    saveMachineEdit: (body: MachineUpdateRequest) => updateMachineMutation.mutate(body),
    updateMachinePending: updateMachineMutation.isPending,
    updateMachineError:
      updateMachineMutation.error instanceof ApiError ? updateMachineMutation.error : null,
    updateMachineSuccess: updateMachineMutation.isSuccess,
    confirmMachineDeactivate,
    setConfirmMachineDeactivate,
    deactivateMachine: () => deactivateMachineMutation.mutate(),
    deactivateMachineState: resolveMutationUiState({
      confirmOpen: confirmMachineDeactivate,
      status: mutationStatus(deactivateMachineMutation),
      errorCode:
        deactivateMachineMutation.error instanceof ApiError
          ? deactivateMachineMutation.error.code
          : null,
    }),
    deactivateMachineError:
      deactivateMachineMutation.error instanceof ApiError ? deactivateMachineMutation.error : null,

    // Routings
    rtSearchInput,
    setRtSearchInput,
    rtAppliedQuery,
    applyRoutingSearch: () => {
      setRtCursor(undefined)
      setRtAppliedQuery(rtSearchInput.trim())
    },
    clearRoutingSearch: () => {
      setRtCursor(undefined)
      setRtSearchInput('')
      setRtAppliedQuery('')
    },
    routingListState,
    routingListError: routingsQuery.error instanceof ApiError ? routingsQuery.error : null,
    routingRows,
    routingHasMore: Boolean(routingsQuery.data?.page.has_more),
    routingLoadMore: () => {
      const next = routingsQuery.data?.page.next_cursor
      if (next) setRtCursor(next)
    },
    selectedRoutingCode,
    selectRouting: (code: string) => {
      setSelectedRoutingCode(code)
      setShowRoutingCreate(false)
      setConfirmRoutingDeactivate(false)
      setConfirmRoutingRelease(false)
      setConfirmRoutingObsolete(false)
      updateRoutingMutation.reset()
      deactivateRoutingMutation.reset()
      releaseRoutingMutation.reset()
      obsoleteRoutingMutation.reset()
    },
    routingDetail: routingDetailQuery.data ?? null,
    routingDetailRow,
    routingDetailLoading: routingDetailQuery.isLoading,
    routingOperations: routingOpsQuery.data ?? [],
    routingOperationsLoading: routingOpsQuery.isLoading,
    showRoutingCreate,
    openRoutingCreate: () => {
      setSelectedRoutingCode(null)
      setShowRoutingCreate(true)
    },
    closeRoutingCreate: () => setShowRoutingCreate(false),
    routingCreateForm,
    setRoutingCreateForm,
    routingCreateErrors,
    createRouting: () => createRoutingMutation.mutate(),
    createRoutingPending: createRoutingMutation.isPending,
    createRoutingError:
      createRoutingMutation.error instanceof ApiError ? createRoutingMutation.error : null,
    saveRoutingEdit: (body: RoutingUpdateRequest) => updateRoutingMutation.mutate(body),
    updateRoutingPending: updateRoutingMutation.isPending,
    updateRoutingError:
      updateRoutingMutation.error instanceof ApiError ? updateRoutingMutation.error : null,
    updateRoutingSuccess: updateRoutingMutation.isSuccess,

    confirmRoutingDeactivate,
    setConfirmRoutingDeactivate,
    deactivateRouting: () => deactivateRoutingMutation.mutate(),
    deactivateRoutingState: resolveMutationUiState({
      confirmOpen: confirmRoutingDeactivate,
      status: mutationStatus(deactivateRoutingMutation),
      errorCode:
        deactivateRoutingMutation.error instanceof ApiError
          ? deactivateRoutingMutation.error.code
          : null,
    }),
    deactivateRoutingError:
      deactivateRoutingMutation.error instanceof ApiError ? deactivateRoutingMutation.error : null,

    confirmRoutingRelease,
    setConfirmRoutingRelease,
    releaseRouting: () => releaseRoutingMutation.mutate(),
    releaseRoutingState: resolveMutationUiState({
      confirmOpen: confirmRoutingRelease,
      status: mutationStatus(releaseRoutingMutation),
      errorCode:
        releaseRoutingMutation.error instanceof ApiError ? releaseRoutingMutation.error.code : null,
    }),
    releaseRoutingError:
      releaseRoutingMutation.error instanceof ApiError ? releaseRoutingMutation.error : null,

    confirmRoutingObsolete,
    setConfirmRoutingObsolete,
    obsoleteRouting: () => obsoleteRoutingMutation.mutate(),
    obsoleteRoutingState: resolveMutationUiState({
      confirmOpen: confirmRoutingObsolete,
      status: mutationStatus(obsoleteRoutingMutation),
      errorCode:
        obsoleteRoutingMutation.error instanceof ApiError ? obsoleteRoutingMutation.error.code : null,
    }),
    obsoleteRoutingError:
      obsoleteRoutingMutation.error instanceof ApiError ? obsoleteRoutingMutation.error : null,
  }
}
