import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findAllowedAction,
  isActionEnabled,
  projectStationDeviceRow,
  projectUserRow,
  resolveIdentityListState,
  resolveResetPasswordUi,
  resolveStationDeviceMutationUi,
  validateStationDeviceCreateForm,
} from './identityProjection.ts'
import type { StationDevice, UserSummary } from '../types/userAdmin.ts'

describe('projectUserRow', () => {
  it('shows business code and never exposes password fields', () => {
    const user: UserSummary = {
      code: 'EMP-0007',
      full_name: 'Nguyễn Văn A',
      email: 'a@example.com',
      is_active: true,
    }
    const row = projectUserRow(user)
    assert.equal(row.code, 'EMP-0007')
    assert.equal(row.fullName, 'Nguyễn Văn A')
    assert.equal(row.emailLabel, 'a@example.com')
    assert.equal(row.activeLabel, 'Active')
    assert.doesNotMatch(JSON.stringify(row), /password/i)
  })

  it('marks inactive users and missing email', () => {
    const row = projectUserRow({
      code: 'EMP-0008',
      full_name: 'Station Only',
      email: null,
      is_active: false,
    })
    assert.equal(row.emailLabel, '—')
    assert.equal(row.activeLabel, 'Disabled')
  })
})

describe('resolveIdentityListState', () => {
  it('maps loading/empty/permission states', () => {
    assert.equal(resolveIdentityListState({ status: 'loading', itemCount: 0, hasQuery: false }), 'loading')
    assert.equal(resolveIdentityListState({ status: 'success', itemCount: 0, hasQuery: true }), 'no-result')
    assert.equal(
      resolveIdentityListState({
        status: 'error',
        itemCount: 0,
        hasQuery: false,
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })
})

describe('resolveResetPasswordUi', () => {
  it('branches queued vs one-time PIN', () => {
    assert.equal(resolveResetPasswordUi({ status: 'idle' }), 'idle')
    assert.equal(
      resolveResetPasswordUi({ status: 'success', result: { job_code: 'JOB-1', status: 'QUEUED' } }),
      'queued',
    )
    assert.equal(
      resolveResetPasswordUi({
        status: 'success',
        result: { temporary_pin: '839204', password_change_required: true },
      }),
      'temporary-pin',
    )
    assert.equal(
      resolveResetPasswordUi({ status: 'error', errorCode: 'CREDENTIAL_RESET_PARTIAL_FAILURE' }),
      'retryable-partial',
    )
  })
})

describe('findAllowedAction / isActionEnabled', () => {
  it('finds action by name and reports enabled state', () => {
    const actions = [
      { action: 'update', method: 'PATCH', href: '/api/admin/station-devices/STN-001', enabled: true },
      {
        action: 'deactivate',
        method: 'DELETE',
        href: '/api/admin/station-devices/STN-001',
        enabled: false,
        disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
      },
    ]
    assert.equal(findAllowedAction(actions, 'update')?.enabled, true)
    assert.equal(isActionEnabled(actions, 'update'), true)
    assert.equal(isActionEnabled(actions, 'deactivate'), false)
    assert.equal(findAllowedAction(actions, 'missing'), null)
    assert.equal(isActionEnabled(undefined, 'update'), false)
  })
})

describe('projectStationDeviceRow', () => {
  it('projects business location code and gates mutations by server allowed_actions', () => {
    const device: StationDevice = {
      code: 'STN-001',
      device_type: 'TABLET',
      location_code: 'WH-RAW',
      hardware_id: 'HW-001',
      is_active: true,
      registered_at: '2026-07-01T00:00:00Z',
      allowed_actions: [
        { action: 'update', method: 'PATCH', href: '/api/admin/station-devices/STN-001', enabled: true },
        { action: 'deactivate', method: 'DELETE', href: '/api/admin/station-devices/STN-001', enabled: true },
      ],
    }
    const row = projectStationDeviceRow(device)
    assert.equal(row.code, 'STN-001')
    assert.equal(row.locationLabel, 'WH-RAW')
    assert.equal(row.canUpdate, true)
    assert.equal(row.canDeactivate, true)
    assert.doesNotMatch(JSON.stringify(row), /location_id/i)
  })

  it('reports deactivate disabled when server marks it not allowed', () => {
    const device: StationDevice = {
      code: 'STN-002',
      device_type: 'WORKSTATION',
      location_code: null,
      hardware_id: 'HW-002',
      is_active: false,
      registered_at: '2026-07-01T00:00:00Z',
      allowed_actions: [
        { action: 'update', method: 'PATCH', href: '/api/admin/station-devices/STN-002', enabled: true },
        {
          action: 'deactivate',
          method: 'DELETE',
          href: '/api/admin/station-devices/STN-002',
          enabled: false,
          disabled_reason_code: 'NOT_ALLOWED_BY_STATUS',
        },
      ],
    }
    const row = projectStationDeviceRow(device)
    assert.equal(row.locationLabel, '-')
    assert.equal(row.canDeactivate, false)
    assert.equal(row.deactivateDisabledReason, 'NOT_ALLOWED_BY_STATUS')
  })

  it('does not infer availability from is_active when allowed_actions absent', () => {
    const device: StationDevice = {
      code: 'STN-003',
      device_type: 'PDA',
      location_code: 'WH-RAW',
      hardware_id: 'HW-003',
      is_active: true,
      registered_at: '2026-07-01T00:00:00Z',
    }
    const row = projectStationDeviceRow(device)
    assert.equal(row.canUpdate, false)
    assert.equal(row.canDeactivate, false)
  })
})

describe('resolveStationDeviceMutationUi', () => {
  it('maps confirm/pending/success/error states', () => {
    assert.equal(
      resolveStationDeviceMutationUi({ confirmOpen: false, status: 'idle', errorCode: null }),
      'idle',
    )
    assert.equal(
      resolveStationDeviceMutationUi({ confirmOpen: true, status: 'idle', errorCode: null }),
      'confirm',
    )
    assert.equal(
      resolveStationDeviceMutationUi({ confirmOpen: true, status: 'pending', errorCode: null }),
      'pending',
    )
    assert.equal(
      resolveStationDeviceMutationUi({ confirmOpen: true, status: 'success', errorCode: null }),
      'success',
    )
    assert.equal(
      resolveStationDeviceMutationUi({
        confirmOpen: true,
        status: 'error',
        errorCode: 'NOT_ALLOWED_BY_STATUS',
      }),
      'not-allowed',
    )
    assert.equal(
      resolveStationDeviceMutationUi({
        confirmOpen: true,
        status: 'error',
        errorCode: 'PERMISSION_DENIED',
      }),
      'permission-denied',
    )
  })
})

describe('validateStationDeviceCreateForm', () => {
  it('requires location_code unless device_type is WORKSTATION', () => {
    assert.deepEqual(
      validateStationDeviceCreateForm({
        code: '',
        deviceType: '',
        hardwareId: '',
        locationCode: '',
      }),
      ['code', 'device_type', 'hardware_id', 'location_code'],
    )
    assert.deepEqual(
      validateStationDeviceCreateForm({
        code: 'STN-010',
        deviceType: 'WORKSTATION',
        hardwareId: 'HW-010',
        locationCode: '',
      }),
      [],
    )
    assert.deepEqual(
      validateStationDeviceCreateForm({
        code: 'STN-011',
        deviceType: 'TABLET',
        hardwareId: 'HW-011',
        locationCode: 'WH-RAW',
      }),
      [],
    )
  })
})
