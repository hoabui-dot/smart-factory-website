import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  copyBomViaAction,
  createBom,
  deactivateBomViaAction,
  getBom,
  getBomTree,
  listBoms,
  listItemOptions,
  listUoms,
  obsoleteBomViaAction,
  releaseBomViaAction,
  updateBomViaAction,
} from '../api/bomApi'
import {
  buildBomLookups,
  projectBomLineRow,
  projectBomRow,
  resolveBomListState,
  resolveMutationUiState,
  validateBomCopyForm,
  validateBomCreateForm,
  validateBomObsoleteForm,
} from '../lib/bomProjection'
import type {
  BomCopyRequest,
  BomCreateRequest,
  BomObsoleteRequest,
  BomUpdateRequest,
} from '../types/bom'

const BOMS_KEY = ['mes02', 'boms'] as const
const BOM_DETAIL_KEY = ['mes02', 'bom'] as const
const BOM_TREE_KEY = ['mes02', 'bom-tree'] as const
const UOMS_KEY = ['mes02', 'uoms'] as const
const ITEMS_KEY = ['mes02', 'items'] as const

const EMPTY_CREATE_FORM: BomCreateRequest = {
  code: '',
  product_item_id: 0,
  version: 'v1.0',
  status: 'DRAFT',
  effective_from: '',
  effective_to: null,
}

