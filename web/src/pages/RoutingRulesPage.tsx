import { useState } from 'react'
import { Settings2, Plus, Power } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'

interface Rule { id: string; name: string; condition: string; action: string; priority: number; isEnabled: boolean }

const mockRules: Rule[] = [
  { id: '1', name: 'Frigo Zorunlu', condition: 'requiresColdChain = true', action: 'vehicleCategory = Frigorifik', priority: 1, isEnabled: true },
  { id: '2', name: 'ADR Filtresi', condition: 'isHazardous = true', action: 'provider IN (Aras, Yurtici)', priority: 2, isEnabled: true },
  { id: '3', name: 'Marmara Bolge Tercihi', condition: 'originRegion = Marmara AND weight < 5000', action: 'preferProvider = MNG', priority: 3, isEnabled: true },
  { id: '4', name: 'Acil Siparis', condition: 'priority = Urgent', action: 'applyUrgentSurcharge + fastestProvider', priority: 4, isEnabled: true },
  { id: '5', name: 'Hacim Indirimi', condition: 'monthlyShipments > 50', action: 'applyDiscount = 5%', priority: 5, isEnabled: false },
]

export default function RoutingRulesPage() {
  const { t } = useI18n()
  const [rules, setRules] = useState(mockRules)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', field: 'weight', operator: '>', value: '', action: 'selectProvider', actionValue: '' })

  const handleToggle = (id: string) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.rules.title}</h1><p className="text-[14px] text-slate-400 mt-1">{t.rules.subtitle}</p></div>
        <button onClick={() => { setFormData({ name: '', field: 'weight', operator: '>', value: '', action: 'selectProvider', actionValue: '' }); setDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"><Plus className="w-4 h-4" /> {t.rules.newRule}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label={t.rules.totalRules} value={String(rules.length)} change={1} icon={Settings2} color="text-blue-600 bg-blue-50" />
        <StatCard label={t.rules.activeRules} value={String(rules.filter(r => r.isEnabled).length)} change={0} icon={Settings2} color="text-green-600 bg-green-50" />
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${rule.isEnabled ? 'border-slate-200/60' : 'border-slate-200/40 opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 rounded-lg px-2 py-1">#{rule.priority}</span>
                <h3 className="text-[15px] font-semibold text-slate-800">{rule.name}</h3>
                <Badge variant={rule.isEnabled ? 'success' : 'default'}>{rule.isEnabled ? t.rules.enabled : t.rules.disabled}</Badge>
              </div>
              <button onClick={() => handleToggle(rule.id)} className={`p-1.5 rounded-lg transition-colors ${rule.isEnabled ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}><Power className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div><span className="text-[11px] font-semibold text-slate-400 uppercase">{t.rules.condition}</span><p className="text-[13px] text-slate-700 mt-1 font-mono">{rule.condition}</p></div>
              <div><span className="text-[11px] font-semibold text-slate-400 uppercase">{t.rules.action}</span><p className="text-[13px] text-orange-600 mt-1 font-mono">{rule.action}</p></div>
            </div>
          </div>
        ))}
      </div>
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={t.rules.newRule} footer={<div className="flex justify-end gap-3"><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button><button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button></div>}>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.rules.ruleName}</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Kural adi" /></div>
          <h4 className="text-[13px] font-semibold text-slate-700 pt-2">{t.rules.condition}</h4>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-[12px] text-slate-500 mb-1">{t.rules.field}</label><select value={formData.field} onChange={(e) => setFormData({ ...formData, field: e.target.value })} className={inputClass}><option value="weight">Agirlik</option><option value="volume">Hacim</option><option value="originCity">Cikis Sehir</option><option value="destinationCity">Varis Sehir</option><option value="isHazardous">ADR</option><option value="requiresColdChain">Frigo</option><option value="priority">Oncelik</option></select></div>
            <div><label className="block text-[12px] text-slate-500 mb-1">{t.rules.operator}</label><select value={formData.operator} onChange={(e) => setFormData({ ...formData, operator: e.target.value })} className={inputClass}><option value="=">=</option><option value="!=">!=</option><option value=">">&gt;</option><option value="<">&lt;</option><option value=">=">≥</option><option value="IN">IN</option></select></div>
            <div><label className="block text-[12px] text-slate-500 mb-1">{t.rules.value}</label><input type="text" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className={inputClass} /></div>
          </div>
          <h4 className="text-[13px] font-semibold text-slate-700 pt-2">{t.rules.action}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[12px] text-slate-500 mb-1">Aksiyon Tipi</label><select value={formData.action} onChange={(e) => setFormData({ ...formData, action: e.target.value })} className={inputClass}><option value="selectProvider">{t.rules.selectProvider}</option><option value="applyDiscount">{t.rules.applyDiscount}</option><option value="setVehicle">Arac Tipi Belirle</option><option value="addSurcharge">Ek Ucret Ekle</option></select></div>
            <div><label className="block text-[12px] text-slate-500 mb-1">Deger</label><input type="text" value={formData.actionValue} onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })} className={inputClass} placeholder="Aras Kargo" /></div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
