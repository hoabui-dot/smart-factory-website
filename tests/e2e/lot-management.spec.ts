import { expect, test } from '@playwright/test'

test('lot management route requires authentication', async ({ page }) => {
  await page.goto('/web/wms/lots')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves lot management return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fwms%2Flots')
  await expect(page).toHaveURL(/returnUrl/)
})
