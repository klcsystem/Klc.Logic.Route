import { MessageSquare, Star, Loader2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface Feedback {
  id: string
  customerName: string
  orderId: string | null
  rating: number
  comment: string
  feedbackType: string
  submittedAt: string | null
  createdAt: string
}

// Backend /feedback/summary sekli: averageRating + totalCount + ratingNCount.
interface FeedbackSummary {
  averageRating: number
  totalCount: number
  rating1Count: number
  rating2Count: number
  rating3Count: number
  rating4Count: number
  rating5Count: number
}

const feedbackApi = {
  getAll: () => api.get('/feedback').then(r => r.data),
  getSummary: () => api.get('/feedback/summary').then(r => r.data),
}

const typeLabels: Record<string, string> = {
  Product: 'Ürün',
  Delivery: 'Teslimat',
  Driver: 'Sürücü',
  Service: 'Hizmet',
  Other: 'Diğer',
}

function fmtDate(v: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('tr-TR')
}

export default function FeedbackPage() {
  const { data: feedbackData, isLoading } = useApi<Feedback[] | { items: Feedback[] }>(
    () => feedbackApi.getAll(),
    [],
  )
  const { data: summaryData } = useApi<FeedbackSummary>(
    () => feedbackApi.getSummary(),
    [],
  )

  // useApi ApiResponse.data'yi zaten aciyor -> dizi gelir.
  const feedbacks: Feedback[] = Array.isArray(feedbackData)
    ? feedbackData
    : (feedbackData?.items || [])

  const total = summaryData?.totalCount ?? feedbacks.length
  const positive = (summaryData?.rating4Count ?? 0) + (summaryData?.rating5Count ?? 0)
  const negative = (summaryData?.rating1Count ?? 0) + (summaryData?.rating2Count ?? 0)
  const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0
  const negativePct = total > 0 ? Math.round((negative / total) * 100) : 0

  const kpis = [
    { label: 'Toplam Geri Bildirim', value: total.toString(), icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { label: 'Ortalama Puan', value: summaryData ? `${(summaryData.averageRating ?? 0).toFixed(1)}/5` : '—', icon: Star, color: 'text-orange-600 bg-orange-50' },
    { label: 'Olumlu', value: summaryData ? `%${positivePct}` : '—', icon: MessageSquare, color: 'text-green-600 bg-green-50' },
    { label: 'Olumsuz', value: summaryData ? `%${negativePct}` : '—', icon: MessageSquare, color: 'text-red-600 bg-red-50' },
  ]

  const ratingVariant = (r: number): 'success' | 'warning' | 'error' => {
    if (r >= 4) return 'success'
    if (r >= 3) return 'warning'
    return 'error'
  }

  // Kategori dagilimi backend summary'de yok -> mevcut listeden (feedbackType) client-side hesapla.
  const categoryBreakdown = Object.values(
    feedbacks.reduce((acc, f) => {
      const key = f.feedbackType || 'Other'
      if (!acc[key]) acc[key] = { category: typeLabels[key] || key, count: 0, sum: 0 }
      acc[key].count += 1
      acc[key].sum += f.rating || 0
      return acc
    }, {} as Record<string, { category: string; count: number; sum: number }>),
  ).map(c => ({ category: c.category, count: c.count, avgRating: c.count ? c.sum / c.count : 0 }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Geri Bildirim</h1>
        <p className="text-[14px] text-slate-400 mt-1">Müşteri geri bildirimleri ve memnuniyet analizi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Kategori Dağılımı */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Kategori Bazında Analiz</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryBreakdown.map(cat => (
              <div key={cat.category} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-[13px] font-medium text-slate-700">{cat.category}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[18px] font-bold text-slate-900">{cat.count}</span>
                  <Badge variant={ratingVariant(cat.avgRating)}>{cat.avgRating.toFixed(1)}/5</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geri Bildirim Listesi */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800">Son Geri Bildirimler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Müşteri</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Puan</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Yorum</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kategori</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && feedbacks.map(f => {
                const rc = Math.max(0, Math.min(5, Math.round(f.rating || 0)))
                return (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{f.customerName || '—'}</td>
                    <td className="px-6 py-3.5 text-center">
                      <Badge variant={ratingVariant(rc)}>
                        {'★'.repeat(rc)}{'☆'.repeat(5 - rc)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-600 max-w-xs truncate" title={f.comment || ''}>{f.comment || '—'}</td>
                    <td className="px-6 py-3.5 text-center"><Badge variant="default">{typeLabels[f.feedbackType] || f.feedbackType || '—'}</Badge></td>
                    <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{fmtDate(f.submittedAt || f.createdAt)}</td>
                  </tr>
                )
              })}
              {!isLoading && feedbacks.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-[14px] text-slate-400">Veri bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
