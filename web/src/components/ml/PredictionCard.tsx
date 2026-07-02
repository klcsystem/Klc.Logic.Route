import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { useI18n } from '../../i18n'
import Badge from '../ui/Badge'
import type { DeliveryTimePrediction, DelayRiskPrediction, CostAnomalyPrediction } from '../../api/ml'

interface PredictionCardProps {
  shipmentId: string
}

const mockDeliveryTime: DeliveryTimePrediction = {
  shipmentId: 's1',
  predictedHours: 4.2,
  confidencePercent: 87,
  factors: [
    { name: 'Mesafe', impact: 0.45 },
    { name: 'Trafik yoğunluğu', impact: 0.25 },
    { name: 'Hava durumu', impact: 0.15 },
    { name: 'Taşıyıcı performansı', impact: 0.15 },
  ],
}

const mockDelayRisk: DelayRiskPrediction = {
  shipmentId: 's1',
  riskLevel: 'Medium',
  riskPercent: 35,
  reasons: ['Ankara girişi trafik yoğunluğu', 'Taşıyıcınin son 5 sevkiyatta %20 gecikme'],
}

const mockCostAnomaly: CostAnomalyPrediction = {
  shipmentId: 's1',
  anomalyScore: 0.12,
  isAnomaly: false,
  expectedCost: 8200,
  actualCost: 8450,
  deviationPercent: 3.0,
}

const riskColors: Record<string, { variant: 'success' | 'warning' | 'error'; bg: string }> = {
  Low: { variant: 'success', bg: 'bg-green-50' },
  Medium: { variant: 'warning', bg: 'bg-amber-50' },
  High: { variant: 'error', bg: 'bg-red-50' },
}

export default function PredictionCard({ shipmentId }: PredictionCardProps) {
  const { t } = useI18n()
  const [deliveryTime, setDeliveryTime] = useState<DeliveryTimePrediction | null>(null)
  const [delayRisk, setDelayRisk] = useState<DelayRiskPrediction | null>(null)
  const [costAnomaly, setCostAnomaly] = useState<CostAnomalyPrediction | null>(null)

  useEffect(() => {
    // TODO: Replace with real API calls
    // mlApi.getDeliveryTimePrediction(shipmentId).then(r => { if (r.success) setDeliveryTime(r.data) })
    // mlApi.getDelayRiskPrediction(shipmentId).then(r => { if (r.success) setDelayRisk(r.data) })
    // mlApi.getCostAnomalyPrediction(shipmentId).then(r => { if (r.success) setCostAnomaly(r.data) })
    console.log('Loading predictions for shipment:', shipmentId)
    const timer = setTimeout(() => {
      setDeliveryTime(mockDeliveryTime)
      setDelayRisk(mockDelayRisk)
      setCostAnomaly(mockCostAnomaly)
    }, 500)
    return () => clearTimeout(timer)
  }, [shipmentId])

  if (!deliveryTime || !delayRisk || !costAnomaly) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-50 rounded-xl" />
          <div className="h-16 bg-slate-50 rounded-xl" />
          <div className="h-16 bg-slate-50 rounded-xl" />
        </div>
      </div>
    )
  }

  const riskStyle = riskColors[delayRisk.riskLevel]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.ml.predictions}</h3>
      <div className="space-y-3">
        {/* Delivery Time */}
        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-[12px] font-semibold text-blue-600 uppercase">{t.ml.deliveryTime}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-bold text-slate-900">{deliveryTime.predictedHours}</span>
            <span className="text-[13px] text-slate-500">{t.ml.hours}</span>
            <span className="text-[11px] text-blue-500 ml-auto">{t.ml.confidence}: {deliveryTime.confidencePercent}%</span>
          </div>
        </div>

        {/* Delay Risk */}
        <div className={`p-3 rounded-xl ${riskStyle.bg} border border-opacity-50 ${delayRisk.riskLevel === 'Low' ? 'border-green-200' : delayRisk.riskLevel === 'Medium' ? 'border-amber-200' : 'border-red-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-[12px] font-semibold text-amber-600 uppercase">{t.ml.delayRisk}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={riskStyle.variant}>
              {delayRisk.riskLevel === 'Low' ? t.ml.riskLow : delayRisk.riskLevel === 'Medium' ? t.ml.riskMedium : t.ml.riskHigh}
            </Badge>
            <span className="text-[13px] font-semibold text-slate-700">{delayRisk.riskPercent}%</span>
          </div>
          {delayRisk.reasons.length > 0 && (
            <ul className="space-y-0.5">
              {delayRisk.reasons.map((r, i) => (
                <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1">
                  <span className="text-slate-400 mt-0.5">-</span> {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cost Anomaly */}
        <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-[12px] font-semibold text-purple-600 uppercase">{t.ml.costAnomaly}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant={costAnomaly.isAnomaly ? 'error' : 'success'}>
                {costAnomaly.isAnomaly ? t.ml.anomalyDetected : t.ml.normal}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-[12px] text-slate-500">{t.ml.deviation}: </span>
              <span className={`text-[13px] font-semibold ${costAnomaly.deviationPercent > 10 ? 'text-red-600' : 'text-slate-700'}`}>
                {costAnomaly.deviationPercent > 0 ? '+' : ''}{costAnomaly.deviationPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
