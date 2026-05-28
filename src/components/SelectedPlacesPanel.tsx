import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import RouteIcon from '@mui/icons-material/Route'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'

import type { PlaceSummary, RouteMode } from '../types/googleMaps'

type SelectedPlacesPanelProps = {
  places: PlaceSummary[]
  loading: boolean
  error: string | null
  onRemove: (placeId: string) => void
  onReorder: (activeId: string, overId: string) => void
  onRoute: (mode: RouteMode) => Promise<void>
}

type SortablePlaceCardProps = {
  index: number
  place: PlaceSummary
  onRemove: (placeId: string) => void
}

const SortablePlaceCard = ({ index, place, onRemove }: SortablePlaceCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: place.placeId })

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton {...attributes} {...listeners} size="small" color="inherit" aria-label={`Reorder ${place.name}`}>
            <DragIndicatorIcon />
          </IconButton>
          <Stack flex={1} spacing={0.5}>
            <Typography fontWeight={700}>{`${index + 1}. ${place.name}`}</Typography>
            <Typography variant="body2" color="text.secondary">
              {place.address}
            </Typography>
          </Stack>
          <IconButton color="error" onClick={() => onRemove(place.placeId)} aria-label={`Remove ${place.name}`}>
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  )
}

export const SelectedPlacesPanel = ({
  places,
  loading,
  error,
  onRemove,
  onReorder,
  onRoute,
}: SelectedPlacesPanelProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return
    }

    onReorder(String(event.active.id), String(event.over.id))
  }

  return (
    <Stack spacing={2} className="selected-panel">
      <Typography variant="h6" fontWeight={700}>
        Selected places
      </Typography>
      {error ? <Alert severity="warning">{error}</Alert> : null}
      {places.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Add nearby destinations here, then drag to reorder your itinerary.
        </Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={places.map((place) => place.placeId)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1.25}>
              {places.map((place, index) => (
                <SortablePlaceCard key={place.placeId} index={index} place={place} onRemove={onRemove} />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}
      <Divider />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="contained"
          startIcon={<RouteIcon />}
          disabled={places.length === 0 || loading}
          onClick={() => void onRoute('ordered')}
          fullWidth
        >
          Find Route in Order
        </Button>
        <Button
          variant="outlined"
          startIcon={<ShuffleIcon />}
          disabled={places.length < 2 || loading}
          onClick={() => void onRoute('optimized')}
          fullWidth
        >
          Get Best Route
        </Button>
      </Stack>
    </Stack>
  )
}
