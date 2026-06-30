import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Navigation, ArrowRight, Zap, Package,
  CheckCircle2, ChevronRight, Globe, Phone, Mail, MapPin, Smartphone,
  BarChart3, Link2, Satellite, Brain, Check, Star, Menu, X
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
      title: 'Akilli Rota Optimizasyonu',
      desc: 'OR-Tools ve AI destekli algoritma ile en verimli rotayi saniyeler icinde hesaplayiniz. Trafik, zaman penceresi ve arac kapasitesi otomatik hesaplanir.',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-600',
    },
    {
      icon: Satellite,
      title: 'Canli Takip ve Izleme',
      desc: 'Gercek zamanli GPS takibi ile tum filonuzu tek haritada izleyiniz. Gecikme uyarilari ve ETA hesaplamalari otomatik guncellenir.',
      color: 'from-cyan-500 to-teal-500',
      bg: 'bg-cyan-50',
      border: 'border-cyan-100',
      text: 'text-cyan-600',
    },
    {
      icon: Link2,
      title: 'ERP Entegrasyonu',
      desc: 'SAP, Logo, Netsis ve diger ERP sistemleri ile otomatik entegrasyon. Siparisler aninda akar, manuel veri girisi sifir.',
      color: 'from-indigo-500 to-blue-500',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      text: 'text-indigo-600',
    },
    {
      icon: Smartphone,
      title: 'Surucu Mobil Uygulama',
      desc: 'iOS ve Android uyumlu mobil uygulama. Rota navigasyonu, teslimat onaylama, dijital imza ve offline calisma destegi.',
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      text: 'text-violet-600',
    },
    {
      icon: Package,
      title: 'Musteri Izlenebilirligi',
      desc: 'Markali takip sayfasi ile musterileriniz kargolarini canli takip edebilir. SMS ve e-posta bildirimleri otomatik gonderilir.',
      color: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
    },
    {
      icon: BarChart3,
      title: 'Analitik Gosterge Paneli',
      desc: 'Performans metrikleri, maliyet analizleri ve verimlilik raporlari. Veri odakli kararlar alin, surekli iyilestirin.',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-600',
    },
  ]

  const steps = [
    {
      num: '01',
      title: "ERP'nizi baglayin",
      desc: 'Siparisler otomatik gelir. SAP, Logo veya Netsis entegrasyonunu 15 dakikada tamamlayiniz.',
      icon: Link2,
    },
    {
      num: '02',
      title: 'Rotalari optimize edin',
      desc: 'AI motoru en kisa, en verimli rotalari saniyeler icinde hesaplar. Trafik ve zaman kositlarini otomatik dikkate alir.',
      icon: Brain,
    },
    {
      num: '03',
      title: 'Suruculere atayin',
      desc: 'Optimize edilmis rotalar tek tikla suruculerin telefonlarina duser. Navigasyon otomatik baslar.',
      icon: Smartphone,
    },
    {
      num: '04',
      title: 'Canli takip edin',
      desc: 'Tum teslimat surecini gercek zamanli izleyiniz. Musterileriniz de kendi takip linklerinden izleyebilir.',
      icon: MapPin,
    },
  ]

  const pricingPlans = [
    {
      name: 'Baslangic',
      price: '2,999',
      period: '/ay',
      desc: 'Kucuk filolar icin ideal baslangic paketi.',
      features: [
        '10 araca kadar',
        'Temel rota optimizasyonu',
        'GPS canli takip',
        'Mobil surucu uygulamasi',
        'E-posta destegi',
        'Temel raporlama',
      ],
      cta: 'Hemen Baslayin',
      popular: false,
    },
    {
      name: 'Profesyonel',
      price: '7,999',
      period: '/ay',
      desc: 'Buyuyen operasyonlar icin tam donanimli paket.',
      features: [
        '50 araca kadar',
        'AI destekli optimizasyon',
        'Gelismis analitik paneli',
        'ERP entegrasyonu (SAP, Logo)',
        'Musteri takip portali',
        'API erisimi',
        'Oncelikli destek',
        'CO2 raporlama',
      ],
      cta: 'Demo Talep Edin',
      popular: true,
    },
    {
      name: 'Kurumsal',
      price: '14,999',
      period: '/ay',
      desc: 'Buyuk filolar icin sinir tanimayan cozum.',
      features: [
        'Sinirsiz arac',
        'Tum Profesyonel ozellikler',
        'Ozel SLA garantisi',
        'Dedicated account manager',
        'On-premise opsiyonu',
        'Ozel entegrasyon gelistirme',
        '7/24 telefon destegi',
        'Egitim ve danismanlik',
      ],
      cta: 'Bize Ulasin',
      popular: false,
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
              <span className="text-blue-600">KLC</span>
              <span className="text-gray-800"> Logic</span>
              <span className="text-gray-400 font-normal">.Route</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-[13px] text-gray-500 hover:text-blue-600 transition-colors font-medium">Ozellikler</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-[13px] text-gray-500 hover:text-blue-600 transition-colors font-medium">Nasil Calisir</button>
            <button onClick={() => scrollTo('pricing')} className="text-[13px] text-gray-500 hover:text-blue-600 transition-colors font-medium">Fiyatlandirma</button>
            <button onClick={() => navigate('/api-docs')} className="text-[13px] text-gray-500 hover:text-blue-600 transition-colors font-medium">API</button>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-[13px] text-gray-600 font-medium hover:text-blue-600 transition-colors">
              Giris Yap
            </button>
            <button onClick={() => navigate('/onboarding')} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 shadow-lg shadow-blue-200">
              Hemen Baslayin
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
            <button onClick={() => scrollTo('features')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">Ozellikler</button>
            <button onClick={() => scrollTo('how-it-works')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">Nasil Calisir</button>
            <button onClick={() => scrollTo('pricing')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">Fiyatlandirma</button>
            <button onClick={() => navigate('/api-docs')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">API</button>
            <hr className="border-gray-100" />
            <button onClick={() => navigate('/login')} className="block text-[14px] text-gray-600 font-medium w-full text-left py-2">Giris Yap</button>
            <button onClick={() => navigate('/onboarding')} className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold">Hemen Baslayin</button>
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
                Akilli Rota Planlama ve{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Filo Yonetimi
                </span>{' '}
                Platformu
              </h1>
              <p className="text-[17px] text-gray-500 leading-relaxed mb-8 max-w-lg">
                OR-Tools AI motoru ile rotalarinizi optimize edin, filonuzu canli takip edin,
                maliyetlerinizi %25 azaltin. Tek platform, sinirsiz verimlilik.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={() => scrollTo('pricing')} className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 text-[15px] shadow-xl shadow-blue-200 flex items-center gap-2">
                  Demo Talep Et <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/onboarding')} className="px-7 py-3.5 rounded-xl border-2 border-blue-200 text-blue-600 font-semibold hover:bg-blue-50 transition-all duration-200 text-[15px]">
                  Hemen Baslayin
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  14 gun ucretsiz deneme
                </div>
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Kredi karti gerekmez
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
                  <span className="ml-3 text-[11px] text-gray-500">Logic.Route -- Rota Optimizasyonu</span>
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
                    {['Depo Cikis', 'Kadikoy #A1', 'Uskudar #B3', 'Besiktas #C2', 'Sisli #D5'].map((stop, i) => (
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
                    <p className="text-[10px] text-gray-500 mb-1">Tahmini Sure</p>
                    <p className="text-lg font-bold text-cyan-400">2s 15dk</p>
                    <span className="text-[10px] text-green-400">-%28 tasarruf</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Yakit Maliyeti</p>
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
                      <p className="text-[13px] font-bold text-gray-800">Tamamlandi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-[10px] text-gray-400">12 rota, 3 arac, 47 siparis</p>
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
            <p className="text-[13px] text-blue-600 font-semibold uppercase tracking-wider mb-3">Ozellikler</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Neden <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Logic.Route</span>?
            </h2>
            <p className="text-[16px] text-gray-400 max-w-xl mx-auto">
              End-to-end rota optimizasyonu ve filo yonetimi icin ihtiyaciniz olan her sey tek platformda.
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
            <p className="text-[13px] text-blue-600 font-semibold uppercase tracking-wider mb-3">Nasil Calisir?</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              4 Adimda Baslayin
            </h2>
            <p className="text-[16px] text-gray-400 max-w-xl mx-auto">
              ERP entegrasyonundan canli takibe, 15 dakikada tam operasyonel olun.
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

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] text-blue-600 font-semibold uppercase tracking-wider mb-3">Fiyatlandirma</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Her Olcek Icin Uygun Plan
            </h2>
            <p className="text-[16px] text-gray-400 max-w-xl mx-auto">
              14 gun ucretsiz deneyin. Kredi karti gerekmez. Istediginiz zaman iptal edin.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`relative rounded-2xl p-8 ${plan.popular ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-2xl shadow-blue-200 scale-105' : 'bg-white border border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-400 text-amber-900 text-[11px] font-bold uppercase tracking-wider">
                    En Populer
                  </div>
                )}
                <h3 className={`text-[18px] font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-[13px] mb-6 ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}>{plan.desc}</p>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-[14px] ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}> TL{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-blue-200' : 'text-blue-500'}`} />
                      <span className={`text-[13px] ${plan.popular ? 'text-blue-50' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/onboarding')}
                  className={`w-full py-3 rounded-xl font-semibold text-[14px] transition-all duration-200 ${plan.popular ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg' : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-100'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-800/30 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-4">
            Hemen deneyin -- 14 gun ucretsiz
          </h2>
          <p className="text-[17px] text-blue-100 mb-10 max-w-lg mx-auto">
            15 dakikada kurulum, aninda tasarruf. Kredi karti gerekmez.
            Rotalarinizi optimize etmeye hemen baslayin.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => navigate('/onboarding')} className="px-8 py-4 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-all duration-200 text-[16px] shadow-xl shadow-blue-900/20 inline-flex items-center gap-2">
              Ucretsiz Demo Isteyin <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-200 text-[16px]">
              Giris Yap
            </button>
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
                <span className="text-[16px] font-bold">
                  <span className="text-blue-400">KLC</span> Logic.Route
                </span>
              </div>
              <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
                Akilli rota planlama ve filo yonetimi platformu. AI destekli optimizasyon ile maliyetlerinizi %25 azaltin.
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
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Urun</h4>
              <div className="space-y-3">
                {['Rota Optimizasyonu', 'Canli Takip', 'ERP Entegrasyon', 'Mobil Uygulama', 'Analitik Panel', 'Musteri Portali'].map((item) => (
                  <p key={item} className="text-[13px] text-gray-400 hover:text-blue-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Kaynaklar</h4>
              <div className="space-y-3">
                <p onClick={() => navigate('/api-docs')} className="text-[13px] text-gray-400 hover:text-blue-400 cursor-pointer transition-colors">API Dokumanlari</p>
                {['Hakkimizda', 'Kariyer', 'Blog', 'Iletisim'].map((item) => (
                  <p key={item} className="text-[13px] text-gray-400 hover:text-blue-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Iletisim</h4>
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
                {['Gizlilik Politikasi', 'Kullanim Sartlari', 'KVKK'].map((item) => (
                  <p key={item} className="text-[12px] text-gray-500 hover:text-blue-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-gray-500">&copy; 2026 KLC System. Tum haklari saklidir.</p>
            <p className="text-[12px] text-gray-500">Turkiye'nin akilli rota optimizasyonu platformu.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
