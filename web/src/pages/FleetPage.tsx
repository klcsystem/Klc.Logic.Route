import { useState, useEffect, useCallback } from 'react'
import { Truck, User, Plus, Search, Loader2 } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import api from '../api/client'
import { toast } from '../components/ui/Toast'

type Tab = 'vehicles' | 'drivers'

interface VehicleRecord {
  id: string
  plateNumber: string
  vehicleType: string
  bodyType: string | null
  tonnage: number
  isActive: boolean
  providerId?: string
  providerName?: string
  insuranceExpiry?: string
  integrationMode?: string
}

interface DriverRecord {
  id: string
  fullName: string
  phone: string
  licenseNumber: string
  licenseExpiry?: string
  isActive: boolean
  providerId?: string
  providerName?: string
  skills?: string[]
  certifications?: string[]
  maxHoursPerDay?: number
  preferredZones?: string[]
  colorDot?: string
}

const driverColors = ['#f97316', '#3b82f6', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1']

const integrationBadge = (mode?: string) => {
  switch (mode) {
    case 'ApiIntegrated': return <Badge variant="orange">API</Badge>
    case 'SelfService': return <Badge variant="info">Self-Service</Badge>
    default: return <Badge variant="default">Yönetilen</Badge>
  }
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

export default function FleetPage() {
  const [tab, setTab] = useState<Tab>('vehicles')
  const [searchTerm, setSearchTerm] = useState('')
  const [vehicleDrawerOpen, setVehicleDrawerOpen] = useState(false)
  const [driverDrawerOpen, setDriverDrawerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [drivers, setDrivers] = useState<DriverRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  // Vehicle form
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: '', vehicleType: 'Tir', bodyType: '', tonnage: 0, providerName: '', insuranceExpiry: '', notes: '' })
  // Driver form
  const [driverForm, setDriverForm] = useState({ fullName: '', phone: '', licenseNumber: '', licenseExpiry: '', providerName: '', skills: '', certifications: '', maxHoursPerDay: 8, preferredZones: '' })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [vehiclesRes, driversRes] = await Promise.allSettled([
        api.get('/vehicles').then(r => r.data),
        api.get('/drivers').then(r => r.data),
      ])

      if (vehiclesRes.status === 'fulfilled' && vehiclesRes.value) {
        const v = vehiclesRes.value
        const raw = Array.isArray(v) ? v : Array.isArray(v.data) ? v.data : v.data?.items || v.items || []
        setVehicles(raw)
      }
      if (driversRes.status === 'fulfilled' && driversRes.value) {
        const d = driversRes.value
        const raw = Array.isArray(d) ? d : Array.isArray(d.data) ? d.data : d.data?.items || d.items || []
        setDrivers(raw.map((d: DriverRecord, idx: number) => ({
          ...d,
          colorDot: driverColors[idx % driverColors.length],
        })))
      }
      if (vehiclesRes.status === 'rejected' && driversRes.status === 'rejected') {
        setError('Filo verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.')
      }
    } catch {
      setError('Filo verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredVehicles = vehicles.filter(v =>
    searchTerm === '' || v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (v.providerName || '').toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredDrivers = drivers.filter(d =>
    searchTerm === '' || d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || (d.providerName || '').toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSaveVehicle = async () => {
    try {
      await api.post('/vehicles', vehicleForm)
      toast('success', 'Araç eklendi')
      setVehicleDrawerOpen(false)
      fetchData()
    } catch {
      toast('error', 'Araç eklenirken hata oluştu')
    }
  }

  const handleSaveDriver = async () => {
    try {
      await api.post('/drivers', {
        ...driverForm,
        skills: driverForm.skills ? driverForm.skills.split(',').map(s => s.trim()) : [],
        certifications: driverForm.certifications ? driverForm.certifications.split(',').map(s => s.trim()) : [],
        preferredZones: driverForm.preferredZones ? driverForm.preferredZones.split(',').map(s => s.trim()) : [],
      })
      toast('success', 'Şoför eklendi')
      setDriverDrawerOpen(false)
      fetchData()
    } catch {
      toast('error', 'Şoför eklenirken hata oluştu')
    }
  }

  const handleToggleVehicleActive = async (v: VehicleRecord) => {
    try {
      await api.patch(`/vehicles/${v.id}`, { isActive: !v.isActive })
      setVehicles(prev => prev.map(veh => veh.id === v.id ? { ...veh, isActive: !veh.isActive } : veh))
    } catch {
      toast('error', 'Durum güncellenemedi')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Filo Yönetimi</h1>
          <p className="text-[14px] text-slate-400 mt-1">Araç ve şoför yönetimi</p>
        </div>
        <button
          onClick={() => {
            if (tab === 'vehicles') {
              setVehicleForm({ plateNumber: '', vehicleType: 'Tir', bodyType: '', tonnage: 0, providerName: '', insuranceExpiry: '', notes: '' })
              setVehicleDrawerOpen(true)
            } else {
              setDriverForm({ fullName: '', phone: '', licenseNumber: '', licenseExpiry: '', providerName: '', skills: '', certifications: '', maxHoursPerDay: 8, preferredZones: '' })
              setDriverDrawerOpen(true)
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"
        >
          <Plus className="w-4 h-4" /> {tab === 'vehicles' ? 'Araç Ekle' : 'Şoför Ekle'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => { setTab('vehicles'); setSearchTerm('') }} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-all ${tab === 'vehicles' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Truck className="w-4 h-4" /> Araçlar ({vehicles.length})
        </button>
        <button onClick={() => { setTab('drivers'); setSearchTerm('') }} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-all ${tab === 'drivers' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <User className="w-4 h-4" /> Şoförler ({drivers.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ara..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-[14px] text-red-600 mb-3">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-[13px] font-medium hover:bg-red-200 transition-colors">Tekrar Dene</button>
        </div>
      )}

      {/* Vehicles Tab */}
      {!isLoading && tab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Plaka</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Araç Tipi</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kasa Tipi</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tonaj</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Taşıyıcı</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Entegrasyon</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Aktif</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-[13px] font-semibold text-slate-800">{v.plateNumber}</td>
                    <td className="px-6 py-3.5"><Badge variant="info">{v.vehicleType}</Badge></td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-600">{v.bodyType || '--'}</td>
                    <td className="px-6 py-3.5 text-center text-[13px] text-slate-600">{v.tonnage} ton</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-700">{v.providerName || '--'}</td>
                    <td className="px-6 py-3.5 text-center">{integrationBadge(v.integrationMode)}</td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleVehicleActive(v)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${v.isActive ? 'bg-green-400' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${v.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredVehicles.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-[14px] text-slate-400">Araç bulunamadı</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drivers Tab */}
      {!isLoading && tab === 'drivers' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ad Soyad</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Telefon</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ehliyet</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Yetenekler</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sertifikalar</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Maks Saat</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tercih Bölgesi</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Aktif</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.colorDot || '#94a3b8' }} />
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><User className="w-4 h-4" /></div>
                        <span className="text-[13px] font-medium text-slate-800">{d.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-600">{d.phone}</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-600 font-mono">{d.licenseNumber}</td>
                    <td className="px-6 py-3.5">
                      {d.skills && d.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {d.skills.map(skill => (
                            <span key={skill} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">{skill}</span>
                          ))}
                        </div>
                      ) : <span className="text-[12px] text-slate-400">--</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      {d.certifications && d.certifications.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {d.certifications.map(cert => (
                            <span key={cert} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">{cert}</span>
                          ))}
                        </div>
                      ) : <span className="text-[12px] text-slate-400">--</span>}
                    </td>
                    <td className="px-6 py-3.5 text-center text-[13px] text-slate-600">{d.maxHoursPerDay || '--'}</td>
                    <td className="px-6 py-3.5">
                      {d.preferredZones && d.preferredZones.length > 0 ? (
                        <span className="text-[12px] text-slate-600">{d.preferredZones.join(', ')}</span>
                      ) : <span className="text-[12px] text-slate-400">--</span>}
                    </td>
                    <td className="px-6 py-3.5 text-center"><Badge variant={d.isActive ? 'success' : 'default'}>{d.isActive ? 'Aktif' : 'Pasif'}</Badge></td>
                  </tr>
                ))}
                {filteredDrivers.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-[14px] text-slate-400">Şoför bulunamadı</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Drawer */}
      <Drawer isOpen={vehicleDrawerOpen} onClose={() => setVehicleDrawerOpen(false)} title="Araç Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setVehicleDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">İptal</button>
          <button onClick={handleSaveVehicle} className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">Kaydet</button>
        </div>
      }>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Plaka</label><input type="text" value={vehicleForm.plateNumber} onChange={e => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })} className={inputClass} placeholder="34 ABC 123" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Araç Tipi</label>
            <select value={vehicleForm.vehicleType} onChange={e => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })} className={inputClass}><option value="Tir">Tır</option><option>Kamyon</option><option>Kamyonet</option><option>Frigorifik</option><option>Tanker</option><option>Lowbed</option></select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Kasa Tipi</label><input type="text" value={vehicleForm.bodyType} onChange={e => setVehicleForm({ ...vehicleForm, bodyType: e.target.value })} className={inputClass} placeholder="Mega, Perdeli..." /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Tonaj</label><input type="number" value={vehicleForm.tonnage} onChange={e => setVehicleForm({ ...vehicleForm, tonnage: Number(e.target.value) })} className={inputClass} placeholder="24" /></div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Taşıyıcı</label><input type="text" value={vehicleForm.providerName} onChange={e => setVehicleForm({ ...vehicleForm, providerName: e.target.value })} className={inputClass} placeholder="Taşıyıcı adı" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Sigorta Bitiş Tarihi</label><input type="date" value={vehicleForm.insuranceExpiry} onChange={e => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Not</label><textarea value={vehicleForm.notes} onChange={e => setVehicleForm({ ...vehicleForm, notes: e.target.value })} className={inputClass} rows={2} placeholder="Ek bilgi…" /></div>
        </div>
      </Drawer>

      {/* Driver Drawer */}
      <Drawer isOpen={driverDrawerOpen} onClose={() => setDriverDrawerOpen(false)} title="Şoför Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setDriverDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">İptal</button>
          <button onClick={handleSaveDriver} className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">Kaydet</button>
        </div>
      }>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Ad Soyad</label><input type="text" value={driverForm.fullName} onChange={e => setDriverForm({ ...driverForm, fullName: e.target.value })} className={inputClass} placeholder="Ahmet Yılmaz" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Telefon</label><input type="text" value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} className={inputClass} placeholder="532 111 2233" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Ehliyet No</label><input type="text" value={driverForm.licenseNumber} onChange={e => setDriverForm({ ...driverForm, licenseNumber: e.target.value })} className={inputClass} placeholder="B-34-12345" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Ehliyet Bitiş</label><input type="date" value={driverForm.licenseExpiry} onChange={e => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Taşıyıcı</label><input type="text" value={driverForm.providerName} onChange={e => setDriverForm({ ...driverForm, providerName: e.target.value })} className={inputClass} placeholder="Taşıyıcı adı" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Yetenekler (virgül ile)</label><input type="text" value={driverForm.skills} onChange={e => setDriverForm({ ...driverForm, skills: e.target.value })} className={inputClass} placeholder="ADR, Frigo, Uluslararası" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Sertifikalar (virgül ile)</label><input type="text" value={driverForm.certifications} onChange={e => setDriverForm({ ...driverForm, certifications: e.target.value })} className={inputClass} placeholder="SRC1, ADR, Psikoteknik" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Maks Çalışma Saati</label><input type="number" value={driverForm.maxHoursPerDay} onChange={e => setDriverForm({ ...driverForm, maxHoursPerDay: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Tercih Bölgeleri</label><input type="text" value={driverForm.preferredZones} onChange={e => setDriverForm({ ...driverForm, preferredZones: e.target.value })} className={inputClass} placeholder="Marmara, Ege" /></div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
