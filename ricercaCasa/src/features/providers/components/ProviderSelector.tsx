import type { ProviderInfo } from '../types/provider.types'
import type { ProviderCode } from '../../search/types/search.types'

type ProviderSelectorProps = {
  providers: ProviderInfo[]
  selected: ProviderCode[]
  onToggle: (provider: ProviderCode) => void
}

export function ProviderSelector({
  providers,
  selected,
  onToggle,
}: ProviderSelectorProps) {
  return (
    <div className="grid gap-3 text-sm font-semibold text-slate-900">
      <span>Provider</span>
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => {
          const active = selected.includes(provider.code)

          return (
            <button
              key={provider.code}
              className={`inline-flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition ${
                active
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
              onClick={() => onToggle(provider.code)}
              type="button"
            >
              {provider.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
