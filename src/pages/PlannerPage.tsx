import { useState } from 'react'
import LogoutIcon from '@mui/icons-material/Logout'
import { Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'

import { ConfigPanel } from '../components/ConfigPanel'
import { MapPanel } from '../components/MapPanel'
import { NearbyPlacesList } from '../components/NearbyPlacesList'
import { SearchBox } from '../components/SearchBox'
import { SearchHistory } from '../components/SearchHistory'
import { SelectedPlacesPanel } from '../components/SelectedPlacesPanel'
import { computeRoute } from '../services/routes'
import { searchNearbyPlaces } from '../services/places'
import { useAppStore } from '../store/appStore'
import type { PlaceSummary, RouteMode, SearchHistoryItem } from '../types/googleMaps'

export const PlannerPage = () => {
  const navigate = useNavigate()
  const {
    authUser,
    origin,
    nearbyPlaces,
    searchHistory,
    selectedPlaces,
    tripConfig,
    setOrigin,
    setNearbyPlaces,
    addSelectedPlace,
    removeSelectedPlace,
    reorderSelectedPlaces,
    setRouteData,
    logout,
  } = useAppStore(
    useShallow((state) => ({
      authUser: state.authUser,
      origin: state.origin,
      nearbyPlaces: state.nearbyPlaces,
      searchHistory: state.searchHistory,
      selectedPlaces: state.selectedPlaces,
      tripConfig: state.tripConfig,
      setOrigin: state.setOrigin,
      setNearbyPlaces: state.setNearbyPlaces,
      addSelectedPlace: state.addSelectedPlace,
      removeSelectedPlace: state.removeSelectedPlace,
      reorderSelectedPlaces: state.reorderSelectedPlaces,
      setRouteData: state.setRouteData,
      logout: state.logout,
    })),
  )
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)

  const loadNearbyPlaces = async (place: PlaceSummary) => {
    setOrigin(place)
    setNearbyLoading(true)
    setNearbyError(null)

    try {
      const results = await searchNearbyPlaces(place.location, tripConfig.radiusKm, tripConfig.placeCount)
      setNearbyPlaces(results.filter((item) => item.placeId !== place.placeId))
    } catch (caughtError) {
      setNearbyPlaces([])
      setNearbyError(caughtError instanceof Error ? caughtError.message : 'Nearby search failed.')
    } finally {
      setNearbyLoading(false)
    }
  }

  const handleRoute = async (mode: RouteMode) => {
    if (!origin) {
      setRouteError('Select a touring location before generating a route.')
      return
    }

    setRouteLoading(true)
    setRouteError(null)

    try {
      const result = await computeRoute(origin, selectedPlaces, mode)
      setRouteData(mode, result)
      navigate('/route')
    } catch (caughtError) {
      setRouteError(caughtError instanceof Error ? caughtError.message : 'Unable to compute the route.')
    } finally {
      setRouteLoading(false)
    }
  }

  const handleReuseHistory = async (historyItem: SearchHistoryItem) => {
    await loadNearbyPlaces(historyItem)
  }

  return (
    <Box className="page-shell">
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Paper className="topbar" elevation={0}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight={800}>
                  Plan around {origin?.name || 'your next destination'}
                </Typography>
                <Typography color="text.secondary">
                  Signed in as {authUser?.email}. Search a hub location, explore the top nearby places, then build a route.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`${tripConfig.placeCount} places`} color="primary" variant="outlined" />
                <Chip label={`${tripConfig.radiusKm} KM radius`} color="secondary" variant="outlined" />
                <Button
                  variant="text"
                  startIcon={<LogoutIcon />}
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  Logout
                </Button>
              </Stack>
            </Stack>
          </Paper>
          <Box className="planner-grid">
            <Stack spacing={3} className="left-panel">
              <Paper className="surface" elevation={0}>
                <ConfigPanel />
              </Paper>
              <Paper className="surface" elevation={0}>
                <SearchBox key={origin?.placeId || 'search-box'} onPlaceSelected={loadNearbyPlaces} />
              </Paper>
              <Paper className="surface" elevation={0}>
                <SearchHistory history={searchHistory} onReuse={handleReuseHistory} />
              </Paper>
              <Paper className="surface scroll-surface" elevation={0}>
                <NearbyPlacesList
                  places={nearbyPlaces}
                  selectedPlaceIds={selectedPlaces.map((place) => place.placeId)}
                  loading={nearbyLoading}
                  error={nearbyError}
                  onAdd={addSelectedPlace}
                />
              </Paper>
            </Stack>
            <Stack spacing={3} className="right-panel">
              <Paper className="surface" elevation={0}>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Live map preview
                  </Typography>
                  <MapPanel
                    center={origin?.location}
                    origin={origin}
                    nearbyPlaces={nearbyPlaces}
                    selectedPlaces={selectedPlaces}
                    height={460}
                  />
                </Stack>
              </Paper>
              <Paper className="surface" elevation={0}>
                <SelectedPlacesPanel
                  places={selectedPlaces}
                  loading={routeLoading}
                  error={routeError}
                  onRemove={removeSelectedPlace}
                  onReorder={reorderSelectedPlaces}
                  onRoute={handleRoute}
                />
              </Paper>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
