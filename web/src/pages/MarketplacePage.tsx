import { useState } from 'react'
import { Store, Search, Loader2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface Listing {
  id: string
  companyName: string
  from: string
  to: string
  availableDate: string
  capacityKg: number
  pricePerKg: number
  vehicleType: string
  status: string
}

const marketplaceApi = {
  getAll: (params?: { from?: string; to?: string; date?: string; minCapacity?: number }) =>
    api.get('/marketplace/listings', { params }).then(r => r.data),
}

export default function MarketplacePage() {
  const [searchForm, setSearchForm] = useState({ from: '', to: '', date: '', minCapacity: '' })

  const { data: listingsData, isLoading, refetch } = useApi<{ items: Listing[]; totalCount: number }>(
    () => marketplaceApi.getAll(
      searchForm.from || searchForm.to || searchForm.date || searchForm.minCapacity
        ? {
            from: searchForm.from || undefined,
            to: searchForm.to || undefined,
            date: searchForm.date || undefined,
            minCapacity: searchForm.minCapacity ? Number(searchForm.minCapacity) : undefined,
          }
        : undefined
    ),
    [],
  )
  const listings: Listing[] = listingsData?.items || []

  const handleSearch = () => { refetch() }

  const totalCapacity = listings.reduce((sum, l) => sum + (l.capacityKg || 0), 0)
  const avgPrice = listings.length > 0 ? listings.reduce((sum, l) => sum + (l.pricePerKg || 0), 0) / listings.length : 0

  const kpis = [
    { label: 'Aktif Ilan', value: listings.length.toString(), icon: Store, color: 'text-blue-600 bg-blue-50' },
    { label: 'Toplam Kapasite', value: `${totalCapacity.toLocaleString()} kg`, icon: Store, color: 'text-green-600 bg-green-50' },
    { label: 'Ort. Fiyat', value: `${avgPrice.toFixed(2)} TRY/kg`, icon: Store, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Kapasite Pazari</h1>
        <p className="text-[14px] text-slate-400 mt-1">Bos kapasite ilanlari ve eslestirme</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Arama Formu */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Kapasite Ara</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Nereden</label>
            <input type="text" value={searchForm.from} onChange={e => setSearchForm({ ...searchForm, from: e.target.value })} placeholder="Istanbul" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Nereye</label>
            <input type="text" value={searchForm.to} onChange={e => setSearchForm({ ...searchForm, to: e.target.value })} placeholder="Ankara" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Tarih</label>
            <input type="date" value={searchForm.date} onChange={e => setSearchForm({ ...searchForm, date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Min. Kapasite (kg)</label>
            <input type="number" value={searchForm.minCapacity} onChange={e => setSearchForm({ ...searchForm, minCapacity: e.target.value })} placeholder="1000" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" />
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
              <Search className="w-4 h-4" /> Ara
            </button>
          </div>
        </div>
      </div>

      {/* Ilanlar */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800">Kapasite Ilanlari</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Firma</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Guzergah</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kapasite</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fiyat</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Arac Tipi</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && listings.map(l => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{l.companyName}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{l.from} → {l.to}</td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{l.availableDate}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{l.capacityKg?.toLocaleString()} kg</td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{l.pricePerKg} TRY/kg</td>
                  <td className="px-6 py-3.5 text-center text-[13px] text-slate-600">{l.vehicleType}</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={l.status === 'Available' ? 'success' : 'default'}>{l.status}</Badge></td>
                </tr>
              ))}
              {!isLoading && listings.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-[14px] text-slate-400">Veri bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
