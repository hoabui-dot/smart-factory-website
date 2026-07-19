import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  approvePpapViaAction,
  createDocument,
  createDocumentRevision,
  createPpapSubmission,
  customerReviewPpapViaAction,
  deactivateDocumentViaAction,
  getDocument,
  getDocumentRevision,
  getPpapSubmission,
  interimApprovePpapViaAction,
  listCustomerOptions,
  listDocumentRevisions,
  listDocumentTypes,
  listDocuments,
  listItemOptions,
  listPpapSubmissions,
  preparePpapViaAction,
  rejectPpapViaAction,
  rejectRevisionViaAction,
  releaseRevisionViaAction,
  obsoleteRevisionViaAction,
  submitPpapViaAction,
  submitRevisionViaAction,
  updateDocumentViaAction,
  updatePpapViaAction,
} from '../api/documentApi'
import {
  projectDocumentRow,
  projectPpapRow,
  projectRevisionRow,
  resolveListState,
  resolveMutationUiState,
  validateDocumentCreateForm,
  validatePpapCreateForm,
  validateReason,
  validateReleaseFileId,
  validateRevisionCreateForm,
} from '../lib/documentProjection'
import type {
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentRevisionCreateRequest,
  PpapCreateRequest,
  PpapUpdateRequest,
} from '../types/document'

export type DocumentTab = 'documents' | 'ppap'

const DOCS_KEY = ['qms04', 'documents'] as const
const DOC_DETAIL_KEY = ['qms04', 'document'] as const
const REVS_KEY = ['qms04', 'revisions'] as const
const REV_DETAIL_KEY = ['qms04', 'revision'] as const
const PPAPS_KEY = ['qms04', 'ppaps'] as const
const PPAP_DETAIL_KEY = ['qms04', 'ppap'] as const
const DOC_TYPES_KEY = ['qms04', 'doc-types'] as const
const ITEMS_KEY = ['qms04', 'items'] as const
const CUSTOMERS_KEY = ['qms04', 'customers'] as const

const EMPTY_DOC_CREATE: DocumentCreateRequest = {
  code: '',
  doc_title: '',
  doc_type_id: 0,
  owner_id: 0,
  related_item_id: null,
  related_customer_id: null,
  is_active: true,
}

const EMPTY_REV_CREATE: DocumentRevisionCreateRequest = {
  code: '',
  file_id: null,
  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: null,
}

const EMPTY_PPAP_CREATE: PpapCreateRequest = {
  code: '',
  customer_id: 0,
  item_id: 0,
  ppap_level: '3',
  submission_type: 'INITIAL',
  notes: '',
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

function errorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null
}

