import HistoryIcon from '@mui/icons-material/History'
import { Button, Chip, Stack, Typography } from '@mui/material'

import type { SearchHistoryItem } from '../types/googleMaps'

type SearchHistoryProps = {
  history: SearchHistoryItem[]
  onReuse: (item: SearchHistoryItem) => Promise<void>
}

export const SearchHistory = ({ history, onReuse }: SearchHistoryProps) => {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <HistoryIcon fontSize="small" color="action" />
        <Typography variant="h6" fontWeight={700}>
          Search history
        </Typography>
      </Stack>
      {history.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Your recent touring locations appear here for one-tap reuse.
        </Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {history.map((item) => (
            <Button key={item.placeId} variant="outlined" size="small" onClick={() => void onReuse(item)}>
              {item.name}
            </Button>
          ))}
        </Stack>
      )}
      <Chip label="Persisted locally for the demo" size="small" variant="outlined" />
    </Stack>
  )
}
