import { expect, test } from '@playwright/test'

test('shift/skill route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/shifts')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves shift/skill return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fshifts')
  await expect(page).toHaveURL(/returnUrl/)
})
