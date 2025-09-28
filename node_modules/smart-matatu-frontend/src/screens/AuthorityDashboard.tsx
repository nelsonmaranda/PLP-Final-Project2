import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  Users, 
  CheckCircle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Eye,
  MapPin,
  Clock,
  Target,
  Award,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  Activity
} from 'lucide-react'
import apiService from '../services/api'
import { useTranslation } from '../hooks/useTranslation'

interface AuthorityInsights {
  period: string
  generatedAt: string
  saccoPerformance: {
    totalSaccos: number
    topPerformers: any[]
    poorPerformers: any[]
    averageReportsPerSacco: string
    criticalSaccos: number
  }
  routeSafetyAnalysis: {
    highRiskRoutes: any[]
    totalRoutesAnalyzed: number
    averageRiskScore: string
    criticalRoutes: number
  }
  geographicRiskMap: {
    highRiskZones: any[]
    totalRiskZones: number
    averageRiskLevel: string
  }
  temporalPatterns: {
    peakHours: any[]
    peakDays: any[]
    averageIncidentsPerHour: string
  }
  complianceTrends: {
    dailyTrends: any[]
    averageDailyReports: string
    trendDirection: string
  }
  riskIndicators: {
    topRisks: any[]
    criticalRiskTypes: any[]
    averageRiskLevel: string
  }
  systemHealth: {
    totalReports: number
    averageResponseTime: number
    resolutionRate: number
    dataQuality: number
  }
  resourceRecommendations: {
    prioritySaccos: any[]
    totalResourcesNeeded: number
    highPriorityCount: number
  }
  planningInsights: {
    focusAreas: string[]
    recommendedActions: string[]
  }
}

