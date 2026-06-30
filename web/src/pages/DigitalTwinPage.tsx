import { useState } from 'react'
import { Truck, Package, DollarSign, FlaskConical } from 'lucide-react'
import { useI18n } from '../i18n'
import ScenarioBuilder from '../components/simulation/ScenarioBuilder'
import ComparisonDashboard from '../components/simulation/ComparisonDashboard'
import CostImpactChart from '../components/simulation/CostImpactChart'
import { simulationApi } from '../api/simulation'
import { useApi } from '../utils/useApi'
import type { SimulationScenario, SimulationResult } from '../api/simulation'

export default function DigitalTwinPage() {
  const { t } = useI18n()
  const [scenario, setScenario] = useState<SimulationScenario>({
    vehicleCountDelta: 2,
    demandChangePercent: 15,
    fuelPriceChangePercent: -10,
  })
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const { data: currentMetrics } = useApi(() => simulationApi.getCurrentMetrics(), [])

  const current = currentMetrics || {
    totalCost: 0, totalDistanceKm: 0, totalDurationMin: 0, co2EmissionsKg: 0,
    vehicleUtilizationPercent: 0, avgDeliveryTimeHours: 0, onTimeDeliveryPercent: 0,
    activeVehicles: 0, activeShipments: 0,
  }

  const handleRun = () => {
    setIsRunning(true)
    setResult(null)
    simulationApi.runSimulation(scenario)
      .then((res) => {
        if (res.success && res.data) {
          setResult(res.data)
        }
      })
      .catch(() => {})
      .finally(() => setIsRunning(false))
  }

  const summaryCards = [
    { label: t.simulation.activeVehicles, value: current.activeVehicles.toString(), icon: Truck, color: 'text-blue-600 bg-blue-50' },
    { label: t.simulation.activeShipments, value: current.activeShipments.toString(), icon: Package, color: 'text-orange-600 bg-orange-50' },
    { label: t.simulation.dailyCost, value: `${(current.totalCost / 30).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} TRY`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.simulation.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.simulation.subtitle}</p>
      </div>

      {/* Current Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-[24px] font-bold text-slate-900 tracking-tight">{card.value}</div>
            <div className="text-[13px] text-slate-400 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Scenario Builder */}
        <div>
          <ScenarioBuilder
            scenario={scenario}
            onScenarioChange={setScenario}
            onRun={handleRun}
            isRunning={isRunning}
          />
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <ComparisonDashboard result={result} />
              <CostImpactChart result={result} />
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
              <FlaskConical className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-[15px] font-medium text-slate-400 mb-2">{t.simulation.title}</p>
              <p className="text-[13px] text-slate-300">{isRunning ? t.simulation.running : t.simulation.emptyState}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
