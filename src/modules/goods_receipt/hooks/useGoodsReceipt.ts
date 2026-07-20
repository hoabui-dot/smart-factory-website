import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  arriveAsnViaAction,
  attachMillCertificateViaAction,
  authorizeUpload,
  cancelAsnViaAction,
  cancelGoodsReceiptViaAction,
  cancelPurchaseOrderViaAction,
  closePurchaseOrderViaAction,
  computeSha256Hex,
  createAsn,
  createPurchaseOrder,
  finalizeUpload,
  getAsn,
  getGoodsReceipt,
  getPurchaseOrder,
  listAsns,
  listGoodsReceipts,
  listItemOptions,
  listLocationOptions,
  listLotAttachments,
  listPurchaseOrders,
  listSupplierOptions,
  listUomOptions,
  startReceivingAsnViaAction,
  updateAsnViaAction,
  updateGoodsReceiptViaAction,
  updatePurchaseOrderViaAction,
  uploadFileToSignedTarget,
  OWNER_MODULE,
} from '../api/goodsReceiptApi'
import {
  buildGoodsReceiptLookups,
  projectAsnRow,
  projectAttachmentRow,
  projectGoodsReceiptRow,
  projectPurchaseOrderRow,
  resolveListState,
  resolveMutationUiState,
  validateAsnCreateForm,
  validateAttachCertificateForm,
  validateCancelReason,
  validatePurchaseOrderCreateForm,
} from '../lib/goodsReceiptProjection'
import type {
  AsnCreateRequest,
  AsnLineCreateInput,
  AsnRecord,
  AsnUpdateRequest,
  GoodsReceiptRecord,
  GoodsReceiptUpdateRequest,
  PurchaseOrderCreateRequest,
  PurchaseOrderLineCreateInput,
  PurchaseOrderUpdateRequest,
} from '../types/goodsReceipt'

export type GoodsReceiptTab = 'purchase_orders' | 'asns' | 'goods_receipts'
type AsnActionKind = 'arrive' | 'start_receiving' | 'cancel'

const PO_KEY = ['wms03', 'purchase-orders'] as const
const PO_DETAIL_KEY = ['wms03', 'purchase-order'] as const
const ASN_KEY = ['wms03', 'asns'] as const
const ASN_DETAIL_KEY = ['wms03', 'asn'] as const
const GRN_KEY = ['wms03', 'goods-receipts'] as const
const GRN_DETAIL_KEY = ['wms03', 'goods-receipt'] as const
const LOT_ATTACHMENTS_KEY = ['wms03', 'lot-attachments'] as const
const ITEMS_KEY = ['wms03', 'items'] as const
const SUPPLIERS_KEY = ['wms03', 'suppliers'] as const
const UOMS_KEY = ['wms03', 'uoms'] as const
const LOCATIONS_KEY = ['wms03', 'locations'] as const

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

const EMPTY_PO_LINE: PurchaseOrderLineCreateInput = {
  code: '',
  item_code: '',
  supplier_item_code: null,
  ordered_qty: 0,
  uom_code: '',
  requested_delivery_date: '',
}

const EMPTY_PO_FORM: PurchaseOrderCreateRequest = {
  code: '',
  supplier_code: '',
  order_date: '',
  expected_delivery_date: '',
  notes: null,
  lines: [{ ...EMPTY_PO_LINE }],
}

const EMPTY_ASN_LINE: AsnLineCreateInput = {
  code: '',
  purchase_order_line_code: null,
  item_code: '',
  supplier_lot: '',
  shipped_qty: 0,
  uom_code: '',
  manufacturing_date: null,
  expiry_date: null,
}

const EMPTY_ASN_FORM: AsnCreateRequest = {
  code: '',
  purchase_order_code: null,
  supplier_code: '',
  expected_arrival_at: '',
  vehicle_no: null,
  lines: [{ ...EMPTY_ASN_LINE }],
}

