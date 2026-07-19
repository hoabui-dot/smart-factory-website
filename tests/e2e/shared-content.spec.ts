import { expect, test } from '@playwright/test'

test('shared content picker route requires authentication', async ({ page }) => {
  await page.goto('/web/shared/entities')
  await expect(page).toHaveURL(/\/login/)
})

test('shared content entity route requires authentication', async ({ page }) => {
  await page.goto('/web/shared/entities/lot/1/content')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves shared content return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fshared%2Fentities%2Flot%2F1%2Fcontent')
  await expect(page).toHaveURL(/returnUrl/)
})
