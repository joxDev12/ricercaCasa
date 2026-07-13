import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorMessage } from '../components/feedback/ErrorMessage'
import { LoadingGrid } from '../components/feedback/LoadingGrid'
import { PageContainer } from '../components/layout/PageContainer'
import { FavoriteDetails } from '../features/favorites/components/FavoriteDetails'
import { getFavoriteApi } from '../features/favorites/services/favoritesApi'
import type { FavoriteDetails as FavoriteDetailsType } from '../features/favorites/types/favorite.types'

export function FavoriteDetailsPage() {
  const { id } = useParams()
  const [favorite, setFavorite] = useState<FavoriteDetailsType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }

    getFavoriteApi(Number(id))
      .then((response) => setFavorite(response.data))
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : 'Caricamento fallito'),
      )
  }, [id])

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          to="/favorites"
        >
          Torna ai preferiti
        </Link>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      {!favorite && !error ? <LoadingGrid /> : null}
      {favorite ? <FavoriteDetails favorite={favorite} /> : null}
    </PageContainer>
  )
}
