import { Star, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
import { reportsApi, type CarrierPerformance } from '../api/reports'
import { dashboardApi } from '../api/dashboard'
import { useApi } from '../utils/useApi'

function RatingBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
      <span className="text-[12px] font-semibold text-slate-700 w-12 text-right">{value.toFixed(1)}%</span>
    </div>
  )
}

export default function CarrierScorecardPage() {
  const { t } = useI18n()

  const { data: carrierPerfsData, isLoading } = useApi(() => reportsApi.getCarrierPerformance())
  const { data: providerCosts } = useApi(() => dashboardApi.getProviderCosts())

  const carrierPerfs: CarrierPerformance[] = carrierPerfsData || []

  // Enrich carrier perf with cost data
  const scores = carrierPerfs
    .map((cp) => {
      const costEntry = (providerCosts || []).find(c => c.providerId === cp.providerId)
      const onTimeRate = Number(cp.onTimePercentage)
      const damageRate = cp.totalShipments > 0 ? (cp.damagedShipments / cp.totalShipments) * 100 : 0
      const overallScore = Number(cp.overallScore)
      return {
        ...cp,
        onTimeRate,
        damageRate,
        overallScoreNum: overallScore,
        totalCostFromDashboard: costEntry?.totalCost || Number(cp.totalCost),
        shipmentCountFromDashboard: costEntry?.shipmentCount || cp.totalShipments,
        trend: (overallScore >= 80 ? 'up' : overallScore >= 50 ? 'stable' : 'down') as 'up' | 'down' | 'stable',
      }
    })
    .sort((a, b) => b.overallScoreNum - a.overallScoreNum)

  // Monthly trend chart from carrier performance data
  const monthlyTrendChart = carrierPerfs
    .reduce((acc, cp) => {
      const key = `${cp.year}-${cp.month}`
      const existing = acc.find(a => a.key === key)
      if (existing) {
        existing.totalShipments += cp.totalShipments
        existing.onTimeTotal += cp.onTimeDeliveries
        existing.lateTotal += cp.lateDeliveries
      } else {
        const monthNames = ['', 'Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']
        acc.push({
          key,
          month: monthNames[cp.month] || `${cp.month}`,
          totalShipments: cp.totalShipments,
          onTimeTotal: cp.onTimeDeliveries,
          lateTotal: cp.lateDeliveries,
        })
      }
      return acc
    }, [] as { key: string; month: string; totalShipments: number; onTimeTotal: number; lateTotal: number }[])
    .map(m => ({
      month: m.month,
      zamaninda: m.totalShipments > 0 ? Number(((m.onTimeTotal / (m.onTimeTotal + m.lateTotal || 1)) * 100).toFixed(1)) : 0,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.scorecard.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.scorecard.subtitle}</p>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>}

      {!isLoading && scores.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
          <p className="text-[15px] text-slate-500">Henuz tasiyici performans verisi yok.</p>
          <p className="text-[13px] text-slate-400 mt-1">Sevkiyatlar tamamlandikca performans verileri burada gorunecektir.</p>
        </div>
      )}

      {/* Monthly trend */}
      {!isLoading && monthlyTrendChart.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Aylik Zamaninda Teslim Trendi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrendChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="zamaninda" name="Zamaninda %" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Carrier Scorecards */}
      <div className="grid gap-4">
        {scores.map((carrier, i) => (
          <div key={carrier.id} className={`bg-white rounded-2xl border shadow-sm p-6 ${i === 0 ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-200/60'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {i === 0 && <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Star className="w-5 h-5 fill-current" /></div>}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[16px] font-semibold text-slate-800">{carrier.providerName}</h3>
                    {i === 0 && <Badge variant="orange">#1</Badge>}
                  </div>
                  <span className="text-[12px] text-slate-400">
                    {carrier.totalShipments} {t.scorecard.totalShipments.toLowerCase()} | {t.scorecard.lastUpdated}: {carrier.calculatedAt ? new Date(carrier.calculatedAt).toLocaleDateString('tr-TR') : '-'}
                    {carrier.totalCostFromDashboard > 0 && ` | Toplam: ${(carrier.totalCostFromDashboard / 1000).toFixed(0)}K TL`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-[28px] font-bold ${carrier.overallScoreNum >= 80 ? 'text-green-600' : carrier.overallScoreNum >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {carrier.overallScoreNum.toFixed(0)}
                  </div>
                  <div className="text-[11px] text-slate-400">{t.scorecard.overallRating}</div>
                </div>
                <div className={`flex items-center gap-1 ${carrier.trend === 'up' ? 'text-green-500' : carrier.trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                  {carrier.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : carrier.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <span className="text-[12px]">--</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <span className="text-[12px] text-slate-500 block mb-1">{t.scorecard.onTimeRate}</span>
                <RatingBar value={carrier.onTimeRate} color="bg-green-500" />
              </div>
              <div>
                <span className="text-[12px] text-slate-500 block mb-1">{t.scorecard.damageRate}</span>
                <RatingBar value={100 - carrier.damageRate * 10} color="bg-red-400" />
              </div>
              <div>
                <span className="text-[12px] text-slate-500 block mb-1">Ort. Teslimat</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-slate-700">{Number(carrier.averageDeliveryHours).toFixed(1)} saat</span>
                </div>
              </div>
              <div>
                <span className="text-[12px] text-slate-500 block mb-1">Ort. Maliyet/kg</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-slate-700">{Number(carrier.averageCostPerKg).toFixed(2)} TL</span>
                </div>
              </div>
              <div>
                <span className="text-[12px] text-slate-500 block mb-1">CO2 Emisyon</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-slate-700">{(Number(carrier.co2TotalKg) / 1000).toFixed(1)} ton</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance comparison table */}
      {!isLoading && scores.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">Performans Karsilastirma Tablosu</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Tasiyici</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Genel Puan</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Zamaninda %</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Geciken</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Hasar %</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ort. Saat</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ort. Maliyet/kg</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Toplam Sevkiyat</th>
              </tr></thead>
              <tbody>
                {scores.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="px-6 py-3 text-[13px] font-medium text-slate-800">{s.providerName}</td>
                    <td className="px-6 py-3 text-right text-[13px]">
                      <span className={`font-bold ${s.overallScoreNum >= 80 ? 'text-green-600' : s.overallScoreNum >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {s.overallScoreNum.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-[13px]"><span className={s.onTimeRate >= 90 ? 'text-green-600' : 'text-amber-600'}>{s.onTimeRate.toFixed(1)}%</span></td>
                    <td className="px-6 py-3 text-right text-[13px] text-red-500">{s.lateDeliveries}</td>
                    <td className="px-6 py-3 text-right text-[13px]"><span className={s.damageRate <= 1 ? 'text-green-600' : 'text-red-600'}>{s.damageRate.toFixed(1)}%</span></td>
                    <td className="px-6 py-3 text-right text-[13px] text-slate-600">{Number(s.averageDeliveryHours).toFixed(1)}</td>
                    <td className="px-6 py-3 text-right text-[13px] text-slate-600">{Number(s.averageCostPerKg).toFixed(2)} TL</td>
                    <td className="px-6 py-3 text-right text-[13px] text-slate-600">{s.totalShipments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
