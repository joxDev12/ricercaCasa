import { GridIcon, ListIcon } from './Icons'

export type ViewMode = 'list' | 'grid'

type ViewModeToggleProps = {
  onChange: (mode: ViewMode) => void
  value: ViewMode
}

export function ViewModeToggle({ onChange, value }: ViewModeToggleProps) {
  return (
    <div
      aria-label="Visualizzazione risultati"
      className="inline-flex rounded-2xl border border-slate-200 bg-white p-1"
      role="group"
    >
      {([
        ['list', 'Lista', ListIcon],
        ['grid', 'Griglia', GridIcon],
      ] as const).map(([mode, label, Icon]) => (
        <button
          aria-pressed={value === mode}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            value === mode
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
          key={mode}
          onClick={() => onChange(mode)}
          type="button"
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
