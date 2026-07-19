export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type ChangeRequestRecord = {
  id: number
  code: string
  change_type: string
  target_item_id?: number | null
  target_item_code?: string | null
  reason: string
  requested_by: number
  requested_at: string
  impact_customer: boolean
  impact_assessment: string
  status: string
  approved_by?: number | null
  approved_at?: string | null
  effective_date?: string | null
  allowed_actions?: AllowedAction[]
}

export type ChangeApprovalRecord = {
  id: number
  code: string
  approval_party_type: string
  role_required?: string | null
  decision?: string | null
  comment?: string | null
  step_order: number
}

export type ChangeRequestRow = {
  code: string
  status: string
  changeType: string
  itemLabel: string
  reason: string
  requestedAt: string
  canUpdate: boolean
  canSubmit: boolean
  canStartReview: boolean
  canApprove: boolean
  canReject: boolean
  canImplement: boolean
  canClose: boolean
  updateAction: AllowedAction | null
  submitAction: AllowedAction | null
  startReviewAction: AllowedAction | null
  approveAction: AllowedAction | null
  rejectAction: AllowedAction | null
  implementAction: AllowedAction | null
  closeAction: AllowedAction | null
}

export type PageMeta = { limit: number; next_cursor: string | null; has_more: boolean }
export type ChangeRequestListPage = { items: ChangeRequestRecord[]; page: PageMeta }
export type ListQuery = { limit?: number; cursor?: string; q?: string }

export type ChangeRequestCreateRequest = {
  code?: string
  change_type: string
  target_item_id?: number | null
  reason: string
  impact_customer: boolean
  impact_assessment: string
  effective_date?: string | null
}

export type ChangeRequestUpdateRequest = {
  change_type?: string
  target_item_id?: number | null
  reason?: string
  impact_customer?: boolean
  impact_assessment?: string
  effective_date?: string | null
}

export type ImplementLinkInput = {
  target_entity_type: string
  target_entity_id: number
  action: string
}
