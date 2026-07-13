import { PageContainer } from '../components/layout/PageContainer'
import { SearchForm } from '../features/search/components/SearchForm'
import { SearchResults } from '../features/search/components/SearchResults'

export function SearchPage() {
  return (
    <PageContainer>
      <section className="space-y-10 pb-12 pt-8">
        <div className="space-y-4 px-2 text-center">
          <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-6xl">
            Trova annunci immobiliari in modo semplice
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-500 md:text-[1.75rem] md:leading-10">
            Cerca tra migliaia di annunci provenienti da immobiliare.it
            <br className="hidden md:block" />
            e salva quelli che ti interessano.
          </p>
        </div>

        <SearchForm />
        <SearchResults />
      </section>
    </PageContainer>
  )
}
