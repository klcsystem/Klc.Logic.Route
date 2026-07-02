import { Leaf, Loader2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface CarbonReport {
  totalEmissionsKg: number
  emissionsPerKm: number
  emissionsPerDelivery: number
  monthlyTrend: { month: string; emissions: number }[]
  vehicleBreakdown: { vehicleType: string; emissions: number; percentage: number }[]
}

interface SavingsSummary {
  totalSavingsKg: number
  routeOptimizationSavings: number
  vehicleConsolidationSavings: number
  esgScore: number
  rank: string
}

const sustainabilityApi = {
  getCarbonReport: () => api.get('/sustainability/carbon-report').then(r => r.data),
  getSavingsSummary: () => api.get('/sustainability/savings-summary').then(r => r.data),
}

export default function SustainabilityPage() {
  const { data: carbonData, isLoading: carbonLoading } = useApi<CarbonReport>(
    () => sustainabilityApi.getCarbonReport(),
    [],
  )
  const { data: savingsData, isLoading: savingsLoading } = useApi<SavingsSummary>(
    () => sustainabilityApi.getSavingsSummary(),
    [],
  )

  const isLoading = carbonLoading || savingsLoading

  const kpis = [
    { label: 'Toplam Emisyon', value: carbonData ? `${(carbonData.totalEmissionsKg ?? 0).toLocaleString()} kg` : '—', icon: Leaf, color: 'text-red-600 bg-red-50' },
    { label: 'Emisyon/km', value: carbonData ? `${(carbonData.emissionsPerKm ?? 0).toFixed(2)} kg` : '—', icon: Leaf, color: 'text-orange-600 bg-orange-50' },
    { label: 'Toplam Tasarruf', value: savingsData ? `${(savingsData.totalSavingsKg ?? 0).toLocaleString()} kg` : '—', icon: Leaf, color: 'text-green-600 bg-green-50' },
    { label: 'ESG Skoru', value: savingsData ? `${savingsData.esgScore ?? 0}/100` : '—', icon: Leaf, color: 'text-blue-600 bg-blue-50' },
  ]

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aylık Trend */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Aylık Emisyon Trendi</h3>
              {carbonData?.monthlyTrend && carbonData.monthlyTrend.length > 0 ? (
                <div className="space-y-3">
                  {carbonData.monthlyTrend.map(item => (
                    <div key={item.month} className="flex items-center gap-3">
                      <span className="text-[13px] text-slate-600 w-20">{item.month}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full" style={{ width: `${Math.min((item.emissions / (carbonData.totalEmissionsKg || 1)) * 300, 100)}%` }} />
                      </div>
                      <span className="text-[12px] font-medium text-slate-700 w-24 text-right">{(item.emissions ?? 0).toLocaleString()} kg</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-slate-400 text-center py-8">Veri bulunamadı</p>
              )}
            </div>

            {/* Tasarruf Detay */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasarruf Detayları</h3>
              {savingsData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200/60">
                    <span className="text-[13px] font-medium text-green-800">Rota Optimizasyonu</span>
                    <span className="text-[15px] font-bold text-green-700">{(savingsData.routeOptimizationSavings ?? 0).toLocaleString()} kg CO2</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200/60">
                    <span className="text-[13px] font-medium text-blue-800">Arac Konsolidasyonu</span>
                    <span className="text-[15px] font-bold text-blue-700">{(savingsData.vehicleConsolidationSavings ?? 0).toLocaleString()} kg CO2</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200/60">
                    <span className="text-[13px] font-medium text-purple-800">ESG Seviyesi</span>
                    <span className="text-[15px] font-bold text-purple-700">{savingsData.rank || '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-slate-400 text-center py-8">Veri bulunamadı</p>
              )}
            </div>
          </div>

          {/* Arac Tipi Dağılımı */}
          {carbonData?.vehicleBreakdown && carbonData.vehicleBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Arac Tipi Bazında Emisyon</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {carbonData.vehicleBreakdown.map(item => (
                  <div key={item.vehicleType} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="text-[13px] font-medium text-slate-700">{item.vehicleType}</div>
                    <div className="text-[20px] font-bold text-slate-900 mt-1">{(item.emissions ?? 0).toLocaleString()} kg</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">{item.percentage ?? 0}% toplam</div>
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
