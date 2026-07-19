import { expect, test } from '@playwright/test'

test('goods receipt route requires authentication', async ({ page }) => {
  await page.goto('/web/wms/goods-receipts')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves goods receipt return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fwms%2Fgoods-receipts')
  await expect(page).toHaveURL(/returnUrl/)
})
