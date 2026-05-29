import type { IncomingMessage, ServerResponse } from 'node:http'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const ORS_PROXY_PREFIX = '/api/ors'
const ORS_BASE_URL = 'https://api.openrouteservice.org'
const MAX_PROXY_BODY_BYTES = 32 * 1024

const ALLOWED_ORS_ROUTES = new Map([
  ['/geocode/autocomplete', { methods: new Set(['GET']) }],
  ['/pois', { methods: new Set(['POST']) }],
  ['/v2/directions/driving-car', { methods: new Set(['POST']) }],
])

const sendText = (response: ServerResponse, statusCode: number, body: string, contentType = 'text/plain; charset=utf-8') => {
  response.statusCode = statusCode
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', contentType)
  response.end(body)
}

const readBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length

    if (size > MAX_PROXY_BODY_BYTES) {
      throw new Error('Request body is too large.')
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks).toString('utf8')
}

const createOrsProxyPlugin = (apiKey: string | undefined): Plugin => {
  const handleRequest = async (request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void) => {
    if (!request.url || !request.method) {
      next()
      return
    }

    const requestUrl = new URL(request.url, 'http://localhost')
    const isProxyRequest =
      requestUrl.pathname === ORS_PROXY_PREFIX || requestUrl.pathname.startsWith(`${ORS_PROXY_PREFIX}/`)

    if (!isProxyRequest) {
      next()
      return
    }

    if (!apiKey) {
      sendText(response, 503, 'OpenRouteService proxy is not configured. Set ORS_API_KEY on the server.')
      return
    }

    const upstreamPath = requestUrl.pathname.slice(ORS_PROXY_PREFIX.length) || '/'
    const allowedRoute = ALLOWED_ORS_ROUTES.get(upstreamPath)

    if (!allowedRoute) {
      sendText(response, 404, 'Unsupported OpenRouteService endpoint.')
      return
    }

    if (!allowedRoute.methods.has(request.method)) {
      response.setHeader('Allow', Array.from(allowedRoute.methods).join(', '))
      sendText(response, 405, 'Unsupported HTTP method for OpenRouteService proxy.')
      return
    }

    try {
      let body: string | undefined

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const contentType = request.headers['content-type']
        if (!contentType?.includes('application/json')) {
          sendText(response, 415, 'OpenRouteService proxy only accepts JSON request bodies.')
          return
        }

        body = await readBody(request)
      }

      const upstreamUrl = new URL(upstreamPath, ORS_BASE_URL)
      upstreamUrl.search = request.method === 'GET' ? requestUrl.search : ''

      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: {
          Authorization: apiKey,
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body,
      })

      response.statusCode = upstreamResponse.status
      response.setHeader('Cache-Control', 'no-store')

      const contentType = upstreamResponse.headers.get('content-type')
      if (contentType) {
        response.setHeader('Content-Type', contentType)
      }

      response.end(await upstreamResponse.text())
    } catch (error) {
      if (error instanceof Error && error.message === 'Request body is too large.') {
        sendText(response, 413, error.message)
        return
      }

      sendText(response, 502, 'OpenRouteService proxy request failed.')
    }
  }

  return {
    name: 'ors-proxy',
    configureServer(server) {
      server.middlewares.use(handleRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), createOrsProxyPlugin(env.ORS_API_KEY)],
  }
})
