import { Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { AppProvider } from './contexts/AppContext'
import Layout from './components/Layout'
import Home from './screens/Home'
import MapView from './screens/MapView'
import ReportForm from './screens/ReportForm'
import Login from './screens/Login'
import Signup from './screens/Signup'
import Admin from './screens/Admin'
import ErrorFallback from './components/ErrorFallback'

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App