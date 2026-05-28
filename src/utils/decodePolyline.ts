import type { Coordinates } from '../types/googleMaps'

export const decodePolyline = (encoded: string): Coordinates[] => {
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates: Coordinates[] = []

  while (index < encoded.length) {
    let result = 1
    let shift = 0
    let byte: number

    do {
      byte = encoded.charCodeAt(index++) - 63 - 1
      result += byte << shift
      shift += 5
    } while (byte >= 0x1f)

    lat += result & 1 ? ~(result >> 1) : result >> 1

    result = 1
    shift = 0

    do {
      byte = encoded.charCodeAt(index++) - 63 - 1
      result += byte << shift
      shift += 5
    } while (byte >= 0x1f)

    lng += result & 1 ? ~(result >> 1) : result >> 1

    coordinates.push({ lat: lat * 1e-5, lng: lng * 1e-5 })
  }

  return coordinates
}
