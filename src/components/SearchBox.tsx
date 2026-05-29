import { useEffect, useMemo, useState } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import {
  Autocomplete,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { autocompletePlaces } from '../services/places'
import { useAppStore } from '../store/appStore'
import type { AutocompletePrediction, PlaceSummary } from '../types/googleMaps'

type SearchBoxProps = {
  onPlaceSelected: (place: PlaceSummary) => Promise<void>
}

export const SearchBox = ({ onPlaceSelected }: SearchBoxProps) => {
  const origin = useAppStore((state) => state.origin)
  const [inputValue, setInputValue] = useState(() => origin?.name || '')
  const [options, setOptions] = useState<AutocompletePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debouncedInput = useDebouncedValue(inputValue)

  useEffect(() => {
    let active = true

    const lookup = async () => {
      if (!debouncedInput.trim()) {
        setOptions([])
        return
      }

      try {
        setLoading(true)
        const predictions = await autocompletePlaces(debouncedInput)
        if (active) {
          setOptions(predictions)
          setError(null)
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : 'Autocomplete failed.')
          setOptions([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void lookup()

    return () => {
      active = false
    }
  }, [debouncedInput])

  const helperText = useMemo(() => {
    if (error) {
      return error
    }

    return 'Search for a city, locality, or landmark to explore nearby attractions.'
  }, [error])

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700}>
        Pick your touring location
      </Typography>
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option.text}
        filterOptions={(x) => x}
        loading={loading}
        value={null}
        inputValue={inputValue}
        onInputChange={(_, value) => setInputValue(value)}
        onChange={async (_, value) => {
          if (!value) {
            return
          }

          try {
            setLoading(true)
            const place = value.place
            setInputValue(place.name)
            await onPlaceSelected(place)
            setError(null)
            setOptions([])
          } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Place selection failed.')
          } finally {
            setLoading(false)
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search city, area, or landmark"
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.placeId}>
            <Stack>
              <Typography fontWeight={600}>{option.text}</Typography>
              {option.secondaryText ? (
                <Typography variant="body2" color="text.secondary">
                  {option.secondaryText}
                </Typography>
              ) : null}
            </Stack>
          </li>
        )}
      />
    </Stack>
  )
}
