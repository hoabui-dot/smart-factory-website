import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  cancelCustomerOrderViaAction,
  closeCustomerOrderViaAction,
  confirmCustomerOrderViaAction,
  createCustomerOrder,
  getCustomerOrder,
  listCustomerItems,
  listCustomerOrders,
  listCustomers,
  updateCustomerOrderViaAction,
} from '../api/customerOrderApi'
import {
  projectCustomerOrderRow,
  resolveListState,
  resolveMutationUiState,
  validateCancelReason,
  validateCustomerOrderCreate,
} from '../lib/customerOrderProjection'
import type {
  CustomerOrderCreateRequest,
  CustomerOrderLineCreate,
  CustomerOrderUpdateRequest,
} from '../types/customerOrder'

const ORDERS_KEY = ['mes10', 'customer-orders'] as const
const ORDER_DETAIL_KEY = ['mes10', 'customer-order'] as const

const EMPTY_LINE: CustomerOrderLineCreate = { code: '', customer_item_id: 0, ordered_qty: 1 }
const EMPTY_CREATE: CustomerOrderCreateRequest = {
  code: '',
  customer_id: 0,
  customer_po_no: '',
  received_date: '',
  requested_delivery_date: '',
  incoterm: 'FOB',
  lines: [{ ...EMPTY_LINE }],
}

function mutationStatus(m: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
}): 'idle' | 'pending' | 'success' | 'error' {
  if (m.isPending) return 'pending'
  if (m.isSuccess) return 'success'
  if (m.isError) return 'error'
  return 'idle'
}

export function useCustomerOrder() {
  const qc = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [createErrors, setCreateErrors] = useState<string[]>([])
  const [confirmConfirm, setConfirmConfirm] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelErrors, setCancelErrors] = useState<string[]>([])

  const listQuery = useQuery({
    queryKey: [...ORDERS_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listCustomerOrders({ q: appliedQuery || undefined, cursor, limit: 50 }),
  })
  const detailQuery = useQuery({
    queryKey: [...ORDER_DETAIL_KEY, selectedCode],
    queryFn: () => getCustomerOrder(selectedCode as string),
    enabled: Boolean(selectedCode),
  })
  const customersQuery = useQuery({
    queryKey: ['mes10', 'customers', 'lookup'],
    queryFn: () => listCustomers({ limit: 200 }),
  })
  const customerItemsQuery = useQuery({
    queryKey: ['mes10', 'customer-items', 'for-co', createForm.customer_id],
    queryFn: () => listCustomerItems({ customer_id: createForm.customer_id, limit: 200 }),
    enabled: createForm.customer_id > 0,
  })

  const detailRow = detailQuery.data ? projectCustomerOrderRow(detailQuery.data) : null

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ORDERS_KEY })
    await qc.invalidateQueries({ queryKey: ORDER_DETAIL_KEY })
  }

  const createMutation = useMutation({
    mutationFn: () => createCustomerOrder(createForm),
    onSuccess: async (row) => {
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
      setSelectedCode(row.code)
      await invalidate()
    },
  })
  const updateMutation = useMutation({
    mutationFn: (body: CustomerOrderUpdateRequest) => {
      const action = detailRow?.updateAction
      if (!action?.enabled) throw new ApiError('VALIDATION_ERROR', 'Update không khả dụng.', 400)
      return updateCustomerOrderViaAction(action, body)
    },
    onSuccess: invalidate,
  })
  const confirmMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.confirmAction
      if (!action?.enabled) throw new ApiError('VALIDATION_ERROR', 'Confirm không khả dụng.', 400)
      return confirmCustomerOrderViaAction(action)
    },
    onSuccess: async () => {
      setConfirmConfirm(false)
      await invalidate()
    },
  })
  const cancelMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.cancelAction
      if (!action?.enabled) throw new ApiError('VALIDATION_ERROR', 'Cancel không khả dụng.', 400)
      return cancelCustomerOrderViaAction(action, cancelReason.trim())
    },
    onSuccess: async () => {
      setShowCancel(false)
      setCancelReason('')
      await invalidate()
    },
  })
  const closeMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.closeAction
      if (!action?.enabled) throw new ApiError('VALIDATION_ERROR', 'Close không khả dụng.', 400)
      return closeCustomerOrderViaAction(action)
    },
    onSuccess: async () => {
      setConfirmClose(false)
      await invalidate()
    },
  })

  const listError = listQuery.error instanceof ApiError ? listQuery.error.code : null
  const listState = resolveListState({
    status: listQuery.isLoading ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: listQuery.data?.items.length ?? 0,
    hasQuery: Boolean(appliedQuery),
    errorCode: listError,
  })
  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectCustomerOrderRow),
    [listQuery.data?.items],
  )

  return {
    customers: customersQuery.data?.items ?? [],
    customerItems: customerItemsQuery.data?.items ?? [],
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
    selectOrder: setSelectedCode,
    detail: detailQuery.data ?? null,
    detailRow,
    showCreate,
    setShowCreate,
    createForm,
    setCreateForm,
    createErrors,
    submitCreate: () => {
      const errors = validateCustomerOrderCreate(createForm)
      setCreateErrors(errors)
      if (!errors.length) createMutation.mutate()
    },
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,
    submitUpdate: (body: CustomerOrderUpdateRequest) => updateMutation.mutate(body),
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,
    confirmConfirm,
    setConfirmConfirm,
    submitConfirm: () => confirmMutation.mutate(),
    confirmUi: resolveMutationUiState({
      confirmOpen: confirmConfirm,
      status: mutationStatus(confirmMutation),
      errorCode: confirmMutation.error instanceof ApiError ? confirmMutation.error.code : null,
    }),
    showCancel,
    setShowCancel,
    cancelReason,
    setCancelReason,
    cancelErrors,
    submitCancel: () => {
      const errors = validateCancelReason(cancelReason)
      setCancelErrors(errors)
      if (!errors.length) cancelMutation.mutate()
    },
    cancelError: cancelMutation.error instanceof ApiError ? cancelMutation.error : null,
    confirmClose,
    setConfirmClose,
    submitClose: () => closeMutation.mutate(),
    closeUi: resolveMutationUiState({
      confirmOpen: confirmClose,
      status: mutationStatus(closeMutation),
      errorCode: closeMutation.error instanceof ApiError ? closeMutation.error.code : null,
    }),
  }
}
