import { useEffect, useRef, useState } from 'react'
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material'

import { googleMapsConfig, loadMapsLibrary, loadMarkerLibrary } from '../services/googleMaps'
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

export const MapPanel = ({
  center,
  origin,
  nearbyPlaces = [],
  selectedPlaces = [],
  encodedPolyline,
  height = 420,
}: MapPanelProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Array<google.maps.marker.AdvancedMarkerElement>>([])
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeMap = async () => {
      try {
        setLoading(true)
        const mapsLibrary = await loadMapsLibrary()
        await loadMarkerLibrary()

        if (!mounted || !containerRef.current) {
          return
        }

        mapRef.current = new mapsLibrary.Map(containerRef.current, {
          center: center || { lat: 20.5937, lng: 78.9629 },
          zoom: center ? 11 : 4,
          mapId: googleMapsConfig.mapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          tilt: center ? 45 : 0,
          heading: center ? 40 : 0,
        })
        setError(null)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Map failed to load.')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeMap()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || loading) {
      return
    }

    markersRef.current.forEach((marker) => {
      marker.map = null
    })
    markersRef.current = []

    polylineRef.current?.setMap(null)
    polylineRef.current = null

    const bounds = new google.maps.LatLngBounds()
    const allPlaces = [origin, ...nearbyPlaces, ...selectedPlaces].filter(Boolean) as PlaceSummary[]

    allPlaces.forEach((place) => {
      const isOrigin = place.placeId === origin?.placeId
      const isSelected = selectedPlaces.some((item) => item.placeId === place.placeId)
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current!,
        position: place.location,
        title: place.name,
        content: (() => {
          const node = document.createElement('div')
          node.className = `map-marker ${isOrigin ? 'map-marker--origin' : isSelected ? 'map-marker--selected' : ''}`
          node.textContent = isOrigin ? '📍' : isSelected ? '★' : '•'
          return node
        })(),
      })
      markersRef.current.push(marker)
      bounds.extend(place.location)
    })

    if (encodedPolyline) {
      polylineRef.current = new google.maps.Polyline({
        path: decodePolyline(encodedPolyline),
        strokeColor: '#4f46e5',
        strokeOpacity: 0.85,
        strokeWeight: 5,
      })
      polylineRef.current.setMap(mapRef.current)
      decodePolyline(encodedPolyline).forEach((point) => bounds.extend(point))
    }

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 64)
    } else if (center) {
      mapRef.current.setCenter(center)
      mapRef.current.setZoom(11)
    }
  }, [center, encodedPolyline, loading, nearbyPlaces, origin, selectedPlaces])

  return (
    <Box className="map-shell" sx={{ minHeight: height }}>
      {error ? (
        <Stack spacing={2} className="map-fallback">
          <Alert severity="warning">{error}</Alert>
          <Typography variant="body2" color="text.secondary">
            Add a valid Google Maps key and vector map ID to render the live 3D map.
          </Typography>
        </Stack>
      ) : (
        <>
          {loading && (
            <Stack className="map-loading" alignItems="center" justifyContent="center">
              <CircularProgress />
            </Stack>
          )}
          <Box ref={containerRef} className="map-canvas" sx={{ minHeight: height }} />
        </>
      )}
    </Box>
  )
}
