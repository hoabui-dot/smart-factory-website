import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createLocation,
  deactivateLocationViaAction,
  getLocation,
  listCapacityUoms,
  listLocations,
  listLocationTree,
  listLocationTypes,
  listWarehouseCategories,
  updateLocationViaAction,
} from '../api/binLocationApi'
import {
  buildLocationLookups,
  projectLocationRow,
  resolveLocationListState,
  resolveMutationUiState,
  validateLocationCreateForm,
} from '../lib/locationProjection'
import type {
  LocationCreateRequest,
  LocationRecord,
  LocationUpdateRequest,
} from '../types/binLocation'

const LIST_KEY = ['wms01', 'locations'] as const
const DETAIL_KEY = ['wms01', 'location'] as const
const TREE_KEY = ['wms01', 'location-tree'] as const
const TYPES_KEY = ['wms01', 'location-types'] as const
const CATEGORIES_KEY = ['wms01', 'warehouse-categories'] as const
const UOMS_KEY = ['wms01', 'capacity-uoms'] as const

const EMPTY_CREATE_FORM: LocationCreateRequest = {
  code: '',
  parent_location_id: null,
  location_name: '',
  location_type_id: 0,
  warehouse_category_id: null,
  manager_user_id: null,
  barcode: null,
  capacity_qty: null,
  capacity_uom_id: null,
  is_active: true,
}

export function useBinLocation() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<LocationCreateRequest>(EMPTY_CREATE_FORM)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [accumulated, setAccumulated] = useState<Map<string, LocationRecord>>(new Map())

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, { q: appliedQuery, cursor }],
    queryFn: async () => {
      const page = await listLocations({ q: appliedQuery || undefined, cursor, limit: 50 })
      setAccumulated((prev) => {
        const next = cursor ? new Map(prev) : new Map()
        for (const item of page.items) next.set(item.code, item)
        return next
      })
      return page
    },
  })

  const detailQuery = useQuery({
    queryKey: [...DETAIL_KEY, selectedCode],
    queryFn: () => getLocation(selectedCode as string),
    enabled: Boolean(selectedCode),
  })

  const treeQuery = useQuery({ queryKey: TREE_KEY, queryFn: () => listLocationTree() })
  const typesQuery = useQuery({ queryKey: TYPES_KEY, queryFn: () => listLocationTypes() })
  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => listWarehouseCategories(),
  })
  const uomsQuery = useQuery({ queryKey: UOMS_KEY, queryFn: () => listCapacityUoms() })

  const invalidate = async () => {
    setAccumulated(new Map())
    setCursor(undefined)
    await queryClient.invalidateQueries({ queryKey: LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: DETAIL_KEY })
    await queryClient.invalidateQueries({ queryKey: TREE_KEY })
  }

  const listItems = useMemo(() => {
    if (accumulated.size > 0) return Array.from(accumulated.values())
    return listQuery.data?.items ?? []
  }, [accumulated, listQuery.data?.items])

  const lookups = useMemo(
    () =>
      buildLocationLookups({
        locations: [
          ...listItems,
          ...(treeQuery.data ?? []),
          ...(detailQuery.data ? [detailQuery.data] : []),
        ],
        locationTypes: typesQuery.data ?? [],
        warehouseCategories: categoriesQuery.data ?? [],
      }),
    [listItems, treeQuery.data, detailQuery.data, typesQuery.data, categoriesQuery.data],
  )

  const rows = useMemo(
    () => listItems.map((loc) => projectLocationRow(loc, lookups)),
    [listItems, lookups],
  )

  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveLocationListState({
    status:
      listQuery.isLoading || listQuery.isFetching
        ? 'loading'
        : listQuery.isError
          ? 'error'
          : 'success',
    itemCount: rows.length,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listError?.code ?? null,
  })

  const detailRow = detailQuery.data ? projectLocationRow(detailQuery.data, lookups) : null

  const createMutation = useMutation({
    mutationFn: () =>
      createLocation({
        ...createForm,
        code: createForm.code.trim(),
        location_name: createForm.location_name.trim(),
        parent_location_id: createForm.parent_location_id || null,
        warehouse_category_id: createForm.warehouse_category_id || null,
        manager_user_id: null,
        barcode: createForm.barcode?.trim() ? createForm.barcode.trim() : null,
        capacity_qty:
          createForm.capacity_qty == null || Number.isNaN(createForm.capacity_qty)
            ? null
            : createForm.capacity_qty,
        capacity_uom_id: createForm.capacity_uom_id || null,
      }),
    onSuccess: async (loc) => {
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE_FORM)
      await invalidate()
      setSelectedCode(loc.code)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: LocationUpdateRequest) => {
      const action = detailRow?.updateAction
      if (!action) {
        throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      }
      return updateLocationViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidate(),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.deactivateAction
      if (!action) {
        throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      }
      return deactivateLocationViaAction(action)
    },
    onSuccess: () => {
      setConfirmDeactivate(false)
      return invalidate()
    },
  })

  const createErrors = validateLocationCreateForm({
    code: createForm.code,
    locationName: createForm.location_name,
    locationTypeId: createForm.location_type_id,
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

  const parentOptions = useMemo(() => {
    const byId = new Map<number, { id: number; code: string; location_name: string }>()
    for (const loc of listItems) {
      byId.set(loc.id, { id: loc.id, code: loc.code, location_name: loc.location_name })
    }
    for (const loc of treeQuery.data ?? []) {
      byId.set(loc.id, { id: loc.id, code: loc.code, location_name: loc.location_name })
    }
    return Array.from(byId.values()).sort((a, b) => a.code.localeCompare(b.code))
  }, [listItems, treeQuery.data])

  return {
    searchInput,
    setSearchInput,
    applySearch: () => {
      setCursor(undefined)
      setAccumulated(new Map())
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
    selectLocation: (code: string | null) => {
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

    treeRoots: treeQuery.data ?? [],
    locationTypes: typesQuery.data ?? [],
    warehouseCategories: categoriesQuery.data ?? [],
    capacityUoms: uomsQuery.data ?? [],
    parentOptions,

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

    saveEdit: (body: LocationUpdateRequest) => updateMutation.mutate(body),
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
