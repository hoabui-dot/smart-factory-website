import { expect, test } from '@playwright/test'

test('inventory route requires authentication', async ({ page }) => {
  await page.goto('/web/wms/inventory')
  await expect(page).toHaveURL(/\/login/)
})

test('stocktake route requires authentication', async ({ page }) => {
  await page.goto('/web/wms/stocktakes')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves stocktake return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fwms%2Fstocktakes')
  await expect(page).toHaveURL(/returnUrl/)
})
