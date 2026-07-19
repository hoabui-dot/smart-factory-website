import { expect, test } from '@playwright/test'

test('production monitor route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/production-logs')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves production monitor return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fproduction-logs')
  await expect(page).toHaveURL(/returnUrl/)
})
