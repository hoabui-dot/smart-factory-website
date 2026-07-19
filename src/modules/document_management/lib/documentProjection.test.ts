import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  projectDocumentRow,
  projectDocumentTypeLookups,
  projectPpapRow,
  projectRevisionRow,
  resolveListState,
  resolveMutationUiState,
  validateDocumentCreateForm,
  validateReason,
  validateReleaseFileId,
  validateRevisionCreateForm,
  validatePpapCreateForm,
} from './documentProjection.ts'
import type { DocumentRecord, DocumentRevisionRecord, PpapSubmissionRecord } from '../types/document.ts'

const activeDoc: DocumentRecord = {
  id: 1,
  code: 'SOP-001',
  doc_title: 'Work Instruction',
  doc_type_id: 2,
  owner_id: 9,
  is_active: true,
  created_at: '2026-07-18T00:00:00Z',
  doc_type_code: 'SOP',
  owner_code: 'USR-QC',
  related_item_code: 'ITM-A',
  related_customer_code: 'CUS-1',
  current_revision_code: 'REV-1',
  allowed_actions: [
    { action: 'update', method: 'PATCH', href: '/api/qms/documents/SOP-001', enabled: true },
    { action: 'deactivate', method: 'DELETE', href: '/api/qms/documents/SOP-001', enabled: true },
  ],
}

const draftRev: DocumentRevisionRecord = {
  id: 10,
  code: 'REV-1',
  document_id: 1,
  status: 'DRAFT',
  effective_from: '2026-07-01',
  document_code: 'SOP-001',
  allowed_actions: [
    {
      action: 'submit',
      method: 'POST',
      href: '/api/qms/document-revisions/REV-1/submit',
      enabled: true,
    },
    {
      action: 'release',
      method: 'POST',
      href: '/api/qms/document-revisions/REV-1/release',
      enabled: false,
      disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
    },
  ],
}

const draftPpap: PpapSubmissionRecord = {
  id: 20,
  code: 'PPAP-1',
  customer_id: 3,
  item_id: 4,
  ppap_level: '3',
  submission_type: 'INITIAL',
  status: 'DRAFT',
  customer_code: 'CUS-1',
  item_code: 'ITM-A',
  allowed_actions: [
    {
      action: 'update',
      method: 'PATCH',
      href: '/api/qms/ppap-submissions/PPAP-1',
      enabled: true,
    },
    {
      action: 'prepare',
      method: 'POST',
      href: '/api/qms/ppap-submissions/PPAP-1/prepare',
      enabled: true,
    },
  ],
}

describe('documentProjection', () => {
  it('findAllowedAction returns server envelope by action name', () => {
    const action = findAllowedAction(activeDoc.allowed_actions, 'update')
    assert.equal(action?.href, '/api/qms/documents/SOP-001')
    assert.equal(findAllowedAction(activeDoc.allowed_actions, 'missing'), null)
  })

  it('projectDocumentRow uses business codes and allowed_actions only', () => {
    const row = projectDocumentRow(activeDoc)
    assert.equal(row.code, 'SOP-001')
    assert.equal(row.docTypeLabel, 'SOP')
    assert.equal(row.ownerLabel, 'USR-QC')
    assert.equal(row.itemLabel, 'ITM-A')
    assert.equal(row.customerLabel, 'CUS-1')
    assert.equal(row.currentRevisionLabel, 'REV-1')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
    assert.equal(row.updateAction?.method, 'PATCH')
  })

  it('projectRevisionRow does not infer release from status', () => {
    const row = projectRevisionRow(draftRev)
    assert.equal(row.canSubmit, true)
    assert.equal(row.canRelease, false)
    assert.equal(row.canReject, false)
    assert.equal(row.canObsolete, false)
  })

  it('projectPpapRow projects prepare from allowed_actions', () => {
    const row = projectPpapRow(draftPpap)
    assert.equal(row.customerLabel, 'CUS-1')
    assert.equal(row.itemLabel, 'ITM-A')
    assert.equal(row.canPrepare, true)
    assert.equal(row.canSubmit, false)
    assert.equal(row.canUpdate, true)
  })

  it('projectDocumentTypeLookups maps REFDATA row_version to id', () => {
    const rows = projectDocumentTypeLookups([
      { code: 'SOP', label: 'SOP VI', is_active: true, row_version: '7' },
      { code: 'BAD', label: 'x', is_active: true, row_version: 'nope' },
    ])
    assert.deepEqual(rows, [{ id: 7, code: 'SOP', name_vi: 'SOP VI', is_active: true }])
  })

  it('resolveListState covers empty/no-result/permission', () => {
    assert.equal(
      resolveListState({ status: 'loading', itemCount: 0, hasQuery: false, errorCode: null }),
      'loading',
    )
    assert.equal(
      resolveListState({ status: 'success', itemCount: 0, hasQuery: false, errorCode: null }),
      'empty',
    )
    assert.equal(
      resolveListState({ status: 'success', itemCount: 0, hasQuery: true, errorCode: null }),
      'no-result',
    )
    assert.equal(
      resolveListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })

  it('resolveMutationUiState maps confirm and canonical errors', () => {
    assert.equal(
      resolveMutationUiState({ confirmOpen: true, status: 'idle', errorCode: null }),
      'confirm',
    )
    assert.equal(
      resolveMutationUiState({
        confirmOpen: false,
        status: 'error',
        errorCode: 'NOT_ALLOWED_BY_STATUS',
      }),
      'not-allowed',
    )
  })

  it('validates create/release/reason forms', () => {
    assert.deepEqual(
      validateDocumentCreateForm({
        code: '',
        doc_title: '',
        doc_type_id: 0,
        owner_id: 0,
        is_active: true,
      }),
      ['code', 'doc_title', 'doc_type_id', 'owner_id'],
    )
    assert.deepEqual(
      validateRevisionCreateForm({ code: 'R1', effective_from: '2026-07-01' }),
      [],
    )
    assert.deepEqual(validateReleaseFileId(0), ['file_id'])
    assert.deepEqual(validateReason(''), ['reason'])
    assert.deepEqual(
      validatePpapCreateForm({
        code: 'P1',
        customer_id: 1,
        item_id: 2,
        ppap_level: '3',
        submission_type: 'INITIAL',
      }),
      [],
    )
  })
})
