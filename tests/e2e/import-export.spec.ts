import { expect, test } from '@playwright/test'

test('import-export center route requires authentication', async ({ page }) => {
  await page.goto('/web/import-export')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves import-export return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fimport-export')
  await expect(page).toHaveURL(/returnUrl/)
})
