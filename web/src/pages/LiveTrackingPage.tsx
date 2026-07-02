import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { Truck, Clock, AlertTriangle, CheckCircle, XCircle, MapPin, Loader2, Users } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import 'leaflet/dist/leaflet.css'

// Truck icon for markers
const truckIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="background:${color};width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const pinIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

type DriverStatus = 'OnRoute' | 'Scheduled' | 'Servicing' | 'Completed' | 'Failed'
type ViewMode = 'planned' | 'actual'

interface DriverLocation {
  id: string
  name: string
  phone: string
  plateNumber: string
  status: DriverStatus
  lat: number
  lng: number
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  route: string
  progress: number
  eta: string
  lastUpdate: string
  shipmentNo: string
  distanceKm: number
  timeWorkedMin: number
}

interface DelayAlert {
  id: string
  driverName: string
  shipmentNumber: string
  delayMinutes: number
  reason: string
  createdAt: string
}

interface SafetyDashboard {
  totalDrivers: number
  onDutyCount: number
  offDutyCount: number
  runningLateCount: number
  completedToday: number
  failedToday: number
}

const statusColors: Record<DriverStatus, string> = {
  OnRoute: '#f97316',
  Scheduled: '#3b82f6',
  Servicing: '#8b5cf6',
  Completed: '#22c55e',
  Failed: '#ef4444',
}

const statusLabelsMap: Record<DriverStatus, string> = {
  OnRoute: 'Rotada',
  Scheduled: 'Planli',
  Servicing: 'Serviste',
  Completed: 'Tamamlandı',
  Failed: 'Başarısız',
}

const filterChips: { key: DriverStatus | 'all'; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'all', label: 'Tümü', icon: Users, color: 'text-slate-600' },
  { key: 'Failed', label: 'Başarısız', icon: XCircle, color: 'text-red-500' },
  { key: 'OnRoute', label: 'Rotada', icon: Truck, color: 'text-orange-500' },
  { key: 'Scheduled', label: 'Planlı', icon: Clock, color: 'text-blue-500' },
  { key: 'Servicing', label: 'Serviste', icon: MapPin, color: 'text-purple-500' },
  { key: 'Completed', label: 'Tamamlandı', icon: CheckCircle, color: 'text-green-500' },
]

