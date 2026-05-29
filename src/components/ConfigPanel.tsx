import { Stack, TextField, Typography } from '@mui/material'

import { MAX_PLACE_COUNT, MAX_RADIUS_KM, MIN_PLACE_COUNT, MIN_RADIUS_KM, sanitizePlaceCount, sanitizeRadiusKm } from '../config/trip'
import { useAppStore } from '../store/appStore'

export const ConfigPanel = () => {
  const tripConfig = useAppStore((state) => state.tripConfig)
  const updateTripConfig = useAppStore((state) => state.updateTripConfig)

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700}>
        Planner configuration
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Popular places"
          type="number"
          value={tripConfig.placeCount}
          inputProps={{ min: MIN_PLACE_COUNT, max: MAX_PLACE_COUNT }}
          onChange={(event) =>
            updateTripConfig({
              placeCount: sanitizePlaceCount(Number(event.target.value)),
            })
          }
          fullWidth
        />
        <TextField
          label="Radius (KM, max 2)"
          type="number"
          value={tripConfig.radiusKm}
          inputProps={{ min: MIN_RADIUS_KM, max: MAX_RADIUS_KM }}
          onChange={(event) =>
            updateTripConfig({
              radiusKm: sanitizeRadiusKm(Number(event.target.value)),
            })
          }
          fullWidth
        />
      </Stack>
    </Stack>
  )
}
