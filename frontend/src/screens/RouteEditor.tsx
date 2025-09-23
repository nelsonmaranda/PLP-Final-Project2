import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2, ArrowUp, ArrowDown, MapPin, RefreshCw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import apiService from '../services/api'
import { RouteWithScores } from '../types'

interface StopDraft {
  name: string
  coordinates: [number, number]
}

export default function RouteEditor() {
  const [routes, setRoutes] = useState<RouteWithScores[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [stops, setStops] = useState<StopDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [pickIdx, setPickIdx] = useState<number | null>(null)
  const [picked, setPicked] = useState<[number, number] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)

  const tryParseCoords = (q: string): [number, number] | null => {
    const m = q.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
    if (!m) return null
    const a = Number(m[1])
    const b = Number(m[2])
    if (Number.isNaN(a) || Number.isNaN(b)) return null
    // Decide order: if first looks like lat (|a|<=90) and second like lng (|b|<=180), assume "lat,lng"
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
      return [b, a] // store as [lng, lat]
    }
    // Else assume given as lng,lat
    return [a, b]
  }

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      const resp = await apiService.getRoutes({ page: 1, limit: 200, sort: 'name', order: 'asc' })
      if (resp.success && resp.data) {
        setRoutes(resp.data.routes as any)
      } else {
        setRoutes([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const r = routes.find(rt => String(rt._id) === String(selectedRouteId))
    if (r && Array.isArray(r.stops)) {
      const mapped: StopDraft[] = r.stops.map((s: any) => ({ name: s.name || '', coordinates: [s.coordinates?.[0] ?? 0, s.coordinates?.[1] ?? 0] }))
      setStops(mapped)
    } else {
      setStops([])
    }
  }, [selectedRouteId, routes])

  const filteredRoutes = useMemo(() => {
    const q = search.toLowerCase()
    return routes.filter(r => `${r.routeNumber || ''} ${r.name}`.toLowerCase().includes(q))
  }, [routes, search])

  const moveStop = (idx: number, delta: number) => {
    const next = [...stops]
    const swap = idx + delta
    if (swap < 0 || swap >= next.length) return
    const t = next[idx]
    next[idx] = next[swap]
    next[swap] = t
    setStops(next)
  }

  const updateStop = (idx: number, field: 'name' | 'lng' | 'lat', value: string) => {
    setStops(prev => prev.map((s, i) => {
      if (i !== idx) return s
      if (field === 'name') return { ...s, name: value }
      const [lng, lat] = s.coordinates
      const num = Number(value)
      return field === 'lng' ? { ...s, coordinates: [isNaN(num) ? 0 : num, lat] } : { ...s, coordinates: [lng, isNaN(num) ? 0 : num] }
    }))
  }

  const addStop = () => {
    setStops(prev => [...prev, { name: 'New Stop', coordinates: [36.8219, -1.2921] }])
  }

  const removeStop = (idx: number) => {
    setStops(prev => prev.filter((_, i) => i !== idx))
  }

  const saveStops = async () => {
    if (!selectedRouteId) return
    try {
      setSaving(true)
      const payload = { stops: stops.map(s => ({ name: s.name.trim(), coordinates: s.coordinates })) }
      const resp = await apiService.updateRoute(selectedRouteId, payload as any)
      if (!resp.success) throw new Error('Failed')
      await loadRoutes()
      alert('Stops saved')
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const nairobiCenter: [number, number] = [-1.2921, 36.8219]

  function ClickPicker({ initial }: { initial: [number, number] }) {
    useMapEvents({
      click(e) {
        setPicked([e.latlng.lng, e.latlng.lat])
      }
    })
    return picked ? <Marker position={[picked[1], picked[0]]} icon={L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41]
    })} /> : <Marker position={[initial[1], initial[0]]} icon={L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41]
    })} />
  }

  function Recenter({ center }: { center: [number, number] | null }) {
    const map = useMap()
    useEffect(() => {
      if (center) {
        map.flyTo([center[1], center[0]], Math.max(map.getZoom(), 15))
      }
    }, [center, map])
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-2xl font-bold text-gray-900">Route Editor</h1>
            <button onClick={loadRoutes} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-1">
          <div className="mb-3">
            <input className="form-input w-full" placeholder="Search routes" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="max-h-[520px] overflow-auto divide-y">
            {loading ? (
              <div className="p-4 text-gray-500">Loading routes...</div>
            ) : (
              filteredRoutes.map(r => (
                <button key={String(r._id)} className={`w-full text-left p-3 hover:bg-gray-50 ${String(r._id)===String(selectedRouteId)?'bg-blue-50':''}`} onClick={()=>setSelectedRouteId(String(r._id))}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <div className="truncate">
                      <div className="font-medium text-gray-900 truncate">{r.routeNumber ? `${r.routeNumber} - ${r.name}` : r.name}</div>
                      <div className="text-xs text-gray-500">{r.stops?.length || 0} stops</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          {!selectedRouteId ? (
            <div className="text-gray-500">Select a route to edit its stops.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Stops</h2>
                <div className="flex gap-2">
                  <button className="btn btn-outline flex items-center gap-2" onClick={addStop}><Plus className="w-4 h-4"/>Add Stop</button>
                  <button className="btn btn-primary flex items-center gap-2" disabled={saving} onClick={saveStops}><Save className="w-4 h-4"/>{saving?'Saving...':'Save'}</button>
                </div>
              </div>

              <div className="space-y-3">
                {stops.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input className="form-input col-span-4" value={s.name} onChange={e=>updateStop(idx,'name',e.target.value)} />
                    <input className="form-input col-span-3" placeholder="Longitude" value={String(s.coordinates[0])} onChange={e=>updateStop(idx,'lng',e.target.value)} />
                    <input className="form-input col-span-3" placeholder="Latitude" value={String(s.coordinates[1])} onChange={e=>updateStop(idx,'lat',e.target.value)} />
                    <div className="col-span-2 flex justify-end gap-1">
                      <button className="btn btn-outline" onClick={()=>{ setPickIdx(idx); setPicked([s.coordinates[0], s.coordinates[1]]) }} title="Pick on Map"><MapPin className="w-4 h-4"/></button>
                      <button className="btn btn-outline" onClick={()=>moveStop(idx,-1)} title="Move up"><ArrowUp className="w-4 h-4"/></button>
                      <button className="btn btn-outline" onClick={()=>moveStop(idx,1)} title="Move down"><ArrowDown className="w-4 h-4"/></button>
                      <button className="btn btn-outline" onClick={()=>removeStop(idx)} title="Remove"><Trash2 className="w-4 h-4 text-red-600"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map picker modal */}
      {pickIdx !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-4">
            <h3 className="text-lg font-semibold mb-3">Click on the map to set coordinates</h3>
            <div style={{ height: 420 }} className="rounded overflow-hidden">
              <MapContainer center={[stops[pickIdx]?.coordinates?.[1] ?? nairobiCenter[0], stops[pickIdx]?.coordinates?.[0] ?? nairobiCenter[1]]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                <Recenter center={mapCenter} />
                <ClickPicker initial={[stops[pickIdx]?.coordinates?.[0] ?? nairobiCenter[1], stops[pickIdx]?.coordinates?.[1] ?? nairobiCenter[0]]} />
              </MapContainer>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
              <div className="text-sm text-gray-600 md:col-span-1">Picked: {picked ? `${picked[0].toFixed(6)}, ${picked[1].toFixed(6)}` : `${stops[pickIdx].coordinates[0]}, ${stops[pickIdx].coordinates[1]}`}</div>
              <div className="flex items-center gap-2 md:col-span-1">
                <input
                  className="form-input w-full"
                  placeholder="Search place or stop name"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setIsGeocoding(true)
                      try {
                        const parsed = tryParseCoords(searchQuery)
                        if (parsed) {
                          setMapCenter(parsed)
                          setPicked(parsed)
                        } else {
                          const r = await apiService.geocodeAddress(searchQuery)
                          if (r.success && r.data) {
                            const lnglat: [number, number] = [r.data.lng, r.data.lat]
                            setMapCenter(lnglat)
                            setPicked(lnglat)
                          }
                        }
                      } catch {}
                      finally { setIsGeocoding(false) }
                    }
                  }}
                />
                <button
                  className="btn btn-outline"
                  disabled={isGeocoding}
                  onClick={async () => {
                    setIsGeocoding(true)
                    try {
                      const parsed = tryParseCoords(searchQuery)
                      if (parsed) {
                        setMapCenter(parsed)
                        setPicked(parsed)
                      } else {
                        const r = await apiService.geocodeAddress(searchQuery)
                        if (r.success && r.data) {
                          const lnglat: [number, number] = [r.data.lng, r.data.lat]
                          setMapCenter(lnglat)
                          setPicked(lnglat)
                        }
                      }
                    } catch {}
                    finally { setIsGeocoding(false) }
                  }}
                >
                  {isGeocoding ? 'Searching…' : 'Search'}
                </button>
              </div>
              <div className="flex justify-end gap-2 md:col-span-1">
                <button className="btn btn-outline" onClick={()=>{ setPickIdx(null); setPicked(null); setSearchQuery(''); setMapCenter(null) }}>Cancel</button>
                <button className="btn btn-outline" disabled={!picked} title="Apply the geocoded result to this stop" onClick={()=>{ if(!picked) return; const target = picked as [number,number]; updateStop(pickIdx!,'lng', String(target[0])); updateStop(pickIdx!,'lat', String(target[1])); }}>Apply search result</button>
                <button className="btn btn-primary" onClick={()=>{ const target = picked ?? stops[pickIdx!].coordinates as [number,number]; updateStop(pickIdx!,'lng', String(target[0])); updateStop(pickIdx!,'lat', String(target[1])); setPickIdx(null); setPicked(null); setSearchQuery(''); setMapCenter(null) }}>Use pinned location</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


