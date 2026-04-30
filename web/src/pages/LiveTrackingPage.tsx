import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { Truck } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
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

interface Vehicle {
  id: string
  plate: string
  driver: string
  status: 'InTransit' | 'Loading' | 'Delivered'
  route: string
  progress: number
  lastUpdate: string
  currentLat: number
  currentLng: number
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  shipmentNo: string
  provider: string
  eta: string
}

const mockVehicles: Vehicle[] = [
  {
    id: '1', plate: '34 KLC 001', driver: 'Ahmet Yılmaz', status: 'InTransit',
    route: 'İstanbul → Ankara', progress: 65, lastUpdate: '2 dk önce',
    currentLat: 40.2, currentLng: 30.5, originLat: 41.0082, originLng: 28.9784,
    destLat: 39.9334, destLng: 32.8597, shipmentNo: 'SHP-2026-00142', provider: 'Yolda Lojistik', eta: '14:30',
  },
  {
    id: '2', plate: '34 KLC 003', driver: 'Mehmet Kaya', status: 'Loading',
    route: 'İstanbul → Bursa', progress: 0, lastUpdate: '5 dk önce',
    currentLat: 41.0082, currentLng: 28.9784, originLat: 41.0082, originLng: 28.9784,
    destLat: 40.1885, destLng: 29.0610, shipmentNo: 'SHP-2026-00145', provider: 'Murat Lojistik', eta: '16:00',
  },
  {
    id: '3', plate: '35 KLC 005', driver: 'Ali Demir', status: 'InTransit',
    route: 'İzmir → Antalya', progress: 42, lastUpdate: '1 dk önce',
    currentLat: 37.8, currentLng: 29.5, originLat: 38.4237, originLng: 27.1428,
    destLat: 36.8969, destLng: 30.7133, shipmentNo: 'SHP-2026-00148', provider: 'Yolda Lojistik', eta: '17:15',
  },
  {
    id: '4', plate: '06 KLC 012', driver: 'Veli Öztürk', status: 'InTransit',
    route: 'Ankara → İzmir', progress: 35, lastUpdate: '3 dk önce',
    currentLat: 39.2, currentLng: 29.8, originLat: 39.9334, originLng: 32.8597,
    destLat: 38.4237, destLng: 27.1428, shipmentNo: 'SHP-2026-00150', provider: 'Tırport', eta: '19:45',
  },
  {
    id: '5', plate: '16 KLC 008', driver: 'Hasan Çelik', status: 'InTransit',
    route: 'Bursa → Konya', progress: 78, lastUpdate: '1 dk önce',
    currentLat: 39.5, currentLng: 31.2, originLat: 40.1885, originLng: 29.0610,
    destLat: 37.8746, destLng: 32.4932, shipmentNo: 'SHP-2026-00153', provider: 'Murat Lojistik', eta: '13:20',
  },
]

export default function LiveTrackingPage() {
  const { t } = useI18n()
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)

  const activeCount = mockVehicles.filter(v => v.status === 'InTransit').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.liveTracking.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.liveTracking.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <MapContainer
            center={[39.5, 30.5]}
            zoom={6}
            style={{ height: 540, width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mockVehicles.map((v) => (
              <div key={v.id}>
                {/* Current position */}
                <Marker
                  position={[v.currentLat, v.currentLng]}
                  icon={truckIcon(v.status === 'InTransit' ? '#f97316' : v.status === 'Loading' ? '#3b82f6' : '#22c55e')}
                  eventHandlers={{ click: () => setSelectedVehicle(v.id) }}
                >
                  <Popup>
                    <div className="text-[12px] min-w-[180px]">
                      <p className="font-bold text-[14px] mb-1">{v.plate}</p>
                      <p className="text-gray-500">{v.driver}</p>
                      <p className="text-gray-500 mt-1">{v.route}</p>
                      <p className="text-orange-600 font-semibold mt-1">ETA: {v.eta}</p>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${v.progress}%` }} />
                      </div>
                      <p className="text-gray-400 text-[10px] mt-1">{v.progress}% tamamlandı</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Origin marker */}
                <Marker position={[v.originLat, v.originLng]} icon={pinIcon('#22c55e')}>
                  <Popup><span className="text-[11px]">Çıkış: {v.route.split('→')[0]?.trim()}</span></Popup>
                </Marker>

                {/* Destination marker */}
                <Marker position={[v.destLat, v.destLng]} icon={pinIcon('#ef4444')}>
                  <Popup><span className="text-[11px]">Varış: {v.route.split('→')[1]?.trim()}</span></Popup>
                </Marker>

                {/* Route line */}
                {(selectedVehicle === v.id || !selectedVehicle) && (
                  <Polyline
                    positions={[[v.originLat, v.originLng], [v.currentLat, v.currentLng], [v.destLat, v.destLng]]}
                    pathOptions={{
                      color: selectedVehicle === v.id ? '#f97316' : '#94a3b8',
                      weight: selectedVehicle === v.id ? 3 : 1.5,
                      dashArray: selectedVehicle === v.id ? undefined : '6 4',
                      opacity: selectedVehicle === v.id ? 1 : 0.5,
                    }}
                  />
                )}
              </div>
            ))}
          </MapContainer>
        </div>

        {/* Vehicle List */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 text-center">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Aktif Araç</p>
              <p className="text-[28px] font-extrabold text-orange-500">{activeCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 text-center">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Toplam</p>
              <p className="text-[28px] font-extrabold text-slate-700">{mockVehicles.length}</p>
            </div>
          </div>

          {/* Vehicle cards */}
          {mockVehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedVehicle(selectedVehicle === v.id ? null : v.id)}
              className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all duration-200 ${
                selectedVehicle === v.id
                  ? 'border-orange-300 ring-2 ring-orange-100 shadow-orange-50'
                  : 'border-slate-200/60 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  v.status === 'InTransit' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-slate-800">{v.plate}</span>
                    <Badge variant={v.status === 'InTransit' ? 'orange' : v.status === 'Loading' ? 'info' : 'success'}>
                      {v.status === 'InTransit' ? 'Yolda' : v.status === 'Loading' ? 'Yükleniyor' : 'Teslim'}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400">{v.driver}</span>
                </div>
              </div>

              <div className="text-[12px] text-slate-600 mb-1 font-medium">{v.route}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>{v.shipmentNo}</span>
                <span>{v.provider}</span>
              </div>

              {v.progress > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all" style={{ width: `${v.progress}%` }} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">{v.progress}%</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{v.lastUpdate}</span>
                <span className="text-[11px] font-semibold text-orange-500">ETA: {v.eta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
