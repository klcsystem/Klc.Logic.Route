import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Navigation, Search, ChevronDown, ChevronRight, Lock,
  ArrowLeft, Copy, Check, ExternalLink
} from 'lucide-react'

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
}

interface EndpointGroup {
  name: string
  description: string
  endpoints: Endpoint[]
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-100 text-blue-700 border-blue-200',
  PUT: 'bg-amber-100 text-amber-700 border-amber-200',
  PATCH: 'bg-violet-100 text-violet-700 border-violet-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
}

const API_GROUPS: EndpointGroup[] = [
  {
    name: 'Authentication',
    description: 'Kimlik dogrulama ve yetkilendirme islemleri',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', description: 'Kullanici girisi, JWT token alinir' },
      { method: 'POST', path: '/api/auth/refresh', description: 'Token yenileme' },
      { method: 'POST', path: '/api/auth/logout', description: 'Oturum sonlandirma' },
      { method: 'GET', path: '/api/auth/me', description: 'Mevcut kullanici bilgilerini getirir' },
    ],
  },
  {
    name: 'Orders',
    description: 'Siparis yonetimi ve siparis islemleri',
    endpoints: [
      { method: 'GET', path: '/api/orders', description: 'Tum siparisleri listeler (pagination, filtre destegi)' },
      { method: 'GET', path: '/api/orders/{id}', description: 'Siparis detayini getirir' },
      { method: 'POST', path: '/api/orders', description: 'Yeni siparis olusturur' },
      { method: 'PUT', path: '/api/orders/{id}', description: 'Siparis bilgilerini gunceller' },
      { method: 'DELETE', path: '/api/orders/{id}', description: 'Siparisi siler' },
      { method: 'POST', path: '/api/orders/import', description: 'Toplu siparis aktarimi (CSV/Excel)' },
      { method: 'PATCH', path: '/api/orders/{id}/status', description: 'Siparis durumunu gunceller' },
    ],
  },
  {
    name: 'Shipments',
    description: 'Sevkiyat yonetimi ve takibi',
    endpoints: [
      { method: 'GET', path: '/api/shipments', description: 'Tum sevkiyatlari listeler' },
      { method: 'GET', path: '/api/shipments/{id}', description: 'Sevkiyat detayini getirir' },
      { method: 'POST', path: '/api/shipments', description: 'Yeni sevkiyat olusturur' },
      { method: 'PUT', path: '/api/shipments/{id}', description: 'Sevkiyat bilgilerini gunceller' },
      { method: 'PATCH', path: '/api/shipments/{id}/status', description: 'Sevkiyat durumunu gunceller' },
      { method: 'POST', path: '/api/shipments/{id}/assign', description: 'Sevkiyati surucuye atar' },
      { method: 'GET', path: '/api/shipments/{id}/timeline', description: 'Sevkiyat zaman cizelgesi' },
    ],
  },
  {
    name: 'Route Optimization',
    description: 'AI destekli rota optimizasyonu',
    endpoints: [
      { method: 'POST', path: '/api/route-optimization/optimize', description: 'Rota optimizasyonu baslat (OR-Tools AI)' },
      { method: 'GET', path: '/api/route-optimization/{id}', description: 'Optimizasyon sonucunu getirir' },
      { method: 'GET', path: '/api/route-optimization', description: 'Optimizasyon gecmisini listeler' },
      { method: 'POST', path: '/api/route-optimization/{id}/apply', description: 'Optimize rotayi uygular' },
      { method: 'GET', path: '/api/route-optimization/{id}/planned-vs-actual', description: 'Planlanan vs gerceklesen karsilastirmasi' },
      { method: 'POST', path: '/api/route-optimization/reoptimize', description: 'Mevcut rotayi yeniden optimize eder' },
    ],
  },
  {
    name: 'Vehicles',
    description: 'Arac ve filo yonetimi',
    endpoints: [
      { method: 'GET', path: '/api/vehicles', description: 'Tum araclari listeler' },
      { method: 'GET', path: '/api/vehicles/{id}', description: 'Arac detayini getirir' },
      { method: 'POST', path: '/api/vehicles', description: 'Yeni arac ekler' },
      { method: 'PUT', path: '/api/vehicles/{id}', description: 'Arac bilgilerini gunceller' },
      { method: 'DELETE', path: '/api/vehicles/{id}', description: 'Araci siler' },
      { method: 'GET', path: '/api/vehicles/{id}/location', description: 'Arac konumunu getirir' },
      { method: 'GET', path: '/api/vehicles/{id}/maintenance', description: 'Arac bakim gecmisi' },
    ],
  },
  {
    name: 'Drivers',
    description: 'Surucu yonetimi ve performansi',
    endpoints: [
      { method: 'GET', path: '/api/drivers', description: 'Tum suruculeri listeler' },
      { method: 'GET', path: '/api/drivers/{id}', description: 'Surucu detayini getirir' },
      { method: 'POST', path: '/api/drivers', description: 'Yeni surucu ekler' },
      { method: 'PUT', path: '/api/drivers/{id}', description: 'Surucu bilgilerini gunceller' },
      { method: 'DELETE', path: '/api/drivers/{id}', description: 'Surucuyu siler' },
      { method: 'GET', path: '/api/drivers/{id}/performance', description: 'Surucu performans metrikleri' },
      { method: 'GET', path: '/api/drivers/{id}/routes', description: 'Surucunun rota gecmisi' },
    ],
  },
  {
    name: 'Tracking',
    description: 'Canli takip ve konum hizmetleri',
    endpoints: [
      { method: 'GET', path: '/api/tracking/live', description: 'Tum aktif araclarin canli konumlarini getirir' },
      { method: 'GET', path: '/api/tracking/{shipmentId}', description: 'Sevkiyat takip bilgisi' },
      { method: 'POST', path: '/api/tracking/location', description: 'Konum guncelleme (mobil uygulama)' },
      { method: 'GET', path: '/api/tracking/{token}/public', description: 'Musteri takip sayfasi verisi (public)' },
      { method: 'POST', path: '/api/tracking/geofence', description: 'Geofence alani tanimlar' },
    ],
  },
  {
    name: 'Insurance',
    description: 'Sigorta yonetimi',
    endpoints: [
      { method: 'GET', path: '/api/insurance/policies', description: 'Sigorta policelerini listeler' },
      { method: 'POST', path: '/api/insurance/policies', description: 'Yeni police olusturur' },
      { method: 'POST', path: '/api/insurance/claims', description: 'Hasar bildirimi olusturur' },
      { method: 'GET', path: '/api/insurance/claims', description: 'Hasar bildirimlerini listeler' },
    ],
  },
  {
    name: 'Marketplace',
    description: 'Tasiyici pazar yeri',
    endpoints: [
      { method: 'GET', path: '/api/marketplace/carriers', description: 'Mevcut tasiyicilari listeler' },
      { method: 'POST', path: '/api/marketplace/quotes', description: 'Fiyat teklifi talep eder' },
      { method: 'GET', path: '/api/marketplace/quotes/{id}', description: 'Teklif detayini getirir' },
      { method: 'POST', path: '/api/marketplace/quotes/{id}/accept', description: 'Teklifi kabul eder' },
    ],
  },
  {
    name: 'Analytics',
    description: 'Raporlama ve analitik',
    endpoints: [
      { method: 'GET', path: '/api/analytics/dashboard', description: 'Dashboard ozet metrikleri' },
      { method: 'GET', path: '/api/analytics/costs', description: 'Maliyet analiz raporu' },
      { method: 'GET', path: '/api/analytics/performance', description: 'Performans metrikleri raporu' },
      { method: 'GET', path: '/api/analytics/co2', description: 'Karbon ayak izi raporu' },
      { method: 'GET', path: '/api/analytics/carrier-scorecard', description: 'Tasiyici performans karti' },
      { method: 'POST', path: '/api/analytics/export', description: 'Rapor disari aktarim (PDF/Excel)' },
    ],
  },
  {
    name: 'Settings',
    description: 'Sistem ayarlari ve konfigurasyonlari',
    endpoints: [
      { method: 'GET', path: '/api/settings/tenant', description: 'Tenant ayarlarini getirir' },
      { method: 'PUT', path: '/api/settings/tenant', description: 'Tenant ayarlarini gunceller' },
      { method: 'GET', path: '/api/settings/erp-connections', description: 'ERP entegrasyon ayarlari' },
      { method: 'POST', path: '/api/settings/erp-connections', description: 'Yeni ERP baglantisi ekler' },
      { method: 'GET', path: '/api/settings/depots', description: 'Depo tanimlarini listeler' },
      { method: 'POST', path: '/api/settings/depots', description: 'Yeni depo tanimlar' },
      { method: 'GET', path: '/api/settings/routing-rules', description: 'Rotalama kurallarini listeler' },
      { method: 'POST', path: '/api/settings/routing-rules', description: 'Yeni rotalama kurali ekler' },
    ],
  },
  {
    name: 'Users',
    description: 'Kullanici yonetimi',
    endpoints: [
      { method: 'GET', path: '/api/users', description: 'Kullanicilari listeler' },
      { method: 'GET', path: '/api/users/{id}', description: 'Kullanici detayini getirir' },
      { method: 'POST', path: '/api/users', description: 'Yeni kullanici olusturur' },
      { method: 'PUT', path: '/api/users/{id}', description: 'Kullanici bilgilerini gunceller' },
      { method: 'DELETE', path: '/api/users/{id}', description: 'Kullaniciyi siler' },
      { method: 'PATCH', path: '/api/users/{id}/role', description: 'Kullanici rolunu degistirir' },
    ],
  },
]

