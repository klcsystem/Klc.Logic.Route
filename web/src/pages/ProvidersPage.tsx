import { useState } from 'react'
import { Building2, Plus, Search, Power, Loader2, Truck, Wifi, Settings } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import { providersApi } from '../api/providers'
import { useApi } from '../utils/useApi'
import type { Provider } from '../types'

export default function ProvidersPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: providersData, isLoading, error, refetch } = useApi(
    () => providersApi.getAll({ search: searchTerm || undefined }),
    [searchTerm],
  )
  const providers: Provider[] = providersData?.items || (Array.isArray(providersData) ? providersData as unknown as Provider[] : [])

  // Helper to convert comma-separated string fields to arrays
  const toArray = (val: string | string[] | undefined | null): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    return val.split(',').map(s => s.trim()).filter(Boolean)
  }
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'detail'>('detail')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', type: 'FTL', apiEndpoint: '', apiKey: '' })

  const filteredProviders = providers.filter((p) =>
    searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalCount = providers.length
  const activeCount = providers.filter(p => p.isActive).length
  const apiCount = providers.filter(p => p.integrationMode === 'ApiIntegrated').length
  const managedCount = providers.filter(p => p.integrationMode === 'Managed').length

  const kpis = [
    { label: 'Toplam Taşıyıcı', value: totalCount.toString(), change: 0, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: t.common.active, value: activeCount.toString(), change: 0, icon: Truck, color: 'text-green-600 bg-green-50' },
    { label: 'API Entegre', value: apiCount.toString(), change: 0, icon: Wifi, color: 'text-orange-600 bg-orange-50' },
    { label: 'Yönetilen', value: managedCount.toString(), change: 0, icon: Settings, color: 'text-purple-600 bg-purple-50' },
  ]

  const handleToggle = async (id: string) => {
    try {
      await providersApi.toggleActive(id)
      refetch()
    } catch { /* toggle failed */ }
  }

  const handleRowClick = (provider: Provider) => {
    setSelectedProvider(provider)
    setFormMode('detail')
    setDrawerOpen(true)
  }

  const handleCreate = () => {
    setSelectedProvider(null)
    setFormMode('create')
    setFormData({ name: '', code: '', type: 'FTL', apiEndpoint: '', apiKey: '' })
    setDrawerOpen(true)
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.sidebar.carriers}</h1>
          <p className="text-[14px] text-slate-400 mt-1">Taşıyıcı yönetimi ve API bağlantıları</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Plus className="w-4 h-4" /> Provider Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
      </div>

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-[14px] text-red-600 mb-3">{error}</p>
          <button onClick={refetch} className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-[13px] font-medium hover:bg-red-200 transition-colors">Tekrar Dene</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.name}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kod</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tip</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Entegrasyon</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bölgeler</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Anlaşma</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && filteredProviders.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 cursor-pointer" onClick={() => handleRowClick(p)}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><Building2 className="w-4 h-4" /></div>
                      <span className="text-[13px] font-medium text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{p.code}</td>
                  <td className="px-6 py-3.5"><Badge variant="info">{p.type}</Badge></td>
                  <td className="px-6 py-3.5">
                    {p.integrationMode === 'ApiIntegrated' && <Badge variant="orange">API</Badge>}
                    {p.integrationMode === 'SelfService' && <Badge variant="info">Self-Service</Badge>}
                    {p.integrationMode === 'Managed' && <Badge variant="default">Yönetilen</Badge>}
                  </td>
                  <td className="px-6 py-3.5 text-[12px] text-slate-500">{toArray(p.serviceRegions).join(', ')}</td>
                  <td className="px-6 py-3.5 text-center text-[13px] font-semibold text-slate-700">{p.contracts?.length ?? p.contractCount ?? 0}</td>
                  <td className="px-6 py-3.5 text-center">
                    <Badge variant={p.isActive ? 'success' : 'default'}>{p.isActive ? t.common.active : t.common.inactive}</Badge>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <button onClick={(e) => { e.stopPropagation(); handleToggle(p.id) }} className={`p-1.5 rounded-lg transition-colors ${p.isActive ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                      <Power className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredProviders.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-[14px] text-slate-400">{t.common.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={formMode === 'create' ? 'Provider Ekle' : selectedProvider?.name || ''} footer={
        formMode === 'create' ? (
          <div className="flex justify-end gap-3">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button>
          </div>
        ) : undefined
      }>
        {formMode === 'create' ? (
          <div className="space-y-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.common.name}</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Aras Kargo" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Kod</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className={inputClass} placeholder="ARAS" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Tip</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={inputClass}>
                <option value="FTL">FTL</option><option value="LTL">LTL</option><option value="Express">Express</option><option value="LastMile">Last Mile</option><option value="Intermodal">Intermodal</option>
              </select>
            </div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">API Endpoint</label><input type="text" value={formData.apiEndpoint} onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })} className={inputClass} placeholder="https://api.carrier.com" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">API Key</label><input type="password" value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className={inputClass} placeholder="sk_..." /></div>
          </div>
        ) : selectedProvider ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={selectedProvider.isActive ? 'success' : 'default'}>{selectedProvider.isActive ? t.common.active : t.common.inactive}</Badge>
              <Badge variant="info">{selectedProvider.type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Kod</span><p className="text-[14px] text-slate-800 mt-1">{selectedProvider.code}</p></div>
              <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Anlaşma Sayısı</span><p className="text-[14px] text-slate-800 mt-1">{selectedProvider.contracts?.length ?? selectedProvider.contractCount ?? 0}</p></div>
              <div className="col-span-2"><span className="text-[11px] font-semibold text-slate-400 uppercase">Hizmet Bölgeleri</span><p className="text-[14px] text-slate-800 mt-1">{toArray(selectedProvider.serviceRegions).join(', ')}</p></div>
              <div className="col-span-2"><span className="text-[11px] font-semibold text-slate-400 uppercase">Araç Tipleri</span><p className="text-[14px] text-slate-800 mt-1">{toArray(selectedProvider.supportedVehicleTypes).join(', ')}</p></div>
              {(selectedProvider.email || selectedProvider.contactEmail) && <div><span className="text-[11px] font-semibold text-slate-400 uppercase">E-posta</span><p className="text-[14px] text-slate-800 mt-1">{selectedProvider.email || selectedProvider.contactEmail}</p></div>}
              {(selectedProvider.phone || selectedProvider.contactPhone) && <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Telefon</span><p className="text-[14px] text-slate-800 mt-1">{selectedProvider.phone || selectedProvider.contactPhone}</p></div>}
              {selectedProvider.contactPerson && <div><span className="text-[11px] font-semibold text-slate-400 uppercase">İletişim Kişisi</span><p className="text-[14px] text-slate-800 mt-1">{selectedProvider.contactPerson}</p></div>}
              {selectedProvider.city && <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Şehir</span><p className="text-[14px] text-slate-800 mt-1">{selectedProvider.city}</p></div>}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
