import { expect, test } from '@playwright/test'

test('supplier master route requires authentication', async ({ page }) => {
  await page.goto('/web/wms/suppliers')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves supplier master return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fwms%2Fsuppliers')
  await expect(page).toHaveURL(/returnUrl/)
})
