import { expect, test } from '@playwright/test'

test('unauthenticated root redirects to login shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'Đăng nhập Web' })).toBeVisible()
  await expect(page.getByText('SmartFactory').first()).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Mật khẩu')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible()
})

test('login page preserves returnUrl query', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Fadmin')
  await expect(page.getByRole('heading', { name: 'Đăng nhập Web' })).toBeVisible()
  await expect(page).toHaveURL(/returnUrl=%2Fadmin/)
})

test('login page documents Supabase NB01 auth boundary', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText(/NB01-001/)).toBeVisible()
  await expect(page.getByText('/api/auth/session')).toBeVisible()
  await expect(page.getByText('X-App-Type=web')).toBeVisible()
})
