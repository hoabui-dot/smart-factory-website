import { expect, test } from '@playwright/test'

test('identity admin route requires authentication', async ({ page }) => {
  await page.goto('/web/admin/users')
  await expect(page).toHaveURL(/\/login/)
  await expect(page).toHaveURL(/returnUrl=.*users/)
  await expect(page.getByRole('heading', { name: 'Đăng nhập Web' })).toBeVisible()
})

test('station devices (NB-01d) live under the identity admin route, not a separate route', async ({
  page,
}) => {
  // WEB-SCREENS WEB-NB-01-IDENTITY: station-device administration (NB01-014..018) is a sub-surface
  // of `/web/admin/users`; no dedicated `/web/admin/station-devices` route is defined.
  await page.goto('/web/admin/station-devices')
  await expect(page.getByRole('heading', { name: 'Không tìm thấy' })).toBeVisible()
})
