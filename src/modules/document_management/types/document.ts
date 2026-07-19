export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type ReferenceListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export const PPAP_LEVELS = ['1', '2', '3', '4', '5'] as const
export const PPAP_SUBMISSION_TYPES = [
  'INITIAL',
  'RESUBMISSION_DUE_TO_ECN',
  'ANNUAL_VALIDATION',
] as const

/** QMS04-001..005 document */
export type DocumentRecord = {
  id: number
  code: string
  doc_title: string
  doc_type_id: number
  owner_id: number
  related_item_id?: number | null
  related_customer_id?: number | null
  current_revision_id?: number | null
  created_at: string
  is_active: boolean
  doc_type_code?: string
  owner_code?: string
  related_item_code?: string
  related_customer_code?: string
  current_revision_code?: string
  allowed_actions?: AllowedAction[]
}

export type DocumentListPage = { items: DocumentRecord[]; page: PageMeta }
export type DocumentListQuery = ReferenceListQuery

export type DocumentCreateRequest = {
  code: string
  doc_title: string
  doc_type_id: number
  owner_id: number
  related_item_id?: number | null
  related_customer_id?: number | null
  is_active: boolean
}

export type DocumentUpdateRequest = {
  code?: string
  doc_title?: string
  doc_type_id?: number
  owner_id?: number
  related_item_id?: number | null
  related_customer_id?: number | null
  is_active?: boolean
}

/** QMS04-006..012 document_revision */
export type DocumentRevisionRecord = {
  id: number
  code: string
  document_id: number
  file_id?: number | null
  status: string
  change_request_id?: number | null
  effective_from: string
  effective_to?: string | null
  approved_by?: number | null
  approved_at?: string | null
  customer_approved_at?: string | null
  retention_until?: string | null
  document_code?: string
  is_superseded?: boolean
  allowed_actions?: AllowedAction[]
}

export type DocumentRevisionListPage = { items: DocumentRevisionRecord[]; page: PageMeta }

export type DocumentRevisionCreateRequest = {
  code: string
  file_id?: number | null
  change_request_id?: number | null
  effective_from: string
  effective_to?: string | null
}

export type ReleaseRevisionRequest = { file_id: number }
export type ReasonRequest = { reason: string }

/** QMS04-013..022 ppap_submission */
export type PpapElementRecord = {
  id: number
  code: string
  ppap_submission_id: number
  element_name: string
  document_revision_id?: number | null
  is_required: boolean
  document_revision_code?: string
}

export type PpapSubmissionRecord = {
  id: number
  code: string
  customer_id: number
  item_id: number
  ppap_level: string
  submission_type: string
  related_change_request_id?: number | null
  submitted_at?: string | null
  customer_response_at?: string | null
  status: string
  approved_by_customer?: string | null
  notes?: string | null
  customer_code?: string
  item_code?: string
  elements?: PpapElementRecord[]
  allowed_actions?: AllowedAction[]
}

export type PpapListPage = { items: PpapSubmissionRecord[]; page: PageMeta }
export type PpapListQuery = ReferenceListQuery

export type PpapCreateRequest = {
  code: string
  customer_id: number
  item_id: number
  ppap_level: string
  submission_type: string
  related_change_request_id?: number | null
  notes?: string | null
}

export type PpapUpdateRequest = {
  code?: string
  customer_id?: number
  item_id?: number
  ppap_level?: string
  submission_type?: string
  related_change_request_id?: number | null
  approved_by_customer?: string | null
  notes?: string | null
}

export type DocumentTypeLookup = {
  id: number
  code: string
  name_vi: string
  is_active: boolean
}

export type ItemLookupRecord = { id: number; code: string; item_name?: string; is_active?: boolean }
export type CustomerLookupRecord = {
  id: number
  code: string
  customer_name?: string
  is_active?: boolean
}

export type DocumentRow = {
  code: string
  title: string
  docTypeLabel: string
  ownerLabel: string
  itemLabel: string
  customerLabel: string
  currentRevisionLabel: string
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
}

export type RevisionRow = {
  code: string
  status: string
  effectiveFrom: string
  effectiveTo: string
  fileLabel: string
  canSubmit: boolean
  canRelease: boolean
  canReject: boolean
  canObsolete: boolean
  submitAction: AllowedAction | null
  releaseAction: AllowedAction | null
  rejectAction: AllowedAction | null
  obsoleteAction: AllowedAction | null
}

export type PpapRow = {
  code: string
  status: string
  ppapLevel: string
  submissionType: string
  customerLabel: string
  itemLabel: string
  notes: string
  canUpdate: boolean
  canPrepare: boolean
  canSubmit: boolean
  canCustomerReview: boolean
  canApprove: boolean
  canInterimApprove: boolean
  canReject: boolean
  updateAction: AllowedAction | null
  prepareAction: AllowedAction | null
  submitAction: AllowedAction | null
  customerReviewAction: AllowedAction | null
  approveAction: AllowedAction | null
  interimApproveAction: AllowedAction | null
  rejectAction: AllowedAction | null
}
