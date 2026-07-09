import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, Calendar, Upload, Truck, Package, Route, MapPin,
  ChevronLeft, ChevronRight, Plus, Trash2, Copy, XCircle,
  CheckSquare, Square, Clock,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import Badge from '../components/ui/Badge'
import TimelineView from '../components/route-optimizer/TimelineView'
import { routeOptimizationApi } from '../api/routeOptimization'
import { ordersApi } from '../api/orders'
import { toast } from '../components/ui/Toast'
import type { VrpVehicle, VrpSolution, VrpRoute } from '../api/routeOptimization'
import type { Order } from '../types'
import 'leaflet/dist/leaflet.css'

const ROUTE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899']

const depotLat = 41.0082
const depotLng = 28.9784

// --- Leaflet Icons ---
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

function makeStopIcon(color: string, seq: number) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);color:white;font-size:10px;font-weight:700">${seq}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

function makeClusterIcon(count: number) {
  const size = count >= 10 ? 42 : count >= 5 ? 34 : 28
  return L.divIcon({
    className: '',
    html: `<div style="background:linear-gradient(135deg,#3b82f6,#06b6d4);width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.4);color:white;font-size:${count >= 10 ? 13 : 12}px;font-weight:700">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// --- OSRM Routing ---
async function fetchRoadRoute(waypoints: [number, number][]): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints
  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';')
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
    const data = await res.json()
    if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number])
    }
  } catch { /* fallback */ }
  return waypoints
}

function RoadPolyline({ waypoints, color }: { waypoints: [number, number][]; color: string }) {
  const [pts, setPts] = useState<[number, number][]>(waypoints)
  useEffect(() => { fetchRoadRoute(waypoints).then(setPts) }, [waypoints])
  return <Polyline positions={pts} pathOptions={{ color, weight: 4, opacity: 0.85 }} />
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map(p => L.latLng(p[0], p[1]))), { padding: [40, 40], maxZoom: 12 })
    }
  }, [points, map])
  return null
}

// --- Helper: format date ---
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// --- Main Page ---
export default function PlanOptimizePage() {
  const navigate = useNavigate()

  // Date picker
  const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()))

  // Data
  const [orders, setOrders] = useState<Order[]>([])
  const [vehicles, setVehicles] = useState<VrpVehicle[]>([])
  const [solution, setSolution] = useState<VrpSolution | null>(null)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // UI state
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [bottomTab, setBottomTab] = useState<'orders' | 'routes' | 'timeline'>('orders')
  const [checkedOrderIds, setCheckedOrderIds] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Load orders for selected date
  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true)
    try {
      const res = await ordersApi.getAll({ page: 1, pageSize: 200 })
      if (res.success && res.data) {
        setOrders(res.data.items || [])
      }
    } catch {
      toast('error', 'Siparişler yüklenemedi')
    } finally {
      setIsLoadingOrders(false)
    }
  }, [])

  // Load vehicles/drivers
  const loadVehicles = useCallback(async () => {
    setIsLoadingVehicles(true)
    try {
      const res = await routeOptimizationApi.getVehicles()
      if (res.success && res.data) {
        const v = Array.isArray(res.data) ? res.data : []
        setVehicles(v)
        setSelectedDrivers(new Set(v.filter(d => d.available).map(d => d.id)))
      }
    } catch { /* fallback */ }
    finally { setIsLoadingVehicles(false) }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders, selectedDate])
  useEffect(() => { loadVehicles() }, [loadVehicles])

  // Adım-tabanlı görünüm: 3. adımda otomatik "Rotalar" sekmesi.
  useEffect(() => {
    setBottomTab(step === 3 ? 'routes' : 'orders')
  }, [step])

  // Computed
  // Planlanabilir = koordinatı olan + terminal durumda (teslim/iptal/başarısız) olmayan siparişler.
  // Not: durum string'ine (Pending/Draft/ReadyForShipment...) bağlı DEĞİL — plan durumu solution'dan gelir.
  const plannableOrders = useMemo(
    () => orders.filter(o =>
      (o.destinationLat || o.originLat) && (o.destinationLng || o.originLng) &&
      o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Failed'),
    [orders])

  const routeCount = solution?.routes.length || 0

  // Map: assign orders to solution routes for coloring
  const orderDriverMap = useMemo(() => {
    const map = new Map<string, { color: string; seq: number; plateNumber: string }>()
    if (solution) {
      solution.routes.forEach((route, ri) => {
        route.stops.forEach((stop) => {
          map.set(stop.stopId, {
            color: ROUTE_COLORS[ri % ROUTE_COLORS.length],
            seq: stop.sequence,
            plateNumber: route.plateNumber,
          })
        })
      })
    }
    return map
  }, [solution])

  // Plan durumu solution'a göre: atanan = planlanmış, kalan planlanabilir = planlanmamış.
  const unscheduledCount = plannableOrders.filter(o => !orderDriverMap.has(o.id)).length

  // Map points for bounds
  const allMapPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [[depotLat, depotLng]]
    orders.forEach(o => {
      const lat = o.destinationLat || o.originLat
      const lng = o.destinationLng || o.originLng
      if (lat && lng) pts.push([lat, lng])
    })
    if (solution) {
      solution.routes.forEach(r => r.stops.forEach(s => pts.push([s.lat, s.lng])))
    }
    return pts
  }, [orders, solution])

  // Şehir bazında kümeleme — 200 marker yerine şehir başına 1 küme + sayı (harita "marker çorbası"nı önler).
  const cityGroups = useMemo(() => {
    const groups = new Map<string, { city: string; lat: number; lng: number; count: number }>()
    orders.forEach(o => {
      const lat = o.destinationLat || o.originLat
      const lng = o.destinationLng || o.originLng
      if (!lat || !lng) return
      const city = o.destinationCity || o.originCity || 'Bilinmeyen'
      const g = groups.get(city)
      if (g) { g.lat += lat; g.lng += lng; g.count++ }
      else groups.set(city, { city, lat, lng, count: 1 })
    })
    return Array.from(groups.values()).map(g => ({ city: g.city, lat: g.lat / g.count, lng: g.lng / g.count, count: g.count }))
  }, [orders])

  // Optimize handler
  const handlePlanRoutes = async () => {
    const activeVehicles = vehicles.filter(v => selectedDrivers.has(v.id) && v.available)
    if (activeVehicles.length === 0) {
      toast('warning', 'En az 1 sürücü seçmelisiniz')
      return
    }
    const stopsToOptimize = plannableOrders
      .filter(o => !orderDriverMap.has(o.id))
      .map(o => ({
        id: o.id,
        address: `${o.customerName} - ${o.destinationCity || o.originCity || ''}`,
        lat: (o.destinationLat || o.originLat)!,
        lng: (o.destinationLng || o.originLng)!,
        demandKg: o.totalWeightKg || 0,
        demandM3: o.totalVolumeM3 || 0,
        serviceDurationMin: 15,
      }))

    if (stopsToOptimize.length === 0) {
      toast('warning', 'Optimize edilecek koordinatli sipariş yok')
      return
    }

    setIsOptimizing(true)
    setSolution(null)
    try {
      const res = await routeOptimizationApi.solve({
        vehicles: activeVehicles,
        stops: stopsToOptimize,
        depotLat,
        depotLng,
      })
      if (res.success && res.data) {
        setSolution(res.data)
        toast('success', `${res.data.routes.length} rota oluşturuldu!`)
        setBottomTab('routes')
      } else {
        toast('error', res.message || 'Optimizasyon başarısız')
      }
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Optimizasyon hatası')
    } finally {
      setIsOptimizing(false)
    }
  }

  // Driver toggle
  const toggleDriver = (id: string) => {
    setSelectedDrivers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allDriversSelected = vehicles.length > 0 && selectedDrivers.size === vehicles.length
  const toggleAllDrivers = () => {
    setSelectedDrivers(allDriversSelected ? new Set() : new Set(vehicles.map(v => v.id)))
  }

  // Order check toggle
  const toggleOrderCheck = (id: string) => {
    setCheckedOrderIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllOrders = () => {
    if (checkedOrderIds.size === orders.length) setCheckedOrderIds(new Set())
    else setCheckedOrderIds(new Set(orders.map(o => o.id)))
  }

  // Delete checked orders
  const handleDeleteChecked = () => {
    if (checkedOrderIds.size === 0) return
    toast('info', `${checkedOrderIds.size} sipariş silme işlemi henüz API desteklemiyor`)
  }

  // Unschedule checked
  const handleUnscheduleChecked = async () => {
    for (const id of checkedOrderIds) {
      try { await ordersApi.updateStatus(id, 'Pending') } catch { /* skip */ }
    }
    toast('success', `${checkedOrderIds.size} sipariş planlamadan çıkarıldı`)
    setCheckedOrderIds(new Set())
    loadOrders()
  }

  // Date navigation
  const prevDate = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(fmtDate(d))
  }
  const nextDate = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(fmtDate(d))
  }

  const priorityVariant: Record<string, 'default' | 'warning' | 'error'> = { Normal: 'default', Priority: 'warning', Urgent: 'error' }
  const fmtDateTime = (s?: string | null) => {
    if (!s) return '-'
    const d = new Date(s)
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ── Top Bar ── */}
      <div className="shrink-0 px-5 py-3 bg-white border-b border-slate-200/60 flex items-center justify-end gap-4 flex-wrap">
        {/* Date picker + actions */}
        <div className="flex items-center gap-3">
          {/* Date picker */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button onClick={prevDate} className="p-1.5 rounded-md hover:bg-white transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="pl-8 pr-2 py-1.5 bg-white rounded-md border-none text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
              />
            </div>
            <button onClick={nextDate} className="p-1.5 rounded-md hover:bg-white transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <button
            onClick={() => toast('info', 'Import modal henüz eklenmedi')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Sipariş Aktar
          </button>
        </div>
      </div>

      {/* ── Main Content: Left Panel + Map ── */}
      <div className="flex flex-1 min-h-0">
        {/* Center: Map + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Map */}
          <div className="flex-1 min-h-[300px] relative">
            {isLoadingOrders && (
              <div className="absolute inset-0 bg-white/60 z-[1000] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
              </div>
            )}
            <MapContainer
              center={[depotLat, depotLng]}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={allMapPoints} />

              {/* Depot */}
              <Marker position={[depotLat, depotLng]} icon={depotIcon}>
                <Popup><span className="text-[12px] font-bold">Depo</span></Popup>
              </Marker>

              {/* Şehir bazında kümelenmiş sipariş marker'ları (solution yokken) */}
              {!solution && cityGroups.map(g => (
                <Marker key={g.city} position={[g.lat, g.lng]} icon={makeClusterIcon(g.count)}>
                  <Popup>
                    <div className="text-[11px]">
                      <p className="font-bold text-[12px]">{g.city}</p>
                      <p className="text-gray-500">{g.count} sipariş</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Optimized routes */}
              {solution?.routes.map((route: VrpRoute, ri: number) => {
                if (!selectedDrivers.has(route.vehicleId)) return null
                const color = ROUTE_COLORS[ri % ROUTE_COLORS.length]
                const waypoints: [number, number][] = [
                  [depotLat, depotLng],
                  ...route.stops.map(s => [s.lat, s.lng] as [number, number]),
                  [depotLat, depotLng],
                ]
                return (
                  <span key={route.vehicleId}>
                    <RoadPolyline waypoints={waypoints} color={color} />
                    {route.stops.map(stop => (
                      <Marker key={stop.stopId} position={[stop.lat, stop.lng]} icon={makeStopIcon(color, stop.sequence)}>
                        <Popup>
                          <div className="text-[11px] min-w-[140px]">
                            <p className="font-bold text-[12px]">{stop.address}</p>
                            <p className="text-gray-500 mt-0.5">Araç: {route.plateNumber}</p>
                            <p className="text-gray-500">Sıra: #{stop.sequence}</p>
                            <p className="text-gray-500">Varış: {stop.arrivalTime}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </span>
                )
              })}
            </MapContainer>

            {/* Route legend overlay */}
            {solution && solution.routes.length > 0 && (
              <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg px-3 py-2 flex flex-wrap gap-3 max-w-[400px]">
                {solution.routes.map((route, i) => (
                  <div key={route.vehicleId} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ROUTE_COLORS[i % ROUTE_COLORS.length] }} />
                    <span className="text-[10px] text-slate-600 font-medium">{route.plateNumber}</span>
                    <span className="text-[9px] text-slate-400">({route.stops.length})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Stepper (harita ile liste ARASINDA) — adım-adım akış ── */}
          <div className="shrink-0 px-5 py-2 bg-white border-t border-slate-200/60 flex items-center gap-2 flex-wrap">
            {([
              { n: 1 as const, label: 'Siparişleri Seç' },
              { n: 2 as const, label: 'Sürücüleri Seç' },
              { n: 3 as const, label: 'Planla & Rotalar' },
            ]).map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(s.n)}
                  className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                    step === s.n ? 'bg-orange-500 text-white' : step > s.n ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full grid place-items-center text-[11px] ${step === s.n ? 'bg-white/25' : step > s.n ? 'bg-orange-100 text-orange-600' : 'bg-white text-slate-400'}`}>{s.n}</span>
                  {s.label}
                </button>
                {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {step > 1 && (
                <button onClick={() => setStep((step - 1) as 1 | 2 | 3)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">← Geri</button>
              )}
              {step === 1 && (
                <button onClick={() => setStep(2)} className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-[12px] font-semibold hover:bg-slate-900 transition-colors">İleri: Sürücüler →</button>
              )}
              {step === 2 && (
                <button
                  onClick={() => { setStep(3); handlePlanRoutes() }}
                  disabled={isOptimizing || unscheduledCount === 0 || selectedDrivers.size === 0}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[12px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all"
                >
                  {isOptimizing ? 'Planlanıyor...' : 'İleri: Rotaları Planla →'}
                </button>
              )}
              {step === 3 && (
                <button onClick={() => { setSolution(null); setStep(1) }} className="px-4 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">↺ Yeni Plan</button>
              )}
            </div>
          </div>

          {/* ── Adım 2: Sürücü seçimi (alt panel, grid — solda sidebar YOK) ── */}
          {step === 2 ? (
            <div className="shrink-0 bg-white border-t border-slate-200/60 flex flex-col" style={{ height: 320 }}>
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-500" />
                <span className="text-[13px] font-semibold text-slate-700">Sürücüler</span>
                <span className="text-[11px] text-slate-400">· {selectedDrivers.size}/{vehicles.length} seçili</span>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={toggleAllDrivers} className="text-[12px] font-medium text-orange-500 hover:bg-orange-50 px-2.5 py-1 rounded-lg transition-colors">
                    {allDriversSelected ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
                  </button>
                  <button onClick={() => navigate('/fleet')} className="flex items-center gap-1 text-[12px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Sürücü Ekle
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {isLoadingVehicles ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-8 text-[12px] text-slate-400">Sürücü bulunamadı</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {vehicles.map((v, idx) => {
                      const color = ROUTE_COLORS[idx % ROUTE_COLORS.length]
                      const isSelected = selectedDrivers.has(v.id)
                      return (
                        <button
                          key={v.id}
                          onClick={() => toggleDriver(v.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${isSelected ? 'bg-orange-50 border border-orange-200' : 'border border-slate-200 hover:bg-slate-50'} ${!v.available ? 'opacity-40' : ''}`}
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-orange-500 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-medium text-slate-700 truncate">Sürücü {idx + 1}</div>
                            <div className="text-[10px] text-slate-400 truncate">{v.plateNumber} · {v.capacityKg.toLocaleString()} kg · {v.capacityM3} m³</div>
                          </div>
                          <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded ${v.available ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                            {v.available ? 'Müsait' : 'Meşgul'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
          <div className="shrink-0 bg-white border-t border-slate-200/60" style={{ height: 320 }}>
            {/* Tab bar */}
            <div className="flex items-center justify-between px-4 border-b border-slate-100">
              <div className="flex">
                {([
                  { key: 'orders' as const, label: 'Siparişler', icon: Package, count: orders.length },
                  { key: 'routes' as const, label: 'Rotalar', icon: Route, count: routeCount },
                  { key: 'timeline' as const, label: 'Zaman Cizelgesi', icon: Clock, count: undefined },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setBottomTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all ${
                      bottomTab === tab.key
                        ? 'border-orange-400 text-orange-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        bottomTab === tab.key ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Actions */}
              {bottomTab === 'orders' && checkedOrderIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => toast('info', 'Kopyalama henüz eklenmedi')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Kopyala">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleUnscheduleChecked} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Planlamadan Cikar">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleDeleteChecked} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Sil">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-400 ml-1">{checkedOrderIds.size} seçili</span>
                </div>
              )}

              {bottomTab === 'orders' && (
                <button
                  onClick={() => toast('info', 'Yeni sipariş ekleme OrdersPage üzerinden yapılabilir')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Ekle
                </button>
              )}
            </div>

            {/* Tab content */}
            <div className="overflow-auto" style={{ height: 'calc(100% - 41px)' }}>
              {/* Orders Tab */}
              {bottomTab === 'orders' && (
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr className="border-b border-slate-100">
                      <th className="w-8 px-2 py-2">
                        <input
                          type="checkbox"
                          checked={orders.length > 0 && checkedOrderIds.size === orders.length}
                          onChange={toggleAllOrders}
                          className="w-3 h-3 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20"
                        />
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Sipariş No</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Öncelik</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Konum</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Adres</th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Süre</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Zaman Aralığı</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Atanan Sürücü</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Durak #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => {
                      const assignment = orderDriverMap.get(o.id)
                      return (
                        <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="w-8 px-2 py-2">
                            <input
                              type="checkbox"
                              checked={checkedOrderIds.has(o.id)}
                              onChange={() => toggleOrderCheck(o.id)}
                              className="w-3 h-3 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-700 font-medium">{o.orderNumber}</td>
                          <td className="px-3 py-2">
                            <Badge variant={priorityVariant[o.priority]}>{o.priority}</Badge>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{o.destinationCity || o.originCity}</td>
                          <td className="px-3 py-2 text-slate-500 max-w-[180px] truncate">{o.destinationAddress || o.originAddress || '-'}</td>
                          <td className="px-3 py-2 text-right text-slate-500">15 dk</td>
                          <td className="px-3 py-2 text-slate-500">{fmtDateTime(o.requestedDeliveryDate)}</td>
                          <td className="px-3 py-2 text-center">
                            {assignment ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: assignment.color }} />
                                <span className="text-slate-600 font-medium">{assignment.plateNumber}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Atanmadı</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-500">
                            {assignment ? `#${assignment.seq}` : '-'}
                          </td>
                        </tr>
                      )
                    })}
                    {orders.length === 0 && !isLoadingOrders && (
                      <tr><td colSpan={9} className="px-6 py-8 text-center text-[13px] text-slate-400">Sipariş bulunamadı</td></tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Routes Tab */}
              {bottomTab === 'routes' && (
                <>
                  {!solution ? (
                    <div className="flex items-center justify-center py-12 text-[13px] text-slate-400">
                      <MapPin className="w-5 h-5 mr-2 text-slate-300" />
                      Henüz rota planlanmadı - yukarıdaki "Rotaları Planla" butonunu kullanın
                    </div>
                  ) : (
                    <table className="w-full text-[12px]">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr className="border-b border-slate-100">
                          <th className="w-8 px-2 py-2"></th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Sürücü / Araç</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Teslimat Durumu</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Mesafe</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Süre</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Kullanım %</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-400 uppercase text-[10px]">Maliyet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solution.routes.map((route, ri) => {
                          const color = ROUTE_COLORS[ri % ROUTE_COLORS.length]
                          const totalStops = route.stops.length
                          // Simulate delivery progress per route for visual demo
                          const completed = Math.floor(totalStops * 0.5)
                          const inProgress = totalStops > 1 ? 1 : 0
                          const failed = totalStops > 3 ? 1 : 0
                          const pending = totalStops - completed - inProgress - failed
                          const completionPct = totalStops > 0 ? Math.round((completed / totalStops) * 100) : 0
                          return (
                            <tr key={route.vehicleId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="w-8 px-2 py-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-slate-700 font-medium">{ri + 1}. {route.plateNumber}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Sürücü {ri + 1}</div>
                              </td>
                              <td className="px-3 py-3 min-w-[220px]">
                                {/* Completion text */}
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] text-slate-500">{completed}/{totalStops} durak tamamlandı</span>
                                  <span className="text-[11px] font-semibold" style={{ color }}>{completionPct}%</span>
                                </div>
                                {/* Progress bar gradient */}
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                  {completed > 0 && (
                                    <div className="h-full bg-green-500" style={{ width: `${(completed / totalStops) * 100}%` }} />
                                  )}
                                  {inProgress > 0 && (
                                    <div className="h-full bg-amber-400" style={{ width: `${(inProgress / totalStops) * 100}%` }} />
                                  )}
                                  {failed > 0 && (
                                    <div className="h-full bg-red-500" style={{ width: `${(failed / totalStops) * 100}%` }} />
                                  )}
                                  {pending > 0 && (
                                    <div className="h-full bg-slate-200" style={{ width: `${(pending / totalStops) * 100}%` }} />
                                  )}
                                </div>
                                {/* Status dots */}
                                <div className="flex items-center gap-2.5 mt-1.5">
                                  <span className="flex items-center gap-1 text-[10px] text-green-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{completed}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-amber-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />{inProgress}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-red-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />{failed}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />{pending}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right text-slate-600">{route.totalDistanceKm.toFixed(1)} km</td>
                              <td className="px-3 py-3 text-right text-slate-600">{Math.round(route.totalDurationMin)} dk</td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${route.utilizationPercent > 80 ? 'bg-green-500' : route.utilizationPercent > 50 ? 'bg-orange-400' : 'bg-blue-400'}`}
                                      style={{ width: `${route.utilizationPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-slate-600 font-medium">{route.utilizationPercent}%</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right text-slate-600 font-medium">{route.totalCost.toLocaleString()} TRY</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-semibold text-slate-700">
                          <td colSpan={2} className="px-3 py-2 text-[11px] uppercase">Toplam</td>
                          <td className="px-3 py-2 text-[11px]">
                            <span className="text-slate-500">{solution.routes.reduce((a, r) => a + r.stops.length, 0)} durak</span>
                          </td>
                          <td className="px-3 py-2 text-right">{solution.totalDistanceKm.toFixed(1)} km</td>
                          <td className="px-3 py-2 text-right">{Math.round(solution.totalDurationMin)} dk</td>
                          <td className="px-3 py-2 text-right">{solution.vehicleUtilization}%</td>
                          <td className="px-3 py-2 text-right">{solution.totalCost.toLocaleString()} TRY</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </>
              )}

              {/* Timeline Tab */}
              {bottomTab === 'timeline' && (
                <div className="p-3">
                  <TimelineView routes={solution?.routes || []} />
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
