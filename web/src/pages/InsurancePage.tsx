import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, Loader2, Send, Building2, CheckCircle2, Clock, MapPin } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { shipmentsApi } from '../api/shipments'
import { toast } from '../components/ui/Toast'

interface Partner { id: string; name: string; hasApi: boolean; commissionPercent: number }
interface QuoteView {
  id: string; partnerId: string; partnerName: string | null
  shipmentId: string; shipmentNumber: string | null
  cargoValue: number; riskScore: number; premiumAmount: number | null
  currency: string; status: number
  originCity: string | null; destinationCity: string | null
  weightKg: number | null; isHazardous: boolean; requiresColdChain: boolean
}
interface Policy { id: string; partnerName?: string; policyNumber?: string; coverageType?: string; premium?: number; status?: string; endDate?: string }
interface ShipmentOpt { id: string; shipmentNumber?: string; originCity?: string; destinationCity?: string; totalWeightKg?: number; isHazardous?: boolean; requiresColdChain?: boolean }

const statusMeta: Record<number, { label: string; variant: 'info' | 'success' | 'warning' | 'default' }> = {
  0: { label: 'Bekleniyor', variant: 'warning' },
  1: { label: 'Teklif Geldi', variant: 'info' },
  2: { label: 'Kabul Edildi', variant: 'success' },
  3: { label: 'Süresi Doldu', variant: 'default' },
  4: { label: 'Reddedildi', variant: 'default' },
}

