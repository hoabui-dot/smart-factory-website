import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const productionManagerState = path.join(__dirname, '.auth', 'production_manager.json')
const warehouseManagerState = path.join(__dirname, '.auth', 'warehouse_manager.json')

async function filterBy(page: Page, fieldLabel: string, query: string): Promise<void> {
  await page.getByRole('textbox', { name: fieldLabel }).fill(query)
  await page.getByRole('button', { name: 'Lọc' }).click()
}

function rowForCode(page: Page, code: string) {
  return page.getByRole('row').filter({ has: page.getByRole('button', { name: code }) })
}

test.describe('TP-2 factory loop MES (production_manager)', () => {
  test.use({ storageState: productionManagerState })

  // After seed-flows releases linked WOs, CO advances CONFIRMED → IN_PRODUCTION.
  test('TC-MES-005 customer order SEED-CO-0001 post-confirm status', async ({ page }) => {
    await page.goto('/web/mes/customer-orders')
    await expect(page.getByRole('heading', { name: 'Customer Order & Shipment' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Orders' })).toHaveAttribute('aria-selected', 'true')
    await filterBy(page, 'Tìm', 'SEED-CO-0001')
    const row = rowForCode(page, 'SEED-CO-0001')
    await expect(row.getByRole('button', { name: 'SEED-CO-0001' })).toBeVisible()
    await expect(row.getByText(/^(CONFIRMED|IN_PRODUCTION)$/)).toBeVisible()
    await row.getByRole('button', { name: 'SEED-CO-0001' }).click()
    await expect(page.getByRole('heading', { name: 'SEED-CO-0001' })).toBeVisible()
    await expect(page.getByLabel('Chi tiết customer order')).toContainText(/CONFIRMED|IN_PRODUCTION/)
  })

  // After seed-flows release, RELEASED is transient → MATERIAL_PREPARING (BOM MRs) or MATERIAL_READY.
  // UI renders raw UPPER_SNAKE status (WorkOrderPage / workOrderProjection).
  test('TC-MES-006 work order SEED-WO-0001 post-release status', async ({ page }) => {
    await page.goto('/web/mes/work-orders')
    await expect(page.getByRole('heading', { name: 'Lệnh Sản xuất (Work Order)' })).toBeVisible()
    await filterBy(page, 'Tìm Work Order (code)', 'SEED-WO-0001')
    const row = rowForCode(page, 'SEED-WO-0001')
    await expect(row.getByRole('button', { name: 'SEED-WO-0001' })).toBeVisible()
    await expect(row.getByText(/^(RELEASED|MATERIAL_PREPARING|MATERIAL_READY)$/)).toBeVisible()
    await expect(row.getByText(/SEED-FG-MOUNT/)).toBeVisible()
    await row.getByRole('button', { name: 'SEED-WO-0001' }).click()
    await expect(page.getByRole('heading', { name: 'SEED-WO-0001' })).toBeVisible()
    await expect(page.getByLabel('Chi tiết Work Order')).toContainText(
      /RELEASED|MATERIAL_PREPARING|MATERIAL_READY/,
    )
  })
})

test.describe('TP-2 factory loop WMS (warehouse_manager)', () => {
  test.use({ storageState: warehouseManagerState })

  test('TC-WMS-005 goods receipt SEED-GRN-0001 CONFIRMED', async ({ page }) => {
    await page.goto('/web/wms/goods-receipts')
    await expect(page.getByRole('heading', { name: 'Goods Receipt Review' })).toBeVisible()
    await page.getByRole('tab', { name: 'Goods Receipts' }).click()
    await expect(page.getByRole('tab', { name: 'Goods Receipts' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await filterBy(page, 'Tìm goods receipt (code)', 'SEED-GRN-0001')
    const row = rowForCode(page, 'SEED-GRN-0001')
    await expect(row.getByRole('button', { name: 'SEED-GRN-0001' })).toBeVisible()
    await expect(row.getByText('CONFIRMED')).toBeVisible()
    await row.getByRole('button', { name: 'SEED-GRN-0001' }).click()
    await expect(page.getByRole('heading', { name: 'SEED-GRN-0001' })).toBeVisible()
    await expect(page.getByLabel('Chi tiết goods receipt')).toContainText('CONFIRMED')
  })
})
