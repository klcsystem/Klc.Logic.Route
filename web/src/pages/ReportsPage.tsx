import { useState } from 'react'
import { BarChart3, Download, Calendar } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'

const tabs = ['shipmentReport', 'costReport', 'performanceReport'] as const

const costTrendData = [
  { month: 'Oca', cost: 1520 },
  { month: 'Sub', cost: 1890 },
  { month: 'Mar', cost: 1680 },
  { month: 'Nis', cost: 2100 },
  { month: 'May', cost: 2340 },
  { month: 'Haz', cost: 2290 },
]

const carrierCostData = [
  { carrier: 'Aras Kargo', shipments: 145, totalCost: 892000, avgCost: 6152 },
  { carrier: 'MNG Kargo', shipments: 98, totalCost: 524000, avgCost: 5347 },
  { carrier: 'Yurtici Kargo', shipments: 112, totalCost: 678000, avgCost: 6054 },
  { carrier: 'PTT Kargo', shipments: 45, totalCost: 198000, avgCost: 4400 },
]

const carrierPerfData = [
  { name: 'Aras', onTime: 94.2, avgDays: 1.2, damage: 0.8 },
  { name: 'Yurtici', onTime: 91.5, avgDays: 1.4, damage: 1.2 },
  { name: 'MNG', onTime: 87.8, avgDays: 1.8, damage: 2.1 },
  { name: 'PTT', onTime: 82.3, avgDays: 2.4, damage: 3.5 },
]

const deliveryTimeData = [
  { region: 'Marmara → Ic Anadolu', target: 1.5, actual: 1.3, shipments: 145 },
  { region: 'Marmara → Ege', target: 1.0, actual: 0.9, shipments: 98 },
  { region: 'Marmara → Karadeniz', target: 2.0, actual: 2.3, shipments: 56 },
  { region: 'Ic Anadolu → Ege', target: 1.5, actual: 1.6, shipments: 42 },
  { region: 'Marmara → Akdeniz', target: 2.0, actual: 1.8, shipments: 78 },
]

export default function ReportsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('shipmentReport')
  const [period, setPeriod] = useState('lastMonth')

  const kpis = [
    { label: t.reports.totalShipments, value: '2,019', change: 8, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
    { label: t.reports.onTimeDelivery, value: '94.2%', change: 1.5, icon: BarChart3, color: 'text-green-600 bg-green-50' },
    { label: t.reports.avgTransitTime, value: '1.4 gun', change: -8, icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
    { label: t.reports.totalCost, value: '2.29M TL', change: 5, icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
  ]

  const periodLabels: Record<string, string> = { lastWeek: t.reports.lastWeek, lastMonth: t.reports.lastMonth, last3Months: t.reports.last3Months, lastYear: t.reports.lastYear }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.reports.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.reports.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 appearance-none">
              {Object.entries(periodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"><Download className="w-4 h-4" /> {t.reports.exportPdf}</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"><Download className="w-4 h-4" /> {t.reports.exportExcel}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {(t.reports as Record<string, string>)[tab]}
          </button>
        ))}
      </div>

      {/* Cost Report with Chart */}
      {activeTab === 'shipmentReport' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Aylik Maliyet Trendi</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={costTrendData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}K`} /><Tooltip formatter={(v) => `${v}K TL`} /><Line type="monotone" dataKey="cost" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} /></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">Tasiyici Bazli Maliyet</h3></div>
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">{t.shipments.carrier}</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Sevkiyat</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Toplam</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ortalama</th>
              </tr></thead>
              <tbody>
                {carrierCostData.map((d) => (
                  <tr key={d.carrier} className="border-b border-slate-50">
                    <td className="px-6 py-3 text-[13px] font-medium text-slate-800">{d.carrier}</td>
                    <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.shipments}</td>
                    <td className="px-6 py-3 text-right text-[13px] font-medium text-slate-800">{(d.totalCost / 1000).toFixed(0)}K TL</td>
                    <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.avgCost.toLocaleString()} TL</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Carrier Performance with Chart */}
      {activeTab === 'costReport' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Zamaninda Teslim Orani</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={carrierPerfData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} domain={[70, 100]} /><Tooltip /><Bar dataKey="onTime" name="Zamaninda %" fill="#f97316" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">Tasiyici Performans Tablosu</h3></div>
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Tasiyici</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Zamaninda %</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ort. Sure (gun)</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Hasar %</th>
              </tr></thead>
              <tbody>
                {carrierPerfData.map((d) => (
                  <tr key={d.name} className="border-b border-slate-50">
                    <td className="px-6 py-3 text-[13px] font-medium text-slate-800">{d.name}</td>
                    <td className="px-6 py-3 text-right text-[13px]"><span className={d.onTime >= 90 ? 'text-green-600' : 'text-amber-600'}>{d.onTime}%</span></td>
                    <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.avgDays}</td>
                    <td className="px-6 py-3 text-right text-[13px]"><span className={d.damage <= 1 ? 'text-green-600' : 'text-red-600'}>{d.damage}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Times */}
      {activeTab === 'performanceReport' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">Bolge Bazli Teslimat Sureleri</h3></div>
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Guzergah</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Hedef (gun)</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Gerceklesen</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Fark</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Sevkiyat</th>
            </tr></thead>
            <tbody>
              {deliveryTimeData.map((d) => {
                const diff = d.actual - d.target
                return (
                  <tr key={d.region} className="border-b border-slate-50">
                    <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{d.region}</td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{d.target}</td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{d.actual}</td>
                    <td className="px-6 py-3.5 text-right text-[13px]"><span className={diff <= 0 ? 'text-green-600' : 'text-red-600'}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span></td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{d.shipments}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
