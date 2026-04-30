import { useState } from 'react'
import {
  Truck, Package, CheckCircle2, Clock, MapPin, TrendingUp,
  ShoppingCart, TableProperties, Car, Users, Send, Plus, Trash2, Pencil,
  DollarSign, Phone, Shield,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import StatCard from '../components/ui/StatCard'

// ── Shared styles ──
const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'
const btnPrimary = 'px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 transition-all'
const btnSecondary = 'px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50'
const btnSmallOrange = 'px-3 py-1 rounded-lg bg-orange-50 text-orange-500 text-[12px] font-medium hover:bg-orange-100 transition-colors'
const thClass = 'text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider'
const tdClass = 'px-6 py-3.5 text-[13px] text-slate-700'

// ── Tab definitions ──
const tabs = [
  { key: 'orders', label: 'Gelen Siparişler', icon: ShoppingCart },
  { key: 'tariff', label: 'Tarife Tablosu', icon: TableProperties },
  { key: 'vehicles', label: 'Araçlarım', icon: Car },
  { key: 'drivers', label: 'Şoförlerim', icon: Users },
  { key: 'shipments', label: 'Sevkiyatlarım', icon: Send },
  { key: 'users', label: 'Kullanıcılar', icon: Shield },
] as const
type TabKey = typeof tabs[number]['key']

// ── Mock: Incoming Orders ──
const mockIncomingOrders = [
  { id: 'o1', number: 'ORD-2026-1041', route: 'İstanbul → Ankara', weight: '18.5 ton', vehicleType: 'Tır', customer: 'Çatom A.Ş.', requestDate: '2026-04-28', status: 'open' },
  { id: 'o2', number: 'ORD-2026-1042', route: 'Bursa → Konya', weight: '8.4 ton', vehicleType: 'Kamyon', customer: 'ABC Gıda', requestDate: '2026-04-28', status: 'open' },
  { id: 'o3', number: 'ORD-2026-1043', route: 'İzmir → Antalya', weight: '22.0 ton', vehicleType: 'Tır', customer: 'Defne Lojistik', requestDate: '2026-04-29', status: 'open' },
  { id: 'o4', number: 'ORD-2026-1044', route: 'Ankara → Samsun', weight: '5.2 ton', vehicleType: 'Kamyonet', customer: 'Çatom A.Ş.', requestDate: '2026-04-29', status: 'bid_sent' },
  { id: 'o5', number: 'ORD-2026-1045', route: 'Eskişehir → İstanbul', weight: '14.0 ton', vehicleType: 'Kamyon', customer: 'Yıldız Holding', requestDate: '2026-04-29', status: 'open' },
  { id: 'o6', number: 'ORD-2026-1046', route: 'Mersin → Gaziantep', weight: '26.0 ton', vehicleType: 'Tır', customer: 'Güney Nakliyat', requestDate: '2026-04-30', status: 'open' },
]

// ── Mock: Tariff (km-based) ──
const defaultTariffRows = [
  { kmFrom: 1, kmTo: 12, price: 5.41 },
  { kmFrom: 13, kmTo: 15, price: 5.55 },
  { kmFrom: 16, kmTo: 18, price: 5.72 },
  { kmFrom: 19, kmTo: 20, price: 5.89 },
  { kmFrom: 21, kmTo: 22, price: 6.10 },
  { kmFrom: 23, kmTo: 25, price: 6.48 },
  { kmFrom: 26, kmTo: 30, price: 7.25 },
  { kmFrom: 31, kmTo: 40, price: 7.85 },
  { kmFrom: 41, kmTo: 50, price: 8.42 },
  { kmFrom: 51, kmTo: 999, price: 9.10 },
]

// ── Mock: Vehicles ──
const mockVehicles = [
  { id: 'v1', plate: '34 MRT 105', type: 'Tır', body: 'Tenteli', tonnage: 25, insuranceEnd: '2026-08-15' },
  { id: 'v2', plate: '34 MRT 106', type: 'Kamyon', body: 'Kapalı Kasa', tonnage: 12, insuranceEnd: '2026-11-20' },
  { id: 'v3', plate: '34 MRT 107', type: 'Kamyonet', body: 'Açık Kasa', tonnage: 3.5, insuranceEnd: '2027-01-10' },
  { id: 'v4', plate: '16 MRT 201', type: 'Tır', body: 'Frigorifik', tonnage: 24, insuranceEnd: '2026-06-30' },
  { id: 'v5', plate: '34 MRT 108', type: 'Kamyon', body: 'Tenteli', tonnage: 10, insuranceEnd: '2026-12-05' },
]

// ── Mock: Drivers ──
const mockDrivers = [
  { id: 'd1', name: 'Ahmet Yılmaz', phone: '0532 111 22 33', licenseNo: 'B-2019-45678', licenseEnd: '2028-03-15' },
  { id: 'd2', name: 'Mehmet Kaya', phone: '0533 222 33 44', licenseNo: 'B-2020-12345', licenseEnd: '2027-09-01' },
  { id: 'd3', name: 'Hasan Demir', phone: '0535 333 44 55', licenseNo: 'B-2018-98765', licenseEnd: '2027-12-20' },
  { id: 'd4', name: 'Ali Çelik', phone: '0536 444 55 66', licenseNo: 'B-2021-55555', licenseEnd: '2029-06-10' },
]

// ── Mock: Assigned Shipments ──
const mockAssignedShipments = [
  { id: 's1', number: 'SHP-2026-0412', route: 'İstanbul → Ankara', weight: '18.5 ton', vehicle: 'Tır', assignedDate: '2026-04-29', status: 'InTransit', driverName: 'Ahmet Yılmaz', plate: '34 MRT 105' },
  { id: 's2', number: 'SHP-2026-0415', route: 'Bursa → Konya', weight: '8.4 ton', vehicle: 'Kamyon', assignedDate: '2026-04-30', status: 'Loading', driverName: 'Mehmet Kaya', plate: '34 MRT 106' },
  { id: 's3', number: 'SHP-2026-0418', route: 'İzmir → Antalya', weight: '22.0 ton', vehicle: 'Tır', assignedDate: '2026-04-30', status: 'PendingPickup', driverName: null, plate: null },
  { id: 's4', number: 'SHP-2026-0410', route: 'Ankara → İstanbul', weight: '12.0 ton', vehicle: 'Kamyon', assignedDate: '2026-04-28', status: 'Delivered', driverName: 'Ahmet Yılmaz', plate: '34 MRT 105' },
]

// ── Mock: Provider Users ──
const mockProviderUsers = [
  { id: 'u1', name: 'Murat Öztürk', email: 'murat@muratlojistik.com', role: 'ProviderAdmin', active: true },
  { id: 'u2', name: 'Ahmet Yılmaz', email: 'ahmet@muratlojistik.com', role: 'ProviderDriver', active: true },
  { id: 'u3', name: 'Zeynep Koç', email: 'zeynep@muratlojistik.com', role: 'ProviderDispatcher', active: true },
  { id: 'u4', name: 'Emre Şahin', email: 'emre@muratlojistik.com', role: 'ProviderDriver', active: false },
]

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  PendingPickup: 'warning', Loading: 'info', InTransit: 'orange', Delivered: 'success',
}
const statusLabels: Record<string, string> = {
  PendingPickup: 'Yükleme Bekliyor', Loading: 'Yükleniyor', InTransit: 'Yolda', Delivered: 'Teslim Edildi',
}

const orderStatusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  open: 'warning', bid_sent: 'info',
}
const orderStatusLabels: Record<string, string> = {
  open: 'Teklif Bekliyor', bid_sent: 'Teklif Verildi',
}

const roleLabels: Record<string, string> = {
  ProviderAdmin: 'Yönetici', ProviderDriver: 'Şoför', ProviderDispatcher: 'Operasyon',
}

const vehicleTypes = ['Tır', 'Kamyon', 'Kamyonet'] as const

export default function ProviderPortalPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('orders')

  // Drawer states
  const [bidDrawerOpen, setBidDrawerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<typeof mockIncomingOrders[0] | null>(null)
  const [bidForm, setBidForm] = useState({ price: '', estimatedHours: '', vehicleType: 'Tır', note: '' })

  const [tariffDrawerOpen, setTariffDrawerOpen] = useState(false)
  const [tariffVehicle, setTariffVehicle] = useState<string>('Tır')
  const [editTariffRows, setEditTariffRows] = useState([...defaultTariffRows])

  const [vehicleDrawerOpen, setVehicleDrawerOpen] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ plate: '', type: 'Tır', body: '', tonnage: '', insuranceEnd: '' })

  const [driverDrawerOpen, setDriverDrawerOpen] = useState(false)
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', licenseNo: '', licenseEnd: '' })

  const [shipmentDrawerOpen, setShipmentDrawerOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<typeof mockAssignedShipments[0] | null>(null)
  const [updateForm, setUpdateForm] = useState({ status: 'Loading', note: '', latitude: '', longitude: '' })

  const [userDrawerOpen, setUserDrawerOpen] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'ProviderDriver' })

  const providerName = 'Murat Lojistik'
  const activeShipmentCount = mockAssignedShipments.filter(s => s.status !== 'Delivered').length
  const pendingBidCount = mockIncomingOrders.filter(o => o.status === 'open').length

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <h1 className="text-[22px] font-bold">Hoş geldiniz, {providerName}</h1>
        <p className="text-orange-100 text-[14px] mt-1">Taşıyıcı portalı — siparişler, tarifeler, filo ve sevkiyat yönetimi</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aktif Sevkiyat" value={String(activeShipmentCount)} change={1} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Bekleyen Teklif" value={String(pendingBidCount)} change={3} icon={ShoppingCart} color="text-blue-600 bg-blue-50" />
        <StatCard label="Zamanında Teslimat" value="%94.2" change={2} icon={TrendingUp} color="text-green-600 bg-green-50" />
        <StatCard label="Bu Ay Gelir" value="₺284.500" change={8} icon={DollarSign} color="text-purple-600 bg-purple-50" />
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-slate-100/80 rounded-xl p-1 flex gap-1 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 flex-1 min-w-[120px] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1 — Gelen Siparişler
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-semibold text-slate-800">Gelen Siparişler</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Teklif verebileceğiniz açık siparişler</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Sipariş No</th>
                  <th className={thClass}>Müşteri</th>
                  <th className={thClass}>Güzergah</th>
                  <th className={`${thClass} text-center`}>Ağırlık</th>
                  <th className={`${thClass} text-center`}>Araç Tipi</th>
                  <th className={`${thClass} text-center`}>Talep Tarihi</th>
                  <th className={`${thClass} text-center`}>Durum</th>
                  <th className={`${thClass} text-center`}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {mockIncomingOrders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className={`${tdClass} font-semibold text-slate-800`}>{o.number}</td>
                    <td className={tdClass}>{o.customer}</td>
                    <td className={tdClass}>{o.route}</td>
                    <td className={`${tdClass} text-center text-slate-600`}>{o.weight}</td>
                    <td className={`${tdClass} text-center`}><Badge variant="default">{o.vehicleType}</Badge></td>
                    <td className={`${tdClass} text-center text-slate-500 text-[12px]`}>{o.requestDate}</td>
                    <td className={`${tdClass} text-center`}><Badge variant={orderStatusVariant[o.status]}>{orderStatusLabels[o.status]}</Badge></td>
                    <td className={`${tdClass} text-center`}>
                      {o.status === 'open' ? (
                        <button
                          onClick={() => { setSelectedOrder(o); setBidForm({ price: '', estimatedHours: '', vehicleType: o.vehicleType, note: '' }); setBidDrawerOpen(true) }}
                          className={btnSmallOrange}
                        >
                          Teklif Ver
                        </button>
                      ) : (
                        <span className="text-[12px] text-slate-400">Gönderildi</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2 — Tarife Tablosu
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'tariff' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">Tarife Tablosu (KM Bazlı)</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Mesafe aralıklarına göre TL/km fiyatlandırma</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {vehicleTypes.map((vt) => (
                  <button
                    key={vt}
                    onClick={() => setTariffVehicle(vt)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                      tariffVehicle === vt ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {vt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setEditTariffRows([...defaultTariffRows]); setTariffDrawerOpen(true) }}
                className={btnPrimary}
              >
                <span className="flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Tarife Düzenle</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Mesafe Aralığı (KM)</th>
                  <th className={`${thClass} text-right`}>TL / km Fiyat</th>
                </tr>
              </thead>
              <tbody>
                {defaultTariffRows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className={`${tdClass} font-medium text-slate-800`}>
                      {row.kmTo === 999 ? `${row.kmFrom}+ km` : `${row.kmFrom} — ${row.kmTo} km`}
                    </td>
                    <td className={`${tdClass} text-right font-mono font-semibold text-slate-800`}>
                      ₺{row.price.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[12px] text-slate-400">
            Araç tipi: <span className="font-semibold text-slate-600">{tariffVehicle}</span> — fiyatlar KDV hariçtir
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3 — Araçlarım
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">Araçlarım</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">{mockVehicles.length} kayıtlı araç</p>
            </div>
            <button onClick={() => { setVehicleForm({ plate: '', type: 'Tır', body: '', tonnage: '', insuranceEnd: '' }); setVehicleDrawerOpen(true) }} className={btnPrimary}>
              <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Araç Ekle</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Plaka</th>
                  <th className={thClass}>Araç Tipi</th>
                  <th className={thClass}>Kasa</th>
                  <th className={`${thClass} text-center`}>Tonaj</th>
                  <th className={`${thClass} text-center`}>Sigorta Bitiş</th>
                  <th className={`${thClass} text-center`}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {mockVehicles.map((v) => {
                  const insuranceExpired = new Date(v.insuranceEnd) < new Date()
                  return (
                    <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className={`${tdClass} font-semibold text-slate-800`}>{v.plate}</td>
                      <td className={tdClass}><Badge variant="default">{v.type}</Badge></td>
                      <td className={tdClass}>{v.body}</td>
                      <td className={`${tdClass} text-center`}>{v.tonnage} ton</td>
                      <td className={`${tdClass} text-center`}>
                        <Badge variant={insuranceExpired ? 'error' : 'success'}>{v.insuranceEnd}</Badge>
                      </td>
                      <td className={`${tdClass} text-center`}>
                        <button className={btnSmallOrange}>Düzenle</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 4 — Şoförlerim
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">Şoförlerim</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">{mockDrivers.length} kayıtlı şoför</p>
            </div>
            <button onClick={() => { setDriverForm({ name: '', phone: '', licenseNo: '', licenseEnd: '' }); setDriverDrawerOpen(true) }} className={btnPrimary}>
              <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Şoför Ekle</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Ad Soyad</th>
                  <th className={thClass}>Telefon</th>
                  <th className={thClass}>Ehliyet No</th>
                  <th className={`${thClass} text-center`}>Ehliyet Bitiş</th>
                  <th className={`${thClass} text-center`}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {mockDrivers.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className={`${tdClass} font-semibold text-slate-800`}>{d.name}</td>
                    <td className={tdClass}>
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{d.phone}</span>
                    </td>
                    <td className={`${tdClass} font-mono text-[12px] text-slate-500`}>{d.licenseNo}</td>
                    <td className={`${tdClass} text-center`}>
                      <Badge variant={new Date(d.licenseEnd) < new Date() ? 'error' : 'success'}>{d.licenseEnd}</Badge>
                    </td>
                    <td className={`${tdClass} text-center`}>
                      <button className={btnSmallOrange}>Düzenle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 5 — Sevkiyatlarım
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'shipments' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Toplam Sevkiyat" value="48" change={5} icon={Package} color="text-blue-600 bg-blue-50" />
            <StatCard label="Zamanında Teslimat" value="%94.2" change={2} icon={CheckCircle2} color="text-green-600 bg-green-50" />
            <StatCard label="Ort. Teslimat Süresi" value="18 saat" change={-3} icon={Clock} color="text-purple-600 bg-purple-50" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-800">Atanmış Sevkiyatlar</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={thClass}>Sevkiyat No</th>
                    <th className={thClass}>Güzergah</th>
                    <th className={`${thClass} text-center`}>Ağırlık</th>
                    <th className={thClass}>Şoför / Plaka</th>
                    <th className={`${thClass} text-center`}>Durum</th>
                    <th className={`${thClass} text-center`}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAssignedShipments.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className={`${tdClass} font-semibold text-slate-800`}>{s.number}</td>
                      <td className={tdClass}>{s.route}</td>
                      <td className={`${tdClass} text-center text-slate-600`}>{s.weight}</td>
                      <td className={`${tdClass} text-[12px] text-slate-500`}>
                        {s.driverName ? <span>{s.driverName} — {s.plate}</span> : <span className="text-amber-500">Atanmadı</span>}
                      </td>
                      <td className={`${tdClass} text-center`}><Badge variant={statusVariant[s.status]}>{statusLabels[s.status]}</Badge></td>
                      <td className={`${tdClass} text-center`}>
                        {s.status !== 'Delivered' && (
                          <button
                            onClick={() => { setSelectedShipment(s); setUpdateForm({ status: 'Loading', note: '', latitude: '', longitude: '' }); setShipmentDrawerOpen(true) }}
                            className={btnSmallOrange}
                          >
                            Güncelle
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 6 — Kullanıcılar
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">Kullanıcılar</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Firma kullanıcılarını yönetin</p>
            </div>
            <button onClick={() => { setUserForm({ name: '', email: '', role: 'ProviderDriver' }); setUserDrawerOpen(true) }} className={btnPrimary}>
              <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Kullanıcı Ekle</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Ad Soyad</th>
                  <th className={thClass}>E-posta</th>
                  <th className={`${thClass} text-center`}>Rol</th>
                  <th className={`${thClass} text-center`}>Durum</th>
                  <th className={`${thClass} text-center`}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {mockProviderUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className={`${tdClass} font-semibold text-slate-800`}>{u.name}</td>
                    <td className={`${tdClass} text-[12px] text-slate-500`}>{u.email}</td>
                    <td className={`${tdClass} text-center`}><Badge variant="default">{roleLabels[u.role]}</Badge></td>
                    <td className={`${tdClass} text-center`}>
                      <Badge variant={u.active ? 'success' : 'error'}>{u.active ? 'Aktif' : 'Pasif'}</Badge>
                    </td>
                    <td className={`${tdClass} text-center`}>
                      <button className={btnSmallOrange}>Düzenle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          DRAWERS
         ═══════════════════════════════════════════════════════════════ */}

      {/* Bid Drawer */}
      <Drawer isOpen={bidDrawerOpen} onClose={() => setBidDrawerOpen(false)} title={`Teklif Ver — ${selectedOrder?.number || ''}`} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setBidDrawerOpen(false)} className={btnSecondary}>İptal</button>
          <button onClick={() => setBidDrawerOpen(false)} className={btnPrimary}>Teklif Gönder</button>
        </div>
      }>
        <div className="space-y-4">
          {selectedOrder && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
              <p className="text-[13px] font-semibold text-slate-800">{selectedOrder.route}</p>
              <p className="text-[12px] text-slate-500">{selectedOrder.weight} — {selectedOrder.vehicleType} — {selectedOrder.customer}</p>
            </div>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Fiyat (TL)</label>
            <input type="number" value={bidForm.price} onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })} className={inputClass} placeholder="Ör: 12500" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Tahmini Süre (Saat)</label>
            <input type="number" value={bidForm.estimatedHours} onChange={(e) => setBidForm({ ...bidForm, estimatedHours: e.target.value })} className={inputClass} placeholder="Ör: 8" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Araç Tipi</label>
            <select value={bidForm.vehicleType} onChange={(e) => setBidForm({ ...bidForm, vehicleType: e.target.value })} className={inputClass}>
              {vehicleTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Not</label>
            <textarea value={bidForm.note} onChange={(e) => setBidForm({ ...bidForm, note: e.target.value })} className={inputClass} rows={3} placeholder="Ek bilgi veya koşullar..." />
          </div>
        </div>
      </Drawer>

      {/* Tariff Edit Drawer */}
      <Drawer isOpen={tariffDrawerOpen} onClose={() => setTariffDrawerOpen(false)} title="Tarife Düzenle" width="max-w-xl" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setTariffDrawerOpen(false)} className={btnSecondary}>İptal</button>
          <button onClick={() => setTariffDrawerOpen(false)} className={btnPrimary}>Kaydet</button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Araç Tipi</label>
            <select className={inputClass} defaultValue="Tır">
              {vehicleTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
            </select>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase text-left">KM Başlangıç</th>
                  <th className="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase text-left">KM Bitiş</th>
                  <th className="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase text-left">TL/km</th>
                  <th className="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase text-center w-16"></th>
                </tr>
              </thead>
              <tbody>
                {editTariffRows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.kmFrom}
                        onChange={(e) => {
                          const updated = [...editTariffRows]
                          updated[i] = { ...updated[i], kmFrom: Number(e.target.value) }
                          setEditTariffRows(updated)
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.kmTo}
                        onChange={(e) => {
                          const updated = [...editTariffRows]
                          updated[i] = { ...updated[i], kmTo: Number(e.target.value) }
                          setEditTariffRows(updated)
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.001"
                        value={row.price}
                        onChange={(e) => {
                          const updated = [...editTariffRows]
                          updated[i] = { ...updated[i], price: Number(e.target.value) }
                          setEditTariffRows(updated)
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[13px] text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => setEditTariffRows(editTariffRows.filter((_, idx) => idx !== i))}
                        className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setEditTariffRows([...editTariffRows, { kmFrom: 0, kmTo: 0, price: 0 }])}
            className="flex items-center gap-1.5 text-[13px] font-medium text-orange-500 hover:text-orange-600"
          >
            <Plus className="w-3.5 h-3.5" /> Satır Ekle
          </button>
        </div>
      </Drawer>

      {/* Vehicle Drawer */}
      <Drawer isOpen={vehicleDrawerOpen} onClose={() => setVehicleDrawerOpen(false)} title="Araç Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setVehicleDrawerOpen(false)} className={btnSecondary}>İptal</button>
          <button onClick={() => setVehicleDrawerOpen(false)} className={btnPrimary}>Kaydet</button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Plaka</label>
            <input type="text" value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} className={inputClass} placeholder="Ör: 34 ABC 123" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Araç Tipi</label>
            <select value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} className={inputClass}>
              {vehicleTypes.map(vt => <option key={vt} value={vt}>{vt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Kasa Tipi</label>
            <input type="text" value={vehicleForm.body} onChange={(e) => setVehicleForm({ ...vehicleForm, body: e.target.value })} className={inputClass} placeholder="Ör: Tenteli, Kapalı Kasa" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Tonaj</label>
            <input type="number" value={vehicleForm.tonnage} onChange={(e) => setVehicleForm({ ...vehicleForm, tonnage: e.target.value })} className={inputClass} placeholder="Ör: 25" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Sigorta Bitiş Tarihi</label>
            <input type="date" value={vehicleForm.insuranceEnd} onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceEnd: e.target.value })} className={inputClass} />
          </div>
        </div>
      </Drawer>

      {/* Driver Drawer */}
      <Drawer isOpen={driverDrawerOpen} onClose={() => setDriverDrawerOpen(false)} title="Şoför Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setDriverDrawerOpen(false)} className={btnSecondary}>İptal</button>
          <button onClick={() => setDriverDrawerOpen(false)} className={btnPrimary}>Kaydet</button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Ad Soyad</label>
            <input type="text" value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} className={inputClass} placeholder="Ör: Ahmet Yılmaz" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Telefon</label>
            <input type="tel" value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} className={inputClass} placeholder="Ör: 0532 111 22 33" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Ehliyet No</label>
            <input type="text" value={driverForm.licenseNo} onChange={(e) => setDriverForm({ ...driverForm, licenseNo: e.target.value })} className={inputClass} placeholder="Ör: B-2021-12345" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Ehliyet Bitiş Tarihi</label>
            <input type="date" value={driverForm.licenseEnd} onChange={(e) => setDriverForm({ ...driverForm, licenseEnd: e.target.value })} className={inputClass} />
          </div>
        </div>
      </Drawer>

      {/* Shipment Status Update Drawer */}
      <Drawer isOpen={shipmentDrawerOpen} onClose={() => setShipmentDrawerOpen(false)} title={`Durum Güncelle — ${selectedShipment?.number || ''}`} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setShipmentDrawerOpen(false)} className={btnSecondary}>İptal</button>
          <button onClick={() => setShipmentDrawerOpen(false)} className={btnPrimary}>Güncelle</button>
        </div>
      }>
        <div className="space-y-4">
          {selectedShipment && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4">
              <p className="text-[13px] font-semibold text-slate-800">{selectedShipment.route}</p>
              <p className="text-[12px] text-slate-500">{selectedShipment.weight} — {selectedShipment.vehicle}</p>
            </div>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Yeni Durum</label>
            <select value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })} className={inputClass}>
              <option value="Loading">Yükleniyor</option>
              <option value="InTransit">Yola Çıktı</option>
              <option value="AtDestination">Varış Noktasında</option>
              <option value="Delivered">Teslim Edildi</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Not</label>
            <textarea value={updateForm.note} onChange={(e) => setUpdateForm({ ...updateForm, note: e.target.value })} className={inputClass} rows={3} placeholder="Ek bilgi..." />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Konum (opsiyonel)</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={updateForm.latitude} onChange={(e) => setUpdateForm({ ...updateForm, latitude: e.target.value })} className={inputClass} placeholder="Enlem" />
              <input type="text" value={updateForm.longitude} onChange={(e) => setUpdateForm({ ...updateForm, longitude: e.target.value })} className={inputClass} placeholder="Boylam" />
            </div>
          </div>
        </div>
      </Drawer>

      {/* User Drawer */}
      <Drawer isOpen={userDrawerOpen} onClose={() => setUserDrawerOpen(false)} title="Kullanıcı Ekle" footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => setUserDrawerOpen(false)} className={btnSecondary}>İptal</button>
          <button onClick={() => setUserDrawerOpen(false)} className={btnPrimary}>Kaydet</button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Ad Soyad</label>
            <input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className={inputClass} placeholder="Ör: Zeynep Koç" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">E-posta</label>
            <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className={inputClass} placeholder="Ör: zeynep@muratlojistik.com" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Rol</label>
            <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className={inputClass}>
              <option value="ProviderAdmin">Yönetici</option>
              <option value="ProviderDriver">Şoför</option>
              <option value="ProviderDispatcher">Operasyon</option>
            </select>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
