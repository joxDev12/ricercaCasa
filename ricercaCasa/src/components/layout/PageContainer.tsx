import type { PropsWithChildren } from 'react'

export function PageContainer({ children }: PropsWithChildren) {
  return <div className="mx-auto w-full max-w-[1180px] px-4 py-8 md:px-6">{children}</div>
}
