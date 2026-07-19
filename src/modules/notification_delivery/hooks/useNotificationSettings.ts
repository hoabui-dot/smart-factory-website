import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api'

import {
  createSubscription,
  listPreferences,
  listSubscriptions,
  revokeSubscription,
  updatePreference,
} from '../api/notificationDeliveryApi'
import { projectPreferenceRow, projectSubscriptionRow } from '../lib/deliveryProjection'

const SUB_KEY = ['nb09', 'subscriptions'] as const
const PREF_KEY = ['nb09', 'preferences'] as const

export function useNotificationSettings() {
  const queryClient = useQueryClient()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [form, setForm] = useState({
    channel: 'WEB_PUSH',
    endpoint: '',
    p256dh_key: '',
    auth_key: '',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'web',
  })
  const [prefDraft, setPrefDraft] = useState({
    event_type: '',
    realtime_enabled: true,
    push_enabled: true,
  })

  const subsQuery = useQuery({
    queryKey: SUB_KEY,
    queryFn: () => listSubscriptions({ limit: 100 }),
  })
  const prefsQuery = useQuery({
    queryKey: PREF_KEY,
    queryFn: listPreferences,
  })

  const subscriptionRows = useMemo(
    () => (subsQuery.data?.items ?? []).map(projectSubscriptionRow),
    [subsQuery.data?.items],
  )
  const preferenceRows = useMemo(
    () => (prefsQuery.data ?? []).map(projectPreferenceRow),
    [prefsQuery.data],
  )

  const createMutation = useMutation({
    mutationFn: () =>
      createSubscription({
        channel: form.channel,
        endpoint: form.endpoint.trim(),
        p256dh_key: form.p256dh_key.trim() || undefined,
        auth_key: form.auth_key.trim() || undefined,
        user_agent: form.user_agent.trim() || 'web',
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: SUB_KEY }),
  })
  const revokeMutation = useMutation({
    mutationFn: () => revokeSubscription(selectedCode as string),
    onSuccess: () => {
      setSelectedCode(null)
      void queryClient.invalidateQueries({ queryKey: SUB_KEY })
    },
  })
  const prefMutation = useMutation({
    mutationFn: () =>
      updatePreference({
        event_type: prefDraft.event_type.trim() || null,
        realtime_enabled: prefDraft.realtime_enabled,
        push_enabled: prefDraft.push_enabled,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: PREF_KEY }),
  })

  return {
    subscriptionRows,
    subscriptionsLoading: subsQuery.isLoading,
    subscriptionsError: subsQuery.error instanceof ApiError ? subsQuery.error : null,
    preferenceRows,
    preferencesLoading: prefsQuery.isLoading,
    preferencesError: prefsQuery.error instanceof ApiError ? prefsQuery.error : null,
    selectedCode,
    setSelectedCode,
    form,
    setFormField: (key: keyof typeof form, value: string) =>
      setForm((current) => ({ ...current, [key]: value })),
    createSubscription: () => createMutation.mutate(),
    createPending: createMutation.isPending,
    createError: createMutation.error instanceof ApiError ? createMutation.error : null,
    revokeSubscription: () => revokeMutation.mutate(),
    revokePending: revokeMutation.isPending,
    revokeError: revokeMutation.error instanceof ApiError ? revokeMutation.error : null,
    prefDraft,
    setPrefDraft,
    savePreference: () => prefMutation.mutate(),
    prefPending: prefMutation.isPending,
    prefError: prefMutation.error instanceof ApiError ? prefMutation.error : null,
    prefSuccess: prefMutation.isSuccess,
  }
}
