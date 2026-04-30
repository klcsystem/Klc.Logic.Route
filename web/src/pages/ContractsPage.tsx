import { useState } from 'react'
import { FileText, Plus, Search, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import type { Contract, ContractRate } from '../types'

const mockRates: ContractRate[] = [
  { id: 'r1', contractId: '1', originRegion: 'Marmara', destinationRegion: 'Ic Anadolu', vehicleCategory: 'Tir', minWeightKg: 0, maxWeightKg: 20000, pricePerUnit: 42.50, pricingUnit: 'km', currency: 'TRY', urgentSurchargePercent: 25, adrSurchargePercent: 15, frigoSurchargePercent: 20 },
  { id: 'r2', contractId: '1', originRegion: 'Marmara', destinationRegion: 'Ege', vehicleCategory: 'Kamyon', minWeightKg: 0, maxWeightKg: 10000, pricePerUnit: 35.00, pricingUnit: 'km', currency: 'TRY', urgentSurchargePercent: 20 },
]

const mockContracts: Contract[] = [
  { id: '1', providerId: '1', providerName: 'Aras Kargo', contractNumber: 'CNT-2024-001', startDate: '2024-01-01', endDate: '2024-12-31', status: 'Active', rates: mockRates },
  { id: '2', providerId: '2', providerName: 'MNG Kargo', contractNumber: 'CNT-2024-002', startDate: '2024-03-01', endDate: '2025-02-28', status: 'Active', rates: [] },
  { id: '3', providerId: '3', providerName: 'Yurtici Kargo', contractNumber: 'CNT-2024-003', startDate: '2024-01-15', endDate: '2024-07-15', status: 'Active', rates: [] },
  { id: '4', providerId: '4', providerName: 'Surat Kargo', contractNumber: 'CNT-2023-045', startDate: '2023-06-01', endDate: '2024-01-31', status: 'Expired', rates: [] },
  { id: '5', providerId: '5', providerName: 'PTT Kargo', contractNumber: 'CNT-2024-004', startDate: '2024-04-01', endDate: '2025-03-31', status: 'Draft', rates: [] },
]

const statusVariant: Record<string, 'success' | 'error' | 'warning' | 'default'> = { Active: 'success', Expired: 'error', Draft: 'warning', Suspended: 'default' }

export default function ContractsPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [rateDrawerOpen, setRateDrawerOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [rateForm, setRateForm] = useState({ originRegion: '', destinationRegion: '', vehicleCategory: 'Tir', minWeightKg: 0, maxWeightKg: 25000, pricePerUnit: 0, pricingUnit: 'km', currency: 'TRY', urgentSurchargePercent: 0, adrSurchargePercent: 0, frigoSurchargePercent: 0, weekendSurchargePercent: 0 })
  const [contractDrawerOpen, setContractDrawerOpen] = useState(false)
  const [contractForm, setContractForm] = useState({ providerName: '', contractNumber: '', startDate: '', endDate: '', status: 'Draft' })

  const statusLabels: Record<string, string> = { Active: t.contracts.active, Expired: t.contracts.expired, Draft: t.contracts.draft, Suspended: 'Askiya Alindi' }

  const filteredContracts = mockContracts.filter((c) =>
    searchTerm === '' || c.providerName.toLowerCase().includes(searchTerm.toLowerCase()) || c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleRowClick = (contract: Contract) => { setSelectedContract(contract); setDetailDrawerOpen(true) }

  const kpis = [
    { label: t.contracts.totalContracts, value: '24', change: 4, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: t.contracts.activeContracts, value: '18', change: 2, icon: FileText, color: 'text-green-600 bg-green-50' },
    { label: t.contracts.expiringThisMonth, value: '3', change: -1, icon: FileText, color: 'text-amber-600 bg-amber-50' },
    { label: t.contracts.avgTariff, value: '38.65 TL', change: -3, icon: FileText, color: 'text-purple-600 bg-purple-50' },
  ]

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.contracts.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.contracts.subtitle}</p>
        </div>
        <button onClick={() => { setContractForm({ providerName: '', contractNumber: '', startDate: '', endDate: '', status: 'Draft' }); setContractDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Plus className="w-4 h-4" /> {t.contracts.newContract}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.contracts.contractNo}</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.contracts.carrier}</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.contracts.startDate}</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.contracts.endDate}</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tarife</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c) => (
                <tr key={c.id} onClick={() => handleRowClick(c)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{c.contractNumber}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-700">{c.providerName}</td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{c.startDate}</td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{c.endDate}</td>
                  <td className="px-6 py-3.5 text-center text-[13px] font-medium text-slate-700">{c.rates.length} kalem</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={statusVariant[c.status]}>{statusLabels[c.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Detail + Rates Drawer */}
      <Drawer isOpen={detailDrawerOpen} onClose={() => setDetailDrawerOpen(false)} title={selectedContract?.contractNumber || ''} width="max-w-2xl">
        {selectedContract && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[selectedContract.status]}>{statusLabels[selectedContract.status]}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-[11px] font-semibold text-slate-400 uppercase">{t.contracts.carrier}</span><p className="text-[14px] text-slate-800 mt-1">{selectedContract.providerName}</p></div>
              <div><span className="text-[11px] font-semibold text-slate-400 uppercase">{t.contracts.startDate}</span><p className="text-[14px] text-slate-800 mt-1">{selectedContract.startDate}</p></div>
              <div><span className="text-[11px] font-semibold text-slate-400 uppercase">{t.contracts.endDate}</span><p className="text-[14px] text-slate-800 mt-1">{selectedContract.endDate}</p></div>
            </div>

            {/* Rates Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[14px] font-semibold text-slate-800">Tarife Kalemleri</h4>
                <button onClick={() => { setRateForm({ originRegion: '', destinationRegion: '', vehicleCategory: 'Tir', minWeightKg: 0, maxWeightKg: 25000, pricePerUnit: 0, pricingUnit: 'km', currency: 'TRY', urgentSurchargePercent: 0, adrSurchargePercent: 0, frigoSurchargePercent: 0, weekendSurchargePercent: 0 }); setRateDrawerOpen(true) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-500 text-[12px] font-medium hover:bg-orange-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Tarife Ekle
                </button>
              </div>
              {selectedContract.rates.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Guzergah</th>
                      <th className="text-center px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Arac</th>
                      <th className="text-center px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Agirlik</th>
                      <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Fiyat</th>
                      <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Ek Ucretler</th>
                      <th className="w-10"></th>
                    </tr></thead>
                    <tbody>
                      {selectedContract.rates.map((rate) => (
                        <tr key={rate.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2 text-[13px] text-slate-700">{rate.originRegion} → {rate.destinationRegion}</td>
                          <td className="px-4 py-2 text-center"><Badge variant="info">{rate.vehicleCategory}</Badge></td>
                          <td className="px-4 py-2 text-center text-[12px] text-slate-500">{rate.minWeightKg}-{rate.maxWeightKg.toLocaleString()} kg</td>
                          <td className="px-4 py-2 text-right text-[13px] font-medium text-slate-800">{rate.pricePerUnit.toFixed(2)} {rate.currency}/{rate.pricingUnit}</td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex flex-wrap gap-1 justify-end">
                              {rate.urgentSurchargePercent ? <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Acil +{rate.urgentSurchargePercent}%</span> : null}
                              {rate.adrSurchargePercent ? <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">ADR +{rate.adrSurchargePercent}%</span> : null}
                              {rate.frigoSurchargePercent ? <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Frigo +{rate.frigoSurchargePercent}%</span> : null}
                            </div>
                          </td>
                          <td className="px-2 py-2"><button className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[13px] text-slate-400 py-4 text-center">{t.common.noData}</p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Rate Drawer */}
      <Drawer isOpen={rateDrawerOpen} onClose={() => setRateDrawerOpen(false)} title="Tarife Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setRateDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button>
        </div>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Çıkış Bölge</label><input type="text" value={rateForm.originRegion} onChange={(e) => setRateForm({ ...rateForm, originRegion: e.target.value })} className={inputClass} placeholder="Marmara" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Varış Bölge</label><input type="text" value={rateForm.destinationRegion} onChange={(e) => setRateForm({ ...rateForm, destinationRegion: e.target.value })} className={inputClass} placeholder="İç Anadolu" /></div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Araç Tipi</label>
            <select value={rateForm.vehicleCategory} onChange={(e) => setRateForm({ ...rateForm, vehicleCategory: e.target.value })} className={inputClass}>
              <option value="Tir">Tır</option><option value="Kamyon">Kamyon</option><option value="Kamyonet">Kamyonet</option><option value="Frigorifik">Frigorifik</option><option value="Tanker">Tanker</option><option value="LowBed">LowBed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Min Ağırlık (kg)</label><input type="number" value={rateForm.minWeightKg} onChange={(e) => setRateForm({ ...rateForm, minWeightKg: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Max Ağırlık (kg)</label><input type="number" value={rateForm.maxWeightKg} onChange={(e) => setRateForm({ ...rateForm, maxWeightKg: Number(e.target.value) })} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Birim Fiyat</label><input type="number" step="0.01" value={rateForm.pricePerUnit} onChange={(e) => setRateForm({ ...rateForm, pricePerUnit: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Birim</label>
              <select value={rateForm.pricingUnit} onChange={(e) => setRateForm({ ...rateForm, pricingUnit: e.target.value })} className={inputClass}>
                <option value="kg">kg</option><option value="m3">m³</option><option value="pallet">Palet</option><option value="trip">Sefer</option><option value="km">km</option>
              </select>
            </div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Para Birimi</label>
              <select value={rateForm.currency} onChange={(e) => setRateForm({ ...rateForm, currency: e.target.value })} className={inputClass}>
                <option value="TRY">TRY</option><option value="USD">USD</option><option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <h4 className="text-[13px] font-semibold text-slate-700 pt-2">Ek Ücretler (%)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[12px] text-slate-500 mb-1">Acil</label><input type="number" value={rateForm.urgentSurchargePercent} onChange={(e) => setRateForm({ ...rateForm, urgentSurchargePercent: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[12px] text-slate-500 mb-1">ADR</label><input type="number" value={rateForm.adrSurchargePercent} onChange={(e) => setRateForm({ ...rateForm, adrSurchargePercent: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[12px] text-slate-500 mb-1">Frigo</label><input type="number" value={rateForm.frigoSurchargePercent} onChange={(e) => setRateForm({ ...rateForm, frigoSurchargePercent: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[12px] text-slate-500 mb-1">Hafta Sonu</label><input type="number" value={rateForm.weekendSurchargePercent} onChange={(e) => setRateForm({ ...rateForm, weekendSurchargePercent: Number(e.target.value) })} className={inputClass} /></div>
          </div>
        </div>
      </Drawer>

      {/* New Contract Drawer */}
      <Drawer isOpen={contractDrawerOpen} onClose={() => setContractDrawerOpen(false)} title={t.contracts.newContract} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setContractDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button>
        </div>
      }>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.contracts.carrier}</label><input type="text" value={contractForm.providerName} onChange={(e) => setContractForm({ ...contractForm, providerName: e.target.value })} className={inputClass} placeholder="Taşıyıcı adı" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.contracts.contractNo}</label><input type="text" value={contractForm.contractNumber} onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })} className={inputClass} placeholder="CNT-2024-006" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.contracts.startDate}</label><input type="date" value={contractForm.startDate} onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.contracts.endDate}</label><input type="date" value={contractForm.endDate} onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.common.status}</label>
            <select value={contractForm.status} onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })} className={inputClass}>
              <option value="Draft">{t.contracts.draft}</option>
              <option value="Active">{t.contracts.active}</option>
              <option value="Suspended">Askıya Alındı</option>
            </select>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
