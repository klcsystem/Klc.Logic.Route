import { Truck, Package, Clock, DollarSign, AlertTriangle, CheckCircle2, TrendingUp, Users, MapPin, BarChart3, Leaf, FileText } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from 'recharts'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

// --- Mock Data ---
const monthlyShipments = [
  { month: 'Oca', sevkiyat: 245, onceki: 198 },
  { month: 'Şub', sevkiyat: 312, onceki: 267 },
  { month: 'Mar', sevkiyat: 287, onceki: 245 },
  { month: 'Nis', sevkiyat: 356, onceki: 301 },
  { month: 'May', sevkiyat: 398, onceki: 340 },
  { month: 'Haz', sevkiyat: 421, onceki: 365 },
]

const monthlyCost = [
  { month: 'Oca', maliyet: 1520, tasarruf: 280 },
  { month: 'Şub', maliyet: 1890, tasarruf: 195 },
  { month: 'Mar', maliyet: 1680, tasarruf: 320 },
  { month: 'Nis', maliyet: 2100, tasarruf: 410 },
  { month: 'May', maliyet: 2340, tasarruf: 385 },
  { month: 'Haz', maliyet: 2290, tasarruf: 342 },
]

const carrierCostData = [
  { name: 'Yolda Lojistik', value: 892000, color: '#f97316' },
  { name: 'Murat Lojistik', value: 678000, color: '#3b82f6' },
  { name: 'Tırport', value: 524000, color: '#10b981' },
  { name: 'Diğer', value: 198000, color: '#8b5cf6' },
]

const carrierPerfData = [
  { name: 'Yolda', zamaninda: 96.2, hasar: 0.3, ortalamaSure: 18 },
  { name: 'Murat', zamaninda: 93.5, hasar: 0.8, ortalamaSure: 22 },
  { name: 'Tırport', zamaninda: 89.8, hasar: 1.2, ortalamaSure: 24 },
  { name: 'Diğer', zamaninda: 85.3, hasar: 2.1, ortalamaSure: 28 },
]

const vehicleTypeData = [
  { name: 'Tır', value: 45, color: '#f97316' },
  { name: 'Kamyon', value: 28, color: '#3b82f6' },
  { name: 'Kamyonet', value: 15, color: '#10b981' },
  { name: 'Frigorifik', value: 8, color: '#06b6d4' },
  { name: 'Tanker', value: 4, color: '#8b5cf6' },
]

const regionData = [
  { bolge: 'Marmara → İç Anadolu', sevkiyat: 142, maliyet: '₺845K', oran: 28 },
  { bolge: 'Marmara → Ege', sevkiyat: 98, maliyet: '₺523K', oran: 19 },
  { bolge: 'İç Anadolu → Akdeniz', sevkiyat: 76, maliyet: '₺412K', oran: 15 },
  { bolge: 'Marmara → Karadeniz', sevkiyat: 64, maliyet: '₺378K', oran: 12 },
  { bolge: 'Ege → Akdeniz', sevkiyat: 52, maliyet: '₺287K', oran: 10 },
]

const todayShipments = [
  { id: 's1', number: 'SHP-0412', provider: 'Yolda Lojistik', status: 'InTransit', route: 'İstanbul → Ankara', time: '08:00', weight: '18.5 ton', vehicle: 'Tır', eta: '14:30' },
  { id: 's2', number: 'SHP-0411', provider: 'Murat Lojistik', status: 'Loading', route: 'İstanbul → Bursa', time: '09:30', weight: '6.2 ton', vehicle: 'Kamyon', eta: '13:00' },
  { id: 's3', number: 'SHP-0413', provider: 'Tırport', status: 'PendingApproval', route: 'Kocaeli → İzmir', time: '10:00', weight: '22.0 ton', vehicle: 'Tır', eta: '20:00' },
  { id: 's4', number: 'SHP-0414', provider: 'Yolda Lojistik', status: 'Delivered', route: 'Ankara → İzmir', time: '11:15', weight: '12.8 ton', vehicle: 'Kamyon', eta: '-' },
  { id: 's5', number: 'SHP-0415', provider: 'Murat Lojistik', status: 'InTransit', route: 'Bursa → Konya', time: '07:45', weight: '8.4 ton', vehicle: 'Kamyon', eta: '15:00' },
]

