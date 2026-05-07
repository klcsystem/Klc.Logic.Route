import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, Package, Truck, CheckCircle2, Clock, MapPin, Phone, User } from 'lucide-react'
import type { TrackingData } from '../../api/tracking'
import 'leaflet/dist/leaflet.css'

const truckIcon = L.divIcon({
  className: '',
  html: `<div style="background:#f97316;width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 12px rgba(249,115,22,0.4)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

const pinIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const mockTrackingData: TrackingData = {
  shipmentId: 's1',
  shipmentNumber: 'SHP-2026-00142',
  status: 'InTransit',
  origin: { city: 'Istanbul', address: 'Tuzla Organize Sanayi Bolgesi, No:45', lat: 41.0082, lng: 28.9784 },
  destination: { city: 'Ankara', address: 'Ostim OSB, Cankaya/Ankara', lat: 39.9334, lng: 32.8597 },
  driverLocation: { lat: 40.2, lng: 30.5 },
  eta: '2026-05-06T14:30:00',
  etaFormatted: '14:30',
  sender: { name: 'KLC System A.S.', phone: '0212 555 1234' },
  receiver: { name: 'ABC Ticaret Ltd.', phone: '0312 444 5678', address: 'Ostim OSB, Blok C, No:12' },
  events: [
    { status: 'OrderReceived', description: 'Siparis alindi', timestamp: '2026-05-06T08:00:00' },
    { status: 'Loaded', description: 'Yukleme tamamlandi — Istanbul depo', timestamp: '2026-05-06T09:30:00' },
    { status: 'InTransit', description: 'Yola cikti — Tahmini varis: 14:30', timestamp: '2026-05-06T10:00:00' },
  ],
  companyName: 'Logic.Route',
}

type TrackingStatus = 'OrderReceived' | 'Loaded' | 'InTransit' | 'Delivered'

const statusSteps: { key: TrackingStatus; label: string; icon: React.ElementType }[] = [
  { key: 'OrderReceived', label: 'Siparis Alindi', icon: Package },
  { key: 'Loaded', label: 'Yuklendi', icon: CheckCircle2 },
  { key: 'InTransit', label: 'Yolda', icon: Truck },
  { key: 'Delivered', label: 'Teslim Edildi', icon: MapPin },
]

function getStepIndex(status: TrackingStatus): number {
  return statusSteps.findIndex(s => s.key === status)
}

export default function CustomerTrackingPage() {
  const { token } = useParams<{ token: string }>()
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock: simulate API call
    const timer = setTimeout(() => {
      setTracking(mockTrackingData)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
    // TODO: Replace with real API call when backend is ready:
    // publicTrackingApi.getByToken(token!).then(res => { if (res.success) setTracking(res.data) }).finally(() => setLoading(false))
  }, [token])

  // TODO: SignalR connection for live updates
  // useEffect(() => {
  //   if (!tracking) return
  //   const connection = new signalR.HubConnectionBuilder()
  //     .withUrl('http://localhost:2701/hubs/tracking')
  //     .withAutomaticReconnect()
  //     .build()
  //   connection.start().then(() => connection.invoke('JoinShipmentGroup', tracking.shipmentId))
  //   connection.on('LocationUpdated', (loc) => setTracking(prev => prev ? { ...prev, driverLocation: loc } : null))
  //   connection.on('EtaUpdated', (eta) => setTracking(prev => prev ? { ...prev, etaFormatted: eta } : null))
  //   return () => { connection.stop() }
  // }, [tracking?.shipmentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center animate-pulse">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <p className="text-[14px] text-slate-400">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (!tracking) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-[18px] font-semibold text-slate-700">Gonderi bulunamadi</h2>
          <p className="text-[14px] text-slate-400 mt-1">Takip linki gecersiz veya suresi dolmus olabilir.</p>
        </div>
      </div>
    )
  }

  const currentStepIndex = getStepIndex(tracking.status as TrackingStatus)
  const mapCenter: [number, number] = tracking.driverLocation
    ? [tracking.driverLocation.lat, tracking.driverLocation.lng]
    : [(tracking.origin.lat + tracking.destination.lat) / 2, (tracking.origin.lng + tracking.destination.lng) / 2]

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/10">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 tracking-tight">{tracking.companyName}</h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">Gonderi Takip</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400">Takip No</p>
            <p className="text-[14px] font-semibold text-slate-800">{tracking.shipmentNumber}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ETA Card */}
        {tracking.etaFormatted && (
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-400/20">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-[13px] font-medium opacity-90">Tahmini Varis</span>
            </div>
            <p className="text-[36px] sm:text-[48px] font-extrabold tracking-tight">{tracking.etaFormatted}</p>
            <p className="text-[13px] opacity-80 mt-1">
              {tracking.origin.city} &rarr; {tracking.destination.city}
            </p>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={7}
            style={{ height: 360, width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Origin */}
            <Marker position={[tracking.origin.lat, tracking.origin.lng]} icon={pinIcon('#22c55e')}>
              <Popup><span className="text-[12px] font-medium">Cikis: {tracking.origin.city}</span></Popup>
            </Marker>
            {/* Destination */}
            <Marker position={[tracking.destination.lat, tracking.destination.lng]} icon={pinIcon('#ef4444')}>
              <Popup><span className="text-[12px] font-medium">Varis: {tracking.destination.city}</span></Popup>
            </Marker>
            {/* Driver */}
            {tracking.driverLocation && (
              <Marker position={[tracking.driverLocation.lat, tracking.driverLocation.lng]} icon={truckIcon}>
                <Popup>
                  <div className="text-[12px]">
                    <p className="font-bold">Surucu Konumu</p>
                    <p className="text-orange-600 font-semibold mt-1">ETA: {tracking.etaFormatted}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            {/* Route line */}
            <Polyline
              positions={[
                [tracking.origin.lat, tracking.origin.lng],
                ...(tracking.driverLocation ? [[tracking.driverLocation.lat, tracking.driverLocation.lng] as [number, number]] : []),
                [tracking.destination.lat, tracking.destination.lng],
              ]}
              pathOptions={{ color: '#f97316', weight: 3, opacity: 0.8 }}
            />
          </MapContainer>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-5">Gonderi Durumu</h3>
          <div className="flex items-start justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-orange-400 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />

            {statusSteps.map((step, i) => {
              const isCompleted = i <= currentStepIndex
              const isCurrent = i === currentStepIndex
              const Icon = step.icon
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCurrent ? 'bg-orange-400 text-white ring-4 ring-orange-100 shadow-lg shadow-orange-400/20' :
                    isCompleted ? 'bg-green-400 text-white' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`text-[12px] mt-2 text-center font-medium ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Event list */}
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
            {tracking.events.map((ev, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700">{ev.description}</p>
                  <p className="text-[11px] text-slate-400">{new Date(ev.timestamp).toLocaleString('tr-TR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sender / Receiver */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Gonderen</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-[14px] font-medium text-slate-800">{tracking.sender.name}</span>
              </div>
              {tracking.sender.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-[13px] text-slate-600">{tracking.sender.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Alici</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-[14px] font-medium text-slate-800">{tracking.receiver.name}</span>
              </div>
              {tracking.receiver.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-[13px] text-slate-600">{tracking.receiver.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-[13px] text-slate-600">{tracking.receiver.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-center">
          <p className="text-[11px] text-slate-400">{tracking.companyName} &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
