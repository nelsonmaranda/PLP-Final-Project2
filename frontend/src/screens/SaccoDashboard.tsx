import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Star,
  MapPin,
  DollarSign,
  Activity,
  RefreshCw,
  AlertTriangle,
  Clock,
  Award,
  Eye
} from 'lucide-react'
import apiService from '../services/api'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../hooks/useTranslation'

interface SaccoAnalytics {
  saccoName: string
  period: string
  routeMetrics: {
    totalRoutes: number
    activeRoutes: number
    routePerformance: {
      _id: string
      routeName: string
      routeNumber: string
      avgRating: number
      totalRatings: number
      avgReliability: number
      avgSafety: number
      avgPunctuality: number
      avgComfort: number
    }[]
  }
  reportMetrics: {
    totalReports: number
    reportsByType: { type: string; count: number }[]
    reportsBySeverity: { severity: string; count: number }[]
    avgReportsPerDay: string
  }
  performanceTrends: {
    _id: { day: string; type: string }
    count: number
  }[]
  geographicInsights: {
    hotspots: {
      _id: { lat: number; lng: number }
      count: number
      types: string[]
    }[]
    totalLocations: number
  }
  timeAnalytics: {
    reportsByHour: { hour: number; count: number }[]
    peakHours: { hour: number; count: number }[]
  }
  revenueAnalytics: {
    dailyRevenue: {
      _id: { day: string }
      totalFare: number
      avgFare: number
      reportCount: number
    }[]
    totalRevenue: number
    avgDailyRevenue: string
  }
  competitiveAnalysis: {
    saccoRanking: number
    totalSaccos: number
    marketPosition: {
      _id: string
      totalReports: number
      avgSeverity: number
    }[]
    performanceVsMarket: {
      saccoReports: number
      marketAvg: string
    }
  }
}

