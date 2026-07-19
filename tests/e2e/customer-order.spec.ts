import { expect, test } from '@playwright/test'

test('customer master route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/customers')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves customer master return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fcustomers')
  await expect(page).toHaveURL(/returnUrl/)
})

test('customer order route requires authentication', async ({ page }) => {
  await page.goto('/web/mes/customer-orders')
  await expect(page).toHaveURL(/\/login/)
})

test('login preserves customer order return URL', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fmes%2Fcustomer-orders')
  await expect(page).toHaveURL(/returnUrl/)
})
