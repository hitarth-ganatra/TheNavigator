# TheNavigator

TheNavigator is a React + TypeScript demo web app for travel planning using free-map providers (OpenStreetMap + OpenRouteService).

## Features

- Login/register landing screen with a sliding animation
- Planner workspace with:
  - location autocomplete
  - configurable nearby search radius and result count
  - recent search history
  - nearby place cards with add-to-itinerary actions
  - reorderable selected-places panel with drag and drop
  - live map preview
- Route page with:
  - ordered routing
  - optimized routing (nearest-neighbor heuristic)
  - route summary, legs, and full map polyline rendering

## API setup

Create a free OpenRouteService key (no upfront payment required) and configure your local environment file:

```bash
cp .env.example .env
```

Fill in:

```env
ORS_API_KEY=your_openrouteservice_api_key
VITE_ORS_PROXY_BASE_URL=/api/ors
VITE_MAP_COUNTRY_CODE=IN
VITE_MAP_LANGUAGE=en
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION=&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
```

`ORS_API_KEY` is now server-only. The app sends browser requests to a local `/api/ors` proxy, and the Vite server/preview process adds the `Authorization` header before forwarding the request to OpenRouteService so the key is no longer shipped to the client bundle or query string.

## Run locally

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

## Notes

- Auth is implemented as a local demo flow and persisted in local storage.
- Search history, planner state, and the last computed route are also persisted locally.
- OpenStreetMap attribution must stay visible when using the default tile layer.
- Nearby POI search is capped at a 100 KM radius based on the configured ORS buffer limit.
- Without a server-side `ORS_API_KEY` the UI still loads, but live autocomplete, nearby search, and route computation fail until the proxy is configured.
