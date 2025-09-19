import { useApp } from '../contexts/AppContext'
import Home from '../screens/Home'
import Dashboard from '../screens/Dashboard'

export default function HomePage() {
  const { state } = useApp()
  
  // Show dashboard for authenticated users, home page for non-authenticated users
  return state.isAuthenticated ? <Dashboard /> : <Home />
}
