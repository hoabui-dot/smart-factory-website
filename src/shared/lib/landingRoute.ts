/**
 * Resolves post-login landing route per WEB-SCREENS §4.5.
 * Safe returnUrl (authorized later by route guards) wins over role default.
 */
export function resolveLandingRoute(
  roles: string[],
  returnUrl?: string | null,
): string {
  if (returnUrl && isSafeInternalPath(returnUrl)) {
    return returnUrl
  }
  const primary = pickPrimaryRole(roles)
  switch (primary) {
    case 'system_admin':
      return '/admin'
    case 'director':
      return '/dashboard'
    case 'viewer':
      return '/reports'
    case 'production_manager':
    case 'warehouse_manager':
    case 'qc_manager':
      return '/web/shared/my-work'
    default:
      return '/home'
  }
}

export function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false
  }
  if (path.includes('://') || path.includes('\\')) {
    return false
  }
  return true
}

const ROLE_PRIORITY = [
  'system_admin',
  'director',
  'production_manager',
  'warehouse_manager',
  'qc_manager',
  'viewer',
] as const

function pickPrimaryRole(roles: string[]): string | undefined {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return role
    }
  }
  return roles[0]
}
