const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | null | undefined>
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const fallback = 'Richiesta API fallita'

    try {
      const body = (await response.json()) as { error?: string }
      throw new Error(body.error ?? fallback)
    } catch (error) {
      if (error instanceof Error && error.message !== fallback) {
        throw error
      }

      throw new Error(fallback, { cause: error })
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
