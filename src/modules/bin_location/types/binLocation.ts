export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type LocationTypeRecord = {
  id: number
  code: string
  name_vi: string
  name_en: string
  level_hint: number
  is_active: boolean
}

export type WarehouseCategoryRecord = {
  id: number
  code: string
  name_vi: string
  name_en: string
  is_active: boolean
}

/** WMS01-001..006 location record — physical FK ids kept for client-side resolution only (API-SPEC §6.4). */
export type LocationRecord = {
  id: number
  code: string
  parent_location_id?: number | null
  location_name: string
  location_type_id: number
  level: number
  path: string
  warehouse_category_id?: number | null
  manager_user_id?: number | null
  barcode?: string | null
  capacity_qty?: number | null
  capacity_uom_id?: number | null
  is_active: boolean
  allowed_actions?: AllowedAction[]
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type LocationListPage = {
  items: LocationRecord[]
  page: PageMeta
}

export type LocationListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** WMS01-003 body. */
export type LocationCreateRequest = {
  code: string
  parent_location_id?: number | null
  location_name: string
  location_type_id: number
  warehouse_category_id?: number | null
  manager_user_id?: number | null
  barcode?: string | null
  capacity_qty?: number | null
  capacity_uom_id?: number | null
  is_active: boolean
}

/** WMS01-004 sparse PATCH body. */
export type LocationUpdateRequest = {
  location_name?: string
  location_type_id?: number
  parent_location_id?: number | null
  warehouse_category_id?: number | null
  manager_user_id?: number | null
  barcode?: string | null
  capacity_qty?: number | null
  capacity_uom_id?: number | null
  is_active?: boolean
}

export type ReferenceListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export type LocationRow = {
  code: string
  locationName: string
  locationTypeLabel: string
  warehouseCategoryLabel: string
  parentLabel: string
  level: number
  path: string
  barcode: string
  capacityQty: string
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}

export type LocationLookups = {
  locationTypeById: Map<number, LocationTypeRecord>
  warehouseCategoryById: Map<number, WarehouseCategoryRecord>
  locationCodeById: Map<number, string>
}
