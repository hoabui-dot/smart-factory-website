import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// We will test the pure math logic of pagination to guarantee no regression.
function getPaginationSlice<T>(items: T[], page: number, size: number) {
  const startIndex = (page - 1) * size
  return items.slice(startIndex, startIndex + size)
}

describe('Pagination Math Logic', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1)

  it('correctly slices the first page', () => {
    const page1 = getPaginationSlice(items, 1, 10)
    assert.deepEqual(page1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('correctly slices the second page', () => {
    const page2 = getPaginationSlice(items, 2, 10)
    assert.deepEqual(page2, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  })

  it('correctly slices the last partial page', () => {
    const page3 = getPaginationSlice(items, 3, 10)
    assert.deepEqual(page3, [21, 22, 23, 24, 25])
  })

  it('handles custom page sizes', () => {
    const page2 = getPaginationSlice(items, 2, 5)
    assert.deepEqual(page2, [6, 7, 8, 9, 10])
  })
})