const SaccoDashboard: React.FC = () => {
  const { state } = useApp()
  const { t } = useTranslation()
  const [analytics, setAnalytics] = useState<SaccoAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')

  // Get SACCO name from user's organization or use a default
  const saccoName = state.user?.organization || 'Default SACCO'

  const loadSaccoAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Loading SACCO analytics for: ${saccoName}, period: ${period}`)
      const response = await apiService.getSaccoAnalytics(saccoName, period)
      console.log('SACCO analytics response:', response)
      
      if (response.success) {
        setAnalytics(response.data)
        console.log('SACCO analytics data set:', response.data)
      } else {
        setError('Failed to load SACCO analytics')
        console.error('SACCO analytics failed:', response)
      }
    } catch (err) {
      console.error('SACCO analytics error:', err)
      
      // If the main endpoint fails, try to load with sample data
      console.log('Attempting to load with sample data...')
      try {
        const sampleData = {
          saccoName,
          period,
          routeMetrics: {
            totalRoutes: 3,
            activeRoutes: 2,
            routePerformance: [
              { _id: 'sample1', routeName: 'Route 1', routeNumber: '1', avgRating: 4.2, totalRatings: 15, avgReliability: 4.0, avgSafety: 4.5, avgPunctuality: 3.8, avgComfort: 4.1 },
              { _id: 'sample2', routeName: 'Route 2', routeNumber: '2', avgRating: 3.8, totalRatings: 12, avgReliability: 3.5, avgSafety: 4.0, avgPunctuality: 3.9, avgComfort: 3.7 }
            ]
          },
          reportMetrics: {
            totalReports: 5,
            reportsByType: [{ type: 'delay', count: 3 }, { type: 'safety', count: 2 }],
            reportsBySeverity: [{ severity: 'medium', count: 3 }, { severity: 'high', count: 2 }],
            avgReportsPerDay: '0.71'
          },
          performanceTrends: [],
          geographicInsights: {
            hotspots: [],
            totalLocations: 0
          },
          timeAnalytics: {
            reportsByHour: [],
            peakHours: []
          },
          revenueAnalytics: {
            dailyRevenue: [],
            totalRevenue: 0,
            avgDailyRevenue: '0'
          },
          competitiveAnalysis: {
            saccoRanking: 1,
            totalSaccos: 1,
            marketPosition: [],
            performanceVsMarket: {
              saccoReports: 5,
              marketAvg: '5.00'
            }
          }
        }
        
        setAnalytics(sampleData)
        setError('Using sample data - real data unavailable')
        console.log('Loaded sample data successfully')
      } catch (sampleError) {
        setError('Failed to load SACCO analytics')
        console.error('Sample data also failed:', sampleError)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSaccoAnalytics()
  }, [period, saccoName])


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('saccoDashboard.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadSaccoAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{saccoName} {t('saccoDashboard.dashboardTitle')}</h1>
              <p className="text-gray-600 mt-1">{t('saccoDashboard.subtitle')}</p>
              <p className="text-sm text-blue-600 mt-1">{t('saccoDashboard.dataSource')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="7d">{t('saccoDashboard.last7Days')}</option>
                <option value="30d">{t('saccoDashboard.last30Days')}</option>
                <option value="90d">{t('saccoDashboard.last90Days')}</option>
              </select>
              <button
                onClick={loadSaccoAnalytics}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('saccoDashboard.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: t('saccoDashboard.overview.title'), icon: BarChart3 },
              { id: 'routes', name: t('saccoDashboard.routePerformance.title'), icon: MapPin },
              { id: 'reports', name: t('saccoDashboard.incidentReports.title'), icon: AlertTriangle },
              { id: 'revenue', name: t('saccoDashboard.revenueAnalytics.title'), icon: DollarSign },
              { id: 'competitive', name: t('saccoDashboard.marketPosition.title'), icon: Award },
              { id: 'insights', name: t('saccoDashboard.geographicInsights.title'), icon: Eye }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analytics && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('saccoDashboard.totalRoutes')}</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.routeMetrics.totalRoutes}</p>
                        <p className="text-xs text-gray-500">{analytics.routeMetrics.activeRoutes} {t('saccoDashboard.active')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Star className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('saccoDashboard.avgRating')}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.routeMetrics.routePerformance.length > 0 
                            ? (analytics.routeMetrics.routePerformance.reduce((sum, route) => sum + route.avgRating, 0) / analytics.routeMetrics.routePerformance.length).toFixed(1)
                            : 'N/A'
                          }
                        </p>
                        <p className="text-xs text-gray-500">{t('saccoDashboard.outOf')} 5.0</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('saccoDashboard.totalReports')}</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.reportMetrics.totalReports}</p>
                        <p className="text-xs text-gray-500">{analytics.reportMetrics.avgReportsPerDay} {t('saccoDashboard.perDay')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Award className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('saccoDashboard.marketRank')}</p>
                        <p className="text-2xl font-bold text-gray-900">#{analytics.competitiveAnalysis.saccoRanking}</p>
                        <p className="text-xs text-gray-500">{t('saccoDashboard.ofSaccos')} {analytics.competitiveAnalysis.totalSaccos} {t('saccoDashboard.ofSaccos')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('saccoDashboard.reportsByType')}</h3>
                    <div className="space-y-3">
                      {analytics.reportMetrics.reportsByType.map((report) => (
                        <div key={report.type} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {report.type.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{report.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('saccoDashboard.reportsBySeverity')}</h3>
                    <div className="space-y-3">
                      {analytics.reportMetrics.reportsBySeverity.map((severity) => (
                        <div key={severity.severity} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              severity.severity === 'critical' ? 'bg-red-600' :
                              severity.severity === 'high' ? 'bg-orange-500' :
                              severity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {severity.severity}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{severity.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Route Performance Tab */}
            {activeTab === 'routes' && (
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{t('saccoDashboard.routePerformanceAnalysis')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('saccoDashboard.route')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('saccoDashboard.overallRating')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('saccoDashboard.safety')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('saccoDashboard.punctuality')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('saccoDashboard.comfort')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('saccoDashboard.totalRatings')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.routeMetrics.routePerformance.map((route) => (
                          <tr key={route._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {route.routeNumber} - {route.routeName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <span className="text-yellow-400">★</span>
                                <span className="ml-1">{route.avgRating.toFixed(1)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {route.avgSafety.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {route.avgPunctuality.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {route.avgComfort.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {route.totalRatings}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Analytics Tab */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('saccoDashboard.totalRevenue')}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          KES {analytics.revenueAnalytics.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('saccoDashboard.avgDailyRevenue')}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          KES {analytics.revenueAnalytics.avgDailyRevenue}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Activity className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('saccoDashboard.revenueDays')}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.revenueAnalytics.dailyRevenue.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('saccoDashboard.dailyRevenueTrends')}</h3>
                  <div className="space-y-3">
                    {analytics.revenueAnalytics.dailyRevenue.slice(0, 10).map((day) => (
                      <div key={day._id.day} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{day._id.day}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{day.reportCount} reports</span>
                          <span className="text-sm font-medium text-gray-900">
                            KES {day.totalFare.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Competitive Analysis Tab */}
            {activeTab === 'competitive' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('saccoDashboard.marketPosition.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-3">{t('saccoDashboard.yourPerformance')}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('saccoDashboard.marketRanking')}</span>
                          <span className="text-sm font-medium">#{analytics.competitiveAnalysis.saccoRanking}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('saccoDashboard.totalReports')}:</span>
                          <span className="text-sm font-medium">{analytics.competitiveAnalysis.performanceVsMarket.saccoReports}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('saccoDashboard.marketAverage')}</span>
                          <span className="text-sm font-medium">{analytics.competitiveAnalysis.performanceVsMarket.marketAvg}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-3">{t('saccoDashboard.top5Saccos')}</h4>
                      <div className="space-y-2">
                        {analytics.competitiveAnalysis.marketPosition.map((sacco, index) => (
                          <div key={sacco._id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              #{index + 1} {sacco._id}
                            </span>
                            <span className="text-sm font-medium">{sacco.totalReports} reports</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Geographic Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('saccoDashboard.incidentHotspots')}</h3>
                  <div className="space-y-3">
                    {analytics.geographicInsights.hotspots.map((hotspot, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {hotspot._id.lat.toFixed(2)}, {hotspot._id.lng.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {hotspot.types.join(', ')}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{hotspot.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('saccoDashboard.peakHoursAnalysis')}</h3>
                  <div className="space-y-3">
                    {analytics.timeAnalytics.peakHours.map((hour) => (
                      <div key={hour.hour} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {hour.hour}:00 - {hour.hour + 1}:00
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{hour.count} reports</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SaccoDashboard