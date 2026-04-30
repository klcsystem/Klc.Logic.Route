import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck, DollarSign, Clock, Thermometer, RotateCcw } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import type { YoldaShipment } from '../../api/yolda'

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

// Mock shipment data (same as dashboard for consistency)
const mockShipments: Record<string, YoldaShipment> = {
  'yld-001': {
    id: 'yld-001',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Istanbul', name: 'Mehmet', phoneNumber: '+905559876543', city: 'Istanbul', district: 'Tuzla', address: 'Tuzla Lojistik Merkezi', addressType: 'WAREHOUSE', latitude: 40.8167, longitude: 29.3000 },
    shipmentType: 'FTL', totalKg: 22000, totalDs: 45, routeTotalDistanceInKm: 78,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-28T08:00:00',
    estimatedDeliveryDate: '2026-04-28T16:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-28T07:00:00' }, { type: 'APPROVED', date: '2026-04-28T08:30:00' }, { type: 'IN_TRANSIT', date: '2026-04-28T10:00:00' }],
    vehicle: { type: 'TIR', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 24, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_BEHIND', wayOfUnloading: 'FORKLIFT_FROM_THE_SIDE' },
    pricing: { type: 'FIXED', price: 14500, tax: 2610, total: 17110, currency: 'TRY', deliveryType: 'STANDARD' },
  },
  'yld-002': {
    id: 'yld-002',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Ankara', name: 'Fatma', phoneNumber: '+905553456789', city: 'Ankara', district: 'Sincan', address: 'Sincan OSB Lojistik Alani', addressType: 'WAREHOUSE', latitude: 39.9690, longitude: 32.5578 },
    shipmentType: 'FTL', totalKg: 18500, totalDs: 38, routeTotalDistanceInKm: 385,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-27T06:00:00',
    estimatedDeliveryDate: '2026-04-27T18:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-27T05:00:00' }, { type: 'APPROVED', date: '2026-04-27T06:00:00' }, { type: 'VEHICLE_GETTING_SUPPLIED', date: '2026-04-27T07:00:00' }, { type: 'VEHICLE_IS_SUPPLIED', date: '2026-04-27T08:00:00' }, { type: 'IN_TRANSIT', date: '2026-04-27T09:00:00' }, { type: 'DELIVERED', date: '2026-04-27T18:30:00' }],
    vehicle: { type: 'TIR', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 24, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_BEHIND', wayOfUnloading: 'FORKLIFT_FROM_BEHIND' },
    pricing: { type: 'FIXED', price: 28000, tax: 5040, total: 33040, currency: 'TRY', deliveryType: 'STANDARD' },
  },
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

  const latestStatus = shipment.status[shipment.status.length - 1]?.type || 'NEED_PRICE'

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

      {/* Map Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" /> Guzergah Haritasi
        </h3>
        <div className="h-[300px] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-[14px] text-slate-400 font-medium">Harita Gorunumu</p>
            <p className="text-[12px] text-slate-300 mt-1">
              {shipment.pickup.city} ({shipment.pickup.latitude}, {shipment.pickup.longitude}) → {shipment.dropoff.city} ({shipment.dropoff.latitude}, {shipment.dropoff.longitude})
            </p>
            <p className="text-[12px] text-orange-400 font-medium mt-2">Toplam Mesafe: {shipment.routeTotalDistanceInKm} km</p>
          </div>
        </div>
      </div>
    </div>
  )
}
