import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { MapPin, Clock, Star, Users, Filter, List } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

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

L.Marker.prototype.options.icon = DefaultIcon

interface Route {
  id: number
  name: string
  path: [number, number][]
  stops: { name: string; coords: [number, number] }[]
  reliability: number
  safety: number
  fare: number
  waitTime: number
  color: string
}

export default function MapView() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Nairobi coordinates
  const nairobiCenter: [number, number] = [-1.2921, 36.8219]

  // Sample route data
  const sampleRoutes: Route[] = [
    {
      id: 1,
      name: 'Route 42 - Thika Road',
      path: [
        [-1.2921, 36.8219], // CBD
        [-1.2800, 36.8300], // Museum Hill
        [-1.2600, 36.8500], // Thika Road
        [-1.2400, 36.8700], // Garden City
        [-1.2200, 36.8900], // Thika
      ],
      stops: [
        { name: 'CBD', coords: [-1.2921, 36.8219] },
        { name: 'Museum Hill', coords: [-1.2800, 36.8300] },
        { name: 'Garden City', coords: [-1.2400, 36.8700] },
        { name: 'Thika', coords: [-1.2200, 36.8900] },
      ],
      reliability: 4.2,
      safety: 4.5,
      fare: 50,
      waitTime: 5,
      color: '#3b82f6'
    },
    {
      id: 2,
      name: 'Route 17 - Waiyaki Way',
      path: [
        [-1.2921, 36.8219], // CBD
        [-1.2900, 36.8000], // Westlands
        [-1.2850, 36.7800], // Kileleshwa
        [-1.2800, 36.7600], // Lavington
      ],
      stops: [
        { name: 'CBD', coords: [-1.2921, 36.8219] },
        { name: 'Westlands', coords: [-1.2900, 36.8000] },
        { name: 'Kileleshwa', coords: [-1.2850, 36.7800] },
        { name: 'Lavington', coords: [-1.2800, 36.7600] },
      ],
      reliability: 3.8,
      safety: 4.0,
      fare: 40,
      waitTime: 8,
      color: '#22c55e'
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading routes...</p>
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
                    <button className="btn btn-outline btn-sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </button>
                    <button className="btn btn-outline btn-sm">
                      <List className="w-4 h-4 mr-2" />
                      List
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-content p-0">
                <div className="map-container h-96">
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
                    {routes.map((route) => (
                      <div key={route.id}>
                        {/* Route path */}
                        <Polyline
                          positions={route.path}
                          color={route.color}
                          weight={4}
                          opacity={0.8}
                        />
                        
                        {/* Route stops */}
                        {route.stops.map((stop, index) => (
                          <Marker
                            key={index}
                            position={stop.coords}
                            icon={DefaultIcon}
                          >
                            <Popup>
                              <div className="p-2">
                                <h3 className="font-semibold">{stop.name}</h3>
                                <p className="text-sm text-gray-600">{route.name}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </div>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Route List Sidebar */}
          <div className="w-full lg:w-80">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Available Routes</h3>
              </div>
              <div className="card-content p-0">
                <div className="divide-y divide-gray-200">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRoute?.id === route.id ? 'bg-primary-50 border-r-4 border-primary-500' : ''
                      }`}
                      onClick={() => setSelectedRoute(route)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{route.name}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              {route.reliability}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-blue-500 mr-1" />
                              {route.waitTime}min
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-green-500 mr-1" />
                              {route.safety}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            KES {route.fare}
                          </div>
                          <div className="w-4 h-4 rounded-full mt-1" style={{ backgroundColor: route.color }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Route Details */}
            {selectedRoute && (
              <div className="card mt-4">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Route Details</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedRoute.name}</h4>
                      <p className="text-sm text-gray-600">Real-time updates available</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600">{selectedRoute.reliability}</div>
                        <div className="text-sm text-gray-600">Reliability</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-secondary-600">{selectedRoute.safety}</div>
                        <div className="text-sm text-gray-600">Safety</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fare:</span>
                        <span className="font-medium">KES {selectedRoute.fare}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wait Time:</span>
                        <span className="font-medium">{selectedRoute.waitTime} minutes</span>
                      </div>
                    </div>
                    
                    <button className="btn btn-primary w-full">
                      <MapPin className="w-4 h-4 mr-2" />
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
