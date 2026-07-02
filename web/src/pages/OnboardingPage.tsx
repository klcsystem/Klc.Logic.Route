import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Check, ChevronRight, ChevronLeft, Utensils, ShoppingCart, Package, Wrench, Trash2, Sparkles, Heart, Bike, Truck, AlertTriangle, Clock, Coffee } from 'lucide-react'
import AddressAutocomplete from '../components/map/AddressAutocomplete'
import LocationPicker from '../components/map/LocationPicker'
import type { GeocodingResult } from '../api/geocoding'
import type { ReverseGeocodingResult } from '../api/geocoding'

interface DepotData {
  address: string
  city: string
  lat?: number
  lng?: number
}

interface DriverConfig {
  driverCount: number
  startTime: string
  endTime: string
  scheduleBreak: boolean
  breakDuration: number
  breakStartTime: string
  breakEndTime: string
  vehicleType: 'standard' | 'kamyon' | 'tehlikeli'
}

const BUSINESS_TYPES = [
  { id: 'gida', label: 'Gida Dagitim', icon: Utensils },
  { id: 'perakende', label: 'Perakende & Dagitim', icon: ShoppingCart },
  { id: 'eticaret', label: 'E-ticaret Kargo', icon: Package },
  { id: 'saha', label: 'Saha Servis', icon: Wrench },
  { id: 'atik', label: 'Atik Toplama', icon: Trash2 },
  { id: 'temizlik', label: 'Temizlik Hizmeti', icon: Sparkles },
  { id: 'sağlık', label: 'Sağlık/Ilac', icon: Heart },
  { id: 'kurye', label: 'Kurye', icon: Bike },
  { id: 'diger_teslimat', label: 'Diger Teslimat', icon: Package },
  { id: 'diger_servis', label: 'Diger Servis', icon: Wrench },
] as const

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

