import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
}

export function Select({ children, className = '', label, ...props }: SelectProps) {
  return (
    <label className="grid gap-3 text-sm font-semibold text-slate-900">
      <span>{label}</span>
      <select
        className={`h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
