import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  Download, 
  Users, 
  CheckCircle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react'
import apiService from '../services/api'
import { useTranslation } from '../hooks/useTranslation'

interface ComplianceData {
  saccoId: string
  saccoName: string
  licenseStatus: 'valid' | 'expired' | 'pending'
  safetyScore: number
  incidentCount: number
  lastInspection: string
  violations: number
  status: 'compliant' | 'warning' | 'non-compliant'
}

interface SafetyIncident {
  id: string
  routeId: string
  routeName: string
  saccoName: string
  type: 'accident' | 'breakdown' | 'overcrowding' | 'speeding' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string
  reportedAt: string
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  assignedTo?: string
  resolution?: string
  resolvedAt?: string
}

interface SystemMetrics {
  totalUsers: number
  activeReports: number
  totalRoutes: number
  systemUptime: number
  dataQuality: number
  averageResponseTime: number
}

interface AuditLog {
  id: string
  action: string
  user: string
  timestamp: string
  details: string
  ipAddress: string
  status: 'success' | 'failed' | 'warning'
}

export default function AuthorityDashboard() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([])
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [dateRange, setDateRange] = useState('30d')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadDashboardData()
  }, [dateRange, filterSeverity, filterStatus])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const response = await apiService.getAuthorityDashboard()
      if (response.success && response.data) {
        const { complianceData, safetyIncidents, systemMetrics, auditLogs } = response.data
        setComplianceData(complianceData || [])
        setSafetyIncidents(safetyIncidents || [])
        setSystemMetrics(systemMetrics || null)
        setAuditLogs(auditLogs || [])
      } else {
        setComplianceData([])
        setSafetyIncidents([])
        setSystemMetrics(null)
        setAuditLogs([])
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setComplianceData([])
      setSafetyIncidents([])
      setSystemMetrics(null)
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'non-compliant': return 'text-red-600 bg-red-100'
      case 'valid': return 'text-green-600 bg-green-100'
      case 'expired': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'reported': return 'text-blue-600 bg-blue-100'
      case 'investigating': return 'text-yellow-600 bg-yellow-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      case 'success': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const translateStatus = (status: string) => {
    switch (status) {
      case 'compliant': return t('authority.complianceStatus.compliant')
      case 'warning': return t('authority.complianceStatus.warning')
      case 'non-compliant': return t('authority.complianceStatus.nonCompliant')
      case 'valid': return t('authority.complianceStatus.valid')
      case 'expired': return t('authority.complianceStatus.expired')
      case 'pending': return t('authority.complianceStatus.pending')
      case 'unknown': return t('authority.complianceStatus.unknown')
      case 'reported': return t('authority.incidentsTable.reported')
      case 'investigating': return t('authority.incidentsTable.investigating')
      case 'resolved': return t('authority.incidentsTable.resolved')
      case 'closed': return t('authority.incidentsTable.closed')
      case 'success': return t('authority.auditTable.success')
      case 'failed': return t('authority.auditTable.failed')
      case 'low': return t('authority.incidentsTable.low')
      case 'medium': return t('authority.incidentsTable.medium')
      case 'high': return t('authority.incidentsTable.high')
      case 'critical': return t('authority.incidentsTable.critical')
      default: return status
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const exportData = async (type: 'compliance' | 'incidents' | 'analytics', format: 'csv' | 'xls') => {
    const base = 'https://us-central1-smart-matwana-ke.cloudfunctions.net/api'
    const endpoint = type === 'compliance' ? '/export/compliance'
      : type === 'incidents' ? '/export/incidents'
      : '/export/system'
    const url = `${base}${endpoint}?format=${format}`
    const link = document.createElement('a')
    link.href = url
    link.download = `${type}-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('authority.loading')}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">{t('authority.title')}</h1>
              <p className="text-gray-600 mt-1">{t('authority.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="7d">{t('authority.last7Days')}</option>
                <option value="30d">{t('authority.last30Days')}</option>
                <option value="90d">{t('authority.last90Days')}</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('authority.refresh')}</span>
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
              { id: 'overview', name: t('authority.tabs.metrics'), icon: BarChart3 },
              { id: 'compliance', name: t('authority.tabs.compliance'), icon: Shield },
              { id: 'incidents', name: t('authority.tabs.incidents'), icon: AlertTriangle },
              { id: 'reports', name: t('authority.tabs.reports'), icon: FileText },
              { id: 'audit', name: t('authority.tabs.audit'), icon: Eye },
              { id: 'system', name: t('authority.tabs.system'), icon: Settings }
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('authority.kpiCards.totalSaccos')}</p>
                    <p className="text-2xl font-bold text-gray-900">{complianceData.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('authority.kpiCards.compliantSaccos')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {complianceData.filter(s => s.status === 'compliant').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('authority.kpiCards.activeIncidents')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {safetyIncidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('authority.kpiCards.systemUptime')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {systemMetrics?.systemUptime}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            {systemMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('authority.systemMetrics.title')}</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('authority.systemMetrics.totalUsers')}</span>
                      <span className="text-lg font-semibold">{systemMetrics.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('authority.systemMetrics.activeReports')}</span>
                      <span className="text-lg font-semibold text-blue-600">{systemMetrics.activeReports}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('authority.systemMetrics.totalRoutes')}</span>
                      <span className="text-lg font-semibold">{systemMetrics.totalRoutes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('authority.systemMetrics.dataQuality')}</span>
                      <span className="text-lg font-semibold text-green-600">{systemMetrics.dataQuality}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('authority.performance.title')}</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('authority.performance.systemUptime')}</span>
                      <span className="text-lg font-semibold text-green-600">{systemMetrics.systemUptime}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('authority.performance.avgResponseTime')}</span>
                      <span className="text-lg font-semibold">{systemMetrics.averageResponseTime}s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('authority.performance.dataQuality')}</span>
                      <span className="text-lg font-semibold text-green-600">{systemMetrics.dataQuality}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('authority.complianceTable.title')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.complianceTable.sacco')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.complianceTable.licenseStatus')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.complianceTable.safetyScore')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.complianceTable.incidentCount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.complianceTable.violations')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.complianceTable.lastInspection')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.complianceTable.status')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complianceData.map((sacco) => (
                    <tr key={sacco.saccoId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sacco.saccoName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sacco.licenseStatus)}`}>
                          {translateStatus(sacco.licenseStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${sacco.safetyScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{sacco.safetyScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sacco.incidentCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sacco.violations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sacco.lastInspection).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sacco.status)}`}>
                          {translateStatus(sacco.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">{t('authority.incidentsTable.title')}</h3>
                  <div className="flex space-x-4">
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">{t('authority.incidentsTable.allSeverity')}</option>
                      <option value="low">{t('authority.incidentsTable.low')}</option>
                      <option value="medium">{t('authority.incidentsTable.medium')}</option>
                      <option value="high">{t('authority.incidentsTable.high')}</option>
                      <option value="critical">{t('authority.incidentsTable.critical')}</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">{t('authority.incidentsTable.allStatus')}</option>
                      <option value="reported">{t('authority.incidentsTable.reported')}</option>
                      <option value="investigating">{t('authority.incidentsTable.investigating')}</option>
                      <option value="resolved">{t('authority.incidentsTable.resolved')}</option>
                      <option value="closed">{t('authority.incidentsTable.closed')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {safetyIncidents
                  .filter(incident => 
                    (filterSeverity === 'all' || incident.severity === filterSeverity) &&
                    (filterStatus === 'all' || incident.status === filterStatus)
                  )
                  .map((incident) => (
                    <div key={incident.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{incident.routeName}</h4>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{incident.saccoName}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="capitalize">{incident.type}</span>
                            <span>•</span>
                            <span>{incident.location}</span>
                            <span>•</span>
                            <span>{new Date(incident.reportedAt).toLocaleDateString()}</span>
                            {incident.assignedTo && (
                              <>
                                <span>•</span>
                                <span>Assigned to: {incident.assignedTo}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                            {translateStatus(incident.severity)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                            {translateStatus(incident.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('authority.reports.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{t('authority.reports.complianceReport.title')}</h4>
                      <p className="text-sm text-gray-500">{t('authority.reports.complianceReport.description')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => exportData('compliance','csv')} className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                      <span>{t('authority.reports.exportCsv')}</span>
                    </button>
                    <button onClick={() => exportData('compliance','xls')} className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                      <span>{t('authority.reports.exportXls')}</span>
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{t('authority.reports.safetyIncidents.title')}</h4>
                      <p className="text-sm text-gray-500">{t('authority.reports.safetyIncidents.description')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => exportData('incidents','csv')} className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      <Download className="w-4 h-4" />
                      <span>{t('authority.reports.exportCsv')}</span>
                    </button>
                    <button onClick={() => exportData('incidents','xls')} className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      <Download className="w-4 h-4" />
                      <span>{t('authority.reports.exportXls')}</span>
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{t('authority.reports.systemAnalytics.title')}</h4>
                      <p className="text-sm text-gray-500">{t('authority.reports.systemAnalytics.description')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => exportData('analytics','csv')} className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      <Download className="w-4 h-4" />
                      <span>{t('authority.reports.exportCsv')}</span>
                    </button>
                    <button onClick={() => exportData('analytics','xls')} className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      <Download className="w-4 h-4" />
                      <span>{t('authority.reports.exportXls')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('authority.auditTable.title')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.auditTable.action')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.auditTable.user')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.auditTable.timestamp')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.auditTable.details')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.auditTable.ipAddress')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('authority.auditTable.status')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {translateStatus(log.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'system' && systemMetrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('authority.systemHealth.title')}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('authority.systemHealth.systemUptime')}</span>
                    <span className="text-lg font-semibold text-green-600">{systemMetrics.systemUptime}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('authority.systemHealth.dataQuality')}</span>
                    <span className="text-lg font-semibold text-green-600">{systemMetrics.dataQuality}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('authority.systemHealth.averageResponseTime')}</span>
                    <span className="text-lg font-semibold">{systemMetrics.averageResponseTime}s</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('authority.userActivity.title')}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('authority.userActivity.totalUsers')}</span>
                    <span className="text-lg font-semibold">{systemMetrics.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('authority.userActivity.activeReports')}</span>
                    <span className="text-lg font-semibold text-blue-600">{systemMetrics.activeReports}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('authority.userActivity.totalRoutes')}</span>
                    <span className="text-lg font-semibold">{systemMetrics.totalRoutes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
