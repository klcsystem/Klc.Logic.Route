import { ArrowDown, TrendingDown, Clock, Truck, Leaf } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { VrpSolution } from '../../api/routeOptimization'

interface ComparisonViewProps {
  optimized: VrpSolution
}

export default function ComparisonView({ optimized }: ComparisonViewProps) {
  const { t } = useI18n()

  // Mock manual baseline (typically 25-35% worse than optimized)
  const manualDistanceKm = Math.round(optimized.totalDistanceKm * 1.3)
  const manualDurationMin = Math.round(optimized.totalDurationMin * 1.25)
  const manualCost = Math.round(optimized.totalCost * 1.28)
  const manualCo2 = Math.round(optimized.co2SavedKg * 1.3 + optimized.co2SavedKg)

  const distanceSaved = manualDistanceKm - optimized.totalDistanceKm
  const timeSaved = manualDurationMin - optimized.totalDurationMin
  const costSaved = manualCost - optimized.totalCost
  const co2Saved = optimized.co2SavedKg

  const distancePercent = Math.round((distanceSaved / manualDistanceKm) * 100)
  const timePercent = Math.round((timeSaved / manualDurationMin) * 100)
  const costPercent = Math.round((costSaved / manualCost) * 100)

  const metrics = [
    {
      label: t.vrp.totalDistance,
      manual: `${manualDistanceKm.toLocaleString()} km`,
      optimized: `${optimized.totalDistanceKm.toLocaleString()} km`,
      saved: `${distanceSaved.toLocaleString()} km`,
      percent: distancePercent,
      icon: TrendingDown,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: t.vrp.totalDuration,
      manual: `${Math.round(manualDurationMin / 60)} saat`,
      optimized: `${Math.round(optimized.totalDurationMin / 60)} saat`,
      saved: `${Math.round(timeSaved / 60)} saat`,
      percent: timePercent,
      icon: Clock,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: t.vrp.totalCost,
      manual: `${manualCost.toLocaleString()} TRY`,
      optimized: `${optimized.totalCost.toLocaleString()} TRY`,
      saved: `${costSaved.toLocaleString()} TRY`,
      percent: costPercent,
      icon: Truck,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: t.vrp.co2Savings,
      manual: `${manualCo2.toLocaleString()} kg`,
      optimized: `${(manualCo2 - co2Saved).toLocaleString()} kg`,
      saved: `${co2Saved.toLocaleString()} kg CO2`,
      percent: Math.round((co2Saved / manualCo2) * 100),
      icon: Leaf,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-[15px] font-semibold text-slate-800">{t.vrp.comparison}</h3>
        <p className="text-[12px] text-slate-400 mt-0.5">{t.vrp.comparisonDesc}</p>
      </div>
      <div className="p-5 space-y-4">
        {metrics.map(metric => (
          <div key={metric.label} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/50">
            <div className={`w-10 h-10 rounded-xl ${metric.color} flex items-center justify-center shrink-0`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-500">{metric.label}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[13px] text-slate-400 line-through">{metric.manual}</span>
                <ArrowDown className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[14px] font-bold text-slate-800">{metric.optimized}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-[12px] font-semibold border border-green-200">
                -{metric.percent}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">{metric.saved}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
