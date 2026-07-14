import { useState, useCallback, useEffect } from 'react'
import { ShieldCheck, Loader2, LogOut, Send, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import api from '../api/client'

// Sigorta broker portalı — Kronos gibi API'si/yazılımcısı olmayan brokerler
// erişim kodu (apiKey) ile giriş yapar, bekleyen sigorta taleplerini fiyatlar.
// Backend uçları AllowAnonymous + apiKey ile korunur (partner/requests, partner/submit-quote).

interface PartnerQuote {
  id: string
  shipmentId: string
  cargoValue: number
  riskScore: number
  premiumAmount: number | null
  currency: string
  validUntil: string | null
  status: string
}

const STORAGE_KEY = 'broker_access_code'

function riskLevel(score: number): { label: string; cls: string } {
  if (score < 40) return { label: 'Düşük Risk', cls: 'text-green-700 bg-green-50 border-green-200' }
  if (score < 65) return { label: 'Orta Risk', cls: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { label: 'Yüksek Risk', cls: 'text-red-700 bg-red-50 border-red-200' }
}

function fmtDate(d: number): string {
  return new Date(d).toISOString().slice(0, 10)
}

export default function BrokerPortalPage() {
  const [accessCode, setAccessCode] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || '')
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem(STORAGE_KEY))
  const [codeInput, setCodeInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [quotes, setQuotes] = useState<PartnerQuote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // quoteId -> girilen prim
  const [premiums, setPremiums] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  const loadRequests = useCallback(async (code: string) => {
    setIsLoading(true)
    try {
      const res = await api.get(`/insurance/partner/requests?apiKey=${encodeURIComponent(code)}`)
      const data = res.data
      if (data.success) setQuotes(Array.isArray(data.data) ? data.data : [])
    } catch {
      // 401 vb. — giriş ekranına düş
      setAuthed(false)
      localStorage.removeItem(STORAGE_KEY)
      setLoginError('Erişim kodu geçersiz veya oturum sona erdi.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed && accessCode) loadRequests(accessCode)
  }, [authed, accessCode, loadRequests])

  const handleLogin = async () => {
    const code = codeInput.trim()
    if (!code) return
    setIsLoggingIn(true)
    setLoginError('')
    try {
      const res = await api.get(`/insurance/partner/requests?apiKey=${encodeURIComponent(code)}`)
      if (res.data.success) {
        localStorage.setItem(STORAGE_KEY, code)
        setAccessCode(code)
        setQuotes(Array.isArray(res.data.data) ? res.data.data : [])
        setAuthed(true)
      } else {
        setLoginError(res.data.message || 'Erişim kodu geçersiz.')
      }
    } catch {
      setLoginError('Erişim kodu geçersiz. Lütfen kontrol edip tekrar deneyin.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAccessCode('')
    setAuthed(false)
    setCodeInput('')
    setQuotes([])
  }

  const handleSubmitQuote = async (q: PartnerQuote) => {
    const raw = premiums[q.id]
    const premium = Number(raw)
    if (!premium || premium <= 0) return
    setSubmitting(prev => ({ ...prev, [q.id]: true }))
    try {
      const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const res = await api.post('/insurance/partner/submit-quote', {
        apiKey: accessCode,
        quoteId: q.id,
        premiumAmount: premium,
        validUntil,
      })
      if (res.data.success) {
        // Fiyatlanan talep listeden düşer
        setQuotes(prev => prev.filter(x => x.id !== q.id))
      }
    } catch {
      /* sessiz geç — kullanıcı tekrar dener */
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
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sigorta Broker Portalı</h1>
            <p className="text-[13px] text-slate-500 mt-1.5">Bekleyen nakliyat sigortası taleplerini görüntüleyin ve fiyatlandırın.</p>
          </div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Erişim Kodu</label>
          <input
            type="text"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
            placeholder="Örn. KRONOS-2026-XXXX"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
          />
          {loginError && <p className="text-[12px] text-red-500 mt-2">{loginError}</p>}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn || !codeInput.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-[14px] font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Giriş Yap
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-5">Erişim kodunuz yoksa lojistik firmanız ile iletişime geçin.</p>
        </div>
      </div>
    )
  }

  // ── Portal ──
  const totalCoverage = quotes.reduce((s, q) => s + (q.cargoValue || 0), 0)
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 leading-tight">Sigorta Broker Portalı</h1>
              <p className="text-[11px] text-slate-400">Nakliyat sigortası talep yönetimi</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Özet */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Package className="w-5 h-5 text-indigo-600" /></div>
            <div><p className="text-[12px] text-slate-400">Bekleyen Talep</p><p className="text-[20px] font-bold text-slate-900">{quotes.length}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-[12px] text-slate-400">Toplam Teminat Değeri</p><p className="text-[20px] font-bold text-slate-900">{totalCoverage.toLocaleString()} TRY</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-[12px] text-slate-400">Ort. Risk Skoru</p><p className="text-[20px] font-bold text-slate-900">{quotes.length ? Math.round(quotes.reduce((s, q) => s + q.riskScore, 0) / quotes.length) : 0}</p></div>
          </div>
        </div>

        <h2 className="text-[15px] font-semibold text-slate-800 mb-3">Bekleyen Sigorta Talepleri</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : quotes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 py-16 text-center">
            <ShieldCheck className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-[14px] text-slate-400">Şu an bekleyen talep yok. Yeni talepler burada görünecek.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map(q => {
              const rl = riskLevel(q.riskScore)
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-200/60 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-slate-800">Sevkiyat #{q.shipmentId.slice(0, 8).toUpperCase()}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${rl.cls}`}>{rl.label} · {q.riskScore}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-slate-500 mt-2">
                        <span>Teminat Değeri: <b className="text-slate-700">{q.cargoValue.toLocaleString()} {q.currency}</b></span>
                        <span>Risk Skoru: <b className="text-slate-700">{q.riskScore}/100</b></span>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Prim (TRY)</label>
                        <input
                          type="number"
                          value={premiums[q.id] || ''}
                          onChange={e => setPremiums(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="0"
                          className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                        />
                      </div>
                      <button
                        onClick={() => handleSubmitQuote(q)}
                        disabled={submitting[q.id] || !premiums[q.id] || Number(premiums[q.id]) <= 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting[q.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Teklif Gönder
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3">Geçerlilik: Teklif 7 gün geçerli olacaktır · Son güncelleme {fmtDate(Date.now())}</p>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
