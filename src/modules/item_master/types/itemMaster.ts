export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type ItemTypeRecord = {
  id: number
  code: string
  name_vi: string
  name_en: string
  is_stockable: boolean
  is_active: boolean
}

export type ItemCategoryRecord = {
  id: number
  code: string
  category_name: string
  parent_id?: number | null
  level: number
  path: string
  is_active: boolean
}

export type UomRecord = {
  id: number
  code: string
  uom_name: string
  uom_category_id: number
  base_uom_id: number
  conversion_to_base: number
  is_active: boolean
}

/** MES01-001..005 item record — business codes projected alongside FK ids (API-SPEC §6.4). */
export type ItemRecord = {
  id: number
  code: string
  item_name: string
  item_type_id: number
  category_id: number
  base_uom_id: number
  is_lot_tracked: boolean
  is_serial_tracked: boolean
  is_phantom: boolean
  shelf_life_days?: number | null
  current_revision_id?: number | null
  is_active: boolean
  item_type_code?: string
  category_code?: string
  base_uom_code?: string
  current_revision_code?: string | null
  allowed_actions?: AllowedAction[]
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type ItemListPage = {
  items: ItemRecord[]
  page: PageMeta
}

export type ItemListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** MES01-003 body. */
export type ItemCreateRequest = {
  code: string
  item_name: string
  item_type_id: number
  category_id: number
  base_uom_id: number
  is_lot_tracked: boolean
  is_serial_tracked: boolean
  is_phantom: boolean
  shelf_life_days?: number | null
  is_active: boolean
}

/** MES01-004 sparse PATCH body. */
export type ItemUpdateRequest = {
  item_name?: string
  item_type_id?: number
  category_id?: number
  is_lot_tracked?: boolean
  is_serial_tracked?: boolean
  is_phantom?: boolean
  shelf_life_days?: number | null
  current_revision_id?: number | null
  is_active?: boolean
}

export type ReferenceListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export type ItemRow = {
  code: string
  itemName: string
  itemTypeLabel: string
  categoryLabel: string
  baseUomLabel: string
  isActive: boolean
  isLotTracked: boolean
  isSerialTracked: boolean
  isPhantom: boolean
  shelfLifeDays: string
  currentRevisionLabel: string
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
  updateDisabledReason: string | null
  deactivateDisabledReason: string | null
}
