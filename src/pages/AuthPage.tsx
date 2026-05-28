import { useMemo, useState } from 'react'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAppStore } from '../store/appStore'

type AuthMode = 'login' | 'register'

type FormState = {
  email: string
  password: string
}

const initialState: FormState = {
  email: '',
  password: '',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const AuthPage = () => {
  const navigate = useNavigate()
  const authUser = useAppStore((state) => state.authUser)
  const login = useAppStore((state) => state.login)
  const [mode, setMode] = useState<AuthMode>('login')
  const [formState, setFormState] = useState<FormState>(initialState)
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(
    () =>
      mode === 'login' ? 'Welcome back to TheNavigator' : 'Create your travel planning workspace',
    [mode],
  )

  if (authUser) {
    return <Navigate to="/planner" replace />
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!emailRegex.test(formState.email)) {
      setError('Enter a valid email address.')
      return
    }

    if (formState.password.length < 6) {
      setError('Use at least 6 characters for the password.')
      return
    }

    login(formState.email)
    navigate('/planner', { replace: true })
  }

  return (
    <Box className="auth-page">
      <Paper elevation={0} className="auth-card">
        <Stack spacing={3} flex={1}>
          <Stack spacing={1.5}>
            <TravelExploreIcon color="primary" fontSize="large" />
            <Typography variant="h3" fontWeight={800}>
              TheNavigator
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Demo the latest Google Maps APIs with travel discovery, itinerary building, and route optimization.
            </Typography>
          </Stack>
          <Stack direction="row" className="auth-toggle">
            {(['login', 'register'] as const).map((item) => (
              <Button
                key={item}
                variant={mode === item ? 'contained' : 'text'}
                onClick={() => {
                  setMode(item)
                  setError(null)
                }}
                fullWidth
              >
                {item === 'login' ? 'Login' : 'Register'}
              </Button>
            ))}
          </Stack>
          <Box className="auth-form-shell">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -32 : 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
                <Typography variant="h5" fontWeight={700}>
                  {title}
                </Typography>
                <TextField
                  label="Email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={formState.password}
                  onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                  required
                  fullWidth
                />
                {error ? (
                  <Typography color="error.main" variant="body2">
                    {error}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Demo auth is stored locally so you can jump right into planning.
                  </Typography>
                )}
                <Button type="submit" variant="contained" size="large">
                  {mode === 'login' ? 'Login to planner' : 'Create account'}
                </Button>
              </Stack>
            </motion.div>
          </Box>
        </Stack>
        <Box className="auth-visual">
          <Typography variant="h4" fontWeight={800}>
            Explore, collect, and route your next tour.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search any location, inspect the top nearby places, drag your itinerary into shape, and compare ordered vs optimized routes.
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
