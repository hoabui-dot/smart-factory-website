import { expect, test } from '@playwright/test'

test('inspection result route requires authentication', async ({ page }) => {
  await page.goto('/web/qms/inspection-results')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves inspection result return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fqms%2Finspection-results')
  await expect(page).toHaveURL(/returnUrl/)
})