const recentActivities = [
  { time: '12:45', text: 'SHP-0412 — Ankara\'ya ulaştı, yükleme noktasında', type: 'info' },
  { time: '12:30', text: 'SHP-0414 — Teslim edildi (zamanında)', type: 'success' },
  { time: '12:15', text: 'SHP-0408 — 2 saat gecikme tahmini!', type: 'warning' },
  { time: '11:50', text: 'Yeni sipariş: ORD-2026-0523 (ERP Senkron)', type: 'info' },
  { time: '11:30', text: 'SHP-0413 — Onay bekliyor (₺14,200)', type: 'info' },
  { time: '11:00', text: 'Yolda Lojistik anlaşması 15 gün içinde sona eriyor', type: 'warning' },
]

const budgetData = [
  { month: 'Oca', butce: 1800, gerceklesen: 1520 },
  { month: 'Şub', butce: 1800, gerceklesen: 1890 },
  { month: 'Mar', butce: 2000, gerceklesen: 1680 },
  { month: 'Nis', butce: 2000, gerceklesen: 2100 },
  { month: 'May', butce: 2200, gerceklesen: 2340 },
  { month: 'Haz', butce: 2200, gerceklesen: 2290 },
]

const invoiceData = [
  { provider: 'Yolda Lojistik', fatura: 12, bekleyen: 3, tutar: '₺892K', durum: 'warning' },
  { provider: 'Murat Lojistik', fatura: 8, bekleyen: 1, tutar: '₺678K', durum: 'success' },
  { provider: 'Tırport', fatura: 6, bekleyen: 2, tutar: '₺524K', durum: 'warning' },
]

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  Draft: 'default', Loading: 'info', PendingApproval: 'warning', InTransit: 'orange', Delivered: 'success',
}
const statusLabels: Record<string, string> = {
  Draft: 'Taslak', Loading: 'Yükleniyor', PendingApproval: 'Onay Bekliyor', InTransit: 'Yolda', Delivered: 'Teslim Edildi',
}

const activityColors: Record<string, string> = { info: 'bg-blue-400', success: 'bg-green-400', warning: 'bg-orange-400', error: 'bg-red-400' }

// --- Dashboard Components ---

function ExecutiveDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Tasarruf" value="₺1.93M" change={14} icon={TrendingUp} color="text-green-600 bg-green-50" />
        <StatCard label="Toplam Sevkiyat" value="2,019" change={8} icon={Package} color="text-blue-600 bg-blue-50" />
        <StatCard label="SLA Uyum Oranı" value="%94.2" change={1.5} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
        <StatCard label="Toplam Maliyet" value="₺12.3M" change={-3} icon={DollarSign} color="text-purple-600 bg-purple-50" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sevkiyat Trendi */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-slate-800">Aylık Sevkiyat Trendi</h3>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-500 rounded" /> Bu Yıl</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-300 rounded" /> Geçen Yıl</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyShipments}>
              <defs>
                <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Area type="monotone" dataKey="sevkiyat" stroke="#f97316" strokeWidth={2.5} fill="url(#colorShipments)" name="Bu Yıl" />
              <Line type="monotone" dataKey="onceki" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Geçen Yıl" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Taşıyıcı Maliyet Dağılımı */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Taşıyıcı Maliyet Dağılımı</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={carrierCostData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {carrierCostData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}K`} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {carrierCostData.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[12px] text-slate-600">{c.name}</span>
                </div>
                <span className="text-[12px] font-semibold text-slate-700">₺{(c.value / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Maliyet & Tasarruf */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Maliyet & Tasarruf (Bin TL)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyCost}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} formatter={(v) => `₺${v}K`} />
              <Bar dataKey="maliyet" name="Maliyet" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasarruf" name="Tasarruf" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Taşıyıcı Performans */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Taşıyıcı Performans</h3>
          <div className="space-y-4">
            {carrierPerfData.map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-700">{c.name}</span>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className="text-slate-500">Ort: {c.ortalamaSure}s</span>
                    <span className={`font-semibold ${c.zamaninda >= 95 ? 'text-green-600' : c.zamaninda >= 90 ? 'text-orange-500' : 'text-red-500'}`}>
                      %{c.zamaninda}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${c.zamaninda >= 95 ? 'bg-green-500' : c.zamaninda >= 90 ? 'bg-orange-400' : 'bg-red-400'}`}
                    style={{ width: `${c.zamaninda}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* En Yoğun Güzergahlar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">En Yoğun Güzergahlar</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Güzergah</th>
                  <th className="text-center px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Sevkiyat</th>
                  <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Maliyet</th>
                  <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Oran</th>
                </tr>
              </thead>
              <tbody>
                {regionData.map((r) => (
                  <tr key={r.bolge} className="border-b border-slate-50">
                    <td className="px-4 py-2.5 text-[13px] font-medium text-slate-700">{r.bolge}</td>
                    <td className="px-4 py-2.5 text-center text-[13px] text-slate-600">{r.sevkiyat}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-slate-800">{r.maliyet}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${r.oran * 3.3}%` }} />
                        </div>
                        <span className="text-[12px] text-slate-500 w-8">%{r.oran}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hızlı İstatistikler */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-orange-100" />
              <span className="text-[13px] font-medium text-orange-100">CO₂ Tasarrufu</span>
            </div>
            <p className="text-[28px] font-extrabold">42.8 ton</p>
            <p className="text-[12px] text-orange-200 mt-1">Bu ay, geçen aya göre %12 azalma</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h4 className="text-[13px] font-semibold text-slate-800 mb-3">Araç Tipi Dağılımı</h4>
            <div className="space-y-2.5">
              {vehicleTypeData.map((v) => (
                <div key={v.name} className="flex items-center gap-3">
                  <span className="text-[12px] text-slate-600 w-20">{v.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${v.value}%`, backgroundColor: v.color }} />
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700 w-8">%{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed + Today Shipments */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Bugünün Sevkiyatları</h3>
          <div className="space-y-2">
            {todayShipments.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] text-slate-400 w-12 flex-shrink-0">{s.time}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-slate-800">{s.number}</span>
                      <span className="text-[11px] text-slate-400">{s.provider}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3" /> {s.route}
                      <span className="text-slate-300">|</span>
                      <Truck className="w-3 h-3" /> {s.vehicle} — {s.weight}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.eta !== '-' && <span className="text-[11px] text-orange-500 font-medium">ETA {s.eta}</span>}
                  <Badge variant={statusVariant[s.status]}>{statusLabels[s.status]}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Son Aktiviteler</h3>
          <div className="space-y-3">
            {recentActivities.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${activityColors[a.type]}`} />
                  {i < recentActivities.length - 1 && <div className="w-px h-8 bg-slate-200 mt-1" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-slate-700 leading-snug">{a.text}</p>
                  <span className="text-[11px] text-slate-400">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OperationsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bugünün Sevkiyatları" value="18" change={5} icon={Package} color="text-blue-600 bg-blue-50" />
        <StatCard label="Onay Bekleyen" value="4" change={-1} icon={Clock} color="text-amber-600 bg-amber-50" />
        <StatCard label="Yoldaki Araçlar" value="12" change={2} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Geciken Sevkiyat" value="2" change={1} icon={AlertTriangle} color="text-red-600 bg-red-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Bugünün Sevkiyatları</h3>
          <div className="space-y-2">
            {todayShipments.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 w-12">{s.time}</span>
                  <div>
                    <span className="text-[13px] font-medium text-slate-800">{s.number}</span>
                    <span className="text-[11px] text-slate-400 ml-2">{s.provider}</span>
                    <p className="text-[11px] text-slate-400">{s.route} — {s.weight}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[s.status]}>{statusLabels[s.status]}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Geciken Sevkiyatlar</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-[13px] font-semibold text-red-800">SHP-2026-0408</span></div>
                <p className="text-[12px] text-red-600">Ankara → İzmir — 4 saat gecikme. Yolda Lojistik bilgilendirildi.</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-[13px] font-semibold text-amber-800">SHP-2026-0405</span></div>
                <p className="text-[12px] text-amber-600">İstanbul → Trabzon — 1 saat gecikme riski. Takip ediliyor.</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-3">Son Aktiviteler</h3>
            <div className="space-y-2.5">
              {recentActivities.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${activityColors[a.type]}`} />
                  <div>
                    <p className="text-[12px] text-slate-600">{a.text}</p>
                    <span className="text-[10px] text-slate-400">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FinanceDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aylık Maliyet" value="₺2.29M" change={-3} icon={DollarSign} color="text-blue-600 bg-blue-50" />
        <StatCard label="Bekleyen Fatura" value="6" change={-2} icon={FileText} color="text-amber-600 bg-amber-50" />
        <StatCard label="Bu Ay Tasarruf" value="₺342K" change={18} icon={TrendingUp} color="text-green-600 bg-green-50" />
        <StatCard label="Bütçe Kullanımı" value="%87" change={-2} icon={BarChart3} color="text-purple-600 bg-purple-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Bütçe vs Gerçekleşen (Bin TL)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} formatter={(v) => `₺${v}K`} />
              <Bar dataKey="butce" name="Bütçe" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gerceklesen" name="Gerçekleşen" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Taşıyıcı Fatura Durumu</h3>
          <div className="space-y-4">
            {invoiceData.map((inv) => (
              <div key={inv.provider} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{inv.provider}</p>
                  <p className="text-[11px] text-slate-400">{inv.fatura} fatura — {inv.bekleyen} bekleyen</p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-bold text-slate-800">{inv.tutar}</p>
                  <Badge variant={inv.durum as 'warning' | 'success'}>{inv.bekleyen > 0 ? 'Bekleyen var' : 'Tamamlandı'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LogisticsManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aktif Sevkiyat" value="24" change={3} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Bekleyen Onay" value="7" change={-2} icon={Clock} color="text-amber-600 bg-amber-50" />
        <StatCard label="Ort. Maliyet/Sevkiyat" value="₺6,240" change={-4} icon={DollarSign} color="text-green-600 bg-green-50" />
        <StatCard label="Zamanında Teslimat" value="%94.2" change={1.5} icon={CheckCircle2} color="text-blue-600 bg-blue-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Taşıyıcı Performans Karşılaştırma</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={carrierPerfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[70, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Bar dataKey="zamaninda" name="Zamanında %" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Araç Tipi Kullanım</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={vehicleTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {vehicleTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {vehicleTypeData.map((v) => (
              <span key={v.name} className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} /> {v.name} %{v.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main Dashboard ---

export default function DashboardPage() {
  useI18n()
  const { user } = useAuth()
  const role = user?.role || 'Admin'

  const roleLabels: Record<string, string> = {
    Admin: 'Yönetici', Executive: 'Üst Yönetim', LogisticsManager: 'Lojistik Müdürü',
    OperationsSpecialist: 'Operasyon Uzmanı', Finance: 'Finans',
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Günaydın'
    if (hour < 18) return 'İyi günler'
    return 'İyi akşamlar'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            {greeting()}, {user?.firstName || 'Kullanıcı'} 👋
          </h1>
          <p className="text-[14px] text-slate-400 mt-1">İşte lojistik operasyonlarınızın güncel özeti.</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <Badge variant="orange">{roleLabels[role] || role}</Badge>
        </div>
      </div>

      {(role === 'Executive' || role === 'Admin') && <ExecutiveDashboard />}
      {role === 'LogisticsManager' && <LogisticsManagerDashboard />}
      {role === 'OperationsSpecialist' && <OperationsDashboard />}
      {role === 'Finance' && <FinanceDashboard />}
      {!['Executive', 'Admin', 'LogisticsManager', 'OperationsSpecialist', 'Finance'].includes(role) && <ExecutiveDashboard />}
    </div>
  )
}
