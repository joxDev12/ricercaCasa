export function formatCurrency(value: number | null, currency = 'EUR') {
  if (value == null) {
    return 'Prezzo non disponibile'
  }

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

const periodLabels = {
  month: ' / mese',
  week: ' / settimana',
  day: ' / giorno',
  total: '',
}

export function formatListingPrice(
  value: number | null,
  currency = 'EUR',
  period: 'month' | 'week' | 'day' | 'total' | null = null,
) {
  const base = formatCurrency(value, currency)

  if (value == null || !period) {
    return base
  }

  return `${base}${periodLabels[period]}`
}
