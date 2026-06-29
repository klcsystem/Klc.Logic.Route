import { useState } from 'react'
import { Plus, Pencil, Trash2, Download, Search } from 'lucide-react'
import Drawer from '../../components/ui/Drawer'
import { toast } from '../../components/ui/Toast'

interface LocationEntry {
  id: string
  locationId: string
  name: string
  address: string
  active: boolean
}

const mockLocations: LocationEntry[] = [
  { id: '1', locationId: 'LOC-001', name: 'Istanbul Depo', address: 'Ikitelli OSB, Basaksehir, Istanbul', active: true },
  { id: '2', locationId: 'LOC-002', name: 'Ankara Dagitim', address: 'Sincan OSB, Sincan, Ankara', active: true },
  { id: '3', locationId: 'LOC-003', name: 'Izmir Sube', address: 'Cigli, Izmir', active: false },
  { id: '4', locationId: 'LOC-004', name: 'Antalya Terminal', address: 'Kepez, Antalya', active: true },
  { id: '5', locationId: 'LOC-005', name: 'Bursa Fabrika', address: 'Nilufer OSB, Bursa', active: true },
]

const emptyForm = { locationId: '', name: '', address: '' }

export default function LocationDirectoryPage() {
  const [locations, setLocations] = useState(mockLocations)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.locationId.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase())
  )

  const toggleActive = (id: string) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l))
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (loc: LocationEntry) => {
    setEditingId(loc.id)
    setFormData({ locationId: loc.locationId, name: loc.name, address: loc.address })
    setDrawerOpen(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.address) {
      toast('error', 'Ad ve adres zorunludur')
      return
    }
    if (editingId) {
      setLocations(prev => prev.map(l => l.id === editingId ? { ...l, ...formData } : l))
      toast('success', 'Lokasyon guncellendi')
    } else {
      const newLoc: LocationEntry = {
        id: `loc_${Date.now()}`,
        locationId: formData.locationId || `LOC-${String(locations.length + 1).padStart(3, '0')}`,
        name: formData.name,
        address: formData.address,
        active: true,
      }
      setLocations(prev => [...prev, newLoc])
      toast('success', 'Lokasyon eklendi')
    }
    setDrawerOpen(false)
  }

  const handleDelete = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id))
    toast('success', 'Lokasyon silindi')
  }

  const handleExport = () => {
    const csv = [
      'Lokasyon ID,Ad,Adres,Aktif',
      ...locations.map(l => `${l.locationId},${l.name},${l.address},${l.active ? 'Evet' : 'Hayir'}`),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lokasyonlar.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast('success', 'Lokasyonlar disari aktarildi')
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Lokasyon Dizini</h1>
          <p className="text-[14px] text-slate-400 mt-1">Teslimat ve toplanma noktalarini yonetin</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Disari Aktar
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
            <Plus className="w-4 h-4" /> Lokasyon Ekle
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Lokasyon ara..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-16">Aktif</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lokasyon ID</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ad</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Adres</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(loc => (
                <tr key={loc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => toggleActive(loc.id)}
                      className={`w-10 h-6 rounded-full transition-colors ${loc.active ? 'bg-orange-400' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${loc.active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] font-mono text-slate-600">{loc.locationId}</td>
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{loc.name}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{loc.address}</td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(loc)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(loc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[14px] text-slate-400">Lokasyon bulunamadi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? 'Lokasyon Duzenle' : 'Lokasyon Ekle'}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">Iptal</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">Kaydet</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Lokasyon ID</label>
            <input type="text" value={formData.locationId} onChange={(e) => setFormData({ ...formData, locationId: e.target.value })} className={inputClass} placeholder="LOC-006" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Ad</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Istanbul Depo" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Adres</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputClass} placeholder="Ikitelli OSB, Basaksehir, Istanbul" />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
