import { useNavigate } from 'react-router-dom'
import {
  Navigation, Database, Calculator, BarChart3, MapPin, Leaf, DollarSign,
  ArrowRight, Zap, Truck, Package, Shield, TrendingUp,
  CheckCircle2, ChevronRight, Globe, Phone, Mail
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  const stats = [
    { value: '50+', label: 'Entegre Taşıyıcı', icon: Truck },
    { value: '10K+', label: 'Aylık Sevkiyat', icon: Package },
    { value: '%23', label: 'Ort. Tasarruf', icon: TrendingUp },
    { value: '99.9%', label: 'Uptime', icon: Shield },
  ]

  const features = [
    { icon: Database, title: 'ERP Entegrasyon', desc: 'SAP, Logo, Netsis ile anında bağlanın. Siparişleriniz otomatik akar, manuel veri girişi sıfır.' },
    { icon: Calculator, title: 'Otomatik Hesaplama', desc: 'Desi, hacim, ağırlık ve ücretlendirme ağırlığı anında hesaplanır. Araç tipi otomatik belirlenir.' },
    { icon: BarChart3, title: 'Akıllı Karşılaştırma', desc: 'Anlaşma tarifeleriniz üzerinden tüm provider\'ları karşılaştırır, en uygun seçeneği bulur.' },
    { icon: MapPin, title: 'Canlı Takip', desc: 'Tüm sevkiyatlarınız tek haritada. Gerçek zamanlı konum, ETA ve gecikme uyarıları.' },
    { icon: Leaf, title: 'CO2 Raporu', desc: 'GLEC Framework ile karbon ayak izi hesaplama. ESG uyumu ve sürdürülebilirlik raporları.' },
    { icon: DollarSign, title: 'Fatura Denetimi', desc: 'Anlaşma fiyatı vs. provider faturası otomatik karşılaştırma. Fazla ödemeleri anında tespit.' },
  ]

  const steps = [
    { num: '1', title: 'Entegre Ol', desc: 'ERP sisteminizi bağlayın, taşıyıcı anlaşmalarınızı tanımlayın. Stepper wizard ile 15 dakikada hazır.', icon: Database },
    { num: '2', title: 'Hesapla', desc: 'Sevkiyat ihtiyacı doğduğunda karar motoru anında çalışır. Tüm taşıyıcıların tarifelerini karşılaştırır.', icon: Calculator },
    { num: '3', title: 'Tasarruf Et', desc: 'En uygun taşıyıcı otomatik seçilir. Performans takibi ve raporlarla sürekli iyileştirin.', icon: TrendingUp },
  ]

  const benefits = [
    'Tek entegrasyon ile tüm lojistik provider\'lara erişim',
    'Anlaşma bazlı anında fiyat karşılaştırma — teklif bekleme yok',
    'Firma bazlı konfigüre edilebilir karar kriterleri',
    'Kural motoru ile otomatik taşıyıcı atama',
    'Rol bazlı dashboard\'lar (Yönetim, Lojistik, Operasyon, Finans)',
    'Multi-tenant SaaS — her firma kendi alanında izole',
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight">
              <span className="text-orange-500">KLC</span>
              <span className="text-gray-800"> Logic</span>
              <span className="text-gray-400 font-normal">.Route</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] text-gray-500 hover:text-orange-500 transition-colors font-medium">Özellikler</a>
            <a href="#how-it-works" className="text-[13px] text-gray-500 hover:text-orange-500 transition-colors font-medium">Nasıl Çalışır</a>
            <a href="#pricing" className="text-[13px] text-gray-500 hover:text-orange-500 transition-colors font-medium">Çözümler</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-[13px] text-gray-600 font-medium hover:text-orange-500 transition-colors">
              Giriş Yap
            </button>
            <button onClick={() => navigate('/onboarding')} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[13px] font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-200">
              Ücretsiz Deneyin
            </button>
          </div>
        </div>
      </header>

      {/* Hero — Beyaz arka plan, turuncu vurgular */}
      <section className="relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-orange-50 rounded-full" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-orange-50/50 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Sol — Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[13px] font-semibold mb-8">
                <Zap className="w-4 h-4" />
                Lojistiğin iyzico'su
              </div>
              <h1 className="text-4xl lg:text-[52px] font-extrabold leading-[1.1] tracking-tight text-gray-900 mb-6">
                Tek Entegrasyon,
                <br />
                <span className="text-orange-500">Tüm Taşıyıcılar</span>
              </h1>
              <p className="text-[17px] text-gray-500 leading-relaxed mb-8 max-w-lg">
                Şirketiniz birden fazla lojistik firma ile mi çalışıyor? Artık her biri ile ayrı ayrı uğraşmanıza gerek yok. Biz entegre olduk, siz tasarruf edin.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={() => navigate('/onboarding')} className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-[15px] shadow-xl shadow-orange-200 flex items-center gap-2">
                  Ücretsiz Demo İsteyin <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/login')} className="px-7 py-3.5 rounded-xl border-2 border-orange-200 text-orange-600 font-semibold hover:bg-orange-50 transition-all duration-200 text-[15px]">
                  Hemen Başlayın
                </button>
              </div>
              {/* Trust badges */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Kurulum 15 dk
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

            {/* Sag — Dashboard preview mockup */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl shadow-gray-300/50">
                {/* Mock dashboard header */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-[11px] text-gray-500">Logic.Route Dashboard</span>
                </div>
                {/* Mock stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Aktif Sevkiyat</p>
                    <p className="text-lg font-bold text-white">247</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Tasarruf</p>
                    <p className="text-lg font-bold text-orange-400">₺284K</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 mb-1">Zamanında</p>
                    <p className="text-lg font-bold text-green-400">%96.8</p>
                  </div>
                </div>
                {/* Mock chart bars */}
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-[10px] text-gray-500 mb-3">Aylık Maliyet Trendi</p>
                  <div className="flex items-end gap-2 h-20">
                    {[60, 75, 55, 80, 65, 90, 70, 85, 45, 72, 68, 78].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 11 ? 'linear-gradient(to top, #f97316, #fb923c)' : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                </div>
                {/* Floating card */}
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white rounded-xl p-4 shadow-xl shadow-gray-200/50 w-52">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">En Uygun Taşıyıcı</p>
                      <p className="text-[13px] font-bold text-gray-800">Yolda Lojistik</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[20px] font-extrabold text-orange-500">₺12,450</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">-%18</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar — turuncu */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <s.icon className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <p className="text-3xl lg:text-4xl font-extrabold text-white mb-1">{s.value}</p>
                <p className="text-[13px] text-orange-100 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] text-orange-500 font-semibold uppercase tracking-wider mb-3">Özellikler</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Neden <span className="text-orange-500">Logic.Route</span>?
            </h2>
            <p className="text-[16px] text-gray-400 max-w-xl mx-auto">
              End-to-end lojistik optimizasyonu için ihtiyacınız olan her şey tek platformda.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-7 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
                  <f.icon className="w-6 h-6 text-orange-500" />
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
            <p className="text-[13px] text-orange-500 font-semibold uppercase tracking-wider mb-3">Nasıl Çalışır?</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              3 Adımda Başlayın
            </h2>
            <p className="text-[16px] text-gray-400 max-w-xl mx-auto">
              Kurulum 15 dakika. Hemen tasarruf etmeye başlayın.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-2">Adım{s.num}</div>
                <h3 className="text-[20px] font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-[14px] text-gray-400 leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <ChevronRight className="absolute top-8 -right-5 w-8 h-8 text-orange-200 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits — checklist */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[13px] text-orange-500 font-semibold uppercase tracking-wider mb-3">Avantajlar</p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-6">
                Lojistik maliyetlerinizi <span className="text-orange-500">optimize edin</span>
              </h2>
              <p className="text-[16px] text-gray-400 mb-8 leading-relaxed">
                Tek tek provider API'leri ile uğraşmayın. Biz zaten entegre olduk — siz sadece karar verin.
              </p>
              <div className="space-y-4">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[15px] text-gray-600">{b}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/onboarding')} className="mt-8 px-7 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-[14px] shadow-lg shadow-orange-200 inline-flex items-center gap-2">
                Hemen Başlayın <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {/* Right — Stats card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-lg shadow-gray-100/50">
              <h3 className="text-[18px] font-bold text-gray-900 mb-6">Platform İstatistikleri</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[14px] text-gray-500">Zamanında Teslimat</span>
                    <span className="text-[14px] font-bold text-gray-900">%96.8</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: '96.8%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[14px] text-gray-500">Maliyet Tasarrufu</span>
                    <span className="text-[14px] font-bold text-gray-900">%23</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: '23%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[14px] text-gray-500">Müşteri Memnuniyeti</span>
                    <span className="text-[14px] font-bold text-gray-900">%98.5</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" style={{ width: '98.5%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[14px] text-gray-500">CO₂ Azaltma</span>
                    <span className="text-[14px] font-bold text-gray-900">%15</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* References */}
      <section className="py-14 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[12px] text-gray-400 uppercase tracking-wider mb-8 font-medium">Güvenilen Çözüm Ortağı</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {['A101', 'Migros', 'BIM', 'CarrefourSA', 'Metro', 'LC Waikiki'].map((name) => (
              <div key={name} className="text-[18px] font-bold text-gray-300 hover:text-orange-400 transition-colors cursor-default">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-orange-500 to-orange-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/30 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-4">
            Lojistik maliyetlerinizi düşürmeye hazır mısınız?
          </h2>
          <p className="text-[17px] text-orange-100 mb-10 max-w-lg mx-auto">
            15 dakikada kurulum, anında tasarruf. Kredi kartı gerekmez.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => navigate('/onboarding')} className="px-8 py-4 rounded-xl bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all duration-200 text-[16px] shadow-xl shadow-orange-700/20 inline-flex items-center gap-2">
              Ücretsiz Demo İsteyin <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-200 text-[16px]">
              Giriş Yap
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
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <span className="text-[16px] font-bold">
                  <span className="text-orange-400">KLC</span> Logic.Route
                </span>
              </div>
              <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
                Akıllı lojistik karar motoru. Tek entegrasyon ile tüm taşıyıcılara erişin, maliyetlerinizi optimize edin.
              </p>
              <div className="flex items-center gap-3">
                {['LinkedIn', 'Twitter', 'GitHub'].map((s) => (
                  <span key={s} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[11px] text-gray-400 hover:bg-orange-500 hover:text-white cursor-pointer transition-all">
                    {s[0]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Ürün</h4>
              <div className="space-y-3">
                {['Karar Motoru', 'Rota Optimizasyonu', 'Canlı Takip', 'CO2 Raporu', 'Fatura Denetimi', 'ERP Entegrasyon'].map((item) => (
                  <p key={item} className="text-[13px] text-gray-400 hover:text-orange-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">Şirket</h4>
              <div className="space-y-3">
                {['Hakkımızda', 'Kariyer', 'Blog', 'Basında Biz', 'İletişim'].map((item) => (
                  <p key={item} className="text-[13px] text-gray-400 hover:text-orange-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">İletişim</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                  <Mail className="w-4 h-4 text-orange-400" /> info@klcsystem.com
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                  <Phone className="w-4 h-4 text-orange-400" /> +90 (212) 555 0000
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                  <Globe className="w-4 h-4 text-orange-400" /> klcsystem.com
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {['Gizlilik Politikası', 'Kullanım Şartları', 'KVKK'].map((item) => (
                  <p key={item} className="text-[12px] text-gray-500 hover:text-orange-400 cursor-pointer transition-colors">{item}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-gray-500">&copy; 2026 KLC Logic.Route. Tüm hakları saklıdır.</p>
            <p className="text-[12px] text-gray-500">Türkiye'nin lojistik karar motoru platformu.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
