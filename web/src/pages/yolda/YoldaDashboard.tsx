import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Package, CheckCircle2, XCircle, Plus, Users, Eye } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import type { YoldaShipment } from '../../api/yolda'

// --- Mock Data (based on real Yolda API responses) ---
const mockShipments: YoldaShipment[] = [
  {
    id: 'yld-001',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Istanbul', name: 'Mehmet', phoneNumber: '+905559876543', city: 'Istanbul', district: 'Tuzla', address: 'Tuzla Lojistik Merkezi', addressType: 'WAREHOUSE', latitude: 40.8167, longitude: 29.3000 },
    shipmentType: 'FTL', totalKg: 22000, totalDs: 45, routeTotalDistanceInKm: 78,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-28T08:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-28T07:00:00' }, { type: 'APPROVED', date: '2026-04-28T08:30:00' }, { type: 'IN_TRANSIT', date: '2026-04-28T10:00:00' }],
    vehicle: { type: 'TIR', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 24, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_BEHIND', wayOfUnloading: 'FORKLIFT_FROM_THE_SIDE' },
    pricing: { type: 'FIXED', price: 14500, tax: 2610, total: 17110, currency: 'TRY', deliveryType: 'STANDARD' },
  },
  {
    id: 'yld-002',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Ankara', name: 'Fatma', phoneNumber: '+905553456789', city: 'Ankara', district: 'Sincan', address: 'Sincan OSB Lojistik Alani', addressType: 'WAREHOUSE', latitude: 39.9690, longitude: 32.5578 },
    shipmentType: 'FTL', totalKg: 18500, totalDs: 38, routeTotalDistanceInKm: 385,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-27T06:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-27T05:00:00' }, { type: 'APPROVED', date: '2026-04-27T06:00:00' }, { type: 'VEHICLE_GETTING_SUPPLIED', date: '2026-04-27T07:00:00' }, { type: 'VEHICLE_IS_SUPPLIED', date: '2026-04-27T08:00:00' }, { type: 'IN_TRANSIT', date: '2026-04-27T09:00:00' }, { type: 'DELIVERED', date: '2026-04-27T18:30:00' }],
    vehicle: { type: 'TIR', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 24, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_BEHIND', wayOfUnloading: 'FORKLIFT_FROM_BEHIND' },
    pricing: { type: 'FIXED', price: 28000, tax: 5040, total: 33040, currency: 'TRY', deliveryType: 'STANDARD' },
  },
  {
    id: 'yld-003',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Izmir', name: 'Ali', phoneNumber: '+905557654321', city: 'Izmir', district: 'Kemalpasa', address: 'Kemalpasa OSB Lojistik Alani', addressType: 'WAREHOUSE', latitude: 38.4260, longitude: 27.4270 },
    shipmentType: 'FTL', totalKg: 20000, totalDs: 42, routeTotalDistanceInKm: 490,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-29T07:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-29T06:00:00' }],
    vehicle: { type: 'TIR', bodyType: 'MEGA_TRAILER', tonnagePerVehicle: 26, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_THE_SIDE', wayOfUnloading: 'FORKLIFT_FROM_THE_SIDE' },
    pricing: { type: 'AUCTION', currency: 'TRY', deliveryType: 'STANDARD', targetCost: 32000 },
  },
  {
    id: 'yld-004',
    pickup: { company: 'Petkim Petrokimya A.S.', name: 'Kemal', phoneNumber: '+905551112233', city: 'Izmir', district: 'Aliaga', address: 'Petkim Petrokimya Holding', addressType: 'FACTORY', latitude: 38.7983, longitude: 26.9590 },
    dropoff: { company: 'A101 Depo Bursa', name: 'Zeynep', phoneNumber: '+905554443322', city: 'Bursa', district: 'Nilufer', address: 'Nilufer OSB Depo Alani', addressType: 'WAREHOUSE', latitude: 40.2128, longitude: 28.9482 },
    shipmentType: 'FTL', totalKg: 15000, totalDs: 30, routeTotalDistanceInKm: 320,
    temperatureType: 'COLD', isRoundTrip: false, pickupStartDate: '2026-04-26T05:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-26T04:00:00' }, { type: 'APPROVED', date: '2026-04-26T05:00:00' }, { type: 'VEHICLE_GETTING_SUPPLIED', date: '2026-04-26T06:00:00' }, { type: 'VEHICLE_IS_SUPPLIED', date: '2026-04-26T07:00:00' }, { type: 'IN_TRANSIT', date: '2026-04-26T08:00:00' }, { type: 'DELIVERED', date: '2026-04-26T16:00:00' }],
    vehicle: { type: 'REEFER_TRUCK', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 20, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_BEHIND', wayOfUnloading: 'FORKLIFT_FROM_BEHIND' },
    pricing: { type: 'FIXED', price: 35000, tax: 6300, total: 41300, currency: 'TRY', deliveryType: 'EXPRESS' },
  },
  {
    id: 'yld-005',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Antalya', name: 'Hasan', phoneNumber: '+905556667788', city: 'Antalya', district: 'Dosemealti', address: 'Dosemealti Lojistik Merkezi', addressType: 'WAREHOUSE', latitude: 37.0027, longitude: 30.6489 },
    shipmentType: 'FTL', totalKg: 24000, totalDs: 50, routeTotalDistanceInKm: 620,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-25T04:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-25T03:00:00' }, { type: 'APPROVED', date: '2026-04-25T04:00:00' }, { type: 'VEHICLE_GETTING_SUPPLIED', date: '2026-04-25T05:00:00' }, { type: 'VEHICLE_IS_SUPPLIED', date: '2026-04-25T06:00:00' }, { type: 'IN_TRANSIT', date: '2026-04-25T07:00:00' }, { type: 'DELIVERED', date: '2026-04-25T20:00:00' }],
    vehicle: { type: 'CURTAINSIDER', bodyType: 'LONG_TRAILER', tonnagePerVehicle: 26, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_THE_SIDE', wayOfUnloading: 'CRANE' },
    pricing: { type: 'FIXED', price: 42000, tax: 7560, total: 49560, currency: 'TRY', deliveryType: 'STANDARD' },
  },
  {
    id: 'yld-006',
    pickup: { company: 'Catom Kimya A.S.', name: 'Ahmet', phoneNumber: '+905551234567', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', addressType: 'FACTORY', latitude: 40.7988, longitude: 29.4314 },
    dropoff: { company: 'A101 Depo Konya', name: 'Veli', phoneNumber: '+905558889900', city: 'Konya', district: 'Selcuklu', address: 'Selcuklu OSB Depo Sahasi', addressType: 'WAREHOUSE', latitude: 37.8713, longitude: 32.4846 },
    shipmentType: 'FTL', totalKg: 16000, totalDs: 32, routeTotalDistanceInKm: 450,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-29T09:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-29T08:00:00' }, { type: 'APPROVED', date: '2026-04-29T09:00:00' }, { type: 'VEHICLE_GETTING_SUPPLIED', date: '2026-04-29T10:00:00' }],
    vehicle: { type: 'TRUCK', bodyType: 'SHORT_TRAILER', tonnagePerVehicle: 18, numberOfVehicles: 1, packageType: 'BOX', wayOfLoading: 'MANUAL', wayOfUnloading: 'MANUAL' },
    pricing: { type: 'FIXED', price: 26000, tax: 4680, total: 30680, currency: 'TRY', deliveryType: 'STANDARD' },
  },
  {
    id: 'yld-007',
    pickup: { company: 'Sasa Polyester A.S.', name: 'Murat', phoneNumber: '+905552223344', city: 'Adana', district: 'Ceyhan', address: 'Ceyhan Sanayi Bolgesi', addressType: 'FACTORY', latitude: 37.0167, longitude: 35.8167 },
    dropoff: { company: 'A101 Depo Istanbul', name: 'Mehmet', phoneNumber: '+905559876543', city: 'Istanbul', district: 'Tuzla', address: 'Tuzla Lojistik Merkezi', addressType: 'WAREHOUSE', latitude: 40.8167, longitude: 29.3000 },
    shipmentType: 'FTL', totalKg: 25000, totalDs: 48, routeTotalDistanceInKm: 940,
    temperatureType: 'DRY', isRoundTrip: false, pickupStartDate: '2026-04-28T03:00:00',
    status: [{ type: 'NEED_PRICE', date: '2026-04-28T02:00:00' }, { type: 'APPROVED', date: '2026-04-28T03:00:00' }, { type: 'CANCELED', date: '2026-04-28T04:00:00' }],
    vehicle: { type: 'TIR', bodyType: 'MEGA_TRAILER', tonnagePerVehicle: 26, numberOfVehicles: 1, packageType: 'PALLET', wayOfLoading: 'FORKLIFT_FROM_BEHIND', wayOfUnloading: 'FORKLIFT_FROM_BEHIND' },
    pricing: { type: 'FIXED', price: 55000, tax: 9900, total: 64900, currency: 'TRY', deliveryType: 'STANDARD' },
  },
]

const getLatestStatus = (statuses: { type: string; date: string }[]) =>
  statuses.length > 0 ? statuses[statuses.length - 1].type : 'NEED_PRICE'

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
  TIR: 'Tir',
  TRUCK: 'Kamyon',
  REEFER_TRUCK: 'Frigorifik',
  DUMPER_TRUCK: 'Damperli',
  TANKER: 'Tanker',
  LOWBED: 'Lowbed',
  CURTAINSIDER: 'Tenteli',
  LIGHT_TRUCK_3500: 'Kamyonet 3.5t',
}

const statusDistribution = [
  { name: 'Fiyat Bekleniyor', value: 1, color: '#f59e0b' },
  { name: 'Yolda', value: 1, color: '#f97316' },
  { name: 'Arac Temin', value: 1, color: '#3b82f6' },
  { name: 'Teslim Edildi', value: 3, color: '#10b981' },
  { name: 'Iptal', value: 1, color: '#ef4444' },
]

export default function YoldaDashboard() {
  const navigate = useNavigate()
  const [selectedShipment, setSelectedShipment] = useState<YoldaShipment | null>(null)

  const totalShipments = mockShipments.length
  const activeShipments = mockShipments.filter(s => {
    const st = getLatestStatus(s.status)
    return ['IN_TRANSIT', 'VEHICLE_GETTING_SUPPLIED', 'VEHICLE_IS_SUPPLIED', 'APPROVED', 'NEED_PRICE'].includes(st)
  }).length
  const deliveredShipments = mockShipments.filter(s => getLatestStatus(s.status) === 'DELIVERED').length
  const cancelledShipments = mockShipments.filter(s => getLatestStatus(s.status) === 'CANCELED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Yolda Entegrasyonu</h1>
          <p className="text-[14px] text-slate-400 mt-1">Yolda API uzerinden sevkiyat ve kontakt yonetimi</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/yolda/contacts')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Users className="w-4 h-4" /> Kontaklar
          </button>
          <button
            onClick={() => navigate('/yolda/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"
          >
            <Plus className="w-4 h-4" /> Yeni Sevkiyat
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Sevkiyat" value={String(totalShipments)} change={12} icon={Package} color="text-blue-600 bg-blue-50" />
        <StatCard label="Aktif Sevkiyat" value={String(activeShipments)} change={3} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Teslim Edildi" value={String(deliveredShipments)} change={8} icon={CheckCircle2} color="text-green-600 bg-green-50" />
        <StatCard label="Iptal Edilen" value={String(cancelledShipments)} change={-1} icon={XCircle} color="text-red-600 bg-red-50" />
      </div>

      {/* Charts + Table */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Durum Dagilimi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {statusDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusDistribution.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[12px] text-slate-600">{s.name}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Shipments Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Son Sevkiyatlar</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase">ID</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase">Guzergah</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase">Firma</th>
                  <th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase">Arac</th>
                  <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase">Agirlik</th>
                  <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase">Mesafe</th>
                  <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase">Fiyat</th>
                  <th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase">Durum</th>
                  <th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {mockShipments.map((s) => {
                  const latestStatus = getLatestStatus(s.status)
                  return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5 text-[12px] font-mono font-medium text-slate-700">{s.id}</td>
                      <td className="px-3 py-2.5 text-[13px] text-slate-700">
                        {s.pickup.city} → {s.dropoff.city}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-[12px] text-slate-600">{s.pickup.company}</div>
                        <div className="text-[11px] text-slate-400">→ {s.dropoff.company}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-[12px] text-slate-600">{vehicleLabels[s.vehicle.type] || s.vehicle.type}</td>
                      <td className="px-3 py-2.5 text-right text-[12px] text-slate-600">{(s.totalKg / 1000).toFixed(1)}t</td>
                      <td className="px-3 py-2.5 text-right text-[12px] text-slate-600">{s.routeTotalDistanceInKm} km</td>
                      <td className="px-3 py-2.5 text-right text-[13px] font-semibold text-slate-800">
                        {s.pricing.total ? `${(s.pricing.total / 1000).toFixed(1)}K TL` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant={statusVariant[latestStatus] || 'default'}>{statusLabels[latestStatus] || latestStatus}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => setSelectedShipment(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Shipment Detail Modal */}
      {selectedShipment && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedShipment(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Sevkiyat Detayi — {selectedShipment.id}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { navigate(`/yolda/shipments/${selectedShipment.id}`); setSelectedShipment(null) }}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  Detaya Git
                </button>
                <button onClick={() => setSelectedShipment(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Timeline */}
              <div>
                <h4 className="text-[13px] font-semibold text-slate-800 mb-3">Durum Gecmisi</h4>
                <div className="space-y-3">
                  {selectedShipment.status.map((st, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${i === selectedShipment.status.length - 1 ? 'bg-orange-400' : 'bg-slate-300'}`} />
                        {i < selectedShipment.status.length - 1 && <div className="w-px h-6 bg-slate-200 mt-1" />}
                      </div>
                      <div>
                        <Badge variant={statusVariant[st.type] || 'default'}>{statusLabels[st.type] || st.type}</Badge>
                        <p className="text-[11px] text-slate-400 mt-1">{new Date(st.date).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pickup / Dropoff */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <h4 className="text-[12px] font-semibold text-green-800 mb-2">Yuklenme Noktasi</h4>
                  <p className="text-[13px] font-medium text-slate-800">{selectedShipment.pickup.company}</p>
                  <p className="text-[12px] text-slate-600">{selectedShipment.pickup.city}, {selectedShipment.pickup.district}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{selectedShipment.pickup.address}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <h4 className="text-[12px] font-semibold text-blue-800 mb-2">Teslimat Noktasi</h4>
                  <p className="text-[13px] font-medium text-slate-800">{selectedShipment.dropoff.company}</p>
                  <p className="text-[12px] text-slate-600">{selectedShipment.dropoff.city}, {selectedShipment.dropoff.district}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{selectedShipment.dropoff.address}</p>
                </div>
              </div>

              {/* Vehicle & Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-[12px] font-semibold text-slate-700 mb-2">Arac Bilgisi</h4>
                  <div className="space-y-1 text-[12px] text-slate-600">
                    <p>Tip: <span className="font-medium text-slate-800">{vehicleLabels[selectedShipment.vehicle.type]}</span></p>
                    <p>Tonaj: <span className="font-medium text-slate-800">{selectedShipment.vehicle.tonnagePerVehicle}t</span></p>
                    <p>Agirlik: <span className="font-medium text-slate-800">{(selectedShipment.totalKg / 1000).toFixed(1)}t</span></p>
                    <p>Mesafe: <span className="font-medium text-slate-800">{selectedShipment.routeTotalDistanceInKm} km</span></p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <h4 className="text-[12px] font-semibold text-orange-800 mb-2">Fiyat Bilgisi</h4>
                  <div className="space-y-1 text-[12px] text-slate-600">
                    <p>Fiyat: <span className="font-medium text-slate-800">{selectedShipment.pricing.price ? `${selectedShipment.pricing.price.toLocaleString('tr-TR')} TL` : '-'}</span></p>
                    <p>KDV: <span className="font-medium text-slate-800">{selectedShipment.pricing.tax ? `${selectedShipment.pricing.tax.toLocaleString('tr-TR')} TL` : '-'}</span></p>
                    <p>Toplam: <span className="font-bold text-orange-700">{selectedShipment.pricing.total ? `${selectedShipment.pricing.total.toLocaleString('tr-TR')} TL` : '-'}</span></p>
                    <p>Teslimat: <span className="font-medium text-slate-800">{selectedShipment.pricing.deliveryType || '-'}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
