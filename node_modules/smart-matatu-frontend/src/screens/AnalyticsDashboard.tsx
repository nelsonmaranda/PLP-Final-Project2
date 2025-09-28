import React, { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import apiService from '../services/api'

interface AnalyticsData {
  userMetrics: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    userRoles: { role: string; count: number }[]
  }
  routeMetrics: {
    totalRoutes: number
    activeRoutes: number
    topOperators: { _id: string; count: number }[]
  }
  reportMetrics: {
    totalReports: number
    recentReports: number
    reportsByType: { type: string; count: number }[]
    reportsBySeverity: { severity: string; count: number }[]
    reportsByStatus: { status: string; count: number }[]
  }
  ratingMetrics: {
    totalRatings: number
    averageRating: number
    topRatedRoutes: {
      _id: string
      routeName: string
      routeNumber: string
      operator: string
      avgRating: number
      totalRatings: number
    }[]
  }
  subscriptionMetrics: {
    totalSubscriptions: number
    activeSubscriptions: number
    subscriptionsByPlan: { plan: string; count: number }[]
  }
  paymentMetrics: {
    totalPayments: number
    successfulPayments: number
    successRate: string
    totalRevenue: number
    paymentsByMethod: { method: string; count: number; total: number }[]
  }
  trafficMetrics: {
    totalRoutesWithTraffic: number
    averageCongestion: number
    trafficData: {
      routeName: string
      routeNumber: string
      operator: string
      congestionIndex: number
      trafficFactor: number
    }[]
  }
  geographicAnalytics: {
    reportHotspots: { _id: { lat: number; lng: number }; count: number }[]
  }
  timeAnalytics: {
    reportsByHour: { hour: number; count: number }[]
  }
  performanceMetrics: {
    metricType: string
    value: number
    endpoint?: string
    timestamp: string
    metadata?: any
  }[]
}

const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { state } = useApp()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getAnalyticsDashboard(period)
      setAnalyticsData(response.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const trackPageView = async () => {
    if (state.user) {
      try {
        await apiService.trackEvent('page_view', {
          page: 'analytics_dashboard',
          timestamp: new Date().toISOString()
        }, undefined, state.user._id)
      } catch (err) {
        console.error('Failed to track page view:', err)
      }
    }
  }

  useEffect(() => {
    trackPageView()
  }, [])

  const formatMetricValue = (metricType: string, value: number) => {
    switch (metricType) {
      case 'api_response_time':
        return `${value.toFixed(2)}ms`
      case 'page_load_time':
        return `${value.toFixed(2)}s`
      case 'error_rate':
        return `${(value * 100).toFixed(2)}%`
      case 'user_engagement':
        return value.toFixed(1)
      default:
        return value.toString()
    }
  }

  const getMetricColor = (metricType: string, value: number) => {
    switch (metricType) {
      case 'api_response_time':
        return value < 200 ? 'text-green-600' : value < 500 ? 'text-yellow-600' : 'text-red-600'
      case 'page_load_time':
        return value < 2 ? 'text-green-600' : value < 5 ? 'text-yellow-600' : 'text-red-600'
      case 'error_rate':
        return value < 0.01 ? 'text-green-600' : value < 0.05 ? 'text-yellow-600' : 'text-red-600'
      case 'user_engagement':
        return value > 5 ? 'text-green-600' : value > 2 ? 'text-yellow-600' : 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getMetricTypeTranslation = (metricType: string) => {
    switch (metricType) {
      case 'api_response_time':
        return t('analyticsDashboard.metricTypes.apiResponseTime')
      case 'page_load_time':
        return t('analyticsDashboard.metricTypes.pageLoadTime')
      case 'error_rate':
        return t('analyticsDashboard.metricTypes.errorRate')
      case 'user_engagement':
        return t('analyticsDashboard.metricTypes.userEngagement')
      default:
        return metricType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {t('analyticsDashboard.error')}
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={loadAnalytics}
                  className="mt-3 bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200"
                >
                  {t('common.retry')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('analyticsDashboard.title')}
              </h1>
              <p className="mt-2 text-gray-600">
                {t('analyticsDashboard.subtitle')}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="7d">{t('analyticsDashboard.last7Days')}</option>
                <option value="30d">{t('analyticsDashboard.last30Days')}</option>
              </select>
            </div>
          </div>
        </div>

        {analyticsData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {t('analyticsDashboard.userMetrics.totalUsers')}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analyticsData.userMetrics.totalUsers}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {t('analyticsDashboard.reportMetrics.totalReports')}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analyticsData.reportMetrics.totalReports}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {t('analyticsDashboard.ratingMetrics.averageRating')}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analyticsData.ratingMetrics.averageRating.toFixed(1)}/5
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {t('analyticsDashboard.paymentMetrics.totalRevenue')} (KES)
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {analyticsData.paymentMetrics.totalRevenue.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {t('analyticsDashboard.reportMetrics.reportsByType')}
                  </h3>
                  <div className="space-y-3">
                    {analyticsData.reportMetrics.reportsByType.map((report) => (
                      <div key={report.type} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {t(`analyticsDashboard.reportTypes.${report.type}`)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{report.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {t('analyticsDashboard.reportMetrics.reportsBySeverity')}
                  </h3>
                  <div className="space-y-3">
                    {analyticsData.reportMetrics.reportsBySeverity.map((severity) => (
                      <div key={severity.severity} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            severity.severity === 'critical' ? 'bg-red-600' :
                            severity.severity === 'high' ? 'bg-orange-500' :
                            severity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {t(`analyticsDashboard.severityLevels.${severity.severity}`)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{severity.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Rated Routes */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {t('analyticsDashboard.ratingMetrics.topRatedRoutes')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('analyticsDashboard.ratingMetrics.routeName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('analyticsDashboard.ratingMetrics.operator')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('analyticsDashboard.ratingMetrics.avgRating')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('analyticsDashboard.ratingMetrics.totalRatings')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.ratingMetrics.topRatedRoutes.slice(0, 10).map((route) => (
                        <tr key={route._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {route.routeNumber} - {route.routeName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {route.operator}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <span className="text-yellow-400">★</span>
                              <span className="ml-1">{route.avgRating.toFixed(1)}</span>
                            </div>
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

            {/* User & Subscription Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {t('analyticsDashboard.userMetrics.userRoles')}
                  </h3>
                  <div className="space-y-3">
                    {analyticsData.userMetrics.userRoles.map((role) => (
                      <div key={role.role} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {t(`analyticsDashboard.userRoles.${role.role}`)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{role.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {t('analyticsDashboard.subscriptionMetrics.subscriptionsByPlan')}
                  </h3>
                  <div className="space-y-3">
                    {analyticsData.subscriptionMetrics.subscriptionsByPlan.map((plan) => (
                      <div key={plan.plan} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {t(`analyticsDashboard.subscriptionPlans.${plan.plan}`)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{plan.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {t('analyticsDashboard.performanceMetrics')}
                </h3>
                
                {analyticsData.performanceMetrics.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analyticsDashboard.metric')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analyticsDashboard.value')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analyticsDashboard.endpoint')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analyticsDashboard.timestamp')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analyticsData.performanceMetrics.slice(0, 10).map((metric, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {getMetricTypeTranslation(metric.metricType)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getMetricColor(metric.metricType, metric.value)}`}>
                              {formatMetricValue(metric.metricType, metric.value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metric.endpoint || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(metric.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {t('analyticsDashboard.noMetrics')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('analyticsDashboard.noMetricsDesc')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AnalyticsDashboard