import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Plus, Search, Loader2, Package, CheckCircle, Clock } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import { shipmentsApi } from '../api/shipments'
import { useApi } from '../utils/useApi'
import type { Shipment, ShipmentStatus } from '../types'

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
  const [providerFilter, setProviderFilter] = useState('all')
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [shipmentDrawerOpen, setShipmentDrawerOpen] = useState(false)
  const [shipmentForm, setShipmentForm] = useState({ originCity: '', destinationCity: '', totalWeightKg: 0, totalVolumeM3: 0, palletCount: 0, priority: 'Normal', requestedDeliveryDate: '', isHazardous: false, requiresColdChain: false })

  const { data: shipmentsData, isLoading } = useApi(
    () => shipmentsApi.getAll({ search: searchTerm || undefined, status: statusFilter !== 'all' ? statusFilter : undefined }),
    [searchTerm, statusFilter],
  )
  const allShipments: Shipment[] = shipmentsData?.items || (Array.isArray(shipmentsData) ? shipmentsData as unknown as Shipment[] : [])

  const statusLabels: Record<string, string> = {
    Draft: t.shipments.draft, Calculated: t.shipments.calculated, PendingApproval: t.shipments.pendingApproval,
    Approved: t.shipments.approved, SentToProvider: t.shipments.sentToProvider, VehicleAssigned: t.shipments.vehicleAssigned,
    Loading: t.shipments.loading, InTransit: t.shipments.inTransit, Delivered: t.shipments.delivered,
    Completed: t.shipments.completed, Cancelled: t.shipments.cancelled,
  }

  const uniqueProviders = [...new Set(allShipments.map((s) => s.selectedProviderName).filter(Boolean))] as string[]

  const filtered = allShipments.filter((s) => {
    const matchProvider = providerFilter === 'all' || s.selectedProviderName === providerFilter
    return matchProvider
  })

  const totalCount = shipmentsData?.totalCount || allShipments.length
  const inTransitCount = allShipments.filter(s => s.status === 'InTransit').length
  const deliveredCount = allShipments.filter(s => s.status === 'Delivered').length
  const pendingCount = allShipments.filter(s => ['Draft', 'PendingApproval', 'Calculated'].includes(s.status)).length

  const kpis = [
    { label: t.shipments.totalShipments, value: totalCount.toLocaleString(), change: 0, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: t.shipments.inTransit, value: inTransitCount.toString(), change: 0, icon: Truck, color: 'text-orange-600 bg-orange-50' },
    { label: t.shipments.delivered, value: deliveredCount.toString(), change: 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Bekleyen', value: pendingCount.toString(), change: 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
  ]

  const handleRowClick = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setDetailDrawerOpen(true)
  }

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
          const count = s === 'all' ? allShipments.length : allShipments.filter((sh) => sh.status === s).length
          if (s !== 'all' && count === 0) return null
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-orange-400 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s === 'all' ? t.common.all : statusLabels[s]} ({count})
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
        </div>
        <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400">
          <option value="all">Tum Tasiyicilar</option>
          {uniqueProviders.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.shipmentNo}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Siparis</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.carrier}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cikis Sehir</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Varis Sehir</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.weight}</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.cost}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.shipments.vehicle}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.orders.priority}</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && filtered.map((s) => (
                <tr key={s.id} onClick={() => handleRowClick(s)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{s.shipmentNumber}</td>
                  <td className="px-6 py-3.5 text-[12px] text-slate-500">{s.orderId ? s.orderId.substring(0, 8) + '...' : '--'}</td>
                  <td className="px-6 py-3.5">
                    {s.selectedProviderName ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] text-slate-700">{s.selectedProviderName}</span>
                        {s.providerIntegrationMode === 'ApiIntegrated' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-orange-50 text-orange-600 border border-orange-200">API</span>}
                        {s.providerIntegrationMode === 'SelfService' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-600 border border-blue-200">SS</span>}
                        {s.providerIntegrationMode === 'Managed' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">YON</span>}
                      </div>
                    ) : '--'}
                  </td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={statusVariant[s.status]}>{statusLabels[s.status]}</Badge></td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{s.originCity || '--'}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{s.destinationCity || '--'}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{s.totalWeightKg.toLocaleString()} kg</td>
                  <td className="px-6 py-3.5 text-right text-[13px] font-medium text-slate-800">{s.calculatedPrice ? `${s.calculatedPrice.toLocaleString()} ${s.currency}` : '--'}</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant="info">{s.recommendedVehicle}</Badge></td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={priorityVariant[s.priority]}>{s.priority}</Badge></td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={10} className="px-6 py-12 text-center text-[14px] text-slate-400">{t.common.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <Drawer isOpen={detailDrawerOpen} onClose={() => setDetailDrawerOpen(false)} title={selectedShipment?.shipmentNumber || ''} width="max-w-xl">
        {selectedShipment && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[selectedShipment.status]}>{statusLabels[selectedShipment.status]}</Badge>
              <Badge variant={priorityVariant[selectedShipment.priority]}>{selectedShipment.priority}</Badge>
              {selectedShipment.isHazardous && <Badge variant="error">ADR</Badge>}
              {selectedShipment.requiresColdChain && <Badge variant="info">Frigo</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {([
                ['Cikis', selectedShipment.originCity || '--'],
                ['Varis', selectedShipment.destinationCity || '--'],
                [t.shipments.weight, `${selectedShipment.totalWeightKg.toLocaleString()} kg`],
                ['Hacim', `${selectedShipment.totalVolumeM3} m3`],
                ['Palet', `${selectedShipment.palletCount}`],
                [t.shipments.carrier, selectedShipment.selectedProviderName || '--'],
                [t.shipments.cost, selectedShipment.calculatedPrice ? `${selectedShipment.calculatedPrice.toLocaleString()} ${selectedShipment.currency}` : '--'],
                [t.common.date, selectedShipment.requestedDeliveryDate || '--'],
              ] as const).map(([label, value]) => (
                <div key={label}><span className="text-[11px] font-semibold text-slate-400 uppercase">{label}</span><p className="text-[14px] text-slate-800 mt-1">{value}</p></div>
              ))}
            </div>

            {/* Tracking Events */}
            {(selectedShipment.events || []).length > 0 && (
              <div>
                <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Takip Olaylari</h4>
                <div className="space-y-3">
                  {(selectedShipment.events || []).map((event) => (
                    <div key={event.id} className="flex gap-3 items-start">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                      <div>
                        <p className="text-[13px] font-medium text-slate-700">{event.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={statusVariant[event.status] || 'default'}>{statusLabels[event.status] || event.status}</Badge>
                          {event.location && <span className="text-[11px] text-slate-400">{event.location}</span>}
                          <span className="text-[11px] text-slate-400">{new Date(event.createdAt).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {selectedShipment.items.length > 0 && (
              <div>
                <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Sevkiyat Kalemleri</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Urun</th>
                      <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Adet</th>
                      <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Agirlik</th>
                    </tr></thead>
                    <tbody>{selectedShipment.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2"><div className="text-[13px] text-slate-700">{item.productName}</div><div className="text-[11px] text-slate-400">{item.productCode}</div></td>
                        <td className="px-4 py-2 text-right text-[13px] text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-2 text-right text-[13px] text-slate-600">{item.weightKg} kg</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => { setDetailDrawerOpen(false); navigate(`/shipments/${selectedShipment.id}`) }}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 transition-all text-center"
              >
                Detay Sayfasina Git
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Shipment Drawer */}
      <Drawer isOpen={shipmentDrawerOpen} onClose={() => setShipmentDrawerOpen(false)} title={t.shipments.newShipment} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setShipmentDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button>
        </div>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Cikis Sehir</label><input type="text" value={shipmentForm.originCity} onChange={(e) => setShipmentForm({ ...shipmentForm, originCity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="Istanbul" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Varis Sehir</label><input type="text" value={shipmentForm.destinationCity} onChange={(e) => setShipmentForm({ ...shipmentForm, destinationCity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="Ankara" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.shipments.weight}</label><input type="number" value={shipmentForm.totalWeightKg} onChange={(e) => setShipmentForm({ ...shipmentForm, totalWeightKg: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Hacim (m3)</label><input type="number" step="0.1" value={shipmentForm.totalVolumeM3} onChange={(e) => setShipmentForm({ ...shipmentForm, totalVolumeM3: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Palet Sayisi</label><input type="number" value={shipmentForm.palletCount} onChange={(e) => setShipmentForm({ ...shipmentForm, palletCount: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Oncelik</label>
              <select value={shipmentForm.priority} onChange={(e) => setShipmentForm({ ...shipmentForm, priority: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white">
                <option value="Normal">Normal</option><option value="Priority">Oncelikli</option><option value="Urgent">Acil</option>
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
              <span className="text-[13px] font-medium text-slate-700">Soguk Zincir</span>
            </label>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
