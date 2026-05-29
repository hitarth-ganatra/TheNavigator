import { toNearbyBufferMeters } from '../config/trip'
import type { AutocompletePrediction, Coordinates, PlaceSummary } from '../types/googleMaps'
import { requestOrs } from './ors'

const TOURISM_FOCUSED_KEYS = new Set(['tourism', 'leisure', 'historic'])
const FUN_AMENITIES = new Set([
  'arts_centre',
  'bar',
  'cafe',
  'cinema',
  'community_centre',
  'food_court',
  'ice_cream',
  'marketplace',
  'nightclub',
  'park',
  'planetarium',
  'pub',
  'restaurant',
  'social_centre',
  'theatre',
])
const EXCLUDED_AMENITIES = new Set(['atm', 'bank', 'clinic', 'doctors', 'hospital'])

type RankedPlace = PlaceSummary & { score: number; excluded: boolean }

const toPlaceId = (feature: {
  properties?: { gid?: string; id?: string; osm_id?: string; osm_type?: string; name?: string; label?: string }
  geometry?: { coordinates?: [number, number] }
}) => {
  if (feature.properties?.gid) {
    return feature.properties.gid
  }

  if (feature.properties?.id) {
    return String(feature.properties.id)
  }

  if (feature.properties?.osm_id && feature.properties?.osm_type) {
    return `${feature.properties.osm_type}:${feature.properties.osm_id}`
  }

  const [lng = 0, lat = 0] = feature.geometry?.coordinates || []
  return `${lat},${lng}`
}

const toPlaceSummary = (feature: {
  properties?: { label?: string; name?: string }
  geometry?: { coordinates?: [number, number] }
}): PlaceSummary => {
  const [lng = 0, lat = 0] = feature.geometry?.coordinates || []
  const name = feature.properties?.name || feature.properties?.label?.split(',')[0] || 'Unknown place'

  return {
    placeId: toPlaceId(feature),
    name,
    address: feature.properties?.label || name,
    location: { lat, lng },
  }
}

export const autocompletePlaces = async (input: string): Promise<AutocompletePrediction[]> => {
  if (input.trim().length < 2) {
    return []
  }

  const searchParams = new URLSearchParams({
    text: input.trim(),
    size: '5',
  })

  const language = import.meta.env.VITE_MAP_LANGUAGE
  if (language) {
    searchParams.set('lang', language)
  }

  const country = import.meta.env.VITE_MAP_COUNTRY_CODE
  if (country) {
    searchParams.set('boundary.country', country)
  }

  const data = await requestOrs<{
    features?: Array<{
      properties?: { label?: string; name?: string }
      geometry?: { coordinates?: [number, number] }
    }>
  }>('/geocode/autocomplete', { searchParams })

  return (data.features || [])
    .map((feature) => {
      const place = toPlaceSummary(feature)
      const [firstLine, ...rest] = place.address.split(',')

      return {
        placeId: place.placeId,
        text: firstLine?.trim() || place.name,
        secondaryText: rest.join(',').trim() || undefined,
        place,
      }
    })
    .filter((item) => item.place.location.lat !== 0 || item.place.location.lng !== 0)
}

export const searchNearbyPlaces = async (
  center: Coordinates,
  radiusKm: number,
  placeCount: number,
): Promise<PlaceSummary[]> => {
  const data = await requestOrs<{
    features?: Array<{
      properties?: {
        osm_id?: string
        osm_type?: string
        name?: string
        osm_tags?: { [key: string]: string | undefined }
      }
      geometry?: { coordinates?: [number, number] }
    }>
  }>('/pois', {
    method: 'POST',
    body: {
      request: 'pois',
      geometry: {
        geojson: {
          type: 'Point',
          coordinates: [center.lng, center.lat],
        },
        buffer: toNearbyBufferMeters(radiusKm),
      },
      limit: Math.min(Math.max(placeCount * 2, 10), 50),
      sortby: 'distance',
    },
  })

  const ranked = (data.features || [])
    .map((feature) => {
      const [lng = 0, lat = 0] = feature.geometry?.coordinates || []
      const tags = feature.properties?.osm_tags || {}
      const amenity = tags.amenity?.toLowerCase()
      const tourismScore = [...TOURISM_FOCUSED_KEYS].reduce((score, key) => (tags[key] ? score + 2 : score), 0)
      const amenityScore = amenity && FUN_AMENITIES.has(amenity) ? 2 : 0
      const excluded = amenity ? EXCLUDED_AMENITIES.has(amenity) : false
      const name =
        feature.properties?.name ||
        tags.name ||
        tags.tourism ||
        tags.amenity ||
        'Unknown place'
      const address =
        tags['addr:full'] ||
        [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'],
        ]
          .filter(Boolean)
          .join(', ') ||
        name

      return {
        placeId:
          (feature.properties?.osm_type && feature.properties?.osm_id
            ? `${feature.properties.osm_type}:${feature.properties.osm_id}`
            : `${lat},${lng}`) ||
          crypto.randomUUID(),
        name,
        address,
        location: { lat, lng },
        score: tourismScore + amenityScore,
        excluded,
      } as RankedPlace
    })
    .filter((place) => place.location.lat !== 0 || place.location.lng !== 0)
    .sort((a, b) => {
      if (a.excluded !== b.excluded) {
        return Number(a.excluded) - Number(b.excluded)
      }

      return b.score - a.score
    })

  const deduped = Array.from(new Map(ranked.map((place) => [place.placeId, place])).values())
  const preferred = deduped.filter((place) => !place.excluded)
  const fallback = deduped.filter((place) => place.excluded)

  return [...preferred, ...fallback].slice(0, placeCount).map((place) => ({
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    location: place.location,
  }))
}
