import { Truck, Package, Clock, DollarSign, AlertTriangle, CheckCircle2, TrendingUp, Users } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

const monthlyData = [
  { month: 'Oca', shipments: 245, cost: 1520000 },
  { month: 'Sub', shipments: 312, cost: 1890000 },
  { month: 'Mar', shipments: 287, cost: 1680000 },
  { month: 'Nis', shipments: 356, cost: 2100000 },
  { month: 'May', shipments: 398, cost: 2340000 },
  { month: 'Haz', shipments: 421, cost: 2290000 },
]

const carrierCostData = [
  { name: 'Aras', value: 892000, color: '#f97316' },
  { name: 'Yurtici', value: 678000, color: '#3b82f6' },
  { name: 'MNG', value: 524000, color: '#10b981' },
  { name: 'PTT', value: 198000, color: '#8b5cf6' },
]

const carrierPerfData = [
  { name: 'Aras', onTime: 94.2, avg: 88 },
  { name: 'Yurtici', onTime: 91.5, avg: 88 },
  { name: 'MNG', onTime: 87.8, avg: 88 },
  { name: 'PTT', onTime: 82.3, avg: 88 },
]

const vehicleTypeData = [
  { name: 'Tir', value: 45, color: '#f97316' },
  { name: 'Kamyon', value: 28, color: '#3b82f6' },
  { name: 'Kamyonet', value: 15, color: '#10b981' },
  { name: 'Frigorifik', value: 12, color: '#06b6d4' },
]

const todayShipments = [
  { id: 's1', number: 'SHP-0412', provider: 'Aras Kargo', status: 'InTransit', route: 'Istanbul → Ankara', time: '08:00' },
  { id: 's2', number: 'SHP-0411', provider: 'MNG Kargo', status: 'Loading', route: 'Istanbul → Bursa', time: '09:30' },
  { id: 's3', number: 'SHP-0413', provider: 'Yurtici', status: 'Draft', route: 'Kocaeli → Istanbul', time: '10:00' },
  { id: 's4', number: 'SHP-0414', provider: 'Aras Kargo', status: 'Delivered', route: 'Ankara → Izmir', time: '11:15' },
]

const budgetData = [
  { month: 'Oca', budget: 1800000, actual: 1520000 },
  { month: 'Sub', budget: 1800000, actual: 1890000 },
  { month: 'Mar', budget: 2000000, actual: 1680000 },
  { month: 'Nis', budget: 2000000, actual: 2100000 },
  { month: 'May', budget: 2200000, actual: 2340000 },
  { month: 'Haz', budget: 2200000, actual: 2290000 },
]

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  Draft: 'default', Loading: 'info', InTransit: 'orange', Delivered: 'success',
}

