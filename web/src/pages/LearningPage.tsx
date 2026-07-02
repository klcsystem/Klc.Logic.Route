import { Brain, Loader2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface LearningSummary {
  totalModels: number
  activeModels: number
  totalPredictions: number
  accuracyRate: number
  lastTrainedAt: string
  insights: LearningInsight[]
}

interface LearningInsight {
  id: string
  modelName: string
  category: string
  description: string
  impact: string
  confidence: number
  learnedAt: string
}

const learningApi = {
  getSummary: () => api.get('/learning/summary').then(r => r.data),
}

export default function LearningPage() {
  const { data: summaryData, isLoading } = useApi<LearningSummary>(
    () => learningApi.getSummary(),
    [],
  )

  const insights: LearningInsight[] = summaryData?.insights || []

  const kpis = [
    { label: 'Toplam Model', value: summaryData?.totalModels?.toString() || '0', icon: Brain, color: 'text-blue-600 bg-blue-50' },
    { label: 'Aktif Model', value: summaryData?.activeModels?.toString() || '0', icon: Brain, color: 'text-green-600 bg-green-50' },
    { label: 'Toplam Tahmin', value: summaryData?.totalPredictions?.toLocaleString() || '0', icon: Brain, color: 'text-orange-600 bg-orange-50' },
    { label: 'Dogruluk Oranı', value: summaryData ? `%${summaryData.accuracyRate?.toFixed(1)}` : '—', icon: Brain, color: 'text-purple-600 bg-purple-50' },
  ]

  const impactVariant: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    High: 'success',
    Medium: 'warning',
    Low: 'info',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Ogrenme Motoru</h1>
        <p className="text-[14px] text-slate-400 mt-1">Sistemin operasyonlardan ogrendigi kaliplar ve iyilestirmeler</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
          </div>

          {summaryData?.lastTrainedAt && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-500" />
              <span className="text-[13px] text-slate-600">Son egitim: <span className="font-semibold text-slate-800">{summaryData.lastTrainedAt}</span></span>
            </div>
          )}

          {/* Ogrenilen Kaliplar */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[15px] font-semibold text-slate-800">Ogrenilen Kaliplar ve Icerikler</h3>
            </div>
            {insights.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {insights.map(insight => (
                  <div key={insight.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-800">{insight.modelName}</span>
                        <Badge variant="default">{insight.category}</Badge>
                        <Badge variant={impactVariant[insight.impact] || 'default'}>{insight.impact} Etki</Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">{insight.learnedAt}</span>
                    </div>
                    <p className="text-[13px] text-slate-600">{insight.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Guven:</span>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${insight.confidence}%` }} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">%{insight.confidence}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-[14px] text-slate-400">Veri bulunamadı</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
