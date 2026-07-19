/** PRODUCT-OVERVIEW §4 — 9 default role codes. */
export const CANONICAL_ROLE_CODES = [
  'system_admin',
  'director',
  'production_manager',
  'warehouse_manager',
  'warehouse_staff',
  'qc_manager',
  'qc_staff',
  'operator',
  'viewer',
] as const

export type CanonicalRoleCode = (typeof CANONICAL_ROLE_CODES)[number]
