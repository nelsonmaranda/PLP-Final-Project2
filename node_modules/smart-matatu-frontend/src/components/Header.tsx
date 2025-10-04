import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, MapPin, BarChart3, User, LogOut } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../hooks/useTranslation'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { state, logout, setLanguage } = useApp()
  const { t, language } = useTranslation()

  const navigation = [
    { name: t('navigation.home'), href: '/', icon: MapPin },
    { name: t('navigation.map'), href: '/map', icon: MapPin },
    { name: t('navigation.report'), href: '/report', icon: BarChart3 },
  ]

  const authNavigation = state.isAuthenticated 
    ? [
        { name: t('navigation.profile'), href: '/profile', icon: User },
        { name: t('navigation.logout'), href: '#', icon: LogOut, action: logout }
      ]
    : [
        { name: t('navigation.login'), href: '/login', icon: User }
      ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2"
            aria-label="Smart Matatu - Home"
          >
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Smart Matatu
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link flex items-center space-x-1 ${
                    isActive(item.href) ? 'nav-link-active' : ''
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            {authNavigation.map((item) => {
              const Icon = item.icon
              if (item.action) {
                return (
                  <button
                    key={item.name}
                    onClick={item.action}
                    className="nav-link flex items-center space-x-1"
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{item.name}</span>
                  </button>
                )
              }
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link flex items-center space-x-1 ${
                    isActive(item.href) ? 'nav-link-active' : ''
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Controls */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* User Welcome Message - Desktop only */}
            {state.isAuthenticated && state.user && (
              <div className="hidden md:block text-sm text-gray-600">
                Welcome, {state.user.displayName}
              </div>
            )}
            
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="btn btn-ghost btn-sm"
              aria-label={`Switch to ${language === 'en' ? 'Swahili' : 'English'}`}
            >
              {language === 'en' ? 'EN' : 'SW'}
            </button>

            {/* Mobile Logout Button - Always visible on mobile when authenticated */}
            {state.isAuthenticated && (
              <button
                onClick={logout}
                className="md:hidden btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label={t('navigation.logout')}
                title={t('navigation.logout')}
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden btn btn-ghost btn-sm"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden border-t border-gray-200 bg-white"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link flex items-center space-x-2 w-full py-3 px-3 rounded-lg ${
                      isActive(item.href) ? 'nav-link-active' : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-base">{item.name}</span>
                  </Link>
                )
              })}
              {authNavigation.map((item) => {
                const Icon = item.icon
                if (item.action) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        item.action?.()
                        setIsMenuOpen(false)
                      }}
                      className="nav-link flex items-center space-x-2 w-full py-3 px-3 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span className="text-base font-medium">{item.name}</span>
                    </button>
                  )
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link flex items-center space-x-2 w-full py-3 px-3 rounded-lg ${
                      isActive(item.href) ? 'nav-link-active' : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="text-base">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}