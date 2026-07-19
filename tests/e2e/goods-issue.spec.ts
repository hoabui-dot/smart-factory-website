import { expect, test } from '@playwright/test'

test('goods issue route requires authentication', async ({ page }) => {
  await page.goto('/web/wms/goods-issues')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves goods issue return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fwms%2Fgoods-issues')
  await expect(page).toHaveURL(/returnUrl/)
})
