import { httpClient, ApiError, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  EnqueuePrintJobRequest,
  LabelTemplateCreateRequest,
  LabelTemplateRecord,
  ListPage,
  ListQuery,
  PrinterCreateRequest,
  PrinterRecord,
  PrintJobRecord,
} from '../types/labelPrinting'

function normalizeListPage<T>(raw: unknown): ListPage<T> {
  const data = unwrapSuccessData<Record<string, unknown>>(raw as Record<string, unknown>)
  const items = Array.isArray(data.items) ? (data.items as T[]) : []
  const pageRaw = (data.page ?? {}) as Record<string, unknown>
  return {
    items,
    page: {
      limit: typeof pageRaw.limit === 'number' ? pageRaw.limit : 50,
      next_cursor: typeof pageRaw.next_cursor === 'string' ? pageRaw.next_cursor : null,
      has_more: Boolean(pageRaw.has_more),
    },
  }
}

/** NB05-012 GET /api/admin/print-jobs */
export async function listPrintJobs(query: ListQuery = {}): Promise<ListPage<PrintJobRecord>> {
  const { data } = await httpClient.get('/api/admin/print-jobs', {
    params: {
      limit: query.limit,
      cursor: query.cursor,
      sort: query.sort,
      q: query.q,
    },
  })
  return normalizeListPage<PrintJobRecord>(data)
}

/** NB05-013 GET /api/admin/print-jobs/{print_job_code} */
export async function getPrintJob(printJobCode: string): Promise<PrintJobRecord> {
  const code = printJobCode.trim()
  if (!code) {
    throw new ApiError('VALIDATION_ERROR', 'print_job_code không hợp lệ.', 400)
  }
  const { data } = await httpClient.get(`/api/admin/print-jobs/${encodeURIComponent(code)}`)
  return unwrapSuccessData<PrintJobRecord>(data)
}

/** NB05-002 GET /api/admin/printers */
export async function listPrinters(query: ListQuery = {}): Promise<ListPage<PrinterRecord>> {
  const { data } = await httpClient.get('/api/admin/printers', {
    params: {
      limit: query.limit,
      cursor: query.cursor,
      sort: query.sort,
      q: query.q,
    },
  })
  return normalizeListPage<PrinterRecord>(data)
}

/** NB05-007 GET /api/admin/label-templates */
export async function listLabelTemplates(
  query: ListQuery = {},
): Promise<ListPage<LabelTemplateRecord>> {
  const { data } = await httpClient.get('/api/admin/label-templates', {
    params: {
      limit: query.limit,
      cursor: query.cursor,
      sort: query.sort,
      q: query.q,
    },
  })
  return normalizeListPage<LabelTemplateRecord>(data)
}

/** NB05-004 POST /api/admin/printers */
export async function createPrinter(
  body: PrinterCreateRequest,
  idempotencyKey?: string,
): Promise<PrinterRecord> {
  const { data } = await httpClient.post('/api/admin/printers', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-printer-create'),
    },
  })
  return unwrapSuccessData<PrinterRecord>(data)
}

/** NB05-006 DELETE /api/admin/printers/{printer_code} */
export async function archivePrinter(
  printerCode: string,
  idempotencyKey?: string,
): Promise<PrinterRecord> {
  const code = printerCode.trim()
  if (!code) {
    throw new ApiError('VALIDATION_ERROR', 'printer_code không hợp lệ.', 400)
  }
  const { data } = await httpClient.delete(`/api/admin/printers/${encodeURIComponent(code)}`, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-printer-archive'),
    },
  })
  return unwrapSuccessData<PrinterRecord>(data)
}

/** NB05-009 POST /api/admin/label-templates */
export async function createLabelTemplate(
  body: LabelTemplateCreateRequest,
  idempotencyKey?: string,
): Promise<LabelTemplateRecord> {
  const { data } = await httpClient.post('/api/admin/label-templates', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-template-create'),
    },
  })
  return unwrapSuccessData<LabelTemplateRecord>(data)
}

/** NB05-011 DELETE /api/admin/label-templates/{label_template_code} */
export async function archiveLabelTemplate(
  templateCode: string,
  idempotencyKey?: string,
): Promise<LabelTemplateRecord> {
  const code = templateCode.trim()
  if (!code) {
    throw new ApiError('VALIDATION_ERROR', 'label_template_code không hợp lệ.', 400)
  }
  const { data } = await httpClient.delete(
    `/api/admin/label-templates/${encodeURIComponent(code)}`,
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-template-archive'),
      },
    },
  )
  return unwrapSuccessData<LabelTemplateRecord>(data)
}

/** NB05-014 POST /api/print-jobs */
export async function enqueuePrintJob(
  body: EnqueuePrintJobRequest,
  idempotencyKey?: string,
): Promise<{ print_job: PrintJobRecord }> {
  const { data } = await httpClient.post('/api/print-jobs', body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-enqueue'),
    },
  })
  return unwrapSuccessData<{ print_job: PrintJobRecord }>(data)
}

/** NB05-015 POST /api/admin/print-jobs/{print_job_code}/retry */
export async function retryPrintJob(
  printJobCode: string,
  idempotencyKey?: string,
): Promise<PrintJobRecord> {
  const code = printJobCode.trim()
  if (!code) {
    throw new ApiError('VALIDATION_ERROR', 'print_job_code không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(
    `/api/admin/print-jobs/${encodeURIComponent(code)}/retry`,
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-retry'),
      },
    },
  )
  return unwrapSuccessData<PrintJobRecord>(data)
}

/** NB05-016 POST /api/admin/print-jobs/{print_job_code}/cancel */
export async function cancelPrintJob(
  printJobCode: string,
  reason: string,
  idempotencyKey?: string,
): Promise<PrintJobRecord> {
  const code = printJobCode.trim()
  if (!code) {
    throw new ApiError('VALIDATION_ERROR', 'print_job_code không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(
    `/api/admin/print-jobs/${encodeURIComponent(code)}/cancel`,
    { reason },
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-cancel'),
      },
    },
  )
  return unwrapSuccessData<PrintJobRecord>(data)
}

/** NB05-017 POST /api/admin/print-jobs/{print_job_code}/request-reprint */
export async function requestReprint(
  printJobCode: string,
  reason: string,
  idempotencyKey?: string,
): Promise<PrintJobRecord> {
  const code = printJobCode.trim()
  if (!code) {
    throw new ApiError('VALIDATION_ERROR', 'print_job_code không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(
    `/api/admin/print-jobs/${encodeURIComponent(code)}/request-reprint`,
    { reason },
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-reprint-req'),
      },
    },
  )
  return unwrapSuccessData<PrintJobRecord>(data)
}

/** NB05-018 POST /api/admin/print-jobs/{print_job_code}/approve-reprint */
export async function approveReprint(
  printJobCode: string,
  idempotencyKey?: string,
): Promise<PrintJobRecord> {
  const code = printJobCode.trim()
  if (!code) {
    throw new ApiError('VALIDATION_ERROR', 'print_job_code không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(
    `/api/admin/print-jobs/${encodeURIComponent(code)}/approve-reprint`,
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb05-reprint-ok'),
      },
    },
  )
  return unwrapSuccessData<PrintJobRecord>(data)
}

export { newIdempotencyKey }
