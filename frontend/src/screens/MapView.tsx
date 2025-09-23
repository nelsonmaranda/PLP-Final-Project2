import { useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
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
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [showOnlySelectedOnMap, setShowOnlySelectedOnMap] = useState(false)

  // Helper component to capture map instance from react-leaflet
  function MapInstanceSetter() {
    const map = useMap()
    if (mapInstance !== map) {
      setMapInstance(map)
    }
    return null
  }

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

  const filteredRoutes = (() => {
    try {
      return (routes || []).filter(route => {
        // Only apply filters if they are checked
        if (filters.highReliability) {
          if (!route.score || typeof route.score.reliability !== 'number' || route.score.reliability < 4) {
            return false
          }
        }
        if (filters.safeRoutes) {
          if (!route.score || typeof route.score.safety !== 'number' || route.score.safety < 4) {
            return false
          }
        }
        if (filters.lowFare) {
          if (typeof route.fare !== 'number' || route.fare >= 50) {
            return false
          }
        }
        return true
      })
    } catch (error) {
      console.error('Error filtering routes:', error)
      // Return all routes if filtering fails
      return routes || []
    }
  })()

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

  const getRouteId = (route?: { _id?: any } | null): string => {
    if (!route || route._id == null) return ''
    return String(route._id)
  }

  const getRouteLatLngs = (route: RouteWithScores): [number, number][] => {
    // Prefer path; fallback to stops
    const latlngs: [number, number][] = []
    if (route.path && Array.isArray(route.path) && route.path.length > 0) {
      for (let i = 0; i < route.path.length; i += 2) {
        if (i + 1 < route.path.length) {
          const lat = route.path[i + 1]
          const lng = route.path[i]
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            latlngs.push([lat, lng])
          }
        }
      }
    }
    if (latlngs.length === 0 && route.stops && Array.isArray(route.stops)) {
      for (const stop of route.stops) {
        const c = stop?.coordinates
        if (Array.isArray(c) && c.length === 2 && typeof c[0] === 'number' && typeof c[1] === 'number') {
          // stored as [lng, lat]
          latlngs.push([c[1], c[0]])
        }
      }
    }
    return latlngs
  }

  const focusRouteOnMap = (route: RouteWithScores) => {
    setSelectedRoute(route)
    // Ensure the main card is showing the map (not list)
    setShowListView(false)
    setShowOnlySelectedOnMap(true)
    const latlngs = getRouteLatLngs(route)
    if (mapInstance && latlngs.length > 0) {
      const bounds = L.latLngBounds(latlngs.map(([lat, lng]) => L.latLng(lat, lng)))
      mapInstance.fitBounds(bounds, { padding: [40, 40] })
    }
    // Scroll the map into view for better UX
    try {
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch {}
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
                            getRouteId(selectedRoute) === getRouteId(route)
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
                  <div ref={mapContainerRef} className="map-container h-96" role="img" aria-label="Interactive map showing Nairobi matatu routes">
                    <MapContainer
                      center={nairobiCenter}
                      zoom={11}
                      style={{ height: '100%', width: '100%' }}
                    >
                    <MapInstanceSetter />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Render routes */}
                    {filteredRoutes
                      .filter((route) => !showOnlySelectedOnMap || getRouteId(selectedRoute) === getRouteId(route))
                      .map((route) => {
                      try {
                        // Safely process route path - convert flattened array to coordinate pairs
                        const routePath: [number, number][] = []
                        if (route.path && Array.isArray(route.path) && route.path.length > 0) {
                          for (let i = 0; i < route.path.length; i += 2) {
                            if (i + 1 < route.path.length) {
                              const lat = route.path[i + 1]
                              const lng = route.path[i]
                              if (typeof lat === 'number' && typeof lng === 'number' && 
                                  !isNaN(lat) && !isNaN(lng)) {
                                routePath.push([lat, lng])
                              }
                            }
                          }
                        }

                        return (
                          <div key={route._id}>
                            {/* Route path */}
                            {routePath.length > 0 && (
                              <Polyline
                                positions={routePath}
                                color={getRouteColor(route)}
                                weight={getRouteId(selectedRoute) === getRouteId(route) ? 7 : 4}
                                opacity={getRouteId(selectedRoute) === getRouteId(route) ? 0.95 : 0.3}
                              />
                            )}
                        
                            {/* Route stops */}
                            {route.stops && Array.isArray(route.stops) && route.stops.map((stop, index) => {
                              try {
                                const coords = stop.coordinates
                                if (!coords || !Array.isArray(coords) || coords.length !== 2) {
                                  return null
                                }
                                const [lat, lng] = coords
                                if (typeof lat !== 'number' || typeof lng !== 'number' || 
                                    isNaN(lat) || isNaN(lng)) {
                                  return null
                                }
                                
                                return (
                                  <Marker
                                    key={index}
                                    position={[lat, lng]}
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
                                )
                              } catch (error) {
                                console.error('Error rendering stop:', error)
                                return null
                              }
                            })}
                          </div>
                        )
                      } catch (error) {
                        console.error('Error rendering route:', error)
                        return null
                      }
                    })}
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

                      {/* Inline expandable details */}
                      {getRouteId(selectedRoute) === getRouteId(route) && (
                        <div className="mt-3 pt-3 border-t">
                          <dl className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between"><dt className="text-gray-600">Fare</dt><dd className="font-medium">KES {route.fare}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-600">Hours</dt><dd className="font-medium">{route.operatingHours.start} - {route.operatingHours.end}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-600">Stops</dt><dd className="font-medium">{route.stops?.length || 0}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-600">Route No.</dt><dd className="font-medium">{route.routeNumber || '—'}</dd></div>
                          </dl>
                          <div className="mt-3 flex gap-2 items-center flex-wrap">
                            <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); focusRouteOnMap(route) }}>
                              <MapPin className="w-4 h-4 mr-1" /> View on Map
                            </button>
                            {/* Quick rating: 1-5 overall */}
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map((v) => (
                                <button
                                  key={v}
                                  className="p-1"
                                  title={`Rate ${v}`}
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      await apiService.rateRoute(route._id, { overall: v })
                                      // Optimistically update UI
                                      setSelectedRoute(prev => prev && prev._id === route._id ? { ...prev, score: { ...(prev.score || {}), overall: ((prev.score?.overall || 0) + v) / 2 } } as any : prev)
                                      refetch()
                                    } catch (err) {
                                      console.error('Rating failed', err)
                                      alert('Failed to submit rating')
                                    }
                                  }}
                                >
                              <Star className={`w-5 h-5 ${(Number(selectedRoute?.score?.overall) >= v) ? 'text-yellow-500' : 'text-gray-300'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inline details are shown within each route item; footer panel removed */}
          </div>
        </div>
      </div>
    </div>
  )
}
