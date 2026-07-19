/**
 * Decide whether persona-auth globalSetup should run.
 *
 * Playwright FullConfig.projects always lists every defined project, so
 * `config.projects.some(p => p.name === 'flows')` is true even for
 * `pnpm test:e2e` (`--project=chromium`). Gate on CLI/env instead.
 */
export function shouldRunFlowsAuthSetup(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  argv: readonly string[] = process.argv,
): boolean {
  if (env.PLAYWRIGHT_FLOWS === '1') return true

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--project=flows') return true
    if (arg === '--project' && argv[i + 1] === 'flows') return true
  }

  return false
}
