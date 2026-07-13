import { EmptyState } from '../../../components/feedback/EmptyState'
import type { FavoriteListItem } from '../types/favorite.types'
import { FavoriteCard } from './FavoriteCard'

type FavoritesGridProps = {
  favorites: FavoriteListItem[]
  onDelete: (id: number) => void
}

export function FavoritesGrid({ favorites, onDelete }: FavoritesGridProps) {
  if (!favorites.length) {
    return (
      <EmptyState
        description="Salva annunci dalla ricerca. Qui vedi solo quelli persistiti nel database."
        title="Nessun preferito salvato"
      />
    )
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <FavoriteCard
          key={favorite.id}
          favorite={favorite}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
