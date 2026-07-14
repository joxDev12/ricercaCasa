type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-8 py-14 text-center shadow-[0_18px_50px_-40px_rgba(15,23,42,0.55)]">
      <h3 className="font-display text-3xl font-bold tracking-[-0.03em] text-slate-950">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-500">
        {description}
      </p>
    </div>
  )
}
