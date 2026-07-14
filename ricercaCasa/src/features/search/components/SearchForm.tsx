import type { FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { SearchIcon } from '../../../components/ui/Icons'
import { Input } from '../../../components/ui/Input'
import { useSearchContext } from '../../../context/useSearchContext'
import { ProviderSelector } from '../../providers/components/ProviderSelector'
import { useProviders } from '../../providers/hooks/useProviders'
import { useSearchForm } from '../hooks/useSearchForm'
import { usePropertySearch } from '../hooks/usePropertySearch'
import { TransactionTypeToggle } from './TransactionTypeToggle'
import { LocationAutocomplete } from './LocationAutocomplete'

export function SearchForm() {
  const { criteria } = useSearchContext()
  const { loading, search } = usePropertySearch()
  const providersInfo = useProviders()
  const {
    buildCriteria,
    location,
    locationPath,
    maxPrice,
    providers,
    setLocation,
    setLocationPath,
    setMaxPrice,
    setProviderContexts,
    setTransactionType,
    toggleProvider,
    transactionType,
  } = useSearchForm(criteria)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await search(buildCriteria(1))
  }

  return (
    <form
      className="mx-auto grid max-w-6xl gap-5 rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.25)]"
      onSubmit={handleSubmit}
    >
      <ProviderSelector
        onToggle={toggleProvider}
        providers={providersInfo}
        selected={providers}
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1.1fr_1fr_auto] lg:items-end">
      <LocationAutocomplete
        contextLabel={criteria.location}
        contextPath={criteria.locationPath}
        onChange={(value) => {
          setLocation(value)
          setLocationPath(null)
          setProviderContexts(undefined)
        }}
        onSelect={(suggestion) => {
          setLocation(suggestion.displayLabel)
          setLocationPath(suggestion.path)
          setProviderContexts(
            Object.fromEntries(
              Object.entries(suggestion.providerPaths ?? {}).map(
                ([provider, providerPath]) => [
                  provider,
                  { locationPath: providerPath },
                ],
              ),
            ),
          )
        }}
        providers={providers}
        selectedPath={locationPath}
        value={location}
      />

      <TransactionTypeToggle
        onChange={(nextValue) => setTransactionType(nextValue)}
        value={transactionType}
      />

      <Input
        label="Prezzo massimo"
        inputMode="numeric"
        inputClassName="pl-18"
        leading={<span className="text-base font-semibold">EUR</span>}
        min="1"
        onChange={(event) => setMaxPrice(event.target.value)}
        placeholder="es. 250000"
        type="number"
        value={maxPrice}
      />

      <div className="flex items-end">
        <Button
          className="flex h-14 gap-3 rounded-2xl px-6 text-base"
          fullWidth
          disabled={loading}
          type="submit"
        >
          <SearchIcon className="h-5 w-5" />
          {loading ? 'Cerco...' : 'Cerca annunci'}
        </Button>
      </div>
      </div>
    </form>
  )
}
