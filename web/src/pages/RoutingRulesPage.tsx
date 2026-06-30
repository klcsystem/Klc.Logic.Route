import { useState, useEffect } from 'react'
import { Settings2, Plus, Power, Loader2 } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import api from '../api/client'

interface Rule {
  id: string
  name: string
  description?: string
  priority: number
  isActive: boolean
  originRegion?: string
  destinationRegion?: string
  vehicleCategory?: string
  minWeightKg?: number
  maxWeightKg?: number
  isHazardous?: boolean
  requiresColdChain?: boolean
  preferredProviderId?: string
  preferredContractId?: string
  action?: string
  notes?: string
}

function buildConditionText(rule: Rule): string {
  const parts: string[] = []
  if (rule.originRegion) parts.push(`origin = ${rule.originRegion}`)
  if (rule.destinationRegion) parts.push(`destination = ${rule.destinationRegion}`)
  if (rule.minWeightKg != null) parts.push(`weight >= ${rule.minWeightKg}`)
  if (rule.maxWeightKg != null) parts.push(`weight <= ${rule.maxWeightKg}`)
  if (rule.isHazardous) parts.push('isHazardous = true')
  if (rule.requiresColdChain) parts.push('requiresColdChain = true')
  if (rule.vehicleCategory) parts.push(`vehicleCategory = ${rule.vehicleCategory}`)
  return parts.length > 0 ? parts.join(' AND ') : '—'
}

function buildActionText(rule: Rule): string {
  return rule.action || '—'
}

export default function RoutingRulesPage() {
  const { t } = useI18n()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', originRegion: '', destinationRegion: '', minWeightKg: '', maxWeightKg: '', isHazardous: false, requiresColdChain: false, action: '', priority: 1 })

  const fetchRules = () => {
    setLoading(true)
    api.get('/routing-rules').then((r) => {
      const data = r.data?.data ?? r.data ?? []
      setRules(Array.isArray(data) ? data : [])
    }).catch(() => setRules([])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchRules() }, [])

  const handleToggle = (rule: Rule) => {
    const updated = { ...rule, isActive: !rule.isActive }
    api.put(`/routing-rules/${rule.id}`, updated).then(() => {
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
    }).catch(() => {})
  }

  const handleSave = () => {
    setSaving(true)
    const payload = {
      name: formData.name,
      priority: formData.priority,
      isActive: true,
      originRegion: formData.originRegion || null,
      destinationRegion: formData.destinationRegion || null,
      minWeightKg: formData.minWeightKg ? Number(formData.minWeightKg) : null,
      maxWeightKg: formData.maxWeightKg ? Number(formData.maxWeightKg) : null,
      isHazardous: formData.isHazardous || null,
      requiresColdChain: formData.requiresColdChain || null,
      action: formData.action || null,
    }
    api.post('/routing-rules', payload).then(() => {
      setDrawerOpen(false)
      fetchRules()
    }).catch(() => {}).finally(() => setSaving(false))
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.rules.title}</h1><p className="text-[14px] text-slate-400 mt-1">{t.rules.subtitle}</p></div>
        <button onClick={() => { setFormData({ name: '', originRegion: '', destinationRegion: '', minWeightKg: '', maxWeightKg: '', isHazardous: false, requiresColdChain: false, action: '', priority: rules.length + 1 }); setDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"><Plus className="w-4 h-4" /> {t.rules.newRule}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label={t.rules.totalRules} value={String(rules.length)} change={0} icon={Settings2} color="text-blue-600 bg-blue-50" />
        <StatCard label={t.rules.activeRules} value={String(rules.filter(r => r.isActive).length)} change={0} icon={Settings2} color="text-green-600 bg-green-50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
          <Settings2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-[14px] text-slate-400">{t.common.noData}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${rule.isActive ? 'border-slate-200/60' : 'border-slate-200/40 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 rounded-lg px-2 py-1">#{rule.priority}</span>
                  <h3 className="text-[15px] font-semibold text-slate-800">{rule.name}</h3>
                  <Badge variant={rule.isActive ? 'success' : 'default'}>{rule.isActive ? t.rules.enabled : t.rules.disabled}</Badge>
                </div>
                <button onClick={() => handleToggle(rule)} className={`p-1.5 rounded-lg transition-colors ${rule.isActive ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}><Power className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div><span className="text-[11px] font-semibold text-slate-400 uppercase">{t.rules.condition}</span><p className="text-[13px] text-slate-700 mt-1 font-mono">{buildConditionText(rule)}</p></div>
                <div><span className="text-[11px] font-semibold text-slate-400 uppercase">{t.rules.action}</span><p className="text-[13px] text-orange-600 mt-1 font-mono">{buildActionText(rule)}</p></div>
              </div>
              {rule.description && <p className="text-[12px] text-slate-400 mt-2">{rule.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={t.rules.newRule} footer={<div className="flex justify-end gap-3"><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button><button onClick={handleSave} disabled={saving || !formData.name} className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold disabled:opacity-50">{saving ? t.common.loading : t.common.save}</button></div>}>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.rules.ruleName}</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Kural adi" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.rules.priority}</label><input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })} className={inputClass} /></div>
          <h4 className="text-[13px] font-semibold text-slate-700 pt-2">{t.rules.condition}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[12px] text-slate-500 mb-1">Origin Region</label><input type="text" value={formData.originRegion} onChange={(e) => setFormData({ ...formData, originRegion: e.target.value })} className={inputClass} placeholder="Marmara" /></div>
            <div><label className="block text-[12px] text-slate-500 mb-1">Destination Region</label><input type="text" value={formData.destinationRegion} onChange={(e) => setFormData({ ...formData, destinationRegion: e.target.value })} className={inputClass} placeholder="Ankara" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[12px] text-slate-500 mb-1">Min Weight (kg)</label><input type="number" value={formData.minWeightKg} onChange={(e) => setFormData({ ...formData, minWeightKg: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[12px] text-slate-500 mb-1">Max Weight (kg)</label><input type="number" value={formData.maxWeightKg} onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-[13px] text-slate-700"><input type="checkbox" checked={formData.isHazardous} onChange={(e) => setFormData({ ...formData, isHazardous: e.target.checked })} className="rounded border-slate-300" /> ADR (Hazardous)</label>
            <label className="flex items-center gap-2 text-[13px] text-slate-700"><input type="checkbox" checked={formData.requiresColdChain} onChange={(e) => setFormData({ ...formData, requiresColdChain: e.target.checked })} className="rounded border-slate-300" /> Frigo (Cold Chain)</label>
          </div>
          <h4 className="text-[13px] font-semibold text-slate-700 pt-2">{t.rules.action}</h4>
          <div><label className="block text-[12px] text-slate-500 mb-1">Action</label><input type="text" value={formData.action} onChange={(e) => setFormData({ ...formData, action: e.target.value })} className={inputClass} placeholder="selectProvider = Yolda" /></div>
        </div>
      </Drawer>
    </div>
  )
}
