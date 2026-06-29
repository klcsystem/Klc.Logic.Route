import { useState } from 'react'
import { Workflow, Play, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface PipelineStep {
  name: string
  status: string
  duration: string
  lastRun: string
}

interface PipelineStatus {
  isRunning: boolean
  lastRunAt: string
  lastRunStatus: string
  totalRuns: number
  successRate: number
  steps: PipelineStep[]
}

const pipelineApi = {
  getStatus: () => api.get('/pipeline/status').then(r => r.data),
  run: () => api.post('/pipeline/run').then(r => r.data),
}

export default function PipelinePage() {
  const { data: statusData, isLoading, refetch } = useApi<PipelineStatus>(
    () => pipelineApi.getStatus(),
    [],
  )
  const [isTriggering, setIsTriggering] = useState(false)

  const handleTrigger = async () => {
    setIsTriggering(true)
    try {
      await pipelineApi.run()
      refetch()
    } catch {
      // API henuz hazir olmayabilir
    } finally {
      setIsTriggering(false)
    }
  }

  const steps: PipelineStep[] = statusData?.steps || []

  const stepStatusIcon = (status: string) => {
    switch (status) {
      case 'Success': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'Failed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'Running': return <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
      default: return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const stepStatusVariant = (status: string): 'default' | 'success' | 'error' | 'warning' | 'orange' => {
    switch (status) {
      case 'Success': return 'success'
      case 'Failed': return 'error'
      case 'Running': return 'orange'
      default: return 'default'
    }
  }

  const kpis = [
    { label: 'Toplam Calistirma', value: statusData?.totalRuns?.toString() || '0', icon: Workflow, color: 'text-blue-600 bg-blue-50' },
    { label: 'Basari Orani', value: statusData ? `%${statusData.successRate?.toFixed(0)}` : '—', icon: Workflow, color: 'text-green-600 bg-green-50' },
    { label: 'Son Durum', value: statusData?.lastRunStatus || '—', icon: Workflow, color: 'text-orange-600 bg-orange-50' },
    { label: 'Aktif', value: statusData?.isRunning ? 'Evet' : 'Hayir', icon: Workflow, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Pipeline</h1>
          <p className="text-[14px] text-slate-400 mt-1">Veri isleme pipeline durumu ve manuel tetikleme</p>
        </div>
        <button onClick={handleTrigger} disabled={isTriggering || statusData?.isRunning} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all">
          {isTriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Pipeline Calistir
        </button>
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

          {statusData?.lastRunAt && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="text-[13px] text-slate-600">Son calistirma: <span className="font-semibold text-slate-800">{statusData.lastRunAt}</span></span>
            </div>
          )}

          {/* Pipeline Adimlari */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[15px] font-semibold text-slate-800">Pipeline Adimlari</h3>
            </div>
            {steps.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {steps.map((step, i) => (
                  <div key={step.name} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[13px] font-bold text-slate-500">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {stepStatusIcon(step.status)}
                        <span className="text-[13px] font-semibold text-slate-800">{step.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Son calistirma: {step.lastRun}</span>
                    </div>
                    <span className="text-[12px] text-slate-500">{step.duration}</span>
                    <Badge variant={stepStatusVariant(step.status)}>{step.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-[14px] text-slate-400">Veri bulunamadi</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
