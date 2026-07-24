import { Leaf, Loader2, TrendingDown, Fuel, Wallet, Route } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import api from '../api/client'
import { useApi } from '../utils/useApi'

// Gercek backend sekilleri (/sustainability/*)
interface CarbonReport {
  totalEmissionsKg: number
  totalOptimizedDistanceKm: number
  emissionsSavedKg: number
  carbonCreditTons: number
  carbonCreditValueEur: number
  byVehicleType: { vehicleType: string; totalEmissionsKg: number; totalDistanceKm: number; routeCount: number }[]
  totalRoutes: number
}
interface SavingsSummary {
  totalCO2SavedKg: number
  totalCO2SavedTons: number
  carbonCreditValueEur: number
  distanceSavedKm: number
  fuelSavedLiters: number
  costSavedTry: number
  optimizedRouteCount: number
}
interface EsgReport {
  fleetEfficiencyScore: number
  savingsPercent: number
  carbonCreditTons: number
  monthlyBreakdown: { month: number; emissionsKg: number; savingsKg: number; routeCount: number }[]
}

const sustainabilityApi = {
  getCarbonReport: () => api.get('/sustainability/carbon-report').then(r => r.data),
  getSavingsSummary: () => api.get('/sustainability/savings-summary').then(r => r.data),
  getEsgReport: () => api.get('/sustainability/esg-report').then(r => r.data),
}

const monthNames = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const num0 = (n: number) => Math.round(n).toLocaleString('tr-TR')

export default function SustainabilityPage() {
  const { data: carbonData, isLoading: carbonLoading } = useApi<CarbonReport>(() => sustainabilityApi.getCarbonReport(), [])
  const { data: savingsData, isLoading: savingsLoading } = useApi<SavingsSummary>(() => sustainabilityApi.getSavingsSummary(), [])
  const { data: esgData, isLoading: esgLoading } = useApi<EsgReport>(() => sustainabilityApi.getEsgReport(), [])

  const isLoading = carbonLoading || savingsLoading || esgLoading

  const emissionsPerKm = carbonData && carbonData.totalOptimizedDistanceKm
    ? carbonData.totalEmissionsKg / carbonData.totalOptimizedDistanceKm
    : 0

  const kpis = [
    { label: 'Toplam Emisyon', value: carbonData ? `${num0(carbonData.totalEmissionsKg)} kg` : '—', icon: Leaf, color: 'text-red-600 bg-red-50' },
    { label: 'CO₂ Tasarrufu', value: savingsData ? `${(savingsData.totalCO2SavedTons ?? 0).toFixed(1)} ton` : '—', icon: Leaf, color: 'text-green-600 bg-green-50' },
    { label: 'ESG Skoru', value: esgData ? `${(esgData.fleetEfficiencyScore ?? 0).toFixed(1)}/100` : '—', icon: Leaf, color: 'text-blue-600 bg-blue-50' },
    { label: 'Karbon Kredi Değeri', value: savingsData ? `€${num0(savingsData.carbonCreditValueEur)}` : '—', icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
  ]

  // Ikincil tasarruf metrikleri (hepsi savings-summary'de gercek veri)
  const savingsCards = savingsData ? [
    { label: 'Mesafe Tasarrufu', value: `${num0(savingsData.distanceSavedKm)} km`, icon: Route, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200/60' },
    { label: 'Yakıt Tasarrufu', value: `${num0(savingsData.fuelSavedLiters)} L`, icon: Fuel, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200/60' },
    { label: 'Maliyet Tasarrufu', value: `${num0(savingsData.costSavedTry)} TL`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50 border-green-200/60' },
    { label: 'Emisyon/km', value: `${emissionsPerKm.toFixed(2)} kg`, icon: TrendingDown, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200/60' },
  ] : []

  const trend = (esgData?.monthlyBreakdown || []).filter(m => m.emissionsKg > 0 || m.routeCount > 0)
  const trendMax = Math.max(1, ...trend.map(m => m.emissionsKg))
  const vehicleTotal = carbonData?.byVehicleType?.reduce((s, v) => s + v.totalEmissionsKg, 0) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sürdürülebilirlik</h1>
        <p className="text-[14px] text-slate-400 mt-1">Karbon ayak izi raporu, ESG skoru ve tasarruf analizi</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
          </div>

          {/* Ikincil tasarruf metrikleri */}
          {savingsCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {savingsCards.map(c => (
                <div key={c.label} className={`flex items-center gap-3 p-4 rounded-2xl border ${c.bg}`}>
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${c.color}`}>
                    <c.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[12px] text-slate-500">{c.label}</div>
                    <div className={`text-[17px] font-bold ${c.color}`}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aylık Trend */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Aylık Emisyon Trendi</h3>
              {trend.length > 0 ? (
                <div className="space-y-3">
                  {trend.map(item => (
                    <div key={item.month} className="flex items-center gap-3">
                      <span className="text-[13px] text-slate-600 w-12">{monthNames[item.month] || item.month}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full" style={{ width: `${Math.min((item.emissionsKg / trendMax) * 100, 100)}%` }} />
                      </div>
                      <span className="text-[12px] font-medium text-slate-700 w-24 text-right">{num0(item.emissionsKg)} kg</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-slate-400 text-center py-8">Veri bulunamadı</p>
              )}
            </div>

            {/* Tasarruf Özeti */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasarruf Özeti</h3>
              {savingsData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200/60">
                    <span className="text-[13px] font-medium text-green-800">Rota Optimizasyonu Tasarrufu</span>
                    <span className="text-[15px] font-bold text-green-700">{num0(savingsData.totalCO2SavedKg)} kg CO₂</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200/60">
                    <span className="text-[13px] font-medium text-blue-800">Optimize Edilen Rota</span>
                    <span className="text-[15px] font-bold text-blue-700">{num0(savingsData.optimizedRouteCount)} rota</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200/60">
                    <span className="text-[13px] font-medium text-purple-800">Tasarruf Oranı</span>
                    <span className="text-[15px] font-bold text-purple-700">%{(esgData?.savingsPercent ?? 0).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200/60">
                    <span className="text-[13px] font-medium text-emerald-800">Karbon Kredi</span>
                    <span className="text-[15px] font-bold text-emerald-700">{(savingsData.totalCO2SavedTons ?? 0).toFixed(1)} ton</span>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-slate-400 text-center py-8">Veri bulunamadı</p>
              )}
            </div>
          </div>

          {/* Arac Tipi Dağılımı */}
          {carbonData?.byVehicleType && carbonData.byVehicleType.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Araç Tipi Bazında Emisyon</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {carbonData.byVehicleType.map(item => (
                  <div key={item.vehicleType} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="text-[13px] font-medium text-slate-700">{item.vehicleType}</div>
                    <div className="text-[20px] font-bold text-slate-900 mt-1">{num0(item.totalEmissionsKg)} kg</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">%{Math.round((item.totalEmissionsKg / vehicleTotal) * 100)} · {item.routeCount} rota</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
