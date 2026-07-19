import { expect, test } from '@playwright/test'

test('wo 360 route requires authentication', async ({ page }) => {
  await page.goto('/web/shared/wo-360/1')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves wo 360 return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fshared%2Fwo-360%2F1')
  await expect(page).toHaveURL(/returnUrl/)
})
