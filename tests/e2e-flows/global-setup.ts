import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, type ChildProcess } from 'node:child_process'

import { chromium, type FullConfig } from '@playwright/test'

import { personas, seedPassword } from './credentials'
import { loginViaUI } from './helpers/login'
import { shouldRunFlowsAuthSetup } from './shouldRunFlowsAuthSetup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authDir = path.join(__dirname, '.auth')

const SEED_HINT =
  'Seed personas missing or Auth unavailable. Run `make seed` in apps/backend first, then retry.'

async function isReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url)
    return res.status > 0
  } catch {
    return false
  }
}

async function waitForUrl(url: string, timeoutMs: number, label: string): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await isReachable(url)) return
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`${label} not reachable at ${url} within ${timeoutMs}ms. ${SEED_HINT}`)
}

async function assertApiUp(apiBase: string): Promise<void> {
  const healthUrl = `${apiBase.replace(/\/$/, '')}/health`
  try {
    const health = await fetch(healthUrl)
    if (health.ok) return
  } catch {
    /* fall through to session probe */
  }

  const sessionUrl = `${apiBase.replace(/\/$/, '')}/api/auth/session`
  try {
    const session = await fetch(sessionUrl)
    // Unauthenticated probe: API is up if it answers (typically 401).
    if (session.status === 401 || session.status === 200) return
    throw new Error(`Unexpected /api/auth/session status ${session.status}`)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(
      `API not reachable at ${apiBase} (tried /health and /api/auth/session: ${detail}). ` +
        `Start the API and run \`make seed\` first.`,
    )
  }
}

async function ensureWebUp(baseURL: string, webRoot: string): Promise<ChildProcess | undefined> {
  if (await isReachable(baseURL)) return undefined

  const child = spawn('pnpm', ['dev', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: webRoot,
    shell: true,
    stdio: 'ignore',
  })

  try {
    await waitForUrl(baseURL, 120_000, 'Web app')
  } catch (err) {
    child.kill()
    throw err
  }

  return child
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  // Do not gate on config.projects — FullConfig always lists all projects.
  if (!shouldRunFlowsAuthSetup()) return

  const apiBase = process.env.E2E_API_URL || 'http://127.0.0.1:8080'
  await assertApiUp(apiBase)

  const baseURL =
    config.projects.find((p) => p.name === 'flows')?.use?.baseURL ||
    config.use?.baseURL ||
    'http://127.0.0.1:4173'

  const webRoot = path.resolve(__dirname, '../..')
  const started = await ensureWebUp(String(baseURL), webRoot)

  await mkdir(authDir, { recursive: true })
  const password = seedPassword()
  const browser = await chromium.launch()

  try {
    for (const [role, email] of Object.entries(personas)) {
      const context = await browser.newContext({ baseURL: String(baseURL) })
      const page = await context.newPage()
      try {
        await loginViaUI(page, email, password)
        await context.storageState({ path: path.join(authDir, `${role}.json`) })
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err)
        throw new Error(`Failed to create storageState for persona "${role}" (${email}): ${detail}. ${SEED_HINT}`)
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
    // Leave a server we started running so Playwright webServer can reuse it
    // (reuseExistingServer). Detach so teardown of this process does not kill it.
    if (started?.pid) {
      started.unref()
    }
  }
}
