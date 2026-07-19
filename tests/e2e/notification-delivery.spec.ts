import { expect, test } from '@playwright/test'

test('notification delivery admin requires authentication', async ({ page }) => {
  await page.goto('/web/admin/notification-delivery')
  await expect(page).toHaveURL(/\/login/)
})

test('notification settings requires authentication', async ({ page }) => {
  await page.goto('/web/settings/notifications')
  await expect(page).toHaveURL(/\/login/)
})
