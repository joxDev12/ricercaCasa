import { PageContainer } from '../components/layout/PageContainer'
import { SearchForm } from '../features/search/components/SearchForm'
import { SearchResults } from '../features/search/components/SearchResults'

export function SearchPage() {
  return (
    <PageContainer>
      <section className="space-y-10 pb-12 pt-8">
        <div className="space-y-4 px-2 text-center">
          <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-6xl">
            Cerca fuori. Salva solo quel che conta.
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-500 md:text-[1.75rem] md:leading-10">
            Cerca tra piu portali immobiliari
            <br className="hidden md:block" />
            e tieni in locale solo immobili davvero interessanti.
          </p>
        </div>

        <SearchForm />
        <SearchResults />
      </section>
    </PageContainer>
  )
}
