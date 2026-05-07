import { useState } from 'react'
import { Brain, Clock, AlertTriangle, TrendingUp, Loader2, Play, CheckCircle2 } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
import type { MlModel, PredictionVsActual } from '../api/ml'

const mockModels: MlModel[] = [
  {
    id: 'm1', name: 'Delivery Time Prediction', type: 'DeliveryTimePrediction', version: 'v2.3',
    accuracy: 87.5, rmse: 0.42, r2Score: 0.89, trainedAt: '2026-05-04T10:30:00', recordCount: 24500, status: 'Active',
  },
  {
    id: 'm2', name: 'Delay Risk Classification', type: 'DelayRisk', version: 'v1.8',
    accuracy: 91.2, rmse: undefined, r2Score: undefined, trainedAt: '2026-05-03T15:00:00', recordCount: 18200, status: 'Active',
  },
  {
    id: 'm3', name: 'Cost Anomaly Detection', type: 'CostAnomaly', version: 'v1.5',
    accuracy: 94.8, rmse: undefined, r2Score: undefined, trainedAt: '2026-05-02T08:15:00', recordCount: 31000, status: 'Active',
  },
]

const mockScatterData: PredictionVsActual[] = [
  { predicted: 3.2, actual: 3.5, label: 'SHP-001' },
  { predicted: 5.1, actual: 4.8, label: 'SHP-002' },
  { predicted: 2.8, actual: 2.9, label: 'SHP-003' },
  { predicted: 7.3, actual: 7.0, label: 'SHP-004' },
  { predicted: 4.5, actual: 5.2, label: 'SHP-005' },
  { predicted: 6.1, actual: 6.3, label: 'SHP-006' },
  { predicted: 3.8, actual: 3.6, label: 'SHP-007' },
  { predicted: 8.2, actual: 8.5, label: 'SHP-008' },
  { predicted: 1.9, actual: 2.1, label: 'SHP-009' },
  { predicted: 5.5, actual: 5.3, label: 'SHP-010' },
  { predicted: 4.0, actual: 4.7, label: 'SHP-011' },
  { predicted: 6.8, actual: 6.5, label: 'SHP-012' },
  { predicted: 2.3, actual: 2.5, label: 'SHP-013' },
  { predicted: 9.1, actual: 8.8, label: 'SHP-014' },
  { predicted: 3.5, actual: 3.2, label: 'SHP-015' },
  { predicted: 7.7, actual: 8.1, label: 'SHP-016' },
  { predicted: 4.8, actual: 4.5, label: 'SHP-017' },
  { predicted: 5.9, actual: 6.4, label: 'SHP-018' },
  { predicted: 1.5, actual: 1.8, label: 'SHP-019' },
  { predicted: 6.3, actual: 6.0, label: 'SHP-020' },
]

const modelIcons: Record<string, React.ElementType> = {
  DeliveryTimePrediction: Clock,
  DelayRisk: AlertTriangle,
  CostAnomaly: TrendingUp,
}

const modelColors: Record<string, { bg: string; text: string; border: string }> = {
  DeliveryTimePrediction: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  DelayRisk: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  CostAnomaly: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
}

