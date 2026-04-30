import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Phone, MapPin } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Drawer from '../../components/ui/Drawer'
import type { YoldaContact } from '../../api/yolda'

const mockContacts: YoldaContact[] = [
  { id: 'c1', company: 'Catom Kimya A.S.', name: 'Ahmet', familyName: 'Yilmaz', phoneNumber: '+905551234567', addressType: 'FACTORY', city: 'Kocaeli', district: 'Gebze', address: 'Gebze OSB Mah. 1. Sok. No:5', countryId: 'TR', latitude: 40.7988, longitude: 29.4314 },
  { id: 'c2', company: 'A101 Depo Istanbul', name: 'Mehmet', familyName: 'Kaya', phoneNumber: '+905559876543', addressType: 'WAREHOUSE', city: 'Istanbul', district: 'Tuzla', address: 'Tuzla Lojistik Merkezi', countryId: 'TR', latitude: 40.8167, longitude: 29.3000 },
  { id: 'c3', company: 'A101 Depo Ankara', name: 'Fatma', familyName: 'Demir', phoneNumber: '+905553456789', addressType: 'WAREHOUSE', city: 'Ankara', district: 'Sincan', address: 'Sincan OSB Lojistik Alani', countryId: 'TR', latitude: 39.9690, longitude: 32.5578 },
  { id: 'c4', company: 'A101 Depo Izmir', name: 'Ali', familyName: 'Celik', phoneNumber: '+905557654321', addressType: 'WAREHOUSE', city: 'Izmir', district: 'Kemalpasa', address: 'Kemalpasa OSB Lojistik Alani', countryId: 'TR', latitude: 38.4260, longitude: 27.4270 },
  { id: 'c5', company: 'Petkim Petrokimya A.S.', name: 'Kemal', familyName: 'Ozturk', phoneNumber: '+905551112233', addressType: 'FACTORY', city: 'Izmir', district: 'Aliaga', address: 'Petkim Petrokimya Holding', countryId: 'TR', latitude: 38.7983, longitude: 26.9590 },
  { id: 'c6', company: 'A101 Depo Bursa', name: 'Zeynep', familyName: 'Sahin', phoneNumber: '+905554443322', addressType: 'WAREHOUSE', city: 'Bursa', district: 'Nilufer', address: 'Nilufer OSB Depo Alani', countryId: 'TR', latitude: 40.2128, longitude: 28.9482 },
  { id: 'c7', company: 'A101 Depo Antalya', name: 'Hasan', familyName: 'Arslan', phoneNumber: '+905556667788', addressType: 'WAREHOUSE', city: 'Antalya', district: 'Dosemealti', address: 'Dosemealti Lojistik Merkezi', countryId: 'TR', latitude: 37.0027, longitude: 30.6489 },
  { id: 'c8', company: 'Sasa Polyester A.S.', name: 'Murat', familyName: 'Aksoy', phoneNumber: '+905552223344', addressType: 'FACTORY', city: 'Adana', district: 'Ceyhan', address: 'Ceyhan Sanayi Bolgesi', countryId: 'TR', latitude: 37.0167, longitude: 35.8167 },
  { id: 'c9', company: 'A101 Depo Konya', name: 'Veli', familyName: 'Korkmaz', phoneNumber: '+905558889900', addressType: 'WAREHOUSE', city: 'Konya', district: 'Selcuklu', address: 'Selcuklu OSB Depo Sahasi', countryId: 'TR', latitude: 37.8713, longitude: 32.4846 },
]

const addressTypeVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'orange'> = {
  FACTORY: 'orange',
  WAREHOUSE: 'info',
  WORKSPACE: 'default',
  MALL: 'warning',
}

const addressTypeLabels: Record<string, string> = {
  FACTORY: 'Fabrika',
  WAREHOUSE: 'Depo',
  WORKSPACE: 'Isyeri',
  MALL: 'AVM',
}

export default function YoldaContacts() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState({
    company: '', name: '', familyName: '', phoneNumber: '', addressType: 'FACTORY',
    city: '', district: '', address: '', latitude: '', longitude: '',
  })

  const filtered = mockContacts.filter(c => {
    const term = searchTerm.toLowerCase()
    return term === '' || c.company.toLowerCase().includes(term) || c.name.toLowerCase().includes(term) || c.city.toLowerCase().includes(term)
  })

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/yolda')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Yolda Kontaklar</h1>
            <p className="text-[14px] text-slate-400 mt-1">Yolda API uzerindeki gonderici ve alici adresleri</p>
          </div>
        </div>
        <button
          onClick={() => { setForm({ company: '', name: '', familyName: '', phoneNumber: '', addressType: 'FACTORY', city: '', district: '', address: '', latitude: '', longitude: '' }); setDrawerOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"
        >
          <Plus className="w-4 h-4" /> Yeni Kontak
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Firma, isim veya sehir ile arayun..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
        />
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Firma</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ad Soyad</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Sehir</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ilce</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Tip</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Telefon</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase">Adres</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800">{c.company}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">{c.name} {c.familyName}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">{c.city}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-500">{c.district}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={addressTypeVariant[c.addressType] || 'default'}>{addressTypeLabels[c.addressType] || c.addressType}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                      <Phone className="w-3 h-3" /> {c.phoneNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-500 max-w-[200px] truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" /> {c.address}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[14px] text-slate-400">Sonuc bulunamadi.</p>
          </div>
        )}
      </div>

      {/* Add Contact Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Yeni Kontak Ekle"
        width="max-w-md"
        footer={
          <div className="flex items-center gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Iptal
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 transition-all"
            >
              Kaydet
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Firma <span className="text-red-400">*</span></label>
            <input type="text" value={form.company} onChange={e => set('company', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">Ad <span className="text-red-400">*</span></label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">Soyad</label>
              <input type="text" value={form.familyName} onChange={e => set('familyName', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Telefon <span className="text-red-400">*</span></label>
            <input type="text" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="+905xx..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Adres Tipi</label>
            <select value={form.addressType} onChange={e => set('addressType', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400">
              <option value="FACTORY">Fabrika</option>
              <option value="WAREHOUSE">Depo</option>
              <option value="WORKSPACE">Isyeri</option>
              <option value="MALL">AVM</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">Sehir <span className="text-red-400">*</span></label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">Ilce</label>
              <input type="text" value={form.district} onChange={e => set('district', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Adres <span className="text-red-400">*</span></label>
            <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">Enlem</label>
              <input type="number" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="40.7988" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">Boylam</label>
              <input type="number" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="29.4314" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