export default function ApiDocsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['Authentication']))
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const expandAll = () => setOpenGroups(new Set(API_GROUPS.map(g => g.name)))
  const collapseAll = () => setOpenGroups(new Set())

  const copyToClipboard = (path: string) => {
    navigator.clipboard.writeText(`https://logicroute.klcsystem.com${path}`)
    setCopiedPath(path)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const filteredGroups = API_GROUPS.map(group => ({
    ...group,
    endpoints: group.endpoints.filter(ep =>
      !search ||
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.description.toLowerCase().includes(search.toLowerCase()) ||
      ep.method.toLowerCase().includes(search.toLowerCase()) ||
      group.name.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(group => group.endpoints.length > 0)

  const totalEndpoints = API_GROUPS.reduce((sum, g) => sum + g.endpoints.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <span className="text-[17px] font-bold tracking-tight">
                <span className="text-blue-600">KLC</span>
                <span className="text-gray-800"> Logic</span>
                <span className="text-gray-400 font-normal">.Route</span>
              </span>
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-[12px] font-semibold text-blue-600">API Dokumanlari</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="px-4 py-2 text-[13px] text-gray-500 font-medium hover:text-blue-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Ana Sayfa
            </button>
            <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg shadow-blue-200">
              Giris Yap
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">API Referansi</h1>
          <p className="text-[16px] text-gray-400 mb-6 max-w-2xl">
            Logic Route REST API ile uygulamanızı entegre edin. Tum endpointler JSON formatinda istek ve yanit kabul eder.
          </p>
          <div className="flex flex-wrap gap-6 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Base URL:</span>
              <code className="px-3 py-1.5 rounded-lg bg-white/10 text-cyan-400 font-mono text-[12px]">
                https://logicroute.klcsystem.com/api
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Toplam Endpoint:</span>
              <span className="text-white font-semibold">{totalEndpoints}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Format:</span>
              <span className="text-white font-semibold">REST / JSON</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Auth info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[14px] font-bold text-gray-900">Kimlik Dogrulama</h3>
                </div>
                <p className="text-[12px] text-gray-400 mb-3 leading-relaxed">
                  Tum API istekleri (public endpointler haric) Bearer token gerektirir.
                </p>
                <code className="block text-[11px] bg-gray-50 rounded-lg p-3 text-gray-600 font-mono leading-relaxed">
                  POST /api/auth/login<br />
                  <span className="text-gray-400">{'{'}</span><br />
                  &nbsp;&nbsp;<span className="text-blue-600">"email"</span>: <span className="text-emerald-600">"..."</span>,<br />
                  &nbsp;&nbsp;<span className="text-blue-600">"password"</span>: <span className="text-emerald-600">"..."</span><br />
                  <span className="text-gray-400">{'}'}</span>
                </code>
                <div className="mt-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-[11px] text-blue-600">
                    Header: <code className="font-mono">Authorization: Bearer {'<token>'}</code>
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-[14px] font-bold text-gray-900 mb-3">Gruplar</h3>
                <nav className="space-y-1">
                  {API_GROUPS.map(group => (
                    <button
                      key={group.name}
                      onClick={() => {
                        setOpenGroups(prev => new Set([...prev, group.name]))
                        document.getElementById(`group-${group.name}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-[12px] text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <span>{group.name}</span>
                      <span className="text-[10px] text-gray-300 font-mono">{group.endpoints.length}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main>
            {/* Search & controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Endpoint ara... (orn: orders, POST, optimize)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={expandAll} className="px-4 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all bg-white">
                  Tumu Ac
                </button>
                <button onClick={collapseAll} className="px-4 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all bg-white">
                  Tumu Kapat
                </button>
              </div>
            </div>

            {/* Endpoint groups */}
            <div className="space-y-4">
              {filteredGroups.map(group => (
                <div key={group.name} id={`group-${group.name}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden scroll-mt-24">
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {openGroups.has(group.name)
                        ? <ChevronDown className="w-4 h-4 text-blue-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />
                      }
                      <div className="text-left">
                        <h2 className="text-[15px] font-bold text-gray-900">{group.name}</h2>
                        <p className="text-[12px] text-gray-400">{group.description}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-gray-300 bg-gray-50 px-2 py-1 rounded">
                      {group.endpoints.length} endpoint
                    </span>
                  </button>

                  {openGroups.has(group.name) && (
                    <div className="border-t border-gray-100">
                      {group.endpoints.map((ep, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 px-6 py-3 hover:bg-blue-50/30 transition-colors border-b border-gray-50 last:border-b-0 group"
                        >
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border min-w-[60px] ${METHOD_COLORS[ep.method]}`}>
                            {ep.method}
                          </span>
                          <code className="text-[13px] font-mono text-gray-700 flex-shrink-0">{ep.path}</code>
                          <span className="text-[12px] text-gray-400 flex-1 hidden sm:block">{ep.description}</span>
                          <button
                            onClick={() => copyToClipboard(ep.path)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                            title="URL'yi kopyala"
                          >
                            {copiedPath === ep.path
                              ? <Check className="w-3.5 h-3.5 text-green-500" />
                              : <Copy className="w-3.5 h-3.5 text-gray-400" />
                            }
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredGroups.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-[15px] text-gray-400 font-medium">Aramanizla eslesen endpoint bulunamadi.</p>
                <p className="text-[13px] text-gray-300 mt-1">Farkli bir anahtar kelime deneyiniz.</p>
              </div>
            )}

            {/* Rate limiting info */}
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-[15px] font-bold text-gray-900 mb-3">Rate Limiting</h3>
                <p className="text-[13px] text-gray-400 mb-4">API istekleri rate limit ile sinirlidir.</p>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Baslangic</span>
                    <span className="font-mono text-gray-700">100 istek/dk</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">Profesyonel</span>
                    <span className="font-mono text-gray-700">500 istek/dk</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Kurumsal</span>
                    <span className="font-mono text-gray-700">Sinir yok</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-[15px] font-bold text-gray-900 mb-3">Yanit Formati</h3>
                <p className="text-[13px] text-gray-400 mb-4">Tum yanitlar standart JSON formatindadir.</p>
                <code className="block text-[11px] bg-gray-50 rounded-lg p-3 text-gray-600 font-mono leading-relaxed">
                  <span className="text-gray-400">{'{'}</span><br />
                  &nbsp;&nbsp;<span className="text-blue-600">"success"</span>: <span className="text-emerald-600">true</span>,<br />
                  &nbsp;&nbsp;<span className="text-blue-600">"data"</span>: <span className="text-gray-400">{'{ ... }'}</span>,<br />
                  &nbsp;&nbsp;<span className="text-blue-600">"message"</span>: <span className="text-emerald-600">"OK"</span>,<br />
                  &nbsp;&nbsp;<span className="text-blue-600">"timestamp"</span>: <span className="text-emerald-600">"..."</span><br />
                  <span className="text-gray-400">{'}'}</span>
                </code>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Entegrasyon Destegi</h3>
              <p className="text-[14px] text-blue-100 mb-6">
                API entegrasyonu icin teknik destek ekibimize ulasin.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a href="mailto:api-support@klcsystem.com" className="px-6 py-3 rounded-xl bg-white text-blue-600 font-semibold text-[14px] hover:bg-blue-50 transition-all inline-flex items-center gap-2">
                  api-support@klcsystem.com <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl border-2 border-white/30 text-white font-semibold text-[14px] hover:bg-white/10 transition-all">
                  Ana Sayfaya Don
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-gray-500">&copy; 2026 KLC System. Tum haklari saklidir.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="text-[12px] text-gray-500 hover:text-blue-400 transition-colors">Ana Sayfa</button>
            <button onClick={() => navigate('/login')} className="text-[12px] text-gray-500 hover:text-blue-400 transition-colors">Giris Yap</button>
            <span className="text-[12px] text-gray-500">v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
