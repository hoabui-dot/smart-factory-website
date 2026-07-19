import { expect, test } from '@playwright/test'

test('engineering change route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/change-requests')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves engineering change return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fchange-requests')
  await expect(page).toHaveURL(/returnUrl/)
})
