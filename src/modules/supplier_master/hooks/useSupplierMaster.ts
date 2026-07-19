import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createSupplier,
  createSupplierEvaluation,
  createSupplierItem,
  deactivateSupplierItemViaAction,
  deactivateSupplierViaAction,
  getSupplier,
  getSupplierEvaluation,
  getSupplierItem,
  listItemOptions,
  listSupplierEvaluations,
  listSupplierItems,
  listSupplierOptions,
  listSuppliers,
  updateSupplierItemViaAction,
  updateSupplierViaAction,
} from '../api/supplierApi'
import {
  buildSupplierLookups,
  projectSupplierEvaluationRow,
  projectSupplierItemRow,
  projectSupplierRow,
  resolveMutationUiState,
  resolveSupplierListState,
  validateSupplierCreateForm,
  validateSupplierEvaluationCreateForm,
  validateSupplierItemCreateForm,
} from '../lib/supplierProjection'
import type {
  SupplierCreateRequest,
  SupplierEvaluationCreateRequest,
  SupplierItemCreateRequest,
  SupplierItemUpdateRequest,
  SupplierUpdateRequest,
} from '../types/supplier'

export type SupplierTab = 'suppliers' | 'supplier_items' | 'supplier_evaluations'

const SUPPLIERS_KEY = ['wms06', 'suppliers'] as const
const SUPPLIER_DETAIL_KEY = ['wms06', 'supplier'] as const
const SUPPLIER_OPTIONS_KEY = ['wms06', 'supplier-options'] as const
const SUPPLIER_ITEMS_KEY = ['wms06', 'supplier-items'] as const
const SUPPLIER_ITEM_DETAIL_KEY = ['wms06', 'supplier-item'] as const
const SUPPLIER_EVALUATIONS_KEY = ['wms06', 'supplier-evaluations'] as const
const SUPPLIER_EVALUATION_DETAIL_KEY = ['wms06', 'supplier-evaluation'] as const
const ITEMS_KEY = ['wms06', 'items'] as const

const EMPTY_SUPPLIER_FORM: SupplierCreateRequest = {
  code: '',
  supplier_name: '',
  country_code: '',
  supplier_tier: 'TIER1',
  iatf_certified: false,
  iatf_cert_no: null,
  iatf_cert_expiry: null,
  iso9001_certified: false,
  contact_email: '',
  is_active: true,
}

const EMPTY_SUPPLIER_ITEM_FORM: SupplierItemCreateRequest = {
  code: '',
  supplier_id: 0,
  item_id: 0,
  unit_price: null,
  lead_time_days: 0,
  moq: null,
  is_default: false,
  is_active: true,
}

