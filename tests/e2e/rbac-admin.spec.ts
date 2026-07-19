import { expect, test } from '@playwright/test'

test('rbac admin route requires authentication', async ({ page }) => {
  await page.goto('/web/admin/rbac')
  await expect(page).toHaveURL(/\/login/)
  await expect(page).toHaveURL(/returnUrl=.*rbac/)
  await expect(page.getByRole('heading', { name: 'Đăng nhập Web' })).toBeVisible()
})
