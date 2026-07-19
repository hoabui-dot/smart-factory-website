import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createItem,
  deactivateItemViaAction,
  getItem,
  listItemCategories,
  listItems,
  listItemTypes,
  listUoms,
  updateItemViaAction,
} from '../api/itemMasterApi'
import {
  projectItemRow,
  resolveItemListState,
  resolveMutationUiState,
  validateItemCreateForm,
} from '../lib/itemProjection'
import type { ItemCreateRequest, ItemUpdateRequest } from '../types/itemMaster'

const LIST_KEY = ['mes01', 'items'] as const
const DETAIL_KEY = ['mes01', 'item'] as const
const ITEM_TYPES_KEY = ['mes01', 'item-types'] as const
const CATEGORIES_KEY = ['mes01', 'item-categories'] as const
const UOMS_KEY = ['mes01', 'uoms'] as const

const EMPTY_CREATE_FORM: ItemCreateRequest = {
  code: '',
  item_name: '',
  item_type_id: 0,
  category_id: 0,
  base_uom_id: 0,
  is_lot_tracked: false,
  is_serial_tracked: false,
  is_phantom: false,
  shelf_life_days: null,
  is_active: true,
}

export function useItemMaster() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<ItemCreateRequest>(EMPTY_CREATE_FORM)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listItems({ q: appliedQuery || undefined, cursor, limit: 50 }),
  })

  const detailQuery = useQuery({
    queryKey: [...DETAIL_KEY, selectedCode],
    queryFn: () => getItem(selectedCode as string),
    enabled: Boolean(selectedCode),
  })

  const itemTypesQuery = useQuery({ queryKey: ITEM_TYPES_KEY, queryFn: () => listItemTypes() })
  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => listItemCategories(),
  })
  const uomsQuery = useQuery({ queryKey: UOMS_KEY, queryFn: () => listUoms() })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: DETAIL_KEY })
  }

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectItemRow),
    [listQuery.data?.items],
  )

  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveItemListState({
    status: listQuery.isLoading || listQuery.isFetching ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: rows.length,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listError?.code ?? null,
  })

  const detailRow = detailQuery.data ? projectItemRow(detailQuery.data) : null

  const createMutation = useMutation({
    mutationFn: () =>
      createItem({
        ...createForm,
        code: createForm.code.trim(),
        item_name: createForm.item_name.trim(),
        shelf_life_days:
          createForm.shelf_life_days == null || Number.isNaN(createForm.shelf_life_days)
            ? null
            : createForm.shelf_life_days,
      }),
    onSuccess: async (item) => {
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE_FORM)
      await invalidate()
      setSelectedCode(item.code)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: ItemUpdateRequest) => {
      const action = detailRow?.updateAction
      if (!action) {
        throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      }
      return updateItemViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidate(),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.deactivateAction
      if (!action) {
        throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      }
      return deactivateItemViaAction(action)
    },
    onSuccess: () => {
      setConfirmDeactivate(false)
      return invalidate()
    },
  })

  const createErrors = validateItemCreateForm({
    code: createForm.code,
    itemName: createForm.item_name,
    itemTypeId: createForm.item_type_id,
    categoryId: createForm.category_id,
    baseUomId: createForm.base_uom_id,
  })

  const deactivateError =
    deactivateMutation.error instanceof ApiError ? deactivateMutation.error : null
  const deactivateState = resolveMutationUiState({
    confirmOpen: confirmDeactivate,
    status: deactivateMutation.isPending
      ? 'pending'
      : deactivateMutation.isSuccess
        ? 'success'
        : deactivateMutation.isError
          ? 'error'
          : 'idle',
    errorCode: deactivateError?.code ?? null,
  })

  return {
    searchInput,
    setSearchInput,
    applySearch: () => {
      setCursor(undefined)
      setAppliedQuery(searchInput.trim())
    },
    listState,
    listError,
    rows,
    hasMore: Boolean(listQuery.data?.page.has_more),
    loadMore: () => {
      const next = listQuery.data?.page.next_cursor
      if (next) setCursor(next)
    },
    selectedCode,
    selectItem: (code: string) => {
      setSelectedCode(code)
      setShowCreate(false)
      setConfirmDeactivate(false)
      deactivateMutation.reset()
      updateMutation.reset()
    },
    detail: detailQuery.data ?? null,
    detailRow,
    detailLoading: detailQuery.isLoading,
    detailError: detailQuery.error instanceof ApiError ? detailQuery.error : null,

    itemTypes: itemTypesQuery.data ?? [],
    itemTypesLoading: itemTypesQuery.isLoading,
    categories: categoriesQuery.data ?? [],
    categoriesLoading: categoriesQuery.isLoading,
    uoms: uomsQuery.data ?? [],
    uomsLoading: uomsQuery.isLoading,

    showCreate,
    openCreate: () => {
      setSelectedCode(null)
      setShowCreate(true)
    },
    closeCreate: () => setShowCreate(false),
    createForm,
    setCreateForm,
    createErrors,
    create: () => createMutation.mutate(),
    createPending: createMutation.isPending,
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,

    saveEdit: (body: ItemUpdateRequest) => updateMutation.mutate(body),
    updatePending: updateMutation.isPending,
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,
    updateSuccess: updateMutation.isSuccess,

    confirmDeactivate,
    setConfirmDeactivate,
    deactivate: () => deactivateMutation.mutate(),
    deactivateState,
    deactivateError,
  }
}
