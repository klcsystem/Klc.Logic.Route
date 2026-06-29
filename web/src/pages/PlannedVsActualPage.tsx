import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Clock, MapPin, TrendingUp } from 'lucide-react'
import Badge from '../components/ui/Badge'
import { useApi } from '../utils/useApi'
import api from '../api/client'

interface StopComparison {
  stopId: string
  shipmentId: string | null
  shipmentNumber: string | null
  stopOrder: number
  address: string | null
  plannedArrival: string | null
  plannedDeparture: string | null
  actualArrival: string | null
  actualDelivery: string | null
  delayMinutes: number | null
  status: 'OnTime' | 'Late' | 'Early' | 'NoData'
}

interface RouteComparison {
  routeId: string
  vehiclePlate: string | null
  plannedDistanceKm: number
  plannedDurationMinutes: number
  actualDistanceKm: number
  actualDurationMinutes: number
  distanceVarianceKm: number
  durationVarianceMinutes: number
  stops: StopComparison[]
}

interface PlannedVsActualReport {
  optimizationId: string
  optimizationName: string
  generatedAt: string
  plannedTotalDistanceKm: number
  plannedTotalDurationMinutes: number
  plannedVehicleCount: number
  plannedStopCount: number
  actualTotalDistanceKm: number
  actualTotalDurationMinutes: number
  actualDeliveredCount: number
  distanceVarianceKm: number
  distanceVariancePercent: number
  durationVarianceMinutes: number
  durationVariancePercent: number
  onTimeDeliveryRate: number
  averageDelayMinutes: number
  maxDelayMinutes: number
  onTimeCount: number
  lateCount: number
  noDataCount: number
  routes: RouteComparison[]
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
      <div className="text-[12px] text-slate-400 mb-1">{label}</div>
      <div className={`text-[24px] font-bold ${color || 'text-slate-900'}`}>{value}</div>
      {sub && <div className="text-[12px] text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

const statusVariant: Record<string, 'success' | 'error' | 'info' | 'default'> = {
  OnTime: 'success',
  Late: 'error',
  Early: 'info',
  NoData: 'default',
}

const statusLabel: Record<string, string> = {
  OnTime: 'Zamaninda',
  Late: 'Gecikme',
  Early: 'Erken',
  NoData: 'Veri Yok',
}

function formatDateTime(dt: string | null): string {
  if (!dt) return '-'
  const d = new Date(dt)
  return d.toLocaleString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatMinutes(mins: number | null): string {
  if (mins == null) return '-'
  const abs = Math.abs(mins)
  if (abs < 60) return `${Math.round(mins)} dk`
  const h = Math.floor(abs / 60)
  const m = Math.round(abs % 60)
  const sign = mins < 0 ? '-' : ''
  return `${sign}${h}s ${m}dk`
}

export default function PlannedVsActualPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: report, isLoading, error } = useApi<PlannedVsActualReport>(
    () => api.get(`/route-optimization/planned-vs-actual/${id}`).then(r => r.data),
    [id]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-[14px]">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-[14px]">
          {error || 'Rapor bulunamadi'}
        </div>
      </div>
    )
  }

  const allStops = report.routes.flatMap(r => r.stops)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Planlanan vs Gerceklesen</h1>
          <p className="text-[14px] text-slate-400 mt-0.5">{report.optimizationName} - {new Date(report.generatedAt).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Zamaninda Teslimat Orani"
          value={`${report.onTimeDeliveryRate.toFixed(1)}%`}
          sub={`${report.onTimeCount} / ${report.plannedStopCount} durak`}
          color={report.onTimeDeliveryRate >= 90 ? 'text-green-600' : report.onTimeDeliveryRate >= 70 ? 'text-amber-600' : 'text-red-600'}
        />
        <StatCard
          label="Ortalama Gecikme"
          value={formatMinutes(report.averageDelayMinutes)}
          sub={`Maks: ${formatMinutes(report.maxDelayMinutes)}`}
          color={report.averageDelayMinutes <= 5 ? 'text-green-600' : report.averageDelayMinutes <= 15 ? 'text-amber-600' : 'text-red-600'}
        />
        <StatCard
          label="Mesafe Farki"
          value={`${report.distanceVarianceKm.toFixed(1)} km`}
          sub={`${report.distanceVariancePercent >= 0 ? '+' : ''}${report.distanceVariancePercent.toFixed(1)}%`}
        />
        <StatCard
          label="Sure Farki"
          value={formatMinutes(report.durationVarianceMinutes)}
          sub={`${report.durationVariancePercent >= 0 ? '+' : ''}${report.durationVariancePercent.toFixed(1)}%`}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="text-[13px] font-semibold text-slate-700">Mesafe</span>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-slate-500">Planlanan</span><span className="font-medium">{report.plannedTotalDistanceKm.toFixed(1)} km</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Gerceklesen</span><span className="font-medium">{report.actualTotalDistanceKm.toFixed(1)} km</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[13px] font-semibold text-slate-700">Sure</span>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-slate-500">Planlanan</span><span className="font-medium">{formatMinutes(report.plannedTotalDurationMinutes)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Gerceklesen</span><span className="font-medium">{formatMinutes(report.actualTotalDurationMinutes)}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-[13px] font-semibold text-slate-700">Teslimat</span>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-slate-500">Zamaninda</span><span className="font-medium text-green-600">{report.onTimeCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Gecikme</span><span className="font-medium text-red-600">{report.lateCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Veri Yok</span><span className="font-medium text-slate-400">{report.noDataCount}</span></div>
          </div>
        </div>
      </div>

      {/* Stops Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-semibold text-slate-800">Durak Detaylari</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">#</th>
                <th className="px-4 py-3 font-medium text-slate-500">Arac</th>
                <th className="px-4 py-3 font-medium text-slate-500">Gonderi</th>
                <th className="px-4 py-3 font-medium text-slate-500">Planlanan Varis</th>
                <th className="px-4 py-3 font-medium text-slate-500">Gercek Varis</th>
                <th className="px-4 py-3 font-medium text-slate-500">Gecikme</th>
                <th className="px-4 py-3 font-medium text-slate-500">Durum</th>
              </tr>
            </thead>
            <tbody>
              {report.routes.map(route =>
                route.stops.map((stop) => (
                  <tr key={stop.stopId} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-400">{stop.stopOrder}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{route.vehiclePlate || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{stop.shipmentNumber || stop.address || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(stop.plannedArrival)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(stop.actualArrival)}</td>
                    <td className="px-4 py-3">
                      {stop.delayMinutes != null ? (
                        <span className={stop.delayMinutes > 0 ? 'text-red-600 font-medium' : stop.delayMinutes < 0 ? 'text-green-600 font-medium' : 'text-slate-600'}>
                          {stop.delayMinutes > 0 ? '+' : ''}{formatMinutes(stop.delayMinutes)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[stop.status] || 'default'}>
                        {statusLabel[stop.status] || stop.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
              {allStops.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Durak verisi bulunamadi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
