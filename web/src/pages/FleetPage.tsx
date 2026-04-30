import { useState } from 'react'
import { Truck, User, Plus, Search } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'

type Tab = 'vehicles' | 'drivers'

const mockVehicles = [
  { id: '1', providerId: '1', providerName: 'Yolda', plateNumber: '34 YLD 001', vehicleType: 'Tır', bodyType: 'Mega', tonnage: 24, isActive: true, insuranceExpiry: '2026-12-31', integrationMode: 'ApiIntegrated' },
  { id: '2', providerId: '2', providerName: 'Tırport', plateNumber: '34 TRP 042', vehicleType: 'Tır', bodyType: 'Standart', tonnage: 22, isActive: true, insuranceExpiry: '2026-08-15', integrationMode: 'ApiIntegrated' },
  { id: '3', providerId: '23', providerName: 'Murat Lojistik', plateNumber: '34 MRT 105', vehicleType: 'Kamyon', bodyType: 'Perdeli', tonnage: 12, isActive: true, insuranceExpiry: '2026-11-20', integrationMode: 'SelfService' },
  { id: '4', providerId: '23', providerName: 'Murat Lojistik', plateNumber: '34 MRT 106', vehicleType: 'Kamyonet', bodyType: null, tonnage: 3.5, isActive: true, insuranceExpiry: '2027-03-10', integrationMode: 'SelfService' },
  { id: '5', providerId: '6', providerName: 'Horoz Lojistik', plateNumber: '35 HRZ 220', vehicleType: 'Tır', bodyType: 'Mega', tonnage: 24, isActive: true, insuranceExpiry: '2026-09-30', integrationMode: 'Managed' },
  { id: '6', providerId: '6', providerName: 'Horoz Lojistik', plateNumber: '35 HRZ 221', vehicleType: 'Frigorifik', bodyType: 'Standart', tonnage: 18, isActive: false, insuranceExpiry: '2026-06-01', integrationMode: 'Managed' },
  { id: '7', providerId: '21', providerName: 'Barsan Global', plateNumber: '41 BRS 010', vehicleType: 'Tanker', bodyType: null, tonnage: 30, isActive: true, insuranceExpiry: '2027-01-15', integrationMode: 'Managed' },
  { id: '8', providerId: '4', providerName: 'Ekol Lojistik', plateNumber: '34 EKL 555', vehicleType: 'Tır', bodyType: 'Mega', tonnage: 24, isActive: true, insuranceExpiry: '2026-10-20', integrationMode: 'ApiIntegrated' },
  { id: '9', providerId: '5', providerName: 'Mars Logistics', plateNumber: '06 MRS 301', vehicleType: 'Kamyon', bodyType: 'Perdeli', tonnage: 14, isActive: true, insuranceExpiry: '2026-07-12', integrationMode: 'SelfService' },
  { id: '10', providerId: '22', providerName: 'Kontrolör Lojistik', plateNumber: '34 KNT 080', vehicleType: 'Tanker', bodyType: 'ADR', tonnage: 26, isActive: true, insuranceExpiry: '2026-12-01', integrationMode: 'Managed' },
]

const mockDrivers = [
  { id: '1', providerId: '23', providerName: 'Murat Lojistik', fullName: 'Ahmet Yılmaz', phone: '532 111 2233', licenseNumber: 'B-34-12345', licenseExpiry: '2028-05-10', isActive: true },
  { id: '2', providerId: '23', providerName: 'Murat Lojistik', fullName: 'Mehmet Kaya', phone: '533 222 3344', licenseNumber: 'B-34-23456', licenseExpiry: '2027-11-20', isActive: true },
  { id: '3', providerId: '6', providerName: 'Horoz Lojistik', fullName: 'Ali Demir', phone: '535 333 4455', licenseNumber: 'B-35-34567', licenseExpiry: '2029-02-15', isActive: true },
  { id: '4', providerId: '6', providerName: 'Horoz Lojistik', fullName: 'Veli Öztürk', phone: '536 444 5566', licenseNumber: 'B-35-45678', licenseExpiry: '2028-08-30', isActive: false },
  { id: '5', providerId: '21', providerName: 'Barsan Global', fullName: 'Hasan Çelik', phone: '537 555 6677', licenseNumber: 'E-41-56789', licenseExpiry: '2027-06-01', isActive: true },
  { id: '6', providerId: '5', providerName: 'Mars Logistics', fullName: 'Hüseyin Acar', phone: '538 666 7788', licenseNumber: 'C-06-67890', licenseExpiry: '2028-12-25', isActive: true },
  { id: '7', providerId: '22', providerName: 'Kontrolör Lojistik', fullName: 'İbrahim Şahin', phone: '539 777 8899', licenseNumber: 'E-34-78901', licenseExpiry: '2027-09-10', isActive: true },
  { id: '8', providerId: '4', providerName: 'Ekol Lojistik', fullName: 'Osman Yıldız', phone: '541 888 9900', licenseNumber: 'C-34-89012', licenseExpiry: '2029-04-18', isActive: true },
]

