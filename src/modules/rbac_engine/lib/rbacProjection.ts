export type RbacListUiState =
  | 'loading'
  | 'empty'
  | 'no-result'
  | 'ready'
  | 'permission-denied'
  | 'error'
  | 'not-found'

export function resolveRbacListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode?: string | null
}): RbacListUiState {
  if (input.status === 'loading') return 'loading'
  if (input.status === 'error') {
    if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
    if (input.errorCode === 'RESOURCE_NOT_FOUND') return 'not-found'
    return 'error'
  }
  if (input.itemCount === 0) return input.hasQuery ? 'no-result' : 'empty'
  return 'ready'
}

export function diffPermissionCodes(baseline: string[], draft: string[]): boolean {
  const a = [...baseline].sort()
  const b = [...draft].sort()
  if (a.length !== b.length) return true
  return a.some((code, index) => code !== b[index])
}

export type SaveUiState = 'idle' | 'unsaved-changes' | 'saving' | 'permission-denied' | 'error'

export function resolveSaveUiState(input: {
  dirty: boolean
  saving: boolean
  errorCode: string | null
}): SaveUiState {
  if (input.saving) return 'saving'
  if (input.errorCode === 'PERMISSION_DENIED') return 'permission-denied'
  if (input.errorCode) return 'error'
  if (input.dirty) return 'unsaved-changes'
  return 'idle'
}
