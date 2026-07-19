import { expect, test } from '@playwright/test'

test('item master route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/items')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves item master return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fitems')
  await expect(page).toHaveURL(/returnUrl/)
})
