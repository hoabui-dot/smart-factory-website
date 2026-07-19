import type { RefDataRegistryEntry, RefDataRow } from '../api/refDataApi'

const UNAVAILABLE = '-'

export type RefDataTableView = {
  tableKey: string
  sourceModule: string
  labelField: string
  editableFields: string[]
  requiredFields: string[]
  canCreate: boolean
  canUpdate: boolean
  canRetire: boolean
}

export type RefDataRowView = {
  code: string
  label: string
  isActive: boolean
  rowVersion: string
  fieldSummary: string
}

export function projectRegistryEntry(entry: RefDataRegistryEntry): RefDataTableView {
  const caps = new Set((entry.capabilities ?? []).map((c) => c.toLowerCase()))
  return {
    tableKey: entry.table_key,
    sourceModule: entry.source_module || UNAVAILABLE,
    labelField: entry.label_field || 'label',
    editableFields: entry.editable_fields ?? [],
    requiredFields: entry.required_fields ?? [],
    canCreate: caps.has('create'),
    canUpdate: caps.has('update'),
    canRetire: caps.has('delete'),
  }
}

export function projectRefDataRow(row: RefDataRow): RefDataRowView {
  const keys = Object.keys(row.fields ?? {}).slice(0, 4)
  const summary =
    keys.length === 0
      ? UNAVAILABLE
      : keys.map((k) => `${k}=${String((row.fields ?? {})[k] ?? '')}`).join(' · ')
  return {
    code: row.code || UNAVAILABLE,
    label: row.label || UNAVAILABLE,
    isActive: Boolean(row.is_active),
    rowVersion: row.row_version || '',
    fieldSummary: summary,
  }
}

export function resolveRefDataState(
  status: 'loading' | 'success' | 'error',
  itemCount: number,
  hasQuery: boolean,
  errorCode: string | null,
): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (status === 'loading') return 'loading'
  if (status === 'error') return errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  if (itemCount === 0) return hasQuery ? 'no-result' : 'empty'
  return 'ready'
}
