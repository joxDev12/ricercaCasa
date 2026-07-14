export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'N/D'
  }

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function compactText(value: string | null | undefined, fallback = 'N/D') {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}
