import type {
  AllowedAction,
  ItemLookupRecord,
  ItemRevisionLookupRecord,
  LotLookups,
  LotRecord,
  LotRow,
  SupplierLookupRecord,
} from '../types/lot'
import { formatDate } from '../../../shared/lib/formatDate.ts'

const UNAVAILABLE = '-'

/** Never infer mutation availability from lot fields — server allowed_actions is authoritative. */
export function findAllowedAction(
  actions: AllowedAction[] | undefined,
  action: string,
): AllowedAction | null {
  return actions?.find((item) => item.action === action) ?? null
}

export function isActionEnabled(actions: AllowedAction[] | undefined, action: string): boolean {
  return findAllowedAction(actions, action)?.enabled === true
}

/** Builds id->record lookup maps so raw FK ids are never rendered (WEB-WMS-02-LOT §C/§F). */
export function buildLotLookups(input: {
  items: ItemLookupRecord[]
  suppliers: SupplierLookupRecord[]
  revisions: ItemRevisionLookupRecord[]
}): LotLookups {
  const itemById = new Map<number, ItemLookupRecord>()
  for (const item of input.items) itemById.set(item.id, item)

  const supplierById = new Map<number, SupplierLookupRecord>()
  for (const supplier of input.suppliers) supplierById.set(supplier.id, supplier)

  const revisionById = new Map<number, ItemRevisionLookupRecord>()
  for (const revision of input.revisions) revisionById.set(revision.id, revision)

  return { itemById, supplierById, revisionById }
}

export function projectLotRow(lot: LotRecord, lookups: LotLookups): LotRow {
  const updateAction = findAllowedAction(lot.allowed_actions, 'update')
  const printAction = findAllowedAction(lot.allowed_actions, 'print')
  const item = lookups.itemById.get(lot.item_id)
  const supplier = lot.supplier_id != null ? lookups.supplierById.get(lot.supplier_id) : undefined
  const revision =
    lot.item_revision_id != null ? lookups.revisionById.get(lot.item_revision_id) : undefined

  return {
    code: lot.code || UNAVAILABLE,
    itemLabel: lot.item_code || item?.code || UNAVAILABLE,
    revisionLabel: revision?.code || UNAVAILABLE,
    supplierLabel: lot.supplier_code || supplier?.code || UNAVAILABLE,
    supplierLot: lot.supplier_lot || UNAVAILABLE,
    millCertificateNo: lot.mill_certificate_no || UNAVAILABLE,
    qcStatus: lot.qc_status || UNAVAILABLE,
    receivedDate: lot.received_date ? formatDate(lot.received_date) : UNAVAILABLE,
    expiryDate: lot.expiry_date ? formatDate(lot.expiry_date) : UNAVAILABLE,
    receivedQty: lot.received_qty == null ? UNAVAILABLE : String(lot.received_qty),
    canUpdate: updateAction?.enabled === true,
    canPrint: printAction?.enabled === true,
    updateAction,
    printAction,
    updateDisabledReason: updateAction?.enabled ? null : updateAction?.disabled_reason_code ?? null,
    printDisabledReason: printAction?.enabled ? null : printAction?.disabled_reason_code ?? null,
  }
}

export function resolveLotListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode: string | null
}): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) return input.hasQuery ? 'no-result' : 'empty'
  return 'ready'
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

/** WMS02-005: copies must be a positive integer; reason is validated server-side (required only
 * on reprint) — the client never invents that rule up front. */
export function validatePrintForm(input: { copies: number }): string[] {
  const errors: string[] = []
  if (!Number.isInteger(input.copies) || input.copies <= 0) errors.push('copies')
  return errors
}
