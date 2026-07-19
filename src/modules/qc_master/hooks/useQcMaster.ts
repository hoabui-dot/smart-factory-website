import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createCharacteristicMaster,
  createDefectCode,
  createInspectionPlan,
  deactivateCharacteristicMasterViaAction,
  deactivateDefectCodeViaAction,
  deactivateInspectionPlanViaAction,
  getInspectionPlan,
  listCharacteristicCategories,
  listCharacteristicMasters,
  listDefectCodes,
  listInspectionFrequencies,
  listInspectionPlans,
  listInspectionStages,
  listItemOptions,
  listItemRevisionOptions,
  listSamplingMethods,
  obsoleteInspectionPlanViaAction,
  releaseInspectionPlanViaAction,
  updateCharacteristicMasterViaAction,
  updateDefectCodeViaAction,
  updateInspectionPlanViaAction,
} from '../api/qcMasterApi'
import {
  buildQcMasterLookups,
  filterItemsForStage,
  isProductionStageGroup,
  itemTypeCodeOf,
  productionPlanRequiresRevision,
  projectCharacteristicMasterRow,
  projectDefectCodeRow,
  projectInspectionPlanRow,
  resolveMutationUiState,
  resolveQcListState,
  validateCharacteristicMasterCreateForm,
  validateDefectCodeCreateForm,
  validateInspectionPlanCreateForm,
} from '../lib/qcMasterProjection'
import type {
  CharacteristicMasterCreateRequest,
  CharacteristicMasterUpdateRequest,
  DefectCodeCreateRequest,
  DefectCodeUpdateRequest,
  InspectionPlanCreateRequest,
  InspectionPlanUpdateRequest,
} from '../types/qcMaster'

export type QcMasterTab = 'checksheets' | 'characteristics' | 'defect_codes'

const PLANS_KEY = ['qms01', 'plans'] as const
const PLAN_DETAIL_KEY = ['qms01', 'plan'] as const
const CHAR_MASTERS_KEY = ['qms01', 'characteristics'] as const
const DEFECT_CODES_KEY = ['qms01', 'defect-codes'] as const
const STAGES_KEY = ['qms01', 'stages'] as const
const SAMPLING_METHODS_KEY = ['qms01', 'sampling-methods'] as const
const FREQUENCIES_KEY = ['qms01', 'frequencies'] as const
const ITEMS_KEY = ['qms01', 'items'] as const
const REVISIONS_KEY = ['qms01', 'item-revisions'] as const
const CATEGORIES_KEY = ['qms01', 'characteristic-categories'] as const

const EMPTY_PLAN_FORM: InspectionPlanCreateRequest = {
  code: '',
  inspection_stage_id: 0,
  item_id: 0,
  item_revision_id: null,
  sampling_method_id: 0,
  inspection_frequency_id: 0,
  sampling_param: '',
}

const EMPTY_CHAR_MASTER_FORM: CharacteristicMasterCreateRequest = {
  code: '',
  name_vi: '',
  name_en: '',
  characteristic_category_id: 0,
  default_char_type: 'NUMERIC',
  default_uom: '',
}

