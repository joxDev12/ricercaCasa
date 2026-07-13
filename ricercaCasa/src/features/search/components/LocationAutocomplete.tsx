import { useEffect, useState, type KeyboardEvent } from 'react'
import { MapPinIcon } from '../../../components/ui/Icons'
import { Input } from '../../../components/ui/Input'
import { locationSuggestionsApi } from '../services/searchApi'
import type { LocationSuggestion } from '../types/search.types'

type LocationAutocompleteProps = {
  contextLabel?: string
  contextPath?: string | null
  onChange: (value: string) => void
  onSelect: (suggestion: LocationSuggestion) => void
  selectedPath: string | null
  value: string
}

const typeLabels: Record<number, string> = {
  0: 'Regione',
  1: 'Provincia',
  2: 'Comune',
  3: 'Zona',
  6: 'Quartiere',
  7: 'Indirizzo',
}

export function LocationAutocomplete({
  contextLabel,
  contextPath,
  onChange,
  onSelect,
  selectedPath,
  value,
}: LocationAutocompleteProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])

  useEffect(() => {
    const query = value.trim()

    if (!focused || selectedPath || query.length < 2) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)

      try {
        const response = await locationSuggestionsApi(query, controller.signal, {
          label: contextLabel,
          path: contextPath,
        })
        setSuggestions(response.data)
        setActiveIndex(0)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [contextLabel, contextPath, focused, selectedPath, value])

  function selectSuggestion(suggestion: LocationSuggestion) {
    onSelect(suggestion)
    setSuggestions([])
  }

  function handleChange(nextValue: string) {
    setSuggestions([])
    setLoading(false)
    onChange(nextValue)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) =>
        index === 0 ? suggestions.length - 1 : index - 1,
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (event.key === 'Escape') {
      setSuggestions([])
    }
  }

  const open =
    focused &&
    !selectedPath &&
    value.trim().length >= 2 &&
    (loading || suggestions.length > 0)

  return (
    <div className="relative z-20">
      <Input
        aria-activedescendant={
          open && suggestions[activeIndex]
            ? `location-option-${suggestions[activeIndex].id}`
            : undefined
        }
        aria-autocomplete="list"
        aria-controls="location-suggestions"
        aria-expanded={open}
        autoComplete="off"
        label="Zona"
        leading={<MapPinIcon className="h-5 w-5" />}
        minLength={2}
        onBlur={() => {
          setFocused(false)
          setSuggestions([])
        }}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder="es. Napoli, Vomero, Viale Raffaello"
        required
        role="combobox"
        value={value}
      />

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_-20px_rgba(15,23,42,0.4)]">
          {loading ? (
            <p className="px-4 py-3 text-sm text-slate-500">Cerco localita...</p>
          ) : (
            <ul id="location-suggestions" role="listbox">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id} role="presentation">
                  <button
                    aria-selected={index === activeIndex}
                    className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm transition ${
                      index === activeIndex
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    id={`location-option-${suggestion.id}`}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseDown={(event) => event.preventDefault()}
                    role="option"
                    type="button"
                  >
                    <span className="font-medium">{suggestion.displayLabel}</span>
                    <span className="text-xs uppercase tracking-wider text-slate-400">
                      {typeLabels[suggestion.type] ?? 'Localita'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
