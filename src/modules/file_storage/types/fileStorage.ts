export type FileStorageRecord = {
  id: number
  code: string
  original_filename: string
  mime_type: string
  size_bytes: number
  storage_provider: string
  sha256_checksum: string
  uploaded_by: number
  uploaded_at: string
  is_deleted: boolean
}

export type FileListPage = {
  items: FileStorageRecord[]
  page: {
    limit: number
    next_cursor: string | null
    has_more: boolean
  }
}

export type FileListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
  is_deleted?: boolean
}

export type SignedDownload = {
  file_id: number
  signed_url: string
  expires_at: string
  ttl_seconds: number
}

export type FileEventRow = {
  id: number
  code: string
  originalFilename: string
  mimeType: string
  sizeLabel: string
  storageProvider: string
  checksumPreview: string
  uploadedBy: string
  uploadedAt: string
  statusLabel: string
  isDeleted: boolean
}
