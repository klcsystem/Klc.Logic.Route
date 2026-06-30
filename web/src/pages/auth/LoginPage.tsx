import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../i18n'
import { Navigation, Mail, Lock, AlertCircle, Loader2, MapPin, Truck, BarChart3, Building2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenant, setTenant] = useState(localStorage.getItem('X-Tenant-Id') || '00000000-0000-0000-0000-000000000001')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      localStorage.setItem('X-Tenant-Id', tenant)
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.login.error
      setError(message || t.login.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    { icon: Navigation, text: t.login.feature1 },
    { icon: MapPin, text: t.login.feature2 },
    { icon: Truck, text: t.login.feature3 },
    { icon: BarChart3, text: t.login.feature4 },
  ]

  return (
    <div className="min-h-screen flex bg-[#f5f5f7]">
      {/* Sol Panel — Tanitim */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#111827] relative overflow-hidden">
        {/* Arka plan dekorasyon */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-80 h-80 bg-orange-400/[0.08] rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/[0.08] rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-orange-400/[0.05] rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />
        </div>

        <div className="relative flex flex-col justify-center px-16 z-10 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3.5 mb-14">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-400/10">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Logic.Route</h1>
              <p className="text-[11px] text-orange-400/70 uppercase tracking-[0.2em] font-medium">{t.sidebar.routeOptimization}</p>
            </div>
          </div>

          {/* Baslik */}
          <h2 className="text-[42px] font-bold text-white leading-[1.15] tracking-tight mb-5">
            {t.login.heroTitle}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">{t.login.heroHighlight}</span> {t.login.heroSubtitle}
          </h2>
          <p className="text-blue-200/40 text-[15px] mb-12 leading-relaxed max-w-lg font-light">
            {t.login.heroDescription}
          </p>

          {/* Ozellikler */}
          <div className="space-y-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-orange-400/10 group-hover:border-orange-400/20 transition-all duration-300">
                  <f.icon className="w-[18px] h-[18px] text-orange-400/80" />
                </div>
                <span className="text-blue-100/50 text-[14px]">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Alt bilgi */}
          <div className="mt-20 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['bg-orange-400', 'bg-blue-800', 'bg-orange-500'].map((bg, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 border-[#111827] flex items-center justify-center text-[9px] text-white font-bold`}>
                  {['KL', 'LR', 'RT'][i]}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-blue-300/30">KLC System</p>
          </div>
        </div>
      </div>

      {/* Sag Panel — Giris Formu */}
      <div className="flex-1 flex items-center justify-center px-6 relative">
        <div className="w-full max-w-[380px]">
          {/* Mobil logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 mb-4 shadow-lg shadow-orange-400/10">
              <Navigation className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Logic.Route</h1>
            <p className="text-slate-500 text-sm mt-1">{t.sidebar.routeOptimization}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8">
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight mb-1">{t.login.title}</h2>
            <p className="text-[14px] text-slate-400 mb-7">{t.login.subtitle}</p>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">Firma / Tenant</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={tenant}
                    onChange={(e) => setTenant(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all duration-200 text-[14px] bg-slate-50/50 focus:bg-white appearance-none"
                  >
                    <option value="00000000-0000-0000-0000-000000000001">Varsayılan Firma</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.login.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all duration-200 text-[14px] bg-slate-50/50 focus:bg-white placeholder:text-slate-400"
                    placeholder={t.login.emailPlaceholder}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.login.password}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all duration-200 text-[14px] bg-slate-50/50 focus:bg-white placeholder:text-slate-400"
                    placeholder={t.login.passwordPlaceholder}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-600 focus:ring-2 focus:ring-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-[14px] shadow-lg shadow-orange-400/10 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? t.login.submitting : t.login.submit}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}
