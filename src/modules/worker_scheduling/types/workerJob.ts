export type WorkerJob = {
  id: number
  job_key: string
  display_name_vi: string
  job_category: string
  module_scope: string
  cron_expr?: string | null
  enabled: boolean
  timeout_seconds: number
  max_retry: number
  queue_name: string
  concurrency: number
  description_vi: string
  last_run_at?: string | null
  last_status?: string | null
  last_duration_ms?: number | null
  last_error?: string | null
  next_run_at?: string | null
  updated_at: string
  updated_reason?: string | null
}

export type WorkerJobRunLog = {
  id: number
  worker_job_id: number
  job_key: string
  worker_instance: string
  started_at: string
  finished_at?: string | null
  duration_ms?: number | null
  status: string
  retry_attempt: number
  error_detail?: string | null
}

export type WorkerJobRow = {
  jobKey: string
  displayName: string
  category: string
  moduleScope: string
  cronExpr: string
  enabled: boolean
  queueName: string
  lastStatus: string
  lastRunAt: string
  nextRunAt: string
}

export type WorkerJobUpdateBody = {
  cron_expr?: string | null
  timeout_seconds?: number
  max_retry?: number
  queue_name?: string
  concurrency?: number
  description_vi?: string
  updated_reason: string
}

export type WorkerJobToggleBody = {
  enabled: boolean
  updated_reason: string
}
