import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'
import { CANONICAL_ROLE_CODES } from '@/shared/constants/roles'

import {
  createStationDevice,
  createUser,
  deactivateStationDeviceViaAction,
  disableUser,
  getStationDevice,
  getUser,
  listStationDevices,
  listUsers,
  replaceUserLocations,
  replaceUserRoles,
  resetUserPassword,
  updateStationDeviceViaAction,
  updateUser,
} from '../api/userAdminApi'
import {
  projectStationDeviceRow,
  projectUserRow,
  resolveIdentityListState,
  resolveResetPasswordUi,
  resolveStationDeviceMutationUi,
  validateStationDeviceCreateForm,
} from '../lib/identityProjection'
import type {
  StationDeviceCreateRequest,
  StationDeviceUpdateRequest,
  UserCreateRequest,
  UserDetail,
} from '../types/userAdmin'

const LIST_KEY = ['nb01c', 'users'] as const
const DETAIL_KEY = ['nb01c', 'user'] as const
const STATION_DEVICES_KEY = ['nb01d', 'station-devices'] as const
const STATION_DEVICE_DETAIL_KEY = ['nb01d', 'station-device'] as const

const EMPTY_STATION_DEVICE_FORM: StationDeviceCreateRequest = {
  code: '',
  device_type: 'TABLET',
  location_code: '',
  hardware_id: '',
  is_active: true,
}

function mutationStatus(mutation: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
}): 'idle' | 'pending' | 'success' | 'error' {
  if (mutation.isPending) return 'pending'
  if (mutation.isSuccess) return 'success'
  if (mutation.isError) return 'error'
  return 'idle'
}

export type IdentityAdminTab = 'users' | 'station_devices'

