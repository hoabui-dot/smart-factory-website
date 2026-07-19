export type UserSummary = {
  code: string
  full_name: string
  email: string | null
  is_active: boolean
}

export type UserDetail = {
  code: string
  full_name: string
  email: string | null
  phone_number: string | null
  password_change_required: boolean
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
  roles: string[]
  locations: string[]
}

export type UserListPage = {
  items: UserSummary[]
  page: {
    limit: number
    next_cursor: string | null
    has_more: boolean
  }
}

export type UserCreateRequest = {
  code: string
  full_name: string
  email?: string | null
  phone_number?: string | null
  is_active?: boolean
}

export type UserUpdateRequest = {
  full_name?: string
  email?: string | null
  phone_number?: string | null
}

export type ResetPasswordResult = {
  job_code?: string
  status?: string
  temporary_pin?: string
  password_change_required?: boolean
}

export type UserListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** API-SPEC §6.4 server-driven action envelope (NB-01d soft-API-gap additive projection). */
export type AllowedAction = {
  action: string
  method: string
  href: string
  enabled: boolean
  disabled_reason_code?: string | null
}

export const DEVICE_TYPE_VALUES = ['TABLET', 'PDA', 'WORKSTATION'] as const
export type DeviceType = (typeof DEVICE_TYPE_VALUES)[number]

/** NB01-014..018 station_device summary/detail projection. */
export type StationDevice = {
  code: string
  device_type: DeviceType | string
  location_code: string | null
  hardware_id: string
  is_active: boolean
  registered_at: string
  allowed_actions?: AllowedAction[]
}

export type StationDeviceListPage = {
  items: StationDevice[]
  page: {
    limit: number
    next_cursor: string | null
    has_more: boolean
  }
}

export type StationDeviceListQuery = {
  limit?: number
  cursor?: string
  sort?: string
  q?: string
}

/** NB01-016 body. */
export type StationDeviceCreateRequest = {
  code: string
  device_type: string
  location_code?: string | null
  hardware_id: string
  is_active?: boolean
}

/** NB01-017 sparse PATCH body. */
export type StationDeviceUpdateRequest = {
  device_type?: string
  location_code?: string | null
  hardware_id?: string
  is_active?: boolean
}
