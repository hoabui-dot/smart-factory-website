import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  diffPermissionCodes,
  resolveRbacListState,
  resolveSaveUiState,
} from './rbacProjection.ts'

describe('diffPermissionCodes', () => {
  it('detects unsaved changes between baseline and draft', () => {
    assert.equal(diffPermissionCodes(['a', 'b'], ['b', 'a']), false)
    assert.equal(diffPermissionCodes(['a', 'b'], ['a', 'b', 'c']), true)
    assert.equal(diffPermissionCodes(['a'], []), true)
  })
})

describe('resolveRbacListState', () => {
  it('maps loading/empty/permission states', () => {
    assert.equal(resolveRbacListState({ status: 'loading', itemCount: 0, hasQuery: false }), 'loading')
    assert.equal(resolveRbacListState({ status: 'success', itemCount: 0, hasQuery: false }), 'empty')
    assert.equal(resolveRbacListState({ status: 'success', itemCount: 0, hasQuery: true }), 'no-result')
    assert.equal(
      resolveRbacListState({ status: 'error', itemCount: 0, hasQuery: false, errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
  })
})

describe('resolveSaveUiState', () => {
  it('requires confirmation when draft differs', () => {
    assert.equal(resolveSaveUiState({ dirty: false, saving: false, errorCode: null }), 'idle')
    assert.equal(resolveSaveUiState({ dirty: true, saving: false, errorCode: null }), 'unsaved-changes')
    assert.equal(resolveSaveUiState({ dirty: true, saving: true, errorCode: null }), 'saving')
    assert.equal(
      resolveSaveUiState({ dirty: true, saving: false, errorCode: 'PERMISSION_DENIED' }),
      'permission-denied',
    )
  })
})
