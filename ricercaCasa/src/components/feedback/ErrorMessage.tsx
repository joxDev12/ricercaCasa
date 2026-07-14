type ErrorMessageProps = {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 shadow-[0_12px_30px_-24px_rgba(220,38,38,0.6)]">
      {message}
    </div>
  )
}
