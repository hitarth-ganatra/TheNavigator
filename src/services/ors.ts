const ORS_PROXY_BASE_URL = import.meta.env.VITE_ORS_PROXY_BASE_URL || '/api/ors'

type RequestOrsOptions = {
  method?: 'GET' | 'POST'
  searchParams?: URLSearchParams
  body?: unknown
}

export const requestOrs = async <T>(path: string, options: RequestOrsOptions = {}): Promise<T> => {
  const url = new URL(`${ORS_PROXY_BASE_URL}${path}`, window.location.origin)

  if (options.searchParams) {
    url.search = options.searchParams.toString()
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'OpenRouteService request failed.')
  }

  return (await response.json()) as T
}
