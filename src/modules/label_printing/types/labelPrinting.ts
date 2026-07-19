export type PrintJobStatus =
  | 'QUEUED'
  | 'SENDING'
  | 'PRINTED'
  | 'FAILED'
  | 'REPRINT_REQUESTED'
  | 'CANCELLED'

export type PrintJobAction = 'retry' | 'cancel' | 'request_reprint' | 'approve_reprint'

export type PrintJobRecord = {
  id: number
  code: string
  printer_id: number
  template_id: number
  label_type: string
  parent_type: string
  parent_id: number
  copies: number
  payload: Record<string, unknown>
  requested_by: number | null
  requested_at: string
  status: PrintJobStatus | string
  printed_at: string | null
  error_message: string | null
  reprint_of_id: number | null
}

export type PrinterRecord = {
  id: number
  code: string
  printer_name: string
  model: string
  protocol: string
  ip_address?: string | null
  location_id: number
  supported_label_types: string
  status: string
  last_heartbeat_at?: string | null
  is_active: boolean
}

export type LabelTemplateRecord = {
  id: number
  code: string
  label_type: string
  version: string
  template_format: string
  template_body: string
  is_active: boolean
  effective_from: string
  created_by: number
}

export type PageMeta = {
  limit: number
  next_cursor: string | null
  has_more: boolean
}

export type ListPage<T> = {
  items: T[]
  page: PageMeta
}

export type ListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

export type PrinterCreateRequest = {
  code: string
  printer_name: string
  model: string
  protocol: string
  ip_address?: string
  location_id: number
  supported_label_types: string
  is_active: boolean
}

export type LabelTemplateCreateRequest = {
  code: string
  label_type: string
  version: string
  template_format: string
  template_body: string
  is_active: boolean
  effective_from: string
}

export type EnqueuePrintJobRequest = {
  entity_type: string
  entity_id: number
  template_code: string
  printer_code: string
  copies: number
}

export type PrintJobRow = {
  code: string
  status: string
  requestedAt: string
  printedAt: string
  labelType: string
  parentType: string
  copies: number
  payloadPreview: string
  requestedBy: string
  errorMessage: string
  printerLabel: string
  templateLabel: string
  actions: PrintJobAction[]
}

export type LookupMaps = {
  printersById: Map<number, string>
  templatesById: Map<number, string>
}
