import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  getLot,
  listExpiringLots,
  listItemOptions,
  listItemRevisionOptions,
  listLots,
  listSupplierOptions,
  printLotViaAction,
  updateLotViaAction,
} from '../api/lotApi'
import {
  buildLotLookups,
  projectLotRow,
  resolveLotListState,
  resolveMutationUiState,
  validatePrintForm,
} from '../lib/lotProjection'
import type { EnqueueLabelRequest, LotRecord, LotUpdateRequest } from '../types/lot'

const LIST_KEY = ['wms02', 'lots'] as const
const EXPIRING_KEY = ['wms02', 'lots-expiring'] as const
const DETAIL_KEY = ['wms02', 'lot'] as const
const ITEMS_KEY = ['wms02', 'item-options'] as const
const SUPPLIERS_KEY = ['wms02', 'supplier-options'] as const
const REVISIONS_KEY = ['wms02', 'item-revisions'] as const

export type LotView = 'all' | 'expiring'

const EMPTY_PRINT_FORM: EnqueueLabelRequest = { reason: '', copies: 1 }

export function useLotManagement() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<LotView>('all')
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [accumulated, setAccumulated] = useState<Map<string, LotRecord>>(new Map())
  const [showPrint, setShowPrint] = useState(false)
  const [printForm, setPrintForm] = useState<EnqueueLabelRequest>(EMPTY_PRINT_FORM)

  const listQuery = useQuery({
    queryKey: [...(view === 'expiring' ? EXPIRING_KEY : LIST_KEY), { q: appliedQuery, cursor }],
    queryFn: async () => {
      const fetcher = view === 'expiring' ? listExpiringLots : listLots
      const page = await fetcher({ q: appliedQuery || undefined, cursor, limit: 50 })
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
    queryFn: () => getLot(selectedCode as string),
    enabled: Boolean(selectedCode),
  })

  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })
  const suppliersQuery = useQuery({ queryKey: SUPPLIERS_KEY, queryFn: () => listSupplierOptions() })

  const detailItemCode = detailQuery.data?.item_code ?? null
  const revisionsQuery = useQuery({
    queryKey: [...REVISIONS_KEY, detailItemCode],
    queryFn: () => listItemRevisionOptions(detailItemCode as string),
    enabled: Boolean(detailItemCode),
  })

  const invalidate = async () => {
    setAccumulated(new Map())
    setCursor(undefined)
    await queryClient.invalidateQueries({ queryKey: LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: EXPIRING_KEY })
    await queryClient.invalidateQueries({ queryKey: DETAIL_KEY })
  }

  const listItems = useMemo(() => {
    if (accumulated.size > 0) return Array.from(accumulated.values())
    return listQuery.data?.items ?? []
  }, [accumulated, listQuery.data?.items])

  const lookups = useMemo(
    () =>
      buildLotLookups({
        items: itemsQuery.data ?? [],
        suppliers: suppliersQuery.data ?? [],
        revisions: revisionsQuery.data ?? [],
      }),
    [itemsQuery.data, suppliersQuery.data, revisionsQuery.data],
  )

  const rows = useMemo(() => listItems.map((lot) => projectLotRow(lot, lookups)), [listItems, lookups])

  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveLotListState({
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

  const detailRow = detailQuery.data ? projectLotRow(detailQuery.data, lookups) : null

  const updateMutation = useMutation({
    mutationFn: (body: LotUpdateRequest) => {
      const action = detailRow?.updateAction
      if (!action) {
        throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      }
      return updateLotViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidate(),
  })

  const printMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.printAction
      if (!action) {
        throw new ApiError('PERMISSION_DENIED', 'Print không được server cho phép.', 403)
      }
      const reason = printForm.reason?.trim()
      return printLotViaAction(action, {
        copies: printForm.copies,
        reason: reason ? reason : undefined,
      })
    },
    onSuccess: () => {
      setShowPrint(false)
      setPrintForm(EMPTY_PRINT_FORM)
    },
  })

  const printErrors = validatePrintForm({ copies: printForm.copies })
  const printError = printMutation.error instanceof ApiError ? printMutation.error : null
  const printState = resolveMutationUiState({
    confirmOpen: showPrint,
    status: printMutation.isPending
      ? 'pending'
      : printMutation.isSuccess
        ? 'success'
        : printMutation.isError
          ? 'error'
          : 'idle',
    errorCode: printError?.code ?? null,
  })

  return {
    view,
    setView: (next: LotView) => {
      setView(next)
      setCursor(undefined)
      setAccumulated(new Map())
    },

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
    selectLot: (code: string) => {
      setSelectedCode(code)
      setShowPrint(false)
      updateMutation.reset()
      printMutation.reset()
      setPrintForm(EMPTY_PRINT_FORM)
    },
    detail: detailQuery.data ?? null,
    detailRow,
    detailLoading: detailQuery.isLoading,
    detailError: detailQuery.error instanceof ApiError ? detailQuery.error : null,

    items: itemsQuery.data ?? [],
    suppliers: suppliersQuery.data ?? [],
    revisions: revisionsQuery.data ?? [],

    saveEdit: (body: LotUpdateRequest) => updateMutation.mutate(body),
    updatePending: updateMutation.isPending,
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,
    updateSuccess: updateMutation.isSuccess,

    showPrint,
    openPrint: () => {
      setPrintForm(EMPTY_PRINT_FORM)
      printMutation.reset()
      setShowPrint(true)
    },
    closePrint: () => setShowPrint(false),
    printForm,
    setPrintForm,
    printErrors,
    submitPrint: () => printMutation.mutate(),
    printState,
    printError,
    printResult: printMutation.data ?? null,
  }
}
