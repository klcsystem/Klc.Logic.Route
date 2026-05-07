import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { SimulationResult } from '../../api/simulation'

interface ComparisonDashboardProps {
  result: SimulationResult
}

export default function ComparisonDashboard({ result }: ComparisonDashboardProps) {
  const { t } = useI18n()

  const metrics: {
    label: string
    currentValue: string
    simulatedValue: string
    changePercent: number
    lowerIsBetter: boolean
  }[] = [
    {
      label: t.simulation.totalCost,
      currentValue: `${result.current.totalCost.toLocaleString()} TRY`,
      simulatedValue: `${result.simulated.totalCost.toLocaleString()} TRY`,
      changePercent: ((result.simulated.totalCost - result.current.totalCost) / result.current.totalCost) * 100,
      lowerIsBetter: true,
    },
    {
      label: t.simulation.totalDistance,
      currentValue: `${result.current.totalDistanceKm.toLocaleString()} km`,
      simulatedValue: `${result.simulated.totalDistanceKm.toLocaleString()} km`,
      changePercent: ((result.simulated.totalDistanceKm - result.current.totalDistanceKm) / result.current.totalDistanceKm) * 100,
      lowerIsBetter: true,
    },
    {
      label: t.simulation.totalDuration,
      currentValue: `${Math.round(result.current.totalDurationMin / 60)} saat`,
      simulatedValue: `${Math.round(result.simulated.totalDurationMin / 60)} saat`,
      changePercent: ((result.simulated.totalDurationMin - result.current.totalDurationMin) / result.current.totalDurationMin) * 100,
      lowerIsBetter: true,
    },
    {
      label: t.simulation.co2Emissions,
      currentValue: `${result.current.co2EmissionsKg.toLocaleString()} kg`,
      simulatedValue: `${result.simulated.co2EmissionsKg.toLocaleString()} kg`,
      changePercent: ((result.simulated.co2EmissionsKg - result.current.co2EmissionsKg) / result.current.co2EmissionsKg) * 100,
      lowerIsBetter: true,
    },
    {
      label: t.simulation.vehicleUtilization,
      currentValue: `${result.current.vehicleUtilizationPercent}%`,
      simulatedValue: `${result.simulated.vehicleUtilizationPercent}%`,
      changePercent: ((result.simulated.vehicleUtilizationPercent - result.current.vehicleUtilizationPercent) / result.current.vehicleUtilizationPercent) * 100,
      lowerIsBetter: false,
    },
    {
      label: t.simulation.onTimeDelivery,
      currentValue: `${result.current.onTimeDeliveryPercent}%`,
      simulatedValue: `${result.simulated.onTimeDeliveryPercent}%`,
      changePercent: ((result.simulated.onTimeDeliveryPercent - result.current.onTimeDeliveryPercent) / result.current.onTimeDeliveryPercent) * 100,
      lowerIsBetter: false,
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-[15px] font-semibold text-slate-800">{t.simulation.comparison}</h3>
        <p className="text-[12px] text-slate-400 mt-0.5">{t.simulation.comparisonDesc}</p>
      </div>
      <div className="p-5">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 mb-3 px-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.simulation.metric}</span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">{t.simulation.current}</span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">{t.simulation.simulated}</span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">{t.simulation.change}</span>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {metrics.map(metric => {
            const isImproved = metric.lowerIsBetter
              ? metric.changePercent < 0
              : metric.changePercent > 0
            const isNeutral = Math.abs(metric.changePercent) < 0.5
            const changeColor = isNeutral ? 'text-slate-500 bg-slate-50' : isImproved ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
            const ChangeIcon = isNeutral ? Minus : metric.changePercent < 0 ? ArrowDown : ArrowUp

            return (
              <div key={metric.label} className="grid grid-cols-4 gap-4 items-center p-3 rounded-xl hover:bg-slate-50/50 transition-colors">
                <span className="text-[13px] font-medium text-slate-700">{metric.label}</span>
                <span className="text-[13px] text-slate-600 text-center">{metric.currentValue}</span>
                <span className="text-[13px] font-semibold text-slate-800 text-center">{metric.simulatedValue}</span>
                <div className="flex justify-end">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${changeColor}`}>
                    <ChangeIcon className="w-3 h-3" />
                    {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
