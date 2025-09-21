import { useState, useEffect, useCallback } from 'react'
import { 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  RefreshCw,
  Filter,
  Calendar,
  Zap,
  DollarSign,
  Star
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import apiService from '../services/api'
import { 
  RouteEfficiencyScore, 
  TravelTimePrediction, 
  AlternativeRoute, 
  TrendAnalysis, 
  DemandForecast, 
  UserRecommendation 
} from '../types'

export default function AnalyticsDashboard() {
  const { state } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'efficiency' | 'predictions' | 'trends' | 'recommendations'>('efficiency')
  
  // Data states
  const [efficiencyScores, setEfficiencyScores] = useState<RouteEfficiencyScore[]>([])
  const [travelPredictions, setTravelPredictions] = useState<TravelTimePrediction[]>([])
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([])
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis[]>([])
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([])
  const [userRecommendations, setUserRecommendations] = useState<UserRecommendation | null>(null)

  // Filter states
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [timeSlot, setTimeSlot] = useState<string>('08:00')
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  const loadAnalyticsData = useCallback(async () => {
    if (!state.user?._id) {
      setError('User not authenticated.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Load all analytics data in parallel
      const [
        recommendationsResponse,
        // Add more parallel calls as needed
      ] = await Promise.all([
        apiService.getUserRecommendations(state.user._id),
        // Add more API calls here
      ])

      // Set user recommendations
      if (recommendationsResponse.success && recommendationsResponse.data) {
        setUserRecommendations(recommendationsResponse.data)
      }

      // Mock data for demonstration (replace with real API calls)
      setEfficiencyScores([
        {
          routeId: '1',
          routeName: 'Route 46 - CBD to Westlands',
          efficiencyScore: 85,
          factors: {
            reliability: 80,
            speed: 75,
            safety: 90,
            comfort: 85,
            cost: 70,
            frequency: 95
          },
          recommendations: ['Increase frequency during peak hours', 'Improve vehicle comfort'],
          lastUpdated: new Date().toISOString()
        },
        {
          routeId: '2',
          routeName: 'Route 34 - Eastleigh to CBD',
          efficiencyScore: 72,
          factors: {
            reliability: 65,
            speed: 80,
            safety: 75,
            comfort: 70,
            cost: 85,
            frequency: 60
          },
          recommendations: ['Improve on-time performance', 'Address safety concerns'],
          lastUpdated: new Date().toISOString()
        }
      ])

      setTravelPredictions([
        {
          routeId: '1',
          fromStop: 'Kencom',
          toStop: 'Westlands',
          predictedTime: 25,
          confidence: 85,
          factors: {
            timeOfDay: 1.2,
            dayOfWeek: 1.0,
            weather: 1.1,
            traffic: 1.3,
            historical: 0.9
          },
          alternativeTimes: {
            optimistic: 20,
            realistic: 25,
            pessimistic: 32
          },
          lastUpdated: new Date().toISOString()
        }
      ])

      setAlternativeRoutes([
        {
          routeId: '2',
          routeName: 'Route 34 - Alternative Route',
          totalTime: 30,
          totalCost: 45,
          efficiency: 78,
          reasons: ['Affordable fare', 'Multiple stops available'],
          stops: ['Kencom', 'Museum Hill', 'Eastleigh', 'Westlands']
        }
      ])

      setTrendAnalysis([
        {
          routeId: '1',
          period: 'weekly',
          trends: {
            ridership: {
              current: 150,
              previous: 120,
              change: 25,
              trend: 'increasing'
            },
            efficiency: {
              current: 85,
              previous: 80,
              change: 6.25,
              trend: 'improving'
            },
            safety: {
              current: 2,
              previous: 5,
              change: -60,
              trend: 'safer'
            },
            cost: {
              current: 50,
              previous: 50,
              change: 0,
              trend: 'stable'
            }
          },
          insights: ['Ridership is increasing significantly', 'Safety incidents have decreased'],
          lastUpdated: new Date().toISOString()
        }
      ])

      setDemandForecasts([
        {
          routeId: '1',
          timeSlot: '08:00',
          predictedDemand: 85,
          confidence: 80,
          factors: {
            historical: 75,
            weather: 1.0,
            events: 1.1,
            seasonality: 1.0
          },
          recommendations: ['Consider increasing frequency during this time'],
          lastUpdated: new Date().toISOString()
        }
      ])

    } catch (error) {
      console.error('Error loading analytics data:', error)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [state.user?._id])

  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable' | 'improving' | 'declining' | 'safer' | 'riskier') => {
    switch (trend) {
      case 'increasing':
      case 'improving':
      case 'safer':
        return <ArrowUp className="w-4 h-4 text-green-500" />
      case 'decreasing':
      case 'declining':
      case 'riskier':
        return <ArrowDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable' | 'improving' | 'declining' | 'safer' | 'riskier') => {
    switch (trend) {
      case 'increasing':
      case 'improving':
      case 'safer':
        return 'text-green-600'
      case 'decreasing':
      case 'declining':
      case 'riskier':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEfficiencyBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
          <p className="text-gray-600 mt-4">Loading Advanced Analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadAnalyticsData} 
            className="btn btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and predictions for route optimization</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'efficiency', name: 'Route Efficiency', icon: Target },
                { id: 'predictions', name: 'Travel Predictions', icon: Clock },
                { id: 'trends', name: 'Trend Analysis', icon: TrendingUp },
                { id: 'recommendations', name: 'Recommendations', icon: Star }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Route Efficiency Tab */}
          {activeTab === 'efficiency' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Route Efficiency Scores</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Routes</option>
                    <option value="1">Route 46 - CBD to Westlands</option>
                    <option value="2">Route 34 - Eastleigh to CBD</option>
                  </select>
                  <button className="btn btn-outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {efficiencyScores.map((score) => (
                  <div key={score.routeId} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{score.routeName}</h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEfficiencyBgColor(score.efficiencyScore)} ${getEfficiencyColor(score.efficiencyScore)}`}>
                        {score.efficiencyScore}/100
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Efficiency Factors */}
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(score.factors).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 capitalize">{key}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary-500 h-2 rounded-full" 
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recommendations */}
                      {score.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                          <ul className="space-y-1">
                            {score.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Travel Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Travel Time Predictions</h2>
                <div className="flex items-center space-x-4">
                  <input
                    type="time"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="form-input"
                  />
                  <button className="btn btn-primary">
                    <Zap className="w-4 h-4 mr-2" />
                    Predict
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {travelPredictions.map((prediction, index) => (
                  <div key={index} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {prediction.fromStop} → {prediction.toStop}
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">{prediction.predictedTime} min</div>
                        <div className="text-sm text-gray-500">{prediction.confidence}% confidence</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Alternative Times */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-semibold text-green-600">{prediction.alternativeTimes.optimistic} min</div>
                          <div className="text-xs text-green-600">Optimistic</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-semibold text-blue-600">{prediction.alternativeTimes.realistic} min</div>
                          <div className="text-xs text-blue-600">Realistic</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-lg font-semibold text-red-600">{prediction.alternativeTimes.pessimistic} min</div>
                          <div className="text-xs text-red-600">Pessimistic</div>
                        </div>
                      </div>

                      {/* Factors */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Factors</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(prediction.factors).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium">{value.toFixed(2)}x</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alternative Routes */}
              {alternativeRoutes.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Alternative Routes</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {alternativeRoutes.map((route, index) => (
                      <div key={index} className="card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{route.routeName}</h4>
                          <div className="text-sm text-gray-500">{route.efficiency}/100</div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{route.totalTime} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Ksh {route.totalCost}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">Reasons: {route.reasons.join(', ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trend Analysis Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Trend Analysis</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <button className="btn btn-outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Update
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trendAnalysis.map((trend, index) => (
                  <div key={index} className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Trends ({trend.period})</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(trend.trends).map(([key, data]) => (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 capitalize">{key}</span>
                            <div className="flex items-center space-x-2">
                              {getTrendIcon(data.trend)}
                              <span className={`text-sm font-medium ${getTrendColor(data.trend)}`}>
                                {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Current: {data.current}</span>
                            <span>Previous: {data.previous}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {trend.insights.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Insights</h4>
                        <ul className="space-y-1">
                          {trend.insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                              <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Personalized Recommendations</h2>
                <button className="btn btn-primary">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>

              {userRecommendations && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Preferences */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h3>
                    <div className="space-y-3">
                      {Object.entries(userRecommendations.preferences).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{key}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-500 h-2 rounded-full" 
                                style={{ width: `${value * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{Math.round(value * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Routes</h3>
                    <div className="space-y-3">
                      {userRecommendations.recommendations.map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{rec.routeName}</h4>
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-900">{rec.score}/100</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              rec.type === 'efficiency' ? 'bg-blue-100 text-blue-800' :
                              rec.type === 'safety' ? 'bg-green-100 text-green-800' :
                              rec.type === 'cost' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {rec.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Demand Forecasts */}
              {demandForecasts.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Demand Forecasts</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {demandForecasts.map((forecast, index) => (
                      <div key={index} className="card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Time Slot: {forecast.timeSlot}</h4>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-600">{forecast.predictedDemand}%</div>
                            <div className="text-sm text-gray-500">{forecast.confidence}% confidence</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full" 
                            style={{ width: `${forecast.predictedDemand}%` }}
                          ></div>
                        </div>
                        {forecast.recommendations.length > 0 && (
                          <div className="text-sm text-gray-600">
                            {forecast.recommendations[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
