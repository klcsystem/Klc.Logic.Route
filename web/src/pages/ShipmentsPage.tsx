import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Plus, Search } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import type { Shipment, ShipmentItem, ShipmentEvent, ShipmentStatus } from '../types'

const mockItems: ShipmentItem[] = [
  { id: 'i1', shipmentId: 's1', productCode: 'PRD-001', productName: 'Sut 1L', quantity: 500, weightKg: 520, volumeM3: 0.8, desiWeight: 160 },
]

const mockEvents: ShipmentEvent[] = [
  { id: 'e1', shipmentId: 's1', eventType: 'Created', status: 'Draft', description: 'Sevkiyat olusturuldu', createdAt: '2024-03-15 08:00', createdBy: 'Sistem' },
  { id: 'e2', shipmentId: 's1', eventType: 'Calculated', status: 'Calculated', description: 'Karar motoru calistirildi', createdAt: '2024-03-15 08:15', createdBy: 'Sistem' },
  { id: 'e3', shipmentId: 's1', eventType: 'InTransit', status: 'InTransit', description: 'Yola cikti', createdAt: '2024-03-15 12:30', createdBy: 'Sistem' },
]

const mockShipments: Shipment[] = [
  { id: 's1', shipmentNumber: 'SHP-2024-0412', orderId: '1', originCity: 'Istanbul', destinationCity: 'Ankara', status: 'InTransit', priority: 'Urgent', totalWeightKg: 735, totalVolumeM3: 1.35, totalDesiWeight: 270, chargeableWeight: 735, palletCount: 4, isHazardous: false, requiresColdChain: true, recommendedVehicle: 'Tir', selectedProviderName: 'Yolda', calculatedPrice: 8450, currency: 'TRY', requestedDeliveryDate: '2024-03-16', items: mockItems, events: mockEvents, recommendation: { selectedProviderName: 'Yolda', calculatedPrice: 8450, savingsAmount: 650, savingsPercent: 7.1, reason: 'Optimal', scorePrice: 78, scoreSpeed: 92, scoreReliability: 85, overallScore: 84, recommendedVehicle: 'Tir', explanation: '' }, createdAt: '2024-03-15' },
  { id: 's2', shipmentNumber: 'SHP-2024-0411', originCity: 'Istanbul', destinationCity: 'Bursa', status: 'Calculated', priority: 'Normal', totalWeightKg: 520, totalVolumeM3: 2.4, totalDesiWeight: 480, chargeableWeight: 520, palletCount: 3, isHazardous: false, requiresColdChain: false, recommendedVehicle: 'Kamyon', selectedProviderName: 'Tırport', calculatedPrice: 3200, currency: 'TRY', requestedDeliveryDate: '2024-03-16', items: [], events: [], createdAt: '2024-03-15' },
  { id: 's3', shipmentNumber: 'SHP-2024-0410', originCity: 'Istanbul', destinationCity: 'Istanbul', status: 'Delivered', priority: 'Normal', totalWeightKg: 210, totalVolumeM3: 0.9, totalDesiWeight: 180, chargeableWeight: 210, palletCount: 1, isHazardous: false, requiresColdChain: false, recommendedVehicle: 'Kamyonet', selectedProviderName: 'Ekol Lojistik', calculatedPrice: 1800, currency: 'TRY', requestedDeliveryDate: '2024-03-14', actualDeliveryDate: '2024-03-14', items: [], events: [], createdAt: '2024-03-14' },
  { id: 's4', shipmentNumber: 'SHP-2024-0409', originCity: 'Kocaeli', destinationCity: 'Istanbul', status: 'Draft', priority: 'Priority', totalWeightKg: 3200, totalVolumeM3: 12.5, totalDesiWeight: 2500, chargeableWeight: 3200, palletCount: 14, isHazardous: false, requiresColdChain: true, recommendedVehicle: 'Frigorifik', currency: 'TRY', requestedDeliveryDate: '2024-03-17', items: [], events: [], createdAt: '2024-03-15' },
  { id: 's5', shipmentNumber: 'SHP-2024-0408', originCity: 'Ankara', destinationCity: 'Izmir', status: 'PendingApproval', priority: 'Normal', totalWeightKg: 1500, totalVolumeM3: 6.0, totalDesiWeight: 1200, chargeableWeight: 1500, palletCount: 8, isHazardous: true, requiresColdChain: false, recommendedVehicle: 'Tir', selectedProviderName: 'Yolda', calculatedPrice: 11200, currency: 'TRY', requestedDeliveryDate: '2024-03-18', items: [], events: [], createdAt: '2024-03-15' },
]

const ALL_STATUSES: ShipmentStatus[] = ['Draft', 'Calculated', 'PendingApproval', 'Approved', 'SentToProvider', 'VehicleAssigned', 'Loading', 'InTransit', 'Delivered', 'Completed', 'Cancelled']

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  Draft: 'default', Calculated: 'info', PendingApproval: 'warning', Approved: 'success',
  SentToProvider: 'orange', VehicleAssigned: 'orange', Loading: 'orange',
  InTransit: 'orange', Delivered: 'success', Completed: 'success', Cancelled: 'error',
}

const priorityVariant: Record<string, 'default' | 'warning' | 'error'> = { Normal: 'default', Priority: 'warning', Urgent: 'error' }

