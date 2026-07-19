import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const viewerState = path.join(__dirname, '.auth', 'viewer.json')
const warehouseManagerState = path.join(__dirname, '.auth', 'warehouse_manager.json')
const systemAdminState = path.join(__dirname, '.auth', 'system_admin.json')

async function filterBy(page: Page, fieldLabel: string, query: string): Promise<void> {
  await page.getByRole('textbox', { name: fieldLabel }).fill(query)
  await page.getByRole('button', { name: 'Lọc' }).click()
}

test.describe('TP-3 RBAC matrix (viewer)', () => {
  test.use({ storageState: viewerState })

  // Product gate: isSystemAdminSession — non-admin sees alert, no mutate controls.
  test('TC-RBAC-001 viewer denied Identity Admin mutate', async ({ page }) => {
    await page.goto('/web/admin/users')
    await expect(page.getByRole('heading', { name: 'Identity & User Admin' })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(
      'Bạn không có quyền quản trị identity (system_admin_only).',
    )
    await expect(page.getByRole('button', { name: 'Tạo user' })).toHaveCount(0)
  })

  // Viewer has no WMS-01.view.* grant — list API returns PERMISSION_DENIED.
  test('TC-WMS-009 viewer denied Location Master view', async ({ page }) => {
    await page.goto('/web/wms/locations')
    await expect(page.getByRole('heading', { name: 'Location Master' })).toBeVisible()
    // listStateMessage uses role=status for permission-denied (alert only for generic error).
    await expect(page.getByText('Bạn không có quyền xem danh mục location.')).toBeVisible()
  })
})

test.describe('TP-3 RBAC matrix (warehouse_manager)', () => {
  test.use({ storageState: warehouseManagerState })

  test('TC-RBAC-002 warehouse manager reaches Locations with seed bins', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByRole('complementary', { name: 'Điều hướng chính' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Locations' })).toBeVisible()

    await page.getByRole('link', { name: 'Locations' }).click()
    await expect(page).toHaveURL(/\/web\/wms\/locations/)
    await expect(page.getByRole('heading', { name: 'Location Master' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tạo location' })).toBeVisible()

    await filterBy(page, 'Tìm location (code / tên)', 'SEED-BIN-R01')
    await expect(page.getByText('SEED-BIN-R01')).toBeVisible()
    await expect(page.getByText(/Seed Bin Raw 01/)).toBeVisible()
  })
})

test.describe('TP-3 RBAC matrix (system_admin)', () => {
  test.use({ storageState: systemAdminState })

  test('TC-RBAC-003 system admin reaches Identity Admin with mutate', async ({ page }) => {
    await page.goto('/web/admin/users')
    await expect(page.getByRole('heading', { name: 'Identity & User Admin' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tạo user' })).toBeVisible()
    await expect(
      page.getByText('Bạn không có quyền quản trị identity (system_admin_only).'),
    ).toHaveCount(0)

    await page.goto('/web/admin/rbac')
    await expect(page.getByRole('heading', { name: 'RBAC Admin' })).toBeVisible()
    await expect(
      page.getByText('Bạn không có quyền xem RBAC Admin (system_admin_only).'),
    ).toHaveCount(0)
    await expect(page.getByLabel('Role')).toBeVisible()
  })
})
