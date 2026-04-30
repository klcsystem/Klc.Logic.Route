import { Star, TrendingUp, TrendingDown } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'

interface CarrierScore {
  id: string
  name: string
  overallRating: number
  onTimeRate: number
  damageRate: number
  responseTime: number
  costEfficiency: number
  totalShipments: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

const mockScores: CarrierScore[] = [
  { id: '1', name: 'Aras Kargo', overallRating: 88, onTimeRate: 94.2, damageRate: 0.8, responseTime: 92, costEfficiency: 78, totalShipments: 145, trend: 'up', lastUpdated: '2024-03-15' },
  { id: '2', name: 'Yurtici Kargo', overallRating: 85, onTimeRate: 91.5, damageRate: 1.2, responseTime: 88, costEfficiency: 82, totalShipments: 112, trend: 'stable', lastUpdated: '2024-03-15' },
  { id: '3', name: 'MNG Kargo', overallRating: 79, onTimeRate: 87.8, damageRate: 2.1, responseTime: 75, costEfficiency: 90, totalShipments: 98, trend: 'down', lastUpdated: '2024-03-15' },
  { id: '4', name: 'PTT Kargo', overallRating: 72, onTimeRate: 82.3, damageRate: 3.5, responseTime: 65, costEfficiency: 95, totalShipments: 45, trend: 'up', lastUpdated: '2024-03-14' },
]

function RatingBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-[12px] font-semibold text-slate-700 w-12 text-right">{value}%</span>
    </div>
  )
}

export default function CarrierScorecardPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.scorecard.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.scorecard.subtitle}</p>
      </div>

      <div className="grid gap-4">
        {mockScores.map((carrier, i) => (
          <div key={carrier.id} className={`bg-white rounded-2xl border shadow-sm p-6 ${i === 0 ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-200/60'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {i === 0 && <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Star className="w-5 h-5 fill-current" /></div>}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[16px] font-semibold text-slate-800">{carrier.name}</h3>
                    {i === 0 && <Badge variant="orange">#1</Badge>}
                  </div>
                  <span className="text-[12px] text-slate-400">{carrier.totalShipments} {t.scorecard.totalShipments.toLowerCase()} | {t.scorecard.lastUpdated}: {carrier.lastUpdated}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-[28px] font-bold ${carrier.overallRating >= 85 ? 'text-green-600' : carrier.overallRating >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{carrier.overallRating}</div>
                  <div className="text-[11px] text-slate-400">{t.scorecard.overallRating}</div>
                </div>
                <div className={`flex items-center gap-1 ${carrier.trend === 'up' ? 'text-green-500' : carrier.trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                  {carrier.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : carrier.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <span className="text-[12px]">—</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div><span className="text-[12px] text-slate-500 block mb-1">{t.scorecard.onTimeRate}</span><RatingBar value={carrier.onTimeRate} color="bg-green-500" /></div>
              <div><span className="text-[12px] text-slate-500 block mb-1">{t.scorecard.damageRate}</span><RatingBar value={100 - carrier.damageRate * 10} color="bg-red-400" /></div>
              <div><span className="text-[12px] text-slate-500 block mb-1">{t.scorecard.responseTime}</span><RatingBar value={carrier.responseTime} color="bg-blue-500" /></div>
              <div><span className="text-[12px] text-slate-500 block mb-1">{t.scorecard.costEfficiency}</span><RatingBar value={carrier.costEfficiency} color="bg-amber-500" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
