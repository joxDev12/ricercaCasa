import type { FavoriteImage } from '../types/listingManagement.types'

type ListingGalleryProps = {
  images: FavoriteImage[]
  fallbackTitle: string
}

export function ListingGallery({ images, fallbackTitle }: ListingGalleryProps) {
  const [primary, ...secondary] = images

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)]">
      <div className="overflow-hidden rounded-[1.6rem] bg-slate-100">
        {primary ? (
          <img
            alt={primary.altText ?? fallbackTitle}
            className="h-[340px] w-full object-cover md:h-[420px]"
            src={primary.imageUrl}
          />
        ) : (
          <div className="flex h-[340px] items-center justify-center text-sm text-slate-500 md:h-[420px]">
            Nessuna immagine disponibile
          </div>
        )}
      </div>

      {secondary.length ? (
        <div className="mt-4 grid grid-cols-4 gap-3 lg:grid-cols-5">
          {secondary.slice(0, 5).map((image) => (
            <img
              key={`${image.imageUrl}-${image.position}`}
              alt={image.altText ?? fallbackTitle}
              className="h-16 w-full rounded-2xl object-cover"
              src={image.imageUrl}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
