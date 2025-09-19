import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { MapPin, Clock, Star, Users, Filter, List, AlertCircle } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import apiService from '../services/api'
import { RouteWithScores } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import useOptimizedApi from '../hooks/useOptimizedApi'

// Fix for default markers in react-leaflet
import L from 'leaflet'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Only set the default icon if L is available (not in test environment)
if (typeof L !== 'undefined' && L.Marker) {
  L.Marker.prototype.options.icon = DefaultIcon
}

export default function MapView() {
  const [selectedRoute, setSelectedRoute] = useState<RouteWithScores | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showListView, setShowListView] = useState(false)
  const [filters, setFilters] = useState({
    highReliability: true,
    safeRoutes: true,
    lowFare: false
  })

  // Nairobi coordinates
  const nairobiCenter: [number, number] = [-1.2921, 36.8219]

  // Optimized API call for routes
  const loadRoutes = useCallback(async () => {
    const response = await apiService.getRoutes({
      page: 1,
      limit: 50,
      sort: 'createdAt',
      order: 'desc'
    })

    if (response.success && response.data) {
      // Routes already include scores from the backend
      return response.data.routes
    }
    return []
  }, [])

  const { data: routes, loading: isLoading, error, refetch } = useOptimizedApi(
    loadRoutes,
    [filters], // Re-fetch when filters change
    {
      debounceMs: 500,
      cacheTime: 2 * 60 * 1000, // 2 minutes cache
      retryAttempts: 2
    }
  )

  const filteredRoutes = (routes || []).filter(route => {
    if (filters.highReliability && (!route.score || route.score.reliability < 4)) return false
    if (filters.safeRoutes && (!route.score || route.score.safety < 4)) return false
    if (filters.lowFare && route.fare >= 50) return false
    return true
  })

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return '#22c55e' // green
    if (score >= 3.5) return '#f59e0b' // yellow
    if (score >= 2.5) return '#f97316' // orange
    return '#ef4444' // red
  }

  const getRouteColor = (route: RouteWithScores) => {
    if (route.score) {
      return getScoreColor(route.score.overall)
    }
    return '#3b82f6' // default blue
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading routes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error?.message || 'An error occurred'}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map Container */}
          <div className="flex-1">
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h2 className="card-title">Nairobi Matatu Routes</h2>
                  <div className="flex space-x-2">
                    <button 
                      className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setShowFilters(!showFilters)}
                      aria-label="Toggle filter panel"
                      aria-pressed={showFilters}
                    >
                      <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
                      Filter
                    </button>
                    <button 
                      className={`btn btn-sm ${showListView ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setShowListView(!showListView)}
                      aria-label="Toggle list view"
                      aria-pressed={showListView}
                    >
                      <List className="w-4 h-4 mr-2" aria-hidden="true" />
                      List
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-content p-0">
                {/* Collapsible Filters */}
                {showFilters && (
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-500" aria-hidden="true" />
                        <span className="text-sm font-medium text-gray-700">Quick Filters</span>
                      </div>
                      
                      <fieldset className="flex flex-wrap gap-4">
                        <legend className="sr-only">Route filters</legend>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300" 
                            checked={filters.highReliability}
                            onChange={(e) => setFilters(prev => ({ ...prev, highReliability: e.target.checked }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">High Reliability (4+ stars)</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300" 
                            checked={filters.safeRoutes}
                            onChange={(e) => setFilters(prev => ({ ...prev, safeRoutes: e.target.checked }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">Safe Routes (4+ stars)</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300" 
                            checked={filters.lowFare}
                            onChange={(e) => setFilters(prev => ({ ...prev, lowFare: e.target.checked }))}
                          />
                          <span className="ml-2 text-sm text-gray-600">Low Fare (Under 50 KES)</span>
                        </label>
                      </fieldset>
                    </div>
                  </div>
                )}

                {/* Map or List View */}
                {showListView ? (
                  <div className="p-4">
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-4">
                        {filteredRoutes.length} of {routes?.length || 0} routes
                      </div>
                      {filteredRoutes.map((route) => (
                        <div 
                          key={route._id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedRoute?._id === route._id 
                              ? 'border-primary-500 bg-primary-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedRoute(route)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{route.name}</h4>
                              <p className="text-sm text-gray-600">{route.operator} - Route {route.routeNumber}</p>
                              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                  <span>{route.score?.overall?.toFixed(1) || 'N/A'}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 text-blue-500 mr-1" />
                                  <span>{route.operatingHours.start} - {route.operatingHours.end}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                KES {route.fare}
                              </div>
                              <div 
                                className="w-4 h-4 rounded-full mt-1 ml-auto" 
                                style={{ backgroundColor: getRouteColor(route) }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="map-container h-96" role="img" aria-label="Interactive map showing Nairobi matatu routes">
                    <MapContainer
                      center={nairobiCenter}
                      zoom={11}
                      style={{ height: '100%', width: '100%' }}
                    >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Render routes */}
                    {filteredRoutes.map((route) => (
                      <div key={route._id}>
                        {/* Route path */}
                        <Polyline
                          positions={route.path as [number, number][]}
                          color={getRouteColor(route)}
                          weight={selectedRoute?._id === route._id ? 6 : 4}
                          opacity={selectedRoute?._id === route._id ? 0.8 : 0.6}
                        />
                        
                        {/* Route stops */}
                        {route.stops.map((stop, index) => (
                          <Marker
                            key={index}
                            position={stop.coordinates as [number, number]}
                            icon={DefaultIcon}
                          >
                            <Popup>
                              <div className="p-2">
                                <h3 className="font-semibold">{stop.name}</h3>
                                <p className="text-sm text-gray-600">{route.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{route.operator}</p>
                                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 mr-1 text-yellow-400" />
                                    {route.score?.overall?.toFixed(1) || 'N/A'}
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="h-3 w-3 mr-1" />
                                    {route.score?.safety?.toFixed(1) || 'N/A'}
                                  </div>
                                  <div className="text-gray-600">
                                    {route.fare} KES
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </div>
                    ))}
                    </MapContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Route List Sidebar */}
          <div className="w-full lg:w-80">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Available Routes</h3>
                <p className="text-sm text-gray-600">
                  {filteredRoutes.length} of {routes?.length || 0} routes
                </p>
              </div>
              
              {/* Filters */}
              <div className="p-4 border-b">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-700">Filters</span>
                  </div>
                  
                  <fieldset className="space-y-2">
                    <legend className="sr-only">Route filters</legend>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        checked={filters.highReliability}
                        onChange={(e) => setFilters(prev => ({ ...prev, highReliability: e.target.checked }))}
                        aria-describedby="high-reliability-desc"
                      />
                      <span className="ml-2 text-sm text-gray-600">High Reliability (4+ stars)</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        checked={filters.safeRoutes}
                        onChange={(e) => setFilters(prev => ({ ...prev, safeRoutes: e.target.checked }))}
                        aria-describedby="safe-routes-desc"
                      />
                      <span className="ml-2 text-sm text-gray-600">Safe Routes (4+ stars)</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300" 
                        checked={filters.lowFare}
                        onChange={(e) => setFilters(prev => ({ ...prev, lowFare: e.target.checked }))}
                        aria-describedby="low-fare-desc"
                      />
                      <span className="ml-2 text-sm text-gray-600">Low Fare (Under 50 KES)</span>
                    </label>
                  </fieldset>
                </div>
              </div>
              
              <div className="card-content p-0">
                <div className="divide-y divide-gray-200">
                  {filteredRoutes.map((route) => (
                    <div
                      key={route._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRoute?._id === route._id ? 'bg-primary-50 border-r-4 border-primary-500' : ''
                      }`}
                      onClick={() => setSelectedRoute(route)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedRoute(route)
                        }
                      }}
                      aria-label={`Select route ${route.name} by ${route.operator}`}
                      aria-pressed={selectedRoute?._id === route._id}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{route.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{route.operator}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" aria-hidden="true" />
                              <span aria-label={`Overall rating: ${route.score?.overall?.toFixed(1) || 'N/A'} stars`}>
                                {route.score?.overall?.toFixed(1) || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-blue-500 mr-1" aria-hidden="true" />
                              <span aria-label={`Operating hours: ${route.operatingHours.start} to ${route.operatingHours.end}`}>
                                {route.operatingHours.start} - {route.operatingHours.end}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-green-500 mr-1" aria-hidden="true" />
                              <span aria-label={`Safety rating: ${route.score?.safety?.toFixed(1) || 'N/A'} stars`}>
                                {route.score?.safety?.toFixed(1) || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            KES {route.fare}
                          </div>
                          <div 
                            className="w-4 h-4 rounded-full mt-1" 
                            style={{ backgroundColor: getRouteColor(route) }}
                            aria-label={`Route quality indicator: ${getRouteColor(route)}`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Route Details */}
            {selectedRoute && (
              <div className="card mt-4" role="region" aria-labelledby="route-details-heading">
                <div className="card-header">
                  <h3 id="route-details-heading" className="text-lg font-semibold">Route Details</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedRoute.name}</h4>
                      <p className="text-sm text-gray-600">{selectedRoute.operator}</p>
                      <p className="text-xs text-gray-500 mt-1">Real-time updates available</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600" aria-label={`Reliability score: ${selectedRoute.score?.reliability?.toFixed(1) || 'N/A'} out of 5`}>
                          {selectedRoute.score?.reliability?.toFixed(1) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Reliability</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-secondary-600" aria-label={`Safety score: ${selectedRoute.score?.safety?.toFixed(1) || 'N/A'} out of 5`}>
                          {selectedRoute.score?.safety?.toFixed(1) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Safety</div>
                      </div>
                    </div>
                    
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Fare:</dt>
                        <dd className="font-medium">KES {selectedRoute.fare}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Operating Hours:</dt>
                        <dd className="font-medium">{selectedRoute.operatingHours.start} - {selectedRoute.operatingHours.end}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Stops:</dt>
                        <dd className="font-medium">{selectedRoute.stops.length} stops</dd>
                      </div>
                    </dl>
                    
                    <button 
                      className="btn btn-primary w-full"
                      aria-label="View selected route on map"
                    >
                      <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
                      View on Map
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
