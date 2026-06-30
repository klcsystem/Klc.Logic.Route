import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  Navigation, Package, CheckCircle2,
  MessageSquare, ChevronDown, DoorOpen, Shield, Users, Box,
  Send, X, LocateFixed, CalendarClock
} from 'lucide-react'
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

const destinationIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.4)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#ef4444"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

function maskNameSimple(name: string): string {
  const parts = name.split(' ')
  return parts
    .map((p) => {
      if (p.length <= 2) return p + '**'
      return p.substring(0, 2) + '** ' + (p.length > 3 ? p.substring(0, 2) + '**' : '')
    })
    .join(' ')
}

function maskAddress(address: string): string {
  const parts = address.split(',')
  if (parts.length <= 1) {
    return address.length > 15 ? address.substring(0, 15) + '...' : address
  }
  return parts[0].trim() + ', ...'
}

type DeliveryOption = 'Door' | 'Security' | 'Neighbor' | 'Locker'

const deliveryOptions: { key: DeliveryOption; label: string; icon: React.ElementType }[] = [
  { key: 'Door', label: 'Leave at Door', icon: DoorOpen },
  { key: 'Security', label: 'Leave to Security', icon: Shield },
  { key: 'Neighbor', label: 'Leave to Neighbor', icon: Users },
  { key: 'Locker', label: 'Leave to Locker', icon: Box },
]

interface TimelineStep {
  label: string
  time: string | null
  completed: boolean
  active: boolean
}

function buildTimeline(tracking: TrackingData): TimelineStep[] {
  const statusIndex = ['OrderReceived', 'Loaded', 'InTransit', 'Delivered'].indexOf(tracking.status)

  const steps: TimelineStep[] = [
    {
      label: 'Route Planned',
      time: tracking.events.find((e) => e.status === 'OrderReceived')?.timestamp ?? null,
      completed: statusIndex >= 0,
      active: statusIndex === 0,
    },
    {
      label: 'Route Started',
      time: tracking.events.find((e) => e.status === 'Loaded')?.timestamp ?? null,
      completed: statusIndex >= 1,
      active: statusIndex === 1,
    },
    {
      label: 'Arrived To Delivery Location',
      time: tracking.events.find((e) => e.status === 'InTransit')?.timestamp ?? null,
      completed: statusIndex >= 2,
      active: statusIndex === 2,
    },
    {
      label: 'Order Delivered',
      time: tracking.events.find((e) => e.status === 'Delivered')?.timestamp ?? null,
      completed: statusIndex >= 3,
      active: statusIndex === 3,
    },
  ]

  return steps
}

function getStatusBadge(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'Delivered':
      return { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100' }
    case 'InTransit':
      return { label: 'In Transit', color: 'text-orange-700', bg: 'bg-orange-100' }
    default:
      return { label: 'Scheduled', color: 'text-blue-700', bg: 'bg-blue-100' }
  }
}

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
  receiver: { name: 'Bruce Banner', phone: '0312 444 5678', address: 'Ostim OSB, Blok C, No:12, Ankara' },
  events: [
    { status: 'OrderReceived', description: 'Route planned', timestamp: '2026-05-06T08:00:00' },
    { status: 'Loaded', description: 'Route started — Istanbul depot', timestamp: '2026-05-06T09:30:00' },
    { status: 'InTransit', description: 'In transit — ETA: 14:30', timestamp: '2026-05-06T10:00:00' },
  ],
  companyName: 'Logic.Route',
}

