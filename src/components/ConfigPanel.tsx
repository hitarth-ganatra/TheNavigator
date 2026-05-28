import { Stack, TextField, Typography } from '@mui/material'

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
          inputProps={{ min: 1, max: 10 }}
          onChange={(event) =>
            updateTripConfig({
              placeCount: Math.min(10, Math.max(1, Number(event.target.value) || 1)),
            })
          }
          fullWidth
        />
        <TextField
          label="Radius (KM)"
          type="number"
          value={tripConfig.radiusKm}
          inputProps={{ min: 1, max: 50 }}
          onChange={(event) =>
            updateTripConfig({
              radiusKm: Math.min(50, Math.max(1, Number(event.target.value) || 1)),
            })
          }
          fullWidth
        />
      </Stack>
    </Stack>
  )
}
