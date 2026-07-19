import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { shouldRunFlowsAuthSetup } from './shouldRunFlowsAuthSetup.ts'

test('skips when chromium-only CLI (FullConfig still lists flows)', () => {
  // Playwright FullConfig.projects always includes every defined project.
  const fullConfigAlwaysHasFlows = [{ name: 'chromium' }, { name: 'flows' }]
  assert.equal(
    fullConfigAlwaysHasFlows.some((p) => p.name === 'flows'),
    true,
    'precondition: FullConfig gate is always true',
  )

  assert.equal(
    shouldRunFlowsAuthSetup({}, ['node', 'playwright', 'test', '--project=chromium']),
    false,
  )
})

test('runs when --project=flows', () => {
  assert.equal(
    shouldRunFlowsAuthSetup({}, ['node', 'playwright', 'test', '--project=flows']),
    true,
  )
})

test('runs when --project flows', () => {
  assert.equal(
    shouldRunFlowsAuthSetup({}, ['node', 'playwright', 'test', '--project', 'flows']),
    true,
  )
})

test('runs when PLAYWRIGHT_FLOWS=1', () => {
  assert.equal(
    shouldRunFlowsAuthSetup({ PLAYWRIGHT_FLOWS: '1' }, ['node', 'playwright', 'test', '--project=chromium']),
    true,
  )
})
