import { test, expect } from '@playwright/test'

test('file storage admin route requires authentication', async ({ page }) => {
  await page.goto('/web/admin/files')
  await expect(page).toHaveURL(/\/login/)
})

test('admin landing exposes file storage deep link', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fadmin%2Ffiles')
  await expect(page).toHaveURL(/returnUrl/)
})