const EMPTY_SUPPLIER_EVALUATION_FORM: SupplierEvaluationCreateRequest = {
  code: '',
  supplier_id: 0,
  evaluation_period: '',
  quality_score: 0,
  delivery_score: 0,
  service_score: 0,
  evaluated_at: '',
  action_required: null,
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

export function useSupplierMaster() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<SupplierTab>('suppliers')

  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })
  const supplierOptionsQuery = useQuery({
    queryKey: SUPPLIER_OPTIONS_KEY,
    queryFn: () => listSupplierOptions(),
  })

  // ---- Suppliers ----
  const [supSearchInput, setSupSearchInput] = useState('')
  const [supAppliedQuery, setSupAppliedQuery] = useState('')
  const [supCursor, setSupCursor] = useState<string | undefined>()
  const [selectedSupplierCode, setSelectedSupplierCode] = useState<string | null>(null)
  const [showSupplierCreate, setShowSupplierCreate] = useState(false)
  const [supplierCreateForm, setSupplierCreateForm] =
    useState<SupplierCreateRequest>(EMPTY_SUPPLIER_FORM)
  const [confirmSupplierDeactivate, setConfirmSupplierDeactivate] = useState(false)

  const suppliersQuery = useQuery({
    queryKey: [...SUPPLIERS_KEY, { q: supAppliedQuery, cursor: supCursor }],
    queryFn: () => listSuppliers({ q: supAppliedQuery || undefined, cursor: supCursor, limit: 50 }),
    enabled: tab === 'suppliers' || tab === 'supplier_items' || tab === 'supplier_evaluations',
  })

  const supplierDetailQuery = useQuery({
    queryKey: [...SUPPLIER_DETAIL_KEY, selectedSupplierCode],
    queryFn: () => getSupplier(selectedSupplierCode as string),
    enabled: Boolean(selectedSupplierCode),
  })

  // ---- Supplier items ----
  const [siSearchInput, setSiSearchInput] = useState('')
  const [siAppliedQuery, setSiAppliedQuery] = useState('')
  const [siCursor, setSiCursor] = useState<string | undefined>()
  const [selectedSupplierItemCode, setSelectedSupplierItemCode] = useState<string | null>(null)
  const [showSupplierItemCreate, setShowSupplierItemCreate] = useState(false)
  const [supplierItemCreateForm, setSupplierItemCreateForm] =
    useState<SupplierItemCreateRequest>(EMPTY_SUPPLIER_ITEM_FORM)
  const [confirmSupplierItemDeactivate, setConfirmSupplierItemDeactivate] = useState(false)

  const supplierItemsQuery = useQuery({
    queryKey: [...SUPPLIER_ITEMS_KEY, { q: siAppliedQuery, cursor: siCursor }],
    queryFn: () =>
      listSupplierItems({ q: siAppliedQuery || undefined, cursor: siCursor, limit: 50 }),
    enabled: tab === 'supplier_items',
  })

  const supplierItemDetailQuery = useQuery({
    queryKey: [...SUPPLIER_ITEM_DETAIL_KEY, selectedSupplierItemCode],
    queryFn: () => getSupplierItem(selectedSupplierItemCode as string),
    enabled: Boolean(selectedSupplierItemCode),
  })

  // ---- Supplier evaluations (append-only) ----
  const [evSearchInput, setEvSearchInput] = useState('')
  const [evAppliedQuery, setEvAppliedQuery] = useState('')
  const [evCursor, setEvCursor] = useState<string | undefined>()
  const [selectedEvaluationCode, setSelectedEvaluationCode] = useState<string | null>(null)
  const [showEvaluationCreate, setShowEvaluationCreate] = useState(false)
  const [evaluationCreateForm, setEvaluationCreateForm] = useState<SupplierEvaluationCreateRequest>(
    EMPTY_SUPPLIER_EVALUATION_FORM,
  )

  const evaluationsQuery = useQuery({
    queryKey: [...SUPPLIER_EVALUATIONS_KEY, { q: evAppliedQuery, cursor: evCursor }],
    queryFn: () =>
      listSupplierEvaluations({ q: evAppliedQuery || undefined, cursor: evCursor, limit: 50 }),
    enabled: tab === 'supplier_evaluations',
  })

  const evaluationDetailQuery = useQuery({
    queryKey: [...SUPPLIER_EVALUATION_DETAIL_KEY, selectedEvaluationCode],
    queryFn: () => getSupplierEvaluation(selectedEvaluationCode as string),
    enabled: Boolean(selectedEvaluationCode),
  })

  const lookups = useMemo(
    () =>
      buildSupplierLookups({
        suppliers: supplierOptionsQuery.data ?? [],
        items: itemsQuery.data ?? [],
      }),
    [supplierOptionsQuery.data, itemsQuery.data],
  )

  const supplierRows = useMemo(
    () => (suppliersQuery.data?.items ?? []).map((row) => projectSupplierRow(row)),
    [suppliersQuery.data?.items],
  )
  const supplierItemRows = useMemo(
    () => (supplierItemsQuery.data?.items ?? []).map((row) => projectSupplierItemRow(row, lookups)),
    [supplierItemsQuery.data?.items, lookups],
  )
  const evaluationRows = useMemo(
    () =>
      (evaluationsQuery.data?.items ?? []).map((row) => projectSupplierEvaluationRow(row, lookups)),
    [evaluationsQuery.data?.items, lookups],
  )

  const supplierDetailRow = supplierDetailQuery.data ? projectSupplierRow(supplierDetailQuery.data) : null
  const supplierItemDetailRow = supplierItemDetailQuery.data
    ? projectSupplierItemRow(supplierItemDetailQuery.data, lookups)
    : null
  const evaluationDetailRow = evaluationDetailQuery.data
    ? projectSupplierEvaluationRow(evaluationDetailQuery.data, lookups)
    : null

  const supplierListState = resolveSupplierListState({
    status:
      suppliersQuery.isLoading || suppliersQuery.isFetching
        ? 'loading'
        : suppliersQuery.isError
          ? 'error'
          : 'success',
    itemCount: supplierRows.length,
    hasQuery: supAppliedQuery.trim().length > 0,
    errorCode: suppliersQuery.error instanceof ApiError ? suppliersQuery.error.code : null,
  })

  const supplierItemListState = resolveSupplierListState({
    status:
      supplierItemsQuery.isLoading || supplierItemsQuery.isFetching
        ? 'loading'
        : supplierItemsQuery.isError
          ? 'error'
          : 'success',
    itemCount: supplierItemRows.length,
    hasQuery: siAppliedQuery.trim().length > 0,
    errorCode: supplierItemsQuery.error instanceof ApiError ? supplierItemsQuery.error.code : null,
  })

  const evaluationListState = resolveSupplierListState({
    status:
      evaluationsQuery.isLoading || evaluationsQuery.isFetching
        ? 'loading'
        : evaluationsQuery.isError
          ? 'error'
          : 'success',
    itemCount: evaluationRows.length,
    hasQuery: evAppliedQuery.trim().length > 0,
    errorCode: evaluationsQuery.error instanceof ApiError ? evaluationsQuery.error.code : null,
  })

  const invalidateSuppliers = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY })
    void queryClient.invalidateQueries({ queryKey: SUPPLIER_DETAIL_KEY })
    void queryClient.invalidateQueries({ queryKey: SUPPLIER_OPTIONS_KEY })
  }, [queryClient])

  const invalidateSupplierItems = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_KEY })
    void queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_DETAIL_KEY })
  }, [queryClient])

  const invalidateEvaluations = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: SUPPLIER_EVALUATIONS_KEY })
    void queryClient.invalidateQueries({ queryKey: SUPPLIER_EVALUATION_DETAIL_KEY })
    void queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY })
    void queryClient.invalidateQueries({ queryKey: SUPPLIER_DETAIL_KEY })
  }, [queryClient])

  // ---- Supplier mutations ----
  const createSupplierMutation = useMutation({
    mutationFn: () =>
      createSupplier({
        ...supplierCreateForm,
        code: supplierCreateForm.code.trim(),
        supplier_name: supplierCreateForm.supplier_name.trim(),
        country_code: supplierCreateForm.country_code.trim().toUpperCase(),
        contact_email: supplierCreateForm.contact_email.trim(),
      }),
    onSuccess: (row) => {
      setShowSupplierCreate(false)
      setSupplierCreateForm(EMPTY_SUPPLIER_FORM)
      invalidateSuppliers()
      setSelectedSupplierCode(row.code)
    },
  })

  const updateSupplierMutation = useMutation({
    mutationFn: (body: SupplierUpdateRequest) => {
      const action = supplierDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateSupplierViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateSuppliers(),
  })

  const deactivateSupplierMutation = useMutation({
    mutationFn: () => {
      const action = supplierDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateSupplierViaAction(action)
    },
    onSuccess: () => {
      setConfirmSupplierDeactivate(false)
      invalidateSuppliers()
    },
  })

  // ---- Supplier item mutations ----
  const createSupplierItemMutation = useMutation({
    mutationFn: () =>
      createSupplierItem({
        ...supplierItemCreateForm,
        code: supplierItemCreateForm.code.trim(),
      }),
    onSuccess: (row) => {
      setShowSupplierItemCreate(false)
      setSupplierItemCreateForm(EMPTY_SUPPLIER_ITEM_FORM)
      invalidateSupplierItems()
      setSelectedSupplierItemCode(row.code)
    },
  })

  const updateSupplierItemMutation = useMutation({
    mutationFn: (body: SupplierItemUpdateRequest) => {
      const action = supplierItemDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateSupplierItemViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateSupplierItems(),
  })

  const deactivateSupplierItemMutation = useMutation({
    mutationFn: () => {
      const action = supplierItemDetailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateSupplierItemViaAction(action)
    },
    onSuccess: () => {
      setConfirmSupplierItemDeactivate(false)
      invalidateSupplierItems()
    },
  })

  // ---- Supplier evaluation mutation (create-only, append-only) ----
  const createEvaluationMutation = useMutation({
    mutationFn: () =>
      createSupplierEvaluation({
        ...evaluationCreateForm,
        code: evaluationCreateForm.code.trim(),
        evaluation_period: evaluationCreateForm.evaluation_period.trim(),
      }),
    onSuccess: (row) => {
      setShowEvaluationCreate(false)
      setEvaluationCreateForm(EMPTY_SUPPLIER_EVALUATION_FORM)
      invalidateEvaluations()
      setSelectedEvaluationCode(row.code)
    },
  })

  const supplierCreateErrors = validateSupplierCreateForm({
    code: supplierCreateForm.code,
    supplierName: supplierCreateForm.supplier_name,
    countryCode: supplierCreateForm.country_code,
    supplierTier: supplierCreateForm.supplier_tier,
    contactEmail: supplierCreateForm.contact_email,
  })

  const supplierItemCreateErrors = validateSupplierItemCreateForm({
    code: supplierItemCreateForm.code,
    supplierId: supplierItemCreateForm.supplier_id,
    itemId: supplierItemCreateForm.item_id,
    leadTimeDays: supplierItemCreateForm.lead_time_days,
  })

  const evaluationCreateErrors = validateSupplierEvaluationCreateForm({
    code: evaluationCreateForm.code,
    supplierId: evaluationCreateForm.supplier_id,
    evaluationPeriod: evaluationCreateForm.evaluation_period,
    qualityScore: evaluationCreateForm.quality_score,
    deliveryScore: evaluationCreateForm.delivery_score,
    serviceScore: evaluationCreateForm.service_score,
    evaluatedAt: evaluationCreateForm.evaluated_at,
  })

  return {
    tab,
    setTab,

    supplierOptions: supplierOptionsQuery.data ?? [],
    itemOptions: itemsQuery.data ?? [],

    // Suppliers
    supSearchInput,
    setSupSearchInput,
    applySupplierSearch: () => {
      setSupCursor(undefined)
      setSupAppliedQuery(supSearchInput.trim())
    },
    supplierListState,
    supplierListError: suppliersQuery.error instanceof ApiError ? suppliersQuery.error : null,
    supplierRows,
    supplierHasMore: Boolean(suppliersQuery.data?.page.has_more),
    supplierLoadMore: () => {
      const next = suppliersQuery.data?.page.next_cursor
      if (next) setSupCursor(next)
    },
    selectedSupplierCode,
    selectSupplier: (code: string) => {
      setSelectedSupplierCode(code)
      setShowSupplierCreate(false)
      setConfirmSupplierDeactivate(false)
      updateSupplierMutation.reset()
      deactivateSupplierMutation.reset()
    },
    supplierDetail: supplierDetailQuery.data ?? null,
    supplierDetailRow,
    supplierDetailLoading: supplierDetailQuery.isLoading,
    showSupplierCreate,
    openSupplierCreate: () => {
      setSelectedSupplierCode(null)
      setShowSupplierCreate(true)
    },
    closeSupplierCreate: () => setShowSupplierCreate(false),
    supplierCreateForm,
    setSupplierCreateForm,
    supplierCreateErrors,
    createSupplier: () => createSupplierMutation.mutate(),
    createSupplierPending: createSupplierMutation.isPending,
    createSupplierError:
      createSupplierMutation.error instanceof ApiError ? createSupplierMutation.error : null,
    saveSupplierEdit: (body: SupplierUpdateRequest) => updateSupplierMutation.mutate(body),
    updateSupplierPending: updateSupplierMutation.isPending,
    updateSupplierError:
      updateSupplierMutation.error instanceof ApiError ? updateSupplierMutation.error : null,
    updateSupplierSuccess: updateSupplierMutation.isSuccess,
    confirmSupplierDeactivate,
    setConfirmSupplierDeactivate,
    deactivateSupplier: () => deactivateSupplierMutation.mutate(),
    deactivateSupplierState: resolveMutationUiState({
      confirmOpen: confirmSupplierDeactivate,
      status: mutationStatus(deactivateSupplierMutation),
      errorCode:
        deactivateSupplierMutation.error instanceof ApiError
          ? deactivateSupplierMutation.error.code
          : null,
    }),
    deactivateSupplierError:
      deactivateSupplierMutation.error instanceof ApiError ? deactivateSupplierMutation.error : null,

    // Supplier items
    siSearchInput,
    setSiSearchInput,
    applySupplierItemSearch: () => {
      setSiCursor(undefined)
      setSiAppliedQuery(siSearchInput.trim())
    },
    supplierItemListState,
    supplierItemListError: supplierItemsQuery.error instanceof ApiError ? supplierItemsQuery.error : null,
    supplierItemRows,
    supplierItemHasMore: Boolean(supplierItemsQuery.data?.page.has_more),
    supplierItemLoadMore: () => {
      const next = supplierItemsQuery.data?.page.next_cursor
      if (next) setSiCursor(next)
    },
    selectedSupplierItemCode,
    selectSupplierItem: (code: string) => {
      setSelectedSupplierItemCode(code)
      setShowSupplierItemCreate(false)
      setConfirmSupplierItemDeactivate(false)
      updateSupplierItemMutation.reset()
      deactivateSupplierItemMutation.reset()
    },
    supplierItemDetail: supplierItemDetailQuery.data ?? null,
    supplierItemDetailRow,
    supplierItemDetailLoading: supplierItemDetailQuery.isLoading,
    showSupplierItemCreate,
    openSupplierItemCreate: () => {
      setSelectedSupplierItemCode(null)
      setShowSupplierItemCreate(true)
    },
    closeSupplierItemCreate: () => setShowSupplierItemCreate(false),
    supplierItemCreateForm,
    setSupplierItemCreateForm,
    supplierItemCreateErrors,
    createSupplierItem: () => createSupplierItemMutation.mutate(),
    createSupplierItemPending: createSupplierItemMutation.isPending,
    createSupplierItemError:
      createSupplierItemMutation.error instanceof ApiError ? createSupplierItemMutation.error : null,
    saveSupplierItemEdit: (body: SupplierItemUpdateRequest) => updateSupplierItemMutation.mutate(body),
    updateSupplierItemPending: updateSupplierItemMutation.isPending,
    updateSupplierItemError:
      updateSupplierItemMutation.error instanceof ApiError ? updateSupplierItemMutation.error : null,
    updateSupplierItemSuccess: updateSupplierItemMutation.isSuccess,
    confirmSupplierItemDeactivate,
    setConfirmSupplierItemDeactivate,
    deactivateSupplierItem: () => deactivateSupplierItemMutation.mutate(),
    deactivateSupplierItemState: resolveMutationUiState({
      confirmOpen: confirmSupplierItemDeactivate,
      status: mutationStatus(deactivateSupplierItemMutation),
      errorCode:
        deactivateSupplierItemMutation.error instanceof ApiError
          ? deactivateSupplierItemMutation.error.code
          : null,
    }),
    deactivateSupplierItemError:
      deactivateSupplierItemMutation.error instanceof ApiError
        ? deactivateSupplierItemMutation.error
        : null,

    // Supplier evaluations (append-only: create + list/detail only)
    evSearchInput,
    setEvSearchInput,
    applyEvaluationSearch: () => {
      setEvCursor(undefined)
      setEvAppliedQuery(evSearchInput.trim())
    },
    evaluationListState,
    evaluationListError: evaluationsQuery.error instanceof ApiError ? evaluationsQuery.error : null,
    evaluationRows,
    evaluationHasMore: Boolean(evaluationsQuery.data?.page.has_more),
    evaluationLoadMore: () => {
      const next = evaluationsQuery.data?.page.next_cursor
      if (next) setEvCursor(next)
    },
    selectedEvaluationCode,
    selectEvaluation: (code: string) => setSelectedEvaluationCode(code),
    evaluationDetail: evaluationDetailQuery.data ?? null,
    evaluationDetailRow,
    evaluationDetailLoading: evaluationDetailQuery.isLoading,
    showEvaluationCreate,
    openEvaluationCreate: () => {
      setSelectedEvaluationCode(null)
      setShowEvaluationCreate(true)
    },
    closeEvaluationCreate: () => setShowEvaluationCreate(false),
    evaluationCreateForm,
    setEvaluationCreateForm,
    evaluationCreateErrors,
    createEvaluation: () => createEvaluationMutation.mutate(),
    createEvaluationPending: createEvaluationMutation.isPending,
    createEvaluationError:
      createEvaluationMutation.error instanceof ApiError ? createEvaluationMutation.error : null,
  }
}
