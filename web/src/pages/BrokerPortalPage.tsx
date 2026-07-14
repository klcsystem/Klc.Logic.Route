import { useState, useCallback, useEffect } from 'react'
import { ShieldCheck, Loader2, LogOut, Send, Package, AlertTriangle, MapPin, Snowflake, Flame, CheckCircle2, Clock } from 'lucide-react'

// Sigorta broker portalı — Kronos gibi API'siz brokerler için.
// Bireysel giriş (e-posta/şifre → JWT), her teklif verene atfedilir (hesap verebilirlik).
// Global axios interceptor'ının 401→/login yönlendirmesine takılmamak için fetch kullanılır.

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:1641/api')
const TOKEN_KEY = 'broker_token'
const NAME_KEY = 'broker_name'
const PARTNER_KEY = 'broker_partner'

interface QuoteView {
  id: string
  shipmentId: string
  shipmentNumber: string | null
  cargoValue: number
  riskScore: number
  premiumAmount: number | null
  currency: string
  status: number            // 0=Pending 1=Quoted 2=Accepted
  validUntil: string | null
  quotedByName: string | null
  createdAt: string
  originCity: string | null
  destinationCity: string | null
  originAddress: string | null
  destinationAddress: string | null
  weightKg: number | null
  volumeM3: number | null
  isHazardous: boolean
  requiresColdChain: boolean
}

