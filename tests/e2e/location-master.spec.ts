import { expect, test } from '@playwright/test'

test('location master route requires authentication', async ({ page }) => {
  await page.goto('/web/wms/locations')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves location master return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fwms%2Flocations')
  await expect(page).toHaveURL(/returnUrl/)
})
