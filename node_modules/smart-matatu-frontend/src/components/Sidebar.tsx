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
  Clock
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'

interface SidebarProps {
  language: 'en' | 'sw'
  setLanguage: (lang: 'en' | 'sw') => void
}

export default function Sidebar({ language, setLanguage }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { state, logout } = useApp()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Map', href: '/map', icon: MapPin },
    { name: 'Report', href: '/report', icon: BarChart3 },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const quickActions = [
    { name: 'Favorites', href: '/profile?tab=favorites', icon: Heart },
    { name: 'Reports', href: '/profile?tab=reports', icon: History },
    { name: 'Safety', href: '/profile?tab=safety', icon: Shield },
    { name: 'Predictions', href: '/analytics', icon: Clock },
  ]

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
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:shadow-none
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Smart Matatu
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {state.user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {state.user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* Language Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Language</span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded-full hover:bg-primary-200 transition-colors"
            >
              {language === 'en' ? 'SW' : 'EN'}
            </button>
          </div>

          {/* Weather Info */}
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <Cloud className="w-4 h-4 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600">Weather</p>
              <p className="text-sm font-medium text-gray-900">24°C, Partly Cloudy</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}
