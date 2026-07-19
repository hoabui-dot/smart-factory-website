import { expect, test } from '@playwright/test'

test('my work route requires authentication', async ({ page }) => {
  await page.goto('/web/shared/my-work')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves my work return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fshared%2Fmy-work')
  await expect(page).toHaveURL(/returnUrl/)
})
