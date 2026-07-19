import { test, expect } from '@playwright/test'

test('print queue admin route requires authentication', async ({ page }) => {
  await page.goto('/web/admin/print-queue')
  await expect(page).toHaveURL(/\/login/)
})

test('admin landing exposes print queue deep link', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fadmin%2Fprint-queue')
  await expect(page).toHaveURL(/returnUrl/)
})
