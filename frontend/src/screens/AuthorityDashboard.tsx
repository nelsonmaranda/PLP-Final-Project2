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
      
      // Load compliance data
      const complianceData: ComplianceData[] = [
        {
          saccoId: '1',
          saccoName: 'Nairobi City Sacco',
          licenseStatus: 'valid',
          safetyScore: 92,
          incidentCount: 2,
          lastInspection: '2025-09-15',
          violations: 0,
          status: 'compliant'
        },
        {
          saccoId: '2',
          saccoName: 'Eastlands Matatu Sacco',
          licenseStatus: 'valid',
          safetyScore: 78,
          incidentCount: 5,
          lastInspection: '2025-09-10',
          violations: 2,
          status: 'warning'
        },
        {
          saccoId: '3',
          saccoName: 'Westlands Transport Sacco',
          licenseStatus: 'expired',
          safetyScore: 65,
          incidentCount: 8,
          lastInspection: '2025-08-20',
          violations: 4,
          status: 'non-compliant'
        }
      ]
      setComplianceData(complianceData)

      // Load safety incidents
      const incidentsData: SafetyIncident[] = [
        {
          id: '1',
          routeId: '1',
          routeName: 'Route 1 - CBD to Westlands',
          saccoName: 'Nairobi City Sacco',
          type: 'accident',
          severity: 'high',
          description: 'Minor collision at roundabout',
          location: 'Westlands Roundabout',
          reportedAt: '2025-09-21T10:30:00Z',
          status: 'investigating',
          assignedTo: 'Inspector John Doe'
        },
        {
          id: '2',
          routeId: '2',
          routeName: 'Route 2 - CBD to Eastleigh',
          saccoName: 'Eastlands Matatu Sacco',
          type: 'overcrowding',
          severity: 'medium',
          description: 'Vehicle carrying 20 passengers instead of 14',
          location: 'Eastleigh Bus Stop',
          reportedAt: '2025-09-21T14:20:00Z',
          status: 'reported'
        },
        {
          id: '3',
          routeId: '3',
          routeName: 'Route 3 - CBD to Kasarani',
          saccoName: 'Westlands Transport Sacco',
          type: 'breakdown',
          severity: 'low',
          description: 'Vehicle breakdown causing traffic delay',
          location: 'Thika Road',
          reportedAt: '2025-09-20T16:45:00Z',
          status: 'resolved',
          resolution: 'Vehicle towed, traffic cleared',
          resolvedAt: '2025-09-20T18:30:00Z'
        }
      ]
      setSafetyIncidents(incidentsData)

      // Load system metrics
      setSystemMetrics({
        totalUsers: 1250,
        activeReports: 45,
        totalRoutes: 25,
        systemUptime: 99.8,
        dataQuality: 94.5,
        averageResponseTime: 1.2
      })

      // Load audit logs
      const auditData: AuditLog[] = [
        {
          id: '1',
          action: 'User Login',
          user: 'admin@authority.ke',
          timestamp: '2025-09-21T14:30:00Z',
          details: 'Successful login from 192.168.1.100',
          ipAddress: '192.168.1.100',
          status: 'success'
        },
        {
          id: '2',
          action: 'Report Generated',
          user: 'inspector@authority.ke',
          timestamp: '2025-09-21T14:25:00Z',
          details: 'Compliance report exported for Q3 2025',
          ipAddress: '192.168.1.101',
          status: 'success'
        },
        {
          id: '3',
          action: 'Data Export',
          user: 'analyst@authority.ke',
          timestamp: '2025-09-21T14:20:00Z',
          details: 'Safety incident data exported',
          ipAddress: '192.168.1.102',
          status: 'success'
        }
      ]
      setAuditLogs(auditData)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const exportData = (type: string) => {
    // Simulate data export
    const data = type === 'compliance' ? complianceData : safetyIncidents
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Authority Dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Transport Authority Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor compliance, safety, and system oversight</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
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
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'compliance', name: 'Compliance', icon: Shield },
              { id: 'incidents', name: 'Safety Incidents', icon: AlertTriangle },
              { id: 'reports', name: 'Reports & Export', icon: FileText },
              { id: 'audit', name: 'Audit Logs', icon: Eye },
              { id: 'system', name: 'System Health', icon: Settings }
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
                    <p className="text-sm font-medium text-gray-600">Total SACCOs</p>
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
                    <p className="text-sm font-medium text-gray-600">Compliant SACCOs</p>
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
                    <p className="text-sm font-medium text-gray-600">Active Incidents</p>
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
                    <p className="text-sm font-medium text-gray-600">System Uptime</p>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Users</span>
                      <span className="text-lg font-semibold">{systemMetrics.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Reports</span>
                      <span className="text-lg font-semibold text-blue-600">{systemMetrics.activeReports}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Routes</span>
                      <span className="text-lg font-semibold">{systemMetrics.totalRoutes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Data Quality</span>
                      <span className="text-lg font-semibold text-green-600">{systemMetrics.dataQuality}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">System Uptime</span>
                      <span className="text-lg font-semibold text-green-600">{systemMetrics.systemUptime}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Response Time</span>
                      <span className="text-lg font-semibold">{systemMetrics.averageResponseTime}s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Data Quality</span>
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
              <h3 className="text-lg font-semibold text-gray-900">SACCO Compliance Status</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SACCO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safety Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incidents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violations</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Inspection</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                          {sacco.licenseStatus}
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
                          {sacco.status}
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
                  <h3 className="text-lg font-semibold text-gray-900">Safety Incidents</h3>
                  <div className="flex space-x-4">
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Severity</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="reported">Reported</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
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
                            {incident.severity}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                            {incident.status}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export & Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Compliance Report</h4>
                      <p className="text-sm text-gray-500">SACCO compliance data</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportData('compliance')}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Safety Incidents</h4>
                      <p className="text-sm text-gray-500">Incident reports and data</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportData('incidents')}
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">System Analytics</h4>
                      <p className="text-sm text-gray-500">Performance metrics</p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportData('analytics')}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">System Audit Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                          {log.status}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">System Uptime</span>
                    <span className="text-lg font-semibold text-green-600">{systemMetrics.systemUptime}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Data Quality</span>
                    <span className="text-lg font-semibold text-green-600">{systemMetrics.dataQuality}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Response Time</span>
                    <span className="text-lg font-semibold">{systemMetrics.averageResponseTime}s</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="text-lg font-semibold">{systemMetrics.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Reports</span>
                    <span className="text-lg font-semibold text-blue-600">{systemMetrics.activeReports}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Routes</span>
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
