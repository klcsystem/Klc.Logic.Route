import { useState } from 'react'
import { Database, Key, Webhook, Globe, Building2, Bell, Route, MapPin, FileCheck, Smartphone, Map } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function SettingsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [priceWeight, setPriceWeight] = useState(60)
  const [speedWeight, setSpeedWeight] = useState(25)
  const [reliabilityWeight, setReliabilityWeight] = useState(15)
  const [notifications, setNotifications] = useState({ email: true, inApp: true, shipmentStatus: true, delay: true, erpSync: true, contractExpiry: true, calculation: false })

  const sections = [
    { icon: Building2, title: t.settings.general, desc: 'Sirket bilgileri, logo, saat dilimi', path: '', clickable: false },
    { icon: Database, title: t.settings.erp, desc: 'ERP sistem entegrasyonlari', path: '/settings/erp', clickable: true },
    { icon: Route, title: 'Rotalama Profilleri', desc: 'Araç tipi, yol tercihleri, sürücü yaklaşımı', path: '/settings/routing-profiles', clickable: true },
    { icon: MapPin, title: 'Depo / Ana Konum', desc: 'Rota başlangıç noktası ayarı', path: '/settings/depot', clickable: true },
    { icon: Map, title: 'Lokasyon Dizini', desc: 'Teslimat ve toplama noktalarını yönetin', path: '/settings/locations', clickable: true },
    { icon: FileCheck, title: 'POD Ayarları', desc: 'Teslimat kanıtı gereksinimleri', path: '/settings/pod', clickable: true },
    { icon: Smartphone, title: 'Sürücü Uygulama', desc: 'Mobil uygulama yapılandırması', path: '/settings/driver-app', clickable: true },
    { icon: Key, title: t.settings.api, desc: 'API anahtar yönetimi', path: '', clickable: false },
    { icon: Webhook, title: t.settings.webhooks, desc: 'Webhook konfigurasyonu', path: '', clickable: false },
    { icon: Globe, title: t.settings.language, desc: 'Dil ve bölgesel ayarlar', path: '', clickable: false },
  ]

  const toggleNotification = (key: keyof typeof notifications) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="space-y-6">
      <div><h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.settings.title}</h1><p className="text-[14px] text-slate-400 mt-1">{t.settings.subtitle}</p></div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <button key={s.title} onClick={() => s.clickable && s.path && navigate(s.path)} className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 text-left transition-all group ${s.clickable ? 'hover:border-orange-200 hover:shadow-md cursor-pointer' : 'opacity-80'}`}>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
              <s.icon className="w-5 h-5" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-800 mb-1">{s.title}</h3>
            <p className="text-[13px] text-slate-400">{s.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Decision Engine Weights */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Route className="w-5 h-5 text-orange-500" />
            <h3 className="text-[15px] font-semibold text-slate-800">{t.routeOptimization.weightSettings}</h3>
          </div>
          <p className="text-[13px] text-slate-400 mb-4">Karar motoru varsayılan ağırlıklari. Tüm yeni hesaplamalarda bu degerler kullanilir.</p>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1"><label className="text-[13px] font-medium text-slate-600">{t.routeOptimization.priceWeight}</label><span className="text-[13px] font-bold text-slate-800">{priceWeight}%</span></div>
              <input type="range" min={0} max={100} value={priceWeight} onChange={(e) => setPriceWeight(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-400" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1"><label className="text-[13px] font-medium text-slate-600">{t.routeOptimization.speedWeight}</label><span className="text-[13px] font-bold text-slate-800">{speedWeight}%</span></div>
              <input type="range" min={0} max={100} value={speedWeight} onChange={(e) => setSpeedWeight(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-400" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1"><label className="text-[13px] font-medium text-slate-600">{t.routeOptimization.reliabilityWeight}</label><span className="text-[13px] font-bold text-slate-800">{reliabilityWeight}%</span></div>
              <input type="range" min={0} max={100} value={reliabilityWeight} onChange={(e) => setReliabilityWeight(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-400" />
            </div>
            <button className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">{t.common.save}</button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-orange-500" />
            <h3 className="text-[15px] font-semibold text-slate-800">Bildirim Tercihleri</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[13px] text-slate-700">E-posta Bildirimleri</span>
              <button onClick={() => toggleNotification('email')} className={`w-10 h-6 rounded-full transition-colors ${notifications.email ? 'bg-orange-400' : 'bg-slate-200'}`}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications.email ? 'translate-x-5' : 'translate-x-1'}`} /></button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[13px] text-slate-700">Uygulama İçi Bildirimler</span>
              <button onClick={() => toggleNotification('inApp')} className={`w-10 h-6 rounded-full transition-colors ${notifications.inApp ? 'bg-orange-400' : 'bg-slate-200'}`}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications.inApp ? 'translate-x-5' : 'translate-x-1'}`} /></button>
            </div>
            <h4 className="text-[12px] font-semibold text-slate-400 uppercase pt-2">Olay Tipleri</h4>
            {([
              ['shipmentStatus', 'Sevkiyat Durum Değişikliği'],
              ['delay', 'Gecikme Uyarısı'],
              ['erpSync', 'ERP Senkronizasyon'],
              ['contractExpiry', 'Anlasma Suresi Dolmak Uzere'],
              ['calculation', 'Fiyat Hesaplama Tamamlandı'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between px-3">
                <span className="text-[13px] text-slate-600">{label}</span>
                <button onClick={() => toggleNotification(key)} className={`w-10 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-orange-400' : 'bg-slate-200'}`}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-1'}`} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
