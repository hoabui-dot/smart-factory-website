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

export const BOM_STATUSES = ['DRAFT', 'RELEASED', 'OBSOLETE'] as const
export type BomStatus = (typeof BOM_STATUSES)[number]

/** MES02-001..009 bom_header record — product_item_code projected alongside FK id. */
export type BomHeaderRecord = {
  id: number
  code: string
  product_item_id: number
  version: string
  status: BomStatus | string
  effective_from: string
  effective_to?: string | null
  approved_by?: number | null
  product_item_code?: string
  allowed_actions?: AllowedAction[]
}

/** MES02-002 bom_line record — projected codes alongside FK ids (read-only on this screen; import-managed). */
export type BomLineRecord = {
  id: number
  code: string
  bom_id: number
  material_item_id: number
  qty_per_unit: number
  scrap_rate: number
  uom_id: number
  material_item_code?: string
  uom_code?: string
  material_item_type?: string
}

/** MES02-002 GET response with direct lines. */
export type BomHeaderDetailRecord = BomHeaderRecord & {
  lines: BomLineRecord[]
}

export type BomListPage = {
  items: BomHeaderRecord[]
  page: PageMeta
}

export type BomListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** MES02-003 body. */
export type BomCreateRequest = {
  code: string
  product_item_id: number
  version: string
  status: string
  effective_from: string
  effective_to?: string | null
}

/**
 * MES02-004 sparse PATCH body — never include `status`, server rejects PATCH with status
 * (state transitions go through the dedicated release/obsolete action endpoints).
 */
export type BomUpdateRequest = {
  code?: string
  product_item_id?: number
  version?: string
  effective_from?: string
  effective_to?: string | null
}

/** MES02-007 body. */
export type BomCopyRequest = {
  new_code: string
  new_version: string
  effective_from: string
}

/** MES02-009 body. */
export type BomObsoleteRequest = {
  effective_to: string
}

/** MES02-006 multi-level BOM tree node. */
export type BomTreeLine = BomLineRecord & {
  level: number
  children?: BomTreeNode | null
}

export type BomTreeNode = BomHeaderRecord & {
  level: number
  lines: BomTreeLine[]
}

export type ItemLookupRecord = {
  id: number
  code: string
  item_name: string
  is_active: boolean
}

export type UomLookupRecord = {
  id: number
  code: string
  uom_name: string
  is_active: boolean
}

export type BomLookups = {
  uomCodeById: Map<number, string>
  itemCodeById: Map<number, string>
}

export type BomRow = {
  code: string
  productItemLabel: string
  version: string
  status: string
  effectiveFrom: string
  effectiveTo: string
  canUpdate: boolean
  canDeactivate: boolean
  canCopy: boolean
  canRelease: boolean
  canObsolete: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  copyAction: AllowedAction | null
  releaseAction: AllowedAction | null
  obsoleteAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
  copyDisabledReason: string | null
  releaseDisabledReason: string | null
  obsoleteDisabledReason: string | null
}

export type BomLineRow = {
  code: string
  materialItemLabel: string
  qtyPerUnit: number
  scrapRate: number
  uomLabel: string
}
