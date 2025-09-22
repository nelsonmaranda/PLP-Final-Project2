import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Star,
  MapPin,
  DollarSign,
  Activity,
  MessageSquare,
  RefreshCw
} from 'lucide-react'
import apiService from '../services/api'

interface RoutePerformance {
  routeId: string
  routeName: string
  routeNumber: string
  efficiencyScore: number
  revenue: number
  passengerCount: number
  onTimePercentage: number
  safetyScore: number
  trend: 'up' | 'down' | 'stable'
}

interface DriverPerformance {
  driverId: string
  driverName: string
  safetyScore: number
  onTimePercentage: number
  customerRating: number
  incidentCount: number
  routes: string[]
  status: 'active' | 'suspended' | 'warning'
}

interface CustomerFeedback {
  id: string
  routeId: string
  routeName: string
  rating: number
  comment: string
  category: 'safety' | 'comfort' | 'punctuality' | 'service' | 'other'
  status: 'pending' | 'in_progress' | 'resolved'
  createdAt: string
  responseTime?: number
}

interface FleetStatus {
  totalVehicles: number
  activeVehicles: number
  maintenanceDue: number
  averageAge: number
  utilizationRate: number
}

export default function SaccoDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([])
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([])
  const [customerFeedback, setCustomerFeedback] = useState<CustomerFeedback[]>([])
  const [fleetStatus, setFleetStatus] = useState<FleetStatus | null>(null)
  const [dateRange, setDateRange] = useState('30d')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadDashboardData()
  }, [dateRange, filterStatus])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const response = await apiService.getSaccoDashboard()
      if (response.success && response.data) {
        const { routePerformance, driverPerformance, customerFeedback, fleetStatus } = response.data
        setRoutePerformance(routePerformance || [])
        setDriverPerformance(driverPerformance || [])
        setCustomerFeedback(customerFeedback || [])
        setFleetStatus(fleetStatus || null)
      } else {
        setRoutePerformance([])
        setDriverPerformance([])
        setCustomerFeedback([])
        setFleetStatus(null)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setRoutePerformance([])
      setDriverPerformance([])
      setCustomerFeedback([])
      setFleetStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'suspended': return 'text-red-600 bg-red-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading SACCO Dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">SACCO Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your fleet, drivers, and routes</p>
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
              { id: 'routes', name: 'Route Performance', icon: MapPin },
              { id: 'drivers', name: 'Driver Management', icon: Users },
              { id: 'feedback', name: 'Customer Feedback', icon: MessageSquare },
              { id: 'fleet', name: 'Fleet Management', icon: Activity }
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
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Routes</p>
                    <p className="text-2xl font-bold text-gray-900">{routePerformance.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {driverPerformance.filter(d => d.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      KSh {routePerformance.reduce((sum, route) => sum + (route.revenue || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {driverPerformance.length > 0 
                        ? (
                          driverPerformance.reduce((sum, driver) => sum + (driver.customerRating || 0), 0) / driverPerformance.length
                        ).toFixed(1)
                        : '0.0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fleet Status */}
            {fleetStatus && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{fleetStatus.activeVehicles}</p>
                    <p className="text-sm text-gray-600">Active Vehicles</p>
                    <p className="text-xs text-gray-500">of {fleetStatus.totalVehicles} total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{fleetStatus.maintenanceDue}</p>
                    <p className="text-sm text-gray-600">Maintenance Due</p>
                    <p className="text-xs text-gray-500">vehicles need service</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{fleetStatus.utilizationRate}%</p>
                    <p className="text-sm text-gray-600">Utilization Rate</p>
                    <p className="text-xs text-gray-500">average fleet usage</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Route Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passengers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safety</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routePerformance.map((route) => (
                    <tr key={route.routeId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{route.routeNumber}</div>
                          <div className="text-sm text-gray-500">{route.routeName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${route.efficiencyScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{route.efficiencyScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        KSh {(route.revenue || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.passengerCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.onTimePercentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.safetyScore}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTrendIcon(route.trend)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Driver Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safety Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incidents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Routes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {driverPerformance.map((driver) => (
                    <tr key={driver.driverId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{driver.driverName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${driver.safetyScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{driver.safetyScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.onTimePercentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-900">{driver.customerRating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.incidentCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {driver.routes.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Feedback</h3>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {customerFeedback
                  .filter(feedback => filterStatus === 'all' || feedback.status === filterStatus)
                  .map((feedback) => (
                    <div key={feedback.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{feedback.routeName}</h4>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{feedback.comment}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="capitalize">{feedback.category}</span>
                            <span>•</span>
                            <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                            {feedback.responseTime && (
                              <>
                                <span>•</span>
                                <span>Resolved in {feedback.responseTime} days</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feedback.status)}`}>
                          {feedback.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fleet' && fleetStatus && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Vehicles</span>
                    <span className="text-lg font-semibold">{fleetStatus.totalVehicles}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Vehicles</span>
                    <span className="text-lg font-semibold text-green-600">{fleetStatus.activeVehicles}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Maintenance Due</span>
                    <span className="text-lg font-semibold text-yellow-600">{fleetStatus.maintenanceDue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Age</span>
                    <span className="text-lg font-semibold">{fleetStatus.averageAge} years</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilization Rate</h3>
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-600"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${fleetStatus.utilizationRate}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{fleetStatus.utilizationRate}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Fleet Utilization</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
