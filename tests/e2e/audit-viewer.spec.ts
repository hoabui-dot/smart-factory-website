import { expect, test } from '@playwright/test'

test('audit viewer route requires authentication', async ({ page }) => {
  await page.goto('/web/admin/audit-logs')
  await expect(page).toHaveURL(/\/login/)
  await expect(page).toHaveURL(/returnUrl=.*audit-logs/)
  await expect(page.getByRole('heading', { name: 'Đăng nhập Web' })).toBeVisible()
})

test('admin landing exposes audit viewer deep link copy path', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fweb%2Fadmin%2Faudit-logs')
  await expect(page).toHaveURL(/returnUrl=%2Fweb%2Fadmin%2Faudit-logs/)
  await expect(page.getByRole('heading', { name: 'Đăng nhập Web' })).toBeVisible()
})
