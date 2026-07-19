import { expect, test } from '@playwright/test'

test('work order route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/work-orders')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves work order return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fwork-orders')
  await expect(page).toHaveURL(/returnUrl/)
})
