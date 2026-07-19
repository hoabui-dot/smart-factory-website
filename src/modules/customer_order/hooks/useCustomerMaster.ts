import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createCustomer,
  createCustomerItem,
  deactivateCustomerItemViaAction,
  deactivateCustomerViaAction,
  getCustomer,
  getCustomerItem,
  listCustomerItems,
  listCustomers,
  listItemOptions,
  updateCustomerItemViaAction,
  updateCustomerViaAction,
} from '../api/customerOrderApi'
import {
  projectCustomerItemRow,
  projectCustomerRow,
  resolveListState,
  resolveMutationUiState,
  validateCustomerCreate,
  validateCustomerItemCreate,
} from '../lib/customerOrderProjection'
import type {
  CustomerCreateRequest,
  CustomerItemCreateRequest,
  CustomerItemUpdateRequest,
  CustomerUpdateRequest,
} from '../types/customerOrder'

export type CustomerMasterTab = 'customers' | 'items'

const CUSTOMERS_KEY = ['mes10', 'customers'] as const
const CUSTOMER_DETAIL_KEY = ['mes10', 'customer'] as const
const ITEMS_KEY = ['mes10', 'customer-items'] as const
const ITEM_DETAIL_KEY = ['mes10', 'customer-item'] as const
const MES_ITEMS_KEY = ['mes10', 'mes-items'] as const

const EMPTY_CUSTOMER: CustomerCreateRequest = {
  code: '',
  customer_name: '',
  country_code: 'VN',
  iatf_required: false,
  ppap_level_default: '3',
  target_ppm: 0,
  contact_email: '',
  is_active: true,
}

