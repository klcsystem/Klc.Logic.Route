import { useState, useEffect } from 'react'
import { Database, Plus, Check, X, RefreshCw, Loader2, Trash2, Edit3 } from 'lucide-react'
import { useI18n } from '../../i18n'
import Badge from '../../components/ui/Badge'
import Drawer from '../../components/ui/Drawer'
import { toast } from '../../components/ui/Toast'
import { settingsApi } from '../../api/settings'
import type { ErpConnection } from '../../types'

export default function ErpConnectionPage() {
  const { t } = useI18n()
  const [connections, setConnections] = useState<ErpConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', erpType: 'SAP', apiEndpoint: '', apiKey: '' })

  const fetchConnections = async () => {
    try {
      const res = await settingsApi.getErpConnections()
      setConnections(res.data || [])
    } catch {
      toast('error', 'Bağlantı listesi yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConnections() }, [])

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const res = await settingsApi.testErpConnection(id)
      if (res.data?.success) {
        toast('success', t.onboarding.connectionSuccess)
      } else {
        toast('error', res.data?.message || 'Bağlantı testi başarısız')
      }
      fetchConnections()
    } catch {
      toast('error', 'Bağlantı testi sırasında hata oluştu')
    } finally {
      setTestingId(null)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.apiEndpoint) {
      toast('error', 'Ad ve API endpoint zorunludur')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await settingsApi.updateErpConnection(editingId, formData)
        toast('success', 'Bağlantı güncellendi')
      } else {
        await settingsApi.createErpConnection(formData)
        toast('success', 'Bağlantı oluşturuldu')
      }
      setDrawerOpen(false)
      setEditingId(null)
      fetchConnections()
    } catch {
      toast('error', 'Kaydetme sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await settingsApi.deleteErpConnection(id)
      toast('success', 'Bağlantı silindi')
      fetchConnections()
    } catch {
      toast('error', 'Silme sırasında hata oluştu')
    }
  }

  const openEdit = (conn: ErpConnection) => {
    setEditingId(conn.id)
    setFormData({ name: conn.name, erpType: conn.erpType, apiEndpoint: conn.apiEndpoint, apiKey: '' })
    setDrawerOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({ name: '', erpType: 'SAP', apiEndpoint: '', apiKey: '' })
    setDrawerOpen(true)
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">ERP Bağlantılari</h1>
          <p className="text-[14px] text-slate-400 mt-1">ERP sistem entegrasyonlari ve senkronizasyon</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Plus className="w-4 h-4" /> Bağlantı Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
          <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] text-slate-400">Henüz ERP bağlantısi eklenmedi</p>
        </div>
      ) : (
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
                    <span className={`text-[13px] ${conn.lastSyncStatus === 'Success' ? 'text-green-600' : 'text-red-600'}`}>{conn.lastSyncStatus || '—'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Senkronize Sipariş</span>
                  <p className="text-[13px] text-slate-700 mt-1">{conn.syncedOrderCount ?? 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => handleTest(conn.id)} disabled={testingId === conn.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  {testingId === conn.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  {t.onboarding.testConnection}
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Şimdi Senkronize Et
                </button>
                <button onClick={() => openEdit(conn)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> {t.common.edit}
                </button>
                <button onClick={() => handleDelete(conn.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> {t.common.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer isOpen={drawerOpen} onClose={() => { setDrawerOpen(false); setEditingId(null) }} title={editingId ? 'ERP Bağlantı Düzenle' : 'ERP Bağlantı Ekle'} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => { setDrawerOpen(false); setEditingId(null) }} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            {t.common.save}
          </button>
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
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.onboarding.apiKey}</label><input type="password" value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className={inputClass} placeholder={editingId ? '(değiştirmek için yeni değer girin)' : 'sk_...'} /></div>
        </div>
      </Drawer>
    </div>
  )
}
