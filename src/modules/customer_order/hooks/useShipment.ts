import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  acceptShipmentViaAction,
  addShipmentLineViaAction,
  cancelShipmentViaAction,
  createShipment,
  deliverShipmentViaAction,
  downloadCocViaAction,
  failShipmentViaAction,
  generateCocViaAction,
  getShipment,
  listCustomers,
  listShipments,
  removeShipmentLineViaAction,
  shipShipmentViaAction,
  signCocViaAction,
  updateShipmentViaAction,
} from '../api/customerOrderApi'
import {
  projectShipmentRow,
  resolveListState,
  resolveMutationUiState,
} from '../lib/customerOrderProjection'
import type { ShipmentCreateRequest, ShipmentLineCreateRequest } from '../types/customerOrder'

const SHIPS_KEY = ['mes10', 'shipments'] as const
const SHIP_DETAIL_KEY = ['mes10', 'shipment'] as const

const EMPTY_CREATE: ShipmentCreateRequest = {
  code: '',
  customer_id: 0,
  shipped_at: new Date().toISOString(),
  carrier: '',
  tracking_no: '',
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

function errorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null
}

export function useShipment() {
  const qc = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [lineForm, setLineForm] = useState<ShipmentLineCreateRequest>({
    finished_lot_code: '',
    qty: 1,
  })
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [failReason, setFailReason] = useState('')
  const [showFail, setShowFail] = useState(false)
  const [signFileId, setSignFileId] = useState(0)
  const [showSign, setShowSign] = useState(false)
  const [cocJobCode, setCocJobCode] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: [...SHIPS_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listShipments({ q: appliedQuery || undefined, cursor, limit: 50 }),
  })
  const detailQuery = useQuery({
    queryKey: [...SHIP_DETAIL_KEY, selectedCode],
    queryFn: () => getShipment(selectedCode as string),
    enabled: Boolean(selectedCode),
  })
  const customersQuery = useQuery({
    queryKey: ['mes10', 'customers', 'lookup'],
    queryFn: () => listCustomers({ limit: 200 }),
  })

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: SHIPS_KEY })
    await qc.invalidateQueries({ queryKey: SHIP_DETAIL_KEY })
  }

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectShipmentRow),
    [listQuery.data?.items],
  )
  const detailRow = useMemo(
    () => (detailQuery.data ? projectShipmentRow(detailQuery.data) : null),
    [detailQuery.data],
  )

  const createMutation = useMutation({
    mutationFn: createShipment,
    onSuccess: async (row) => {
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
      setSelectedCode(row.code)
      await invalidate()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({
      action,
      body,
    }: {
      action: NonNullable<ReturnType<typeof projectShipmentRow>['updateAction']>
      body: { carrier?: string; tracking_no?: string | null }
    }) => updateShipmentViaAction(action, body),
    onSuccess: invalidate,
  })
  const addLineMutation = useMutation({
    mutationFn: ({
      action,
      body,
    }: {
      action: NonNullable<ReturnType<typeof projectShipmentRow>['addLineAction']>
      body: ShipmentLineCreateRequest
    }) => addShipmentLineViaAction(action, body),
    onSuccess: async () => {
      setLineForm({ finished_lot_code: '', qty: 1 })
      await invalidate()
    },
  })
  const removeLineMutation = useMutation({
    mutationFn: removeShipmentLineViaAction,
    onSuccess: invalidate,
  })
  const cancelMutation = useMutation({
    mutationFn: cancelShipmentViaAction,
    onSuccess: async () => {
      setConfirmCancel(false)
      await invalidate()
    },
  })
  const shipMutation = useMutation({
    mutationFn: shipShipmentViaAction,
    onSuccess: invalidate,
  })
  const deliverMutation = useMutation({
    mutationFn: (action: NonNullable<ReturnType<typeof projectShipmentRow>['deliverAction']>) =>
      deliverShipmentViaAction(action, new Date().toISOString()),
    onSuccess: invalidate,
  })
  const acceptMutation = useMutation({
    mutationFn: (action: NonNullable<ReturnType<typeof projectShipmentRow>['acceptAction']>) =>
      acceptShipmentViaAction(action, new Date().toISOString()),
    onSuccess: invalidate,
  })
  const failMutation = useMutation({
    mutationFn: ({
      action,
      reason,
    }: {
      action: NonNullable<ReturnType<typeof projectShipmentRow>['failAction']>
      reason: string
    }) => failShipmentViaAction(action, reason),
    onSuccess: async () => {
      setShowFail(false)
      setFailReason('')
      await invalidate()
    },
  })
  const cocGenMutation = useMutation({
    mutationFn: generateCocViaAction,
    onSuccess: async (ref) => {
      setCocJobCode(ref.job?.code ?? ref.job_code ?? ref.code ?? null)
      await invalidate()
    },
  })
  const cocSignMutation = useMutation({
    mutationFn: ({
      action,
      fileId,
    }: {
      action: NonNullable<ReturnType<typeof projectShipmentRow>['cocSignAction']>
      fileId: number
    }) => signCocViaAction(action, fileId),
    onSuccess: async () => {
      setShowSign(false)
      setSignFileId(0)
      await invalidate()
    },
  })
  const cocDownloadMutation = useMutation({
    mutationFn: downloadCocViaAction,
    onSuccess: (res) => {
      if (res.download_url) window.open(res.download_url, '_blank', 'noopener,noreferrer')
    },
  })

  return {
    searchInput,
    setSearchInput,
    applySearch: () => {
      setCursor(undefined)
      setAppliedQuery(searchInput.trim())
    },
    cursor,
    setCursor,
    nextCursor: listQuery.data?.page.next_cursor ?? null,
    hasMore: Boolean(listQuery.data?.page.has_more),
    rows,
    listState: resolveListState({
      status: listQuery.isLoading ? 'loading' : listQuery.isError ? 'error' : 'success',
      itemCount: rows.length,
      hasQuery: Boolean(appliedQuery),
      errorCode: errorCode(listQuery.error),
    }),
    listError: errorCode(listQuery.error),
    selectedCode,
    selectShipment: setSelectedCode,
    detail: detailQuery.data ?? null,
    detailRow,
    customers: customersQuery.data?.items ?? [],
    showCreate,
    setShowCreate,
    createForm,
    setCreateForm,
    submitCreate: () => {
      if (!createForm.customer_id || !createForm.carrier.trim()) return
      createMutation.mutate({
        ...createForm,
        code: createForm.code?.trim() || undefined,
        shipped_at: createForm.shipped_at.includes('T')
          ? createForm.shipped_at
          : `${createForm.shipped_at}T00:00:00Z`,
      })
    },
    createUi: resolveMutationUiState({
      confirmOpen: false,
      status: mutationStatus(createMutation),
      errorCode: errorCode(createMutation.error),
    }),
    submitUpdate: (body: { carrier?: string; tracking_no?: string | null }) => {
      if (!detailRow?.updateAction || !detailRow.canUpdate) return
      updateMutation.mutate({ action: detailRow.updateAction, body })
    },
    lineForm,
    setLineForm,
    submitAddLine: () => {
      if (!detailRow?.addLineAction || !detailRow.canAddLine) return
      addLineMutation.mutate({ action: detailRow.addLineAction, body: lineForm })
    },
    submitRemoveLine: (href: string) => {
      const action = detailRow?.removeLineActions.find((a) => a.href === href)
      if (!action) return
      removeLineMutation.mutate(action)
    },
    confirmCancel,
    setConfirmCancel,
    submitCancel: () => {
      if (!detailRow?.cancelAction || !detailRow.canCancel) return
      cancelMutation.mutate(detailRow.cancelAction)
    },
    submitShip: () => {
      if (!detailRow?.shipAction || !detailRow.canShip) return
      shipMutation.mutate(detailRow.shipAction)
    },
    submitDeliver: () => {
      if (!detailRow?.deliverAction || !detailRow.canDeliver) return
      deliverMutation.mutate(detailRow.deliverAction)
    },
    submitAccept: () => {
      if (!detailRow?.acceptAction || !detailRow.canAccept) return
      acceptMutation.mutate(detailRow.acceptAction)
    },
    showFail,
    setShowFail,
    failReason,
    setFailReason,
    submitFail: () => {
      if (!detailRow?.failAction || !detailRow.canFail || !failReason.trim()) return
      failMutation.mutate({ action: detailRow.failAction, reason: failReason })
    },
    submitCocGenerate: () => {
      if (!detailRow?.cocGenerateAction || !detailRow.canCocGenerate) return
      cocGenMutation.mutate(detailRow.cocGenerateAction)
    },
    showSign,
    setShowSign,
    signFileId,
    setSignFileId,
    submitCocSign: () => {
      if (!detailRow?.cocSignAction || !detailRow.canCocSign || signFileId <= 0) return
      cocSignMutation.mutate({ action: detailRow.cocSignAction, fileId: signFileId })
    },
    submitCocDownload: () => {
      if (!detailRow?.cocDownloadAction || !detailRow.canCocDownload) return
      cocDownloadMutation.mutate(detailRow.cocDownloadAction)
    },
    cocJobCode,
  }
}
