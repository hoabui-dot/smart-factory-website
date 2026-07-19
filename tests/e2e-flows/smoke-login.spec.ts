import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adminState = path.join(__dirname, '.auth', 'admin.json')

test.use({ storageState: adminState })

test('admin storageState lands in SmartFactory chrome (not login)', async ({ page }) => {
  await page.goto('/')
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.getByRole('complementary', { name: 'Điều hướng chính' })).toBeVisible()
  await expect(page.locator('.shell__brand strong')).toHaveText('SmartFactory')
})
