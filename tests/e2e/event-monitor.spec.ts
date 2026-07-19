import { expect, test } from '@playwright/test'

test('event monitor route requires authentication', async ({ page }) => {
  await page.goto('/web/admin/events')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves event monitor return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fadmin%2Fevents')
  await expect(page).toHaveURL(/returnUrl/)
})
