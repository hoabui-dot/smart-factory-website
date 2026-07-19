import { expect, test } from '@playwright/test'

test('routing route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/routings')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves routing return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Froutings')
  await expect(page).toHaveURL(/returnUrl/)
})
