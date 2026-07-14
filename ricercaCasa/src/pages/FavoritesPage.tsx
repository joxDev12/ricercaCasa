import { useEffect, useState, type FormEvent } from 'react'
import { ErrorMessage } from '../components/feedback/ErrorMessage'
import { LoadingGrid } from '../components/feedback/LoadingGrid'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ViewModeToggle, type ViewMode } from '../components/ui/ViewModeToggle'
import { FavoritesGrid } from '../features/favorites/components/FavoritesGrid'
import { useFavorites } from '../features/favorites/hooks/useFavorites'
import { listFavoritesApi } from '../features/favorites/services/favoritesApi'
import type {
  FavoriteListItem,
  FavoritesFilters,
} from '../features/favorites/types/favorite.types'

const initialFilters: FavoritesFilters = {
  page: 1,
  limit: 12,
  sort: 'saved_at_desc',
  transactionType: '',
  location: '',
  maxPrice: null,
}

export function FavoritesPage() {
  const { error, listFavorites, loading, removeFavorite } = useFavorites()
  const [favorites, setFavorites] = useState<FavoriteListItem[]>([])
  const [filters, setFilters] = useState(initialFilters)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  async function loadFavorites(nextFilters: FavoritesFilters) {
    const response = await listFavorites(nextFilters)
    setFavorites(response.data)
  }

  useEffect(() => {
    async function primeFavorites() {
      const response = await listFavoritesApi(initialFilters)
      setFavorites(response.data)
    }

    primeFavorites().catch(() => undefined)
  }, [])

  async function handleDelete(id: number) {
    await removeFavorite(id)
    await loadFavorites(filters)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadFavorites(filters)
  }

  return (
    <PageContainer>
      <section className="space-y-8 pb-12 pt-8">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
            Archivio locale
          </p>
          <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Preferiti pronti da rivedere
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-500">
            Qui tieni solo annunci salvati nel database locale. Ricerca resta
            temporanea, archivio resta pulito.
          </p>
        </div>

        <form
          className="grid gap-4 rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.25)] md:grid-cols-[1.4fr_1fr_1fr_auto]"
          onSubmit={handleSubmit}
        >
          <Input
            label="Filtro localita"
            onChange={(event) =>
              setFilters((current) => ({ ...current, location: event.target.value }))
            }
            placeholder="Es. Ancona"
            value={filters.location ?? ''}
          />

          <Select
            label="Operazione"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                transactionType: event.target.value as FavoritesFilters['transactionType'],
              }))
            }
            value={filters.transactionType ?? ''}
          >
            <option value="">Tutte</option>
            <option value="sale">Vendita</option>
            <option value="rent">Affitto</option>
          </Select>

          <Select
            label="Ordina"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sort: event.target.value as FavoritesFilters['sort'],
              }))
            }
            value={filters.sort}
          >
            <option value="saved_at_desc">Ultimi salvati</option>
            <option value="price_asc">Prezzo crescente</option>
            <option value="price_desc">Prezzo decrescente</option>
            <option value="appointment_asc">Prossimo appuntamento</option>
          </Select>

          <div className="flex items-end">
            <Button className="h-14 text-base" fullWidth type="submit">
              Filtra
            </Button>
          </div>
        </form>

        {error ? <ErrorMessage message={error} /> : null}
        <div className="flex justify-end">
          <ViewModeToggle onChange={setViewMode} value={viewMode} />
        </div>
        {loading && !favorites.length ? (
          <LoadingGrid />
        ) : (
          <FavoritesGrid
            favorites={favorites}
            onDelete={handleDelete}
            viewMode={viewMode}
          />
        )}
      </section>
    </PageContainer>
  )
}
