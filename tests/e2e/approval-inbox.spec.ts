import { expect, test } from '@playwright/test'

test('approval inbox route requires authentication', async ({ page }) => {
  await page.goto('/web/shared/approval-inbox')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves approval inbox return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fshared%2Fapproval-inbox')
  await expect(page).toHaveURL(/returnUrl/)
})
