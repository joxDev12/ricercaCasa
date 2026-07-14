import { BuildingIcon, HomeIcon } from '../../../components/ui/Icons'
import type { TransactionType } from '../types/search.types'

type TransactionTypeToggleProps = {
  value: TransactionType
  onChange: (next: TransactionType) => void
}

const options: Array<{
  value: TransactionType
  label: string
  Icon: typeof HomeIcon
}> = [
  { value: 'rent', label: 'Affitto', Icon: HomeIcon },
  { value: 'sale', label: 'Compravendita', Icon: BuildingIcon },
]

export function TransactionTypeToggle({
  onChange,
  value,
}: TransactionTypeToggleProps) {
  return (
    <div className="grid gap-3">
      <span className="text-sm font-semibold text-slate-900">Tipologia</span>
      <div className="grid grid-cols-2">
        {options.map(({ Icon, label, value: optionValue }, index) => {
          const active = optionValue === value

          return (
            <button
              key={optionValue}
              className={`relative flex h-14 items-center justify-center gap-2 px-4 text-sm font-semibold transition first:rounded-l-2xl last:rounded-r-2xl ${
                index === 1 ? '-ml-px' : ''
              } ${
                active
                  ? 'z-10 border border-blue-500 bg-blue-50 text-blue-600'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => onChange(optionValue)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
