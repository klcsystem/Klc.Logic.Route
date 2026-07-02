import { useState } from 'react'
import { ShieldCheck, Loader2, Send } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface Policy {
  id: string
  partnerName: string
  policyNumber: string
  coverageType: string
  premium: number
  status: string
  startDate: string
  endDate: string
}

interface Quote {
  id: string
  partnerName: string
  premium: number
  coverage: number
  status: string
  createdAt: string
}

const policiesApi = {
  getAll: () => api.get('/insurance/policies').then(r => r.data),
}

const quotesApi = {
  requestQuote: (data: { cargoType: string; value: number; origin: string; destination: string }) =>
    api.post('/insurance/request-quotes', data).then(r => r.data),
}

export default function InsurancePage() {
  const { data: policiesData, isLoading } = useApi<{ items: Policy[]; totalCount: number }>(
    () => policiesApi.getAll(),
    [],
  )
  const policies: Policy[] = policiesData?.items || []

  const [quoteForm, setQuoteForm] = useState({ cargoType: 'Genel', value: 0, origin: '', destination: '' })
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isRequesting, setIsRequesting] = useState(false)

  const handleRequestQuote = async () => {
    setIsRequesting(true)
    try {
      const res = await quotesApi.requestQuote(quoteForm)
      if (res.success && res.data) {
        setQuotes(Array.isArray(res.data) ? res.data : [res.data])
      }
    } catch {
      // API henüz hazir olmayabilir
    } finally {
      setIsRequesting(false)
    }
  }

  const activeCount = policies.filter(p => p.status === 'Active').length
  const totalPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0)

  const kpis = [
    { label: 'Toplam Police', value: policies.length.toString(), icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
    { label: 'Aktif Police', value: activeCount.toString(), icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
    { label: 'Toplam Prim', value: `${totalPremium.toLocaleString()} TRY`, icon: ShieldCheck, color: 'text-orange-600 bg-orange-50' },
    { label: 'Teklif Sayısı', value: quotes.length.toString(), icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sigorta Yönetimi</h1>
        <p className="text-[14px] text-slate-400 mt-1">Kargo sigortasi policeleri ve teklif yönetimi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Teklif Formu */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Sigorta Teklifi Al</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Kargo Tipi</label>
            <select value={quoteForm.cargoType} onChange={e => setQuoteForm({ ...quoteForm, cargoType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white">
              <option value="Genel">Genel</option>
              <option value="Kimyasal">Kimyasal</option>
              <option value="Soguk Zincir">Soguk Zincir</option>
              <option value="Elektronik">Elektronik</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Kargo Değeri (TRY)</label>
            <input type="number" value={quoteForm.value} onChange={e => setQuoteForm({ ...quoteForm, value: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Çıkış</label>
            <input type="text" value={quoteForm.origin} onChange={e => setQuoteForm({ ...quoteForm, origin: e.target.value })} placeholder="Istanbul" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Varış</label>
            <input type="text" value={quoteForm.destination} onChange={e => setQuoteForm({ ...quoteForm, destination: e.target.value })} placeholder="Ankara" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" />
          </div>
        </div>
        <button onClick={handleRequestQuote} disabled={isRequesting} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all">
          {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Teklif Iste
        </button>

        {quotes.length > 0 && (
          <div className="mt-4 space-y-2">
            {quotes.map(q => (
              <div key={q.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[13px] font-medium text-slate-800">{q.partnerName}</span>
                  <span className="text-[12px] text-slate-400 ml-3">Kapsam: {q.coverage?.toLocaleString()} TRY</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-slate-700">{q.premium?.toLocaleString()} TRY</span>
                  <Badge variant="info">{q.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policeler Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800">Aktif Policeler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Partner</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Police No</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kapsam</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prim</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bitis</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && policies.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{p.partnerName}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{p.policyNumber}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{p.coverageType}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{p.premium?.toLocaleString()} TRY</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={p.status === 'Active' ? 'success' : 'default'}>{p.status}</Badge></td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{p.endDate}</td>
                </tr>
              ))}
              {!isLoading && policies.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-[14px] text-slate-400">Veri bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
