import { useState } from 'react'
import { Package, RefreshCw, Plus, Search, Filter, AlertTriangle, Snowflake } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import { toast } from '../components/ui/Toast'
import type { Order, OrderLine } from '../types'

const mockLines: OrderLine[] = [
  { id: 'l1', orderId: '1', productCode: 'PRD-001', productName: 'Sut 1L', quantity: 500, weightKg: 520, volumeM3: 0.8, palletCount: 2 },
  { id: 'l2', orderId: '1', productCode: 'PRD-002', productName: 'Yogurt 500g', quantity: 300, weightKg: 160, volumeM3: 0.4, palletCount: 1 },
]

const mockOrders: Order[] = [
  { id: '1', orderNumber: 'ORD-2024-0821', erpReferenceId: 'ERP-8821', customerName: 'Migros Besiktas', originCity: 'Istanbul', destinationCity: 'Istanbul', totalWeightKg: 680, totalVolumeM3: 2.1, palletCount: 3, productCategory: 'Gida', isHazardous: false, requiresColdChain: true, status: 'Pending', priority: 'Urgent', requestedDeliveryDate: '2024-03-16', lines: mockLines, createdAt: '2024-03-15' },
  { id: '2', orderNumber: 'ORD-2024-0822', erpReferenceId: 'ERP-8822', customerName: 'BIM Kadikoy', originCity: 'Istanbul', destinationCity: 'Istanbul', totalWeightKg: 320, totalVolumeM3: 1.5, palletCount: 2, productCategory: 'FMCG', isHazardous: false, requiresColdChain: false, status: 'Assigned', priority: 'Normal', requestedDeliveryDate: '2024-03-16', lines: [], routeId: 'R-2024-0158', createdAt: '2024-03-15' },
  { id: '3', orderNumber: 'ORD-2024-0823', erpReferenceId: 'ERP-8823', customerName: 'A101 Uskudar', originCity: 'Kocaeli', destinationCity: 'Istanbul', totalWeightKg: 1200, totalVolumeM3: 5.2, palletCount: 6, productCategory: 'Gida', isHazardous: false, requiresColdChain: true, status: 'InTransit', priority: 'Priority', requestedDeliveryDate: '2024-03-15', lines: [], routeId: 'R-2024-0157', createdAt: '2024-03-15' },
  { id: '4', orderNumber: 'ORD-2024-0824', erpReferenceId: 'ERP-8824', customerName: 'Sok Market Bakirkoy', originCity: 'Istanbul', destinationCity: 'Istanbul', totalWeightKg: 210, totalVolumeM3: 0.9, palletCount: 1, productCategory: 'Temizlik', isHazardous: true, requiresColdChain: false, status: 'Delivered', priority: 'Normal', requestedDeliveryDate: '2024-03-15', lines: [], routeId: 'R-2024-0155', createdAt: '2024-03-14' },
  { id: '5', orderNumber: 'ORD-2024-0825', erpReferenceId: 'ERP-8825', customerName: 'CarrefourSA Levent', originCity: 'Bursa', destinationCity: 'Istanbul', totalWeightKg: 520, totalVolumeM3: 2.4, palletCount: 3, productCategory: 'FMCG', isHazardous: false, requiresColdChain: false, status: 'Pending', priority: 'Normal', requestedDeliveryDate: '2024-03-17', lines: [], createdAt: '2024-03-15' },
  { id: '6', orderNumber: 'ORD-2024-0826', erpReferenceId: 'ERP-8826', customerName: 'Metro Esenyurt', originCity: 'Ankara', destinationCity: 'Istanbul', totalWeightKg: 2400, totalVolumeM3: 8.8, palletCount: 10, productCategory: 'Kimyasal', isHazardous: true, requiresColdChain: false, status: 'Failed', priority: 'Urgent', requestedDeliveryDate: '2024-03-14', lines: [], routeId: 'R-2024-0154', createdAt: '2024-03-14' },
]

const priorityVariant: Record<string, 'default' | 'warning' | 'error'> = { Normal: 'default', Priority: 'warning', Urgent: 'error' }
const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = { Pending: 'warning', Assigned: 'info', InTransit: 'orange', Delivered: 'success', Failed: 'error', Cancelled: 'default' }

