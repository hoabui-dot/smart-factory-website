import { expect, test } from '@playwright/test'

test('production dashboard route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/dashboards')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves production dashboard return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fdashboards')
  await expect(page).toHaveURL(/returnUrl/)
})
