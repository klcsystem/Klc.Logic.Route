import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, RefreshCw, Plus, Search, Filter, AlertTriangle, Snowflake, MapPin, Loader2, Route } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import { toast } from '../components/ui/Toast'
import AddressAutocomplete from '../components/map/AddressAutocomplete'
import LocationPicker from '../components/map/LocationPicker'
import { ordersApi } from '../api/orders'
import { useApi } from '../utils/useApi'
import type { GeocodingResult } from '../api/geocoding'
import type { ReverseGeocodingResult } from '../api/geocoding'
import type { Order } from '../types'

const priorityVariant: Record<string, 'default' | 'warning' | 'error'> = { Normal: 'default', Priority: 'warning', Urgent: 'error' }
const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = { Pending: 'warning', Assigned: 'info', InTransit: 'orange', Delivered: 'success', Failed: 'error', Cancelled: 'default' }

export default function OrdersPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSyncing, setIsSyncing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: ordersData, isLoading, refetch } = useApi(
    () => ordersApi.getAll({ search: searchTerm || undefined, status: statusFilter !== 'all' ? statusFilter : undefined }),
    [searchTerm, statusFilter],
  )
  const orders: Order[] = ordersData?.items || []
  const [orderForm, setOrderForm] = useState({
    orderNumber: '', customerName: '',
    originCity: '', originAddress: '', originLat: undefined as number | undefined, originLng: undefined as number | undefined,
    destinationCity: '', destinationAddress: '', destinationLat: undefined as number | undefined, destinationLng: undefined as number | undefined,
    totalWeightKg: 0, totalVolumeM3: 0, priority: 'Normal', productCategory: 'FMCG', isHazardous: false, requiresColdChain: false,
  })
  const [activeMapField, setActiveMapField] = useState<'origin' | 'destination' | null>(null)

  const statusLabels: Record<string, string> = { Pending: t.orders.pending, Assigned: t.orders.assigned, InTransit: t.orders.inTransit, Delivered: t.orders.delivered, Failed: t.orders.failed, Cancelled: t.orders.cancelled }

  const handleSyncErp = async () => {
    setIsSyncing(true)
    try {
      await ordersApi.syncErp()
      toast('success', t.orders.syncSuccess)
      refetch()
    } catch {
      toast('error', t.common.error)
    } finally {
      setIsSyncing(false)
    }
  }
  const handleRowClick = (order: Order) => { setSelectedOrder(order); setDrawerOpen(true) }
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(orders.map(o => o.id)))
  }
  const handleOptimizeRoute = () => {
    const ids = Array.from(selectedIds).join(',')
    navigate(`/route-optimizer?orderIds=${ids}`)
  }

  const totalCount = ordersData?.totalCount || orders.length
  const pendingCount = orders.filter(o => o.status === 'Pending').length
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length

  const kpis = [
    { label: t.orders.totalOrders, value: totalCount.toLocaleString(), change: 0, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: t.orders.todayOrders, value: orders.length.toString(), change: 0, icon: Package, color: 'text-orange-600 bg-orange-50' },
    { label: t.orders.pendingAssignment, value: pendingCount.toString(), change: 0, icon: Package, color: 'text-amber-600 bg-amber-50' },
    { label: t.orders.deliveredToday, value: deliveredCount.toString(), change: 0, icon: Package, color: 'text-green-600 bg-green-50' },
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
          <button onClick={() => { setOrderForm({ orderNumber: '', customerName: '', originCity: '', originAddress: '', originLat: undefined, originLng: undefined, destinationCity: '', destinationAddress: '', destinationLat: undefined, destinationLng: undefined, totalWeightKg: 0, totalVolumeM3: 0, priority: 'Normal', productCategory: 'FMCG', isHazardous: false, requiresColdChain: false }); setActiveMapField(null); setOrderDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
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
                <th className="w-10 px-3 py-3"><input type="checkbox" checked={orders.length > 0 && selectedIds.size === orders.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20" /></th>
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
              {isLoading && <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && orders.map((o) => (
                <tr key={o.id} onClick={() => handleRowClick(o)} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedIds.has(o.id) ? 'bg-orange-50/50' : ''}`}>
                  <td className="w-10 px-3 py-3.5"><input type="checkbox" checked={selectedIds.has(o.id)} onClick={(e) => toggleSelect(o.id, e)} readOnly className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20" /></td>
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
              {!isLoading && orders.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-[14px] text-slate-400">{t.common.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating action bar when orders selected */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30">
          <span className="text-[13px] font-medium">{selectedIds.size} siparis secildi</span>
          <button onClick={handleOptimizeRoute} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 transition-all">
            <Route className="w-4 h-4" /> Rota Optimize Et
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-[12px] text-slate-400 hover:text-white transition-colors">Temizle</button>
        </div>
      )}

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
      <Drawer isOpen={orderDrawerOpen} onClose={() => setOrderDrawerOpen(false)} title={t.orders.newOrder} width="max-w-xl" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setOrderDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button>
        </div>
      }>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.orderNo}</label><input type="text" value={orderForm.orderNumber} onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="ORD-2024-0827" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.customer}</label><input type="text" value={orderForm.customerName} onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" placeholder="Musteri adi" /></div>

          {/* Origin Address with Geocoding */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="text-[13px] font-semibold text-slate-700">{t.orders.originAddress}</span>
            </div>
            <AddressAutocomplete
              label=""
              value={orderForm.originAddress}
              placeholder={t.orders.searchAddress}
              onSelect={(result: GeocodingResult) => {
                setOrderForm({
                  ...orderForm,
                  originAddress: result.displayName,
                  originCity: result.city || orderForm.originCity,
                  originLat: result.lat,
                  originLng: result.lng,
                })
              }}
              onClear={() => setOrderForm({ ...orderForm, originAddress: '', originLat: undefined, originLng: undefined })}
            />
            <button
              type="button"
              onClick={() => setActiveMapField(activeMapField === 'origin' ? null : 'origin')}
              className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${activeMapField === 'origin' ? 'text-orange-500' : 'text-slate-500 hover:text-orange-500'}`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {t.orders.selectOnMap}
            </button>
            {activeMapField === 'origin' && (
              <LocationPicker
                lat={orderForm.originLat}
                lng={orderForm.originLng}
                height={220}
                onLocationChange={(lat: number, lng: number, address?: ReverseGeocodingResult) => {
                  setOrderForm({
                    ...orderForm,
                    originLat: lat,
                    originLng: lng,
                    originAddress: address?.displayName || orderForm.originAddress,
                    originCity: address?.city || orderForm.originCity,
                  })
                }}
              />
            )}
          </div>

          {/* Destination Address with Geocoding */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-[13px] font-semibold text-slate-700">{t.orders.destinationAddress}</span>
            </div>
            <AddressAutocomplete
              label=""
              value={orderForm.destinationAddress}
              placeholder={t.orders.searchAddress}
              onSelect={(result: GeocodingResult) => {
                setOrderForm({
                  ...orderForm,
                  destinationAddress: result.displayName,
                  destinationCity: result.city || orderForm.destinationCity,
                  destinationLat: result.lat,
                  destinationLng: result.lng,
                })
              }}
              onClear={() => setOrderForm({ ...orderForm, destinationAddress: '', destinationLat: undefined, destinationLng: undefined })}
            />
            <button
              type="button"
              onClick={() => setActiveMapField(activeMapField === 'destination' ? null : 'destination')}
              className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${activeMapField === 'destination' ? 'text-orange-500' : 'text-slate-500 hover:text-orange-500'}`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {t.orders.selectOnMap}
            </button>
            {activeMapField === 'destination' && (
              <LocationPicker
                lat={orderForm.destinationLat}
                lng={orderForm.destinationLng}
                height={220}
                onLocationChange={(lat: number, lng: number, address?: ReverseGeocodingResult) => {
                  setOrderForm({
                    ...orderForm,
                    destinationLat: lat,
                    destinationLng: lng,
                    destinationAddress: address?.displayName || orderForm.destinationAddress,
                    destinationCity: address?.city || orderForm.destinationCity,
                  })
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.weight}</label><input type="number" value={orderForm.totalWeightKg} onChange={(e) => setOrderForm({ ...orderForm, totalWeightKg: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.volume}</label><input type="number" step="0.1" value={orderForm.totalVolumeM3} onChange={(e) => setOrderForm({ ...orderForm, totalVolumeM3: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.orders.priority}</label>
              <select value={orderForm.priority} onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white">
                <option value="Normal">Normal</option><option value="Priority">Oncelikli</option><option value="Urgent">Acil</option>
              </select>
            </div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Urun Kategorisi</label>
              <select value={orderForm.productCategory} onChange={(e) => setOrderForm({ ...orderForm, productCategory: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white">
                <option value="Gida">Gida</option><option value="FMCG">FMCG</option><option value="Temizlik">Temizlik</option><option value="Kimyasal">Kimyasal</option><option value="Elektronik">Elektronik</option>
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
              <span className="text-[13px] font-medium text-slate-700">Soguk Zincir</span>
            </label>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
