export function seedPassword(): string {
  return process.env.SEED_PASSWORD || process.env.DEMO_PASSWORD || 'dev@123456'
}

/** Primary personas = ordinal 1 emails from seed data.go (`{role}1@smartfactory.local`). */
export const personas = {
  system_admin: 'system_admin1@smartfactory.local',
  production_manager: 'production_manager1@smartfactory.local',
  warehouse_manager: 'warehouse_manager1@smartfactory.local',
  qc_manager: 'qc_manager1@smartfactory.local',
  viewer: 'viewer1@smartfactory.local',
  director: 'director1@smartfactory.local',
  admin: 'admin@smartfactory.local',
} as const

export type PersonaRole = keyof typeof personas
