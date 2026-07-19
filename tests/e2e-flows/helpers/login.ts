import type { Page } from '@playwright/test'

/** Fill the Web login form and submit. */
export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 })
}
