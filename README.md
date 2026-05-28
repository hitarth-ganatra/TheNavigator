# TheNavigator

TheNavigator is a React + TypeScript demo web app that showcases the latest Google Maps Platform APIs in a travel-planner flow.

## Features

- Login/register landing screen with a sliding animation
- Planner workspace with:
  - Google Places autocomplete
  - configurable nearby search radius and result count
  - recent search history
  - nearby popular place cards with add-to-itinerary actions
  - reorderable selected-places panel with drag and drop
  - live map preview with tilt/heading support for a 3D-style view
- Route page with:
  - ordered routing
  - optimized routing
  - route summary, legs, and full map polyline rendering

## Google Maps setup

Enable these APIs in Google Cloud:

1. Maps JavaScript API
2. Places API (New)
3. Routes API
4. Geocoding API

Recommended key restrictions:

- Restrict the key by HTTP referrer
- Restrict the key to the APIs listed above
- Create and use a vector map ID for the best 3D map experience

Create a local environment file:

```bash
cp .env.example .env
```

Fill in:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GOOGLE_MAP_ID=your_vector_map_id
VITE_GOOGLE_MAPS_REGION=IN
VITE_GOOGLE_MAPS_LANGUAGE=en
```

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
- Without a Google Maps API key the UI still loads, but live autocomplete, nearby search, and route computation stay disabled.
