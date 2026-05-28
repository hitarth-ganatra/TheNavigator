export type Coordinates = {
  lat: number
  lng: number
}

export type User = {
  id: string
  email: string
}

export type PlaceSummary = {
  placeId: string
  name: string
  address: string
  location: Coordinates
  rating?: number
  userRatingCount?: number
  openNow?: boolean
  photoUrl?: string
}

export type SearchHistoryItem = PlaceSummary & {
  searchedAt: string
}

export type TripConfig = {
  placeCount: number
  radiusKm: number
}

export type RouteMode = 'ordered' | 'optimized'

export type RouteLeg = {
  distanceMeters: number
  duration: string
  startAddress: string
  endAddress: string
}

export type RouteResult = {
  encodedPolyline: string
  totalDistanceMeters: number
  totalDuration: string
  optimizedOrder: number[]
  legs: RouteLeg[]
}

export type AutocompletePrediction = {
  placeId: string
  text: string
  secondaryText?: string
  place: PlaceSummary
}
