import { Shield, AlertTriangle, Loader2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface SafetyDashboard {
  totalDrivers: number
  safeDrivers: number
  atRiskDrivers: number
  averageSafetyScore: number
  totalIncidents: number
  fatigueAlerts: number
}

interface SafetyAlert {
  id: string
  driverName: string
  alertType: string
  severity: string
  message: string
  createdAt: string
  resolved: boolean
}

const safetyApi = {
  getDashboard: () => api.get('/safety/dashboard').then(r => r.data),
  getAlerts: () => api.get('/safety/alerts').then(r => r.data),
}

export default function SafetyDashboardPage() {
  const { data: dashboardData, isLoading: dashLoading } = useApi<SafetyDashboard>(
    () => safetyApi.getDashboard(),
    [],
  )
  const { data: alertsData, isLoading: alertsLoading } = useApi<{ items: SafetyAlert[] }>(
    () => safetyApi.getAlerts(),
    [],
  )

  const isLoading = dashLoading || alertsLoading
  const alerts: SafetyAlert[] = alertsData?.items || []

  const kpis = [
    { label: 'Toplam Sürücü', value: dashboardData?.totalDrivers?.toString() || '0', icon: Shield, color: 'text-blue-600 bg-blue-50' },
    { label: 'Güvenli Sürücü', value: dashboardData?.safeDrivers?.toString() || '0', icon: Shield, color: 'text-green-600 bg-green-50' },
    { label: 'Risk Altinda', value: dashboardData?.atRiskDrivers?.toString() || '0', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Ort. Güvenlik Skoru', value: dashboardData ? `${dashboardData.averageSafetyScore ?? 0}/100` : '—', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  ]

  const severityVariant: Record<string, 'default' | 'warning' | 'error' | 'info'> = {
    Low: 'info',
    Medium: 'warning',
    High: 'error',
    Critical: 'error',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sürücü Güvenlik Paneli</h1>
        <p className="text-[14px] text-slate-400 mt-1">Sürücü sağlık durumu, yorgünlük uyarıları ve filo güvenlik metrikleri</p>
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
            {/* Olay Özeti */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Olay Özeti</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200/60">
                  <span className="text-[13px] font-medium text-red-800">Toplam Olay</span>
                  <span className="text-[18px] font-bold text-red-700">{dashboardData?.totalIncidents || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                  <span className="text-[13px] font-medium text-amber-800">Yorgünlük Uyarısı</span>
                  <span className="text-[18px] font-bold text-amber-700">{dashboardData?.fatigueAlerts || 0}</span>
                </div>
              </div>
            </div>

            {/* Güvenlik Skoru Dağılımı */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Güvenlik Skoru</h3>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={dashboardData && dashboardData.averageSafetyScore >= 70 ? '#22c55e' : '#f59e0b'} strokeWidth="3" strokeDasharray={`${dashboardData?.averageSafetyScore || 0}, 100`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[24px] font-bold text-slate-900">{dashboardData?.averageSafetyScore || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Uyari Listesi */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[15px] font-semibold text-slate-800">Son Uyarılar</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sürücü</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Uyarı Tipi</th>
                    <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ciddiyet</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mesaj</th>
                    <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                    <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(a => (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{a.driverName}</td>
                      <td className="px-6 py-3.5 text-[13px] text-slate-600">{a.alertType}</td>
                      <td className="px-6 py-3.5 text-center"><Badge variant={severityVariant[a.severity] || 'default'}>{a.severity}</Badge></td>
                      <td className="px-6 py-3.5 text-[13px] text-slate-600 max-w-xs truncate">{a.message}</td>
                      <td className="px-6 py-3.5 text-center"><Badge variant={a.resolved ? 'success' : 'warning'}>{a.resolved ? 'Çözüldü' : 'Aktif'}</Badge></td>
                      <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{a.createdAt}</td>
                    </tr>
                  ))}
                  {alerts.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-[14px] text-slate-400">Veri bulunamadı</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
