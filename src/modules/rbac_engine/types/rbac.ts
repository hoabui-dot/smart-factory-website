import { CANONICAL_ROLE_CODES } from '@/shared/constants/roles'

export { CANONICAL_ROLE_CODES }
export type { CanonicalRoleCode } from '@/shared/constants/roles'

export type Permission = {
  id: number
  code: string
  module_code: string
  action: string
  scope: string
  description: string
  allowed_apps: string
}

export type PermissionListPage = {
  items: Permission[]
  page: {
    limit: number
    next_cursor: string | null
    has_more: boolean
  }
}

export type RolePermissionView = {
  role_code: string
  permission_codes: string[]
  permissions?: Permission[]
}

export type PermissionListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}
