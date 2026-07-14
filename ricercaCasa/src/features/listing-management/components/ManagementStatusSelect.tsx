import { Select } from '../../../components/ui/Select'
import type { ManagementStatus } from '../types/listingManagement.types'

type ManagementStatusSelectProps = {
  onChange: (status: ManagementStatus) => void
  value: ManagementStatus
}

const options: Array<{ value: ManagementStatus; label: string }> = [
  { value: 'saved', label: 'Salvato' },
  { value: 'to_contact', label: 'Da contattare' },
  { value: 'contacted', label: 'Contattato' },
  { value: 'appointment_scheduled', label: 'Visita programmata' },
  { value: 'visited', label: 'Visitato' },
  { value: 'discarded', label: 'Scartato' },
]

export function ManagementStatusSelect({
  onChange,
  value,
}: ManagementStatusSelectProps) {
  return (
    <Select
      label="Stato"
      onChange={(event) => onChange(event.target.value as ManagementStatus)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