export default function ShipmentsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [shipmentDrawerOpen, setShipmentDrawerOpen] = useState(false)
  const [shipmentForm, setShipmentForm] = useState({ originCity: '', destinationCity: '', totalWeightKg: 0, totalVolumeM3: 0, palletCount: 0, priority: 'Normal', requestedDeliveryDate: '', isHazardous: false, requiresColdChain: false })

  const statusLabels: Record<string, string> = {
    Draft: t.shipments.draft, Calculated: t.shipments.calculated, PendingApproval: t.shipments.pendingApproval,
    Approved: t.shipments.approved, SentToProvider: t.shipments.sentToProvider, VehicleAssigned: t.shipments.vehicleAssigned,
    Loading: t.shipments.loading, InTransit: t.shipments.inTransit, Delivered: t.shipments.delivered,
    Completed: t.shipments.completed, Cancelled: t.shipments.cancelled,
  }

  const filtered = mockShipments.filter((s) => {
    const matchSearch = searchTerm === '' || s.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (s.selectedProviderName || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const kpis = [
    { label: t.shipments.totalShipments, value: '328', change: 7, icon: Truck, color: 'text-blue-600 bg-blue-50' },
    { label: t.shipments.activeShipments, value: '24', change: 3, icon: Truck, color: 'text-orange-600 bg-orange-50' },
    { label: t.shipments.deliveredThisWeek, value: '89', change: 12, icon: Truck, color: 'text-green-600 bg-green-50' },
    { label: t.shipments.avgCost, value: '6,240 TL', change: -4, icon: Truck, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.shipments.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.shipments.subtitle}</p>
        </div>
        <button onClick={() => { setShipmentForm({ originCity: '', destinationCity: '', totalWeightKg: 0, totalVolumeM3: 0, palletCount: 0, priority: 'Normal', requestedDeliveryDate: '', isHazardous: false, requiresColdChain: false }); setShipmentDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Plus className="w-4 h-4" /> {t.shipments.newShipment}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Status Pipeline */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', ...ALL_STATUSES] as const).map((s) => {
          const count = s === 'all' ? mockShipments.length : mockShipments.filter((sh) => sh.status === s).length
          if (s !== 'all' && count === 0) return null
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-orange-400 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s === 'all' ? t.common.all : statusLabels[s]} ({count})
            </button>
          )
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.shipmentNo}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.route}</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.weight}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.vehicle}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.carrier}</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.cost}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.orders.priority}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.date}</th>
            </tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} onClick={() => navigate(`/shipments/${s.id}`)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{s.shipmentNumber}</td>
                  <td className="px-6 py-3.5 text-[12px] text-slate-500">{s.originCity} → {s.destinationCity}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{s.totalWeightKg.toLocaleString()} kg</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant="info">{s.recommendedVehicle}</Badge></td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-700">{s.selectedProviderName || '—'}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] font-medium text-slate-800">{s.calculatedPrice ? `${s.calculatedPrice.toLocaleString()} ${s.currency}` : '—'}</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={priorityVariant[s.priority]}>{s.priority}</Badge></td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={statusVariant[s.status]}>{statusLabels[s.status]}</Badge></td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{s.requestedDeliveryDate || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-6 py-12 text-center text-[14px] text-slate-400">{t.common.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Shipment Drawer */}
      <Drawer isOpen={shipmentDrawerOpen} onClose={() => setShipmentDrawerOpen(false)} title={t.shipments.newShipment} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setShipmentDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button>
        </div>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Çıkış Şehir</label><input type="text" value={shipmentForm.originCity} onChange={(e) => setShipmentForm({ ...shipmentForm, originCity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="İstanbul" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Varış Şehir</label><input type="text" value={shipmentForm.destinationCity} onChange={(e) => setShipmentForm({ ...shipmentForm, destinationCity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="Ankara" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.shipments.weight}</label><input type="number" value={shipmentForm.totalWeightKg} onChange={(e) => setShipmentForm({ ...shipmentForm, totalWeightKg: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Hacim (m³)</label><input type="number" step="0.1" value={shipmentForm.totalVolumeM3} onChange={(e) => setShipmentForm({ ...shipmentForm, totalVolumeM3: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Palet Sayısı</label><input type="number" value={shipmentForm.palletCount} onChange={(e) => setShipmentForm({ ...shipmentForm, palletCount: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Öncelik</label>
              <select value={shipmentForm.priority} onChange={(e) => setShipmentForm({ ...shipmentForm, priority: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white">
                <option value="Normal">Normal</option><option value="Priority">Öncelikli</option><option value="Urgent">Acil</option>
              </select>
            </div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Talep Edilen Teslimat Tarihi</label><input type="date" value={shipmentForm.requestedDeliveryDate} onChange={(e) => setShipmentForm({ ...shipmentForm, requestedDeliveryDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={shipmentForm.isHazardous} onChange={(e) => setShipmentForm({ ...shipmentForm, isHazardous: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20" />
              <span className="text-[13px] font-medium text-slate-700">Tehlikeli Madde (ADR)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={shipmentForm.requiresColdChain} onChange={(e) => setShipmentForm({ ...shipmentForm, requiresColdChain: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20" />
              <span className="text-[13px] font-medium text-slate-700">Soğuk Zincir</span>
            </label>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
