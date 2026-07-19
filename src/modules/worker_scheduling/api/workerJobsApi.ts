import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  WorkerJob,
  WorkerJobRunLog,
  WorkerJobToggleBody,
  WorkerJobUpdateBody,
} from '../types/workerJob'

function normalizePage<T>(raw: unknown) {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const page = (data.page ?? {}) as Record<string, unknown>
  return {
    items: Array.isArray(data.items) ? (data.items as T[]) : [],
    page: {
      limit: typeof page.limit === 'number' ? page.limit : 50,
      next_cursor: typeof page.next_cursor === 'string' ? page.next_cursor : null,
      has_more: Boolean(page.has_more),
    },
  }
}

/** NB10-001 */
export async function listWorkerJobs(query: Record<string, string | number | boolean | undefined> = {}) {
  const { data } = await httpClient.get('/api/admin/worker-jobs', { params: query })
  return normalizePage<WorkerJob>(data)
}

/** NB10-002 */
export async function getWorkerJob(jobKey: string): Promise<WorkerJob> {
  const value = jobKey.trim()
  if (!value) throw new ApiError('VALIDATION_ERROR', 'worker_job_code không hợp lệ.', 400)
  const { data } = await httpClient.get(`/api/admin/worker-jobs/${encodeURIComponent(value)}`)
  return unwrapSuccessData<WorkerJob>(data)
}

/** NB10-003 */
export async function updateWorkerJob(
  jobKey: string,
  body: WorkerJobUpdateBody,
  idempotencyKey?: string,
): Promise<WorkerJob> {
  const { data } = await httpClient.patch(
    `/api/admin/worker-jobs/${encodeURIComponent(jobKey.trim())}`,
    body,
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb10-update'),
      },
    },
  )
  return unwrapSuccessData<WorkerJob>(data)
}

/** NB10-004 */
export async function runWorkerJobNow(jobKey: string, idempotencyKey?: string) {
  const { data } = await httpClient.post(
    `/api/admin/worker-jobs/${encodeURIComponent(jobKey.trim())}/run-now`,
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb10-run'),
      },
    },
  )
  return unwrapSuccessData(data)
}

/** NB10-005 */
export async function toggleWorkerJob(
  jobKey: string,
  body: WorkerJobToggleBody,
  idempotencyKey?: string,
): Promise<WorkerJob> {
  const { data } = await httpClient.post(
    `/api/admin/worker-jobs/${encodeURIComponent(jobKey.trim())}/toggle`,
    body,
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb10-toggle'),
      },
    },
  )
  return unwrapSuccessData<WorkerJob>(data)
}

/** NB10-006 */
export async function listWorkerJobRuns(jobKey: string) {
  const { data } = await httpClient.get(
    `/api/admin/worker-jobs/${encodeURIComponent(jobKey.trim())}/runs`,
    { params: { limit: 50 } },
  )
  return normalizePage<WorkerJobRunLog>(data)
}

/** NB10-007 */
export async function getWorkerRun(runId: number): Promise<WorkerJobRunLog> {
  if (!Number.isInteger(runId) || runId <= 0) {
    throw new ApiError('VALIDATION_ERROR', 'run_id không hợp lệ.', 400)
  }
  const { data } = await httpClient.get(`/api/admin/worker-runs/${runId}`)
  return unwrapSuccessData<WorkerJobRunLog>(data)
}
