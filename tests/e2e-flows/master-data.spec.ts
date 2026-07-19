import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const productionManagerState = path.join(__dirname, '.auth', 'production_manager.json')
const systemAdminState = path.join(__dirname, '.auth', 'system_admin.json')

async function filterBy(page: Page, fieldLabel: string, query: string): Promise<void> {
  await page.getByRole('textbox', { name: fieldLabel }).fill(query)
  await page.getByRole('button', { name: 'Lọc' }).click()
}

test.describe('TP-1 MES master data (production_manager)', () => {
  test.use({ storageState: productionManagerState })

  test('TC-MES-001 item list shows SEED-FG-MOUNT', async ({ page }) => {
    await page.goto('/web/mes/items')
    await expect(page.getByRole('heading', { name: 'Danh mục Vật tư & Sản phẩm' })).toBeVisible()
    await filterBy(page, 'Tìm item (code / tên)', 'SEED-FG-MOUNT')
    await expect(page.getByRole('button', { name: 'SEED-FG-MOUNT' })).toBeVisible()
    await expect(page.getByText('Seed Engine Mount FG')).toBeVisible()
  })

  test('TC-MES-003 BOM SEED-BOM-MOUNT visible', async ({ page }) => {
    await page.goto('/web/mes/boms')
    await expect(page.getByRole('heading', { name: 'BOM Đa cấp' })).toBeVisible()
    await filterBy(page, 'Tìm BOM (code / sản phẩm)', 'SEED-BOM-MOUNT')
    await expect(page.getByText('SEED-BOM-MOUNT')).toBeVisible()
    await expect(page.getByText('SEED-FG-MOUNT').first()).toBeVisible()
  })

  test('TC-MES-004 routing SEED-RT-MOUNT visible', async ({ page }) => {
    await page.goto('/web/mes/routings')
    await expect(
      page.getByRole('heading', { name: 'Giai đoạn (GĐ), Trạm máy & Routing' }),
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Routings' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await filterBy(page, 'Tìm routing (code / version)', 'SEED-RT-MOUNT')
    await expect(page.getByText('SEED-RT-MOUNT')).toBeVisible()
    await expect(page.getByText('SEED-FG-MOUNT').first()).toBeVisible()
  })
})

test.describe('TP-1 WMS master data (system_admin)', () => {
  test.use({ storageState: systemAdminState })

  test('TC-WMS-004 suppliers list shows SEED-SUP-VN01', async ({ page }) => {
    await page.goto('/web/wms/suppliers')
    await expect(
      page.getByRole('heading', { name: 'Supplier Master & Mill Certificate' }),
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Suppliers' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await filterBy(page, 'Tìm supplier (code / tên)', 'SEED-SUP-VN01')
    await expect(page.getByText('SEED-SUP-VN01')).toBeVisible()
    await expect(page.getByText('Seed Supplier VN')).toBeVisible()
  })

  test('TC-WMS-002 locations list shows a SEED-BIN-*', async ({ page }) => {
    await page.goto('/web/wms/locations')
    await expect(page.getByRole('heading', { name: 'Location Master' })).toBeVisible()
    await filterBy(page, 'Tìm location (code / tên)', 'SEED-BIN-R01')
    await expect(page.getByText('SEED-BIN-R01')).toBeVisible()
    await expect(page.getByText(/Seed Bin Raw 01/)).toBeVisible()
  })
})
