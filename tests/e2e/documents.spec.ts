import { expect, test } from '@playwright/test'

test('documents route requires authentication', async ({ page }) => {
  await page.goto('/web/qms/documents')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves documents return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fqms%2Fdocuments')
  await expect(page).toHaveURL(/returnUrl/)
})
