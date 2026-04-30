import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck, DollarSign, Clock, Thermometer, RotateCcw, Navigation } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import Badge from '../../components/ui/Badge'
import type { YoldaShipment } from '../../api/yolda'
import 'leaflet/dist/leaflet.css'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  NEED_PRICE: 'warning',
  APPROVED: 'info',
  VEHICLE_GETTING_SUPPLIED: 'orange',
  VEHICLE_IS_SUPPLIED: 'orange',
  IN_TRANSIT: 'orange',
  DELIVERED: 'success',
  CANCELED: 'error',
}

const statusLabels: Record<string, string> = {
  NEED_PRICE: 'Fiyat Bekleniyor',
  APPROVED: 'Onaylandi',
  VEHICLE_GETTING_SUPPLIED: 'Arac Temin Ediliyor',
  VEHICLE_IS_SUPPLIED: 'Arac Temin Edildi',
  IN_TRANSIT: 'Yolda',
  DELIVERED: 'Teslim Edildi',
  CANCELED: 'Iptal Edildi',
}

const vehicleLabels: Record<string, string> = {
  TIR: 'Tir', TRUCK: 'Kamyon', REEFER_TRUCK: 'Frigorifik', DUMPER_TRUCK: 'Damperli',
  TANKER: 'Tanker', LOWBED: 'Lowbed', CURTAINSIDER: 'Tenteli', LIGHT_TRUCK_3500: 'Kamyonet 3.5t',
}

const bodyLabels: Record<string, string> = {
  SHORT_TRAILER: 'Kisa Dorse', LONG_TRAILER: 'Uzun Dorse', MEGA_TRAILER: 'Mega Dorse',
}

const packageLabels: Record<string, string> = {
  PALLET: 'Palet', BOX: 'Kutu', BULK: 'Dokme', BARREL: 'Varil', BAG: 'Torba',
}

const loadingLabels: Record<string, string> = {
  FORKLIFT_FROM_THE_SIDE: 'Forklift (Yandan)', FORKLIFT_FROM_BEHIND: 'Forklift (Arkadan)',
  CRANE: 'Vinc', MANUAL: 'Manuel', PUMPING: 'Pompa',
}

const temperatureLabels: Record<string, string> = {
  DRY: 'Kuru', COLD: 'Soguk', FROZEN: 'Dondurulmus',
}

