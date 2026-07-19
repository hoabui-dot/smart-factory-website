import { expect, test } from '@playwright/test'

test('traceability route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/traceability')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves traceability return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Ftraceability')
  await expect(page).toHaveURL(/returnUrl/)
})
