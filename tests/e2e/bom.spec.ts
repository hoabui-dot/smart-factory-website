import { expect, test } from '@playwright/test'

test('bom route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/boms')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves bom return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fboms')
  await expect(page).toHaveURL(/returnUrl/)
})
