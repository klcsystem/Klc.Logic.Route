import { useState, useEffect } from 'react'
import {
  Truck, Package, CheckCircle2, Clock, MapPin, TrendingUp,
  ShoppingCart, TableProperties, Car, Users, Send, Plus, Trash2, Pencil,
  DollarSign, Phone, Shield, Loader2,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import StatCard from '../components/ui/StatCard'
import { toast } from '../components/ui/Toast'
import { providerPortalApi } from '../api/providerPortal'
import type {
  PortalOrder, PortalVehicle, PortalDriver, PortalShipment,
  PortalStats, TariffRow, PortalUser,
} from '../api/providerPortal'

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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Data states
  const [stats, setStats] = useState<PortalStats | null>(null)
  const [orders, setOrders] = useState<PortalOrder[]>([])
  const [tariffRows, setTariffRows] = useState<TariffRow[]>([])
  const [vehicles, setVehicles] = useState<PortalVehicle[]>([])
  const [drivers, setDrivers] = useState<PortalDriver[]>([])
  const [shipments, setShipments] = useState<PortalShipment[]>([])
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([])

  // Drawer states
  const [bidDrawerOpen, setBidDrawerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PortalOrder | null>(null)
  const [bidForm, setBidForm] = useState({ price: '', estimatedHours: '', vehicleType: 'Tır', note: '' })

  const [tariffDrawerOpen, setTariffDrawerOpen] = useState(false)
  const [tariffVehicle, setTariffVehicle] = useState<string>('Tır')
  const [editTariffRows, setEditTariffRows] = useState<TariffRow[]>([])

  const [vehicleDrawerOpen, setVehicleDrawerOpen] = useState(false)
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [vehicleForm, setVehicleForm] = useState({ plate: '', type: 'Tır', body: '', tonnage: '', insuranceEnd: '' })

  const [driverDrawerOpen, setDriverDrawerOpen] = useState(false)
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', licenseNo: '', licenseEnd: '' })

  const [shipmentDrawerOpen, setShipmentDrawerOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<PortalShipment | null>(null)
  const [updateForm, setUpdateForm] = useState({ status: 'Loading', note: '', latitude: '', longitude: '' })

  const [userDrawerOpen, setUserDrawerOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'ProviderDriver' })

  // ── Fetch functions ──
  const fetchStats = async () => {
    try {
      const res = await providerPortalApi.getStats()
      setStats(res.data || null)
    } catch { /* stats are non-critical */ }
  }

  const fetchOrders = async () => {
    try {
      const res = await providerPortalApi.getOrders()
      setOrders(res.data || [])
    } catch {
      toast('error', 'Siparişler yüklenemedi')
    }
  }

  const fetchTariff = async (vt?: string) => {
    try {
      const res = await providerPortalApi.getTariff(vt || tariffVehicle)
      setTariffRows(res.data || [])
    } catch { /* non-critical */ }
  }

  const fetchVehicles = async () => {
    try {
      const res = await providerPortalApi.getVehicles()
      setVehicles(res.data || [])
    } catch {
      toast('error', 'Araçlar yüklenemedi')
    }
  }

  const fetchDrivers = async () => {
    try {
      const res = await providerPortalApi.getDrivers()
      setDrivers(res.data || [])
    } catch {
      toast('error', 'Şoförler yüklenemedi')
    }
  }

  const fetchShipments = async () => {
    try {
      const res = await providerPortalApi.getShipments()
      setShipments(res.data || [])
    } catch {
      toast('error', 'Sevkiyatlar yüklenemedi')
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await providerPortalApi.getUsers()
      setPortalUsers(res.data || [])
    } catch {
      toast('error', 'Kullanıcılar yüklenemedi')
    }
  }

  useEffect(() => {
    Promise.all([fetchStats(), fetchOrders(), fetchTariff(), fetchVehicles(), fetchDrivers(), fetchShipments(), fetchUsers()])
      .finally(() => setLoading(false))
  }, [])

  // ── Handlers ──
  const handleSubmitBid = async () => {
    if (!selectedOrder || !bidForm.price) {
      toast('error', 'Fiyat zorunludur')
      return
    }
    setSaving(true)
    try {
      await providerPortalApi.submitBid(selectedOrder.id, {
        price: Number(bidForm.price),
        estimatedHours: Number(bidForm.estimatedHours),
        vehicleType: bidForm.vehicleType,
        note: bidForm.note || undefined,
      })
      toast('success', 'Teklif gönderildi')
      setBidDrawerOpen(false)
      fetchOrders()
      fetchStats()
    } catch {
      toast('error', 'Teklif gonderilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTariff = async () => {
    setSaving(true)
    try {
      await providerPortalApi.saveTariff(tariffVehicle, editTariffRows)
      toast('success', 'Tarife kaydedildi')
      setTariffDrawerOpen(false)
      fetchTariff()
    } catch {
      toast('error', 'Tarife kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleTariffVehicleChange = (vt: string) => {
    setTariffVehicle(vt)
    fetchTariff(vt)
  }

  const handleSaveVehicle = async () => {
    if (!vehicleForm.plate) {
      toast('error', 'Plaka zorunludur')
      return
    }
    setSaving(true)
    try {
      const payload = { plate: vehicleForm.plate, type: vehicleForm.type, body: vehicleForm.body, tonnage: Number(vehicleForm.tonnage), insuranceEnd: vehicleForm.insuranceEnd }
      if (editingVehicleId) {
        await providerPortalApi.updateVehicle(editingVehicleId, payload)
        toast('success', 'Araç güncellendi')
      } else {
        await providerPortalApi.createVehicle(payload)
        toast('success', 'Araç eklendi')
      }
      setVehicleDrawerOpen(false)
      setEditingVehicleId(null)
      fetchVehicles()
    } catch {
      toast('error', 'Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    try {
      await providerPortalApi.deleteVehicle(id)
      toast('success', 'Araç silindi')
      fetchVehicles()
    } catch {
      toast('error', 'Silme hatası')
    }
  }

  const handleSaveDriver = async () => {
    if (!driverForm.name) {
      toast('error', 'Ad soyad zorunludur')
      return
    }
    setSaving(true)
    try {
      if (editingDriverId) {
        await providerPortalApi.updateDriver(editingDriverId, driverForm)
        toast('success', 'Şoför güncellendi')
      } else {
        await providerPortalApi.createDriver(driverForm)
        toast('success', 'Şoför eklendi')
      }
      setDriverDrawerOpen(false)
      setEditingDriverId(null)
      fetchDrivers()
    } catch {
      toast('error', 'Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDriver = async (id: string) => {
    try {
      await providerPortalApi.deleteDriver(id)
      toast('success', 'Şoför silindi')
      fetchDrivers()
    } catch {
      toast('error', 'Silme hatası')
    }
  }

  const handleUpdateShipment = async () => {
    if (!selectedShipment) return
    setSaving(true)
    try {
      await providerPortalApi.updateShipmentStatus(selectedShipment.id, {
        status: updateForm.status,
        note: updateForm.note || undefined,
        latitude: updateForm.latitude ? Number(updateForm.latitude) : undefined,
        longitude: updateForm.longitude ? Number(updateForm.longitude) : undefined,
      })
      toast('success', 'Sevkiyat güncellendi')
      setShipmentDrawerOpen(false)
      fetchShipments()
      fetchStats()
    } catch {
      toast('error', 'Güncelleme hatası')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email) {
      toast('error', 'Ad ve e-posta zorunludur')
      return
    }
    setSaving(true)
    try {
      if (editingUserId) {
        await providerPortalApi.updateUser(editingUserId, userForm)
        toast('success', 'Kullanıcı güncellendi')
      } else {
        await providerPortalApi.createUser(userForm)
        toast('success', 'Kullanıcı eklendi')
      }
      setUserDrawerOpen(false)
      setEditingUserId(null)
      fetchUsers()
    } catch {
      toast('error', 'Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      await providerPortalApi.deleteUser(id)
      toast('success', 'Kullanıcı silindi')
      fetchUsers()
    } catch {
      toast('error', 'Silme hatası')
    }
  }

  // ── Derived values ──
  const providerName = 'Murat Lojistik'
  const activeShipmentCount = stats?.activeShipmentCount ?? shipments.filter(s => s.status !== 'Delivered').length
  const pendingBidCount = stats?.pendingBidCount ?? orders.filter(o => o.status === 'open').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

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
        <StatCard label="Zamanında Teslimat" value={stats ? `%${stats.onTimeDeliveryRate}` : '—'} change={2} icon={TrendingUp} color="text-green-600 bg-green-50" />
        <StatCard label="Bu Ay Gelir" value={stats ? `₺${stats.monthlyRevenue.toLocaleString('tr-TR')}` : '—'} change={8} icon={DollarSign} color="text-purple-600 bg-purple-50" />
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
                {orders.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-[14px] text-slate-400">Gelen sipariş bulunamadı</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className={`${tdClass} font-semibold text-slate-800`}>{o.number}</td>
                    <td className={tdClass}>{o.customer}</td>
                    <td className={tdClass}>{o.route}</td>
                    <td className={`${tdClass} text-center text-slate-600`}>{o.weight}</td>
                    <td className={`${tdClass} text-center`}><Badge variant="default">{o.vehicleType}</Badge></td>
                    <td className={`${tdClass} text-center text-slate-500 text-[12px]`}>{o.requestDate}</td>
                    <td className={`${tdClass} text-center`}><Badge variant={orderStatusVariant[o.status] || 'default'}>{orderStatusLabels[o.status] || o.status}</Badge></td>
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
                    onClick={() => handleTariffVehicleChange(vt)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                      tariffVehicle === vt ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {vt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setEditTariffRows([...tariffRows]); setTariffDrawerOpen(true) }}
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
                {tariffRows.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-12 text-[14px] text-slate-400">Tarife bulunamadı</td></tr>
                ) : tariffRows.map((row, i) => (
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
              <p className="text-[12px] text-slate-400 mt-0.5">{vehicles.length} kayıtlı araç</p>
            </div>
            <button onClick={() => { setEditingVehicleId(null); setVehicleForm({ plate: '', type: 'Tır', body: '', tonnage: '', insuranceEnd: '' }); setVehicleDrawerOpen(true) }} className={btnPrimary}>
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
                {vehicles.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-[14px] text-slate-400">Kayıtlı araç bulunamadı</td></tr>
                ) : vehicles.map((v) => {
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
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditingVehicleId(v.id); setVehicleForm({ plate: v.plate, type: v.type, body: v.body, tonnage: String(v.tonnage), insuranceEnd: v.insuranceEnd }); setVehicleDrawerOpen(true) }} className={btnSmallOrange}>Düzenle</button>
                          <button onClick={() => handleDeleteVehicle(v.id)} className="px-3 py-1 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors">Sil</button>
                        </div>
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
              <p className="text-[12px] text-slate-400 mt-0.5">{drivers.length} kayıtlı şoför</p>
            </div>
            <button onClick={() => { setEditingDriverId(null); setDriverForm({ name: '', phone: '', licenseNo: '', licenseEnd: '' }); setDriverDrawerOpen(true) }} className={btnPrimary}>
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
                {drivers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-[14px] text-slate-400">Kayıtlı şoför bulunamadı</td></tr>
                ) : drivers.map((d) => (
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
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditingDriverId(d.id); setDriverForm({ name: d.name, phone: d.phone, licenseNo: d.licenseNo, licenseEnd: d.licenseEnd }); setDriverDrawerOpen(true) }} className={btnSmallOrange}>Düzenle</button>
                        <button onClick={() => handleDeleteDriver(d.id)} className="px-3 py-1 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors">Sil</button>
                      </div>
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
            <StatCard label="Toplam Sevkiyat" value={stats ? String(stats.totalShipments) : String(shipments.length)} change={5} icon={Package} color="text-blue-600 bg-blue-50" />
            <StatCard label="Zamanında Teslimat" value={stats ? `%${stats.onTimeDeliveryRate}` : '—'} change={2} icon={CheckCircle2} color="text-green-600 bg-green-50" />
            <StatCard label="Ort. Teslimat Süresi" value={stats ? `${stats.avgDeliveryHours} saat` : '—'} change={-3} icon={Clock} color="text-purple-600 bg-purple-50" />
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
                  {shipments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-[14px] text-slate-400">Atanmış sevkiyat bulunamadı</td></tr>
                  ) : shipments.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className={`${tdClass} font-semibold text-slate-800`}>{s.number}</td>
                      <td className={tdClass}>{s.route}</td>
                      <td className={`${tdClass} text-center text-slate-600`}>{s.weight}</td>
                      <td className={`${tdClass} text-[12px] text-slate-500`}>
                        {s.driverName ? <span>{s.driverName} — {s.plate}</span> : <span className="text-amber-500">Atanmadı</span>}
                      </td>
                      <td className={`${tdClass} text-center`}><Badge variant={statusVariant[s.status] || 'default'}>{statusLabels[s.status] || s.status}</Badge></td>
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
            <button onClick={() => { setEditingUserId(null); setUserForm({ name: '', email: '', role: 'ProviderDriver' }); setUserDrawerOpen(true) }} className={btnPrimary}>
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
                {portalUsers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-[14px] text-slate-400">Kullanıcı bulunamadı</td></tr>
                ) : portalUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className={`${tdClass} font-semibold text-slate-800`}>{u.name}</td>
                    <td className={`${tdClass} text-[12px] text-slate-500`}>{u.email}</td>
                    <td className={`${tdClass} text-center`}><Badge variant="default">{roleLabels[u.role] || u.role}</Badge></td>
                    <td className={`${tdClass} text-center`}>
                      <Badge variant={u.active ? 'success' : 'error'}>{u.active ? 'Aktif' : 'Pasif'}</Badge>
                    </td>
                    <td className={`${tdClass} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditingUserId(u.id); setUserForm({ name: u.name, email: u.email, role: u.role }); setUserDrawerOpen(true) }} className={btnSmallOrange}>Düzenle</button>
                        <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors">Sil</button>
                      </div>
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
          <button onClick={handleSubmitBid} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            Teklif Gönder
          </button>
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
          <button onClick={handleSaveTariff} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            Kaydet
          </button>
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
      <Drawer isOpen={vehicleDrawerOpen} onClose={() => { setVehicleDrawerOpen(false); setEditingVehicleId(null) }} title={editingVehicleId ? 'Araç Düzenle' : 'Araç Ekle'} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => { setVehicleDrawerOpen(false); setEditingVehicleId(null) }} className={btnSecondary}>İptal</button>
          <button onClick={handleSaveVehicle} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            Kaydet
          </button>
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
      <Drawer isOpen={driverDrawerOpen} onClose={() => { setDriverDrawerOpen(false); setEditingDriverId(null) }} title={editingDriverId ? 'Şoför Düzenle' : 'Şoför Ekle'} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => { setDriverDrawerOpen(false); setEditingDriverId(null) }} className={btnSecondary}>İptal</button>
          <button onClick={handleSaveDriver} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            Kaydet
          </button>
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
          <button onClick={handleUpdateShipment} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            Güncelle
          </button>
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
      <Drawer isOpen={userDrawerOpen} onClose={() => { setUserDrawerOpen(false); setEditingUserId(null) }} title={editingUserId ? 'Kullanıcı Düzenle' : 'Kullanıcı Ekle'} footer={
        <div className="flex justify-end gap-3">
          <button onClick={() => { setUserDrawerOpen(false); setEditingUserId(null) }} className={btnSecondary}>İptal</button>
          <button onClick={handleSaveUser} disabled={saving} className={`${btnPrimary} disabled:opacity-50`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            Kaydet
          </button>
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
