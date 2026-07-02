import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Navigation, ArrowRight, Zap, Package,
  CheckCircle2, ChevronRight, Globe, Phone, Mail, MapPin, Smartphone,
  BarChart3, Link2, Satellite, Brain, Star, Menu, X
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const stats = [
    { value: '150+', label: 'Aktif Operasyon' },
    { value: '1M+', label: 'Tamamlanan Teslimat' },
    { value: '%25', label: 'Maliyet Tasarrufu' },
    { value: '%30', label: 'Zaman Tasarrufu' },
  ]

  const features = [
    {
      icon: Brain,
      title: 'Akıllı Rota Optimizasyonu',
      desc: 'OR-Tools ve AI destekli algoritma ile en verimli rotayı saniyeler içinde hesaplayın. Trafik, zaman penceresi ve araç kapasitesi otomatik hesaplanır.',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-600',
    },
    {
      icon: Satellite,
      title: 'Canlı Takip ve İzleme',
      desc: 'Gerçek zamanlı GPS takibi ile tüm filonuzu tek haritada izleyin. Gecikme uyarıları ve ETA hesaplamaları otomatik güncellenir.',
      color: 'from-cyan-500 to-teal-500',
      bg: 'bg-cyan-50',
      border: 'border-cyan-100',
      text: 'text-cyan-600',
    },
    {
      icon: Link2,
      title: 'ERP Entegrasyonu',
      desc: 'SAP, Logo, Netsis ve diğer ERP sistemleri ile otomatik entegrasyon. Siparişler anında akar, manuel veri girişi sıfır.',
      color: 'from-indigo-500 to-blue-500',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      text: 'text-indigo-600',
    },
    {
      icon: Smartphone,
      title: 'Sürücü Mobil Uygulama',
      desc: 'iOS ve Android uyumlu mobil uygulama. Rota navigasyonu, teslimat onaylama, dijital imza ve offline çalışma desteği.',
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      text: 'text-violet-600',
    },
    {
      icon: Package,
      title: 'Müşteri İzlenebilirliği',
      desc: 'Markalı takip sayfası ile müşterileriniz kargolarını canlı takip edebilir. SMS ve e-posta bildirimleri otomatik gönderilir.',
      color: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
    },
    {
      icon: BarChart3,
      title: 'Analitik Gösterge Paneli',
      desc: 'Performans metrikleri, maliyet analizleri ve verimlilik raporları. Veri odaklı kararlar alın, sürekli iyileştirin.',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-600',
    },
  ]

  const steps = [
    {
      num: '01',
      title: "ERP'nizi bağlayın",
      desc: 'Siparişler otomatik gelir. SAP, Logo veya Netsis entegrasyonunu 15 dakikada tamamlayın.',
      icon: Link2,
    },
    {
      num: '02',
      title: 'Rotaları optimize edin',
      desc: 'AI motoru en kısa, en verimli rotaları saniyeler içinde hesaplar. Trafik ve zaman kısıtlarını otomatik dikkate alır.',
      icon: Brain,
    },
    {
      num: '03',
      title: 'Sürücülere atayın',
      desc: 'Optimize edilmiş rotalar tek tıkla sürücülerin telefonlarına düşer. Navigasyon otomatik başlar.',
      icon: Smartphone,
    },
    {
      num: '04',
      title: 'Canlı takip edin',
      desc: 'Tüm teslimat sürecini gerçek zamanlı izleyin. Müşterileriniz de kendi takip linklerinden izleyebilir.',
      icon: MapPin,
    },
  ]


  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Logic Route</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-[13px] text-gray-500 hover:text-blue-600 transition-colors font-medium">Özellikler</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-[13px] text-gray-500 hover:text-blue-600 transition-colors font-medium">Nasıl Çalışır</button>
            <button onClick={() => navigate('/api-docs')} className="text-[13px] text-gray-500 hover:text-blue-600 transition-colors font-medium">API</button>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-[13px] text-gray-600 font-medium hover:text-blue-600 transition-colors">
              Giriş Yap
            </button>
            <button onClick={() => navigate('/onboarding')} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-200">
              Hemen Başlayın
            </button>
          </div>
          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
            <button onClick={() => scrollTo('features')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">Özellikler</button>
            <button onClick={() => scrollTo('how-it-works')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">Nasıl Çalışır</button>
            <button onClick={() => scrollTo('pricing')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">Fiyatlandırma</button>
            <button onClick={() => navigate('/api-docs')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">API</button>
            <hr className="border-gray-100" />
            <button onClick={() => navigate('/login')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">Giriş Yap</button>
            <button onClick={() => navigate('/onboarding')} className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold">Hemen Başlayın</button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-50 rounded-full" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-50/50 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-50/30 to-cyan-50/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-semibold mb-8">
                <Zap className="w-4 h-4" />
                AI Destekli Rota Optimizasyonu
              </div>
              <h1 className="text-4xl lg:text-[52px] font-extrabold leading-[1.1] tracking-tight text-gray-900 mb-6">
                Akıllı Rota Planlama ve{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Filo Yönetimi
                </span>{' '}
                Platformu
              </h1>
              <p className="text-[17px] text-gray-500 leading-relaxed mb-8 max-w-lg">
                OR-Tools AI motoru ile rotalarınızı optimize edin, filonuzu canlı takip edin,
                maliyetlerinizi %25 azaltın. Tek platform, sınırsız verimlilik.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={() => scrollTo('pricing')} className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 text-[15px] shadow-xl shadow-blue-200 flex items-center gap-2">
                  Demo Talep Et <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/onboarding')} className="px-7 py-3.5 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-all duration-200 text-[15px]">
                  Hemen Başlayın
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  14 gün ücretsiz deneme
                </div>
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Kredi kartı gerekmez
                </div>
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  7/24 destek
                </div>
              </div>
            </div>

            {/* Right - Route illustration mockup */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl shadow-gray-300/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-[11px] text-gray-500">Logic Route -- Rota Optimizasyonu</span>
                </div>
                {/* Mock route map */}
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 rounded-lg p-4 mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-6 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <div className="absolute top-12 right-10 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-8 left-1/3 w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '1.5s' }} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] text-blue-300">12 Durak Optimize Edildi</span>
                  </div>
                  <div className="space-y-2">
                    {['Depo Çıkış', 'Kadıköy #A1', 'Üsküdar #B3', 'Beşiktaş #C2', 'Şişli #D5'].map((stop, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${i === 0 ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] text-gray-400">{stop}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Mock stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Toplam Mesafe</p>
                    <p className="text-lg font-bold text-white">47 km</p>
                    <span className="text-[10px] text-green-400">-%32 optimizasyon</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Tahmini Süre</p>
                    <p className="text-lg font-bold text-cyan-400">2s 15dk</p>
                    <span className="text-[10px] text-green-400">-%28 tasarruf</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Yakıt Maliyeti</p>
                    <p className="text-lg font-bold text-blue-400">₺284</p>
                    <span className="text-[10px] text-green-400">-%25 azalma</span>
                  </div>
                </div>
                {/* Floating optimization card */}
                <div className="absolute -right-6 top-12 bg-white rounded-xl p-4 shadow-xl shadow-gray-200/50 w-52">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">AI Optimizasyon</p>
                      <p className="text-[13px] font-bold text-gray-800">Tamamlandı</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-[10px] text-gray-400">12 rota, 3 arac, 47 sipariş</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl lg:text-4xl font-extrabold text-white mb-1">{s.value}</p>
                <p className="text-[13px] text-blue-100 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] text-blue-600 font-semibold uppercase tracking-wider mb-3">Özellikler</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Neden <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Logic Route</span>?
            </h2>
            <p className="text-[16px] text-gray-400 max-w-xl mx-auto">
              End-to-end rota optimizasyonu ve filo yönetimi için ihtiyacınız olan her şey tek platformda.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className={`bg-white p-7 rounded-2xl border ${f.border} hover:shadow-lg transition-all duration-300 group`}>
                <div className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.text}`} />
                </div>
                <h3 className="text-[17px] font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] text-blue-600 font-semibold uppercase tracking-wider mb-3">Nasıl Çalışır?</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              4 Adımda Başlayın
            </h2>
            <p className="text-[16px] text-gray-400 max-w-xl mx-auto">
              ERP entegrasyonundan canlı takibe, 15 dakikada tam operasyonel olun.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">Adim {s.num}</div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed">{s.desc}</p>
                {i < 3 && (
                  <ChevronRight className="absolute top-8 -right-4 w-6 h-6 text-blue-200 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <span className="text-[16px] font-bold text-white">Logic Route</span>
              </div>
              <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
                Akıllı rota planlama ve filo yönetimi platformu. AI destekli optimizasyon ile maliyetlerinizi %25 azaltın.
              </p>
              <div className="flex items-center gap-3">
                {['LinkedIn', 'Twitter', 'GitHub'].map((s) => (
                  <span key={s} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[11px] text-gray-400 hover:bg-blue-600 hover:text-white cursor-pointer transition-all">
                    {s[0]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Ürün</h4>
              <div className="space-y-3">
                {['Rota Optimizasyonu', 'Canlı Takip', 'ERP Entegrasyon', 'Mobil Uygulama', 'Analitik Panel', 'Müşteri Portalı'].map((item) => (
                  <p key={item} className="text-[13px] text-gray-400 hover:text-blue-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Kaynaklar</h4>
              <div className="space-y-3">
                <p onClick={() => navigate('/api-docs')} className="text-[13px] text-gray-400 hover:text-blue-400 cursor-pointer transition-colors">API Dokümanları</p>
                {['Hakkımızda', 'Kariyer', 'Blog', 'İletişim'].map((item) => (
                  <p key={item} className="text-[13px] text-gray-400 hover:text-blue-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">İletişim</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                  <Mail className="w-4 h-4 text-blue-400" /> info@klcsystem.com
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                  <Phone className="w-4 h-4 text-blue-400" /> +90 (212) 555 0000
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                  <Globe className="w-4 h-4 text-blue-400" /> klcsystem.com
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {['Gizlilik Politikası', 'Kullanım Şartları', 'KVKK'].map((item) => (
                  <p key={item} className="text-[12px] text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-gray-500">&copy; 2026 KLC System. Tüm hakları saklıdır.</p>
            <p className="text-[12px] text-gray-500">Türkiye'nin akıllı rota optimizasyonu platformu.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
