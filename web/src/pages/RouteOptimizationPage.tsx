import { useState } from 'react'
import { Route, Loader2, Star, Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
import type { CarrierOption } from '../types'

const mockOptions: CarrierOption[] = [
  { providerId: '1', providerName: 'Yolda', contractId: 'c1', vehicleCategory: 'Tir', estimatedCost: 8450, currency: 'TRY', estimatedTransitDays: 1, score: 92, scorePrice: 78, scoreSpeed: 95, scoreReliability: 88, priceBreakdown: { baseCost: 7200, surcharges: [{ label: 'Frigo', amount: 1050 }, { label: 'Yakit', amount: 200 }] } },
  { providerId: '3', providerName: 'Ekol Lojistik', contractId: 'c3', vehicleCategory: 'Tir', estimatedCost: 9100, currency: 'TRY', estimatedTransitDays: 1, score: 85, scorePrice: 65, scoreSpeed: 90, scoreReliability: 92, priceBreakdown: { baseCost: 7800, surcharges: [{ label: 'Frigo', amount: 1100 }, { label: 'Haftasonu', amount: 200 }] } },
  { providerId: '2', providerName: 'Tırport', contractId: 'c2', vehicleCategory: 'Kamyon', estimatedCost: 7200, currency: 'TRY', estimatedTransitDays: 2, score: 78, scorePrice: 92, scoreSpeed: 60, scoreReliability: 75, priceBreakdown: { baseCost: 6500, surcharges: [{ label: 'Frigo', amount: 700 }] } },
]

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] font-semibold text-slate-700 w-8 text-right">{value}%</span>
    </div>
  )
}