const integrationBadge = (mode: string) => {
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

  const filteredVehicles = mockVehicles.filter(v =>
    searchTerm === '' || v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) || v.providerName.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredDrivers = mockDrivers.filter(d =>
    searchTerm === '' || d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || d.providerName.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Filo Yönetimi</h1>
          <p className="text-[14px] text-slate-400 mt-1">Araç ve şoför yönetimi — tüm taşıyıcılar</p>
        </div>
        <button
          onClick={() => tab === 'vehicles' ? setVehicleDrawerOpen(true) : setDriverDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"
        >
          <Plus className="w-4 h-4" /> {tab === 'vehicles' ? 'Araç Ekle' : 'Şoför Ekle'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => { setTab('vehicles'); setSearchTerm('') }} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-all ${tab === 'vehicles' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Truck className="w-4 h-4" /> Araçlar ({mockVehicles.length})
        </button>
        <button onClick={() => { setTab('drivers'); setSearchTerm('') }} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-all ${tab === 'drivers' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <User className="w-4 h-4" /> Şoförler ({mockDrivers.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ara..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
      </div>

      {/* Vehicles Tab */}
      {tab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Plaka</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Araç Tipi</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tonaj</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Taşıyıcı</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Entegrasyon</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sigorta Bitiş</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-[13px] font-semibold text-slate-800">{v.plateNumber}</td>
                    <td className="px-6 py-3.5"><Badge variant="info">{v.vehicleType}</Badge> {v.bodyType && <span className="text-[11px] text-slate-400 ml-1">{v.bodyType}</span>}</td>
                    <td className="px-6 py-3.5 text-center text-[13px] text-slate-600">{v.tonnage} ton</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-700">{v.providerName}</td>
                    <td className="px-6 py-3.5 text-center">{integrationBadge(v.integrationMode)}</td>
                    <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{v.insuranceExpiry}</td>
                    <td className="px-6 py-3.5 text-center"><Badge variant={v.isActive ? 'success' : 'default'}>{v.isActive ? 'Aktif' : 'Pasif'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drivers Tab */}
      {tab === 'drivers' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ad Soyad</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Telefon</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ehliyet No</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ehliyet Bitiş</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Taşıyıcı</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><User className="w-4 h-4" /></div>
                        <span className="text-[13px] font-medium text-slate-800">{d.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-600">{d.phone}</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-600 font-mono">{d.licenseNumber}</td>
                    <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{d.licenseExpiry}</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-700">{d.providerName}</td>
                    <td className="px-6 py-3.5 text-center"><Badge variant={d.isActive ? 'success' : 'default'}>{d.isActive ? 'Aktif' : 'Pasif'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Drawer */}
      <Drawer isOpen={vehicleDrawerOpen} onClose={() => setVehicleDrawerOpen(false)} title="Araç Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setVehicleDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">İptal</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">Kaydet</button>
        </div>
      }>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Plaka</label><input type="text" className={inputClass} placeholder="34 ABC 123" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Araç Tipi</label>
            <select className={inputClass}><option>Tır</option><option>Kamyon</option><option>Kamyonet</option><option>Frigorifik</option><option>Tanker</option><option>Lowbed</option></select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Kasa Tipi</label><input type="text" className={inputClass} placeholder="Mega, Perdeli..." /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Tonaj</label><input type="number" className={inputClass} placeholder="24" /></div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Taşıyıcı</label>
            <select className={inputClass}><option>Murat Lojistik</option><option>Horoz Lojistik</option><option>Barsan Global</option><option>Mars Logistics</option><option>Kontrolör Lojistik</option></select>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Sigorta Bitiş Tarihi</label><input type="date" className={inputClass} /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Not</label><textarea className={inputClass} rows={2} placeholder="Ek bilgi..." /></div>
        </div>
      </Drawer>

      {/* Driver Drawer */}
      <Drawer isOpen={driverDrawerOpen} onClose={() => setDriverDrawerOpen(false)} title="Şoför Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setDriverDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">İptal</button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">Kaydet</button>
        </div>
      }>
        <div className="space-y-4">
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Ad Soyad</label><input type="text" className={inputClass} placeholder="Ahmet Yılmaz" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Telefon</label><input type="text" className={inputClass} placeholder="532 111 2233" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Ehliyet No</label><input type="text" className={inputClass} placeholder="B-34-12345" /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Ehliyet Bitiş</label><input type="date" className={inputClass} /></div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">Taşıyıcı</label>
            <select className={inputClass}><option>Murat Lojistik</option><option>Horoz Lojistik</option><option>Barsan Global</option><option>Mars Logistics</option></select>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
