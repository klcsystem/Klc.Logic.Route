import { useState } from 'react'
import { Truck, Package, CheckCircle2, Clock, MapPin, TrendingUp } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import StatCard from '../components/ui/StatCard'

const mockAssignedShipments = [
  { id: 's1', number: 'SHP-2026-0412', route: 'İstanbul → Ankara', weight: '18.5 ton', vehicle: 'Tır', assignedDate: '2026-04-29', status: 'InTransit', driverName: 'Ahmet Yılmaz', plate: '34 MRT 105' },
  { id: 's2', number: 'SHP-2026-0415', route: 'Bursa → Konya', weight: '8.4 ton', vehicle: 'Kamyon', assignedDate: '2026-04-30', status: 'Loading', driverName: 'Mehmet Kaya', plate: '34 MRT 106' },
  { id: 's3', number: 'SHP-2026-0418', route: 'İzmir → Antalya', weight: '22.0 ton', vehicle: 'Tır', assignedDate: '2026-04-30', status: 'PendingPickup', driverName: null, plate: null },
  { id: 's4', number: 'SHP-2026-0410', route: 'Ankara → İstanbul', weight: '12.0 ton', vehicle: 'Kamyon', assignedDate: '2026-04-28', status: 'Delivered', driverName: 'Ahmet Yılmaz', plate: '34 MRT 105' },
]

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  PendingPickup: 'warning', Loading: 'info', InTransit: 'orange', Delivered: 'success',
}
const statusLabels: Record<string, string> = {
  PendingPickup: 'Yükleme Bekliyor', Loading: 'Yükleniyor', InTransit: 'Yolda', Delivered: 'Teslim Edildi',
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

export default function ProviderPortalPage() {
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<typeof mockAssignedShipments[0] | null>(null)
  const [updateForm, setUpdateForm] = useState({ status: 'Loading', note: '', latitude: '', longitude: '' })

  const providerName = 'Murat Lojistik'
  const activeCount = mockAssignedShipments.filter(s => s.status !== 'Delivered').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <h1 className="text-[22px] font-bold">Hoş geldiniz, {providerName}</h1>
        <p className="text-orange-100 text-[14px] mt-1">Taşıyıcı portalı — atanmış sevkiyatlarınızı yönetin</p>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-200" />
            <span className="text-[15px] font-semibold">{activeCount} aktif sevkiyat</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-orange-200" />
            <span className="text-[15px] font-semibold">%94.2 zamanında teslimat</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Sevkiyat" value="48" change={5} icon={Package} color="text-blue-600 bg-blue-50" />
        <StatCard label="Aktif" value={String(activeCount)} change={1} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Zamanında Teslimat" value="%94.2" change={2} icon={TrendingUp} color="text-green-600 bg-green-50" />
        <StatCard label="Ort. Teslimat Süresi" value="18 saat" change={-3} icon={Clock} color="text-purple-600 bg-purple-50" />
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">Atanmış Sevkiyatlar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Sevkiyat No</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Güzergah</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ağırlık</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Şoför / Plaka</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Durum</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {mockAssignedShipments.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-semibold text-slate-800">{s.number}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-700">{s.route}</td>
                  <td className="px-6 py-3.5 text-center text-[13px] text-slate-600">{s.weight}</td>
                  <td className="px-6 py-3.5 text-[12px] text-slate-500">
                    {s.driverName ? <span>{s.driverName} — {s.plate}</span> : <span className="text-amber-500">Atanmadı</span>}
                  </td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={statusVariant[s.status]}>{statusLabels[s.status]}</Badge></td>
                  <td className="px-6 py-3.5 text-center">
                    {s.status !== 'Delivered' && (
                      <button
                        onClick={() => { setSelectedShipment(s); setUpdateForm({ status: 'Loading', note: '', latitude: '', longitude: '' }); setUpdateDrawerOpen(true) }}
                        className="px-3 py-1 rounded-lg bg-orange-50 text-orange-500 text-[12px] font-medium hover:bg-orange-100 transition-colors"
                      >
                        Güncelle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Drawer */}
      <Drawer isOpen={updateDrawerOpen} onClose={() => setUpdateDrawerOpen(false)} title={`Durum Güncelle — ${selectedShipment?.number || ''}`} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setUpdateDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">İptal</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">Güncelle</button>
        </div>
      }>
        <div className="space-y-4">
          {selectedShipment && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
              <p className="text-[13px] font-semibold text-slate-800">{selectedShipment.route}</p>
              <p className="text-[12px] text-slate-500">{selectedShipment.weight} — {selectedShipment.vehicle}</p>
            </div>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Yeni Durum</label>
            <select value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })} className={inputClass}>
              <option value="Loading">Yükleniyor</option>
              <option value="InTransit">Yola Çıktı</option>
              <option value="AtDestination">Varış Noktasında</option>
              <option value="Delivered">Teslim Edildi</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Not</label>
            <textarea value={updateForm.note} onChange={(e) => setUpdateForm({ ...updateForm, note: e.target.value })} className={inputClass} rows={3} placeholder="Ek bilgi..." />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Konum (opsiyonel)</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={updateForm.latitude} onChange={(e) => setUpdateForm({ ...updateForm, latitude: e.target.value })} className={inputClass} placeholder="Enlem" />
              <input type="text" value={updateForm.longitude} onChange={(e) => setUpdateForm({ ...updateForm, longitude: e.target.value })} className={inputClass} placeholder="Boylam" />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
