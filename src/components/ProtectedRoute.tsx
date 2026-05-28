import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

import { useAppStore } from '../store/appStore'

type ProtectedRouteProps = {
  children: ReactElement
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const authUser = useAppStore((state) => state.authUser)

  if (!authUser) {
    return <Navigate to="/" replace />
  }

  return children
}
