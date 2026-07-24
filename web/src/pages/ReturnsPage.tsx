import { RotateCcw, Loader2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface ReturnRequest {
  id: string
  originalShipmentId: string | null
  orderId: string | null
  reason: string
  status: string
  pickupAddress: string | null
  requestedAt: string | null
  pickupDate: string | null
  receivedAt: string | null
  notes: string | null
}

const returnsApi = {
  getAll: () => api.get('/returns').then(r => r.data),
}

// Backend enum'lari string ad olarak donuyor (ReturnReason / ReturnStatus).
const reasonLabels: Record<string, string> = {
  Damaged: 'Hasarlı',
  WrongItem: 'Yanlış Ürün',
  Refused: 'Reddedildi',
  Other: 'Diğer',
}
const statusLabels: Record<string, string> = {
  Requested: 'Talep Edildi',
  PickupScheduled: 'Toplama Planlandı',
  InTransit: 'Yolda',
  Received: 'Teslim Alındı',
  Processed: 'İşlendi',
}
const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info' | 'orange'> = {
  Requested: 'warning',
  PickupScheduled: 'info',
  InTransit: 'orange',
  Received: 'info',
  Processed: 'success',
}
const completedStatuses = ['Received', 'Processed']

function fmtDate(v: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('tr-TR')
}

export default function ReturnsPage() {
  const { data: returnsData, isLoading } = useApi<ReturnRequest[] | { items: ReturnRequest[] }>(
    () => returnsApi.getAll(),
    [],
  )
  // useApi ApiResponse.data'yi zaten aciyor -> dizi gelir; eski {items} sekli icin de guvenli.
  const returns: ReturnRequest[] = Array.isArray(returnsData)
    ? returnsData
    : (returnsData?.items || [])

  const pendingCount = returns.filter(r => !completedStatuses.includes(r.status)).length
  const completedCount = returns.filter(r => completedStatuses.includes(r.status)).length
  const damagedCount = returns.filter(r => r.reason === 'Damaged').length

  const kpis = [
    { label: 'Toplam İade', value: returns.length.toString(), icon: RotateCcw, color: 'text-blue-600 bg-blue-50' },
    { label: 'Bekleyen', value: pendingCount.toString(), icon: RotateCcw, color: 'text-amber-600 bg-amber-50' },
    { label: 'Tamamlanan', value: completedCount.toString(), icon: RotateCcw, color: 'text-green-600 bg-green-50' },
    { label: 'Hasarlı İade', value: damagedCount.toString(), icon: RotateCcw, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">İade Yönetimi</h1>
        <p className="text-[14px] text-slate-400 mt-1">İade talepleri ve ters lojistik süreçlerini yönetin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800">İade Talepleri</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">İade No</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Toplama Adresi</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sebep</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Talep Tarihi</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Toplama Tarihi</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Not</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && returns.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">İADE-{r.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{r.pickupAddress || '—'}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{reasonLabels[r.reason] || r.reason}</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={statusVariant[r.status] || 'default'}>{statusLabels[r.status] || r.status}</Badge></td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{fmtDate(r.requestedAt)}</td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{fmtDate(r.pickupDate)}</td>
                  <td className="px-6 py-3.5 text-[12px] text-slate-500 max-w-xs truncate" title={r.notes || ''}>{r.notes || '—'}</td>
                </tr>
              ))}
              {!isLoading && returns.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-[14px] text-slate-400">Veri bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