const EMPTY_ITEM: CustomerItemCreateRequest = {
  code: '',
  customer_id: 0,
  item_id: 0,
  customer_part_name: '',
  characteristic_class: 'STANDARD',
  packaging_spec: '',
  is_active: true,
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

export function useCustomerMaster() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<CustomerMasterTab>('customers')
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CUSTOMER)
  const [createErrors, setCreateErrors] = useState<string[]>([])
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const [itemSearch, setItemSearch] = useState('')
  const [itemApplied, setItemApplied] = useState('')
  const [itemCursor, setItemCursor] = useState<string | undefined>()
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null)
  const [showItemCreate, setShowItemCreate] = useState(false)
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)
  const [itemErrors, setItemErrors] = useState<string[]>([])
  const [confirmItemDeactivate, setConfirmItemDeactivate] = useState(false)

  const customersQuery = useQuery({
    queryKey: [...CUSTOMERS_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listCustomers({ q: appliedQuery || undefined, cursor, limit: 50 }),
    enabled: tab === 'customers',
  })
  const detailQuery = useQuery({
    queryKey: [...CUSTOMER_DETAIL_KEY, selectedCode],
    queryFn: () => getCustomer(selectedCode as string),
    enabled: tab === 'customers' && Boolean(selectedCode),
  })
  const itemsQuery = useQuery({
    queryKey: [...ITEMS_KEY, { q: itemApplied, cursor: itemCursor }],
    queryFn: () => listCustomerItems({ q: itemApplied || undefined, cursor: itemCursor, limit: 50 }),
    enabled: tab === 'items',
  })
  const itemDetailQuery = useQuery({
    queryKey: [...ITEM_DETAIL_KEY, selectedItemCode],
    queryFn: () => getCustomerItem(selectedItemCode as string),
    enabled: tab === 'items' && Boolean(selectedItemCode),
  })
  const mesItemsQuery = useQuery({ queryKey: MES_ITEMS_KEY, queryFn: () => listItemOptions() })
  const allCustomersQuery = useQuery({
    queryKey: [...CUSTOMERS_KEY, 'lookup'],
    queryFn: () => listCustomers({ limit: 200 }),
  })

  const detailRow = detailQuery.data ? projectCustomerRow(detailQuery.data) : null
  const itemDetailRow = itemDetailQuery.data ? projectCustomerItemRow(itemDetailQuery.data) : null

  const invalidateCustomers = async () => {
    await qc.invalidateQueries({ queryKey: CUSTOMERS_KEY })
    await qc.invalidateQueries({ queryKey: CUSTOMER_DETAIL_KEY })
  }
  const invalidateItems = async () => {
    await qc.invalidateQueries({ queryKey: ITEMS_KEY })
    await qc.invalidateQueries({ queryKey: ITEM_DETAIL_KEY })
  }

  const createMutation = useMutation({
    mutationFn: () => createCustomer(createForm),
    onSuccess: async (row) => {
      setShowCreate(false)
      setCreateForm(EMPTY_CUSTOMER)
      setSelectedCode(row.code)
      await invalidateCustomers()
    },
  })
  const updateMutation = useMutation({
    mutationFn: (body: CustomerUpdateRequest) => {
      const action = detailRow?.updateAction
      if (!action?.enabled) throw new ApiError('VALIDATION_ERROR', 'Update không khả dụng.', 400)
      return updateCustomerViaAction(action, body)
    },
    onSuccess: invalidateCustomers,
  })
  const deactivateMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.deactivateAction
      if (!action?.enabled) throw new ApiError('VALIDATION_ERROR', 'Deactivate không khả dụng.', 400)
      return deactivateCustomerViaAction(action)
    },
    onSuccess: async () => {
      setConfirmDeactivate(false)
      await invalidateCustomers()
    },
  })

  const itemCreateMutation = useMutation({
    mutationFn: () => createCustomerItem(itemForm),
    onSuccess: async (row) => {
      setShowItemCreate(false)
      setItemForm(EMPTY_ITEM)
      setSelectedItemCode(row.code)
      await invalidateItems()
    },
  })
  const itemUpdateMutation = useMutation({
    mutationFn: (body: CustomerItemUpdateRequest) => {
      const action = itemDetailRow?.updateAction
      if (!action?.enabled) throw new ApiError('VALIDATION_ERROR', 'Update item không khả dụng.', 400)
      return updateCustomerItemViaAction(action, body)
    },
    onSuccess: invalidateItems,
  })
  const itemDeactivateMutation = useMutation({
    mutationFn: () => {
      const action = itemDetailRow?.deactivateAction
      if (!action?.enabled) throw new ApiError('VALIDATION_ERROR', 'Deactivate item không khả dụng.', 400)
      return deactivateCustomerItemViaAction(action)
    },
    onSuccess: async () => {
      setConfirmItemDeactivate(false)
      await invalidateItems()
    },
  })

  const listError = customersQuery.error instanceof ApiError ? customersQuery.error.code : null
  const listState = resolveListState({
    status: customersQuery.isLoading ? 'loading' : customersQuery.isError ? 'error' : 'success',
    itemCount: customersQuery.data?.items.length ?? 0,
    hasQuery: Boolean(appliedQuery),
    errorCode: listError,
  })
  const rows = useMemo(
    () => (customersQuery.data?.items ?? []).map(projectCustomerRow),
    [customersQuery.data?.items],
  )

  const itemListError = itemsQuery.error instanceof ApiError ? itemsQuery.error.code : null
  const itemListState = resolveListState({
    status: itemsQuery.isLoading ? 'loading' : itemsQuery.isError ? 'error' : 'success',
    itemCount: itemsQuery.data?.items.length ?? 0,
    hasQuery: Boolean(itemApplied),
    errorCode: itemListError,
  })
  const itemRows = useMemo(
    () => (itemsQuery.data?.items ?? []).map(projectCustomerItemRow),
    [itemsQuery.data?.items],
  )

  return {
    tab,
    setTab,
    customers: allCustomersQuery.data?.items ?? [],
    mesItems: mesItemsQuery.data ?? [],
    searchInput,
    setSearchInput,
    applySearch: () => {
      setCursor(undefined)
      setAppliedQuery(searchInput.trim())
    },
    listState,
    listError,
    rows,
    page: customersQuery.data?.page,
    loadMore: () => {
      if (customersQuery.data?.page.next_cursor) setCursor(customersQuery.data.page.next_cursor)
    },
    selectedCode,
    selectCustomer: setSelectedCode,
    detail: detailQuery.data ?? null,
    detailRow,
    showCreate,
    setShowCreate,
    createForm,
    setCreateForm,
    createErrors,
    submitCreate: () => {
      const errors = validateCustomerCreate(createForm)
      setCreateErrors(errors)
      if (!errors.length) createMutation.mutate()
    },
    createUi: resolveMutationUiState({
      confirmOpen: showCreate,
      status: mutationStatus(createMutation),
      errorCode: createMutation.error instanceof ApiError ? createMutation.error.code : null,
    }),
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,
    submitUpdate: (body: CustomerUpdateRequest) => updateMutation.mutate(body),
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,
    confirmDeactivate,
    setConfirmDeactivate,
    submitDeactivate: () => deactivateMutation.mutate(),
    deactivateUi: resolveMutationUiState({
      confirmOpen: confirmDeactivate,
      status: mutationStatus(deactivateMutation),
      errorCode: deactivateMutation.error instanceof ApiError ? deactivateMutation.error.code : null,
    }),

    itemSearch,
    setItemSearch,
    applyItemSearch: () => {
      setItemCursor(undefined)
      setItemApplied(itemSearch.trim())
    },
    itemListState,
    itemListError,
    itemRows,
    itemPage: itemsQuery.data?.page,
    loadMoreItems: () => {
      if (itemsQuery.data?.page.next_cursor) setItemCursor(itemsQuery.data.page.next_cursor)
    },
    selectedItemCode,
    selectItem: setSelectedItemCode,
    itemDetail: itemDetailQuery.data ?? null,
    itemDetailRow,
    showItemCreate,
    setShowItemCreate,
    itemForm,
    setItemForm,
    itemErrors,
    submitItemCreate: () => {
      const errors = validateCustomerItemCreate(itemForm)
      setItemErrors(errors)
      if (!errors.length) itemCreateMutation.mutate()
    },
    itemCreateError: itemCreateMutation.error instanceof ApiError ? itemCreateMutation.error : null,
    submitItemUpdate: (body: CustomerItemUpdateRequest) => itemUpdateMutation.mutate(body),
    itemUpdateError: itemUpdateMutation.error instanceof ApiError ? itemUpdateMutation.error : null,
    confirmItemDeactivate,
    setConfirmItemDeactivate,
    submitItemDeactivate: () => itemDeactivateMutation.mutate(),
  }
}
