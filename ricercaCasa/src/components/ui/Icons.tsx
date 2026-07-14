type IconProps = {
  className?: string
}

function iconClassName(className = '') {
  return `h-5 w-5 ${className}`.trim()
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 20.5 4.8 13.6a4.9 4.9 0 0 1 6.9-6.9l.3.3.3-.3a4.9 4.9 0 0 1 6.9 6.9Z" />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V20h11V9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  )
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M5 20V6.5A1.5 1.5 0 0 1 6.5 5H14v15" />
      <path d="M14 20v-9.5A1.5 1.5 0 0 1 15.5 9H18a1 1 0 0 1 1 1V20" />
      <path d="M8.5 8.5h2" />
      <path d="M8.5 12h2" />
      <path d="M8.5 15.5h2" />
      <path d="M16.5 12h1" />
      <path d="M16.5 15.5h1" />
      <path d="M4 20h16" />
    </svg>
  )
}

export function BedIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M3.5 18.5v-9h17v9" />
      <path d="M3.5 13.5h17" />
      <path d="M7 13.5V10a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3.5" />
      <path d="M3.5 18.5v2" />
      <path d="M20.5 18.5v2" />
    </svg>
  )
}

export function RulerIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m6 18 12-12" />
      <path d="m5 15 4 4" />
      <path d="m9 15 1.5 1.5" />
      <path d="m12 12 1.5 1.5" />
      <path d="m15 9 1.5 1.5" />
      <rect height="6" rx="1.5" width="18" x="3" y="15" transform="rotate(-45 12 18)" />
    </svg>
  )
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m12 4 8 4.5-8 4.5L4 8.5Z" />
      <path d="m4 12.5 8 4.5 8-4.5" />
    </svg>
  )
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect height="6" rx="1" width="6" x="4" y="4" />
      <rect height="6" rx="1" width="6" x="14" y="4" />
      <rect height="6" rx="1" width="6" x="4" y="14" />
      <rect height="6" rx="1" width="6" x="14" y="14" />
    </svg>
  )
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  )
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M14 5h5v5" />
      <path d="m10 14 9-9" />
      <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </svg>
  )
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M7 4h10a2 2 0 0 1 2 2v12l-4-2-4 2-4-2-2 1V6a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6" />
      <path d="M9 11h6" />
    </svg>
  )
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m4 20 4.5-1 9-9a2.1 2.1 0 1 0-3-3l-9 9L4 20Z" />
      <path d="m13.5 7.5 3 3" />
    </svg>
  )
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={iconClassName(className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7 7 19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </svg>
  )
}
