import { useEffect } from 'react'
import { Box } from '@mui/material'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'

import type { Coordinates, PlaceSummary } from '../types/googleMaps'
import { decodePolyline } from '../utils/decodePolyline'

type MapPanelProps = {
  center?: Coordinates | null
  origin?: PlaceSummary | null
  nearbyPlaces?: PlaceSummary[]
  selectedPlaces?: PlaceSummary[]
  encodedPolyline?: string | null
  height?: number
}

const defaultCenter: [number, number] = [20.5937, 78.9629]

const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const tileAttribution =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const FitToData = ({
  center,
  points,
  routePath,
}: {
  center?: Coordinates | null
  points: Array<[number, number]>
  routePath: Array<{ lat: number; lng: number }>
}) => {
  const map = useMap()

  useEffect(() => {
    const allPoints = [...points, ...routePath.map((point) => [point.lat, point.lng] as [number, number])]

    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [64, 64] })
      return
    }

    if (center) {
      map.setView([center.lat, center.lng], 11)
      return
    }

    map.setView(defaultCenter, 4)
  }, [center, map, points, routePath])

  return null
}

export const MapPanel = ({
  center,
  origin,
  nearbyPlaces = [],
  selectedPlaces = [],
  encodedPolyline,
  height = 420,
}: MapPanelProps) => {
  const allPlaces = [origin, ...nearbyPlaces, ...selectedPlaces].filter(Boolean) as PlaceSummary[]
  const routePath = encodedPolyline ? decodePolyline(encodedPolyline) : []

  return (
    <Box className="map-shell" sx={{ minHeight: height }}>
      <MapContainer center={defaultCenter} zoom={4} className="map-canvas" style={{ minHeight: height }}>
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        <FitToData
          center={center}
          points={allPlaces.map((place) => [place.location.lat, place.location.lng])}
          routePath={routePath}
        />
        {allPlaces.map((place) => {
          const isOrigin = place.placeId === origin?.placeId
          const isSelected = selectedPlaces.some((item) => item.placeId === place.placeId)

          return (
            <CircleMarker
              key={`${place.placeId}-${isOrigin ? 'origin' : isSelected ? 'selected' : 'nearby'}`}
              center={[place.location.lat, place.location.lng]}
              radius={8}
              pathOptions={{
                color: isOrigin ? '#4338ca' : isSelected ? '#0f766e' : '#334155',
                fillColor: isOrigin ? '#4f46e5' : isSelected ? '#14b8a6' : '#ffffff',
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Tooltip>{place.name}</Tooltip>
            </CircleMarker>
          )
        })}
        {routePath.length > 1 ? (
          <Polyline
            positions={routePath.map((point) => [point.lat, point.lng] as [number, number])}
            pathOptions={{ color: '#4f46e5', opacity: 0.85, weight: 5 }}
          />
        ) : null}
      </MapContainer>
    </Box>
  )
}
