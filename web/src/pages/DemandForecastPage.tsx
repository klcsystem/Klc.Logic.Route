import { useState } from 'react'
import { TrendingUp, Loader2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import api from '../api/client'
import { useApi } from '../utils/useApi'

// Gercek backend sekli (/analytics/demand-forecast)
interface RawDaily {
  date: string
  dayOfWeek: string
  predictedOrderCount: number
  confidenceLow: number
  confidenceHigh: number
  seasonalFactor: number
}
interface RawForecast {
  dailyPredictions: RawDaily[]
  busiestDay: string
  recommendedVehicleCount: number
  averageOrdersPerDay: number
  trendPercent: number
  generatedAt: string
}

const forecastApi = {
  getForecast: (days: number) => api.get('/analytics/demand-forecast', { params: { days } }).then(r => r.data),
}

const dayShort: Record<string, string> = {
  Monday: 'Pzt', Tuesday: 'Sal', Wednesday: 'Çar', Thursday: 'Per', Friday: 'Cum', Saturday: 'Cmt', Sunday: 'Paz',
}
function fmtDay(dateStr: string, dow: string): string {
  const d = new Date(dateStr)
  const dd = isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${dd} ${dayShort[dow] || dow || ''}`.trim()
}

export default function DemandForecastPage() {
  const [days, setDays] = useState(7)

  const { data: forecastData, isLoading } = useApi<RawForecast>(
    () => forecastApi.getForecast(days),
    [days],
  )

  const daily: RawDaily[] = forecastData?.dailyPredictions || []
  const maxOrders = Math.max(...daily.map(f => f.predictedOrderCount), 1)
  const totalOrders = daily.reduce((s, f) => s + (f.predictedOrderCount || 0), 0)
  const trendPct = forecastData?.trendPercent ?? 0

  const kpis = [
    { label: 'Toplam Tahmini Sipariş', value: forecastData ? totalOrders.toLocaleString() : '—', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Ort. Günlük Sipariş', value: forecastData ? (forecastData.averageOrdersPerDay ?? 0).toFixed(1) : '—', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Önerilen Araç', value: forecastData ? `${forecastData.recommendedVehicleCount ?? 0}` : '—', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
    { label: 'Trend', value: forecastData ? `${trendPct > 0 ? '+' : ''}${Math.round(trendPct)}%` : '—', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Talep Tahmini</h1>
          <p className="text-[14px] text-slate-400 mt-1">ML tabanlı talep ve hacim tahmin modeli</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${days === d ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-400/10' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {d} Gün
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : (
        <>
          {/* Tahmin Grafiği */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Günlük Tahmin</h3>
            {daily.length > 0 ? (
              <div className="space-y-3">
                {daily.map(f => (
                  <div key={f.date} className="flex items-center gap-3">
                    <span className="text-[13px] text-slate-600 w-20 shrink-0">{fmtDay(f.date, f.dayOfWeek)}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all" style={{ width: `${(f.predictedOrderCount / maxOrders) * 100}%` }} />
                      <span className="absolute inset-0 flex items-center pl-2 text-[11px] font-medium text-white mix-blend-difference">{f.predictedOrderCount} sipariş</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 w-24 text-right">{Math.round(f.confidenceLow)}–{Math.round(f.confidenceHigh)} aralık</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-slate-400 text-center py-8">Veri bulunamadı</p>
            )}
          </div>

          {/* Detay Tablosu */}
          {daily.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[15px] font-semibold text-slate-800">Detaylı Tahmin</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
                      <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gün</th>
                      <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tahmin Sipariş</th>
                      <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Güven Aralığı</th>
                      <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sezon Faktörü</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.map(f => (
                      <tr key={f.date} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{new Date(f.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-3.5 text-[13px] text-slate-600">{dayShort[f.dayOfWeek] || f.dayOfWeek}</td>
                        <td className="px-6 py-3.5 text-right text-[13px] font-semibold text-slate-700">{f.predictedOrderCount}</td>
                        <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{Math.round(f.confidenceLow)} – {Math.round(f.confidenceHigh)}</td>
                        <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{(f.seasonalFactor ?? 1).toFixed(2)}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