export default function RouteOptimizationPage() {
  const { t } = useI18n()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [options, setOptions] = useState<CarrierOption[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [origin, setOrigin] = useState('Istanbul')
  const [destination, setDestination] = useState('Ankara')
  const [weight, setWeight] = useState(1880)
  const [volume, setVolume] = useState(7.3)
  const [isHazardous, setIsHazardous] = useState(false)
  const [requiresColdChain, setRequiresColdChain] = useState(true)
  const [priceWeight, setPriceWeight] = useState(60)
  const [speedWeight, setSpeedWeight] = useState(25)
  const [reliabilityWeight, setReliabilityWeight] = useState(15)

  const handleOptimize = () => {
    setIsOptimizing(true)
    setOptions([])
    setTimeout(() => { setIsOptimizing(false); setOptions(mockOptions) }, 2500)
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.routeOptimization.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.routeOptimization.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel — Shipment Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.routeOptimization.shipmentInfo}</h3>
            <div className="space-y-3">
              <div><label className="block text-[12px] font-semibold text-slate-500 mb-1">Çıkış</label><input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputClass} /></div>
              <div><label className="block text-[12px] font-semibold text-slate-500 mb-1">Varış</label><input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[12px] font-semibold text-slate-500 mb-1">Ağırlık (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className={inputClass} /></div>
                <div><label className="block text-[12px] font-semibold text-slate-500 mb-1">Hacim (m³)</label><input type="number" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className={inputClass} /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[13px] text-slate-600"><input type="checkbox" checked={isHazardous} onChange={(e) => setIsHazardous(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />ADR</label>
                <label className="flex items-center gap-2 text-[13px] text-slate-600"><input type="checkbox" checked={requiresColdChain} onChange={(e) => setRequiresColdChain(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />Frigo</label>
              </div>
            </div>
          </div>

          {/* Scoring Weights */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.routeOptimization.weightSettings}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1"><label className="text-[12px] font-semibold text-slate-500">{t.routeOptimization.priceWeight}</label><span className="text-[12px] font-bold text-slate-700">{priceWeight}%</span></div>
                <input type="range" min={0} max={100} value={priceWeight} onChange={(e) => setPriceWeight(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1"><label className="text-[12px] font-semibold text-slate-500">{t.routeOptimization.speedWeight}</label><span className="text-[12px] font-bold text-slate-700">{speedWeight}%</span></div>
                <input type="range" min={0} max={100} value={speedWeight} onChange={(e) => setSpeedWeight(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1"><label className="text-[12px] font-semibold text-slate-500">{t.routeOptimization.reliabilityWeight}</label><span className="text-[12px] font-bold text-slate-700">{reliabilityWeight}%</span></div>
                <input type="range" min={0} max={100} value={reliabilityWeight} onChange={(e) => setReliabilityWeight(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-400" />
              </div>
              <button onClick={handleOptimize} disabled={isOptimizing} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all">
                {isOptimizing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.routeOptimization.optimizing}</> : options.length > 0 ? <><RefreshCw className="w-4 h-4" /> {t.routeOptimization.recalculate}</> : <><Route className="w-4 h-4" /> {t.routeOptimization.optimize}</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel — Carrier Comparison */}
        <div className="lg:col-span-2">
          {options.length > 0 ? (
            <div>
              <h2 className="text-[16px] font-semibold text-slate-800 mb-4">{t.routeOptimization.carrierComparison}</h2>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div key={`${opt.providerId}-${opt.vehicleCategory}`} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${i === 0 ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-200/60'}`}>
                    <div className="p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === opt.providerId ? null : opt.providerId)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {i === 0 && <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><Star className="w-4 h-4 fill-current" /></div>}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-semibold text-slate-800">{opt.providerName}</span>
                              {i === 0 && <Badge variant="orange">{t.routeOptimization.bestOption}</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="info">{opt.vehicleCategory}</Badge>
                              <span className="text-[12px] text-slate-400">{opt.estimatedTransitDays} {t.routeOptimization.days}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-[18px] font-bold text-slate-900">{opt.estimatedCost.toLocaleString()} {opt.currency}</div>
                            <div className="text-[12px] text-slate-400">{t.routeOptimization.estimatedCost}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-[18px] font-bold ${opt.score >= 90 ? 'text-green-600' : opt.score >= 80 ? 'text-amber-600' : 'text-slate-600'}`}>{opt.score}</div>
                            <div className="text-[12px] text-slate-400">{t.routeOptimization.score}</div>
                          </div>
                          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[12px] font-semibold hover:from-orange-500 hover:to-orange-600 transition-all flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> {t.routeOptimization.selectCarrier}
                          </button>
                          {expandedId === opt.providerId ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Scoring mini bars */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div><span className="text-[11px] text-slate-400">{t.shipments.price}</span><ScoreBar value={opt.scorePrice} color="bg-blue-500" /></div>
                        <div><span className="text-[11px] text-slate-400">{t.shipments.speed}</span><ScoreBar value={opt.scoreSpeed} color="bg-green-500" /></div>
                        <div><span className="text-[11px] text-slate-400">{t.shipments.reliability}</span><ScoreBar value={opt.scoreReliability} color="bg-amber-500" /></div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    {expandedId === opt.providerId && (
                      <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                        <h4 className="text-[13px] font-semibold text-slate-700 mb-3">{t.routeOptimization.priceBreakdown}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between"><span className="text-[13px] text-slate-600">{t.routeOptimization.baseCost}</span><span className="text-[13px] font-medium text-slate-800">{opt.priceBreakdown.baseCost.toLocaleString()} {opt.currency}</span></div>
                          {opt.priceBreakdown.surcharges.map((s) => (
                            <div key={s.label} className="flex items-center justify-between"><span className="text-[13px] text-slate-500">{s.label}</span><span className="text-[13px] text-slate-600">+{s.amount.toLocaleString()} {opt.currency}</span></div>
                          ))}
                          <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between"><span className="text-[13px] font-semibold text-slate-800">{t.routeOptimization.totalCost}</span><span className="text-[15px] font-bold text-slate-900">{opt.estimatedCost.toLocaleString()} {opt.currency}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center h-full flex flex-col items-center justify-center">
              <Route className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-[15px] font-medium text-slate-400 mb-2">{t.routeOptimization.carrierComparison}</p>
              <p className="text-[13px] text-slate-300">{isOptimizing ? t.routeOptimization.optimizing : t.routeOptimization.noResults}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
