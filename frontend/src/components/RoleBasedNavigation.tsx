import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  MapPin, 
  BarChart3, 
  User, 
  LogOut, 
  X, 
  Menu,
  Home,
  Heart,
  History,
  Shield,
  TrendingUp,
  Cloud,
  Clock,
  Building2,
  Gavel,
  Settings
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'

interface RoleBasedNavigationProps {
  language: 'en' | 'sw'
  setLanguage: (lang: 'en' | 'sw') => void
}

export default function RoleBasedNavigation({ language, setLanguage }: RoleBasedNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { state, logout } = useApp()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const getNavigationForRole = () => {
    const userRole = state.user?.role

    // Base navigation for all users
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Map', href: '/map', icon: MapPin },
      { name: 'Report', href: '/report', icon: BarChart3 },
    ]

    // Role-specific navigation
    switch (userRole) {
      case 'admin':
        return [
          ...baseNavigation,
          { name: 'Analytics', href: '/analytics', icon: TrendingUp },
          { name: 'SACCO Dashboard', href: '/sacco', icon: Building2 },
          { name: 'Authority Dashboard', href: '/authority', icon: Gavel },
          { name: 'Admin Panel', href: '/admin', icon: Settings },
          { name: 'Profile', href: '/profile', icon: User },
        ]
      
      case 'sacco':
        return [
          ...baseNavigation,
          { name: 'SACCO Dashboard', href: '/sacco', icon: Building2 },
          { name: 'Analytics', href: '/analytics', icon: TrendingUp },
          { name: 'Profile', href: '/profile', icon: User },
        ]
      
      case 'authority':
        return [
          ...baseNavigation,
          { name: 'Authority Dashboard', href: '/authority', icon: Gavel },
          { name: 'Analytics', href: '/analytics', icon: TrendingUp },
          { name: 'Profile', href: '/profile', icon: User },
        ]
      
      case 'moderator':
        return [
          ...baseNavigation,
          { name: 'Analytics', href: '/analytics', icon: TrendingUp },
          { name: 'Admin Panel', href: '/admin', icon: Settings },
          { name: 'Profile', href: '/profile', icon: User },
        ]
      
      default: // Regular users
        return [
          ...baseNavigation,
          { name: 'Analytics', href: '/analytics', icon: TrendingUp },
          { name: 'Profile', href: '/profile', icon: User },
        ]
    }
  }

  const getQuickActionsForRole = () => {
    const userRole = state.user?.role

    switch (userRole) {
      case 'admin':
        return [
          { name: 'Favorites', href: '/profile?tab=favorites', icon: Heart },
          { name: 'Reports', href: '/profile?tab=reports', icon: History },
          { name: 'Safety', href: '/profile?tab=safety', icon: Shield },
          { name: 'Predictions', href: '/analytics', icon: Clock },
          { name: 'SACCO Management', href: '/sacco', icon: Building2 },
          { name: 'Authority Tools', href: '/authority', icon: Gavel },
        ]
      
      case 'sacco':
        return [
          { name: 'Favorites', href: '/profile?tab=favorites', icon: Heart },
          { name: 'Reports', href: '/profile?tab=reports', icon: History },
          { name: 'Safety', href: '/profile?tab=safety', icon: Shield },
          { name: 'Fleet Management', href: '/sacco', icon: Building2 },
        ]
      
      case 'authority':
        return [
          { name: 'Favorites', href: '/profile?tab=favorites', icon: Heart },
          { name: 'Reports', href: '/profile?tab=reports', icon: History },
          { name: 'Safety', href: '/profile?tab=safety', icon: Shield },
          { name: 'Compliance', href: '/authority', icon: Gavel },
        ]
      
      default:
        return [
          { name: 'Favorites', href: '/profile?tab=favorites', icon: Heart },
          { name: 'Reports', href: '/profile?tab=reports', icon: History },
          { name: 'Safety', href: '/profile?tab=safety', icon: Shield },
          { name: 'Predictions', href: '/analytics', icon: Clock },
        ]
    }
  }

  const getRoleDisplayName = () => {
    const userRole = state.user?.role
    switch (userRole) {
      case 'admin': return 'Administrator'
      case 'sacco': return 'SACCO Manager'
      case 'authority': return 'Transport Authority'
      case 'moderator': return 'Moderator'
      default: return 'User'
    }
  }

  const getRoleColor = () => {
    const userRole = state.user?.role
    switch (userRole) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'sacco': return 'bg-blue-100 text-blue-800'
      case 'authority': return 'bg-red-100 text-red-800'
      case 'moderator': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const navigation = getNavigationForRole()
  const quickActions = getQuickActionsForRole()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Cloud className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              {language === 'sw' ? 'Matatu Smart' : 'Smart Matatu'}
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {state.user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {state.user?.email || 'user@example.com'}
                </p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor()}`}>
                  {getRoleDisplayName()}
                </span>
              </div>
            </div>
          </div>

          {/* Language toggle */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Language:</span>
              <button
                onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                className="px-3 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {language === 'en' ? 'EN' : 'SW'}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="mt-2 space-y-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    to={action.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <action.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    {action.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              {language === 'sw' ? 'Ondoka' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  )
}
