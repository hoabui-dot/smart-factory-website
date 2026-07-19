export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type PageMeta = { limit: number; next_cursor: string | null; has_more: boolean }
export type ReferenceListQuery = { limit?: number; cursor?: string; sort?: string; q?: string }

export type CustomerRecord = {
  id: number
  code: string
  customer_name: string
  country_code: string
  iatf_required: boolean
  ppap_level_default: string
  target_ppm: number
  contact_email: string
  is_active: boolean
  allowed_actions?: AllowedAction[]
}

export type CustomerListPage = { items: CustomerRecord[]; page: PageMeta }
export type CustomerListQuery = ReferenceListQuery

export type CustomerCreateRequest = {
  code: string
  customer_name: string
  country_code: string
  iatf_required: boolean
  ppap_level_default: string
  target_ppm: number
  contact_email: string
  is_active: boolean
}

export type CustomerUpdateRequest = Partial<CustomerCreateRequest>

export type CustomerItemRecord = {
  id: number
  code: string
  customer_id: number
  item_id: number
  customer_part_name: string
  characteristic_class: string
  packaging_spec: string
  target_ppm_override?: number | null
  is_active: boolean
  customer_code?: string
  item_code?: string
  allowed_actions?: AllowedAction[]
}

export type CustomerItemListPage = { items: CustomerItemRecord[]; page: PageMeta }
export type CustomerItemCreateRequest = {
  code: string
  customer_id: number
  item_id: number
  customer_part_name: string
  characteristic_class: string
  packaging_spec: string
  target_ppm_override?: number | null
  is_active: boolean
}
export type CustomerItemUpdateRequest = Partial<CustomerItemCreateRequest>

export type CustomerOrderLineRecord = {
  id: number
  code: string
  co_id: number
  customer_item_id: number
  ordered_qty: number
  fulfilled_qty: number
  shipped_qty: number
  unit_price?: number | null
  customer_item_code?: string
  item_code?: string
}

export type LinkedWorkOrder = { id: number; code: string; status: string; item_id: number }

export type CustomerOrderRecord = {
  id: number
  code: string
  customer_id: number
  customer_po_no: string
  received_date: string
  requested_delivery_date: string
  incoterm: string
  status: string
  created_by: number
  customer_code?: string
  lines?: CustomerOrderLineRecord[]
  work_orders?: LinkedWorkOrder[]
  allowed_actions?: AllowedAction[]
}

export type CustomerOrderListPage = { items: CustomerOrderRecord[]; page: PageMeta }
export type CustomerOrderLineCreate = {
  code: string
  customer_item_id: number
  ordered_qty: number
  unit_price?: number | null
}
export type CustomerOrderCreateRequest = {
  code: string
  customer_id: number
  customer_po_no: string
  received_date: string
  requested_delivery_date: string
  incoterm: string
  lines: CustomerOrderLineCreate[]
}
export type CustomerOrderUpdateRequest = {
  code?: string
  customer_id?: number
  customer_po_no?: string
  received_date?: string
  requested_delivery_date?: string
  incoterm?: string
  lines?: CustomerOrderLineCreate[]
}

export type ItemLookupRecord = { id: number; code: string; item_name?: string; is_active?: boolean }

export type CustomerRow = {
  code: string
  customerName: string
  countryCode: string
  ppapLevel: string
  targetPpm: number
  contactEmail: string
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
}

export type CustomerItemRow = {
  code: string
  customerLabel: string
  itemLabel: string
  customerPartName: string
  characteristicClass: string
  isActive: boolean
  canUpdate: boolean
  canDeactivate: boolean
  updateAction: AllowedAction | null
  deactivateAction: AllowedAction | null
}

export type CustomerOrderRow = {
  code: string
  customerLabel: string
  customerPoNo: string
  status: string
  receivedDate: string
  requestedDeliveryDate: string
  incoterm: string
  createdByLabel: string
  canUpdate: boolean
  canConfirm: boolean
  canCancel: boolean
  canClose: boolean
  updateAction: AllowedAction | null
  confirmAction: AllowedAction | null
  cancelAction: AllowedAction | null
  closeAction: AllowedAction | null
}

/** MES10-018..032 shipment / CoC */
export type CocRecord = {
  id: number
  code: string
  shipment_id: number
  customer_id: number
  issued_at: string
  issued_by: number
  pdf_file_id: number
  customer_acknowledged_at?: string | null
}

export type ShipmentLineRecord = {
  id: number
  code: string
  shipment_id: number
  finished_lot_id: number
  co_line_id: number
  qty: number
  source_location_id?: number | null
  finished_lot_code?: string
  co_line_code?: string
  item_code?: string
}

export type ShipmentRecord = {
  id: number
  code: string
  customer_id: number
  shipped_at: string
  carrier: string
  tracking_no?: string | null
  coc_id?: number | null
  status: string
  customer_code?: string
  lines?: ShipmentLineRecord[]
  coc?: CocRecord | null
  allowed_actions?: AllowedAction[]
}

export type ShipmentListPage = { items: ShipmentRecord[]; page: PageMeta }

export type ShipmentCreateRequest = {
  code?: string
  customer_id: number
  shipped_at: string
  carrier: string
  tracking_no?: string | null
}

export type ShipmentUpdateRequest = {
  code?: string
  customer_id?: number
  shipped_at?: string
  carrier?: string
  tracking_no?: string | null
}

export type ShipmentLineCreateRequest = {
  finished_lot_code: string
  qty: number
}

export type CocDownloadResponse = {
  download_url: string
  expires_at: string
}

export type AsyncJobReference = {
  job?: { code?: string; status?: string }
  job_code?: string
  code?: string
}

export type ShipmentRow = {
  code: string
  status: string
  customerLabel: string
  carrier: string
  trackingNo: string
  shippedAt: string
  cocLabel: string
  canUpdate: boolean
  canAddLine: boolean
  canCancel: boolean
  canShip: boolean
  canDeliver: boolean
  canAccept: boolean
  canFail: boolean
  canCocGenerate: boolean
  canCocSign: boolean
  canCocDownload: boolean
  shipDisabledReason: string | null
  updateAction: AllowedAction | null
  addLineAction: AllowedAction | null
  cancelAction: AllowedAction | null
  shipAction: AllowedAction | null
  deliverAction: AllowedAction | null
  acceptAction: AllowedAction | null
  failAction: AllowedAction | null
  cocGenerateAction: AllowedAction | null
  cocSignAction: AllowedAction | null
  cocDownloadAction: AllowedAction | null
  removeLineActions: AllowedAction[]
}
