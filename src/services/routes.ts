import type { PlaceSummary, RouteMode, RouteResult } from '../types/googleMaps'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const ROUTES_BASE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

const ensureApiKey = () => {
  if (!API_KEY) {
    throw new Error('Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY to compute routes.')
  }

  return API_KEY
}

const toWaypoint = (place: PlaceSummary) => ({
  location: {
    latLng: {
      latitude: place.location.lat,
      longitude: place.location.lng,
    },
  },
})

export const computeRoute = async (
  origin: PlaceSummary,
  selectedPlaces: PlaceSummary[],
  mode: RouteMode,
): Promise<RouteResult> => {
  const apiKey = ensureApiKey()

  if (selectedPlaces.length === 0) {
    throw new Error('Choose at least one stop before computing a route.')
  }

  const response = await fetch(ROUTES_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex,routes.legs.distanceMeters,routes.legs.duration',
    },
    body: JSON.stringify({
      origin: toWaypoint(origin),
      destination: toWaypoint(origin),
      intermediates: selectedPlaces.map(toWaypoint),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      optimizeWaypointOrder: mode === 'optimized',
      languageCode: import.meta.env.VITE_GOOGLE_MAPS_LANGUAGE || 'en',
      units: 'METRIC',
    }),
  })

  if (!response.ok) {
    throw new Error('Route request failed. Confirm Routes API access and billing are enabled.')
  }

  const data = (await response.json()) as {
    routes?: Array<{
      distanceMeters?: number
      duration?: string
      polyline?: { encodedPolyline?: string }
      optimizedIntermediateWaypointIndex?: number[]
      legs?: Array<{
        distanceMeters?: number
        duration?: string
      }>
    }>
  }

  const route = data.routes?.[0]

  if (!route?.polyline?.encodedPolyline) {
    throw new Error('No route was returned for the selected places.')
  }

  const orderedStops =
    mode === 'optimized' && route.optimizedIntermediateWaypointIndex?.length
      ? route.optimizedIntermediateWaypointIndex.map((index) => selectedPlaces[index])
      : selectedPlaces

  const legs = (route.legs || []).map((leg, index) => ({
    distanceMeters: leg.distanceMeters || 0,
    duration: leg.duration || '0s',
    startAddress: index === 0 ? origin.name : orderedStops[index - 1]?.name || origin.name,
    endAddress: orderedStops[index]?.name || origin.name,
  }))

  return {
    encodedPolyline: route.polyline.encodedPolyline,
    totalDistanceMeters: route.distanceMeters || 0,
    totalDuration: route.duration || '0s',
    optimizedOrder: route.optimizedIntermediateWaypointIndex || [],
    legs,
  }
}