const VEHICLE_TYPES = [
  { id: 'standard' as const, label: 'Standard', desc: 'Binek / hafif ticari', icon: Package },
  { id: 'kamyon' as const, label: 'Kamyon', desc: 'Agir ticari arac', icon: Truck },
  { id: 'tehlikeli' as const, label: 'Tehlikeli Madde', desc: 'ADR belgeli arac', icon: AlertTriangle },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const [depot, setDepot] = useState<DepotData>({ address: '', city: '' })
  const [businessType, setBusinessType] = useState<string>('')
  const [driverConfig, setDriverConfig] = useState<DriverConfig>({
    driverCount: 1,
    startTime: '08:00',
    endTime: '18:00',
    scheduleBreak: false,
    breakDuration: 30,
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    vehicleType: 'standard',
  })

  const canNext = () => {
    if (step === 0) return !!(depot.lat && depot.lng && depot.address)
    if (step === 1) return !!businessType
    if (step === 2) return driverConfig.driverCount > 0
    return false
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    localStorage.setItem('depot_settings', JSON.stringify(depot))
    localStorage.setItem('business_type', businessType)
    localStorage.setItem('driver_config', JSON.stringify(driverConfig))
    navigate('/orders')
  }

  const stepTitles = [
    { title: 'Deponuz nerede?', desc: 'Depo veya merkez konumunuzu haritadan seçin' },
    { title: 'Ne yapiyorsunuz?', desc: 'Is tipinizi seçin, rota optimizasyonunu buna gore ayarlayalim' },
    { title: 'Sürücü ve araçlarınızı ayarlayın', desc: 'Sürücü sayısı, çalışma saatleri ve araç tipi bilgilerini girin' },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8 gap-3">
          {[0, 1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-bold transition-all ${
                s < step
                  ? 'bg-green-500 text-white'
                  : s === step
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-400/10'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {s < step ? <Check className="w-5 h-5" /> : s + 1}
              </div>
              {s < 2 && (
                <div className={`w-16 h-0.5 rounded-full ${s < step ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-[13px] text-slate-400 font-medium">{step + 1}/3</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8">
          <h2 className="text-[20px] font-bold text-slate-900 mb-1">{stepTitles[step].title}</h2>
          <p className="text-[13px] text-slate-400 mb-6">{stepTitles[step].desc}</p>

          {/* Step 1: Depot location */}
          {step === 0 && (
            <div className="space-y-4">
              <AddressAutocomplete
                label="Depo Adresi"
                value={depot.address}
                placeholder="Adres aramak için yazın..."
                onSelect={(result: GeocodingResult) => {
                  setDepot({
                    address: result.displayName,
                    city: result.city || '',
                    lat: result.lat,
                    lng: result.lng,
                  })
                }}
                onClear={() => setDepot({ address: '', city: '', lat: undefined, lng: undefined })}
              />
              <LocationPicker
                lat={depot.lat}
                lng={depot.lng}
                height={320}
                onLocationChange={(lat: number, lng: number, address?: ReverseGeocodingResult) => {
                  setDepot({
                    lat,
                    lng,
                    address: address?.displayName || depot.address,
                    city: address?.city || depot.city,
                  })
                }}
              />
              {depot.lat && depot.lng && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-[13px] text-green-700 font-medium">{depot.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Business type */}
          {step === 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUSINESS_TYPES.map((bt) => {
                const Icon = bt.icon
                const isSelected = businessType === bt.id
                return (
                  <button
                    key={bt.id}
                    onClick={() => setBusinessType(bt.id)}
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-400/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[13px] font-medium text-center ${
                      isSelected ? 'text-orange-600' : 'text-slate-600'
                    }`}>{bt.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 3: Driver & vehicle setup */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Driver count */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">Sürücü Sayısı</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDriverConfig({ ...driverConfig, driverCount: Math.max(1, driverConfig.driverCount - 1) })}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-[18px] font-bold"
                  >-</button>
                  <input
                    type="number"
                    min={1}
                    value={driverConfig.driverCount}
                    onChange={(e) => setDriverConfig({ ...driverConfig, driverCount: Math.max(1, Number(e.target.value)) })}
                    className="w-20 text-center px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                  />
                  <button
                    onClick={() => setDriverConfig({ ...driverConfig, driverCount: driverConfig.driverCount + 1 })}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-[18px] font-bold"
                  >+</button>
                </div>
              </div>

              {/* Work time */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1.5" />Çalışma Saatleri
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={driverConfig.startTime}
                    onChange={(e) => setDriverConfig({ ...driverConfig, startTime: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                  >
                    {TIME_OPTIONS.map((t) => <option key={`s-${t}`} value={t}>{t}</option>)}
                  </select>
                  <span className="text-slate-400 font-medium">-</span>
                  <select
                    value={driverConfig.endTime}
                    onChange={(e) => setDriverConfig({ ...driverConfig, endTime: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                  >
                    {TIME_OPTIONS.map((t) => <option key={`e-${t}`} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Break */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={driverConfig.scheduleBreak}
                    onChange={(e) => setDriverConfig({ ...driverConfig, scheduleBreak: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400/20"
                  />
                  <Coffee className="w-4 h-4 text-slate-400" />
                  <span className="text-[13px] font-medium text-slate-700">Mola Planla</span>
                </label>
                {driverConfig.scheduleBreak && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Sure (dk)</label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={driverConfig.breakDuration}
                        onChange={(e) => setDriverConfig({ ...driverConfig, breakDuration: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Baslangic</label>
                      <select
                        value={driverConfig.breakStartTime}
                        onChange={(e) => setDriverConfig({ ...driverConfig, breakStartTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                      >
                        {TIME_OPTIONS.map((t) => <option key={`bs-${t}`} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Bitis</label>
                      <select
                        value={driverConfig.breakEndTime}
                        onChange={(e) => setDriverConfig({ ...driverConfig, breakEndTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                      >
                        {TIME_OPTIONS.map((t) => <option key={`be-${t}`} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle type */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-3">Arac Tipi</label>
                <div className="grid grid-cols-3 gap-3">
                  {VEHICLE_TYPES.map((vt) => {
                    const Icon = vt.icon
                    const isSelected = driverConfig.vehicleType === vt.id
                    return (
                      <button
                        key={vt.id}
                        onClick={() => setDriverConfig({ ...driverConfig, vehicleType: vt.id })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-400/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-orange-500' : 'text-slate-400'}`} />
                        <span className={`text-[13px] font-semibold ${isSelected ? 'text-orange-600' : 'text-slate-700'}`}>{vt.label}</span>
                        <span className="text-[11px] text-slate-400 text-center">{vt.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Onceki
            </button>
            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-400/10 transition-all"
              >
                Sonraki <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canNext()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-[13px] font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/10 transition-all"
              >
                <Check className="w-4 h-4" /> Tamamla
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