export default function InsurancePage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [quotes, setQuotes] = useState<QuoteView[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [shipments, setShipments] = useState<ShipmentOpt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [shipmentId, setShipmentId] = useState('')
  const [cargoValue, setCargoValue] = useState(0)
  const [isRequesting, setIsRequesting] = useState(false)
  const [acceptingId, setAcceptingId] = useState('')

  const load = useCallback(async () => {
    try {
      const [pRes, qRes, polRes, sRes] = await Promise.allSettled([
        api.get('/insurance/partners').then(r => r.data),
        api.get('/insurance/quotes').then(r => r.data),
        api.get('/insurance/policies').then(r => r.data),
        shipmentsApi.getAll({ pageSize: 100 }),
      ])
      if (pRes.status === 'fulfilled' && pRes.value?.data) setPartners(pRes.value.data)
      if (qRes.status === 'fulfilled' && qRes.value?.data) setQuotes(qRes.value.data)
      if (polRes.status === 'fulfilled') { const d = polRes.value?.data; setPolicies(Array.isArray(d) ? d : d?.items || []) }
      if (sRes.status === 'fulfilled') { const d = sRes.value?.data; setShipments((d?.items || d || []) as ShipmentOpt[]) }
    } finally {
      setIsLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const selectedShipment = shipments.find(s => s.id === shipmentId)

  const handleRequest = async () => {
    if (!shipmentId) { toast('warning', 'Önce bir sevkiyat seçin'); return }
    if (!cargoValue || cargoValue <= 0) { toast('warning', 'Kargo değeri girin'); return }
    setIsRequesting(true)
    try {
      const res = await api.post('/insurance/request-quotes', {
        shipmentId,
        cargoValue,
        routeDistanceKm: 0,
        driverScore: 80,
        vehicleAgeYears: 3,
        isHazardous: selectedShipment?.isHazardous ?? false,
        requiresColdChain: selectedShipment?.requiresColdChain ?? false,
        currency: 'TRY',
      }).then(r => r.data)
      if (res.success) {
        toast('success', res.message || 'Teklif talebi gönderildi')
        setCargoValue(0); setShipmentId('')
        load()
      } else toast('error', res.message || 'Talep başarısız')
    } catch {
      toast('error', 'Teklif talebi gönderilemedi')
    } finally {
      setIsRequesting(false)
    }
  }

  const handleAccept = async (q: QuoteView) => {
    setAcceptingId(q.id)
    try {
      const res = await api.post(`/insurance/accept/${q.id}`).then(r => r.data)
      if (res.success) { toast('success', 'Teklif kabul edildi, poliçe oluşturuldu'); load() }
      else toast('error', res.message || 'Kabul başarısız')
    } catch {
      toast('error', 'Teklif kabul edilemedi')
    } finally {
      setAcceptingId('')
    }
  }

  const pendingCount = quotes.filter(q => q.status === 0).length
  const quotedCount = quotes.filter(q => q.status === 1).length
  const activePolicies = policies.filter(p => p.status === 'Active').length

  const kpis = [
    { label: 'Toplam Poliçe', value: policies.length.toString(), icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
    { label: 'Aktif Poliçe', value: activePolicies.toString(), icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
    { label: 'Bekleyen Teklif', value: pendingCount.toString(), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Gelen Teklif', value: quotedCount.toString(), icon: CheckCircle2, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sigorta Yönetimi</h1>
        <p className="text-[14px] text-slate-400 mt-1">Nakliyat sigortası: teklif iste, brokerlerden gelen teklifleri karşılaştır, poliçeleştir</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Aktif partnerler */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h3 className="text-[15px] font-semibold text-slate-800">Teklif İstenecek Sigortacılar / Brokerler</h3>
        </div>
        {partners.length === 0 ? (
          <p className="text-[13px] text-slate-400">Aktif sigorta partneri bulunamadı.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {partners.map(p => (
              <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                {p.name}
                <span className="text-[11px] text-slate-400">· %{p.commissionPercent} komisyon</span>
                {!p.hasApi && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Portal</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Teklif iste — sevkiyat sec */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Sigorta Teklifi Al</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Sevkiyat</label>
            <select value={shipmentId} onChange={e => setShipmentId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white">
              <option value="">Sevkiyat seçin…</option>
              {shipments.map(s => (
                <option key={s.id} value={s.id}>
                  {(s.shipmentNumber || s.id.slice(0, 8))} — {s.originCity || '?'} → {s.destinationCity || '?'}{s.isHazardous ? ' ⚠' : ''}{s.requiresColdChain ? ' ❄' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Kargo Değeri (TRY)</label>
            <input type="number" value={cargoValue || ''} onChange={e => setCargoValue(Number(e.target.value))} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white" />
          </div>
        </div>
        <button onClick={handleRequest} disabled={isRequesting} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all">
          {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {partners.length ? `${partners.length} sigortacıya teklif iste` : 'Teklif İste'}
        </button>
      </div>

      {/* Gelen teklifler */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800">Gelen Teklifler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sigortacı</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sevkiyat / Rota</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Teminat</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prim</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && quotes.map(q => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{q.partnerName || '—'}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">
                    <div className="font-medium text-slate-700">{q.shipmentNumber || q.shipmentId.slice(0, 8)}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{[q.originCity, q.destinationCity].filter(Boolean).join(' → ') || '—'}</div>
                  </td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{q.cargoValue.toLocaleString()} {q.currency}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] font-semibold text-slate-800">{q.premiumAmount != null ? `${q.premiumAmount.toLocaleString()} ${q.currency}` : '—'}</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={statusMeta[q.status]?.variant || 'default'}>{statusMeta[q.status]?.label || q.status}</Badge></td>
                  <td className="px-6 py-3.5 text-center">
                    {q.status === 1 ? (
                      <button onClick={() => handleAccept(q)} disabled={acceptingId === q.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-[12px] font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                        {acceptingId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Kabul Et
                      </button>
                    ) : <span className="text-[11px] text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
              {!isLoading && quotes.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-[14px] text-slate-400">Henüz teklif talebi yok. Yukarıdan bir sevkiyat için teklif isteyin.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policeler */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800">Aktif Poliçeler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sigortacı</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Poliçe No</th>
                <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prim</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && policies.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{p.partnerName || '—'}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{p.policyNumber || '—'}</td>
                  <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{p.premium?.toLocaleString() || 0} TRY</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={p.status === 'Active' ? 'success' : 'default'}>{p.status || '—'}</Badge></td>
                </tr>
              ))}
              {!isLoading && policies.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-[14px] text-slate-400">Henüz poliçe yok.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
