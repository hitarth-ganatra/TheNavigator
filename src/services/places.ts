import type { AutocompletePrediction, Coordinates, PlaceSummary } from '../types/googleMaps'

const API_KEY = import.meta.env.VITE_ORS_API_KEY
const ORS_BASE_URL = 'https://api.openrouteservice.org'

const ensureApiKey = () => {
  if (!API_KEY) {
    throw new Error('OpenRouteService API key is missing. Set VITE_ORS_API_KEY to use search.')
  }

  return API_KEY
}

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

export const createSessionToken = () => crypto.randomUUID().replace(/-/g, '')

export const autocompletePlaces = async (
  input: string,
  _sessionToken: string,
): Promise<AutocompletePrediction[]> => {
  const apiKey = ensureApiKey()

  if (input.trim().length < 2) {
    return []
  }

  const searchParams = new URLSearchParams({
    api_key: apiKey,
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

  const response = await fetch(`${ORS_BASE_URL}/geocode/autocomplete?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Autocomplete lookup failed. Check OpenRouteService access limits.')
  }

  const data = (await response.json()) as {
    features?: Array<{
      properties?: { label?: string; name?: string }
      geometry?: { coordinates?: [number, number] }
    }>
  }

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
  const apiKey = ensureApiKey()
  const response = await fetch(`${ORS_BASE_URL}/pois?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      request: 'pois',
      geometry: {
        geojson: {
          type: 'Point',
          coordinates: [center.lng, center.lat],
        },
        buffer: Math.min(Math.max(radiusKm * 1000, 1000), 50000),
      },
      limit: Math.min(Math.max(placeCount * 2, 10), 50),
      sortby: 'distance',
    }),
  })

  if (!response.ok) {
    throw new Error('Nearby search failed. Verify OpenRouteService POIs API access.')
  }

  const data = (await response.json()) as {
    features?: Array<{
      properties?: {
        osm_id?: string
        osm_type?: string
        name?: string
        osm_tags?: { [key: string]: string | undefined }
      }
      geometry?: { coordinates?: [number, number] }
    }>
  }

  const ranked = (data.features || [])
    .map((feature) => {
      const [lng = 0, lat = 0] = feature.geometry?.coordinates || []
      const name =
        feature.properties?.name ||
        feature.properties?.osm_tags?.name ||
        feature.properties?.osm_tags?.tourism ||
        feature.properties?.osm_tags?.amenity ||
        'Unknown place'
      const address =
        feature.properties?.osm_tags?.['addr:full'] ||
        [
          feature.properties?.osm_tags?.['addr:housenumber'],
          feature.properties?.osm_tags?.['addr:street'],
          feature.properties?.osm_tags?.['addr:city'],
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
      } as PlaceSummary
    })
    .filter((place) => place.location.lat !== 0 || place.location.lng !== 0)

  return Array.from(new Map(ranked.map((place) => [place.placeId, place])).values()).slice(0, placeCount)
}
