import { useState, useEffect } from 'react'
import { Settings2, Plus, Save, Trash2, Edit3, X, Check } from 'lucide-react'
import { toast } from '../../components/ui/Toast'
import api from '../../api/client'

interface OptimizationPreset {
  id: string
  name: string
  description: string
  maxStopsPerRoute: number
  maxDistanceKm: number
  maxDurationMinutes: number
  breakDurationMinutes: number
  breakAfterMinutes: number
  allowOvernight: boolean
  balanceWorkload: boolean
  routeEndMode: number
  endAddress: string
  endLat: number | null
  endLng: number | null
  isDefault: boolean
}

const routeEndModes = [
  { value: 0, label: 'Depoya Don', desc: 'Rota baslangic noktasina geri doner' },
  { value: 1, label: 'Son Durakta Bitir', desc: 'Son teslimat noktasinda biter' },
  { value: 2, label: 'Belirli Adreste Bitir', desc: 'Belirtilen adreste biter' },
]

const emptyPreset: Omit<OptimizationPreset, 'id'> = {
  name: '',
  description: '',
  maxStopsPerRoute: 25,
  maxDistanceKm: 500,
  maxDurationMinutes: 480,
  breakDurationMinutes: 30,
  breakAfterMinutes: 240,
  allowOvernight: false,
  balanceWorkload: true,
  routeEndMode: 0,
  endAddress: '',
  endLat: null,
  endLng: null,
  isDefault: false,
}

export default function OptimizationPresetsPage() {
  const [presets, setPresets] = useState<OptimizationPreset[]>([])
  const [editing, setEditing] = useState<OptimizationPreset | null>(null)
  const [isNew, setIsNew] = useState(false)

  const fetchPresets = async () => {
    try {
      const res = await api.get('/optimization-presets')
      setPresets(res.data.data || [])
    } catch { /* empty */ }
  }

  useEffect(() => { fetchPresets() }, [])

  const handleSave = async () => {
    if (!editing) return
    try {
      if (isNew) {
        await api.post('/optimization-presets', editing)
        toast('success', 'Preset oluşturuldu')
      } else {
        await api.put(`/optimization-presets/${editing.id}`, editing)
        toast('success', 'Preset güncellendi')
      }
      setEditing(null)
      setIsNew(false)
      fetchPresets()
    } catch {
      toast('error', 'Kaydetme hatası')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/optimization-presets/${id}`)
      toast('success', 'Preset silindi')
      fetchPresets()
    } catch {
      toast('error', 'Silme hatası')
    }
  }

  const startNew = () => {
    setEditing({ id: '', ...emptyPreset })
    setIsNew(true)
  }

  const startEdit = (p: OptimizationPreset) => {
    setEditing({ ...p })
    setIsNew(false)
  }

  const updateField = <K extends keyof OptimizationPreset>(key: K, value: OptimizationPreset[K]) => {
    if (editing) setEditing({ ...editing, [key]: value })
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}s ${m}dk` : `${m}dk`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Optimizasyon Ayarları</h1>
          <p className="text-[14px] text-slate-400 mt-1">Rota optimizasyonu için tekrar kullanılabilir ayar şablonları</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Plus className="w-4 h-4" /> Yeni Preset
        </button>
      </div>

      {/* Preset List */}
      <div className="grid gap-4">
        {presets.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-slate-800">{p.name}</p>
                  {p.isDefault && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold">VARSAYILAN</span>}
                </div>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Maks {p.maxStopsPerRoute} durak | {p.maxDistanceKm} km | {formatDuration(p.maxDurationMinutes)} | {routeEndModes[p.routeEndMode]?.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {presets.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-[14px]">Henüz preset tanımlanmadı</div>
        )}
      </div>

      {/* Edit/Create Form */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-slate-800">{isNew ? 'Yeni Preset' : 'Preset Düzenle'}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false) }} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1">Preset Adi</label>
                <input value={editing.name} onChange={e => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1">Açıklama</label>
                <input value={editing.description} onChange={e => updateField('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Maks Durak</label>
                  <input type="number" value={editing.maxStopsPerRoute} onChange={e => updateField('maxStopsPerRoute', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Maks Mesafe (km)</label>
                  <input type="number" value={editing.maxDistanceKm} onChange={e => updateField('maxDistanceKm', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Maks Süre (dk)</label>
                  <input type="number" value={editing.maxDurationMinutes} onChange={e => updateField('maxDurationMinutes', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Mola Suresi (dk)</label>
                  <input type="number" value={editing.breakDurationMinutes} onChange={e => updateField('breakDurationMinutes', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Mola Sonrasi (dk)</label>
                  <input type="number" value={editing.breakAfterMinutes} onChange={e => updateField('breakAfterMinutes', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
              </div>

              {/* Route End Mode */}
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-2">Rota Bitis Modu</label>
                <div className="grid grid-cols-3 gap-3">
                  {routeEndModes.map(mode => {
                    const selected = editing.routeEndMode === mode.value
                    return (
                      <button
                        key={mode.value}
                        onClick={() => updateField('routeEndMode', mode.value)}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-orange-400 bg-orange-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <p className="text-[12px] font-semibold text-slate-800">{mode.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* End Address (only if EndAtAddress mode) */}
              {editing.routeEndMode === 2 && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <label className="block text-[12px] font-medium text-slate-500 mb-1">Bitis Adresi</label>
                    <input value={editing.endAddress || ''} onChange={e => updateField('endAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Enlem</label>
                      <input type="number" step="0.000001" value={editing.endLat ?? ''} onChange={e => updateField('endLat', e.target.value ? +e.target.value : null)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Boylam</label>
                      <input type="number" step="0.000001" value={editing.endLng ?? ''} onChange={e => updateField('endLng', e.target.value ? +e.target.value : null)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                  <input type="checkbox" checked={editing.allowOvernight} onChange={e => updateField('allowOvernight', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                  <span className="text-[13px] font-medium text-slate-700">Gece Rotasina İzin Ver</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                  <input type="checkbox" checked={editing.balanceWorkload} onChange={e => updateField('balanceWorkload', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                  <span className="text-[13px] font-medium text-slate-700">Is Yukunu Dengele</span>
                </label>
              </div>
              <label className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100 cursor-pointer">
                <input type="checkbox" checked={editing.isDefault} onChange={e => updateField('isDefault', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                <span className="text-[13px] font-medium text-slate-700">Varsayılan Preset</span>
              </label>
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
                <Save className="w-4 h-4" /> Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