export default function OrdersPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSyncing, setIsSyncing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({ orderNumber: '', customerName: '', originCity: '', destinationCity: '', totalWeightKg: 0, totalVolumeM3: 0, priority: 'Normal', productCategory: 'FMCG', isHazardous: false, requiresColdChain: false })

  const statusLabels: Record<string, string> = { Pending: t.orders.pending, Assigned: t.orders.assigned, InTransit: t.orders.inTransit, Delivered: t.orders.delivered, Failed: t.orders.failed, Cancelled: t.orders.cancelled }

  const filteredOrders = mockOrders.filter((o) => {
    const matchSearch = searchTerm === '' || o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleSyncErp = () => { setIsSyncing(true); setTimeout(() => { setIsSyncing(false); toast('success', t.orders.syncSuccess) }, 2000) }
  const handleRowClick = (order: Order) => { setSelectedOrder(order); setDrawerOpen(true) }

  const kpis = [
    { label: t.orders.totalOrders, value: '1,247', change: 5, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: t.orders.todayOrders, value: '86', change: 12, icon: Package, color: 'text-orange-600 bg-orange-50' },
    { label: t.orders.pendingAssignment, value: '23', change: -3, icon: Package, color: 'text-amber-600 bg-amber-50' },
    { label: t.orders.deliveredToday, value: '52', change: 8, icon: Package, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.orders.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.orders.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSyncErp} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? t.orders.syncing : t.orders.syncErp}
          </button>
          <button onClick={() => { setOrderForm({ orderNumber: '', customerName: '', originCity: '', destinationCity: '', totalWeightKg: 0, totalVolumeM3: 0, priority: 'Normal', productCategory: 'FMCG', isHazardous: false, requiresColdChain: false }); setOrderDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
            <Plus className="w-4 h-4" /> {t.orders.newOrder}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 appearance-none">
            <option value="all">{t.common.all}</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.orders.orderNo}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.orders.customer}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.orders.address}</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.orders.weight}</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.orders.priority}</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.date}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} onClick={() => handleRowClick(o)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-800">{o.orderNumber}</span>
                      {o.isHazardous && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                      {o.requiresColdChain && <Snowflake className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-700">{o.customerName}</td>
                  <td className="px-6 py-3.5"><span className="text-[12px] text-slate-500">{o.originCity} → {o.destinationCity}</span></td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{o.totalWeightKg.toLocaleString()} kg</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={priorityVariant[o.priority]}>{o.priority}</Badge></td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={statusVariant[o.status]}>{statusLabels[o.status]}</Badge></td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{o.requestedDeliveryDate}</td>
                </tr>
              ))}
              {filteredOrders.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-[14px] text-slate-400">{t.common.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={selectedOrder?.orderNumber || ''} width="max-w-xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[selectedOrder.status]}>{statusLabels[selectedOrder.status]}</Badge>
              <Badge variant={priorityVariant[selectedOrder.priority]}>{selectedOrder.priority}</Badge>
              {selectedOrder.isHazardous && <Badge variant="error">ADR</Badge>}
              {selectedOrder.requiresColdChain && <Badge variant="info">Frigo</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([[t.orders.customer, selectedOrder.customerName], ['ERP Ref', selectedOrder.erpReferenceId], [t.orders.address, `${selectedOrder.originCity} → ${selectedOrder.destinationCity}`], [t.common.date, selectedOrder.requestedDeliveryDate], [t.orders.weight, `${selectedOrder.totalWeightKg.toLocaleString()} kg`], [t.orders.volume, `${selectedOrder.totalVolumeM3} m³`], ['Palet', `${selectedOrder.palletCount}`], [t.orders.assignedRoute, selectedOrder.routeId || '—']] as const).map(([label, value]) => (
                <div key={label}><span className="text-[11px] font-semibold text-slate-400 uppercase">{label}</span><p className="text-[14px] text-slate-800 mt-1">{value}</p></div>
              ))}
            </div>
            {selectedOrder.lines.length > 0 && (
              <div>
                <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Siparis Kalemleri</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Urun</th>
                      <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Adet</th>
                      <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Agirlik</th>
                    </tr></thead>
                    <tbody>{selectedOrder.lines.map((line) => (
                      <tr key={line.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2"><div className="text-[13px] text-slate-700">{line.productName}</div><div className="text-[11px] text-slate-400">{line.productCode}</div></td>
                        <td className="px-4 py-2 text-right text-[13px] text-slate-600">{line.quantity}</td>
                        <td className="px-4 py-2 text-right text-[13px] text-slate-600">{line.weightKg} kg</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* New Order Drawer */}
      <Drawer isOpen={orderDrawerOpen} onClose={() => setOrderDrawerOpen(false)} title={t.orders.newOrder} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setOrderDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button>
        </div>
      }>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.orderNo}</label><input type="text" value={orderForm.orderNumber} onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="ORD-2024-0827" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.customer}</label><input type="text" value={orderForm.customerName} onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="Müşteri adı" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Çıkış Şehir</label><input type="text" value={orderForm.originCity} onChange={(e) => setOrderForm({ ...orderForm, originCity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="İstanbul" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Varış Şehir</label><input type="text" value={orderForm.destinationCity} onChange={(e) => setOrderForm({ ...orderForm, destinationCity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="Ankara" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.weight}</label><input type="number" value={orderForm.totalWeightKg} onChange={(e) => setOrderForm({ ...orderForm, totalWeightKg: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.volume}</label><input type="number" step="0.1" value={orderForm.totalVolumeM3} onChange={(e) => setOrderForm({ ...orderForm, totalVolumeM3: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.priority}</label>
              <select value={orderForm.priority} onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white">
                <option value="Normal">Normal</option><option value="Priority">Öncelikli</option><option value="Urgent">Acil</option>
              </select>
            </div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Ürün Kategorisi</label>
              <select value={orderForm.productCategory} onChange={(e) => setOrderForm({ ...orderForm, productCategory: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white">
                <option value="Gida">Gıda</option><option value="FMCG">FMCG</option><option value="Temizlik">Temizlik</option><option value="Kimyasal">Kimyasal</option><option value="Elektronik">Elektronik</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={orderForm.isHazardous} onChange={(e) => setOrderForm({ ...orderForm, isHazardous: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20" />
              <span className="text-[13px] font-medium text-slate-700">Tehlikeli Madde (ADR)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={orderForm.requiresColdChain} onChange={(e) => setOrderForm({ ...orderForm, requiresColdChain: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20" />
              <span className="text-[13px] font-medium text-slate-700">Soğuk Zincir</span>
            </label>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
