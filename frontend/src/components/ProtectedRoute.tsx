import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
  requireAuth?: boolean
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { state } = useApp()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is authenticated but doesn't have the required role
  if (requireAuth && allowedRoles.length > 0 && state.user?.role) {
    if (!allowedRoles.includes(state.user.role)) {
      // Redirect to appropriate dashboard based on user role
      const redirectPath = getRedirectPathForRole(state.user.role)
      return <Navigate to={redirectPath} replace />
    }
  }

  return <>{children}</>
}

function getRedirectPathForRole(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'sacco':
      return '/sacco'
    case 'authority':
      return '/authority'
    case 'moderator':
      return '/admin'
    default:
      return '/'
  }
}
