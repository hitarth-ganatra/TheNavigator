import type { PlaceSummary, RouteMode, RouteResult } from '../types/googleMaps'
import { requestOrs } from './ors'

const toDurationString = (seconds: number) => `${Math.max(0, Math.round(seconds))}s`

const haversineMeters = (left: PlaceSummary, right: PlaceSummary) => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadius = 6371000
  const dLat = toRad(right.location.lat - left.location.lat)
  const dLng = toRad(right.location.lng - left.location.lng)
  const lat1 = toRad(left.location.lat)
  const lat2 = toRad(right.location.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)

  return 2 * earthRadius * Math.asin(Math.sqrt(a))
}

const optimizeStops = (origin: PlaceSummary, selectedPlaces: PlaceSummary[]) => {
  const remaining = selectedPlaces.map((_, index) => index)
  const order: number[] = []
  let current = origin

  while (remaining.length > 0) {
    let bestIndex = remaining[0]
    let bestDistance = Number.POSITIVE_INFINITY

    remaining.forEach((candidateIndex) => {
      const candidate = selectedPlaces[candidateIndex]
      const distance = haversineMeters(current, candidate)

      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = candidateIndex
      }
    })

    order.push(bestIndex)
    current = selectedPlaces[bestIndex]
    remaining.splice(remaining.indexOf(bestIndex), 1)
  }

  return order
}

export const computeRoute = async (
  origin: PlaceSummary,
  selectedPlaces: PlaceSummary[],
  mode: RouteMode,
): Promise<RouteResult> => {
  if (selectedPlaces.length === 0) {
    throw new Error('Choose at least one stop before computing a route.')
  }

  const optimizedOrder = mode === 'optimized' ? optimizeStops(origin, selectedPlaces) : []
  const orderedStops = optimizedOrder.length > 0 ? optimizedOrder.map((index) => selectedPlaces[index]) : selectedPlaces

  const coordinates = [origin, ...orderedStops, origin].map((place) => [place.location.lng, place.location.lat])

  const data = await requestOrs<{
    routes?: Array<{
      geometry?: string
      summary?: {
        distance?: number
        duration?: number
      }
      segments?: Array<{
        distance?: number
        duration?: number
      }>
    }>
  }>('/v2/directions/driving-car', {
    method: 'POST',
    body: {
      coordinates,
      instructions: false,
      geometry: true,
      elevation: false,
      units: 'm',
      language: import.meta.env.VITE_MAP_LANGUAGE || 'en',
    },
  })

  const route = data.routes?.[0]

  if (!route?.geometry) {
    throw new Error('No route was returned for the selected places.')
  }

  const legs = (route.segments || []).map((leg, index) => ({
    distanceMeters: leg.distance || 0,
    duration: toDurationString(leg.duration || 0),
    startAddress: index === 0 ? origin.name : orderedStops[index - 1]?.name || origin.name,
    endAddress: orderedStops[index]?.name || origin.name,
  }))

  return {
    encodedPolyline: route.geometry,
    totalDistanceMeters: route.summary?.distance || 0,
    totalDuration: toDurationString(route.summary?.duration || 0),
    optimizedOrder,
    legs,
  }
}