const EMPTY_DEFECT_CODE_FORM: DefectCodeCreateRequest = {
  code: '',
  name_vi: '',
  name_en: '',
  characteristic_category_id: 0,
  default_severity: 'MINOR',
  is_active: true,
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

export function useQcMaster() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<QcMasterTab>('checksheets')

  const stagesQuery = useQuery({ queryKey: STAGES_KEY, queryFn: () => listInspectionStages() })
  const samplingMethodsQuery = useQuery({
    queryKey: SAMPLING_METHODS_KEY,
    queryFn: () => listSamplingMethods(),
  })
  const frequenciesQuery = useQuery({
    queryKey: FREQUENCIES_KEY,
    queryFn: () => listInspectionFrequencies(),
  })
  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })
  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => listCharacteristicCategories(),
  })

  // ---- Checksheets (inspection_plan) ----
  const [planSearchInput, setPlanSearchInput] = useState('')
  const [planAppliedQuery, setPlanAppliedQuery] = useState('')
  const [planCursor, setPlanCursor] = useState<string | undefined>()
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null)
  const [showPlanCreate, setShowPlanCreate] = useState(false)
  const [planCreateForm, setPlanCreateForm] = useState<InspectionPlanCreateRequest>(EMPTY_PLAN_FORM)
  const [planCreateItemCode, setPlanCreateItemCode] = useState('')
  const [confirmPlanDeactivate, setConfirmPlanDeactivate] = useState(false)
  const [confirmPlanRelease, setConfirmPlanRelease] = useState(false)
  const [confirmPlanObsolete, setConfirmPlanObsolete] = useState(false)

  const plansQuery = useQuery({
    queryKey: [...PLANS_KEY, { q: planAppliedQuery, cursor: planCursor }],
    queryFn: () => listInspectionPlans({ q: planAppliedQuery || undefined, cursor: planCursor, limit: 50 }),
    enabled: tab === 'checksheets',
  })

  const planDetailQuery = useQuery({
    queryKey: [...PLAN_DETAIL_KEY, selectedPlanCode],
    queryFn: () => getInspectionPlan(selectedPlanCode as string),
    enabled: Boolean(selectedPlanCode),
  })

  const detailItemCode = planDetailQuery.data?.item_code ?? null
  const revisionsQuery = useQuery({
    queryKey: [...REVISIONS_KEY, detailItemCode],
    queryFn: () => listItemRevisionOptions(detailItemCode as string),
    enabled: Boolean(detailItemCode),
  })

  const createRevisionsQuery = useQuery({
    queryKey: [...REVISIONS_KEY, planCreateItemCode],
    queryFn: () => listItemRevisionOptions(planCreateItemCode),
    enabled: Boolean(planCreateItemCode.trim()),
  })

  // ---- Characteristics (characteristic_master) ----
  const [cmSearchInput, setCmSearchInput] = useState('')
  const [cmAppliedQuery, setCmAppliedQuery] = useState('')
  const [cmCursor, setCmCursor] = useState<string | undefined>()
  const [selectedCmCode, setSelectedCmCode] = useState<string | null>(null)
  const [showCmCreate, setShowCmCreate] = useState(false)
  const [cmCreateForm, setCmCreateForm] = useState<CharacteristicMasterCreateRequest>(
    EMPTY_CHAR_MASTER_FORM,
  )
  const [confirmCmDeactivate, setConfirmCmDeactivate] = useState(false)

  const charMastersQuery = useQuery({
    queryKey: [...CHAR_MASTERS_KEY, { q: cmAppliedQuery, cursor: cmCursor }],
    queryFn: () => listCharacteristicMasters({ q: cmAppliedQuery || undefined, cursor: cmCursor, limit: 50 }),
    enabled: tab === 'characteristics' || tab === 'checksheets',
  })

  // ---- Defect codes ----
  const [dcSearchInput, setDcSearchInput] = useState('')
  const [dcAppliedQuery, setDcAppliedQuery] = useState('')
  const [dcCursor, setDcCursor] = useState<string | undefined>()
  const [selectedDcCode, setSelectedDcCode] = useState<string | null>(null)
  const [showDcCreate, setShowDcCreate] = useState(false)
  const [dcCreateForm, setDcCreateForm] = useState<DefectCodeCreateRequest>(EMPTY_DEFECT_CODE_FORM)
  const [confirmDcDeactivate, setConfirmDcDeactivate] = useState(false)

  const defectCodesQuery = useQuery({
    queryKey: [...DEFECT_CODES_KEY, { q: dcAppliedQuery, cursor: dcCursor }],
    queryFn: () => listDefectCodes({ q: dcAppliedQuery || undefined, cursor: dcCursor, limit: 50 }),
    enabled: tab === 'defect_codes',
  })

  const lookups = useMemo(
    () =>
      buildQcMasterLookups({
        stages: stagesQuery.data ?? [],
        samplingMethods: samplingMethodsQuery.data ?? [],
        frequencies: frequenciesQuery.data ?? [],
        items: itemsQuery.data ?? [],
        revisions: [...(revisionsQuery.data ?? []), ...(createRevisionsQuery.data ?? [])],
        charMasters: charMastersQuery.data?.items ?? [],
      }),
    [
      stagesQuery.data,
      samplingMethodsQuery.data,
      frequenciesQuery.data,
      itemsQuery.data,
      revisionsQuery.data,
      createRevisionsQuery.data,
      charMastersQuery.data?.items,
    ],
  )

  const planRows = useMemo(
    () => (plansQuery.data?.items ?? []).map((p) => projectInspectionPlanRow(p, lookups)),
    [plansQuery.data?.items, lookups],
  )
  const planDetailRow = planDetailQuery.data ? projectInspectionPlanRow(planDetailQuery.data, lookups) : null

  const planListState = resolveQcListState({
    status: plansQuery.isLoading || plansQuery.isFetching ? 'loading' : plansQuery.isError ? 'error' : 'success',
    itemCount: planRows.length,
    hasQuery: planAppliedQuery.trim().length > 0,
    errorCode: plansQuery.error instanceof ApiError ? plansQuery.error.code : null,
  })

  const cmRows = useMemo(
    () => (charMastersQuery.data?.items ?? []).map((cm) => projectCharacteristicMasterRow(cm)),
    [charMastersQuery.data?.items],
  )
  const cmListState = resolveQcListState({
    status:
      charMastersQuery.isLoading || charMastersQuery.isFetching
        ? 'loading'
        : charMastersQuery.isError
          ? 'error'
          : 'success',
    itemCount: cmRows.length,
    hasQuery: cmAppliedQuery.trim().length > 0,
    errorCode: charMastersQuery.error instanceof ApiError ? charMastersQuery.error.code : null,
  })

  const dcRows = useMemo(
    () => (defectCodesQuery.data?.items ?? []).map((dc) => projectDefectCodeRow(dc)),
    [defectCodesQuery.data?.items],
  )
  const dcListState = resolveQcListState({
    status:
      defectCodesQuery.isLoading || defectCodesQuery.isFetching
        ? 'loading'
        : defectCodesQuery.isError
          ? 'error'
          : 'success',
    itemCount: dcRows.length,
    hasQuery: dcAppliedQuery.trim().length > 0,
    errorCode: defectCodesQuery.error instanceof ApiError ? defectCodesQuery.error.code : null,
  })

  const invalidatePlans = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PLANS_KEY })
    void queryClient.invalidateQueries({ queryKey: PLAN_DETAIL_KEY })
  }, [queryClient])

  const invalidateCharMasters = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CHAR_MASTERS_KEY })
  }, [queryClient])

  const invalidateDefectCodes = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: DEFECT_CODES_KEY })
  }, [queryClient])

  // ---- Plan mutations ----
  const createPlanMutation = useMutation({
    mutationFn: () =>
      createInspectionPlan({
        ...planCreateForm,
        code: planCreateForm.code.trim(),
        sampling_param: planCreateForm.sampling_param.trim(),
      }),
    onSuccess: (row) => {
      setShowPlanCreate(false)
      setPlanCreateForm(EMPTY_PLAN_FORM)
      setPlanCreateItemCode('')
      invalidatePlans()
      setSelectedPlanCode(row.code)
    },
  })

  const updatePlanMutation = useMutation({
    mutationFn: (body: InspectionPlanUpdateRequest) => {
      const action = planDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateInspectionPlanViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidatePlans(),
  })

  const deactivatePlanMutation = useMutation({
    mutationFn: () => {
      const action = planDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateInspectionPlanViaAction(action)
    },
    onSuccess: () => {
      setConfirmPlanDeactivate(false)
      invalidatePlans()
    },
  })

  const releasePlanMutation = useMutation({
    mutationFn: () => {
      const action = planDetailRow?.releaseAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Release không được server cho phép.', 403)
      return releaseInspectionPlanViaAction(action)
    },
    onSuccess: () => {
      setConfirmPlanRelease(false)
      invalidatePlans()
    },
  })

  const obsoletePlanMutation = useMutation({
    mutationFn: () => {
      const action = planDetailRow?.obsoleteAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Obsolete không được server cho phép.', 403)
      return obsoleteInspectionPlanViaAction(action)
    },
    onSuccess: () => {
      setConfirmPlanObsolete(false)
      invalidatePlans()
    },
  })

  // ---- Characteristic master mutations ----
  const createCmMutation = useMutation({
    mutationFn: () =>
      createCharacteristicMaster({
        ...cmCreateForm,
        code: cmCreateForm.code.trim(),
        name_vi: cmCreateForm.name_vi.trim(),
        name_en: cmCreateForm.name_en.trim(),
        default_uom: cmCreateForm.default_uom.trim(),
      }),
    onSuccess: (row) => {
      setShowCmCreate(false)
      setCmCreateForm(EMPTY_CHAR_MASTER_FORM)
      invalidateCharMasters()
      setSelectedCmCode(row.code)
    },
  })

  const cmDetailRow = useMemo(() => {
    const found = (charMastersQuery.data?.items ?? []).find((cm) => cm.code === selectedCmCode)
    return found ? projectCharacteristicMasterRow(found) : null
  }, [charMastersQuery.data?.items, selectedCmCode])

  const updateCmMutation = useMutation({
    mutationFn: (body: CharacteristicMasterUpdateRequest) => {
      const action = cmDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateCharacteristicMasterViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateCharMasters(),
  })

  const deactivateCmMutation = useMutation({
    mutationFn: () => {
      const action = cmDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateCharacteristicMasterViaAction(action)
    },
    onSuccess: () => {
      setConfirmCmDeactivate(false)
      invalidateCharMasters()
    },
  })

  // ---- Defect code mutations ----
  const createDcMutation = useMutation({
    mutationFn: () =>
      createDefectCode({
        ...dcCreateForm,
        code: dcCreateForm.code.trim(),
        name_vi: dcCreateForm.name_vi.trim(),
        name_en: dcCreateForm.name_en.trim(),
      }),
    onSuccess: (row) => {
      setShowDcCreate(false)
      setDcCreateForm(EMPTY_DEFECT_CODE_FORM)
      invalidateDefectCodes()
      setSelectedDcCode(row.code)
    },
  })

  const dcDetailRow = useMemo(() => {
    const found = (defectCodesQuery.data?.items ?? []).find((dc) => dc.code === selectedDcCode)
    return found ? projectDefectCodeRow(found) : null
  }, [defectCodesQuery.data?.items, selectedDcCode])

  const updateDcMutation = useMutation({
    mutationFn: (body: DefectCodeUpdateRequest) => {
      const action = dcDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateDefectCodeViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateDefectCodes(),
  })

  const deactivateDcMutation = useMutation({
    mutationFn: () => {
      const action = dcDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateDefectCodeViaAction(action)
    },
    onSuccess: () => {
      setConfirmDcDeactivate(false)
      invalidateDefectCodes()
    },
  })

  const planCreateStage = (stagesQuery.data ?? []).find(
    (s) => s.id === planCreateForm.inspection_stage_id,
  )
  const planCreateItem = (itemsQuery.data ?? []).find((i) => i.id === planCreateForm.item_id)
  const planCreateItemOptions = filterItemsForStage(
    itemsQuery.data ?? [],
    planCreateStage?.stage_group,
  )
  const planCreateRequiresRevision =
    isProductionStageGroup(planCreateStage?.stage_group) &&
    productionPlanRequiresRevision(itemTypeCodeOf(planCreateItem))

  const planCreateErrors = validateInspectionPlanCreateForm({
    code: planCreateForm.code,
    inspectionStageId: planCreateForm.inspection_stage_id,
    itemId: planCreateForm.item_id,
    samplingMethodId: planCreateForm.sampling_method_id,
    inspectionFrequencyId: planCreateForm.inspection_frequency_id,
    samplingParam: planCreateForm.sampling_param,
    stageGroup: planCreateStage?.stage_group,
    itemTypeCode: itemTypeCodeOf(planCreateItem),
    itemRevisionId: planCreateForm.item_revision_id,
  })

  const cmCreateErrors = validateCharacteristicMasterCreateForm({
    code: cmCreateForm.code,
    nameVi: cmCreateForm.name_vi,
    nameEn: cmCreateForm.name_en,
    characteristicCategoryId: cmCreateForm.characteristic_category_id,
    defaultCharType: cmCreateForm.default_char_type,
    defaultUom: cmCreateForm.default_uom,
  })

  const dcCreateErrors = validateDefectCodeCreateForm({
    code: dcCreateForm.code,
    nameVi: dcCreateForm.name_vi,
    nameEn: dcCreateForm.name_en,
    characteristicCategoryId: dcCreateForm.characteristic_category_id,
    defaultSeverity: dcCreateForm.default_severity,
  })

  return {
    tab,
    setTab,
    stages: stagesQuery.data ?? [],
    samplingMethods: samplingMethodsQuery.data ?? [],
    frequencies: frequenciesQuery.data ?? [],
    items: itemsQuery.data ?? [],
    planCreateItemOptions,
    planCreateRequiresRevision,
    planCreateStageGroup: planCreateStage?.stage_group ?? '',
    categories: categoriesQuery.data ?? [],

    // Checksheets
    planSearchInput,
    setPlanSearchInput,
    applyPlanSearch: () => {
      setPlanCursor(undefined)
      setPlanAppliedQuery(planSearchInput.trim())
    },
    planListState,
    planListError: plansQuery.error instanceof ApiError ? plansQuery.error : null,
    planRows,
    planHasMore: Boolean(plansQuery.data?.page.has_more),
    planLoadMore: () => {
      const next = plansQuery.data?.page.next_cursor
      if (next) setPlanCursor(next)
    },
    selectedPlanCode,
    selectPlan: (code: string) => {
      setSelectedPlanCode(code)
      setShowPlanCreate(false)
      setConfirmPlanDeactivate(false)
      setConfirmPlanRelease(false)
      setConfirmPlanObsolete(false)
      updatePlanMutation.reset()
      deactivatePlanMutation.reset()
      releasePlanMutation.reset()
      obsoletePlanMutation.reset()
    },
    planDetail: planDetailQuery.data ?? null,
    planDetailRow,
    planDetailLoading: planDetailQuery.isLoading,
    planRevisionOptions: revisionsQuery.data ?? [],
    showPlanCreate,
    openPlanCreate: () => {
      setSelectedPlanCode(null)
      setShowPlanCreate(true)
    },
    closePlanCreate: () => setShowPlanCreate(false),
    planCreateForm,
    setPlanCreateForm,
    planCreateItemCode,
    setPlanCreateItemCode,
    planCreateRevisionOptions: createRevisionsQuery.data ?? [],
    planCreateErrors,
    createPlan: () => createPlanMutation.mutate(),
    createPlanPending: createPlanMutation.isPending,
    createPlanError: createPlanMutation.error instanceof ApiError ? createPlanMutation.error : null,
    savePlanEdit: (body: InspectionPlanUpdateRequest) => updatePlanMutation.mutate(body),
    updatePlanPending: updatePlanMutation.isPending,
    updatePlanError: updatePlanMutation.error instanceof ApiError ? updatePlanMutation.error : null,
    updatePlanSuccess: updatePlanMutation.isSuccess,
    confirmPlanDeactivate,
    setConfirmPlanDeactivate,
    deactivatePlan: () => deactivatePlanMutation.mutate(),
    deactivatePlanState: resolveMutationUiState({
      confirmOpen: confirmPlanDeactivate,
      status: mutationStatus(deactivatePlanMutation),
      errorCode: deactivatePlanMutation.error instanceof ApiError ? deactivatePlanMutation.error.code : null,
    }),
    deactivatePlanError:
      deactivatePlanMutation.error instanceof ApiError ? deactivatePlanMutation.error : null,
    confirmPlanRelease,
    setConfirmPlanRelease,
    releasePlan: () => releasePlanMutation.mutate(),
    releasePlanState: resolveMutationUiState({
      confirmOpen: confirmPlanRelease,
      status: mutationStatus(releasePlanMutation),
      errorCode: releasePlanMutation.error instanceof ApiError ? releasePlanMutation.error.code : null,
    }),
    releasePlanError: releasePlanMutation.error instanceof ApiError ? releasePlanMutation.error : null,
    confirmPlanObsolete,
    setConfirmPlanObsolete,
    obsoletePlan: () => obsoletePlanMutation.mutate(),
    obsoletePlanState: resolveMutationUiState({
      confirmOpen: confirmPlanObsolete,
      status: mutationStatus(obsoletePlanMutation),
      errorCode: obsoletePlanMutation.error instanceof ApiError ? obsoletePlanMutation.error.code : null,
    }),
    obsoletePlanError:
      obsoletePlanMutation.error instanceof ApiError ? obsoletePlanMutation.error : null,

    // Characteristics
    cmSearchInput,
    setCmSearchInput,
    applyCmSearch: () => {
      setCmCursor(undefined)
      setCmAppliedQuery(cmSearchInput.trim())
    },
    cmListState,
    cmListError: charMastersQuery.error instanceof ApiError ? charMastersQuery.error : null,
    cmRows,
    cmHasMore: Boolean(charMastersQuery.data?.page.has_more),
    cmLoadMore: () => {
      const next = charMastersQuery.data?.page.next_cursor
      if (next) setCmCursor(next)
    },
    selectedCmCode,
    selectCm: (code: string) => {
      setSelectedCmCode(code)
      setShowCmCreate(false)
      setConfirmCmDeactivate(false)
      updateCmMutation.reset()
      deactivateCmMutation.reset()
    },
    cmDetailRow,
    showCmCreate,
    openCmCreate: () => {
      setSelectedCmCode(null)
      setShowCmCreate(true)
    },
    closeCmCreate: () => setShowCmCreate(false),
    cmCreateForm,
    setCmCreateForm,
    cmCreateErrors,
    createCm: () => createCmMutation.mutate(),
    createCmPending: createCmMutation.isPending,
    createCmError: createCmMutation.error instanceof ApiError ? createCmMutation.error : null,
    saveCmEdit: (body: CharacteristicMasterUpdateRequest) => updateCmMutation.mutate(body),
    updateCmPending: updateCmMutation.isPending,
    updateCmError: updateCmMutation.error instanceof ApiError ? updateCmMutation.error : null,
    updateCmSuccess: updateCmMutation.isSuccess,
    confirmCmDeactivate,
    setConfirmCmDeactivate,
    deactivateCm: () => deactivateCmMutation.mutate(),
    deactivateCmState: resolveMutationUiState({
      confirmOpen: confirmCmDeactivate,
      status: mutationStatus(deactivateCmMutation),
      errorCode: deactivateCmMutation.error instanceof ApiError ? deactivateCmMutation.error.code : null,
    }),
    deactivateCmError: deactivateCmMutation.error instanceof ApiError ? deactivateCmMutation.error : null,

    // Defect codes
    dcSearchInput,
    setDcSearchInput,
    applyDcSearch: () => {
      setDcCursor(undefined)
      setDcAppliedQuery(dcSearchInput.trim())
    },
    dcListState,
    dcListError: defectCodesQuery.error instanceof ApiError ? defectCodesQuery.error : null,
    dcRows,
    dcHasMore: Boolean(defectCodesQuery.data?.page.has_more),
    dcLoadMore: () => {
      const next = defectCodesQuery.data?.page.next_cursor
      if (next) setDcCursor(next)
    },
    selectedDcCode,
    selectDc: (code: string) => {
      setSelectedDcCode(code)
      setShowDcCreate(false)
      setConfirmDcDeactivate(false)
      updateDcMutation.reset()
      deactivateDcMutation.reset()
    },
    dcDetailRow,
    showDcCreate,
    openDcCreate: () => {
      setSelectedDcCode(null)
      setShowDcCreate(true)
    },
    closeDcCreate: () => setShowDcCreate(false),
    dcCreateForm,
    setDcCreateForm,
    dcCreateErrors,
    createDc: () => createDcMutation.mutate(),
    createDcPending: createDcMutation.isPending,
    createDcError: createDcMutation.error instanceof ApiError ? createDcMutation.error : null,
    saveDcEdit: (body: DefectCodeUpdateRequest) => updateDcMutation.mutate(body),
    updateDcPending: updateDcMutation.isPending,
    updateDcError: updateDcMutation.error instanceof ApiError ? updateDcMutation.error : null,
    updateDcSuccess: updateDcMutation.isSuccess,
    confirmDcDeactivate,
    setConfirmDcDeactivate,
    deactivateDc: () => deactivateDcMutation.mutate(),
    deactivateDcState: resolveMutationUiState({
      confirmOpen: confirmDcDeactivate,
      status: mutationStatus(deactivateDcMutation),
      errorCode: deactivateDcMutation.error instanceof ApiError ? deactivateDcMutation.error.code : null,
    }),
    deactivateDcError: deactivateDcMutation.error instanceof ApiError ? deactivateDcMutation.error : null,
  }
}
