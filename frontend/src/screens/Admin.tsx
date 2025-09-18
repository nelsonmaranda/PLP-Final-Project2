import { useState, useEffect } from 'react'
import { BarChart3, Users, MapPin, AlertTriangle, Plus, Edit, Trash2, Eye } from 'lucide-react'

interface Route {
  id: string
  name: string
  reliability: number
  safety: number
  reports: number
  status: 'active' | 'inactive' | 'maintenance'
}

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true)
  const [routes, setRoutes] = useState<Route[]>([])
  const [showAddRoute, setShowAddRoute] = useState(false)
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
  })

  // Sample data
  const sampleRoutes: Route[] = [
    {
      id: '1',
      name: 'Route 42 - Thika Road',
      reliability: 4.2,
      safety: 4.5,
      reports: 156,
      status: 'active'
    },
    {
      id: '2',
      name: 'Route 17 - Waiyaki Way',
      reliability: 3.8,
      safety: 4.0,
      reports: 98,
      status: 'active'
    },
    {
      id: '3',
      name: 'Route 8 - Jogoo Road',
      reliability: 3.5,
      safety: 3.8,
      reports: 67,
      status: 'maintenance'
    },
    {
      id: '4',
      name: 'Route 23 - Ngong Road',
      reliability: 4.0,
      safety: 4.2,
      reports: 89,
      status: 'active'
    }
  ]

  useEffect(() => {
    // Simulate API call
    const loadRoutes = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setRoutes(sampleRoutes)
      setIsLoading(false)
    }

    loadRoutes()
  }, [])

  const handleAddRoute = () => {
    if (newRoute.name.trim()) {
      const route: Route = {
        id: Date.now().toString(),
        name: newRoute.name,
        reliability: 0,
        safety: 0,
        reports: 0,
        status: 'active'
      }
      setRoutes(prev => [...prev, route])
      setNewRoute({ name: '', description: '' })
      setShowAddRoute(false)
    }
  }

  const handleDeleteRoute = (id: string) => {
    setRoutes(prev => prev.filter(route => route.id !== id))
  }

  const handleToggleStatus = (id: string) => {
    setRoutes(prev => prev.map(route => 
      route.id === id 
        ? { 
            ...route, 
            status: route.status === 'active' ? 'inactive' : 'active' 
          }
        : route
    ))
  }

  const stats = [
    {
      title: 'Total Routes',
      value: routes.length,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Routes',
      value: routes.filter(r => r.status === 'active').length,
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Reports',
      value: routes.reduce((sum, r) => sum + r.reports, 0),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Safety Issues',
      value: 3,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage routes, reports, and system settings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Routes Management */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="card-title">Route Management</h2>
              <button
                onClick={() => setShowAddRoute(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Route
              </button>
            </div>
          </div>

          <div className="card-content p-0">
            {/* Add Route Form */}
            {showAddRoute && (
              <div className="border-b border-gray-200 p-6 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Route</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Route Name</label>
                    <input
                      type="text"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., Route 42 - Thika Road"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      value={newRoute.description}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, description: e.target.value }))}
                      className="form-input"
                      placeholder="Route description"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAddRoute(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRoute}
                    className="btn btn-primary"
                  >
                    Add Route
                  </button>
                </div>
              </div>
            )}

            {/* Routes Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reliability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Safety
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reports
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{route.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">{route.reliability}</div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(route.reliability / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">{route.safety}</div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(route.safety / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.reports}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          route.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : route.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {route.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(route.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            {route.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => handleDeleteRoute(route.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