const EMPTY_COPY_FORM: BomCopyRequest = {
  new_code: '',
  new_version: '',
  effective_from: '',
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

export function useBom() {
  const queryClient = useQueryClient()

  const uomsQuery = useQuery({ queryKey: UOMS_KEY, queryFn: () => listUoms() })
  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })

  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<BomCreateRequest>(EMPTY_CREATE_FORM)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmRelease, setConfirmRelease] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const [copyForm, setCopyForm] = useState<BomCopyRequest>(EMPTY_COPY_FORM)
  const [showObsolete, setShowObsolete] = useState(false)
  const [obsoleteEffectiveTo, setObsoleteEffectiveTo] = useState('')
  const [showTree, setShowTree] = useState(false)

  const listQuery = useQuery({
    queryKey: [...BOMS_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listBoms({ q: appliedQuery || undefined, cursor, limit: 50 }),
  })

  const detailQuery = useQuery({
    queryKey: [...BOM_DETAIL_KEY, selectedCode],
    queryFn: () => getBom(selectedCode as string),
    enabled: Boolean(selectedCode),
  })

  const treeQuery = useQuery({
    queryKey: [...BOM_TREE_KEY, selectedCode],
    queryFn: () => getBomTree(selectedCode as string),
    enabled: Boolean(selectedCode) && showTree,
  })

  const lookups = useMemo(
    () => buildBomLookups({ uoms: uomsQuery.data ?? [], items: itemsQuery.data ?? [] }),
    [uomsQuery.data, itemsQuery.data],
  )

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map((bh) => projectBomRow(bh, lookups)),
    [listQuery.data?.items, lookups],
  )

  const detailRow = detailQuery.data ? projectBomRow(detailQuery.data, lookups) : null
  const lineRows = useMemo(
    () => (detailQuery.data?.lines ?? []).map((line) => projectBomLineRow(line, lookups)),
    [detailQuery.data?.lines, lookups],
  )

  const listError = listQuery.error instanceof ApiError ? listQuery.error : null
  const listState = resolveBomListState({
    status: listQuery.isLoading || listQuery.isFetching ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: rows.length,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listError?.code ?? null,
  })

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: BOMS_KEY })
    void queryClient.invalidateQueries({ queryKey: BOM_DETAIL_KEY })
    void queryClient.invalidateQueries({ queryKey: BOM_TREE_KEY })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: () =>
      createBom({
        ...createForm,
        code: createForm.code.trim(),
        version: createForm.version.trim(),
      }),
    onSuccess: (bh) => {
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE_FORM)
      invalidate()
      setSelectedCode(bh.code)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: BomUpdateRequest) => {
      const action = detailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateBomViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidate(),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.deactivateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      return deactivateBomViaAction(action)
    },
    onSuccess: () => {
      setConfirmDeactivate(false)
      invalidate()
    },
  })

  const copyMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.copyAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Copy không được server cho phép.', 403)
      return copyBomViaAction(action, {
        ...copyForm,
        new_code: copyForm.new_code.trim(),
        new_version: copyForm.new_version.trim(),
      })
    },
    onSuccess: (detail) => {
      setShowCopy(false)
      setCopyForm(EMPTY_COPY_FORM)
      invalidate()
      setSelectedCode(detail.code)
    },
  })

  const releaseMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.releaseAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Release không được server cho phép.', 403)
      return releaseBomViaAction(action)
    },
    onSuccess: () => {
      setConfirmRelease(false)
      invalidate()
    },
  })

  const obsoleteMutation = useMutation({
    mutationFn: () => {
      const action = detailRow?.obsoleteAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Obsolete không được server cho phép.', 403)
      const body: BomObsoleteRequest = { effective_to: obsoleteEffectiveTo }
      return obsoleteBomViaAction(action, body)
    },
    onSuccess: () => {
      setShowObsolete(false)
      invalidate()
    },
  })

  const createErrors = validateBomCreateForm({
    code: createForm.code,
    productItemId: createForm.product_item_id,
    version: createForm.version,
    status: createForm.status,
    effectiveFrom: createForm.effective_from,
  })

  const copyErrors = validateBomCopyForm({
    newCode: copyForm.new_code,
    newVersion: copyForm.new_version,
    effectiveFrom: copyForm.effective_from,
  })

  const obsoleteErrors = validateBomObsoleteForm({ effectiveTo: obsoleteEffectiveTo })

  return {
    items: itemsQuery.data ?? [],
    uoms: uomsQuery.data ?? [],

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
    selectBom: (code: string) => {
      setSelectedCode(code)
      setShowCreate(false)
      setShowCopy(false)
      setShowObsolete(false)
      setShowTree(false)
      setConfirmDeactivate(false)
      setConfirmRelease(false)
      updateMutation.reset()
      deactivateMutation.reset()
      copyMutation.reset()
      releaseMutation.reset()
      obsoleteMutation.reset()
    },
    detail: detailQuery.data ?? null,
    detailRow,
    detailLoading: detailQuery.isLoading,
    lineRows,

    showTree,
    toggleTree: () => setShowTree((v) => !v),
    tree: treeQuery.data ?? null,
    treeLoading: treeQuery.isLoading,

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

    saveEdit: (body: BomUpdateRequest) => updateMutation.mutate(body),
    updatePending: updateMutation.isPending,
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,
    updateSuccess: updateMutation.isSuccess,

    confirmDeactivate,
    setConfirmDeactivate,
    deactivate: () => deactivateMutation.mutate(),
    deactivateState: resolveMutationUiState({
      confirmOpen: confirmDeactivate,
      status: mutationStatus(deactivateMutation),
      errorCode: deactivateMutation.error instanceof ApiError ? deactivateMutation.error.code : null,
    }),
    deactivateError: deactivateMutation.error instanceof ApiError ? deactivateMutation.error : null,

    showCopy,
    openCopy: () => setShowCopy(true),
    closeCopy: () => setShowCopy(false),
    copyForm,
    setCopyForm,
    copyErrors,
    copyBom: () => copyMutation.mutate(),
    copyPending: copyMutation.isPending,
    copyError: copyMutation.error instanceof ApiError ? copyMutation.error : null,

    confirmRelease,
    setConfirmRelease,
    releaseBom: () => releaseMutation.mutate(),
    releaseState: resolveMutationUiState({
      confirmOpen: confirmRelease,
      status: mutationStatus(releaseMutation),
      errorCode: releaseMutation.error instanceof ApiError ? releaseMutation.error.code : null,
    }),
    releaseError: releaseMutation.error instanceof ApiError ? releaseMutation.error : null,

    showObsolete,
    openObsolete: () => setShowObsolete(true),
    closeObsolete: () => setShowObsolete(false),
    obsoleteEffectiveTo,
    setObsoleteEffectiveTo,
    obsoleteErrors,
    obsoleteBom: () => obsoleteMutation.mutate(),
    obsoletePending: obsoleteMutation.isPending,
    obsoleteError: obsoleteMutation.error instanceof ApiError ? obsoleteMutation.error : null,
    obsoleteSuccess: obsoleteMutation.isSuccess,
  }
}
