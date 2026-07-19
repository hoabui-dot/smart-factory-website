import type { FileEventRow, FileStorageRecord } from '../types/fileStorage'

const UNAVAILABLE = '—'

export function formatSizeBytes(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return UNAVAILABLE
  }
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

export function projectFileRow(file: FileStorageRecord): FileEventRow {
  return {
    id: file.id,
    code: file.code || UNAVAILABLE,
    originalFilename: file.original_filename || UNAVAILABLE,
    mimeType: file.mime_type || UNAVAILABLE,
    sizeLabel: formatSizeBytes(file.size_bytes),
    storageProvider: file.storage_provider || UNAVAILABLE,
    checksumPreview: file.sha256_checksum ? file.sha256_checksum.slice(0, 12) : UNAVAILABLE,
    uploadedBy: String(file.uploaded_by ?? UNAVAILABLE),
    uploadedAt: file.uploaded_at || UNAVAILABLE,
    statusLabel: file.is_deleted ? 'ARCHIVED' : 'AVAILABLE',
    isDeleted: Boolean(file.is_deleted),
  }
}

export function resolveFileListState(input: {
  status: 'loading' | 'success' | 'error'
  itemCount: number
  hasQuery: boolean
  errorCode: string | null
}): 'loading' | 'empty' | 'no-result' | 'permission-denied' | 'error' | 'ready' {
  if (input.status === 'loading') {
    return 'loading'
  }
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  if (input.itemCount === 0) {
    return input.hasQuery ? 'no-result' : 'empty'
  }
  return 'ready'
}

export function resolveArchiveUiState(input: {
  confirmOpen: boolean
  status: 'idle' | 'pending' | 'success' | 'error'
  errorCode: string | null
}): 'idle' | 'confirm' | 'pending' | 'success' | 'permission-denied' | 'error' {
  if (input.status === 'pending') {
    return 'pending'
  }
  if (input.status === 'success') {
    return 'success'
  }
  if (input.status === 'error') {
    return input.errorCode === 'PERMISSION_DENIED' ? 'permission-denied' : 'error'
  }
  return input.confirmOpen ? 'confirm' : 'idle'
}