// Map icons
const pickupMarker = L.divIcon({
  className: '',
  html: `<div style="background:#10b981;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const dropoffMarker = L.divIcon({
  className: '',
  html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const vehicleMarker = L.divIcon({
  className: '',
  html: `<div style="background:#f97316;width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

// Mock shipment data with real-style IDs
const mockShipments: Record<string, YoldaShipment> = {
  'D3PA9LAK': {
    id: 'D3PA9LAK', latestStatus: 'VEHICLE_IS_SUPPLIED',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Istanbul', name: 'Mehmet', phoneNumber: '+905559876543', city: 'Istanbul', district: 'Tuzla', address: 'Tuzla Lojistik Merkezi', addressType: 'WAREHOUSE', latitude: 40.8167, longitude: 29.3000 },
    shipmentType: 'FTL', totalKg: 22000, totalDs: 45, routeTotalDistanceInKm: 78,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-29T08:00:00', estimatedDeliveryDate: '2026-04-29T14:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-29T07:00:00' }, { type: 'APPROVED', date: '2026-04-29T07:30:00' }, { type: 'VEHICLE_GETTING_SUPPLIED', date: '2026-04-29T08:00:00' }, { type: 'VEHICLE_IS_SUPPLIED', date: '2026-04-29T09:00:00' }],
    vehicle: { type: 'TIR', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 24, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_BEHIND', wayOfUnloading: 'FORKLIFT_FROM_THE_SIDE' },
    pricing: { type: 'FIXED', price: 14500, tax: 2610, total: 17110, currency: 'TRY', deliveryType: 'STANDARD' },
  },
  '0183YIJB': {
    id: '0183YIJB', latestStatus: 'VEHICLE_IS_SUPPLIED',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Ankara', name: 'Fatma', phoneNumber: '+905553456789', city: 'Ankara', district: 'Sincan', address: 'Sincan OSB Lojistik Alani', addressType: 'WAREHOUSE', latitude: 39.9690, longitude: 32.5578 },
    shipmentType: 'FTL', totalKg: 18500, totalDs: 38, routeTotalDistanceInKm: 385,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-29T06:00:00', estimatedDeliveryDate: '2026-04-29T16:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-29T05:00:00' }, { type: 'APPROVED', date: '2026-04-29T05:30:00' }, { type: 'VEHICLE_GETTING_SUPPLIED', date: '2026-04-29T06:00:00' }, { type: 'VEHICLE_IS_SUPPLIED', date: '2026-04-29T07:00:00' }],
    vehicle: { type: 'TIR', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 24, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_BEHIND', wayOfUnloading: 'FORKLIFT_FROM_BEHIND' },
    pricing: { type: 'FIXED', price: 28000, tax: 5040, total: 33040, currency: 'TRY', deliveryType: 'STANDARD' },
  },
  'KXWP42TN': {
    id: 'KXWP42TN', latestStatus: 'IN_TRANSIT',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Antalya', name: 'Hasan', phoneNumber: '+905556667788', city: 'Antalya', district: 'Dosemealti', address: 'Dosemealti Lojistik Merkezi', addressType: 'WAREHOUSE', latitude: 37.0027, longitude: 30.6489 },
    shipmentType: 'FTL', totalKg: 24000, totalDs: 50, routeTotalDistanceInKm: 620,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-28T04:00:00', estimatedDeliveryDate: '2026-04-28T18:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-28T03:00:00' }, { type: 'APPROVED', date: '2026-04-28T04:00:00' }, { type: 'VEHICLE_IS_SUPPLIED', date: '2026-04-28T06:00:00' }, { type: 'IN_TRANSIT', date: '2026-04-28T07:00:00' }],
    vehicle: { type: 'CURTAINSIDER', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 26, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_THE_SIDE', wayOfUnloading: 'CRANE' },
    pricing: { type: 'FIXED', price: 42000, tax: 7560, total: 49560, currency: 'TRY', deliveryType: 'STANDARD' },
  },
  'NF7RDWEX': {
    id: 'NF7RDWEX', latestStatus: 'DELIVERED',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Izmir', name: 'Ali', phoneNumber: '+905557654321', city: 'Izmir', district: 'Kemalpasa', address: 'Kemalpasa OSB Lojistik Alani', addressType: 'WAREHOUSE', latitude: 38.4260, longitude: 27.4270 },
    shipmentType: 'FTL', totalKg: 20000, totalDs: 42, routeTotalDistanceInKm: 490,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-27T07:00:00', estimatedDeliveryDate: '2026-04-27T18:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-27T06:00:00' }, { type: 'APPROVED', date: '2026-04-27T07:00:00' }, { type: 'VEHICLE_IS_SUPPLIED', date: '2026-04-27T08:00:00' }, { type: 'IN_TRANSIT', date: '2026-04-27T09:00:00' }, { type: 'DELIVERED', date: '2026-04-27T19:00:00' }],
    vehicle: { type: 'TIR', bodyType: 'MEGA_TRAILER', tonnagePerVehicle: 26, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_THE_SIDE', wayOfUnloading: 'FORKLIFT_FROM_THE_SIDE' },
    pricing: { type: 'FIXED', price: 32000, tax: 5760, total: 37760, currency: 'TRY', deliveryType: 'STANDARD' },
  },
}

// Mock vehicle GPS for IN_TRANSIT shipments (from GET /locations/v1/vehicle/shipment)
const mockVehicleLocations: Record<string, { lat: number; lng: number; speed: number; heading: number; timestamp: string }> = {
  'KXWP42TN': { lat: 38.9, lng: 30.2, speed: 82, heading: 195, timestamp: '2026-04-28T14:30:00' },
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{value ?? '-'}</span>
    </div>
  )
}

export default function YoldaShipmentDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const shipment = id ? mockShipments[id] : null

  if (!shipment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/yolda')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-[22px] font-bold text-slate-900">Sevkiyat Bulunamadi</h1>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
          <p className="text-[14px] text-slate-400">Bu ID ile eslesen bir Yolda sevkiyati bulunamadi.</p>
          <button onClick={() => navigate('/yolda')} className="mt-4 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-[13px] font-medium hover:bg-orange-100 transition-colors">
            Yolda Dashboard'a Don
          </button>
        </div>
      </div>
    )
  }

  const latestStatus = shipment.latestStatus || shipment.status[shipment.status.length - 1]?.type || 'NEED_PRICE'
  const vehicleLoc = id ? mockVehicleLocations[id] : null
  const hasCoords = shipment.pickup.latitude && shipment.pickup.longitude && shipment.dropoff.latitude && shipment.dropoff.longitude

  // Calculate map center
  const mapCenter: [number, number] = hasCoords
    ? [(shipment.pickup.latitude! + shipment.dropoff.latitude!) / 2, (shipment.pickup.longitude! + shipment.dropoff.longitude!) / 2]
    : [39.5, 32.0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/yolda')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sevkiyat {shipment.id}</h1>
              <Badge variant={statusVariant[latestStatus]}>{statusLabels[latestStatus]}</Badge>
            </div>
            <p className="text-[14px] text-slate-400 mt-1">{shipment.pickup.city} → {shipment.dropoff.city} | {shipment.shipmentType}</p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> Durum Gecmisi
        </h3>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {shipment.status.map((st, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center min-w-[140px]">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  i === shipment.status.length - 1
                    ? 'bg-orange-400 border-orange-400'
                    : 'bg-white border-green-400'
                }`} />
                <div className="mt-2 text-center">
                  <Badge variant={statusVariant[st.type] || 'default'}>{statusLabels[st.type] || st.type}</Badge>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(st.date).toLocaleString('tr-TR')}</p>
                </div>
              </div>
              {i < shipment.status.length - 1 && (
                <div className="w-12 h-0.5 bg-green-300 mt-2 -mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pickup & Dropoff */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-green-800 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Yuklenme Noktasi
          </h3>
          <InfoRow label="Firma" value={shipment.pickup.company} />
          <InfoRow label="Yetkili" value={shipment.pickup.name} />
          <InfoRow label="Telefon" value={shipment.pickup.phoneNumber} />
          <InfoRow label="Sehir / Ilce" value={`${shipment.pickup.city}, ${shipment.pickup.district || '-'}`} />
          <InfoRow label="Adres" value={shipment.pickup.address} />
          <InfoRow label="Adres Tipi" value={shipment.pickup.addressType} />
          {shipment.pickup.latitude && (
            <InfoRow label="Koordinat" value={`${shipment.pickup.latitude}, ${shipment.pickup.longitude}`} />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Teslimat Noktasi
          </h3>
          <InfoRow label="Firma" value={shipment.dropoff.company} />
          <InfoRow label="Yetkili" value={shipment.dropoff.name} />
          <InfoRow label="Telefon" value={shipment.dropoff.phoneNumber} />
          <InfoRow label="Sehir / Ilce" value={`${shipment.dropoff.city}, ${shipment.dropoff.district || '-'}`} />
          <InfoRow label="Adres" value={shipment.dropoff.address} />
          <InfoRow label="Adres Tipi" value={shipment.dropoff.addressType} />
          {shipment.dropoff.latitude && (
            <InfoRow label="Koordinat" value={`${shipment.dropoff.latitude}, ${shipment.dropoff.longitude}`} />
          )}
        </div>
      </div>

      {/* Vehicle & Pricing */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-400" /> Arac ve Yuk Detaylari
          </h3>
          <InfoRow label="Arac Tipi" value={vehicleLabels[shipment.vehicle.type] || shipment.vehicle.type} />
          <InfoRow label="Kasa Tipi" value={bodyLabels[shipment.vehicle.bodyType || ''] || shipment.vehicle.bodyType} />
          <InfoRow label="Tonaj / Arac" value={`${shipment.vehicle.tonnagePerVehicle} ton`} />
          <InfoRow label="Arac Sayisi" value={shipment.vehicle.numberOfVehicles} />
          <InfoRow label="Ambalaj Tipi" value={packageLabels[shipment.vehicle.packageType || ''] || shipment.vehicle.packageType} />
          <InfoRow label="Yukleme Sekli" value={loadingLabels[shipment.vehicle.wayOfLoading || ''] || shipment.vehicle.wayOfLoading} />
          <InfoRow label="Bosaltma Sekli" value={loadingLabels[shipment.vehicle.wayOfUnloading || ''] || shipment.vehicle.wayOfUnloading} />
          <div className="border-t border-slate-200 mt-3 pt-3">
            <InfoRow label="Toplam Agirlik" value={`${(shipment.totalKg / 1000).toFixed(1)} ton`} />
            <InfoRow label="Desi" value={shipment.totalDs} />
            <InfoRow label="Mesafe" value={`${shipment.routeTotalDistanceInKm} km`} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" /> Fiyat Bilgisi
          </h3>
          <InfoRow label="Fiyatlandirma" value={shipment.pricing.type === 'FIXED' ? 'Sabit Fiyat' : 'Ihale'} />
          <InfoRow label="Baz Fiyat" value={shipment.pricing.price ? `${shipment.pricing.price.toLocaleString('tr-TR')} ${shipment.pricing.currency}` : '-'} />
          <InfoRow label="KDV" value={shipment.pricing.tax ? `${shipment.pricing.tax.toLocaleString('tr-TR')} ${shipment.pricing.currency}` : '-'} />
          <div className="flex items-center justify-between py-3 mt-2 bg-orange-50 rounded-xl px-4">
            <span className="text-[13px] font-semibold text-orange-800">Toplam</span>
            <span className="text-[18px] font-bold text-orange-700">
              {shipment.pricing.total ? `${shipment.pricing.total.toLocaleString('tr-TR')} ${shipment.pricing.currency}` : '-'}
            </span>
          </div>
          <div className="mt-3">
            <InfoRow label="Teslimat Tipi" value={shipment.pricing.deliveryType || '-'} />
            {shipment.pricing.targetCost && (
              <InfoRow label="Hedef Maliyet" value={`${shipment.pricing.targetCost.toLocaleString('tr-TR')} ${shipment.pricing.currency}`} />
            )}
          </div>

          <div className="border-t border-slate-200 mt-4 pt-4">
            <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Ek Bilgiler</h4>
            <div className="flex items-center gap-3 flex-wrap">
              {shipment.temperatureType && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[12px] text-slate-600">{temperatureLabels[shipment.temperatureType]}</span>
                </div>
              )}
              {shipment.isRoundTrip && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[12px] text-blue-600">Gidis-Donus</span>
                </div>
              )}
            </div>
            {shipment.pickupStartDate && (
              <InfoRow label="Yuklenme Tarihi" value={new Date(shipment.pickupStartDate).toLocaleString('tr-TR')} />
            )}
            {shipment.estimatedDeliveryDate && (
              <InfoRow label="Tahmini Teslimat" value={new Date(shipment.estimatedDeliveryDate).toLocaleString('tr-TR')} />
            )}
          </div>
        </div>
      </div>

      {/* Route Map with Leaflet */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-slate-400" /> Guzergah Haritasi
          </h3>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> Yuklenme</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> Teslimat</span>
            {vehicleLoc && <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-orange-500" style={{ borderRadius: 5 }} /> Arac Konumu</span>}
          </div>
        </div>

        {/* Vehicle location info bar */}
        {vehicleLoc && (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-orange-50 border border-orange-200 mb-4">
            <Truck className="w-5 h-5 text-orange-600" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-orange-800">Canli Arac Konumu</p>
              <p className="text-[11px] text-orange-600">
                Koordinat: {vehicleLoc.lat.toFixed(4)}, {vehicleLoc.lng.toFixed(4)} | Hiz: {vehicleLoc.speed} km/s | Yon: {vehicleLoc.heading}°
              </p>
            </div>
            <span className="text-[10px] text-orange-400">{new Date(vehicleLoc.timestamp).toLocaleString('tr-TR')}</span>
          </div>
        )}

        <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200">
          {hasCoords ? (
            <MapContainer
              center={mapCenter}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Pickup marker */}
              <Marker position={[shipment.pickup.latitude!, shipment.pickup.longitude!]} icon={pickupMarker}>
                <Popup>
                  <div className="text-[12px]">
                    <p className="font-semibold text-green-700">Yuklenme Noktasi</p>
                    <p className="font-medium">{shipment.pickup.company}</p>
                    <p className="text-slate-500">{shipment.pickup.city}, {shipment.pickup.district}</p>
                  </div>
                </Popup>
              </Marker>
              {/* Dropoff marker */}
              <Marker position={[shipment.dropoff.latitude!, shipment.dropoff.longitude!]} icon={dropoffMarker}>
                <Popup>
                  <div className="text-[12px]">
                    <p className="font-semibold text-blue-700">Teslimat Noktasi</p>
                    <p className="font-medium">{shipment.dropoff.company}</p>
                    <p className="text-slate-500">{shipment.dropoff.city}, {shipment.dropoff.district}</p>
                  </div>
                </Popup>
              </Marker>
              {/* Route line */}
              <Polyline
                positions={
                  vehicleLoc
                    ? [[shipment.pickup.latitude!, shipment.pickup.longitude!], [vehicleLoc.lat, vehicleLoc.lng], [shipment.dropoff.latitude!, shipment.dropoff.longitude!]]
                    : [[shipment.pickup.latitude!, shipment.pickup.longitude!], [shipment.dropoff.latitude!, shipment.dropoff.longitude!]]
                }
                pathOptions={{ color: '#f97316', weight: 3, opacity: 0.6, dashArray: '8 6' }}
              />
              {/* Vehicle location marker */}
              {vehicleLoc && (
                <Marker position={[vehicleLoc.lat, vehicleLoc.lng]} icon={vehicleMarker}>
                  <Popup>
                    <div className="text-[12px]">
                      <p className="font-semibold text-orange-600">Arac Konumu</p>
                      <p>Hiz: {vehicleLoc.speed} km/s</p>
                      <p>Yon: {vehicleLoc.heading}°</p>
                      <p className="text-slate-500 mt-1">{new Date(vehicleLoc.timestamp).toLocaleString('tr-TR')}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-[14px] text-slate-400 font-medium">Koordinat bilgisi mevcut degil</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
          <span>{shipment.pickup.city} → {shipment.dropoff.city}</span>
          <span className="font-medium text-orange-500">Toplam Mesafe: {shipment.routeTotalDistanceInKm} km</span>
        </div>
      </div>
    </div>
  )
}
