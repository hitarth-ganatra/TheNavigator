import type { AutocompletePrediction, Coordinates, PlaceSummary } from '../types/googleMaps'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const PLACES_BASE_URL = 'https://places.googleapis.com/v1'

const ensureApiKey = () => {
  if (!API_KEY) {
    throw new Error('Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY to use autocomplete and nearby search.')
  }
}

const placeTypes = [
  'tourist_attraction',
  'museum',
  'amusement_park',
  'art_gallery',
  'historical_landmark',
  'park',
  'zoo',
  'aquarium',
]

const buildPhotoUrl = (photoName?: string) => {
  if (!photoName || !API_KEY) {
    return undefined
  }

  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=480&key=${API_KEY}`
}

const mapPlace = (place: {
  id: string
  displayName?: { text?: string }
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  rating?: number
  userRatingCount?: number
  regularOpeningHours?: { openNow?: boolean }
  photos?: Array<{ name?: string }>
}): PlaceSummary => ({
  placeId: place.id,
  name: place.displayName?.text || 'Unknown place',
  address: place.formattedAddress || 'No address available',
  location: {
    lat: place.location?.latitude || 0,
    lng: place.location?.longitude || 0,
  },
  rating: place.rating,
  userRatingCount: place.userRatingCount,
  openNow: place.regularOpeningHours?.openNow,
  photoUrl: buildPhotoUrl(place.photos?.[0]?.name),
})

export const createSessionToken = () => crypto.randomUUID().replace(/-/g, '')

export const autocompletePlaces = async (
  input: string,
  sessionToken: string,
): Promise<AutocompletePrediction[]> => {
  ensureApiKey()

  if (input.trim().length < 2) {
    return []
  }

  const response = await fetch(`${PLACES_BASE_URL}/places:autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
    },
    body: JSON.stringify({
      input,
      sessionToken,
      includedPrimaryTypes: ['geocode', 'locality', 'administrative_area_level_1', 'country'],
    }),
  })

  if (!response.ok) {
    throw new Error('Autocomplete lookup failed. Check Places API access and billing.')
  }

  const data = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string
        text?: { text?: string }
        structuredFormat?: {
          secondaryText?: { text?: string }
        }
      }
    }>
  }

  return (data.suggestions || [])
    .flatMap((item) => {
      const prediction = item.placePrediction
      if (!prediction?.placeId || !prediction.text?.text) {
        return []
      }

      return [
        {
          placeId: prediction.placeId,
          text: prediction.text.text,
          secondaryText: prediction.structuredFormat?.secondaryText?.text,
        },
      ]
    })
    .slice(0, 5)
}

export const getPlaceDetails = async (placeId: string): Promise<PlaceSummary> => {
  ensureApiKey()

  const response = await fetch(`${PLACES_BASE_URL}/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'id,displayName,formattedAddress,location,rating,userRatingCount,regularOpeningHours.openNow,photos.name',
    },
  })

  if (!response.ok) {
    throw new Error('Place details could not be loaded.')
  }

  const place = (await response.json()) as Parameters<typeof mapPlace>[0]
  return mapPlace(place)
}

export const searchNearbyPlaces = async (
  center: Coordinates,
  radiusKm: number,
  placeCount: number,
): Promise<PlaceSummary[]> => {
  ensureApiKey()

  const response = await fetch(`${PLACES_BASE_URL}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours.openNow,places.photos.name',
    },
    body: JSON.stringify({
      includedTypes: placeTypes,
      maxResultCount: Math.min(Math.max(placeCount * 2, 10), 20),
      rankPreference: 'POPULARITY',
      locationRestriction: {
        circle: {
          center: {
            latitude: center.lat,
            longitude: center.lng,
          },
          radius: Math.min(Math.max(radiusKm * 1000, 1000), 50000),
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Nearby search failed. Verify Places API (New) is enabled.')
  }

  const data = (await response.json()) as {
    places?: Array<Parameters<typeof mapPlace>[0]>
  }

  const ranked = (data.places || [])
    .map(mapPlace)
    .filter((place) => place.location.lat && place.location.lng)
    .sort((left, right) => {
      const leftScore = (left.rating || 0) * 10 + (left.userRatingCount || 0) / 100 + (left.openNow ? 5 : 0)
      const rightScore =
        (right.rating || 0) * 10 + (right.userRatingCount || 0) / 100 + (right.openNow ? 5 : 0)
      return rightScore - leftScore
    })

  return Array.from(new Map(ranked.map((place) => [place.placeId, place])).values()).slice(0, placeCount)
}