function ExecutiveDashboard({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Maliyet Tasarrufu" value="342K TL" change={14} icon={DollarSign} color="text-green-600 bg-green-50" />
        <StatCard label={t.reports.totalShipments} value="2,019" change={8} icon={Package} color="text-blue-600 bg-blue-50" />
        <StatCard label="SLA Uyum" value="94.2%" change={1.5} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
        <StatCard label={t.reports.totalCost} value="12.3M TL" change={-3} icon={DollarSign} color="text-purple-600 bg-purple-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Aylik Sevkiyat Trendi</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="shipments" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Maliyet Dagilimi</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={carrierCostData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
              {carrierCostData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie><Tooltip formatter={(v) => `${(Number(v) / 1000).toFixed(0)}K TL`} /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function LogisticsManagerDashboard({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.shipments.activeShipments} value="24" change={3} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Bekleyen Onay" value="7" change={-2} icon={Clock} color="text-amber-600 bg-amber-50" />
        <StatCard label={t.shipments.avgCost} value="6,240 TL" change={-4} icon={DollarSign} color="text-green-600 bg-green-50" />
        <StatCard label={t.reports.onTimeDelivery} value="94.2%" change={1.5} icon={CheckCircle2} color="text-blue-600 bg-blue-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Performans Karsilastirma</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={carrierPerfData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} domain={[70, 100]} /><Tooltip /><Bar dataKey="onTime" name="Zamaninda %" fill="#f97316" radius={[4, 4, 0, 0]} /><Bar dataKey="avg" name="Ortalama" fill="#e2e8f0" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Arac Tipi Kullanim</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={vehicleTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
              {vehicleTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function OperationsDashboard(_props: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bugunun Sevkiyatlari" value="18" change={5} icon={Package} color="text-blue-600 bg-blue-50" />
        <StatCard label="Hesaplama Bekleyen" value="4" change={-1} icon={Clock} color="text-amber-600 bg-amber-50" />
        <StatCard label="Yoldaki Araclar" value="12" change={2} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Geciken Sevkiyat" value="2" change={1} icon={AlertTriangle} color="text-red-600 bg-red-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Bugunun Sevkiyatlari</h3>
          <div className="space-y-3">
            {todayShipments.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 w-12">{s.time}</span>
                  <div>
                    <span className="text-[13px] font-medium text-slate-800">{s.number}</span>
                    <span className="text-[12px] text-slate-400 ml-2">{s.provider}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-500">{s.route}</span>
                  <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Geciken Sevkiyatlar</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-[13px] font-semibold text-red-800">SHP-2024-0408</span></div>
              <p className="text-[12px] text-red-600">Ankara → Izmir — 4 saat gecikme. Aras Kargo bilgilendirildi.</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-[13px] font-semibold text-amber-800">SHP-2024-0405</span></div>
              <p className="text-[12px] text-amber-600">Istanbul → Trabzon — 1 saat gecikme riski. Takip ediliyor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FinanceDashboard(_props: { t: ReturnType<typeof useI18n>['t'] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aylik Maliyet" value="2.29M TL" change={-3} icon={DollarSign} color="text-blue-600 bg-blue-50" />
        <StatCard label="Bekleyen Fatura" value="12" change={4} icon={Clock} color="text-amber-600 bg-amber-50" />
        <StatCard label="Tasarruf (Bu Ay)" value="142K TL" change={18} icon={TrendingUp} color="text-green-600 bg-green-50" />
        <StatCard label="Butce Kullanimi" value="87%" change={-2} icon={DollarSign} color="text-purple-600 bg-purple-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Butce vs Gerceklesen</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={budgetData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} /><Tooltip formatter={(v) => `${(Number(v) / 1000).toFixed(0)}K TL`} /><Bar dataKey="budget" name="Butce" fill="#e2e8f0" radius={[4, 4, 0, 0]} /><Bar dataKey="actual" name="Gerceklesen" fill="#f97316" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasarruf Trendi</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={[{ month: 'Oca', savings: 280 }, { month: 'Sub', savings: -90 }, { month: 'Mar', savings: 320 }, { month: 'Nis', savings: -100 }, { month: 'May', savings: -140 }, { month: 'Haz', savings: -90 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}K`} /><Tooltip formatter={(v) => `${v}K TL`} /><Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useI18n()
  const { user } = useAuth()

  const role = user?.role || 'OperationsSpecialist'

  const roleLabels: Record<string, string> = {
    Admin: 'Yonetici',
    Executive: 'Ust Yonetim',
    LogisticsManager: 'Lojistik Muduru',
    OperationsSpecialist: 'Operasyon Uzmani',
    Finance: 'Finans',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.dashboard.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <Badge variant="orange">{roleLabels[role] || role}</Badge>
        </div>
      </div>

      {(role === 'Executive' || role === 'Admin') && <ExecutiveDashboard t={t} />}
      {role === 'LogisticsManager' && <LogisticsManagerDashboard t={t} />}
      {role === 'OperationsSpecialist' && <OperationsDashboard t={t} />}
      {role === 'Finance' && <FinanceDashboard t={t} />}
      {!['Executive', 'Admin', 'LogisticsManager', 'OperationsSpecialist', 'Finance'].includes(role) && <OperationsDashboard t={t} />}
    </div>
  )
}
