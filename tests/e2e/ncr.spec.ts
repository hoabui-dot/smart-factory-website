import { expect, test } from '@playwright/test'

test('ncr route requires authentication', async ({ page }) => {
  await page.goto('/web/qms/ncrs')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves ncr return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fqms%2Fncrs')
  await expect(page).toHaveURL(/returnUrl/)
})
