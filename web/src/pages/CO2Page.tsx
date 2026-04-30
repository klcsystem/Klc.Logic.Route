import { Leaf, TrendingDown } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'

const monthlyData = [
  { month: 'Oca', emissions: 12.4 },
  { month: 'Sub', emissions: 14.2 },
  { month: 'Mar', emissions: 11.8 },
  { month: 'Nis', emissions: 13.5 },
  { month: 'May', emissions: 10.9 },
  { month: 'Haz', emissions: 9.8 },
]

const vehicleData = [
  { name: 'Tir', value: 42.5, color: '#f97316' },
  { name: 'Kamyon', value: 18.2, color: '#3b82f6' },
  { name: 'Kamyonet', value: 8.7, color: '#10b981' },
  { name: 'Frigorifik', value: 7.8, color: '#06b6d4' },
]

const carrierEmissionData = [
  { name: 'Yolda', emissions: 28.4 },
  { name: 'Ekol', emissions: 21.5 },
  { name: 'Tırport', emissions: 18.2 },
  { name: 'Mars', emissions: 9.1 },
]

const routeData = [
  { route: 'Istanbul → Ankara', emissions: 28.4, shipments: 145 },
  { route: 'Istanbul → Bursa', emissions: 12.1, shipments: 98 },
  { route: 'Istanbul → Izmir', emissions: 15.8, shipments: 76 },
  { route: 'Ankara → Izmir', emissions: 8.9, shipments: 42 },
]

export default function CO2Page() {
  const { t } = useI18n()

  const kpis = [
    { label: t.co2.totalEmissions, value: '77.2 ton', change: -12, icon: Leaf, color: 'text-green-600 bg-green-50' },
    { label: t.co2.perShipment, value: '38.4 kg', change: -8, icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
    { label: t.co2.savedVsTarget, value: '14.3%', change: 5, icon: TrendingDown, color: 'text-teal-600 bg-teal-50' },
    { label: t.co2.greenScore, value: '78/100', change: 3, icon: Leaf, color: 'text-lime-600 bg-lime-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.co2.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.co2.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Motivation Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-green-500/10">
        <div className="flex items-center gap-3 mb-2"><Leaf className="w-6 h-6" /><span className="text-[16px] font-bold">Bu ay 11.2 ton CO2 tasarrufu!</span></div>
        <p className="text-[13px] text-white/80">Gecen aya kiyasla %14.3 daha az emisyon urettiniz. Rota optimizasyonu ve arac secimi sayesinde karbon ayak iziniz azaliyor.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend — Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.co2.monthlyTrend}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(v) => `${v} ton`} /><Line type="monotone" dataKey="emissions" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} /></LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Type — Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.co2.byVehicleType}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={vehicleData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name} ${value}t`}>
              {vehicleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie><Tooltip formatter={(v) => `${v} ton`} /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Carrier Emissions — Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Bazli Emisyon</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={carrierEmissionData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} /><Tooltip formatter={(v) => `${v} ton`} /><Bar dataKey="emissions" fill="#10b981" radius={[0, 4, 4, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>

        {/* Route Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">{t.co2.byRoute}</h3></div>
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">{t.shipments.route}</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Emisyon</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Sevkiyat</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Basina</th>
            </tr></thead>
            <tbody>
              {routeData.map((d) => (
                <tr key={d.route} className="border-b border-slate-50">
                  <td className="px-6 py-3 text-[13px] font-medium text-slate-800">{d.route}</td>
                  <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.emissions} ton</td>
                  <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.shipments}</td>
                  <td className="px-6 py-3 text-right text-[13px] text-slate-600">{((d.emissions / d.shipments) * 1000).toFixed(1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
