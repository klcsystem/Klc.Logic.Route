import { useState } from 'react'
import { Database, Plus, Check, X, RefreshCw, Loader2 } from 'lucide-react'
import { useI18n } from '../../i18n'
import Badge from '../../components/ui/Badge'
import Drawer from '../../components/ui/Drawer'
import { toast } from '../../components/ui/Toast'
import type { ErpConnection } from '../../types'

const mockConnections: ErpConnection[] = [
  { id: '1', name: 'SAP Production', erpType: 'SAP', apiEndpoint: 'https://sap.klcsystem.com/api', apiKey: 'sk_prod_***', isActive: true, lastSyncAt: '2024-03-15 14:30', lastSyncStatus: 'Success', syncedOrderCount: 142 },
  { id: '2', name: 'Logo Tiger Test', erpType: 'Logo', apiEndpoint: 'https://logo-test.klcsystem.com/api', apiKey: 'sk_test_***', isActive: false, lastSyncAt: '2024-03-10 09:15', lastSyncStatus: 'Failed', syncedOrderCount: 0 },
]

export default function ErpConnectionPage() {
  const { t } = useI18n()
  const [connections] = useState(mockConnections)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', erpType: 'SAP', apiEndpoint: '', apiKey: '' })

  const handleTest = (id: string) => {
    setTestingId(id)
    setTimeout(() => {
      setTestingId(null)
      toast('success', t.onboarding.connectionSuccess)
    }, 2000)
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">ERP Baglantilari</h1>
          <p className="text-[14px] text-slate-400 mt-1">ERP sistem entegrasyonlari ve senkronizasyon</p>
        </div>
        <button onClick={() => { setFormData({ name: '', erpType: 'SAP', apiEndpoint: '', apiKey: '' }); setDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Plus className="w-4 h-4" /> Baglanti Ekle
        </button>
      </div>

      <div className="grid gap-4">
        {connections.map((conn) => (
          <div key={conn.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-800">{conn.name}</h3>
                  <p className="text-[12px] text-slate-400">{conn.erpType} — {conn.apiEndpoint}</p>
                </div>
              </div>
              <Badge variant={conn.isActive ? 'success' : 'default'}>{conn.isActive ? t.common.active : t.common.inactive}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Son Senkronizasyon</span>
                <p className="text-[13px] text-slate-700 mt-1">{conn.lastSyncAt || '—'}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.common.status}</span>
                <div className="mt-1 flex items-center gap-1.5">
                  {conn.lastSyncStatus === 'Success' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
                  <span className={`text-[13px] ${conn.lastSyncStatus === 'Success' ? 'text-green-600' : 'text-red-600'}`}>{conn.lastSyncStatus}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Senkronize Siparis</span>
                <p className="text-[13px] text-slate-700 mt-1">{conn.syncedOrderCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => handleTest(conn.id)} disabled={testingId === conn.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                {testingId === conn.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                {t.onboarding.testConnection}
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Simdi Senkronize Et
              </button>
              <button className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                {t.common.edit}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="ERP Baglanti Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button>
        </div>
      }>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.common.name}</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="SAP Production" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.onboarding.erpSystem}</label>
            <select value={formData.erpType} onChange={(e) => setFormData({ ...formData, erpType: e.target.value })} className={inputClass}>
              <option value="SAP">SAP</option><option value="Oracle">Oracle</option><option value="Microsoft Dynamics">Microsoft Dynamics</option><option value="Logo">Logo Tiger</option><option value="Netsis">Netsis</option><option value="Other">Diger</option>
            </select>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.onboarding.apiEndpoint}</label><input type="text" value={formData.apiEndpoint} onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })} className={inputClass} placeholder="https://erp.company.com/api" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.onboarding.apiKey}</label><input type="password" value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className={inputClass} placeholder="sk_..." /></div>
        </div>
      </Drawer>
    </div>
  )
}
