import { Loader2, Play, Truck, TrendingUp, Fuel } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { SimulationScenario } from '../../api/simulation'

interface ScenarioBuilderProps {
  scenario: SimulationScenario
  onScenarioChange: (scenario: SimulationScenario) => void
  onRun: () => void
  isRunning: boolean
}

export default function ScenarioBuilder({ scenario, onScenarioChange, onRun, isRunning }: ScenarioBuilderProps) {
  const { t } = useI18n()

  const update = (key: keyof SimulationScenario, value: number) => {
    onScenarioChange({ ...scenario, [key]: value })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.simulation.scenarioBuilder}</h3>
      <p className="text-[12px] text-slate-400 mb-5">{t.simulation.scenarioDesc}</p>

      <div className="space-y-5">
        {/* Vehicle Count Delta */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-blue-500" />
            <label className="text-[12px] font-semibold text-slate-600">{t.simulation.vehicleChange}</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-5}
              max={10}
              value={scenario.vehicleCountDelta}
              onChange={e => update('vehicleCountDelta', Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className={`text-[14px] font-bold min-w-[50px] text-right ${
              scenario.vehicleCountDelta > 0 ? 'text-green-600' : scenario.vehicleCountDelta < 0 ? 'text-red-600' : 'text-slate-600'
            }`}>
              {scenario.vehicleCountDelta > 0 ? '+' : ''}{scenario.vehicleCountDelta}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.simulation.vehicleChangeDesc}</p>
        </div>

        {/* Demand Change */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <label className="text-[12px] font-semibold text-slate-600">{t.simulation.demandChange}</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-50}
              max={100}
              step={5}
              value={scenario.demandChangePercent}
              onChange={e => update('demandChangePercent', Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className={`text-[14px] font-bold min-w-[50px] text-right ${
              scenario.demandChangePercent > 0 ? 'text-orange-600' : scenario.demandChangePercent < 0 ? 'text-blue-600' : 'text-slate-600'
            }`}>
              {scenario.demandChangePercent > 0 ? '+' : ''}{scenario.demandChangePercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.simulation.demandChangeDesc}</p>
        </div>

        {/* Fuel Price Change */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-4 h-4 text-red-500" />
            <label className="text-[12px] font-semibold text-slate-600">{t.simulation.fuelChange}</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-30}
              max={50}
              step={5}
              value={scenario.fuelPriceChangePercent}
              onChange={e => update('fuelPriceChangePercent', Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <span className={`text-[14px] font-bold min-w-[50px] text-right ${
              scenario.fuelPriceChangePercent > 0 ? 'text-red-600' : scenario.fuelPriceChangePercent < 0 ? 'text-green-600' : 'text-slate-600'
            }`}>
              {scenario.fuelPriceChangePercent > 0 ? '+' : ''}{scenario.fuelPriceChangePercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t.simulation.fuelChangeDesc}</p>
        </div>
      </div>

      <button
        onClick={onRun}
        disabled={isRunning}
        className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[14px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all"
      >
        {isRunning ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> {t.simulation.running}</>
        ) : (
          <><Play className="w-5 h-5" /> {t.simulation.runSimulation}</>
        )}
      </button>
    </div>
  )
}
