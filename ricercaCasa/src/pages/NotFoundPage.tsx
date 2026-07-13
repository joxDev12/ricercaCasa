import { Link } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'

export function NotFoundPage() {
  return (
    <PageContainer>
      <div className="rounded-[2.5rem] border border-white/70 bg-white/85 p-10 text-center shadow-lg shadow-stone-950/5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
          404
        </p>
        <h2 className="mt-4 font-display text-5xl text-stone-950">
          Pagina non trovata
        </h2>
        <div className="mt-6">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            to="/"
          >
            Torna alla ricerca
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
