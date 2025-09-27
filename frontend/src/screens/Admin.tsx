import { useState, useEffect } from 'react'
import { BarChart3, Users, MapPin, AlertTriangle, Plus, Edit, Trash2, Eye, Upload, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import apiService from '../services/api'
import { Route } from '../types'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../hooks/useTranslation'

export default function Admin() {
  const { t } = useTranslation()
  const { state } = useApp()
  const isAdmin = state.user?.role === 'admin'
  const [isLoading, setIsLoading] = useState(true)
  const [routes, setRoutes] = useState<Route[]>([])
  const [reportsCount, setReportsCount] = useState<number>(0)
  const [showAddRoute, setShowAddRoute] = useState(false)
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
  })

  // Seeding UI state
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string>('')

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setIsLoading(true)
        const res = await apiService.getRoutes({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
        if (res.success && res.data) {
          setRoutes(res.data.routes as any)
        } else {
          setRoutes([])
        }
      } catch (e) {
        console.error('Failed to load routes', e)
        setRoutes([])
      } finally {
        setIsLoading(false)
      }
    }
    const loadReportsCount = async () => {
      try {
        const resp = await fetch('https://us-central1-smart-matwana-ke.cloudfunctions.net/api/reports/count')
        const data = await resp.json()
        if (data?.success && typeof data?.data?.count === 'number') {
          setReportsCount(data.data.count)
        }
      } catch {}
    }
    loadRoutes()
    loadReportsCount()
  }, [])

  const handleAddRoute = async () => {
    try {
      if (newRoute.name.trim()) {
        setIsLoading(true)
        const created = await apiService.createRoute({ name: newRoute.name, description: newRoute.description } as any)
        if (created.success && created.data) {
          const updated = await apiService.getRoutes({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
          setRoutes(updated.success && updated.data ? (updated.data.routes as any) : [])
          setNewRoute({ name: '', description: '' })
          setShowAddRoute(false)
        }
      }
    } catch (e) {
      console.error('Failed to add route', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRoute = async (id: string) => {
    try {
      setIsLoading(true)
      await apiService.deleteRoute(id)
      const updated = await apiService.getRoutes({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
      setRoutes(updated.success && updated.data ? (updated.data.routes as any) : [])
    } catch (e) {
      console.error('Failed to delete route', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      setIsLoading(true)
      const route = (routes as any).find((r: any) => (r as any)._id === id || (r as any).id === id)
      if (!route) return
      const next = (route as any).status === 'active' ? 'inactive' : 'active'
      await apiService.updateRoute((route as any)._id || (route as any).id, { status: next } as any)
      const updated = await apiService.getRoutes({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
      setRoutes(updated.success && updated.data ? (updated.data.routes as any) : [])
    } catch (e) {
      console.error('Failed to toggle route status', e)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    {
      title: t('admin.stats.totalRoutes'),
      value: routes.length,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: t('admin.stats.activeRoutes'),
      value: routes.length,
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: t('admin.stats.totalReports'),
      value: reportsCount,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: t('admin.stats.safetyIssues'),
      value: (routes as any).reduce((sum: number, r: any) => sum + (r.safetyIssues || 0), 0),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ]

  const runSeed = async () => {
    setIsSeeding(true)
    setSeedResult('')
    try {
      let seeds: any[] = []
      try {
        const res = await fetch('/scripts/seed-routes.json')
        if (res.ok) {
          seeds = await res.json()
        }
      } catch {}
      if (!seeds || seeds.length === 0) {
        seeds = [
          { name: 'Route 46 - CBD to Westlands', routeNumber: '46' },
          { name: 'Route 44 - CBD to Kasarani', routeNumber: '44' },
          { name: 'Route 58 - CBD to Embakasi', routeNumber: '58' }
        ]
      }

      const token = localStorage.getItem('authToken')
      if (!token) {
        setSeedResult('Missing auth token. Please login again.')
        setIsSeeding(false)
        return
      }

      let created = 0
      for (let i = 0; i < seeds.length; i += 10) {
        const chunk = seeds.slice(i, i + 10)
        const resp = await fetch('https://us-central1-smart-matwana-ke.cloudfunctions.net/api/admin/seed/routes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ routes: chunk })
        })
        const data = await resp.json()
        if (data?.success && data?.data?.created >= 0) {
          created += data.data.created
          setSeedResult(prev => `${prev}\nChunk ${i}-${i + chunk.length - 1}: created ${data.data.created}`)
        } else {
          setSeedResult(prev => `${prev}\nChunk ${i}-${i + chunk.length - 1}: failed (${data?.message || 'unknown'})`)
        }
        await new Promise(r => setTimeout(r, 250))
      }

      const updated = await apiService.getRoutes({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' })
      setRoutes(updated.success && updated.data ? (updated.data.routes as any) : [])
      setSeedResult(prev => `${prev}\nTotal created: ${created}`)
    } catch (e: any) {
      setSeedResult(`Seed failed: ${e?.message || e}`)
    } finally {
      setIsSeeding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.subtitle')}</p>
        </div>

        {isAdmin && (
          <div className="card mb-6">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="card-title">{t('admin.seedRoutes')}</h2>
                <button onClick={runSeed} disabled={isSeeding} className="btn btn-primary btn-sm">
                  {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {isSeeding ? t('admin.seeding') : t('admin.runSeed')}
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">{t('admin.seedDescription')}</p>
              {seedResult && (
                <pre className="mt-3 whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border border-gray-200">{seedResult}</pre>
              )}
            </div>
          </div>
        )}

        {/* Quick Tools */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link to="/admin/routes" className="card hover:bg-gray-50">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-indigo-100">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('admin.tools')}</p>
                    <p className="text-lg font-semibold text-gray-900">{t('admin.routeEditor')}</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

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
              <h2 className="card-title">{t('admin.routeManagement')}</h2>
              <button
                onClick={() => setShowAddRoute(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.addRoute')}
              </button>
            </div>
          </div>

          <div className="card-content p-0">
            {/* Add Route Form */}
            {showAddRoute && (
              <div className="border-b border-gray-200 p-6 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('admin.addNewRoute')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('admin.routeName')}</label>
                    <input
                      type="text"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      placeholder={t('admin.routeNamePlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('admin.description')}</label>
                    <input
                      type="text"
                      value={newRoute.description}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, description: e.target.value }))}
                      className="form-input"
                      placeholder={t('admin.descriptionPlaceholder')}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAddRoute(false)}
                    className="btn btn-outline"
                  >
                    {t('admin.cancel')}
                  </button>
                  <button
                    onClick={handleAddRoute}
                    className="btn btn-primary"
                  >
                    {t('admin.addRoute')}
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
                      {t('admin.route')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.reliability')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.safety')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.reports')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routes.map((route: any) => (
                    <tr key={route._id || route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{route.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">{route.score?.reliability ?? '-'}</div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${((route.score?.reliability ?? 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">{route.score?.safety ?? '-'}</div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${((route.score?.safety ?? 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.reportsCount ?? 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (route.status || 'active') === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : (route.status || 'inactive') === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t(`admin.status.${route.status || 'active'}`)}
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
                            onClick={() => handleToggleStatus(route._id || route.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            {(route.status || 'active') === 'active' ? t('admin.deactivate') : t('admin.activate')}
                          </button>
                          <button 
                            onClick={() => handleDeleteRoute(route._id || route.id)}
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
