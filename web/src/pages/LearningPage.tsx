import { Brain, Loader2, Clock, MapPin, Timer, Database, TrendingUp } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import api from '../api/client'
import { useApi } from '../utils/useApi'

// Gercek backend sekli (/learning/summary) — surekli ogrenme motoru
interface LearningSummary {
  totalServiceTimeLearned: number
  totalAddressCorrected: number
  totalTrafficPatterns: number
  totalDataPointsProcessed: number
  averageServiceTimeAccuracyImprovement: number
  averageEtaAccuracyImprovement: number
  lastTrainingRun: string | null
  nextScheduledRun: string | null
}

const learningApi = {
  getSummary: () => api.get('/learning/summary').then(r => r.data),
}

const num = (n?: number) => (n ?? 0).toLocaleString('tr-TR')
const fmtDateTime = (v?: string | null): string => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function LearningPage() {
  const { data: summaryData, isLoading } = useApi<LearningSummary>(
    () => learningApi.getSummary(),
    [],
  )

  const kpis = [
    { label: 'Öğrenilen Servis Süresi', value: num(summaryData?.totalServiceTimeLearned), icon: Timer, color: 'text-blue-600 bg-blue-50' },
    { label: 'Düzeltilen Adres', value: num(summaryData?.totalAddressCorrected), icon: MapPin, color: 'text-green-600 bg-green-50' },
    { label: 'Trafik Deseni', value: num(summaryData?.totalTrafficPatterns), icon: Brain, color: 'text-orange-600 bg-orange-50' },
    { label: 'İşlenen Veri Noktası', value: num(summaryData?.totalDataPointsProcessed), icon: Database, color: 'text-purple-600 bg-purple-50' },
  ]

  const improvements = [
    { label: 'ETA Doğruluk İyileşmesi', value: `%${(summaryData?.averageEtaAccuracyImprovement ?? 0).toFixed(1)}` },
    { label: 'Servis Süresi Doğruluk İyileşmesi', value: `%${(summaryData?.averageServiceTimeAccuracyImprovement ?? 0).toFixed(1)}` },
  ]

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dogruluk Iyilesmeleri */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-[15px] font-semibold text-slate-800">Doğruluk İyileşmeleri</h3>
              </div>
              <div className="space-y-3">
                {improvements.map(imp => (
                  <div key={imp.label} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200/60">
                    <span className="text-[13px] font-medium text-green-800">{imp.label}</span>
                    <span className="text-[16px] font-bold text-green-700">{imp.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Egitim Takvimi */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-500" />
                <h3 className="text-[15px] font-semibold text-slate-800">Eğitim Takvimi</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[13px] font-medium text-slate-700">Son Eğitim</span>
                  <span className="text-[13px] font-semibold text-slate-800">{fmtDateTime(summaryData?.lastTrainingRun)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[13px] font-medium text-slate-700">Sonraki Planlanan</span>
                  <span className="text-[13px] font-semibold text-slate-800">{fmtDateTime(summaryData?.nextScheduledRun)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <p className="text-[13px] text-slate-500">
              Öğrenme motoru operasyonel verilerden sürekli öğrenir: servis süreleri, adres düzeltmeleri ve trafik desenleri.
              Yeterli veri biriktikçe tahmin doğruluğu otomatik iyileşir.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
