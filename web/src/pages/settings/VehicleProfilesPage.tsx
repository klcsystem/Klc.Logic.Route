import { useState, useEffect } from 'react'
import { Truck, Plus, Save, Trash2, Edit3, X, Link } from 'lucide-react'
import { toast } from '../../components/ui/Toast'
import api from '../../api/client'

interface VehicleProfile {
  id: string
  name: string
  description: string
  maxWeightKg: number
  maxVolumeM3: number
  maxHeightM: number
  maxWidthM: number
  maxLengthM: number
  isHazmat: boolean
  isFrigorifik: boolean
  avoidTolls: boolean
  avoidFerries: boolean
  costPerKm: number
  isDefault: boolean
}

const emptyProfile: Omit<VehicleProfile, 'id'> = {
  name: '',
  description: '',
  maxWeightKg: 0,
  maxVolumeM3: 0,
  maxHeightM: 0,
  maxWidthM: 0,
  maxLengthM: 0,
  isHazmat: false,
  isFrigorifik: false,
  avoidTolls: false,
  avoidFerries: false,
  costPerKm: 0,
  isDefault: false,
}

export default function VehicleProfilesPage() {
  const [profiles, setProfiles] = useState<VehicleProfile[]>([])
  const [editing, setEditing] = useState<VehicleProfile | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [assignProfileId, setAssignProfileId] = useState<string | null>(null)
  const [vehicleIdsText, setVehicleIdsText] = useState('')

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/vehicle-profiles')
      setProfiles(res.data.data || [])
    } catch { /* empty */ }
  }

  useEffect(() => { fetchProfiles() }, [])

  const handleSave = async () => {
    if (!editing) return
    try {
      if (isNew) {
        await api.post('/vehicle-profiles', editing)
        toast('success', 'Profil olusturuldu')
      } else {
        await api.put(`/vehicle-profiles/${editing.id}`, editing)
        toast('success', 'Profil guncellendi')
      }
      setEditing(null)
      setIsNew(false)
      fetchProfiles()
    } catch {
      toast('error', 'Kaydetme hatasi')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/vehicle-profiles/${id}`)
      toast('success', 'Profil silindi')
      fetchProfiles()
    } catch {
      toast('error', 'Silme hatasi')
    }
  }

  const handleAssign = async () => {
    if (!assignProfileId || !vehicleIdsText.trim()) return
    try {
      const ids = vehicleIdsText.split(',').map(s => s.trim()).filter(Boolean)
      await api.post(`/vehicle-profiles/${assignProfileId}/assign`, ids)
      toast('success', 'Profil araclara atandi')
      setAssignProfileId(null)
      setVehicleIdsText('')
    } catch {
      toast('error', 'Atama hatasi')
    }
  }

  const startNew = () => {
    setEditing({ id: '', ...emptyProfile })
    setIsNew(true)
  }

  const startEdit = (p: VehicleProfile) => {
    setEditing({ ...p })
    setIsNew(false)
  }

  const updateField = <K extends keyof VehicleProfile>(key: K, value: VehicleProfile[K]) => {
    if (editing) setEditing({ ...editing, [key]: value })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Arac Profilleri</h1>
          <p className="text-[14px] text-slate-400 mt-1">Tekrar kullanilabilir arac profil sablonlari tanimlayip araclara atayin</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Plus className="w-4 h-4" /> Yeni Profil
        </button>
      </div>

      {/* Profile List */}
      <div className="grid gap-4">
        {profiles.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-slate-800">{p.name}</p>
                  {p.isDefault && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold">VARSAYILAN</span>}
                  {p.isHazmat && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">ADR</span>}
                  {p.isFrigorifik && <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-600 text-[10px] font-bold">FRiGO</span>}
                </div>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {p.maxWeightKg} kg | {p.maxVolumeM3} m3 | {p.maxHeightM}x{p.maxWidthM}x{p.maxLengthM}m | {p.costPerKm} TL/km
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setAssignProfileId(p.id); setVehicleIdsText('') }} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors" title="Araclara Ata">
                <Link className="w-4 h-4" />
              </button>
              <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-[14px]">Henuz profil tanimlanmadi</div>
        )}
      </div>

      {/* Assign Modal */}
      {assignProfileId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-slate-800">Profili Araclara Ata</h3>
              <button onClick={() => setAssignProfileId(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <label className="block text-[13px] text-slate-600 mb-2">Arac ID'leri (virgul ile ayirin)</label>
            <textarea
              value={vehicleIdsText}
              onChange={e => setVehicleIdsText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400"
              rows={3}
              placeholder="uuid1, uuid2, uuid3"
            />
            <div className="flex justify-end mt-4">
              <button onClick={handleAssign} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">
                <Link className="w-4 h-4" /> Ata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Form */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-slate-800">{isNew ? 'Yeni Profil' : 'Profil Duzenle'}</h3>
              <button onClick={() => { setEditing(null); setIsNew(false) }} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1">Profil Adi</label>
                <input value={editing.name} onChange={e => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1">Aciklama</label>
                <input value={editing.description} onChange={e => updateField('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Maks Agirlik (kg)</label>
                  <input type="number" value={editing.maxWeightKg} onChange={e => updateField('maxWeightKg', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Maks Hacim (m3)</label>
                  <input type="number" value={editing.maxVolumeM3} onChange={e => updateField('maxVolumeM3', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Yukseklik (m)</label>
                  <input type="number" step="0.1" value={editing.maxHeightM} onChange={e => updateField('maxHeightM', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Genislik (m)</label>
                  <input type="number" step="0.1" value={editing.maxWidthM} onChange={e => updateField('maxWidthM', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">Uzunluk (m)</label>
                  <input type="number" step="0.1" value={editing.maxLengthM} onChange={e => updateField('maxLengthM', +e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1">Km Basi Maliyet (TL)</label>
                <input type="number" step="0.01" value={editing.costPerKm} onChange={e => updateField('costPerKm', +e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 cursor-pointer">
                  <input type="checkbox" checked={editing.isHazmat} onChange={e => updateField('isHazmat', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-400" />
                  <span className="text-[13px] font-medium text-slate-700">Tehlikeli Madde (ADR)</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl bg-cyan-50 border border-cyan-100 cursor-pointer">
                  <input type="checkbox" checked={editing.isFrigorifik} onChange={e => updateField('isFrigorifik', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400" />
                  <span className="text-[13px] font-medium text-slate-700">Frigorifik</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                  <input type="checkbox" checked={editing.avoidTolls} onChange={e => updateField('avoidTolls', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                  <span className="text-[13px] font-medium text-slate-700">Otoyollardan Kacin</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                  <input type="checkbox" checked={editing.avoidFerries} onChange={e => updateField('avoidFerries', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                  <span className="text-[13px] font-medium text-slate-700">Feribotlardan Kacin</span>
                </label>
              </div>
              <label className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100 cursor-pointer">
                <input type="checkbox" checked={editing.isDefault} onChange={e => updateField('isDefault', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                <span className="text-[13px] font-medium text-slate-700">Varsayilan Profil</span>
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
