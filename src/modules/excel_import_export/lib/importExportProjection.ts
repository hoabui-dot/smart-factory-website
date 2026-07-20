import type {
  AllowedAction,
  ExportTemplateDef,
  ImportBatch,
  ImportBatchRow,
  ImportTemplateDef,
} from '../types/importExport'
import { formatDateTime } from '../../../shared/lib/formatDate.ts'

const UNAVAILABLE = '-'

/** Ownership map (§10 / API-SPEC §12) — public owner prefixes only. */
export const IMPORT_TEMPLATES: ImportTemplateDef[] = [
  {
    templateCode: 'ITEM_MASTER_IMPORT',
    targetEntity: 'ITEM',
    endpointPrefix: '/api/mes/items',
    label: 'Item Master',
    importModes: ['CREATE_ONLY', 'UPDATE_ONLY', 'UPSERT'],
    commitModes: ['ALL_OR_NOTHING', 'PARTIAL'],
  },
  {
    templateCode: 'BOM_IMPORT',
    targetEntity: 'BOM',
    endpointPrefix: '/api/mes/boms',
    label: 'BOM',
    importModes: ['CREATE_ONLY', 'UPDATE_ONLY', 'UPSERT'],
    commitModes: ['ALL_OR_NOTHING', 'PARTIAL'],
  },
  {
    templateCode: 'ROUTING_IMPORT',
    targetEntity: 'ROUTING',
    endpointPrefix: '/api/mes/routings',
    label: 'Routing',
    importModes: ['CREATE_ONLY', 'UPDATE_ONLY', 'UPSERT'],
    commitModes: ['ALL_OR_NOTHING', 'PARTIAL'],
  },
  {
    templateCode: 'SUPPLIER_IMPORT',
    targetEntity: 'SUPPLIER',
    endpointPrefix: '/api/wms/suppliers',
    label: 'Supplier',
    importModes: ['CREATE_ONLY', 'UPDATE_ONLY', 'UPSERT'],
    commitModes: ['ALL_OR_NOTHING', 'PARTIAL'],
  },
  {
    templateCode: 'CUSTOMER_IMPORT',
    targetEntity: 'CUSTOMER',
    endpointPrefix: '/api/mes/customers',
    label: 'Customer',
    importModes: ['CREATE_ONLY', 'UPDATE_ONLY', 'UPSERT'],
    commitModes: ['ALL_OR_NOTHING', 'PARTIAL'],
  },
  {
    templateCode: 'INVENTORY_OPENING_BALANCE_IMPORT',
    targetEntity: 'INVENTORY_OPENING_BALANCE',
    endpointPrefix: '/api/wms/inventory/opening-balances',
    label: 'Opening Balance',
    importModes: ['CREATE_ONLY', 'UPSERT'],
    commitModes: ['ALL_OR_NOTHING', 'PARTIAL'],
  },
  {
    templateCode: 'STOCKTAKE_IMPORT_EXPORT',
    targetEntity: 'STOCKTAKE',
    endpointPrefix: '/api/wms/stocktakes',
    label: 'Stocktake count',
    importModes: ['UPDATE_ONLY'],
    commitModes: ['ALL_OR_NOTHING', 'PARTIAL'],
  },
  {
    templateCode: 'QC_CHECKSHEET_IMPORT',
    targetEntity: 'QC_CHECKSHEET',
    endpointPrefix: '/api/qms/checksheets',
    label: 'QC Checksheet',
    importModes: ['CREATE_ONLY', 'UPDATE_ONLY', 'UPSERT'],
    commitModes: ['ALL_OR_NOTHING', 'PARTIAL'],
  },
]

/** Export templates with confirmed public create facades. */
export const EXPORT_TEMPLATES: ExportTemplateDef[] = [
  {
    templateCode: 'INVENTORY_BY_LOT_EXPORT',
    endpointPrefix: '/api/wms/inventory/lots',
    label: 'Inventory by lot',
    reportType: 'INVENTORY_BY_LOT_EXPORT',
  },
  {
    templateCode: 'STOCKTAKE_EXPORT',
    endpointPrefix: '/api/wms/stocktakes',
    label: 'Stocktake export',
    reportType: 'STOCKTAKE_EXPORT',
  },
]

export function findImportTemplate(templateCode: string): ImportTemplateDef | null {
  const code = templateCode.trim().toUpperCase()
  return IMPORT_TEMPLATES.find((item) => item.templateCode === code) ?? null
}

export function findExportTemplate(templateCode: string): ExportTemplateDef | null {
  const code = templateCode.trim().toUpperCase()
  return EXPORT_TEMPLATES.find((item) => item.templateCode === code) ?? null
}

export function isActionEnabled(
  actions: AllowedAction[] | undefined,
  action: string,
): boolean {
  return actions?.some((item) => item.action === action && item.enabled === true) ?? false
}

export function resolveActionHref(
  actions: AllowedAction[] | undefined,
  action: string,
): string | null {
  const match = actions?.find((item) => item.action === action)
  return match?.href ?? null
}

export function projectImportBatch(batch: ImportBatch): ImportBatchRow {
  return {
    id: batch.id,
    code: batch.code || UNAVAILABLE,
    status: batch.status || UNAVAILABLE,
    targetEntity: batch.target_entity || UNAVAILABLE,
    mode: batch.mode || UNAVAILABLE,
    importMode: batch.import_mode || UNAVAILABLE,
    totalRows: Number.isFinite(batch.total_rows) ? batch.total_rows : 0,
    successRows: Number.isFinite(batch.success_rows) ? batch.success_rows : 0,
    failedRows: Number.isFinite(batch.failed_rows) ? batch.failed_rows : 0,
    skippedRows: Number.isFinite(batch.skipped_rows) ? batch.skipped_rows : 0,
    startedBy: Number.isFinite(batch.started_by) ? batch.started_by : 0,
    startedAt: batch.started_at ? formatDateTime(batch.started_at) : UNAVAILABLE,
    completedAt: batch.completed_at ? formatDateTime(batch.completed_at) : UNAVAILABLE,
    canValidate: isActionEnabled(batch.allowed_actions, 'validate'),
    canCommit: isActionEnabled(batch.allowed_actions, 'commit'),
    canCancel: isActionEnabled(batch.allowed_actions, 'cancel'),
    validateHref: resolveActionHref(batch.allowed_actions, 'validate'),
    commitHref: resolveActionHref(batch.allowed_actions, 'commit'),
    cancelHref: resolveActionHref(batch.allowed_actions, 'cancel'),
  }
}

export function resolveBatchUiState(input: {
  status: 'loading' | 'success' | 'error' | 'idle'
  hasBatch: boolean
  errorCode: string | null
}): 'idle' | 'loading' | 'empty' | 'ready' | 'permission-denied' | 'not-found' | 'error' {
  if (input.status === 'idle') return 'idle'
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
    if (input.errorCode === 'NOT_FOUND' || input.errorCode === 'RESOURCE_NOT_FOUND') return 'not-found'
    return 'error'
  }
  return input.hasBatch ? 'ready' : 'empty'
}

export function resolveMutationUiState(input: {
  confirmOpen: boolean
  status: 'idle' | 'pending' | 'success' | 'error'
  errorCode: string | null
}): 'idle' | 'confirm' | 'pending' | 'success' | 'permission-denied' | 'not-allowed' | 'error' {
  if (input.status === 'pending') return 'pending'
  if (input.status === 'success') return 'success'
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
    if (input.errorCode === 'NOT_ALLOWED_BY_STATUS') return 'not-allowed'
    return 'error'
  }
  return input.confirmOpen ? 'confirm' : 'idle'
}
