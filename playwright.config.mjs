import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4173',
  },
  // Playwright only accepts globalSetup at root (not per-project). Gated inside
  // the setup file via CLI/env (not config.projects — FullConfig lists all).
  globalSetup: './tests/e2e-flows/global-setup.ts',
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'flows',
      testDir: './tests/e2e-flows',
      testIgnore: [
        '**/global-setup.ts',
        '**/credentials.ts',
        '**/helpers/**',
        '**/shouldRunFlowsAuthSetup.ts',
        '**/shouldRunFlowsAuthSetup.test.ts',
      ],
      dependencies: [],
      use: {
        ...devices['Desktop Chrome'],
        storageState: undefined, // per-file overrides
      },
    },
  ],
})