export function useDocument() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<DocumentTab>('documents')

  const docTypesQuery = useQuery({ queryKey: DOC_TYPES_KEY, queryFn: () => listDocumentTypes() })
  const itemsQuery = useQuery({ queryKey: ITEMS_KEY, queryFn: () => listItemOptions() })
  const customersQuery = useQuery({ queryKey: CUSTOMERS_KEY, queryFn: () => listCustomerOptions() })

  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedDocCode, setSelectedDocCode] = useState<string | null>(null)
  const [selectedRevCode, setSelectedRevCode] = useState<string | null>(null)
  const [showDocCreate, setShowDocCreate] = useState(false)
  const [docCreateForm, setDocCreateForm] = useState<DocumentCreateRequest>(EMPTY_DOC_CREATE)
  const [docCreateErrors, setDocCreateErrors] = useState<string[]>([])
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const [showRevCreate, setShowRevCreate] = useState(false)
  const [revCreateForm, setRevCreateForm] = useState<DocumentRevisionCreateRequest>(EMPTY_REV_CREATE)
  const [revCreateErrors, setRevCreateErrors] = useState<string[]>([])
  const [confirmSubmitRev, setConfirmSubmitRev] = useState(false)
  const [showRelease, setShowRelease] = useState(false)
  const [releaseFileId, setReleaseFileId] = useState(0)
  const [releaseErrors, setReleaseErrors] = useState<string[]>([])
  const [showRejectRev, setShowRejectRev] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectErrors, setRejectErrors] = useState<string[]>([])
  const [showObsolete, setShowObsolete] = useState(false)
  const [obsoleteReason, setObsoleteReason] = useState('')
  const [obsoleteErrors, setObsoleteErrors] = useState<string[]>([])

  const [ppapSearchInput, setPpapSearchInput] = useState('')
  const [ppapAppliedQuery, setPpapAppliedQuery] = useState('')
  const [ppapCursor, setPpapCursor] = useState<string | undefined>()
  const [selectedPpapCode, setSelectedPpapCode] = useState<string | null>(null)
  const [showPpapCreate, setShowPpapCreate] = useState(false)
  const [ppapCreateForm, setPpapCreateForm] = useState<PpapCreateRequest>(EMPTY_PPAP_CREATE)
  const [ppapCreateErrors, setPpapCreateErrors] = useState<string[]>([])
  const [confirmPrepare, setConfirmPrepare] = useState(false)
  const [confirmSubmitPpap, setConfirmSubmitPpap] = useState(false)
  const [confirmReview, setConfirmReview] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [confirmInterim, setConfirmInterim] = useState(false)
  const [confirmRejectPpap, setConfirmRejectPpap] = useState(false)

  const docsQuery = useQuery({
    queryKey: [...DOCS_KEY, { q: appliedQuery, cursor }],
    queryFn: () => listDocuments({ q: appliedQuery || undefined, cursor, limit: 50 }),
    enabled: tab === 'documents',
  })

  const docDetailQuery = useQuery({
    queryKey: [...DOC_DETAIL_KEY, selectedDocCode],
    queryFn: () => getDocument(selectedDocCode as string),
    enabled: tab === 'documents' && Boolean(selectedDocCode),
  })

  const revsQuery = useQuery({
    queryKey: [...REVS_KEY, selectedDocCode],
    queryFn: () => listDocumentRevisions(selectedDocCode as string, { limit: 50 }),
    enabled: tab === 'documents' && Boolean(selectedDocCode),
  })

  const revDetailQuery = useQuery({
    queryKey: [...REV_DETAIL_KEY, selectedDocCode, selectedRevCode],
    queryFn: () => getDocumentRevision(selectedDocCode as string, selectedRevCode as string),
    enabled: tab === 'documents' && Boolean(selectedDocCode) && Boolean(selectedRevCode),
  })

  const ppapsQuery = useQuery({
    queryKey: [...PPAPS_KEY, { q: ppapAppliedQuery, cursor: ppapCursor }],
    queryFn: () => listPpapSubmissions({ q: ppapAppliedQuery || undefined, cursor: ppapCursor, limit: 50 }),
    enabled: tab === 'ppap',
  })

  const ppapDetailQuery = useQuery({
    queryKey: [...PPAP_DETAIL_KEY, selectedPpapCode],
    queryFn: () => getPpapSubmission(selectedPpapCode as string),
    enabled: tab === 'ppap' && Boolean(selectedPpapCode),
  })

  const invalidateDocs = async () => {
    await queryClient.invalidateQueries({ queryKey: DOCS_KEY })
    await queryClient.invalidateQueries({ queryKey: DOC_DETAIL_KEY })
    await queryClient.invalidateQueries({ queryKey: REVS_KEY })
    await queryClient.invalidateQueries({ queryKey: REV_DETAIL_KEY })
  }

  const invalidatePpaps = async () => {
    await queryClient.invalidateQueries({ queryKey: PPAPS_KEY })
    await queryClient.invalidateQueries({ queryKey: PPAP_DETAIL_KEY })
  }

  const createDocMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: async (row) => {
      setShowDocCreate(false)
      setDocCreateForm(EMPTY_DOC_CREATE)
      setSelectedDocCode(row.code)
      await invalidateDocs()
    },
  })

  const updateDocMutation = useMutation({
    mutationFn: ({ action, body }: { action: NonNullable<ReturnType<typeof projectDocumentRow>['updateAction']>; body: DocumentUpdateRequest }) =>
      updateDocumentViaAction(action, body),
    onSuccess: invalidateDocs,
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateDocumentViaAction,
    onSuccess: async () => {
      setConfirmDeactivate(false)
      await invalidateDocs()
    },
  })

  const createRevMutation = useMutation({
    mutationFn: ({ documentCode, body }: { documentCode: string; body: DocumentRevisionCreateRequest }) =>
      createDocumentRevision(documentCode, {
        ...body,
        effective_from: body.effective_from.includes('T')
          ? body.effective_from
          : `${body.effective_from}T00:00:00Z`,
        effective_to: body.effective_to
          ? body.effective_to.includes('T')
            ? body.effective_to
            : `${body.effective_to}T00:00:00Z`
          : null,
      }),
    onSuccess: async (row) => {
      setShowRevCreate(false)
      setRevCreateForm(EMPTY_REV_CREATE)
      setSelectedRevCode(row.code)
      await invalidateDocs()
    },
  })

  const submitRevMutation = useMutation({
    mutationFn: submitRevisionViaAction,
    onSuccess: async () => {
      setConfirmSubmitRev(false)
      await invalidateDocs()
    },
  })

  const releaseRevMutation = useMutation({
    mutationFn: ({ action, file_id }: { action: NonNullable<ReturnType<typeof projectRevisionRow>['releaseAction']>; file_id: number }) =>
      releaseRevisionViaAction(action, { file_id }),
    onSuccess: async () => {
      setShowRelease(false)
      setReleaseFileId(0)
      await invalidateDocs()
    },
  })

  const rejectRevMutation = useMutation({
    mutationFn: ({ action, reason }: { action: NonNullable<ReturnType<typeof projectRevisionRow>['rejectAction']>; reason: string }) =>
      rejectRevisionViaAction(action, { reason }),
    onSuccess: async () => {
      setShowRejectRev(false)
      setRejectReason('')
      await invalidateDocs()
    },
  })

  const obsoleteRevMutation = useMutation({
    mutationFn: ({ action, reason }: { action: NonNullable<ReturnType<typeof projectRevisionRow>['obsoleteAction']>; reason: string }) =>
      obsoleteRevisionViaAction(action, { reason }),
    onSuccess: async () => {
      setShowObsolete(false)
      setObsoleteReason('')
      await invalidateDocs()
    },
  })

  const createPpapMutation = useMutation({
    mutationFn: createPpapSubmission,
    onSuccess: async (row) => {
      setShowPpapCreate(false)
      setPpapCreateForm(EMPTY_PPAP_CREATE)
      setSelectedPpapCode(row.code)
      await invalidatePpaps()
    },
  })

  const updatePpapMutation = useMutation({
    mutationFn: ({ action, body }: { action: NonNullable<ReturnType<typeof projectPpapRow>['updateAction']>; body: PpapUpdateRequest }) =>
      updatePpapViaAction(action, body),
    onSuccess: invalidatePpaps,
  })

  const prepareMutation = useMutation({
    mutationFn: preparePpapViaAction,
    onSuccess: async () => {
      setConfirmPrepare(false)
      await invalidatePpaps()
    },
  })
  const submitPpapMutation = useMutation({
    mutationFn: submitPpapViaAction,
    onSuccess: async () => {
      setConfirmSubmitPpap(false)
      await invalidatePpaps()
    },
  })
  const reviewMutation = useMutation({
    mutationFn: customerReviewPpapViaAction,
    onSuccess: async () => {
      setConfirmReview(false)
      await invalidatePpaps()
    },
  })
  const approveMutation = useMutation({
    mutationFn: approvePpapViaAction,
    onSuccess: async () => {
      setConfirmApprove(false)
      await invalidatePpaps()
    },
  })
  const interimMutation = useMutation({
    mutationFn: interimApprovePpapViaAction,
    onSuccess: async () => {
      setConfirmInterim(false)
      await invalidatePpaps()
    },
  })
  const rejectPpapMutation = useMutation({
    mutationFn: rejectPpapViaAction,
    onSuccess: async () => {
      setConfirmRejectPpap(false)
      await invalidatePpaps()
    },
  })

  const docRows = useMemo(
    () => (docsQuery.data?.items ?? []).map(projectDocumentRow),
    [docsQuery.data?.items],
  )
  const docDetailRow = useMemo(
    () => (docDetailQuery.data ? projectDocumentRow(docDetailQuery.data) : null),
    [docDetailQuery.data],
  )
  const revRows = useMemo(
    () => (revsQuery.data?.items ?? []).map(projectRevisionRow),
    [revsQuery.data?.items],
  )
  const revDetailRow = useMemo(
    () => (revDetailQuery.data ? projectRevisionRow(revDetailQuery.data) : null),
    [revDetailQuery.data],
  )
  const ppapRows = useMemo(
    () => (ppapsQuery.data?.items ?? []).map(projectPpapRow),
    [ppapsQuery.data?.items],
  )
  const ppapDetailRow = useMemo(
    () => (ppapDetailQuery.data ? projectPpapRow(ppapDetailQuery.data) : null),
    [ppapDetailQuery.data],
  )

  const docListState = resolveListState({
    status: docsQuery.isLoading ? 'loading' : docsQuery.isError ? 'error' : 'success',
    itemCount: docRows.length,
    hasQuery: Boolean(appliedQuery),
    errorCode: errorCode(docsQuery.error),
  })

  const ppapListState = resolveListState({
    status: ppapsQuery.isLoading ? 'loading' : ppapsQuery.isError ? 'error' : 'success',
    itemCount: ppapRows.length,
    hasQuery: Boolean(ppapAppliedQuery),
    errorCode: errorCode(ppapsQuery.error),
  })

  return {
    tab,
    setTab,
    docTypes: docTypesQuery.data ?? [],
    items: itemsQuery.data ?? [],
    customers: customersQuery.data ?? [],

    searchInput,
    setSearchInput,
    applySearch: () => {
      setCursor(undefined)
      setAppliedQuery(searchInput.trim())
    },
    cursor,
    setCursor,
    nextCursor: docsQuery.data?.page.next_cursor ?? null,
    hasMore: Boolean(docsQuery.data?.page.has_more),
    docRows,
    docListState,
    docListError: errorCode(docsQuery.error),
    selectedDocCode,
    selectDocument: (code: string) => {
      setSelectedDocCode(code)
      setSelectedRevCode(null)
    },
    docDetail: docDetailQuery.data ?? null,
    docDetailRow,
    showDocCreate,
    setShowDocCreate,
    docCreateForm,
    setDocCreateForm,
    docCreateErrors,
    submitDocCreate: () => {
      const errors = validateDocumentCreateForm(docCreateForm)
      setDocCreateErrors(errors)
      if (errors.length) return
      createDocMutation.mutate(docCreateForm)
    },
    createDocUi: resolveMutationUiState({
      confirmOpen: false,
      status: mutationStatus(createDocMutation),
      errorCode: errorCode(createDocMutation.error),
    }),
    submitDocUpdate: (body: DocumentUpdateRequest) => {
      const action = docDetailRow?.updateAction
      if (!action || !docDetailRow.canUpdate) return
      updateDocMutation.mutate({ action, body })
    },
    updateDocUi: resolveMutationUiState({
      confirmOpen: false,
      status: mutationStatus(updateDocMutation),
      errorCode: errorCode(updateDocMutation.error),
    }),
    confirmDeactivate,
    setConfirmDeactivate,
    submitDeactivate: () => {
      const action = docDetailRow?.deactivateAction
      if (!action || !docDetailRow.canDeactivate) return
      deactivateMutation.mutate(action)
    },
    deactivateUi: resolveMutationUiState({
      confirmOpen: confirmDeactivate,
      status: mutationStatus(deactivateMutation),
      errorCode: errorCode(deactivateMutation.error),
    }),

    revRows,
    selectedRevCode,
    selectRevision: setSelectedRevCode,
    revDetail: revDetailQuery.data ?? null,
    revDetailRow,
    showRevCreate,
    setShowRevCreate,
    revCreateForm,
    setRevCreateForm,
    revCreateErrors,
    submitRevCreate: () => {
      if (!selectedDocCode) return
      const errors = validateRevisionCreateForm(revCreateForm)
      setRevCreateErrors(errors)
      if (errors.length) return
      createRevMutation.mutate({ documentCode: selectedDocCode, body: revCreateForm })
    },
    createRevUi: resolveMutationUiState({
      confirmOpen: false,
      status: mutationStatus(createRevMutation),
      errorCode: errorCode(createRevMutation.error),
    }),
    confirmSubmitRev,
    setConfirmSubmitRev,
    submitRev: () => {
      const action = revDetailRow?.submitAction
      if (!action || !revDetailRow.canSubmit) return
      submitRevMutation.mutate(action)
    },
    submitRevUi: resolveMutationUiState({
      confirmOpen: confirmSubmitRev,
      status: mutationStatus(submitRevMutation),
      errorCode: errorCode(submitRevMutation.error),
    }),
    showRelease,
    setShowRelease,
    releaseFileId,
    setReleaseFileId,
    releaseErrors,
    submitRelease: () => {
      const action = revDetailRow?.releaseAction
      if (!action || !revDetailRow.canRelease) return
      const errors = validateReleaseFileId(releaseFileId)
      setReleaseErrors(errors)
      if (errors.length) return
      releaseRevMutation.mutate({ action, file_id: releaseFileId })
    },
    releaseUi: resolveMutationUiState({
      confirmOpen: showRelease,
      status: mutationStatus(releaseRevMutation),
      errorCode: errorCode(releaseRevMutation.error),
    }),
    showRejectRev,
    setShowRejectRev,
    rejectReason,
    setRejectReason,
    rejectErrors,
    submitRejectRev: () => {
      const action = revDetailRow?.rejectAction
      if (!action || !revDetailRow.canReject) return
      const errors = validateReason(rejectReason)
      setRejectErrors(errors)
      if (errors.length) return
      rejectRevMutation.mutate({ action, reason: rejectReason })
    },
    rejectRevUi: resolveMutationUiState({
      confirmOpen: showRejectRev,
      status: mutationStatus(rejectRevMutation),
      errorCode: errorCode(rejectRevMutation.error),
    }),
    showObsolete,
    setShowObsolete,
    obsoleteReason,
    setObsoleteReason,
    obsoleteErrors,
    submitObsolete: () => {
      const action = revDetailRow?.obsoleteAction
      if (!action || !revDetailRow.canObsolete) return
      const errors = validateReason(obsoleteReason)
      setObsoleteErrors(errors)
      if (errors.length) return
      obsoleteRevMutation.mutate({ action, reason: obsoleteReason })
    },
    obsoleteUi: resolveMutationUiState({
      confirmOpen: showObsolete,
      status: mutationStatus(obsoleteRevMutation),
      errorCode: errorCode(obsoleteRevMutation.error),
    }),

    ppapSearchInput,
    setPpapSearchInput,
    applyPpapSearch: () => {
      setPpapCursor(undefined)
      setPpapAppliedQuery(ppapSearchInput.trim())
    },
    ppapCursor,
    setPpapCursor,
    ppapNextCursor: ppapsQuery.data?.page.next_cursor ?? null,
    ppapHasMore: Boolean(ppapsQuery.data?.page.has_more),
    ppapRows,
    ppapListState,
    ppapListError: errorCode(ppapsQuery.error),
    selectedPpapCode,
    selectPpap: setSelectedPpapCode,
    ppapDetail: ppapDetailQuery.data ?? null,
    ppapDetailRow,
    showPpapCreate,
    setShowPpapCreate,
    ppapCreateForm,
    setPpapCreateForm,
    ppapCreateErrors,
    submitPpapCreate: () => {
      const errors = validatePpapCreateForm(ppapCreateForm)
      setPpapCreateErrors(errors)
      if (errors.length) return
      createPpapMutation.mutate(ppapCreateForm)
    },
    createPpapUi: resolveMutationUiState({
      confirmOpen: false,
      status: mutationStatus(createPpapMutation),
      errorCode: errorCode(createPpapMutation.error),
    }),
    submitPpapUpdate: (body: PpapUpdateRequest) => {
      const action = ppapDetailRow?.updateAction
      if (!action || !ppapDetailRow.canUpdate) return
      updatePpapMutation.mutate({ action, body })
    },
    updatePpapUi: resolveMutationUiState({
      confirmOpen: false,
      status: mutationStatus(updatePpapMutation),
      errorCode: errorCode(updatePpapMutation.error),
    }),
    confirmPrepare,
    setConfirmPrepare,
    runPrepare: () => {
      const action = ppapDetailRow?.prepareAction
      if (!action || !ppapDetailRow.canPrepare) return
      prepareMutation.mutate(action)
    },
    prepareUi: resolveMutationUiState({
      confirmOpen: confirmPrepare,
      status: mutationStatus(prepareMutation),
      errorCode: errorCode(prepareMutation.error),
    }),
    confirmSubmitPpap,
    setConfirmSubmitPpap,
    runSubmitPpap: () => {
      const action = ppapDetailRow?.submitAction
      if (!action || !ppapDetailRow.canSubmit) return
      submitPpapMutation.mutate(action)
    },
    submitPpapUi: resolveMutationUiState({
      confirmOpen: confirmSubmitPpap,
      status: mutationStatus(submitPpapMutation),
      errorCode: errorCode(submitPpapMutation.error),
    }),
    confirmReview,
    setConfirmReview,
    runReview: () => {
      const action = ppapDetailRow?.customerReviewAction
      if (!action || !ppapDetailRow.canCustomerReview) return
      reviewMutation.mutate(action)
    },
    reviewUi: resolveMutationUiState({
      confirmOpen: confirmReview,
      status: mutationStatus(reviewMutation),
      errorCode: errorCode(reviewMutation.error),
    }),
    confirmApprove,
    setConfirmApprove,
    runApprove: () => {
      const action = ppapDetailRow?.approveAction
      if (!action || !ppapDetailRow.canApprove) return
      approveMutation.mutate(action)
    },
    approveUi: resolveMutationUiState({
      confirmOpen: confirmApprove,
      status: mutationStatus(approveMutation),
      errorCode: errorCode(approveMutation.error),
    }),
    confirmInterim,
    setConfirmInterim,
    runInterim: () => {
      const action = ppapDetailRow?.interimApproveAction
      if (!action || !ppapDetailRow.canInterimApprove) return
      interimMutation.mutate(action)
    },
    interimUi: resolveMutationUiState({
      confirmOpen: confirmInterim,
      status: mutationStatus(interimMutation),
      errorCode: errorCode(interimMutation.error),
    }),
    confirmRejectPpap,
    setConfirmRejectPpap,
    runRejectPpap: () => {
      const action = ppapDetailRow?.rejectAction
      if (!action || !ppapDetailRow.canReject) return
      rejectPpapMutation.mutate(action)
    },
    rejectPpapUi: resolveMutationUiState({
      confirmOpen: confirmRejectPpap,
      status: mutationStatus(rejectPpapMutation),
      errorCode: errorCode(rejectPpapMutation.error),
    }),
  }
}
