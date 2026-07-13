import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    fullWidth?: boolean
  }
>

const variants = {
  primary:
    'bg-blue-600 text-white shadow-[0_16px_30px_-18px_rgba(37,99,235,0.9)] hover:bg-blue-500 focus-visible:outline-blue-600',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900',
  ghost:
    'bg-white text-slate-700 ring-1 ring-slate-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
}

export function Button({
  children,
  className = '',
  fullWidth = false,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
