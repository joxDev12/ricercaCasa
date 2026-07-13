import { useState } from 'react'

export function useAsyncAction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run<T>(action: () => Promise<T>) {
    setLoading(true)
    setError(null)

    try {
      return await action()
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Operazione fallita'
      setError(message)
      throw caught
    } finally {
      setLoading(false)
    }
  }

  return { error, loading, run, setError }
}
