import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Download, Search, Loader2, MapPin } from 'lucide-react'
import Drawer from '../../components/ui/Drawer'
import { toast } from '../../components/ui/Toast'
import { locationsApi } from '../../api/locations'
import type { LocationEntry } from '../../api/locations'

const locationTypeLabels: Record<string, string> = {
  Depot: 'Depo', Warehouse: 'Ambar', Hub: 'Hub', Customer: 'Müşteri', CrossDock: 'Cross-Dock', PickupPoint: 'Teslim Noktasi',
}

const emptyForm = { code: '', name: '', address: '', locationType: 'Depot' as LocationEntry['locationType'], city: '', district: '', contactName: '', contactPhone: '' }

export default function LocationDirectoryPage() {
  const [locations, setLocations] = useState<LocationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  const fetchLocations = async () => {
    try {
      const res = await locationsApi.getAll()
      setLocations(res.data || [])
    } catch {
      toast('error', 'Lokasyon listesi yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLocations() }, [])

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.address || '').toLowerCase().includes(search.toLowerCase())
  )

  const toggleActive = async (loc: LocationEntry) => {
    try {
      await locationsApi.update(loc.id, { isActive: !loc.isActive })
      fetchLocations()
    } catch {
      toast('error', 'Durum güncellenemedi')
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (loc: LocationEntry) => {
    setEditingId(loc.id)
    setFormData({
      code: loc.code || '',
      name: loc.name,
      address: loc.address || '',
      locationType: loc.locationType,
      city: loc.city || '',
      district: loc.district || '',
      contactName: loc.contactName || '',
      contactPhone: loc.contactPhone || '',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.address) {
      toast('error', 'Ad ve adres zorunludur')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await locationsApi.update(editingId, formData)
        toast('success', 'Lokasyon güncellendi')
      } else {
        await locationsApi.create(formData)
        toast('success', 'Lokasyon eklendi')
      }
      setDrawerOpen(false)
      setEditingId(null)
      fetchLocations()
    } catch {
      toast('error', 'Kaydetme sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await locationsApi.delete(id)
      toast('success', 'Lokasyon silindi')
      fetchLocations()
    } catch {
      toast('error', 'Silme sırasında hata oluştu')
    }
  }

  const handleExport = () => {
    const csv = [
      'Kod,Ad,Tip,Adres,Şehir,İlçe,Aktif',
      ...locations.map(l => `${l.code || ''},${l.name},${locationTypeLabels[l.locationType] || l.locationType},${l.address || ''},${l.city || ''},${l.district || ''},${l.isActive ? 'Evet' : 'Hayır'}`),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lokasyonlar.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast('success', 'Lokasyonlar dışarı aktarıldı')
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Lokasyon Dizini</h1>
          <p className="text-[14px] text-slate-400 mt-1">Teslimat ve toplanma noktalarını yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Dışarı Aktar
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : locations.length === 0 && !search ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] text-slate-400">Henüz lokasyon eklenmedi</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-16">Aktif</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kod</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ad</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tip</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Adres</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(loc => (
                  <tr key={loc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => toggleActive(loc)}
                        className={`w-10 h-6 rounded-full transition-colors ${loc.isActive ? 'bg-orange-400' : 'bg-slate-200'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${loc.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] font-mono text-slate-600">{loc.code || '—'}</td>
                    <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{loc.name}</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-600">{locationTypeLabels[loc.locationType] || loc.locationType}</td>
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
                    <td colSpan={6} className="text-center py-12 text-[14px] text-slate-400">Lokasyon bulunamadı</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingId(null) }}
        title={editingId ? 'Lokasyon Düzenle' : 'Lokasyon Ekle'}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => { setDrawerOpen(false); setEditingId(null) }} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">İptal</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
              Kaydet
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Kod</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className={inputClass} placeholder="LOC-006" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Ad</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Istanbul Depo" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Tip</label>
            <select value={formData.locationType} onChange={(e) => setFormData({ ...formData, locationType: e.target.value as LocationEntry['locationType'] })} className={inputClass}>
              <option value="Depot">Depo</option>
              <option value="Warehouse">Ambar</option>
              <option value="Hub">Hub</option>
              <option value="Customer">Müşteri</option>
              <option value="CrossDock">Cross-Dock</option>
              <option value="PickupPoint">Teslim Noktası</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Adres</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputClass} placeholder="İkitelli OSB, Başakşehir, İstanbul" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Şehir</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={inputClass} placeholder="Istanbul" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">İlçe</label>
              <input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className={inputClass} placeholder="Başakşehir" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Yetkili Kisi</label>
              <input type="text" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} className={inputClass} placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Telefon</label>
              <input type="text" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} className={inputClass} placeholder="0212 xxx xx xx" />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
