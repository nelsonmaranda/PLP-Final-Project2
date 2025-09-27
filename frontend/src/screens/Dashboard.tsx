import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  MapPin, 
  Clock, 
  TrendingUp, 
  Shield, 
  Cloud, 
  AlertTriangle,
  Star,
  BarChart3,
  Navigation,
  Zap,
  Eye,
  Calendar,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import apiService from '../services/api'
import { Route, Report, WeatherData, FarePrediction, SafetyScore } from '../types'
import { useTranslation } from '../hooks/useTranslation'

interface DashboardStats {
  totalRoutes: number
  activeReports: number
  averageFare: number
  safetyRating: number
  weatherCondition: string
  temperature: number
  humidity: number
  windSpeed: number
}

interface RouteInsight {
  routeId: string
  routeName: string
  farePrediction: FarePrediction
  safetyScore: SafetyScore
  crowdDensity: {
    level: 'low' | 'medium' | 'high'
    percentage: number
    predictedPeak: string
    recommendedTime: string
    lastUpdated: string
  }
  travelTime: number
  recommendedTime: string
  alternativeRoutes: string[]
  weatherImpact: string
  lastUpdated: string
}

export default function Dashboard() {
  const { state } = useApp()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [routeInsights, setRouteInsights] = useState<RouteInsight[]>([])
  const [favoriteRoutes, setFavoriteRoutes] = useState<Route[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  // Controls for insights limits
  const [insightsLimit] = useState<number>(10)
  const insightsDays = 7

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!state.user) return

    setIsLoading(true)
    setError(null)

    try {
      // Load all dashboard data in parallel
      const [
        statsResponse,
        weatherResponse,
        insightsResponse,
        favoritesResponse,
        reportsResponse
      ] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getWeatherData(),
        apiService.getRouteInsights({ limit: insightsLimit, days: insightsDays }),
        apiService.getFavoriteRoutes(state.user._id),
        apiService.getUserReports(state.user._id)
      ])

      // Set dashboard stats
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }

      // Set weather data
      if (weatherResponse.success && weatherResponse.data) {
        setWeather(weatherResponse.data)
      }

      // Set route insights
      if (insightsResponse.success && insightsResponse.data) {
        setRouteInsights(insightsResponse.data.insights)
      }

      // Set favorite routes
      if (favoritesResponse.success && favoritesResponse.data) {
        console.log('Favorite routes loaded:', favoritesResponse.data.routes)
        setFavoriteRoutes(favoritesResponse.data.routes)
      } else {
        console.log('Failed to load favorite routes:', favoritesResponse)
      }

      // Set recent reports
      if (reportsResponse.success && reportsResponse.data) {
        console.log('Recent reports loaded:', reportsResponse.data.reports)
        setRecentReports(reportsResponse.data.reports.slice(0, 5))
      } else {
        console.log('Failed to load recent reports:', reportsResponse)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [state.user, insightsLimit])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Get weather icon
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes('rain')) return <Droplets className="w-6 h-6 text-blue-500" />
    if (conditionLower.includes('cloud')) return <Cloud className="w-6 h-6 text-gray-500" />
    if (conditionLower.includes('sun')) return <Zap className="w-6 h-6 text-yellow-500" />
    return <Cloud className="w-6 h-6 text-gray-500" />
  }

  // Get crowd level color
  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCrowdLabel = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return t('dashboard.crowdLow')
      case 'medium':
        return t('dashboard.crowdMedium')
      case 'high':
        return t('dashboard.crowdHigh')
      default:
        return `${level} ${t('dashboard.crowdSuffix')}`
    }
  }

  // Get safety score color
  const getSafetyScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loadingYourDashboard')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.errorTitle')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="btn btn-primary"
          >
            {t('dashboard.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('dashboard.welcome')}, {state.user?.displayName}!
              </h1>
              <p className="text-gray-600 mt-1">
                {t('dashboard.headerSubtitle')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-KE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleTimeString('en-KE', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Weather & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Weather Card */}
          {weather && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('dashboard.currentWeather')}</h3>
                {getWeatherIcon(weather.condition)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-2xl font-bold">{weather.temperature}°C</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4" />
                  <span>{weather.humidity}% {t('dashboard.humidityLabel')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wind className="w-4 h-4" />
                  <span>{weather.windSpeed} {t('dashboard.windSpeedLabel')}</span>
                </div>
                <p className="text-sm opacity-90">{weather.condition}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {stats && (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.activeRoutesTitle')}</h3>
                  <MapPin className="w-6 h-6 text-primary-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.totalRoutes}
                </div>
                <p className="text-sm text-gray-600">{t('dashboard.routesMonitored')}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.avgFareTitle')}</h3>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  KES {stats.averageFare}
                </div>
                <p className="text-sm text-gray-600">{t('dashboard.currentAverage')}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.safetyRating')}</h3>
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.safetyRating.toFixed(1)}/5
                </div>
                <p className="text-sm text-gray-600">{t('dashboard.overallSafety')}</p>
              </div>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Route Insights - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">{t('dashboard.smartRouteInsights')}</h2>
                  <Link to="/map" className="btn btn-ghost btn-sm">
                    {t('dashboard.viewAllRoutesBtn')}
                  </Link>
                </div>
                <p className="text-gray-600 mt-1">
                  {t('dashboard.aiRecommendations')}
                </p>
              </div>
              <div className="p-6">
                <div className="mb-4"></div>
                {routeInsights.length === 0 ? (
                  <div className="text-center py-8">
                    <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">{t('dashboard.noInsights')}</p>
                    <Link to="/map" className="btn btn-primary">
                      {t('dashboard.exploreRoutes')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {routeInsights.slice(0, 5).map((insight, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {insight.routeName}
                            </h3>
                            <p className="text-sm text-gray-600">{t('dashboard.routeIdLabel')}: {insight.routeId}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getCrowdLevelColor(insight.crowdDensity.level)}`}>
                              {getCrowdLabel(insight.crowdDensity.level)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                KES {insight.farePrediction.predictedFare}
                              </div>
                              <div className="text-xs text-gray-500">{t('dashboard.predictedFareLabel')}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Shield className={`w-4 h-4 ${getSafetyScoreColor(insight.safetyScore.overallScore)}`} />
                            <div>
                              <div className={`font-medium ${getSafetyScoreColor(insight.safetyScore.overallScore)}`}>
                                {insight.safetyScore.overallScore.toFixed(1)}/5
                              </div>
                              <div className="text-xs text-gray-500">{t('dashboard.safetyScoreLabel')}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {insight.travelTime} min
                              </div>
                              <div className="text-xs text-gray-500">{t('dashboard.travelTimeLabel')}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {insight.recommendedTime}
                              </div>
                              <div className="text-xs text-gray-500">{t('dashboard.bestTimeLabel')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Favorite Routes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.favoriteRoutes')}</h3>
                  <button
                    onClick={loadDashboardData}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{t('dashboard.refresh')}</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">{t('dashboard.loading')}</p>
                  </div>
                ) : favoriteRoutes.length === 0 ? (
                  <div className="text-center py-4">
                    <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">{t('dashboard.noFavorites')}</p>
                    <Link to="/map" className="btn btn-ghost btn-sm">
                      {t('dashboard.viewAllRoutesBtn')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favoriteRoutes.slice(0, 3).map((route) => (
                      <div key={route._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {t('dashboard.routeLabel')} {route.routeNumber}
                          </div>
                          <div className="text-sm text-gray-600">{route.name}</div>
                        </div>
                        <Link
                          to={`/map?route=${route._id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          {t('dashboard.viewLabel')}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentReports')}</h3>
                  <button
                    onClick={loadDashboardData}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{t('dashboard.refresh')}</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">{t('dashboard.loading')}</p>
                  </div>
                ) : recentReports.length === 0 ? (
                  <div className="text-center py-4">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">{t('dashboard.noReports')}</p>
                    <Link to="/report" className="btn btn-ghost btn-sm">
                      {t('dashboard.submitReportBtn')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentReports.slice(0, 3).map((report) => (
                      <div key={report._id} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {report.reportType}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions')}</h3>
              </div>
              <div className="p-6 space-y-3">
                <Link to="/map" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <span className="text-gray-900">{t('dashboard.quickViewMap')}</span>
                </Link>
                <Link to="/report" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  <span className="text-gray-900">{t('dashboard.quickSubmitReport')}</span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-900">{t('dashboard.quickViewProfile')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