function riskLevel(score: number): { label: string; cls: string } {
  if (score < 40) return { label: 'Düşük Risk', cls: 'text-green-700 bg-green-50 border-green-200' }
  if (score < 65) return { label: 'Orta Risk', cls: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { label: 'Yüksek Risk', cls: 'text-red-700 bg-red-50 border-red-200' }
}

async function brokerFetch(path: string, opts: { method?: string; body?: unknown; token?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Tenant-Id': '00000000-0000-0000-0000-000000000001' }
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export default function BrokerPortalPage() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || '')
  const [brokerName, setBrokerName] = useState<string>(() => localStorage.getItem(NAME_KEY) || '')
  const [partnerName, setPartnerName] = useState<string>(() => localStorage.getItem(PARTNER_KEY) || '')
  const authed = !!token

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [quotes, setQuotes] = useState<QuoteView[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [tab, setTab] = useState<'pending' | 'given'>('pending')
  const [premiums, setPremiums] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(NAME_KEY); localStorage.removeItem(PARTNER_KEY)
    setToken(''); setBrokerName(''); setPartnerName(''); setQuotes([])
  }, [])

  const loadQuotes = useCallback(async (tk: string) => {
    setIsLoading(true)
    try {
      const { ok, data } = await brokerFetch('/insurance/broker/quotes', { token: tk })
      if (ok && data.success) setQuotes(Array.isArray(data.data) ? data.data : [])
      else if (!ok) logout()
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => { if (token) loadQuotes(token) }, [token, loadQuotes])

  const handleLogin = async () => {
    if (!email.trim() || !password) return
    setIsLoggingIn(true); setLoginError('')
    try {
      const { ok, data } = await brokerFetch('/insurance/broker/login', { method: 'POST', body: { email: email.trim(), password } })
      if (ok && data.success && data.data?.token) {
        const { token: tk, name, partnerName: pn } = data.data
        localStorage.setItem(TOKEN_KEY, tk); localStorage.setItem(NAME_KEY, name); localStorage.setItem(PARTNER_KEY, pn)
        setToken(tk); setBrokerName(name); setPartnerName(pn)
      } else {
        setLoginError(data.message || 'E-posta veya şifre hatalı.')
      }
    } catch {
      setLoginError('Giriş yapılamadı. Bağlantınızı kontrol edin.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleSubmit = async (q: QuoteView) => {
    const premium = Number(premiums[q.id])
    if (!premium || premium <= 0) return
    setSubmitting(prev => ({ ...prev, [q.id]: true }))
    try {
      const { ok } = await brokerFetch('/insurance/broker/submit-quote', {
        method: 'POST', token,
        body: { quoteId: q.id, premiumAmount: premium, validUntil: new Date(Date.now() + 7 * 864e5).toISOString() },
      })
      if (ok) await loadQuotes(token)
    } finally {
      setSubmitting(prev => ({ ...prev, [q.id]: false }))
    }
  }

  // ── Giriş ekranı ──
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4"><ShieldCheck className="w-7 h-7 text-white" /></div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sigorta Broker Portalı</h1>
            <p className="text-[13px] text-slate-500 mt-1.5">Nakliyat sigortası taleplerini görüntüleyin, değerlendirin ve fiyatlandırın.</p>
          </div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-2">E-posta</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ad@kronosbrokerlik.com" autoFocus
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 mb-3" />
          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Şifre</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogin() }} placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400" />
          {loginError && <p className="text-[12px] text-red-500 mt-2">{loginError}</p>}
          <button onClick={handleLogin} disabled={isLoggingIn || !email.trim() || !password}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-[14px] font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Giriş Yap
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-5">Hesabınız yoksa lojistik firmanız ile iletişime geçin.</p>
        </div>
      </div>
    )
  }

  const pending = quotes.filter(q => q.status === 0)
  const given = quotes.filter(q => q.status >= 1)
  const list = tab === 'pending' ? pending : given

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 leading-tight">{partnerName || 'Sigorta Broker Portalı'}</h1>
              <p className="text-[11px] text-slate-400">Nakliyat sigortası · {brokerName}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Sekmeler */}
        <div className="flex items-center gap-1 mb-5 border-b border-slate-200">
          <button onClick={() => setTab('pending')} className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${tab === 'pending' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Clock className="w-4 h-4" /> Bekleyen Talepler <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{pending.length}</span>
          </button>
          <button onClick={() => setTab('given')} className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${tab === 'given' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <CheckCircle2 className="w-4 h-4" /> Verdiğim Teklifler <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{given.length}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 py-16 text-center">
            <ShieldCheck className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-[14px] text-slate-400">{tab === 'pending' ? 'Bekleyen talep yok.' : 'Henüz teklif vermediniz.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(q => {
              const rl = riskLevel(q.riskScore)
              const route = [q.originCity, q.destinationCity].filter(Boolean).join(' → ') || 'Rota bilgisi yok'
              const statusLabel = q.status === 2 ? 'Kabul Edildi' : 'Teklif Verildi'
              const statusCls = q.status === 2 ? 'text-green-700 bg-green-50' : 'text-indigo-700 bg-indigo-50'
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-200/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-slate-800">{q.shipmentNumber || `Sevkiyat #${q.shipmentId.slice(0, 8).toUpperCase()}`}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${rl.cls}`}>{rl.label} · {q.riskScore}</span>
                        {q.isHazardous && <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-600"><Flame className="w-3 h-3" />Tehlikeli</span>}
                        {q.requiresColdChain && <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-600"><Snowflake className="w-3 h-3" />Soğuk Zincir</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-700 font-medium mb-2">
                        <MapPin className="w-4 h-4 text-indigo-400 shrink-0" /> {route}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5 text-slate-400" />Teminat: <b className="text-slate-700">{q.cargoValue.toLocaleString()} {q.currency}</b></span>
                        {q.weightKg != null && <span>Ağırlık: <b className="text-slate-700">{q.weightKg.toLocaleString()} kg</b></span>}
                        {q.volumeM3 != null && <span>Hacim: <b className="text-slate-700">{q.volumeM3} m³</b></span>}
                        <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" />Risk: <b className="text-slate-700">{q.riskScore}/100</b></span>
                      </div>
                    </div>

                    {q.status === 0 ? (
                      <div className="flex items-end gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Prim ({q.currency})</label>
                          <input type="number" value={premiums[q.id] || ''} onChange={e => setPremiums(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="0"
                            className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400" />
                        </div>
                        <button onClick={() => handleSubmit(q)} disabled={submitting[q.id] || !premiums[q.id] || Number(premiums[q.id]) <= 0}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          {submitting[q.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Teklif Ver
                        </button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">Verilen Prim</p>
                        <p className="text-[18px] font-bold text-slate-900">{q.premiumAmount?.toLocaleString()} {q.currency}</p>
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded ${statusCls}`}>{statusLabel}</span>
                      </div>
                    )}
                  </div>
                  {q.status >= 1 && q.quotedByName && (
                    <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">Teklifi veren: <b className="text-slate-600">{q.quotedByName}</b>{q.validUntil ? ` · Geçerlilik: ${q.validUntil.slice(0, 10)}` : ''}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
