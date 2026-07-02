import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { VrpRoute, VrpSolution, VrpStop } from '../../api/routeOptimization'
import 'leaflet/dist/leaflet.css'

const ROUTE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899']

const depotIcon = L.divIcon({
  className: '',
  html: `<div style="background:#111827;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const pendingStopIcon = L.divIcon({
  className: '',
  html: `<div style="background:#94a3b8;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><circle cx="12" cy="12" r="3"/></svg>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
})

// Status-based marker icons
type DeliveryStatus = 'completed' | 'inprogress' | 'failed' | 'pending' | 'current'

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  completed: '#22c55e',
  inprogress: '#f59e0b',
  failed: '#ef4444',
  pending: '#94a3b8',
  current: '#3b82f6',
}

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  completed: 'Tamamlandı',
  inprogress: 'Devam Ediyor',
  failed: 'Başarısız',
  pending: 'Bekliyor',
  current: 'Sürücü Konumu',
}

function statusStopIcon(status: DeliveryStatus, sequence: number) {
  const color = STATUS_COLORS[status]
  const checkSvg = status === 'completed'
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : status === 'failed'
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
    : status === 'current'
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`
    : `<span style="color:white;font-size:11px;font-weight:700">${sequence}</span>`
  const size = status === 'current' ? 32 : 26
  const borderRadius = status === 'current' ? '10px' : '50%'
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:${borderRadius};display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)">${checkSvg}</div>`,
    iconSize: [size, size] as [number, number],
    iconAnchor: [size / 2, size / 2] as [number, number],
    popupAnchor: [0, -(size / 2)] as [number, number],
  })
}

function getStopStatus(sequence: number, totalStops: number): DeliveryStatus {
  // Simulate delivery status based on position in route
  const completedThreshold = Math.floor(totalStops * 0.5)
  if (sequence <= completedThreshold) return 'completed'
  if (sequence === completedThreshold + 1) return 'inprogress'
  if (totalStops > 4 && sequence === totalStops) return 'failed'
  return 'pending'
}

// OSRM routing — gerçek yol güzergahını al
async function fetchRoadRoute(waypoints: [number, number][]): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints
  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
    }
  } catch (e) {
    console.warn('OSRM route fetch failed, falling back to straight line', e)
  }
  return waypoints
}

// Haritayı otomatik zoom/fit et
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [points, map])
  return null
}

// Tek bir rota için OSRM ile gerçek yol çizen bileşen
function RoadRoutePolyline({ waypoints, color }: { waypoints: [number, number][]; color: string }) {
  const [roadPoints, setRoadPoints] = useState<[number, number][]>(waypoints)

  useEffect(() => {
    fetchRoadRoute(waypoints).then(setRoadPoints)
  }, [waypoints])

  return <Polyline positions={roadPoints} pathOptions={{ color, weight: 4, opacity: 0.85 }} />
}

interface OptimizedRouteMapProps {
  solution: VrpSolution | null
  stops?: VrpStop[]
  depotLat: number
  depotLng: number
}

export default function OptimizedRouteMap({ solution, stops, depotLat, depotLng }: OptimizedRouteMapProps) {
  // Tüm noktaları topla (harita zoom/fit için)
  const allPoints: [number, number][] = [[depotLat, depotLng]]
  if (solution) {
    solution.routes.forEach(r => r.stops.forEach(s => allPoints.push([s.lat, s.lng])))
  } else if (stops) {
    stops.forEach(s => allPoints.push([s.lat, s.lng]))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <MapContainer
        center={[depotLat, depotLng]}
        zoom={7}
        style={{ height: 540, width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto fit bounds */}
        <FitBounds points={allPoints} />

        {/* Depot */}
        <Marker position={[depotLat, depotLng]} icon={depotIcon}>
          <Popup><span className="text-[12px] font-bold">Depo (Istanbul)</span></Popup>
        </Marker>

        {/* Pending stops (before optimization) */}
        {!solution && stops?.map(stop => (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={pendingStopIcon}>
            <Popup>
              <div className="text-[12px] min-w-[140px]">
                <p className="font-bold text-[13px]">{stop.address}</p>
                <p className="text-gray-500 mt-1">{stop.demandKg.toLocaleString()} kg / {stop.demandM3} m3</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Optimized routes — OSRM gerçek yol güzergahı */}
        {solution?.routes.map((route: VrpRoute, routeIdx: number) => {
          const color = ROUTE_COLORS[routeIdx % ROUTE_COLORS.length]
          const waypoints: [number, number][] = [
            [depotLat, depotLng],
            ...route.stops.map(s => [s.lat, s.lng] as [number, number]),
            [depotLat, depotLng],
          ]

          return (
            <span key={route.vehicleId}>
              {/* Gerçek yol güzergahı */}
              <RoadRoutePolyline waypoints={waypoints} color={color} />

              {/* Stop markers with status colors */}
              {route.stops.map(stop => {
                const status = getStopStatus(stop.sequence, route.stops.length)
                return (
                  <Marker
                    key={stop.stopId}
                    position={[stop.lat, stop.lng]}
                    icon={statusStopIcon(status, stop.sequence)}
                  >
                    <Popup>
                      <div className="text-[12px] min-w-[160px]">
                        <p className="font-bold text-[13px]">{stop.address}</p>
                        <div className="mt-1 space-y-0.5 text-gray-500">
                          <p>Durum: <span className="font-medium" style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</span></p>
                          <p>Arac: <span className="font-medium text-gray-700">{route.plateNumber}</span></p>
                          <p>Sira: <span className="font-medium text-gray-700">#{stop.sequence}</span></p>
                          <p>Varış: <span className="font-medium text-gray-700">{stop.arrivalTime}</span></p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </span>
          )
        })}
      </MapContainer>

      {/* Legend */}
      {solution && solution.routes.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100">
          {/* Route colors */}
          <div className="flex items-center gap-4 flex-wrap mb-2">
            {solution.routes.map((route, i) => (
              <div key={route.vehicleId} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROUTE_COLORS[i % ROUTE_COLORS.length] }} />
                <span className="text-[12px] text-slate-600 font-medium">{route.plateNumber}</span>
                <span className="text-[11px] text-slate-400">({route.stops.length} durak, {route.totalDistanceKm.toFixed(0)} km)</span>
              </div>
            ))}
          </div>
          {/* Status legend */}
          <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-slate-50">
            {(Object.keys(STATUS_COLORS) as DeliveryStatus[]).map(status => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                <span className="text-[11px] text-slate-500">{STATUS_LABELS[status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
