import { expect, test } from '@playwright/test'

test('worker job console requires authentication', async ({ page }) => {
  await page.goto('/web/admin/worker-jobs')
  await expect(page).toHaveURL(/\/login/)
})
