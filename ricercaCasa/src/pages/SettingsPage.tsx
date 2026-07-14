import { useEffect, useState, type FormEvent } from 'react'
import { ErrorMessage } from '../components/feedback/ErrorMessage'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAsyncAction } from '../hooks/useAsyncAction'
import {
  getSettingsProfileApi,
  getSystemInfoApi,
  listSettingsFeaturesApi,
  updateSettingsProfileApi,
  type FeatureConfiguration,
  type SystemInfo,
  type UserPreferences,
} from '../features/settings/services/settingsApi'

const defaultProfile: UserPreferences = {
  displayName: '',
  contactEmail: '',
  locale: 'it-IT',
  timezone: 'Europe/Rome',
}

export function SettingsPage() {
  const { error, loading, run, setError } = useAsyncAction()
  const [initialLoading, setInitialLoading] = useState(true)
  const [profile, setProfile] = useState<UserPreferences>(defaultProfile)
  const [features, setFeatures] = useState<FeatureConfiguration[]>([])
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        const [profileResponse, featuresResponse, systemInfoResponse] = await Promise.all([
          getSettingsProfileApi(),
          listSettingsFeaturesApi(),
          getSystemInfoApi(),
        ])

        setProfile({
          displayName: profileResponse.data.displayName ?? '',
          contactEmail: profileResponse.data.contactEmail ?? '',
          locale: profileResponse.data.locale,
          timezone: profileResponse.data.timezone,
        })
        setFeatures(featuresResponse.data)
        setSystemInfo(systemInfoResponse.data)
        setSavedMessage(null)
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : 'Caricamento impostazioni fallito'
        setError(message)
      } finally {
        setInitialLoading(false)
      }
    }

    loadSettings().catch(() => undefined)
  }, [setError])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await run(async () => {
      const response = await updateSettingsProfileApi(profile)
      setProfile({
        displayName: response.data.displayName ?? '',
        contactEmail: response.data.contactEmail ?? '',
        locale: response.data.locale,
        timezone: response.data.timezone,
      })
      setSavedMessage('Impostazioni salvate')
      setError(null)
    })
  }

  return (
    <PageContainer>
      <section className="space-y-8 pb-12 pt-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
            V3 setup
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Impostazioni installazione
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-500">
            Profilo locale, stato installazione, salute stack, configurazioni feature.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <form
            className="space-y-5 rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.25)]"
            onSubmit={handleSubmit}
          >
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950">Profilo</h2>
              <p className="text-sm text-slate-500">
                Dati wizard V3 modificabili dopo installazione.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nome visualizzato"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                value={profile.displayName ?? ''}
              />
              <Input
                label="Email contatto"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    contactEmail: event.target.value,
                  }))
                }
                type="email"
                value={profile.contactEmail ?? ''}
              />
              <Select
                label="Lingua"
                onChange={(event) =>
                  setProfile((current) => ({ ...current, locale: event.target.value }))
                }
                value={profile.locale}
              >
                <option value="it-IT">Italiano</option>
                <option value="en-GB">English</option>
              </Select>
              <Input
                label="Fuso orario"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
                value={profile.timezone}
              />
            </div>

            {error ? <ErrorMessage message={error} /> : null}
            {savedMessage ? (
              <p className="text-sm font-semibold text-emerald-700">{savedMessage}</p>
            ) : null}

            <Button className="h-14 text-base" disabled={loading} type="submit">
              {loading ? 'Salvataggio...' : 'Salva impostazioni'}
            </Button>
          </form>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.25)]">
              <h2 className="text-xl font-semibold text-slate-950">Sistema</h2>
              <dl className="mt-4 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <dt>Versione piattaforma</dt>
                  <dd className="font-semibold text-slate-950">
                    {initialLoading ? '...' : (systemInfo?.platformVersion ?? 'n/d')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Versione updater</dt>
                  <dd className="font-semibold text-slate-950">
                    {initialLoading ? '...' : (systemInfo?.updaterVersion ?? 'n/d')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>PostgreSQL</dt>
                  <dd className="font-semibold text-slate-950">
                    {initialLoading ? '...' : (systemInfo?.postgresVersion ?? 'n/d')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Setup</dt>
                  <dd className="font-semibold text-slate-950">
                    {initialLoading ? '...' : (systemInfo?.installation?.setupStatus ?? 'n/d')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Health</dt>
                  <dd
                    className={`font-semibold ${
                      systemInfo?.health.ok ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {initialLoading
                      ? '...'
                      : systemInfo?.health.ok
                        ? 'ready'
                        : 'not ready'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Ultimo update</dt>
                  <dd className="font-semibold text-slate-950">
                    {systemInfo?.lastUpdate?.toVersion ?? 'nessuno'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.25)]">
              <h2 className="text-xl font-semibold text-slate-950">Feature</h2>
              <div className="mt-4 space-y-3">
                {features.length ? (
                  features.map((feature) => (
                    <article
                      key={`${feature.featureCode}-${feature.schemaVersion}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-semibold text-slate-950">
                          {feature.featureCode}
                        </h3>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {feature.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Schema v{feature.schemaVersion}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Nessuna feature configurabile presente in questa release.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageContainer>
  )
}
