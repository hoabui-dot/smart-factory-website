import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatSizeBytes,
  projectFileRow,
  resolveArchiveUiState,
  resolveFileListState,
} from './fileProjection.ts'
import type { FileStorageRecord } from '../types/fileStorage.ts'

const sample: FileStorageRecord = {
  id: 12,
  code: 'FILE-000012',
  original_filename: 'defect.jpg',
  mime_type: 'image/jpeg',
  size_bytes: 2048,
  storage_provider: 'S3',
  sha256_checksum: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  uploaded_by: 10,
  uploaded_at: '2026-07-18T01:00:00Z',
  is_deleted: false,
}

describe('projectFileRow', () => {
  it('projects business fields and never exposes storage_path', () => {
    const row = projectFileRow(sample)
    assert.equal(row.code, 'FILE-000012')
    assert.equal(row.originalFilename, 'defect.jpg')
    assert.equal(row.sizeLabel, '2.0 KB')
    assert.equal(row.statusLabel, 'AVAILABLE')
    assert.equal(row.checksumPreview.slice(0, 8), 'aaaaaaaa')
    assert.equal('storagePath' in row, false)
  })

  it('marks archived files', () => {
    const row = projectFileRow({ ...sample, is_deleted: true })
    assert.equal(row.statusLabel, 'ARCHIVED')
    assert.equal(row.isDeleted, true)
  })
})

describe('formatSizeBytes', () => {
  it('formats bytes and megabytes', () => {
    assert.equal(formatSizeBytes(512), '512 B')
    assert.equal(formatSizeBytes(1024 * 1024), '1.0 MB')
  })
})

describe('resolveFileListState', () => {
  it('maps loading/empty/no-result/permission/error states', () => {
    assert.equal(resolveFileListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }), 'loading')
    assert.equal(resolveFileListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }), 'empty')
    assert.equal(resolveFileListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }), 'no-result')
    assert.equal(
      resolveFileListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
    assert.equal(resolveFileListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'X' }), 'error')
  })
})

describe('resolveArchiveUiState', () => {
  it('requires confirm then surfaces success/error', () => {
    assert.equal(resolveArchiveUiState({ confirmOpen: false, status: 'idle', errorCode: null }), 'idle')
    assert.equal(resolveArchiveUiState({ confirmOpen: true, status: 'idle', errorCode: null }), 'confirm')
    assert.equal(resolveArchiveUiState({ confirmOpen: true, status: 'pending', errorCode: null }), 'pending')
    assert.equal(resolveArchiveUiState({ confirmOpen: false, status: 'success', errorCode: null }), 'success')
    assert.equal(
      resolveArchiveUiState({ confirmOpen: false, status: 'error', errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
  })
})
