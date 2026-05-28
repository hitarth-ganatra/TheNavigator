import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StarIcon from '@mui/icons-material/Star'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'

import type { PlaceSummary } from '../types/googleMaps'

type NearbyPlacesListProps = {
  places: PlaceSummary[]
  selectedPlaceIds: string[]
  loading: boolean
  error: string | null
  onAdd: (place: PlaceSummary) => void
}

export const NearbyPlacesList = ({
  places,
  selectedPlaceIds,
  loading,
  error,
  onAdd,
}: NearbyPlacesListProps) => {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700}>
        Popular places nearby
      </Typography>
      {error ? <Alert severity="warning">{error}</Alert> : null}
      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Finding the most popular attractions nearby...
        </Typography>
      ) : null}
      {!loading && !error && places.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Select a touring location to see nearby destinations ranked by popularity.
        </Typography>
      ) : null}
      <Stack spacing={1.5}>
        {places.map((place) => {
          const isSelected = selectedPlaceIds.includes(place.placeId)

          return (
            <Card key={place.placeId} variant="outlined">
              <CardContent>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700}>{place.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {place.address}
                      </Typography>
                    </Stack>
                    <Button
                      variant={isSelected ? 'contained' : 'outlined'}
                      color={isSelected ? 'success' : 'primary'}
                      startIcon={isSelected ? <CheckCircleIcon /> : <AddCircleOutlineIcon />}
                      onClick={() => onAdd(place)}
                      disabled={isSelected}
                    >
                      {isSelected ? 'Added' : 'Add'}
                    </Button>
                  </Stack>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {typeof place.rating === 'number' ? (
                      <Chip icon={<StarIcon />} label={`${place.rating.toFixed(1)} (${place.userRatingCount || 0})`} />
                    ) : null}
                    {typeof place.openNow === 'boolean' ? (
                      <Chip
                        label={place.openNow ? 'Open now' : 'Closed now'}
                        color={place.openNow ? 'success' : 'default'}
                        variant="outlined"
                      />
                    ) : null}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}
