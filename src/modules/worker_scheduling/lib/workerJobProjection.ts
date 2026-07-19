import type { WorkerJob, WorkerJobRow } from '../types/workerJob'

const UNAVAILABLE = '-'

export function projectWorkerJobRow(job: WorkerJob): WorkerJobRow {
  return {
    jobKey: job.job_key || UNAVAILABLE,
    displayName: job.display_name_vi || UNAVAILABLE,
    category: job.job_category || UNAVAILABLE,
    moduleScope: job.module_scope || UNAVAILABLE,
    cronExpr: job.cron_expr || UNAVAILABLE,
    enabled: Boolean(job.enabled),
    queueName: job.queue_name || UNAVAILABLE,
    lastStatus: job.last_status || UNAVAILABLE,
    lastRunAt: job.last_run_at || UNAVAILABLE,
    nextRunAt: job.next_run_at || UNAVAILABLE,
  }
}

export function resolveWorkerListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasFilters: boolean
  errorCode: string | null
}): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) return input.hasFilters ? 'no-result' : 'empty'
  return 'ready'
}
