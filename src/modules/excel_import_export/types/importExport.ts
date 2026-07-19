export type ImportBatchStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'PREVIEW_READY'
  | 'COMMITTING'
  | 'COMMITTED'
  | 'FAILED'
  | 'CANCELLED'

export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export type ImportBatch = {
  id: number
  code: string
  target_entity: string
  source_file_id: number
  mode: string
  import_mode: string
  total_rows: number
  success_rows: number
  failed_rows: number
  skipped_rows: number
  status: ImportBatchStatus | string
  error_file_id?: number | null
  started_by: number
  started_at: string
  completed_at?: string | null
  allowed_actions?: AllowedAction[]
}

export type ImportErrorRow = {
  id: number
  code: string
  batch_id: number
  column_name?: string | null
  error_code: string
  error_message_vi: string
  raw_value?: string | null
  expected_format?: string | null
}

export type ImportBatchCreateBody = {
  source_file_id: number
  mode: string
  import_mode: string
}

export type ExportJob = {
  id: number
  code: string
  report_type: string
  status: string
  requested_by: number
  requested_at: string
  result_file_id?: number | null
  completed_at?: string | null
  error_message?: string | null
}

export type ImportTemplateDef = {
  templateCode: string
  targetEntity: string
  endpointPrefix: string
  label: string
  importModes: string[]
  commitModes: string[]
}

export type ExportTemplateDef = {
  templateCode: string
  endpointPrefix: string
  label: string
  reportType: string
}

export type ImportBatchRow = {
  id: number
  code: string
  status: string
  targetEntity: string
  mode: string
  importMode: string
  totalRows: number
  successRows: number
  failedRows: number
  skippedRows: number
  startedBy: number
  startedAt: string
  completedAt: string
  canValidate: boolean
  canCommit: boolean
  canCancel: boolean
  validateHref: string | null
  commitHref: string | null
  cancelHref: string | null
}
