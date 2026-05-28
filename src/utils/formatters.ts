export const formatDistance = (distanceMeters: number) => {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`
  }

  return `${Math.round(distanceMeters)} m`
}

export const formatDuration = (duration: string) => {
  const seconds = Number.parseInt(duration.replace('s', ''), 10)

  if (Number.isNaN(seconds)) {
    return duration
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}