export function useIdentityAdmin() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<IdentityAdminTab>('users')
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<UserCreateRequest>({
    code: '',
    full_name: '',
    email: '',
    phone_number: '',
    is_active: true,
  })
  const [disableReason, setDisableReason] = useState('')

  const listQuery = useQuery({
    queryKey: [...LIST_KEY, { q: appliedQuery }],
    queryFn: () => listUsers({ q: appliedQuery || undefined, limit: 50 }),
  })

  const detailQuery = useQuery({
    queryKey: [...DETAIL_KEY, selectedCode],
    queryFn: () => getUser(selectedCode as string),
    enabled: Boolean(selectedCode),
  })

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: LIST_KEY })
    await queryClient.invalidateQueries({ queryKey: DETAIL_KEY })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: () =>
      createUser({
        code: createForm.code.trim(),
        full_name: createForm.full_name.trim(),
        email: createForm.email?.trim() ? createForm.email.trim() : null,
        phone_number: createForm.phone_number?.trim() ? createForm.phone_number.trim() : null,
        is_active: createForm.is_active,
      }),
    onSuccess: async (user) => {
      setShowCreate(false)
      setCreateForm({ code: '', full_name: '', email: '', phone_number: '', is_active: true })
      await invalidate()
      setSelectedCode(user.code)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: { full_name: string; email: string | null; phone_number: string | null }) =>
      updateUser(selectedCode as string, body),
    onSuccess: () => invalidate(),
  })

  const disableMutation = useMutation({
    mutationFn: (reason: string) => disableUser(selectedCode as string, reason),
    onSuccess: () => {
      setDisableReason('')
      return invalidate()
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => resetUserPassword(selectedCode as string),
  })

  const rolesMutation = useMutation({
    mutationFn: (roleCodes: string[]) => replaceUserRoles(selectedCode as string, roleCodes),
    onSuccess: () => invalidate(),
  })

  const locationsMutation = useMutation({
    mutationFn: (locationCodes: string[]) =>
      replaceUserLocations(selectedCode as string, locationCodes),
    onSuccess: () => invalidate(),
  })

  const listState = resolveIdentityListState({
    status: listQuery.isLoading || listQuery.isFetching ? 'loading' : listQuery.isError ? 'error' : 'success',
    itemCount: listQuery.data?.items.length ?? 0,
    hasQuery: appliedQuery.trim().length > 0,
    errorCode: listQuery.error instanceof ApiError ? listQuery.error.code : null,
  })

  const rows = useMemo(
    () => (listQuery.data?.items ?? []).map(projectUserRow),
    [listQuery.data?.items],
  )

  // ---- Station devices (NB01-014..018 / NB-01d-STATION-ACCESS) ----
  const [sdSearchInput, setSdSearchInput] = useState('')
  const [sdAppliedQuery, setSdAppliedQuery] = useState('')
  const [sdCursor, setSdCursor] = useState<string | undefined>()
  const [selectedStationDeviceCode, setSelectedStationDeviceCode] = useState<string | null>(null)
  const [showStationDeviceCreate, setShowStationDeviceCreate] = useState(false)
  const [stationDeviceCreateForm, setStationDeviceCreateForm] =
    useState<StationDeviceCreateRequest>(EMPTY_STATION_DEVICE_FORM)
  const [confirmStationDeviceDeactivate, setConfirmStationDeviceDeactivate] = useState(false)

  const stationDevicesQuery = useQuery({
    queryKey: [...STATION_DEVICES_KEY, { q: sdAppliedQuery, cursor: sdCursor }],
    queryFn: () =>
      listStationDevices({ q: sdAppliedQuery || undefined, cursor: sdCursor, limit: 50 }),
    enabled: tab === 'station_devices',
  })

  const stationDeviceDetailQuery = useQuery({
    queryKey: [...STATION_DEVICE_DETAIL_KEY, selectedStationDeviceCode],
    queryFn: () => getStationDevice(selectedStationDeviceCode as string),
    enabled: Boolean(selectedStationDeviceCode),
  })

  const invalidateStationDevices = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: STATION_DEVICES_KEY })
    void queryClient.invalidateQueries({ queryKey: STATION_DEVICE_DETAIL_KEY })
  }, [queryClient])

  const createStationDeviceMutation = useMutation({
    mutationFn: () =>
      createStationDevice({
        ...stationDeviceCreateForm,
        code: stationDeviceCreateForm.code.trim(),
        hardware_id: stationDeviceCreateForm.hardware_id.trim(),
        location_code: stationDeviceCreateForm.location_code?.trim()
          ? stationDeviceCreateForm.location_code.trim()
          : null,
      }),
    onSuccess: (device) => {
      setShowStationDeviceCreate(false)
      setStationDeviceCreateForm(EMPTY_STATION_DEVICE_FORM)
      invalidateStationDevices()
      setSelectedStationDeviceCode(device.code)
    },
  })

  const stationDeviceDetailRow = stationDeviceDetailQuery.data
    ? projectStationDeviceRow(stationDeviceDetailQuery.data)
    : null

  const updateStationDeviceMutation = useMutation({
    mutationFn: (body: StationDeviceUpdateRequest) => {
      const action = stationDeviceDetailRow?.updateAction
      if (!action) throw new ApiError('PERMISSION_DENIED', 'Update không được server cho phép.', 403)
      return updateStationDeviceViaAction(action, body as Record<string, unknown>)
    },
    onSuccess: () => invalidateStationDevices(),
  })

  const deactivateStationDeviceMutation = useMutation({
    mutationFn: () => {
      const action = stationDeviceDetailRow?.deactivateAction
      if (!action) {
        throw new ApiError('PERMISSION_DENIED', 'Deactivate không được server cho phép.', 403)
      }
      return deactivateStationDeviceViaAction(action)
    },
    onSuccess: () => {
      setConfirmStationDeviceDeactivate(false)
      invalidateStationDevices()
    },
  })

  const stationDeviceRows = useMemo(
    () => (stationDevicesQuery.data?.items ?? []).map(projectStationDeviceRow),
    [stationDevicesQuery.data?.items],
  )

  const stationDeviceListState = resolveIdentityListState({
    status:
      stationDevicesQuery.isLoading || stationDevicesQuery.isFetching
        ? 'loading'
        : stationDevicesQuery.isError
          ? 'error'
          : 'success',
    itemCount: stationDeviceRows.length,
    hasQuery: sdAppliedQuery.trim().length > 0,
    errorCode: stationDevicesQuery.error instanceof ApiError ? stationDevicesQuery.error.code : null,
  })

  const stationDeviceCreateErrors = validateStationDeviceCreateForm({
    code: stationDeviceCreateForm.code,
    deviceType: stationDeviceCreateForm.device_type,
    hardwareId: stationDeviceCreateForm.hardware_id,
    locationCode: stationDeviceCreateForm.location_code ?? '',
  })

  const resetUi = resolveResetPasswordUi({
    status: resetMutation.isPending
      ? 'pending'
      : resetMutation.isSuccess
        ? 'success'
        : resetMutation.isError
          ? 'error'
          : 'idle',
    result: resetMutation.data ?? null,
    errorCode: resetMutation.error instanceof ApiError ? resetMutation.error.code : null,
  })

  return {
    tab,
    setTab,

    searchInput,
    setSearchInput,
    applySearch: () => setAppliedQuery(searchInput.trim()),
    listState,
    rows,
    listError: listQuery.error instanceof ApiError ? listQuery.error : null,
    selectedCode,
    selectUser: (code: string) => {
      setSelectedCode(code)
      setShowCreate(false)
      resetMutation.reset()
    },
    detail: detailQuery.data as UserDetail | undefined,
    detailLoading: detailQuery.isLoading,
    detailError: detailQuery.error instanceof ApiError ? detailQuery.error : null,
    showCreate,
    openCreate: () => {
      setSelectedCode(null)
      setShowCreate(true)
    },
    createForm,
    setCreateForm,
    create: () => createMutation.mutate(),
    createPending: createMutation.isPending,
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,
    saveEdit: (body: { full_name: string; email: string | null; phone_number: string | null }) =>
      updateMutation.mutate(body),
    updatePending: updateMutation.isPending,
    updateError: updateMutation.error instanceof ApiError ? updateMutation.error : null,
    disableReason,
    setDisableReason,
    disable: () => disableMutation.mutate(disableReason.trim()),
    disablePending: disableMutation.isPending,
    disableError: disableMutation.error instanceof ApiError ? disableMutation.error : null,
    resetPassword: () => resetMutation.mutate(),
    resetUi,
    resetResult: resetMutation.data ?? null,
    resetError: resetMutation.error instanceof ApiError ? resetMutation.error : null,
    roleCodes: CANONICAL_ROLE_CODES,
    saveRoles: (roleCodes: string[]) => rolesMutation.mutate(roleCodes),
    rolesPending: rolesMutation.isPending,
    rolesError: rolesMutation.error instanceof ApiError ? rolesMutation.error : null,
    saveLocations: (locationCodes: string[]) => locationsMutation.mutate(locationCodes),
    locationsPending: locationsMutation.isPending,
    locationsError: locationsMutation.error instanceof ApiError ? locationsMutation.error : null,

    // Station devices (NB-01d)
    sdSearchInput,
    setSdSearchInput,
    applyStationDeviceSearch: () => {
      setSdCursor(undefined)
      setSdAppliedQuery(sdSearchInput.trim())
    },
    stationDeviceListState,
    stationDeviceListError:
      stationDevicesQuery.error instanceof ApiError ? stationDevicesQuery.error : null,
    stationDeviceRows,
    stationDeviceHasMore: Boolean(stationDevicesQuery.data?.page.has_more),
    stationDeviceLoadMore: () => {
      const next = stationDevicesQuery.data?.page.next_cursor
      if (next) setSdCursor(next)
    },
    selectedStationDeviceCode,
    selectStationDevice: (code: string) => {
      setSelectedStationDeviceCode(code)
      setShowStationDeviceCreate(false)
      setConfirmStationDeviceDeactivate(false)
      updateStationDeviceMutation.reset()
      deactivateStationDeviceMutation.reset()
    },
    stationDeviceDetail: stationDeviceDetailQuery.data ?? null,
    stationDeviceDetailRow,
    stationDeviceDetailLoading: stationDeviceDetailQuery.isLoading,
    showStationDeviceCreate,
    openStationDeviceCreate: () => {
      setSelectedStationDeviceCode(null)
      setShowStationDeviceCreate(true)
    },
    closeStationDeviceCreate: () => setShowStationDeviceCreate(false),
    stationDeviceCreateForm,
    setStationDeviceCreateForm,
    stationDeviceCreateErrors,
    createStationDevice: () => createStationDeviceMutation.mutate(),
    createStationDevicePending: createStationDeviceMutation.isPending,
    createStationDeviceError:
      createStationDeviceMutation.error instanceof ApiError ? createStationDeviceMutation.error : null,
    saveStationDeviceEdit: (body: StationDeviceUpdateRequest) =>
      updateStationDeviceMutation.mutate(body),
    updateStationDevicePending: updateStationDeviceMutation.isPending,
    updateStationDeviceError:
      updateStationDeviceMutation.error instanceof ApiError ? updateStationDeviceMutation.error : null,
    updateStationDeviceSuccess: updateStationDeviceMutation.isSuccess,
    confirmStationDeviceDeactivate,
    setConfirmStationDeviceDeactivate,
    deactivateStationDevice: () => deactivateStationDeviceMutation.mutate(),
    deactivateStationDeviceState: resolveStationDeviceMutationUi({
      confirmOpen: confirmStationDeviceDeactivate,
      status: mutationStatus(deactivateStationDeviceMutation),
      errorCode:
        deactivateStationDeviceMutation.error instanceof ApiError
          ? deactivateStationDeviceMutation.error.code
          : null,
    }),
    deactivateStationDeviceError:
      deactivateStationDeviceMutation.error instanceof ApiError
        ? deactivateStationDeviceMutation.error
        : null,
  }
}
