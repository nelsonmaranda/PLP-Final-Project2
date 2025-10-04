import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Star,
  MapPin,
  Clock,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Route,
  Users,
  Calendar
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import apiService from '../services/api'

interface UserAnalytics {
  userId: string
  period: string
  personalStats: {
    totalReports: number
    totalRatings: number
    favoriteRoutes: number
    avgRatingGiven: number
    reportsThisMonth: number
    ratingsThisMonth: number
  }
  routeInsights: {
    mostReportedRoute: {
      routeName: string
      routeNumber: string
      reportCount: number
      lastReport: string
    }
    bestRatedRoute: {
      routeName: string
      routeNumber: string
      avgRating: number
      totalRatings: number
    }
    recentActivity: {
      routeName: string
      routeNumber: string
      action: string
      date: string
    }[]
  }
  safetyInsights: {
    safetyReports: number
    delayReports: number
    breakdownReports: number
    avgResponseTime: string
    resolvedReports: number
  }
  recommendations: {
    suggestedRoutes: {
      routeName: string
      routeNumber: string
      reason: string
      avgRating: number
    }[]
    safetyTips: string[]
    peakHours: {
      hour: string
      recommendation: string
    }[]
  }
}

const UserAnalytics: React.FC = () => {
  const { state } = useApp()
  const { t } = useTranslation()
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7d')
  const [planType, setPlanType] = useState<'free' | 'premium' | 'sacco' | 'enterprise'>('free')

  const handlePeriodChange = (next: string) => {
    if (planType === 'free' && next !== '7d') {
      setPeriod('7d')
      return
    }
    setPeriod(next)
  }

  const loadUserAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Ensure plan is loaded
      if (state.user?._id) {
        try {
          const sub = await apiService.getUserSubscription(state.user._id)
          const pt = (sub.data?.planType as any) || 'free'
          setPlanType(pt)
          // If free and currently not 7d, clamp
          if (pt === 'free' && period !== '7d') setPeriod('7d')
        } catch {
          setPlanType('free')
        }
      }
      
      console.log(`Loading user analytics for: ${state.user?._id}, period: ${period}`)
      
      // For now, we'll generate user-focused analytics from existing data
      const mockUserAnalytics: UserAnalytics = {
        userId: state.user?._id || '',
        period,
        personalStats: {
          totalReports: 12,
          totalRatings: 8,
          favoriteRoutes: 3,
          avgRatingGiven: 4.2,
          reportsThisMonth: 5,
          ratingsThisMonth: 3
        },
        routeInsights: {
          mostReportedRoute: {
            routeName: 'City Center to Airport',
            routeNumber: '34',
            reportCount: 4,
            lastReport: '2 days ago'
          },
          bestRatedRoute: {
            routeName: 'Downtown Express',
            routeNumber: '15',
            avgRating: 4.8,
            totalRatings: 156
          },
          recentActivity: [
            { routeName: 'Route 34', routeNumber: '34', action: 'Reported delay', date: '2 days ago' },
            { routeName: 'Route 15', routeNumber: '15', action: 'Rated 5 stars', date: '3 days ago' },
            { routeName: 'Route 22', routeNumber: '22', action: 'Reported safety issue', date: '1 week ago' }
          ]
        },
        safetyInsights: {
          safetyReports: 3,
          delayReports: 6,
          breakdownReports: 2,
          avgResponseTime: '2.5 hours',
          resolvedReports: 8
        },
        recommendations: {
          suggestedRoutes: [
            { routeName: 'Route 15', routeNumber: '15', reason: 'Highly rated by users', avgRating: 4.8 },
            { routeName: 'Route 28', routeNumber: '28', reason: 'Reliable and punctual', avgRating: 4.5 }
          ],
          safetyTips: [
            'Avoid peak hours (7-9 AM, 5-7 PM) for better safety',
            'Route 15 has the best safety record in your area',
            'Report any safety concerns immediately for faster response'
          ],
          peakHours: [
            { hour: '7:00-9:00 AM', recommendation: 'High traffic, allow extra time' },
            { hour: '5:00-7:00 PM', recommendation: 'Peak hours, consider alternative routes' }
          ]
        }
      }
      
      setAnalytics(mockUserAnalytics)
      console.log('User analytics data set:', mockUserAnalytics)
      
    } catch (err) {
      setError('Failed to load user analytics')
      console.error('User analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (state.user?._id) {
      loadUserAnalytics()
    }
  }, [period, state.user?._id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('userAnalytics.loading')}</p>
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
            onClick={loadUserAnalytics}
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
              <h1 className="text-3xl font-bold text-gray-900">{t('userAnalytics.title')}</h1>
              <p className="text-gray-600 mt-1">{t('userAnalytics.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="7d">{t('userAnalytics.last7Days')}</option>
                <option value="30d" disabled={planType === 'free'}>{t('userAnalytics.last30Days')}{planType === 'free' ? ' (Pro)' : ''}</option>
                <option value="90d" disabled={planType === 'free'}>{t('userAnalytics.last90Days')}{planType === 'free' ? ' (Pro)' : ''}</option>
              </select>
              <button
                onClick={loadUserAnalytics}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('userAnalytics.refresh')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analytics && (
          <div className="space-y-6">
            {/* Personal Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('userAnalytics.personalStats.totalReports')}</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.personalStats.totalReports}</p>
                    <p className="text-xs text-gray-500">{analytics.personalStats.reportsThisMonth} {t('userAnalytics.personalStats.reportsThisMonth')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('userAnalytics.personalStats.totalRatings')}</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.personalStats.totalRatings}</p>
                    <p className="text-xs text-gray-500">{t('userAnalytics.personalStats.avgRating')}: {analytics.personalStats.avgRatingGiven}/5</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Route className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('userAnalytics.personalStats.favoriteRoutes')}</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.personalStats.favoriteRoutes}</p>
                    <p className="text-xs text-gray-500">{t('userAnalytics.personalStats.savedRoutes')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('userAnalytics.personalStats.activityScore')}</p>
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                    <p className="text-xs text-gray-500">{t('userAnalytics.personalStats.veryActiveUser')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                  {t('userAnalytics.routeInsights.title')}
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{t('userAnalytics.routeInsights.mostReportedRoute')}</h4>
                    <p className="text-sm text-gray-600">
                      {analytics.routeInsights.mostReportedRoute.routeNumber} - {analytics.routeInsights.mostReportedRoute.routeName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics.routeInsights.mostReportedRoute.reportCount} {t('userAnalytics.routeInsights.reports')}, {t('userAnalytics.routeInsights.last')}: {analytics.routeInsights.mostReportedRoute.lastReport}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{t('userAnalytics.routeInsights.bestRatedRoute')}</h4>
                    <p className="text-sm text-gray-600">
                      {analytics.routeInsights.bestRatedRoute.routeNumber} - {analytics.routeInsights.bestRatedRoute.routeName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {analytics.routeInsights.bestRatedRoute.avgRating}/5 {t('userAnalytics.routeInsights.stars')} ({analytics.routeInsights.bestRatedRoute.totalRatings} {t('userAnalytics.routeInsights.ratings')})
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-green-500" />
                  {t('userAnalytics.recentActivity.title')}
                </h3>
                <div className="space-y-3">
                  {analytics.routeInsights.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.routeNumber} - {activity.routeName}
                        </p>
                        <p className="text-xs text-gray-500">{
                          activity.action === 'Reported delay' ? t('userAnalytics.recentActivity.reportedDelay') :
                          activity.action === 'Rated 5 stars' ? t('userAnalytics.recentActivity.ratedStars') :
                          activity.action === 'Reported safety issue' ? t('userAnalytics.recentActivity.reportedSafetyIssue') : activity.action
                        }</p>
                      </div>
                      <span className="text-xs text-gray-400">{activity.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Safety Insights */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                {t('userAnalytics.safetyInsights.title')}
              </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{analytics.safetyInsights.safetyReports}</p>
                    <p className="text-sm text-gray-500">{t('userAnalytics.safetyInsights.safetyReports')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{analytics.safetyInsights.delayReports}</p>
                    <p className="text-sm text-gray-500">{t('userAnalytics.safetyInsights.delayReports')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{analytics.safetyInsights.resolvedReports}</p>
                    <p className="text-sm text-gray-500">{t('userAnalytics.safetyInsights.resolvedReports')}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{t('userAnalytics.safetyInsights.averageResponseTime')}:</strong> {analytics.safetyInsights.avgResponseTime}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  {t('userAnalytics.recommendations.title')}
                </h3>
                <div className="space-y-3">
                  {analytics.recommendations.suggestedRoutes.map((route, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {route.routeNumber} - {route.routeName}
                          </p>
                          <p className="text-sm text-gray-600">{
                            route.reason === 'Highly rated by users' ? t('userAnalytics.recommendations.highlyRatedByUsers') :
                            route.reason === 'Reliable and punctual' ? t('userAnalytics.recommendations.reliableAndPunctual') : route.reason
                          }</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">{route.avgRating}/5</p>
                          <p className="text-xs text-gray-500">{t('userAnalytics.routeInsights.stars')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  {t('userAnalytics.recommendations.safetyTips')}
                </h3>
                <div className="space-y-3">
                  {[t('userAnalytics.recommendations.avoidPeakHours'), t('userAnalytics.recommendations.bestSafetyRecord'), t('userAnalytics.recommendations.reportImmediately')].map((tip, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                      <p className="text-sm text-gray-600">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                {t('userAnalytics.peakHours.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.recommendations.peakHours.map((peak, index) => (
                  <div key={index} className="p-4 bg-purple-50 rounded-lg">
                    <p className="font-medium text-gray-900">{peak.hour}</p>
                    <p className="text-sm text-gray-600">{
                      peak.recommendation === 'High traffic, allow extra time' ? t('userAnalytics.peakHours.highTraffic') :
                      peak.recommendation === 'Peak hours, consider alternative routes' ? t('userAnalytics.peakHours.peakHours') : peak.recommendation
                    }</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserAnalytics
