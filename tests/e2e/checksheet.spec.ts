import { expect, test } from '@playwright/test'

test('checksheet route requires authentication', async ({ page }) => {
  await page.goto('/web/qms/checksheets')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves checksheet return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fqms%2Fchecksheets')
  await expect(page).toHaveURL(/returnUrl/)
})
