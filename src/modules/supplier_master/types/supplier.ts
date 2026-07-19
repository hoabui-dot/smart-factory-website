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

export const SUPPLIER_TIERS = ['TIER1', 'TIER2', 'TIER3'] as const
export type SupplierTier = (typeof SUPPLIER_TIERS)[number]

export const APPROVAL_STATUSES = ['APPROVED', 'CONDITIONAL', 'SUSPENDED', 'DISAPPROVED'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

/** WMS06-001..005 supplier record. */
export type SupplierRecord = {
  id: number
  code: string
  supplier_name: string
  country_code: string
  supplier_tier: SupplierTier | string
  iatf_certified: boolean
  iatf_cert_no?: string | null
  iatf_cert_expiry?: string | null
  iso9001_certified: boolean
  approval_status: ApprovalStatus | string
  contact_email: string
  is_active: boolean
  allowed_actions?: AllowedAction[]
}

export type SupplierListPage = {
  items: SupplierRecord[]
  page: PageMeta
}

export type SupplierListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** WMS06-003 body. */
export type SupplierCreateRequest = {
  code: string
  supplier_name: string
  country_code: string
  supplier_tier: string
  iatf_certified: boolean
  iatf_cert_no?: string | null
  iatf_cert_expiry?: string | null
  iso9001_certified: boolean
  contact_email: string
  is_active: boolean
}

/** WMS06-004 sparse PATCH body — never include approval_status (read-only/server-derived). */
export type SupplierUpdateRequest = {
  code?: string
  supplier_name?: string
  country_code?: string
  supplier_tier?: string
  iatf_certified?: boolean
  iatf_cert_no?: string | null
  iatf_cert_expiry?: string | null
  iso9001_certified?: boolean
  contact_email?: string
  is_active?: boolean
}

/** WMS06-006..010 supplier_item record — supplier_code/item_code projected alongside FK ids. */
export type SupplierItemRecord = {
  id: number
  code: string
  supplier_id: number
  item_id: number
  unit_price?: number | null
  lead_time_days: number
  moq?: number | null
  is_default: boolean
  is_active: boolean
  supplier_code?: string
  item_code?: string
  allowed_actions?: AllowedAction[]
}

export type SupplierItemListPage = {
  items: SupplierItemRecord[]
  page: PageMeta
}

export type SupplierItemListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** WMS06-008 body. */
export type SupplierItemCreateRequest = {
  code: string
  supplier_id: number
  item_id: number
  unit_price?: number | null
  lead_time_days: number
  moq?: number | null
  is_default: boolean
  is_active: boolean
}

/** WMS06-009 sparse PATCH body. */
export type SupplierItemUpdateRequest = {
  code?: string
  supplier_id?: number
  item_id?: number
  unit_price?: number | null
  lead_time_days?: number
  moq?: number | null
  is_default?: boolean
  is_active?: boolean
}

/**
 * WMS06-011..012 supplier_evaluation record. Append-only in Phase 1 (screen contract §F) — no
 * update/delete endpoint; total_score/grade/evaluated_by are read-only/server-derived.
 */
export type SupplierEvaluationRecord = {
  id: number
  code: string
  supplier_id: number
  evaluation_period: string
  quality_score: number
  delivery_score: number
  service_score: number
  total_score: number
  grade: string
  evaluated_by: number
  evaluated_at: string
  action_required?: string | null
  supplier_code?: string
}

export type SupplierEvaluationListPage = {
  items: SupplierEvaluationRecord[]
  page: PageMeta
}

export type SupplierEvaluationListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** WMS06-013 body. */
export type SupplierEvaluationCreateRequest = {
  code: string
  supplier_id: number
  evaluation_period: string
  quality_score: number
  delivery_score: number
  service_score: number
  evaluated_at: string
  action_required?: string | null
}

export type ItemLookupRecord = {
  id: number
  code: string
  item_name: string
  is_active: boolean
}

export type SupplierLookups = {
  supplierCodeById: Map<number, string>
  itemCodeById: Map<number, string>
}

export type SupplierRow = {
  code: string
  supplierName: string
  countryCode: string
  supplierTier: string
  approvalStatus: string
  iatfCertified: boolean
  iso9001Certified: boolean
  contactEmail: string
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type SupplierItemRow = {
  code: string
  supplierLabel: string
  itemLabel: string
  leadTimeDays: number
  unitPrice: string
  moq: string
  isDefault: boolean
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type SupplierEvaluationRow = {
  code: string
  supplierLabel: string
  evaluationPeriod: string
  qualityScore: number
  deliveryScore: number
  serviceScore: number
  totalScore: number
  grade: string
  evaluatedByLabel: string
  evaluatedAt: string
  actionRequired: string
}
