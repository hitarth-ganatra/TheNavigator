import { useMemo, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { Navigate, useNavigate } from 'react-router-dom'

import { MapPanel } from '../components/MapPanel'
import { computeRoute } from '../services/routes'
import { useAppStore } from '../store/appStore'
import { formatDistance, formatDuration } from '../utils/formatters'

export const RoutePage = () => {
  const navigate = useNavigate()
  const {
    origin,
    routeMode,
    routeResult,
    selectedPlaces,
    removeSelectedPlace,
    setRouteData,
  } = useAppStore((state) => ({
    origin: state.origin,
    routeMode: state.routeMode,
    routeResult: state.routeResult,
    selectedPlaces: state.selectedPlaces,
    removeSelectedPlace: state.removeSelectedPlace,
    setRouteData: state.setRouteData,
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orderedPlaces = useMemo(() => {
    if (!routeResult || routeMode !== 'optimized' || routeResult.optimizedOrder.length === 0) {
      return selectedPlaces
    }

    return routeResult.optimizedOrder.map((index) => selectedPlaces[index]).filter(Boolean)
  }, [routeMode, routeResult, selectedPlaces])

  if (!origin || !routeMode || !routeResult) {
    return <Navigate to="/planner" replace />
  }

  const handleRecompute = async () => {
    setLoading(true)
    setError(null)

    try {
      const nextRoute = await computeRoute(origin, selectedPlaces, routeMode)
      setRouteData(routeMode, nextRoute)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Recompute failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="page-shell">
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Paper className="topbar" elevation={0}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight={800}>
                  {routeMode === 'optimized' ? 'Best route suggestion' : 'Route in your selected order'}
                </Typography>
                <Typography color="text.secondary">
                  Start and end at {origin.name}, with {selectedPlaces.length} stop{selectedPlaces.length === 1 ? '' : 's'} in between.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate('/planner')}>
                  Back to planner
                </Button>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => void handleRecompute()}
                  disabled={loading || selectedPlaces.length === 0}
                >
                  Recompute route
                </Button>
              </Stack>
            </Stack>
          </Paper>
          {error ? <Alert severity="warning">{error}</Alert> : null}
          <Box className="route-grid">
            <Paper className="surface scroll-surface" elevation={0}>
              <Stack spacing={2.5}>
                <Typography variant="h6" fontWeight={700}>
                  Stops overview
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={700}>{origin.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {origin.address}
                    </Typography>
                  </Stack>
                </Paper>
                {orderedPlaces.map((place, index) => (
                  <Paper key={place.placeId} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Stack>
                          <Typography fontWeight={700}>{`${index + 1}. ${place.name}`}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {place.address}
                          </Typography>
                        </Stack>
                        <Button color="error" onClick={() => removeSelectedPlace(place.placeId)}>
                          Remove
                        </Button>
                      </Stack>
                      {routeResult.legs[index] ? (
                        <Typography variant="body2" color="text.secondary">
                          Leg: {formatDistance(routeResult.legs[index].distanceMeters)} ·{' '}
                          {formatDuration(routeResult.legs[index].duration)}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Paper>
                ))}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Stack spacing={1}>
                    <Typography fontWeight={700}>Return to {origin.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total trip: {formatDistance(routeResult.totalDistanceMeters)} · {formatDuration(routeResult.totalDuration)}
                    </Typography>
                  </Stack>
                </Paper>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Removing a place updates the list instantly. Click “Recompute route” to refresh the map and timings.
                </Typography>
              </Stack>
            </Paper>
            <Paper className="surface" elevation={0}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Route map
                </Typography>
                <MapPanel
                  center={origin.location}
                  origin={origin}
                  selectedPlaces={orderedPlaces}
                  encodedPolyline={routeResult.encodedPolyline}
                  height={640}
                />
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
