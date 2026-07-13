export function LoadingGrid() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white"
        />
      ))}
    </div>
  )
}
