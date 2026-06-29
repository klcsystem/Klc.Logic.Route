import { RotateCcw, Loader2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface ReturnRequest {
  id: string
  orderNumber: string
  customerName: string
  reason: string
  status: string
  requestDate: string
  pickupDate: string | null
  refundAmount: number
  itemCount: number
}

const returnsApi = {
  getAll: () => api.get('/returns').then(r => r.data),
}

export default function ReturnsPage() {
  const { data: returnsData, isLoading } = useApi<{ items: ReturnRequest[]; totalCount: number }>(
    () => returnsApi.getAll(),
    [],
  )
  const returns: ReturnRequest[] = returnsData?.items || []

  const pendingCount = returns.filter(r => r.status === 'Pending').length
  const completedCount = returns.filter(r => r.status === 'Completed').length
  const totalRefund = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0)

  const kpis = [
    { label: 'Toplam Iade', value: returns.length.toString(), icon: RotateCcw, color: 'text-blue-600 bg-blue-50' },
    { label: 'Bekleyen', value: pendingCount.toString(), icon: RotateCcw, color: 'text-amber-600 bg-amber-50' },
    { label: 'Tamamlanan', value: completedCount.toString(), icon: RotateCcw, color: 'text-green-600 bg-green-50' },
    { label: 'Toplam Iade Tutari', value: `${totalRefund.toLocaleString()} TRY`, icon: RotateCcw, color: 'text-red-600 bg-red-50' },
  ]

  const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info' | 'orange'> = {
    Pending: 'warning',
    Approved: 'info',
    InTransit: 'orange',
    Completed: 'success',
    Rejected: 'error',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Iade Yonetimi</h1>
        <p className="text-[14px] text-slate-400 mt-1">Iade talepleri ve ters lojistik sureclerini yonetin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800">Iade Talepleri</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Siparis No</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Musteri</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sebep</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Adet</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Iade Tutari</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Talep Tarihi</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Toplama Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && returns.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{r.orderNumber}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{r.customerName}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{r.reason}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{r.itemCount}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{r.refundAmount?.toLocaleString()} TRY</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={statusVariant[r.status] || 'default'}>{r.status}</Badge></td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{r.requestDate}</td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{r.pickupDate || '—'}</td>
                </tr>
              ))}
              {!isLoading && returns.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-[14px] text-slate-400">Veri bulunamadi</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
