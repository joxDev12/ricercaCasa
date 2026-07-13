import { createContext, useEffect, useState, type PropsWithChildren } from 'react'
import { listFavoritesApi } from '../features/favorites/services/favoritesApi'

type FavoritesContextValue = {
  refreshSavedIds: () => Promise<void>
  favoritesAvailable: boolean
  savedKeys: Set<string>
  savingKeys: Set<string>
  setSavingKey: (key: string, active: boolean) => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favoritesAvailable, setFavoritesAvailable] = useState(true)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

  async function refreshSavedIds() {
    try {
      const response = await listFavoritesApi({ limit: 50, page: 1 })
      setSavedKeys(
        new Set(response.data.map((item) => `${item.provider}:${item.externalId}`)),
      )
      setFavoritesAvailable(true)
    } catch {
      setSavedKeys(new Set())
      setFavoritesAvailable(false)
    }
  }

  function setSavingKey(key: string, active: boolean) {
    setSavingKeys((current) => {
      const next = new Set(current)
      if (active) next.add(key)
      else next.delete(key)
      return next
    })
  }

  useEffect(() => {
    async function primeSavedIds() {
      await refreshSavedIds()
    }

    primeSavedIds().catch(() => undefined)
  }, [])

  return (
    <FavoritesContext.Provider
      value={{
        favoritesAvailable,
        refreshSavedIds,
        savedKeys,
        savingKeys,
        setSavingKey,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export { FavoritesContext }
