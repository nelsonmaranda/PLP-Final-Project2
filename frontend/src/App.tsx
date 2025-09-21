import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary'
import { setupGlobalErrorHandling } from './utils/errorHandling'

// Lazy load components for better performance
const HomePage = lazy(() => import('./components/HomePage'))
const MapView = lazy(() => import('./screens/MapView'))
const ReportForm = lazy(() => import('./screens/ReportForm'))
const Login = lazy(() => import('./screens/Login'))
const Signup = lazy(() => import('./screens/Signup'))
const Profile = lazy(() => import('./screens/Profile'))
const Admin = lazy(() => import('./screens/Admin'))
const AnalyticsDashboard = lazy(() => import('./screens/AnalyticsDashboard'))
const SaccoDashboard = lazy(() => import('./screens/SaccoDashboard'))
const AuthorityDashboard = lazy(() => import('./screens/AuthorityDashboard'))

function App() {
  // Setup global error handling
  React.useEffect(() => {
    setupGlobalErrorHandling()
  }, [])

  return (
    <EnhancedErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <AccessibilityProvider>
        <AppProvider>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/report" element={<ReportForm />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/sacco" element={<SaccoDashboard />} />
                <Route path="/authority" element={<AuthorityDashboard />} />
              </Routes>
            </Suspense>
          </Layout>
        </AppProvider>
      </AccessibilityProvider>
    </EnhancedErrorBoundary>
  )
}

export default App