export default function CustomerTrackingPage() {
  const { token } = useParams<{ token: string }>()
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [deliveryChanged, setDeliveryChanged] = useState(false)
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOption | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setTracking(mockTrackingData)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
    // TODO: Replace with real API call:
    // publicTrackingApi.getByToken(token!).then(res => { if (res.success) setTracking(res.data) }).finally(() => setLoading(false))
  }, [token])

  const handleSendMessage = () => {
    if (!messageText.trim()) return
    // TODO: POST /api/public/tracking/{token}/messages
    setMessageSent(true)
    setMessageText('')
    setTimeout(() => {
      setShowMessageModal(false)
      setMessageSent(false)
    }, 2000)
  }

  const handleChangeDeliveryPoint = (option: DeliveryOption) => {
    setSelectedDeliveryOption(option)
    // TODO: POST /api/public/tracking/{token}/change-delivery-point
    setDeliveryChanged(true)
    setTimeout(() => {
      setShowDeliveryModal(false)
      setDeliveryChanged(false)
      setSelectedDeliveryOption(null)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center animate-pulse">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <p className="text-[14px] text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!tracking) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-[18px] font-semibold text-slate-700">Shipment not found</h2>
          <p className="text-[14px] text-slate-400 mt-1">The tracking link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  const timeline = buildTimeline(tracking)
  const statusBadge = getStatusBadge(tracking.status)
  const mapCenter: [number, number] = tracking.driverLocation
    ? [tracking.driverLocation.lat, tracking.driverLocation.lng]
    : [tracking.destination.lat, tracking.destination.lng]

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/60 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/10">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-[16px] font-bold text-slate-900">Order Tracking</h1>
                <p className="text-[11px] text-slate-400">{tracking.shipmentNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Planned delivery time */}
          {tracking.etaFormatted && (
            <div className="mt-3 flex items-center gap-2 text-[13px] text-slate-600">
              <CalendarClock className="w-4 h-4 text-orange-500" />
              <span>Planned delivery: <strong className="text-slate-900">{tracking.etaFormatted}</strong></span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Order Information */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Order Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-slate-500">Customer</span>
              <span className="text-[14px] font-medium text-slate-800">{maskNameSimple(tracking.receiver.name)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-slate-500">Parcel</span>
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-500" />
                <span className="text-[14px] font-medium text-slate-800">1</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-slate-500">Type</span>
              <span className="text-[14px] font-medium text-slate-800">Delivery</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-slate-500">Address</span>
              <span className="text-[14px] font-medium text-slate-800 text-right max-w-[200px]">
                {maskAddress(tracking.receiver.address)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Movements Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-5">Order Movements</h3>
          <div className="relative">
            {timeline.map((step, i) => {
              const isLast = i === timeline.length - 1
              return (
                <div key={i} className="flex items-start gap-4 relative">
                  {/* Vertical line */}
                  {!isLast && (
                    <div
                      className={`absolute left-[11px] top-[24px] w-0.5 h-[calc(100%-8px)] ${
                        step.completed ? 'bg-green-400' : 'bg-slate-200'
                      }`}
                    />
                  )}
                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0 mt-0.5">
                    {step.completed ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-slate-300" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                    <p className={`text-[14px] font-medium ${step.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {new Date(step.time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={tracking.driverLocation ? 8 : 13}
            style={{ height: 280, width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Destination */}
            <Marker position={[tracking.destination.lat, tracking.destination.lng]} icon={destinationIcon}>
              <Popup>
                <span className="text-[12px] font-medium">Delivery: {tracking.destination.city}</span>
              </Popup>
            </Marker>
            {/* Driver position (if in transit) */}
            {tracking.driverLocation && tracking.status === 'InTransit' && (
              <Marker position={[tracking.driverLocation.lat, tracking.driverLocation.lng]} icon={truckIcon}>
                <Popup>
                  <div className="text-[12px]">
                    <p className="font-bold">Driver Location</p>
                    <p className="text-orange-600 font-semibold mt-1">ETA: {tracking.etaFormatted}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
          {tracking.driverLocation && tracking.status === 'InTransit' && (
            <div className="px-4 py-2.5 bg-orange-50 border-t border-orange-100 flex items-center gap-2">
              <LocateFixed className="w-4 h-4 text-orange-500" />
              <span className="text-[12px] text-orange-700 font-medium">Driver is on the way</span>
              {tracking.etaFormatted && (
                <span className="ml-auto text-[12px] font-bold text-orange-600">ETA {tracking.etaFormatted}</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          {/* Change Delivery Point */}
          <button
            onClick={() => setShowDeliveryModal(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors text-[14px] uppercase tracking-wide shadow-lg shadow-orange-400/20"
          >
            CHANGE DELIVERY POINT
          </button>

          {/* Send Message */}
          <button
            onClick={() => setShowMessageModal(true)}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-4 rounded-xl transition-colors text-[14px] border border-slate-200 flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Send Message
          </button>

          {/* Other Options */}
          <div className="relative">
            <button
              onClick={() => setShowOtherOptions(!showOtherOptions)}
              className="w-full bg-white hover:bg-slate-50 text-slate-500 font-medium py-3 px-4 rounded-xl transition-colors text-[13px] border border-slate-200 flex items-center justify-center gap-2"
            >
              OTHER OPTIONS
              <ChevronDown className={`w-4 h-4 transition-transform ${showOtherOptions ? 'rotate-180' : ''}`} />
            </button>
            {showOtherOptions && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                <button className="w-full text-left px-4 py-3 text-[13px] text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                  Request callback
                </button>
                <button className="w-full text-left px-4 py-3 text-[13px] text-slate-700 hover:bg-slate-50 border-b border-slate-100">
                  Report a problem
                </button>
                <button className="w-full text-left px-4 py-3 text-[13px] text-slate-700 hover:bg-slate-50">
                  Cancel delivery
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/60">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <p className="text-[11px] text-slate-400">
            Powered by {tracking.companyName} &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Change Delivery Point Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeliveryModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 sm:mx-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">Change Delivery Point</h3>
              <button onClick={() => setShowDeliveryModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {deliveryChanged ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-[15px] font-semibold text-slate-800">Request submitted!</p>
                <p className="text-[13px] text-slate-500 mt-1">We will notify you when confirmed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleChangeDeliveryPoint(opt.key)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-orange-300 hover:bg-orange-50 ${
                        selectedDeliveryOption === opt.key
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <span className="text-[14px] font-medium text-slate-800">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMessageModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 sm:mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">Send Message to Driver</h3>
              <button onClick={() => setShowMessageModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {messageSent ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-[15px] font-semibold text-slate-800">Message sent!</p>
                <p className="text-[13px] text-slate-500 mt-1">The driver will receive your message.</p>
              </div>
            ) : (
              <div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message to the driver..."
                  className="w-full h-32 p-4 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="mt-3 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-[14px] flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
