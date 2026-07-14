import { EmptyState } from '../../../components/feedback/EmptyState'
import type { FavoriteListItem } from '../types/favorite.types'
import type { ViewMode } from '../../../components/ui/ViewModeToggle'
import { FavoriteCard } from './FavoriteCard'

type FavoritesGridProps = {
  favorites: FavoriteListItem[]
  onDelete: (id: number) => void
  viewMode: ViewMode
}

export function FavoritesGrid({ favorites, onDelete, viewMode }: FavoritesGridProps) {
  if (!favorites.length) {
    return (
      <EmptyState
        description="Salva annunci dalla ricerca. Qui vedi solo quelli persistiti nel database."
        title="Nessun preferito salvato"
      />
    )
  }

  return (
    <div className={viewMode === 'grid' ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
      {favorites.map((favorite) => (
        <FavoriteCard
          key={favorite.id}
          compact={viewMode === 'grid'}
          favorite={favorite}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