const AuthorityDashboard: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<AuthorityInsights | null>(null)
  const [dateRange, setDateRange] = useState('30d')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAuthorityInsights()
  }, [dateRange])

  const loadAuthorityInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getAuthorityAnalytics(dateRange)
      if (response.success) {
        setInsights(response.data)
      } else {
        setError('Failed to load authority insights')
      }
    } catch (err) {
      setError('Failed to load authority insights')
      console.error('Authority insights error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel >= 3.5) return 'text-red-600 bg-red-100'
    if (riskLevel >= 2.5) return 'text-orange-600 bg-orange-100'
    if (riskLevel >= 1.5) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendDirectionText = (direction: string) => {
    switch (direction) {
      case 'increasing': return t('authorityDashboard.complianceTrends.increasing')
      case 'decreasing': return t('authorityDashboard.complianceTrends.decreasing')
      default: return t('authorityDashboard.complianceTrends.stable')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('authorityDashboard.loadingInsights')}</p>
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
            onClick={loadAuthorityInsights}
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
              <h1 className="text-3xl font-bold text-gray-900">{t('authorityDashboard.title')}</h1>
              <p className="text-gray-600 mt-1">{t('authorityDashboard.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="7d">{t('authorityDashboard.last7Days')}</option>
                <option value="30d">{t('authorityDashboard.last30Days')}</option>
                <option value="90d">{t('authorityDashboard.last90Days')}</option>
              </select>
              <button
                onClick={loadAuthorityInsights}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('authorityDashboard.refresh')}</span>
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
              { id: 'overview', name: t('authorityDashboard.strategicOverview.title'), icon: BarChart3 },
              { id: 'sacco', name: t('authorityDashboard.saccoPerformance.title'), icon: Users },
              { id: 'routes', name: t('authorityDashboard.routeRiskAnalysis.title'), icon: MapPin },
              { id: 'geographic', name: t('authorityDashboard.geographicInsights.title'), icon: Eye },
              { id: 'temporal', name: t('authorityDashboard.temporalPatterns.title'), icon: Clock },
              { id: 'planning', name: t('authorityDashboard.complianceTrends.title'), icon: Lightbulb },
              { id: 'resources', name: t('authorityDashboard.resourceRecommendations.title'), icon: Target }
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
        {insights && (
          <>
            {/* Strategic Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('authorityDashboard.strategicOverview.totalSaccos')}</p>
                        <p className="text-2xl font-bold text-gray-900">{insights.saccoPerformance.totalSaccos}</p>
                        <p className="text-xs text-gray-500">{insights.saccoPerformance.criticalSaccos} {t('authorityDashboard.critical')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('authorityDashboard.routeRiskAnalysis.highRiskRoutes')}</p>
                        <p className="text-2xl font-bold text-gray-900">{insights.routeSafetyAnalysis.criticalRoutes}</p>
                        <p className="text-xs text-gray-500">{t('authorityDashboard.avgRisk')} {insights.routeSafetyAnalysis.averageRiskScore}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <MapPin className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('authorityDashboard.geographicInsights.highRiskZones')}</p>
                        <p className="text-2xl font-bold text-gray-900">{insights.geographicRiskMap.highRiskZones.length}</p>
                        <p className="text-xs text-gray-500">{t('authorityDashboard.highRiskAreas')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{t('authorityDashboard.systemHealth.resolutionRate')}</p>
                        <p className="text-2xl font-bold text-gray-900">{(insights.systemHealth.resolutionRate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">{t('authorityDashboard.systemEfficiency')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planning Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
{t('authorityDashboard.focusAreas')}
                    </h3>
                    <div className="space-y-2">
                      {insights.planningInsights.focusAreas.slice(0, 5).map((area, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                          {area}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-500" />
{t('authorityDashboard.recommendedActions')}
                    </h3>
                    <div className="space-y-2">
                      {[
                        t('authorityDashboard.strategicOverview.increaseMonitoring'),
                        t('authorityDashboard.strategicOverview.implementInterventions'),
                        t('authorityDashboard.strategicOverview.focusResources'),
                        t('authorityDashboard.strategicOverview.developProtocols'),
                        t('authorityDashboard.strategicOverview.establishWarning')
                      ].map((action, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trend Analysis */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.complianceTrends.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{insights.complianceTrends.averageDailyReports}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.avgDailyReports')}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        {getTrendIcon(insights.complianceTrends.trendDirection)}
                        <span className="ml-2 text-sm text-gray-600 capitalize">
                          {getTrendDirectionText(insights.complianceTrends.trendDirection)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.trendDirection')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{insights.systemHealth.totalReports}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.totalReportsLabel')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SACCO Performance Tab */}
            {activeTab === 'sacco' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.saccoPerformance.topPerformers')}</h3>
                    <div className="space-y-3">
                      {insights.saccoPerformance.topPerformers.map((sacco, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-2 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-900">{sacco._id || 'Unknown SACCO'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">{sacco.totalReports} {t('authorityDashboard.reports')}</span>
                            <div className="text-xs text-gray-400">
                              {sacco.criticalReports} {t('authorityDashboard.critical')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.saccoPerformance.poorPerformers')}</h3>
                    <div className="space-y-3">
                      {insights.saccoPerformance.poorPerformers.map((sacco, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                            <span className="text-sm font-medium text-gray-900">{sacco._id || 'Unknown SACCO'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">{sacco.totalReports} {t('authorityDashboard.reports')}</span>
                            <div className="text-xs text-red-500">
                              {sacco.criticalReports} {t('authorityDashboard.critical')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.saccoPerformance.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{insights.saccoPerformance.totalSaccos}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.strategicOverview.totalSaccos')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{insights.saccoPerformance.averageReportsPerSacco}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.avgReportsPerSacco')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{insights.saccoPerformance.criticalSaccos}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.criticalSaccos')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Route Risk Analysis Tab */}
            {activeTab === 'routes' && (
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{t('authorityDashboard.routeRiskAnalysis.highRiskRoutes')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('authorityDashboard.routeRiskAnalysis.routeName')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('authorityDashboard.routeRiskAnalysis.operator')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('authorityDashboard.routeRiskAnalysis.riskScore')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('authorityDashboard.routeRiskAnalysis.totalIncidents')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('authorityDashboard.routeRiskAnalysis.criticalIncidents')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {insights.routeSafetyAnalysis.highRiskRoutes.map((route) => (
                          <tr key={route._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {route.routeNumber} - {route.routeName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {route.operator}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(route.riskScore)}`}>
                                {route.riskScore.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {route.totalIncidents}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                              {route.criticalIncidents}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Geographic Insights Tab */}
            {activeTab === 'geographic' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.geographicInsights.highRiskZones')}</h3>
                  <div className="space-y-3">
                    {insights.geographicRiskMap.highRiskZones.map((zone, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-red-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {zone._id.lat.toFixed(2)}, {zone._id.lng.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">{zone.totalIncidents} {t('authorityDashboard.incidents')}</span>
                          <div className="text-xs text-red-500">
                            {zone.criticalIncidents} {t('authorityDashboard.critical')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.geographicInsights.title')} {t('authorityDashboard.geographicInsights.totalRiskZones')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{insights.geographicRiskMap.totalRiskZones}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.geographicInsights.totalRiskZones')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{insights.geographicRiskMap.highRiskZones.length}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.geographicInsights.highRiskZones')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{insights.geographicRiskMap.averageRiskLevel}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.geographicInsights.averageRiskLevel')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Temporal Patterns Tab */}
            {activeTab === 'temporal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.temporalPatterns.peakHours')}</h3>
                    <div className="space-y-3">
                      {insights.temporalPatterns.peakHours.map((hour, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {hour._id.hour}:00 - {hour._id.hour + 1}:00
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{hour.incidentCount} {t('authorityDashboard.incidents')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.temporalPatterns.title')}</h3>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{insights.temporalPatterns.averageIncidentsPerHour}</p>
                        <p className="text-sm text-gray-500">{t('authorityDashboard.temporalPatterns.averageIncidentsPerHour')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{insights.temporalPatterns.peakHours.length}</p>
                        <p className="text-sm text-gray-500">{t('authorityDashboard.temporalPatterns.peakHoursIdentified')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Planning Insights Tab */}
            {activeTab === 'planning' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
{t('authorityDashboard.strategicFocusAreas')}
                    </h3>
                    <div className="space-y-3">
                      {insights.planningInsights.focusAreas.map((area, index) => (
                        <div key={index} className="flex items-start">
                          <AlertCircle className="w-4 h-4 mr-2 text-orange-500 mt-0.5" />
                          <span className="text-sm text-gray-600">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-500" />
{t('authorityDashboard.recommendedActions')}
                    </h3>
                    <div className="space-y-3">
                      {[
                        t('authorityDashboard.strategicOverview.increaseMonitoring'),
                        t('authorityDashboard.strategicOverview.implementInterventions'),
                        t('authorityDashboard.strategicOverview.focusResources'),
                        t('authorityDashboard.strategicOverview.developProtocols'),
                        t('authorityDashboard.strategicOverview.establishWarning')
                      ].map((action, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-600">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.riskIndicators.title')}</h3>
                  <div className="space-y-3">
                    {insights.riskIndicators.topRisks.map((risk, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {risk._id.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">{risk.totalCount} {t('authorityDashboard.incidents')}</span>
                          <div className="text-xs text-red-500">
                            {risk.criticalCount} {t('authorityDashboard.critical')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Resource Allocation Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.resourceRecommendations.prioritySaccos')} {t('authorityDashboard.resourceRecommendations.title')}</h3>
                  <div className="space-y-3">
                    {insights.resourceRecommendations.prioritySaccos.map((sacco, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">{sacco._id || 'Unknown SACCO'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">{t('authorityDashboard.priorityScoreLabel')} {sacco.priorityScore}</span>
                          <div className="text-xs text-gray-400">
                            {sacco.totalReports} {t('authorityDashboard.reports')}, {sacco.criticalReports} {t('authorityDashboard.critical')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('authorityDashboard.resourceRecommendations.title')} {t('authorityDashboard.resourceRecommendations.totalResourcesNeeded')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{insights.resourceRecommendations.totalResourcesNeeded}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.resourceRecommendations.totalResourcesNeeded')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{insights.resourceRecommendations.highPriorityCount}</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.resourceRecommendations.highPriorityCases')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{(insights.systemHealth.dataQuality * 100).toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">{t('authorityDashboard.systemHealth.dataQuality')}</p>
                    </div>
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

export default AuthorityDashboard