export default function MLInsightsPage() {
  const { t } = useI18n()
  const [models] = useState<MlModel[]>(mockModels)
  const [scatterData] = useState<PredictionVsActual[]>(mockScatterData)
  const [trainingModel, setTrainingModel] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('DeliveryTimePrediction')

  const handleTrain = (modelType: string) => {
    setTrainingModel(modelType)
    // TODO: Replace with real API call
    // mlApi.triggerTraining(modelType).then(...)
    setTimeout(() => setTrainingModel(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.ml.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.ml.subtitle}</p>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map(model => {
          const Icon = modelIcons[model.type] || Brain
          const colors = modelColors[model.type]
          const isTraining = trainingModel === model.type
          const isSelected = selectedModel === model.type

          return (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model.type)}
              className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all duration-200 ${
                isSelected ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200/60 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <Badge variant={model.status === 'Active' ? 'success' : model.status === 'Training' ? 'warning' : 'error'}>
                  {model.status === 'Active' ? t.ml.active : model.status === 'Training' ? t.ml.training : t.ml.failed}
                </Badge>
              </div>

              <h3 className="text-[14px] font-semibold text-slate-800 mb-1">{model.name}</h3>
              <p className="text-[11px] text-slate-400 mb-3">{model.version} — {model.recordCount.toLocaleString()} {t.ml.records}</p>

              {/* Metrics */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">{t.ml.accuracy}</span>
                  <span className="text-[13px] font-bold text-slate-800">{model.accuracy}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${model.accuracy >= 90 ? 'bg-green-500' : model.accuracy >= 80 ? 'bg-orange-400' : 'bg-red-400'}`}
                    style={{ width: `${model.accuracy}%` }}
                  />
                </div>
                {model.rmse !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">RMSE</span>
                    <span className="text-[12px] font-semibold text-slate-700">{model.rmse}</span>
                  </div>
                )}
                {model.r2Score !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">R2 Score</span>
                    <span className="text-[12px] font-semibold text-slate-700">{model.r2Score}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                <span>{t.ml.lastTrained}: {new Date(model.trainedAt).toLocaleDateString('tr-TR')}</span>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); handleTrain(model.type) }}
                disabled={isTraining}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                  isTraining
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 shadow-sm shadow-orange-400/10'
                }`}
              >
                {isTraining ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.ml.trainingInProgress}</>
                ) : (
                  <><Play className="w-3.5 h-3.5" /> {t.ml.trainModel}</>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Prediction vs Actual Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-800">{t.ml.predVsActual}</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">{t.ml.predVsActualDesc}</p>
          </div>
          <div className="flex items-center gap-2">
            {models.map(m => (
              <button
                key={m.type}
                onClick={() => setSelectedModel(m.type)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  selectedModel === m.type ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.type === 'DeliveryTimePrediction' ? t.ml.deliveryTime : m.type === 'DelayRisk' ? t.ml.delayRisk : t.ml.costAnomaly}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number"
              dataKey="predicted"
              name={t.ml.predicted}
              label={{ value: t.ml.predicted, position: 'bottom', style: { fontSize: 12, fill: '#94a3b8' } }}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              type="number"
              dataKey="actual"
              name={t.ml.actual}
              label={{ value: t.ml.actual, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#94a3b8' } }}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload as PredictionVsActual
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-[12px]">
                      <p className="font-semibold text-slate-800 mb-1">{data.label}</p>
                      <p className="text-slate-500">{t.ml.predicted}: <span className="font-medium text-slate-700">{data.predicted}h</span></p>
                      <p className="text-slate-500">{t.ml.actual}: <span className="font-medium text-slate-700">{data.actual}h</span></p>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine
              segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }]}
              stroke="#f97316"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
            />
            <Scatter data={scatterData} fill="#f97316" fillOpacity={0.7} r={5} />
          </ScatterChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span>{t.ml.predictionPoints}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0 border-t-2 border-dashed border-orange-400" />
            <span>{t.ml.perfectLine}</span>
          </div>
        </div>
      </div>

      {/* Model Performance Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.ml.modelSummary}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.ml.modelName}</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.ml.version}</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.ml.accuracy}</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">RMSE</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">R2</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.ml.records}</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.id} className="border-b border-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-[13px] font-medium text-slate-800">{model.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><Badge variant="info">{model.version}</Badge></td>
                  <td className="px-4 py-3 text-center text-[13px] font-semibold text-slate-700">{model.accuracy}%</td>
                  <td className="px-4 py-3 text-center text-[13px] text-slate-600">{model.rmse ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-[13px] text-slate-600">{model.r2Score ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-[13px] text-slate-600">{model.recordCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><Badge variant="success">{model.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
