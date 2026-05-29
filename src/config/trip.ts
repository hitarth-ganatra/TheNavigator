export const MIN_PLACE_COUNT = 1
export const MAX_PLACE_COUNT = 30
export const DEFAULT_PLACE_COUNT = 10

export const MIN_NEARBY_BUFFER_METERS = 1
export const MAX_NEARBY_BUFFER_METERS = 2000

export const MIN_RADIUS_KM = 1
export const MAX_RADIUS_KM = MAX_NEARBY_BUFFER_METERS / 1000
export const DEFAULT_RADIUS_KM = 10

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const sanitizePlaceCount = (value: number) => clamp(Math.round(value) || MIN_PLACE_COUNT, MIN_PLACE_COUNT, MAX_PLACE_COUNT)

export const sanitizeRadiusKm = (value: number) => clamp(value || MIN_RADIUS_KM, MIN_RADIUS_KM, MAX_RADIUS_KM)

export const toNearbyBufferMeters = (radiusKm: number) =>
  clamp(Math.round(sanitizeRadiusKm(radiusKm) * 1000), MIN_NEARBY_BUFFER_METERS, MAX_NEARBY_BUFFER_METERS)
