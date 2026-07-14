import { apiClient } from '../../../lib/apiClient'

export type UserPreferences = {
  displayName: string | null
  contactEmail: string | null
  locale: string
  timezone: string
}

export type FeatureConfiguration = {
  id: number
  featureCode: string
  schemaVersion: number
  status: 'pending' | 'configured' | 'disabled' | 'invalid'
  configuration: Record<string, unknown>
  configuredAt: string | null
}

export type SystemInfo = {
  platformVersion: string
  updaterVersion: string
  postgresVersion: string | null
  installation: {
    setupStatus: string
    installedVersion: string | null
    lastSuccessfulVersion: string | null
    setupCompletedAt: string | null
  } | null
  lastUpdate: {
    toVersion: string
    status: string
    completedAt: string | null
  } | null
  health: {
    ok: boolean
    databaseReachable: boolean
    schemaReady: boolean
    migrationsApplied: boolean
  }
}

export async function getSettingsProfileApi() {
  return apiClient<{ data: UserPreferences }>('/api/settings')
}

export async function updateSettingsProfileApi(input: UserPreferences) {
  return apiClient<{ data: UserPreferences }>('/api/settings/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function listSettingsFeaturesApi() {
  return apiClient<{ data: FeatureConfiguration[] }>('/api/settings/features')
}

export async function getSystemInfoApi() {
  return apiClient<{ data: SystemInfo }>('/api/system/info')
}
