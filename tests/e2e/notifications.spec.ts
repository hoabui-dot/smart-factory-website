import { expect, test } from '@playwright/test'

test('notification center route requires authentication', async ({ page }) => {
  await page.goto('/web/notifications')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves notifications return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fnotifications')
  await expect(page).toHaveURL(/returnUrl/)
})