export function useGoodsReceipt() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<GoodsReceiptTab>('purchase_orders')

  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })
  const suppliersQuery = useQuery({ queryKey: SUPPLIERS_KEY, queryFn: () => listSupplierOptions() })
  const uomsQuery = useQuery({ queryKey: UOMS_KEY, queryFn: () => listUomOptions() })
  const locationsQuery = useQuery({ queryKey: LOCATIONS_KEY, queryFn: () => listLocationOptions() })

  const lookups = useMemo(
    () =>
      buildGoodsReceiptLookups({
        items: itemsQuery.data ?? [],
        suppliers: suppliersQuery.data ?? [],
        uoms: uomsQuery.data ?? [],
        locations: locationsQuery.data ?? [],
      }),
    [itemsQuery.data, suppliersQuery.data, uomsQuery.data, locationsQuery.data],
  )

  // ---- Purchase Orders ----
  const [poSearchInput, setPoSearchInput] = useState('')
  const [poAppliedQuery, setPoAppliedQuery] = useState('')
  const [poCursor, setPoCursor] = useState<string | undefined>()
  const [selectedPoCode, setSelectedPoCode] = useState<string | null>(null)
  const [showPoCreate, setShowPoCreate] = useState(false)
  const [poCreateForm, setPoCreateForm] = useState<PurchaseOrderCreateRequest>(EMPTY_PO_FORM)
  const [poConfirmAction, setPoConfirmAction] = useState<'cancel' | 'close' | null>(null)
  const [poCancelReason, setPoCancelReason] = useState('')

  const poListQuery = useQuery({
    queryKey: [...PO_KEY, { q: poAppliedQuery, cursor: poCursor }],
    queryFn: () => listPurchaseOrders({ q: poAppliedQuery || undefined, cursor: poCursor, limit: 50 }),
    enabled: tab === 'purchase_orders',
  })

  const poDetailQuery = useQuery({
    queryKey: [...PO_DETAIL_KEY, selectedPoCode],
    queryFn: () => getPurchaseOrder(selectedPoCode as string),
    enabled: Boolean(selectedPoCode),
  })

  const poRows = useMemo(
    () => (poListQuery.data?.items ?? []).map((row) => projectPurchaseOrderRow(row, lookups)),
    [poListQuery.data?.items, lookups],
  )
  const poDetailRow = poDetailQuery.data ? projectPurchaseOrderRow(poDetailQuery.data, lookups) : null

  const poListState = resolveListState({
    status: poListQuery.isLoading || poListQuery.isFetching ? 'loading' : poListQuery.isError ? 'error' : 'success',
    itemCount: poRows.length,
    hasQuery: poAppliedQuery.trim().length > 0,
    errorCode: poListQuery.error instanceof ApiError ? poListQuery.error.code : null,
  })

  const invalidatePo = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PO_KEY })
    void queryClient.invalidateQueries({ queryKey: PO_DETAIL_KEY })
  }, [queryClient])

  const createPoMutation = useMutation({
    mutationFn: () =>
      createPurchaseOrder({
        ...poCreateForm,
        code: poCreateForm.code.trim(),
        supplier_code: poCreateForm.supplier_code.trim(),
      }),
    onSuccess: (row) => {
      setShowPoCreate(false)
      setPoCreateForm(EMPTY_PO_FORM)
      invalidatePo()
      setSelectedPoCode(row.code)
    },
  })

  const updatePoMutation = useMutation({
    mutationFn: (body: PurchaseOrderUpdateRequest) => {
      const action = poDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updatePurchaseOrderViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidatePo(),
  })

  const cancelPoMutation = useMutation({
    mutationFn: () => {
      const action = poDetailRow?.cancelAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Cancel không được server cho phép.', 403)
      return cancelPurchaseOrderViaAction(action, { reason: poCancelReason.trim() })
    },
    onSuccess: () => {
      setPoConfirmAction(null)
      setPoCancelReason('')
      invalidatePo()
    },
  })

  const closePoMutation = useMutation({
    mutationFn: () => {
      const action = poDetailRow?.closeAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Close không được server cho phép.', 403)
      return closePurchaseOrderViaAction(action)
    },
    onSuccess: () => {
      setPoConfirmAction(null)
      invalidatePo()
    },
  })

  // ---- ASNs ----
  const [asnSearchInput, setAsnSearchInput] = useState('')
  const [asnAppliedQuery, setAsnAppliedQuery] = useState('')
  const [asnCursor, setAsnCursor] = useState<string | undefined>()
  const [selectedAsnCode, setSelectedAsnCode] = useState<string | null>(null)
  const [showAsnCreate, setShowAsnCreate] = useState(false)
  const [asnCreateForm, setAsnCreateForm] = useState<AsnCreateRequest>(EMPTY_ASN_FORM)
  const [asnConfirmAction, setAsnConfirmAction] = useState<AsnActionKind | null>(null)

  const asnListQuery = useQuery({
    queryKey: [...ASN_KEY, { q: asnAppliedQuery, cursor: asnCursor }],
    queryFn: () => listAsns({ q: asnAppliedQuery || undefined, cursor: asnCursor, limit: 50 }),
    enabled: tab === 'asns',
  })

  const asnDetailQuery = useQuery({
    queryKey: [...ASN_DETAIL_KEY, selectedAsnCode],
    queryFn: () => getAsn(selectedAsnCode as string),
    enabled: Boolean(selectedAsnCode),
  })

  const asnRows = useMemo(
    () => (asnListQuery.data?.items ?? []).map((row) => projectAsnRow(row, lookups)),
    [asnListQuery.data?.items, lookups],
  )
  const asnDetailRow = asnDetailQuery.data ? projectAsnRow(asnDetailQuery.data, lookups) : null

  const asnListState = resolveListState({
    status:
      asnListQuery.isLoading || asnListQuery.isFetching ? 'loading' : asnListQuery.isError ? 'error' : 'success',
    itemCount: asnRows.length,
    hasQuery: asnAppliedQuery.trim().length > 0,
    errorCode: asnListQuery.error instanceof ApiError ? asnListQuery.error.code : null,
  })

  const invalidateAsn = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ASN_KEY })
    void queryClient.invalidateQueries({ queryKey: ASN_DETAIL_KEY })
  }, [queryClient])

  const createAsnMutation = useMutation({
    mutationFn: () =>
      createAsn({
        ...asnCreateForm,
        code: asnCreateForm.code.trim(),
        supplier_code: asnCreateForm.supplier_code.trim(),
      }),
    onSuccess: (row: AsnRecord) => {
      setShowAsnCreate(false)
      setAsnCreateForm(EMPTY_ASN_FORM)
      invalidateAsn()
      setSelectedAsnCode(row.code)
    },
  })

  const updateAsnMutation = useMutation({
    mutationFn: (body: AsnUpdateRequest) => {
      const action = asnDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateAsnViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateAsn(),
  })

  const asnActionMutation = useMutation({
    mutationFn: (kind: AsnActionKind) => {
      if (kind === 'arrive') {
        const action = asnDetailRow?.arriveAction
        if (!action) throw new ApiError('PERMISSION_DENIED', 'Arrive không được server cho phép.', 403)
        return arriveAsnViaAction(action)
      }
      if (kind === 'start_receiving') {
        const action = asnDetailRow?.startReceivingAction
        if (!action) {
          throw new ApiError('PERMISSION_DENIED', 'Start receiving không được server cho phép.', 403)
        }
        return startReceivingAsnViaAction(action)
      }
      const action = asnDetailRow?.cancelAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Cancel không được server cho phép.', 403)
      return cancelAsnViaAction(action)
    },
    onSuccess: () => {
      setAsnConfirmAction(null)
      invalidateAsn()
    },
  })

  // ---- Goods Receipts ----
  const [grnSearchInput, setGrnSearchInput] = useState('')
  const [grnAppliedQuery, setGrnAppliedQuery] = useState('')
  const [grnCursor, setGrnCursor] = useState<string | undefined>()
  const [selectedGrnCode, setSelectedGrnCode] = useState<string | null>(null)
  const [confirmGrnCancel, setConfirmGrnCancel] = useState(false)
  const [grnCancelReason, setGrnCancelReason] = useState('')
  const [showAttachCert, setShowAttachCert] = useState(false)
  const [attachCertLotCode, setAttachCertLotCode] = useState('')
  const [attachCertLotId, setAttachCertLotId] = useState<number | null>(null)
  const [attachCertFile, setAttachCertFile] = useState<File | null>(null)
  const [uploadStage, setUploadStage] = useState<
    'idle' | 'checksum' | 'authorize' | 'upload' | 'finalize' | 'attach'
  >('idle')

  const grnListQuery = useQuery({
    queryKey: [...GRN_KEY, { q: grnAppliedQuery, cursor: grnCursor }],
    queryFn: () => listGoodsReceipts({ q: grnAppliedQuery || undefined, cursor: grnCursor, limit: 50 }),
    enabled: tab === 'goods_receipts',
  })

  const grnDetailQuery = useQuery({
    queryKey: [...GRN_DETAIL_KEY, selectedGrnCode],
    queryFn: () => getGoodsReceipt(selectedGrnCode as string),
    enabled: Boolean(selectedGrnCode),
  })

  const grnRows = useMemo(
    () => (grnListQuery.data?.items ?? []).map((row) => projectGoodsReceiptRow(row, lookups)),
    [grnListQuery.data?.items, lookups],
  )
  const grnDetailRow = grnDetailQuery.data ? projectGoodsReceiptRow(grnDetailQuery.data, lookups) : null

  const grnListState = resolveListState({
    status:
      grnListQuery.isLoading || grnListQuery.isFetching ? 'loading' : grnListQuery.isError ? 'error' : 'success',
    itemCount: grnRows.length,
    hasQuery: grnAppliedQuery.trim().length > 0,
    errorCode: grnListQuery.error instanceof ApiError ? grnListQuery.error.code : null,
  })

  const lotAttachmentsQuery = useQuery({
    queryKey: [...LOT_ATTACHMENTS_KEY, attachCertLotId],
    queryFn: () => listLotAttachments(attachCertLotId as number),
    enabled: Boolean(attachCertLotId),
  })
  const lotAttachmentRows = useMemo(
    () => (lotAttachmentsQuery.data?.items ?? []).map(projectAttachmentRow),
    [lotAttachmentsQuery.data?.items],
  )

  const invalidateGrn = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: GRN_KEY })
    void queryClient.invalidateQueries({ queryKey: GRN_DETAIL_KEY })
    void queryClient.invalidateQueries({ queryKey: LOT_ATTACHMENTS_KEY })
  }, [queryClient])

  const updateGrnMutation = useMutation({
    mutationFn: (body: GoodsReceiptUpdateRequest) => {
      const action = grnDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateGoodsReceiptViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateGrn(),
  })

  const cancelGrnMutation = useMutation({
    mutationFn: () => {
      const action = grnDetailRow?.cancelAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Cancel không được server cho phép.', 403)
      return cancelGoodsReceiptViaAction(action, { reason: grnCancelReason.trim() })
    },
    onSuccess: () => {
      setConfirmGrnCancel(false)
      setGrnCancelReason('')
      invalidateGrn()
    },
  })

  const attachCertMutation = useMutation({
    mutationFn: async (): Promise<GoodsReceiptRecord> => {
      const action = grnDetailRow?.attachMillCertificateAction
      if (!action) {
        throw new ApiError('PERMISSION_DENIED', 'Attach mill certificate không được server cho phép.', 403)
      }
      const file = attachCertFile
      if (!file) throw new ApiError('VALIDATION_ERROR', 'Chưa chọn file.', 400)
      const lotId = attachCertLotId
      if (!lotId) throw new ApiError('VALIDATION_ERROR', 'Chưa chọn lot.', 400)

      setUploadStage('checksum')
      const checksum = await computeSha256Hex(file)

      setUploadStage('authorize')
      const authorized = await authorizeUpload({
        file_purpose: 'BUSINESS_PDF',
        owner_module: OWNER_MODULE,
        entity_type: 'lot',
        entity_id: lotId,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        checksum_sha256: checksum,
      })

      setUploadStage('upload')
      const etag = await uploadFileToSignedTarget(authorized, file)

      setUploadStage('finalize')
      await finalizeUpload(authorized.upload_id, { storage_etag: etag ?? checksum, checksum })

      setUploadStage('attach')
      return attachMillCertificateViaAction(action, {
        file_id: authorized.upload_id,
        lot_code: attachCertLotCode.trim(),
      })
    },
    onSuccess: () => {
      setUploadStage('idle')
      setShowAttachCert(false)
      setAttachCertFile(null)
      invalidateGrn()
    },
    onError: () => setUploadStage('idle'),
  })

  const poCreateErrors = validatePurchaseOrderCreateForm({
    code: poCreateForm.code,
    supplierCode: poCreateForm.supplier_code,
    orderDate: poCreateForm.order_date,
    expectedDeliveryDate: poCreateForm.expected_delivery_date,
    lines: poCreateForm.lines.map((line) => ({
      code: line.code,
      itemCode: line.item_code,
      orderedQty: line.ordered_qty,
      uomCode: line.uom_code,
      requestedDeliveryDate: line.requested_delivery_date,
    })),
  })

  const asnCreateErrors = validateAsnCreateForm({
    code: asnCreateForm.code,
    supplierCode: asnCreateForm.supplier_code,
    expectedArrivalAt: asnCreateForm.expected_arrival_at,
    lines: asnCreateForm.lines.map((line) => ({
      code: line.code,
      itemCode: line.item_code,
      supplierLot: line.supplier_lot,
      shippedQty: line.shipped_qty,
      uomCode: line.uom_code,
    })),
  })

  const poCancelErrors = validateCancelReason(poCancelReason)
  const grnCancelErrors = validateCancelReason(grnCancelReason)
  const attachCertErrors = validateAttachCertificateForm({
    hasFile: Boolean(attachCertFile),
    lotCode: attachCertLotCode,
  })

  return {
    tab,
    setTab,
    itemOptions: itemsQuery.data ?? [],
    supplierOptions: suppliersQuery.data ?? [],
    uomOptions: uomsQuery.data ?? [],
    locationOptions: locationsQuery.data ?? [],

    // Purchase orders
    poSearchInput,
    setPoSearchInput,
    applyPoSearch: () => {
      setPoCursor(undefined)
      setPoAppliedQuery(poSearchInput.trim())
    },
    poListState,
    poListError: poListQuery.error instanceof ApiError ? poListQuery.error : null,
    poRows,
    poHasMore: Boolean(poListQuery.data?.page.has_more),
    poLoadMore: () => {
      const next = poListQuery.data?.page.next_cursor
      if (next) setPoCursor(next)
    },
    selectedPoCode,
    selectPo: (code: string | null) => {
      setSelectedPoCode(code)
      setShowPoCreate(false)
      setPoConfirmAction(null)
      setPoCancelReason('')
      updatePoMutation.reset()
      cancelPoMutation.reset()
      closePoMutation.reset()
    },
    poDetail: poDetailQuery.data ?? null,
    poDetailRow,
    poDetailLoading: poDetailQuery.isLoading,
    showPoCreate,
    openPoCreate: () => {
      setSelectedPoCode(null)
      setShowPoCreate(true)
    },
    closePoCreate: () => setShowPoCreate(false),
    poCreateForm,
    setPoCreateForm,
    addPoLine: () =>
      setPoCreateForm((f) => ({ ...f, lines: [...f.lines, { ...EMPTY_PO_LINE }] })),
    removePoLine: (idx: number) =>
      setPoCreateForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) })),
    poCreateErrors,
    createPo: () => createPoMutation.mutate(),
    createPoPending: createPoMutation.isPending,
    createPoError: createPoMutation.error instanceof ApiError ? createPoMutation.error : null,
    savePoEdit: (body: PurchaseOrderUpdateRequest) => updatePoMutation.mutate(body),
    updatePoPending: updatePoMutation.isPending,
    updatePoError: updatePoMutation.error instanceof ApiError ? updatePoMutation.error : null,
    updatePoSuccess: updatePoMutation.isSuccess,
    poConfirmAction,
    setPoConfirmAction,
    poCancelReason,
    setPoCancelReason,
    poCancelErrors,
    confirmCancelPo: () => cancelPoMutation.mutate(),
    cancelPoState: resolveMutationUiState({
      confirmOpen: poConfirmAction === 'cancel',
      status: mutationStatus(cancelPoMutation),
      errorCode: cancelPoMutation.error instanceof ApiError ? cancelPoMutation.error.code : null,
    }),
    cancelPoError: cancelPoMutation.error instanceof ApiError ? cancelPoMutation.error : null,
    confirmClosePo: () => closePoMutation.mutate(),
    closePoState: resolveMutationUiState({
      confirmOpen: poConfirmAction === 'close',
      status: mutationStatus(closePoMutation),
      errorCode: closePoMutation.error instanceof ApiError ? closePoMutation.error.code : null,
    }),
    closePoError: closePoMutation.error instanceof ApiError ? closePoMutation.error : null,

    // ASNs
    asnSearchInput,
    setAsnSearchInput,
    applyAsnSearch: () => {
      setAsnCursor(undefined)
      setAsnAppliedQuery(asnSearchInput.trim())
    },
    asnListState,
    asnListError: asnListQuery.error instanceof ApiError ? asnListQuery.error : null,
    asnRows,
    asnHasMore: Boolean(asnListQuery.data?.page.has_more),
    asnLoadMore: () => {
      const next = asnListQuery.data?.page.next_cursor
      if (next) setAsnCursor(next)
    },
    selectedAsnCode,
    selectAsn: (code: string | null) => {
      setSelectedAsnCode(code)
      setShowAsnCreate(false)
      setAsnConfirmAction(null)
      updateAsnMutation.reset()
      asnActionMutation.reset()
    },
    asnDetail: asnDetailQuery.data ?? null,
    asnDetailRow,
    asnDetailLoading: asnDetailQuery.isLoading,
    showAsnCreate,
    openAsnCreate: () => {
      setSelectedAsnCode(null)
      setShowAsnCreate(true)
    },
    closeAsnCreate: () => setShowAsnCreate(false),
    asnCreateForm,
    setAsnCreateForm,
    addAsnLine: () =>
      setAsnCreateForm((f) => ({ ...f, lines: [...f.lines, { ...EMPTY_ASN_LINE }] })),
    removeAsnLine: (idx: number) =>
      setAsnCreateForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) })),
    asnCreateErrors,
    createAsn: () => createAsnMutation.mutate(),
    createAsnPending: createAsnMutation.isPending,
    createAsnError: createAsnMutation.error instanceof ApiError ? createAsnMutation.error : null,
    saveAsnEdit: (body: AsnUpdateRequest) => updateAsnMutation.mutate(body),
    updateAsnPending: updateAsnMutation.isPending,
    updateAsnError: updateAsnMutation.error instanceof ApiError ? updateAsnMutation.error : null,
    updateAsnSuccess: updateAsnMutation.isSuccess,
    asnConfirmAction,
    setAsnConfirmAction,
    confirmAsnAction: (kind: AsnActionKind) => asnActionMutation.mutate(kind),
    asnActionState: (kind: AsnActionKind) =>
      resolveMutationUiState({
        confirmOpen: asnConfirmAction === kind,
        status: mutationStatus(asnActionMutation),
        errorCode: asnActionMutation.error instanceof ApiError ? asnActionMutation.error.code : null,
      }),
    asnActionError: asnActionMutation.error instanceof ApiError ? asnActionMutation.error : null,

    // Goods receipts
    grnSearchInput,
    setGrnSearchInput,
    applyGrnSearch: () => {
      setGrnCursor(undefined)
      setGrnAppliedQuery(grnSearchInput.trim())
    },
    grnListState,
    grnListError: grnListQuery.error instanceof ApiError ? grnListQuery.error : null,
    grnRows,
    grnHasMore: Boolean(grnListQuery.data?.page.has_more),
    grnLoadMore: () => {
      const next = grnListQuery.data?.page.next_cursor
      if (next) setGrnCursor(next)
    },
    selectedGrnCode,
    selectGrn: (code: string | null) => {
      setSelectedGrnCode(code)
      setConfirmGrnCancel(false)
      setGrnCancelReason('')
      setShowAttachCert(false)
      updateGrnMutation.reset()
      cancelGrnMutation.reset()
      attachCertMutation.reset()
    },
    grnDetail: grnDetailQuery.data ?? null,
    grnDetailRow,
    grnDetailLoading: grnDetailQuery.isLoading,
    saveGrnEdit: (body: GoodsReceiptUpdateRequest) => updateGrnMutation.mutate(body),
    updateGrnPending: updateGrnMutation.isPending,
    updateGrnError: updateGrnMutation.error instanceof ApiError ? updateGrnMutation.error : null,
    updateGrnSuccess: updateGrnMutation.isSuccess,
    confirmGrnCancel,
    setConfirmGrnCancel,
    grnCancelReason,
    setGrnCancelReason,
    grnCancelErrors,
    confirmCancelGrn: () => cancelGrnMutation.mutate(),
    cancelGrnState: resolveMutationUiState({
      confirmOpen: confirmGrnCancel,
      status: mutationStatus(cancelGrnMutation),
      errorCode: cancelGrnMutation.error instanceof ApiError ? cancelGrnMutation.error.code : null,
    }),
    cancelGrnError: cancelGrnMutation.error instanceof ApiError ? cancelGrnMutation.error : null,

    showAttachCert,
    openAttachCert: (lotCode: string, lotId: number) => {
      setAttachCertLotCode(lotCode)
      setAttachCertLotId(lotId)
      setAttachCertFile(null)
      attachCertMutation.reset()
      setShowAttachCert(true)
    },
    closeAttachCert: () => setShowAttachCert(false),
    attachCertLotCode,
    attachCertFile,
    setAttachCertFile,
    attachCertErrors,
    submitAttachCert: () => attachCertMutation.mutate(),
    attachCertPending: attachCertMutation.isPending,
    attachCertError: attachCertMutation.error instanceof ApiError ? attachCertMutation.error : null,
    attachCertSuccess: attachCertMutation.isSuccess,
    uploadStage,
    lotAttachmentRows,
    lotAttachmentsLoading: lotAttachmentsQuery.isLoading,
  }
}
