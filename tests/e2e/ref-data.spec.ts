import { expect, test } from '@playwright/test'

test('ref-data hub route requires authentication', async ({ page }) => {
  await page.goto('/web/admin/ref-data')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves ref-data return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fadmin%2Fref-data')
  await expect(page).toHaveURL(/returnUrl/)
})
