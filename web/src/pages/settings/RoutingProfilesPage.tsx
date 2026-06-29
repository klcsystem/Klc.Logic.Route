import { useState } from 'react'
import { Car, Truck, AlertTriangle, Save, Plus, Check } from 'lucide-react'
import { toast } from '../../components/ui/Toast'

interface RoutingProfile {
  id: string
  name: string
  vehicleType: 'standard' | 'commercial' | 'hazmat'
  hazardousMaterial: boolean
  tollsAndFerries: 'all_roads' | 'avoid_tolls' | 'avoid_ferries'
  driversApproach: 'no_restrictions' | 'avoid_uturns'
  serviceLocation: 'at_location' | 'roadside'
}

const defaultProfile: RoutingProfile = {
  id: 'default',
  name: 'Varsayilan',
  vehicleType: 'standard',
  hazardousMaterial: false,
  tollsAndFerries: 'all_roads',
  driversApproach: 'no_restrictions',
  serviceLocation: 'at_location',
}

const vehicleTypes = [
  { key: 'standard' as const, label: 'Standart', desc: 'Binek arac', icon: Car },
  { key: 'commercial' as const, label: 'Ticari Kamyon', desc: 'Agir vasita', icon: Truck },
  { key: 'hazmat' as const, label: 'Tehlikeli Madde', desc: 'ADR belgeli', icon: AlertTriangle },
]

const tollOptions = [
  { key: 'all_roads' as const, label: 'Tum Yollari Kullan', desc: 'Otoyol ve feribotlar dahil' },
  { key: 'avoid_tolls' as const, label: 'Otoyollardan Kacin', desc: 'Ucretli yollardan kacin' },
  { key: 'avoid_ferries' as const, label: 'Feribotlardan Kacin', desc: 'Feribot hatlarindan kacin' },
]

const approachOptions = [
  { key: 'no_restrictions' as const, label: 'Kisitlama Yok', desc: 'Tum manevralar serbest' },
  { key: 'avoid_uturns' as const, label: 'U Donuslerden Kacin', desc: 'U donuslerden kacinarak rota olustur' },
]

const serviceOptions = [
  { key: 'at_location' as const, label: 'Lokasyonda Servis', desc: 'Teslimat noktasinda dur' },
  { key: 'roadside' as const, label: 'Yol Kenari Servis', desc: 'Yol kenarinda teslimat yap' },
]

export default function RoutingProfilesPage() {
  const [profiles, setProfiles] = useState<RoutingProfile[]>([defaultProfile])
  const [selectedProfileId, setSelectedProfileId] = useState('default')

  const profile = profiles.find(p => p.id === selectedProfileId) || defaultProfile

  const updateProfile = (updates: Partial<RoutingProfile>) => {
    setProfiles(prev => prev.map(p => p.id === selectedProfileId ? { ...p, ...updates } : p))
  }

  const addProfile = () => {
    const newId = `profile_${Date.now()}`
    const newProfile: RoutingProfile = { ...defaultProfile, id: newId, name: `Profil ${profiles.length + 1}` }
    setProfiles(prev => [...prev, newProfile])
    setSelectedProfileId(newId)
  }

  const handleSave = () => {
    toast('success', 'Rotalama profili kaydedildi')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Rotalama Profilleri</h1>
        <p className="text-[14px] text-slate-400 mt-1">Arac tipi, yol tercihleri ve teslimat yaklasimi ayarlari</p>
      </div>

      {/* Profile Selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
        >
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button onClick={addProfile} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-[13px] text-slate-500 hover:border-orange-300 hover:text-orange-500 transition-colors">
          <Plus className="w-4 h-4" /> Profil Ekle
        </button>
      </div>

      {/* Vehicle Type */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Arac Tipi</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {vehicleTypes.map(vt => {
            const Icon = vt.icon
            const selected = profile.vehicleType === vt.key
            return (
              <button
                key={vt.key}
                onClick={() => updateProfile({ vehicleType: vt.key })}
                className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? 'border-orange-400 bg-orange-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {selected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <Icon className={`w-8 h-8 mb-3 ${selected ? 'text-orange-500' : 'text-slate-400'}`} />
                <p className="text-[14px] font-semibold text-slate-800">{vt.label}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{vt.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Hazardous Material Checkbox */}
        <label className="flex items-center gap-3 mt-5 p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.hazardousMaterial}
            onChange={(e) => updateProfile({ hazardousMaterial: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
          />
          <div>
            <span className="text-[13px] font-medium text-slate-700">Tehlikeli Madde Tasimaciligi</span>
            <p className="text-[11px] text-slate-400">ADR kurallarini uygula ve kisitli yollardan kacin</p>
          </div>
        </label>
      </div>

      {/* Tolls and Ferries */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Otoyol ve Feribotlar</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {tollOptions.map(opt => {
            const selected = profile.tollsAndFerries === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => updateProfile({ tollsAndFerries: opt.key })}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? 'border-orange-400 bg-orange-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {selected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="text-[14px] font-semibold text-slate-800">{opt.label}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Drivers Approach */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Surucu Yaklasimi</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {approachOptions.map(opt => {
            const selected = profile.driversApproach === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => updateProfile({ driversApproach: opt.key })}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? 'border-orange-400 bg-orange-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {selected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="text-[14px] font-semibold text-slate-800">{opt.label}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Service Location */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Servis Lokasyonu</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {serviceOptions.map(opt => {
            const selected = profile.serviceLocation === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => updateProfile({ serviceLocation: opt.key })}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? 'border-orange-400 bg-orange-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {selected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="text-[14px] font-semibold text-slate-800">{opt.label}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Save className="w-4 h-4" /> Kaydet
        </button>
      </div>
    </div>
  )
}
