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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [routeInsights, setRouteInsights] = useState<RouteInsight[]>([])
  const [favoriteRoutes, setFavoriteRoutes] = useState<Route[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  // Controls for insights limits
  const [insightsLimit, setInsightsLimit] = useState<number>(10)
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
        setFavoriteRoutes(favoritesResponse.data.routes)
      }

      // Set recent reports
      if (reportsResponse.success && reportsResponse.data) {
        setRecentReports(reportsResponse.data.reports.slice(0, 5))
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
          <p className="text-gray-600">Loading your smart dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="btn btn-primary"
          >
            Try Again
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
                Welcome back, {state.user?.displayName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's your personalized matatu insights for today
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
                <h3 className="text-lg font-semibold">Current Weather</h3>
                {getWeatherIcon(weather.condition)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-2xl font-bold">{weather.temperature}°C</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4" />
                  <span>{weather.humidity}% humidity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wind className="w-4 h-4" />
                  <span>{weather.windSpeed} km/h</span>
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
                  <h3 className="text-lg font-semibold text-gray-900">Active Routes</h3>
                  <MapPin className="w-6 h-6 text-primary-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.totalRoutes}
                </div>
                <p className="text-sm text-gray-600">Routes monitored</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Avg Fare</h3>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  KES {stats.averageFare}
                </div>
                <p className="text-sm text-gray-600">Current average</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Safety Rating</h3>
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.safetyRating.toFixed(1)}/5
                </div>
                <p className="text-sm text-gray-600">Overall safety</p>
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
                  <h2 className="text-xl font-bold text-gray-900">Smart Route Insights</h2>
                  <Link to="/map" className="btn btn-ghost btn-sm">
                    View All Routes
                  </Link>
                </div>
                <p className="text-gray-600 mt-1">
                  AI-powered recommendations for your daily commute
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-end space-x-3 mb-4">
                  <label className="text-sm text-gray-600">Routes</label>
                  <select
                    value={insightsLimit}
                    onChange={(e) => setInsightsLimit(Number(e.target.value))}
                    className="form-select"
                  >
                    {[5,10,15,20,30,50].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                {routeInsights.length === 0 ? (
                  <div className="text-center py-8">
                    <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No route insights available</p>
                    <Link to="/map" className="btn btn-primary">
                      Explore Routes
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
                            <p className="text-sm text-gray-600">Route ID: {insight.routeId}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getCrowdLevelColor(insight.crowdDensity.level)}`}>
                              {insight.crowdDensity.level} crowd
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
                              <div className="text-xs text-gray-500">Predicted fare</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Shield className={`w-4 h-4 ${getSafetyScoreColor(insight.safetyScore.overallScore)}`} />
                            <div>
                              <div className={`font-medium ${getSafetyScoreColor(insight.safetyScore.overallScore)}`}>
                                {insight.safetyScore.overallScore.toFixed(1)}/5
                              </div>
                              <div className="text-xs text-gray-500">Safety score</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {insight.travelTime} min
                              </div>
                              <div className="text-xs text-gray-500">Travel time</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {insight.recommendedTime}
                              </div>
                              <div className="text-xs text-gray-500">Best time</div>
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
                <h3 className="text-lg font-semibold text-gray-900">Your Favorites</h3>
              </div>
              <div className="p-6">
                {favoriteRoutes.length === 0 ? (
                  <div className="text-center py-4">
                    <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No favorite routes yet</p>
                    <Link to="/map" className="btn btn-ghost btn-sm">
                      Add Favorites
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favoriteRoutes.slice(0, 3).map((route) => (
                      <div key={route._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            Route {route.routeNumber}
                          </div>
                          <div className="text-sm text-gray-600">{route.name}</div>
                        </div>
                        <Link
                          to={`/map?route=${route._id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View
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
                <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
              </div>
              <div className="p-6">
                {recentReports.length === 0 ? (
                  <div className="text-center py-4">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No reports submitted</p>
                    <Link to="/report" className="btn btn-ghost btn-sm">
                      Submit Report
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
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <Link to="/map" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <span className="text-gray-900">View Map</span>
                </Link>
                <Link to="/report" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  <span className="text-gray-900">Submit Report</span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-900">View Profile</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
