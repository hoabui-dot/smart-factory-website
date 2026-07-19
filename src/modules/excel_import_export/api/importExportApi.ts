import { ApiError, httpClient, newIdempotencyKey, unwrapSuccessData } from '@/shared/api'

import type {
  ExportJob,
  ImportBatch,
  ImportBatchCreateBody,
  ImportErrorRow,
} from '../types/importExport'
import { findExportTemplate, findImportTemplate } from '../lib/importExportProjection'

function importsBase(templateCode: string): string {
  const template = findImportTemplate(templateCode)
  if (!template) {
    throw new ApiError('VALIDATION_ERROR', 'template_code không thuộc Ownership Map.', 400)
  }
  return `${template.endpointPrefix}/imports`
}

/** GET {prefix}/imports/{template_code}/template */
export async function downloadImportTemplate(templateCode: string): Promise<Blob> {
  const base = importsBase(templateCode)
  const { data } = await httpClient.get(
    `${base}/${encodeURIComponent(templateCode.trim().toUpperCase())}/template`,
    { responseType: 'blob' },
  )
  return data as Blob
}

/** POST {prefix}/imports/{template_code} */
export async function createImportBatch(
  templateCode: string,
  body: ImportBatchCreateBody,
  idempotencyKey?: string,
): Promise<ImportBatch> {
  const code = templateCode.trim().toUpperCase()
  const base = importsBase(code)
  if (!Number.isInteger(body.source_file_id) || body.source_file_id <= 0) {
    throw new ApiError('VALIDATION_ERROR', 'source_file_id không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(`${base}/${encodeURIComponent(code)}`, body, {
    headers: {
      'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb07-import-create'),
    },
  })
  return unwrapSuccessData<ImportBatch>(data)
}

/** GET {prefix}/imports/{batch_code} */
export async function getImportBatch(
  templateCode: string,
  batchCode: string,
): Promise<ImportBatch> {
  const value = batchCode.trim()
  if (!value) throw new ApiError('VALIDATION_ERROR', 'batch_code không hợp lệ.', 400)
  const base = importsBase(templateCode)
  const { data } = await httpClient.get(`${base}/${encodeURIComponent(value)}`)
  return unwrapSuccessData<ImportBatch>(data)
}

/** POST action via server-provided href (validate/commit/cancel). */
export async function postImportAction(
  href: string,
  idempotencyKey?: string,
): Promise<ImportBatch> {
  const path = href.trim()
  if (!path.startsWith('/api/')) {
    throw new ApiError('VALIDATION_ERROR', 'action href không hợp lệ.', 400)
  }
  const { data } = await httpClient.post(
    path,
    {},
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb07-import-action'),
      },
    },
  )
  return unwrapSuccessData<ImportBatch>(data)
}

/** GET {prefix}/imports/{batch_code}/errors */
export async function listImportErrors(
  templateCode: string,
  batchCode: string,
): Promise<ImportErrorRow[]> {
  const value = batchCode.trim()
  if (!value) throw new ApiError('VALIDATION_ERROR', 'batch_code không hợp lệ.', 400)
  const base = importsBase(templateCode)
  const { data } = await httpClient.get(`${base}/${encodeURIComponent(value)}/errors`)
  const payload = unwrapSuccessData<Record<string, unknown>>(data)
  return Array.isArray(payload.items) ? (payload.items as ImportErrorRow[]) : []
}

/** POST {prefix}/exports/{template_code} */
export async function createExportJob(
  templateCode: string,
  params: Record<string, unknown> = {},
  idempotencyKey?: string,
): Promise<ExportJob> {
  const template = findExportTemplate(templateCode)
  if (!template) {
    throw new ApiError('VALIDATION_ERROR', 'export template_code không thuộc Ownership Map.', 400)
  }
  const { data } = await httpClient.post(
    `${template.endpointPrefix}/exports/${encodeURIComponent(template.templateCode)}`,
    { params },
    {
      headers: {
        'Idempotency-Key': idempotencyKey ?? newIdempotencyKey('nb07-export-create'),
      },
    },
  )
  return unwrapSuccessData<ExportJob>(data)
}
