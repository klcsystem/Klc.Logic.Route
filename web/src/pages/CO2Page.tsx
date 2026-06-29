import { Leaf, TrendingDown, Loader2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import { useApi } from '../utils/useApi'
import { sustainabilityApi, type CarbonReport, type EsgReport, type SavingsSummary } from '../api/sustainability'

const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899']

export default function CO2Page() {
  const { t } = useI18n()

  const { data: carbonReport, isLoading: carbonLoading } = useApi(() => sustainabilityApi.getCarbonReport('monthly'))
  const { data: esgReport } = useApi(() => sustainabilityApi.getEsgReport())
  const { data: savingsSummary } = useApi(() => sustainabilityApi.getSavingsSummary())

  const report: CarbonReport | null = carbonReport
  const esg: EsgReport | null = esgReport
  const savings: SavingsSummary | null = savingsSummary

  const monthNames = ['', 'Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']

  // Monthly trend from ESG report breakdown
  const monthlyTrendData = (esg?.monthlyBreakdown || []).map(m => ({
    month: monthNames[m.month] || `${m.month}`,
    emissions: Number((m.emissionsKg / 1000).toFixed(1)),
    savings: Number((m.savingsKg / 1000).toFixed(1)),
  }))

  // Vehicle type breakdown from carbon report
  const vehicleData = (report?.byVehicleType || []).map((v, i) => ({
    name: v.vehicleType,
    value: Number(v.totalEmissionsKg.toFixed(1)),
    saved: Number(v.emissionsSavedKg.toFixed(1)),
    distance: Number(v.totalDistanceKm.toFixed(0)),
    routes: v.routeCount,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const totalEmissionsKg = report?.totalEmissionsKg || 0
  const totalEmissionsTon = totalEmissionsKg / 1000
  const emissionsSavedKg = report?.emissionsSavedKg || 0
  const savingsPercent = esg?.savingsPercent || 0
  const esgRating = esg?.rating || '-'
  const esgScore = esg?.fleetEfficiencyScore || 0
  const carbonCreditValue = report?.carbonCreditValueEur || 0
  const carbonCreditTons = report?.carbonCreditTons || 0

  const kpis = [
    { label: t.co2.totalEmissions, value: `${totalEmissionsTon.toFixed(1)} ton`, change: 0, icon: Leaf, color: 'text-green-600 bg-green-50' },
    { label: t.co2.perShipment, value: report?.totalRoutes ? `${(totalEmissionsKg / report.totalRoutes).toFixed(1)} kg` : '0 kg', change: 0, icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
    { label: t.co2.savedVsTarget, value: `${savingsPercent.toFixed(1)}%`, change: savingsPercent > 0 ? savingsPercent : 0, icon: TrendingDown, color: 'text-teal-600 bg-teal-50' },
    { label: t.co2.greenScore, value: esgRating !== '-' ? `${esgScore.toFixed(0)}/100 (${esgRating})` : '0/100', change: 0, icon: Leaf, color: 'text-lime-600 bg-lime-50' },
  ]

  if (carbonLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.co2.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.co2.subtitle}</p>
        </div>
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.co2.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.co2.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Savings Motivation Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-green-500/10">
        <div className="flex items-center gap-3 mb-2"><Leaf className="w-6 h-6" /><span className="text-[16px] font-bold">{(emissionsSavedKg / 1000).toFixed(1)} ton CO2 tasarrufu!</span></div>
        <p className="text-[13px] text-white/80">
          {savings ? `${savings.distanceSavedKm.toFixed(0)} km mesafe tasarrufu, ${savings.fuelSavedLiters.toFixed(0)} litre yakit tasarrufu, ${savings.costSavedTry.toFixed(0)} TL maliyet tasarrufu.` : 'Rota optimizasyonu sayesinde karbon ayak iziniz azaliyor.'}
          {savings ? ` Toplam ${savings.optimizedRouteCount} rota optimize edildi.` : ''}
        </p>
      </div>

      {/* Carbon Credit & ESG Score */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Karbon Kredi Degeri</h3>
          <div className="text-center py-4">
            <p className="text-[36px] font-extrabold text-green-600">{carbonCreditTons.toFixed(2)}</p>
            <p className="text-[13px] text-slate-500 mt-1">ton karbon kredisi</p>
            <div className="mt-4 p-3 bg-green-50 rounded-xl">
              <p className="text-[20px] font-bold text-green-700">{carbonCreditValue.toFixed(0)} EUR</p>
              <p className="text-[11px] text-green-500">Tahmini piyasa degeri ({report?.marketPricePerTon || 65} EUR/ton)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">ESG Puani</h3>
          <div className="text-center py-4">
            {/* Gauge visualization */}
            <div className="relative w-32 h-16 mx-auto overflow-hidden mb-4">
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full border-8 border-slate-100" />
              <div
                className="absolute bottom-0 left-0 w-32 h-32 rounded-full border-8 border-transparent"
                style={{
                  borderBottomColor: esgScore >= 70 ? '#10b981' : esgScore >= 40 ? '#f59e0b' : '#ef4444',
                  borderLeftColor: esgScore >= 50 ? (esgScore >= 70 ? '#10b981' : '#f59e0b') : 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: 'transparent',
                  transform: `rotate(${Math.min(esgScore / 100, 1) * 180}deg)`,
                }}
              />
            </div>
            <p className="text-[36px] font-extrabold" style={{ color: esgScore >= 70 ? '#10b981' : esgScore >= 40 ? '#f59e0b' : '#ef4444' }}>
              {esgScore.toFixed(0)}
            </p>
            <p className="text-[13px] text-slate-500">/100 puan</p>
            {esgRating !== '-' && (
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[13px] font-bold ${
                esgRating === 'A' ? 'bg-green-100 text-green-700' :
                esgRating === 'B' ? 'bg-emerald-100 text-emerald-700' :
                esgRating === 'C' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                Derece: {esgRating}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Mesafe Ozeti</h3>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-[12px] text-slate-500 mb-1">Optimize Edilmemis Mesafe</p>
              <p className="text-[20px] font-bold text-slate-800">{(report?.totalNaiveDistanceKm || 0).toFixed(0)} km</p>
            </div>
            <div>
              <p className="text-[12px] text-slate-500 mb-1">Optimize Edilmis Mesafe</p>
              <p className="text-[20px] font-bold text-green-600">{(report?.totalOptimizedDistanceKm || 0).toFixed(0)} km</p>
            </div>
            <div>
              <p className="text-[12px] text-slate-500 mb-1">Tasarruf Edilen Mesafe</p>
              <p className="text-[20px] font-bold text-emerald-600">{(report?.distanceSavedKm || 0).toFixed(0)} km</p>
            </div>
            <div className="text-[12px] text-slate-400">Toplam {report?.totalRoutes || 0} rota</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend — Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.co2.monthlyTrend} (ton)</h3>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${v} ton`} />
                <Line type="monotone" dataKey="emissions" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} name="Emisyon" />
                <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Tasarruf" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-[13px] text-slate-400">Aylik trend verisi yok</div>
          )}
        </div>

        {/* Vehicle Type — Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.co2.byVehicleType}</h3>
          {vehicleData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={vehicleData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name} ${(value / 1000).toFixed(1)}t`}>
                    {vehicleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${Number(v).toFixed(1)} kg`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-[13px] text-slate-400">Arac tipi verisi yok</div>
          )}
        </div>
      </div>

      {/* Vehicle type detail table */}
      {vehicleData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">Arac Tipi Detay</h3></div>
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Arac Tipi</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Emisyon (kg)</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Tasarruf (kg)</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Mesafe (km)</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Rota Sayisi</th>
            </tr></thead>
            <tbody>
              {vehicleData.map((d) => (
                <tr key={d.name} className="border-b border-slate-50">
                  <td className="px-6 py-3 text-[13px] font-medium text-slate-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </td>
                  <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.value.toFixed(1)}</td>
                  <td className="px-6 py-3 text-right text-[13px] text-green-600">{d.saved.toFixed(1)}</td>
                  <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.distance}</td>
                  <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.routes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
