import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
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

function stopIcon(color: string, sequence: number) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);color:white;font-size:11px;font-weight:700">${sequence}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  })
}

const pendingStopIcon = L.divIcon({
  className: '',
  html: `<div style="background:#94a3b8;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><circle cx="12" cy="12" r="3"/></svg>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
})

interface OptimizedRouteMapProps {
  solution: VrpSolution | null
  stops?: VrpStop[]
  depotLat: number
  depotLng: number
}

export default function OptimizedRouteMap({ solution, stops, depotLat, depotLng }: OptimizedRouteMapProps) {
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

        {/* Depot */}
        <Marker position={[depotLat, depotLng]} icon={depotIcon}>
          <Popup><span className="text-[12px] font-bold">Depo</span></Popup>
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

        {/* Routes */}
        {solution?.routes.map((route: VrpRoute, routeIdx: number) => {
          const color = ROUTE_COLORS[routeIdx % ROUTE_COLORS.length]
          const points: [number, number][] = [
            [depotLat, depotLng],
            ...route.stops.map(s => [s.lat, s.lng] as [number, number]),
            [depotLat, depotLng],
          ]

          return (
            <span key={route.vehicleId}>
              {/* Polyline */}
              <Polyline
                positions={points}
                pathOptions={{ color, weight: 4, opacity: 0.85, dashArray: undefined }}
              />

              {/* Stop markers */}
              {route.stops.map(stop => (
                <Marker
                  key={stop.stopId}
                  position={[stop.lat, stop.lng]}
                  icon={stopIcon(color, stop.sequence)}
                >
                  <Popup>
                    <div className="text-[12px] min-w-[160px]">
                      <p className="font-bold text-[13px]">{stop.address}</p>
                      <div className="mt-1 space-y-0.5 text-gray-500">
                        <p>Arac: <span className="font-medium text-gray-700">{route.plateNumber}</span></p>
                        <p>Sira: <span className="font-medium text-gray-700">#{stop.sequence}</span></p>
                        <p>Varis: <span className="font-medium text-gray-700">{stop.arrivalTime}</span></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </span>
          )
        })}
      </MapContainer>

      {/* Legend */}
      {solution && solution.routes.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-4 flex-wrap">
          {solution.routes.map((route, i) => (
            <div key={route.vehicleId} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROUTE_COLORS[i % ROUTE_COLORS.length] }} />
              <span className="text-[12px] text-slate-600 font-medium">{route.plateNumber}</span>
              <span className="text-[11px] text-slate-400">({route.stops.length} durak)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
