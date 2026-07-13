import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  leading?: ReactNode
  inputClassName?: string
}

export function Input({
  className = '',
  inputClassName = '',
  label,
  leading,
  ...props
}: InputProps) {
  return (
    <label className="grid gap-3 text-sm font-semibold text-slate-900">
      <span>{label}</span>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            {leading}
          </span>
        ) : null}
        <input
          className={`h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${leading ? 'pl-13' : ''} ${inputClassName} ${className}`}
          {...props}
        />
      </div>
    </label>
  )
}