export default function LiveTrackingPage() {
  const { t } = useI18n()
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('actual')
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)

  const [drivers, setDrivers] = useState<DriverLocation[]>([])
  const [delayAlerts, setDelayAlerts] = useState<DelayAlert[]>([])
  const [safety, setSafety] = useState<SafetyDashboard>({
    totalDrivers: 0, onDutyCount: 0, offDutyCount: 0, runningLateCount: 0, completedToday: 0, failedToday: 0,
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [safetyRes, alertsRes, driversRes] = await Promise.allSettled([
        api.get('/safety/dashboard').then(r => r.data),
        api.get('/tracking/delay-alerts').then(r => r.data),
        api.get('/mobile/drivers').then(r => r.data),
      ])

      if (safetyRes.status === 'fulfilled' && safetyRes.value?.data) {
        setSafety(safetyRes.value.data)
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value?.data) {
        setDelayAlerts(Array.isArray(alertsRes.value.data) ? alertsRes.value.data : alertsRes.value.data?.items || [])
      }
      if (driversRes.status === 'fulfilled' && driversRes.value?.data) {
        const raw = Array.isArray(driversRes.value.data) ? driversRes.value.data : driversRes.value.data?.items || []
        setDrivers(raw.map((d: Record<string, unknown>, idx: number) => ({
          id: (d.id as string) || String(idx),
          name: (d.fullName as string) || (d.name as string) || `Sürücü ${idx + 1}`,
          phone: (d.phone as string) || '',
          plateNumber: (d.plateNumber as string) || (d.plate as string) || '',
          status: ((d.status as DriverStatus) || 'Scheduled'),
          lat: (d.lat as number) || (d.currentLat as number) || 39.9 + Math.random() * 2 - 1,
          lng: (d.lng as number) || (d.currentLng as number) || 32.8 + Math.random() * 4 - 2,
          originLat: (d.originLat as number) || 41.0,
          originLng: (d.originLng as number) || 29.0,
          destLat: (d.destLat as number) || 39.9,
          destLng: (d.destLng as number) || 32.8,
          route: (d.route as string) || '',
          progress: (d.progress as number) || 0,
          eta: (d.eta as string) || '',
          lastUpdate: (d.lastUpdate as string) || '',
          shipmentNo: (d.shipmentNo as string) || (d.shipmentNumber as string) || '',
          distanceKm: (d.distanceKm as number) || (d.totalDistance as number) || 0,
          timeWorkedMin: (d.timeWorkedMin as number) || 0,
        })))
      }
    } catch {
      // API not available yet — use empty state
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredDrivers = statusFilter === 'all' ? drivers : drivers.filter(d => d.status === statusFilter)
  const selected = drivers.find(d => d.id === selectedDriver) || null

  const onDuty = safety.onDutyCount || drivers.filter(d => d.status === 'OnRoute' || d.status === 'Servicing').length
  const offDuty = safety.offDutyCount || drivers.filter(d => d.status === 'Scheduled' || d.status === 'Completed').length
  const totalDrivers = safety.totalDrivers || drivers.length
  const runningLate = safety.runningLateCount || delayAlerts.length

  const completedCount = drivers.filter(d => d.status === 'Completed').length
  const failedCount = drivers.filter(d => d.status === 'Failed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.liveTracking.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.liveTracking.subtitle}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><Users className="w-5 h-5" /></div>
          </div>
          <div className="text-[28px] font-bold text-slate-900 tracking-tight">{onDuty}</div>
          <div className="text-[13px] text-slate-400 mt-0.5">Görevde</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"><Users className="w-5 h-5" /></div>
          </div>
          <div className="text-[28px] font-bold text-slate-900 tracking-tight">{offDuty}</div>
          <div className="text-[13px] text-slate-400 mt-0.5">Görev Dışı</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Truck className="w-5 h-5" /></div>
          </div>
          <div className="text-[28px] font-bold text-slate-900 tracking-tight">{totalDrivers}</div>
          <div className="text-[13px] text-slate-400 mt-0.5">Toplam Sürücü</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <div className="text-[28px] font-bold text-slate-900 tracking-tight">{runningLate}</div>
          <div className="text-[13px] text-slate-400 mt-0.5">Geciken</div>
        </div>
      </div>

      {/* Planned vs Actual toggle + Filter chips */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('planned')} className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${viewMode === 'planned' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Planlanan</button>
          <button onClick={() => setViewMode('actual')} className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${viewMode === 'actual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Gerçek</button>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        {filterChips.map(chip => {
          const count = chip.key === 'all' ? drivers.length : drivers.filter(d => d.status === chip.key).length
          return (
            <button
              key={chip.key}
              onClick={() => setStatusFilter(chip.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === chip.key ? 'bg-orange-400 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <chip.icon className="w-3.5 h-3.5" />
              {chip.label} ({count})
            </button>
          )
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      )}

      {!isLoading && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <MapContainer center={[39.5, 30.5]} zoom={6} style={{ height: 540, width: '100%' }} zoomControl={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredDrivers.map((d) => (
                <div key={d.id}>
                  <Marker
                    position={[d.lat, d.lng]}
                    icon={truckIcon(statusColors[d.status] || '#94a3b8')}
                    eventHandlers={{ click: () => setSelectedDriver(d.id) }}
                  >
                    <Popup>
                      <div className="text-[12px] min-w-[180px]">
                        <p className="font-bold text-[14px] mb-1">{d.plateNumber || d.name}</p>
                        <p className="text-gray-500">{d.name}</p>
                        {d.route && <p className="text-gray-500 mt-1">{d.route}</p>}
                        {d.eta && <p className="text-orange-600 font-semibold mt-1">ETA: {d.eta}</p>}
                        {d.progress > 0 && (
                          <>
                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${d.progress}%` }} />
                            </div>
                            <p className="text-gray-400 text-[10px] mt-1">{d.progress}% tamamlandı</p>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>

                  {d.originLat && d.originLng && (
                    <Marker position={[d.originLat, d.originLng]} icon={pinIcon('#22c55e')}>
                      <Popup><span className="text-[11px]">Çıkış</span></Popup>
                    </Marker>
                  )}
                  {d.destLat && d.destLng && (
                    <Marker position={[d.destLat, d.destLng]} icon={pinIcon('#ef4444')}>
                      <Popup><span className="text-[11px]">Varış</span></Popup>
                    </Marker>
                  )}

                  {(selectedDriver === d.id || !selectedDriver) && d.originLat && d.destLat && (
                    <Polyline
                      positions={[[d.originLat, d.originLng], [d.lat, d.lng], [d.destLat, d.destLng]]}
                      pathOptions={{
                        color: selectedDriver === d.id ? '#f97316' : '#94a3b8',
                        weight: selectedDriver === d.id ? 3 : 1.5,
                        dashArray: selectedDriver === d.id ? undefined : '6 4',
                        opacity: selectedDriver === d.id ? 1 : 0.5,
                      }}
                    />
                  )}
                </div>
              ))}
            </MapContainer>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Route Summary */}
            {selected ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-slate-800">{selected.name}</h3>
                  <Badge variant={selected.status === 'OnRoute' ? 'orange' : selected.status === 'Completed' ? 'success' : selected.status === 'Failed' ? 'error' : 'info'}>
                    {statusLabelsMap[selected.status]}
                  </Badge>
                </div>
                {selected.plateNumber && (
                  <p className="text-[12px] text-slate-500 mb-3">{selected.plateNumber}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Tamamlanan</p>
                    <p className="text-[18px] font-bold text-slate-800">{completedCount}/{drivers.length}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Başarısız</p>
                    <p className="text-[18px] font-bold text-red-500">{failedCount}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Geciken</p>
                    <p className="text-[18px] font-bold text-amber-500">{runningLate}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Mesafe</p>
                    <p className="text-[18px] font-bold text-slate-800">{selected.distanceKm ? `${selected.distanceKm} km` : '--'}</p>
                  </div>
                </div>
                {selected.timeWorkedMin > 0 && (
                  <div className="mt-3 bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Çalışma Suresi</p>
                    <p className="text-[16px] font-bold text-slate-800">{Math.floor(selected.timeWorkedMin / 60)}s {selected.timeWorkedMin % 60}dk</p>
                  </div>
                )}
                {selected.progress > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Ilerleme</span>
                      <span className="font-semibold">{selected.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all" style={{ width: `${selected.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-[14px] font-medium text-slate-500">
                  {drivers.length === 0 ? 'Aktif plan yok' : 'Detay için bir sürücü seçin'}
                </p>
                <p className="text-[12px] text-slate-400 mt-1">
                  {drivers.length === 0 ? 'Henüz aktif rota planı bulunmuyor.' : 'Haritadaki işaretçilere tıklayarak detayları görebilirsiniz.'}
                </p>
              </div>
            )}

            {/* Delay Alerts */}
            {delayAlerts.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
                <h3 className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Gecikme Uyarıları
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {delayAlerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                      <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[12px] font-medium text-slate-700">{alert.driverName}</p>
                        <p className="text-[11px] text-slate-500">{alert.shipmentNumber} - {alert.delayMinutes} dk gecikme</p>
                        {alert.reason && <p className="text-[10px] text-slate-400 mt-0.5">{alert.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Driver List (enhanced) */}
            {filteredDrivers.length > 0 && (
              <div className="space-y-2">
                {filteredDrivers.map((d, idx) => {
                  const isExpanded = selectedDriver === d.id
                  // Simulated stop counts for visual demo
                  const totalStops = Math.max(1, Math.round(d.progress * 0.4) || 8)
                  const completedStops = Math.round(totalStops * (d.progress / 100))
                  const failedStops = d.status === 'Failed' ? Math.max(1, Math.floor(totalStops * 0.1)) : 0
                  const inProgressStops = d.status === 'OnRoute' || d.status === 'Servicing' ? 1 : 0
                  const pendingStops = Math.max(0, totalStops - completedStops - failedStops - inProgressStops)

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDriver(isExpanded ? null : d.id)}
                      className={`bg-white rounded-2xl border shadow-sm cursor-pointer transition-all duration-200 ${
                        isExpanded
                          ? 'border-orange-300 ring-2 ring-orange-100 shadow-orange-50'
                          : 'border-slate-200/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="p-3">
                        {/* Header row */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${statusColors[d.status]}15`, color: statusColors[d.status] }}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-slate-800 truncate">
                                {idx + 1}. {d.plateNumber || d.name}
                              </span>
                              <Badge variant={d.status === 'OnRoute' ? 'orange' : d.status === 'Completed' ? 'success' : d.status === 'Failed' ? 'error' : 'info'}>
                                {statusLabelsMap[d.status]}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-slate-400">{d.name}</span>
                          </div>
                        </div>

                        {/* Time range */}
                        {d.eta && (
                          <div className="mt-2 text-[10px] text-slate-400">
                            {d.lastUpdate || '08:00'} - {d.eta}
                          </div>
                        )}

                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-500">{completedStops}/{totalStops} durak</span>
                            <span className="text-[11px] font-bold" style={{ color: statusColors[d.status] }}>
                              {d.progress || 0}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            {completedStops > 0 && (
                              <div className="h-full bg-green-500" style={{ width: `${(completedStops / totalStops) * 100}%` }} />
                            )}
                            {inProgressStops > 0 && (
                              <div className="h-full bg-amber-400" style={{ width: `${(inProgressStops / totalStops) * 100}%` }} />
                            )}
                            {failedStops > 0 && (
                              <div className="h-full bg-red-500" style={{ width: `${(failedStops / totalStops) * 100}%` }} />
                            )}
                            {pendingStops > 0 && (
                              <div className="h-full bg-slate-200" style={{ width: `${(pendingStops / totalStops) * 100}%` }} />
                            )}
                          </div>
                        </div>

                        {/* Status dots inline */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />{completedStops}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />{inProgressStops}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />{failedStops}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />{pendingStops}
                          </span>
                        </div>
                      </div>

                      {/* Expanded: stop list */}
                      {isExpanded && totalStops > 0 && (
                        <div className="border-t border-slate-100 px-3 py-2 space-y-1 max-h-48 overflow-y-auto">
                          {Array.from({ length: totalStops }, (_, i) => {
                            const stopStatus = i < completedStops ? 'completed' : i < completedStops + inProgressStops ? 'inprogress' : i < completedStops + inProgressStops + failedStops ? 'failed' : 'pending'
                            const dotColor = stopStatus === 'completed' ? 'bg-green-500' : stopStatus === 'inprogress' ? 'bg-amber-400' : stopStatus === 'failed' ? 'bg-red-500' : 'bg-slate-300'
                            const statusLabel = stopStatus === 'completed' ? 'Tamamlandı' : stopStatus === 'inprogress' ? 'Devam Ediyor' : stopStatus === 'failed' ? 'Başarısız' : 'Bekliyor'
                            return (
                              <div key={i} className="flex items-center gap-2 py-1">
                                <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                                <span className="text-[11px] text-slate-600 flex-1">Durak #{i + 1}</span>
                                <span className={`text-[10px] font-medium ${
                                  stopStatus === 'completed' ? 'text-green-600' : stopStatus === 'inprogress' ? 'text-amber-500' : stopStatus === 'failed' ? 'text-red-500' : 'text-slate-400'
                                }`}>{statusLabel}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
