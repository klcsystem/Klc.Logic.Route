import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Building2, Database, Truck, Settings2, ClipboardList, Plus, Trash2, Navigation, Loader2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { toast } from '../components/ui/Toast'

interface CarrierEntry {
  id: string
  name: string
  serviceType: string
}

interface WizardData {
  companyName: string
  taxId: string
  city: string
  erpSystem: string
  apiEndpoint: string
  apiKey: string
  carriers: CarrierEntry[]
  maxDistance: number
  maxWeight: number
  timeWindowRequired: boolean
}

const STEPS = [
  { icon: Building2, key: 'step1' },
  { icon: Database, key: 'step2' },
  { icon: Truck, key: 'step3' },
  { icon: Settings2, key: 'step4' },
  { icon: ClipboardList, key: 'step5' },
] as const

export default function OnboardingWizard() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [connectionTested, setConnectionTested] = useState(false)

  const stepMeta = [
    { title: t.onboarding.step1Title, desc: t.onboarding.step1Desc },
    { title: t.onboarding.step2Title, desc: t.onboarding.step2Desc },
    { title: t.onboarding.step3Title, desc: t.onboarding.step3Desc },
    { title: t.onboarding.step4Title, desc: t.onboarding.step4Desc },
    { title: t.onboarding.step5Title, desc: t.onboarding.step5Desc },
  ]

  const [data, setData] = useState<WizardData>({
    companyName: '',
    taxId: '',
    city: '',
    erpSystem: 'SAP',
    apiEndpoint: '',
    apiKey: '',
    carriers: [],
    maxDistance: 500,
    maxWeight: 25000,
    timeWindowRequired: true,
  })

  const updateField = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const addCarrier = () => {
    updateField('carriers', [...data.carriers, { id: crypto.randomUUID(), name: '', serviceType: 'FTL' }])
  }

  const removeCarrier = (id: string) => {
    updateField('carriers', data.carriers.filter((c) => c.id !== id))
  }

  const updateCarrier = (id: string, field: keyof CarrierEntry, value: string) => {
    updateField('carriers', data.carriers.map((c) => c.id === id ? { ...c, [field]: value } : c))
  }

  const handleTestConnection = () => {
    setTimeout(() => {
      setConnectionTested(true)
      toast('success', t.onboarding.connectionSuccess)
    }, 1500)
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast('success', t.common.success)
      navigate('/dashboard')
    }, 2000)
  }

  const canNext = () => {
    if (currentStep === 0) return data.companyName && data.taxId && data.city
    if (currentStep === 1) return data.erpSystem && data.apiEndpoint
    if (currentStep === 2) return data.carriers.length > 0 && data.carriers.every((c) => c.name)
    return true
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'
  const labelClass = 'block text-[13px] font-semibold text-slate-700 mb-2'

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/10">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">{t.onboarding.title}</h1>
            <p className="text-[12px] text-slate-400">{t.onboarding.subtitle}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((step, i) => {
            const StepIcon = step.icon
            const isCompleted = i < currentStep
            const isCurrent = i === currentStep
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-400/10'
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[11px] mt-1.5 font-medium ${isCurrent ? 'text-orange-500' : 'text-slate-400'}`}>
                    {stepMeta[i].title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 mt-[-18px] rounded-full ${i < currentStep ? 'bg-green-500' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8">
          <h2 className="text-[18px] font-bold text-slate-900 mb-1">{stepMeta[currentStep].title}</h2>
          <p className="text-[13px] text-slate-400 mb-6">{stepMeta[currentStep].desc}</p>

          {/* Step 1: Company Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t.onboarding.companyName}</label>
                <input type="text" value={data.companyName} onChange={(e) => updateField('companyName', e.target.value)} className={inputClass} placeholder="KLC Lojistik A.S." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.onboarding.taxId}</label>
                  <input type="text" value={data.taxId} onChange={(e) => updateField('taxId', e.target.value)} className={inputClass} placeholder="1234567890" />
                </div>
                <div>
                  <label className={labelClass}>{t.onboarding.city}</label>
                  <input type="text" value={data.city} onChange={(e) => updateField('city', e.target.value)} className={inputClass} placeholder="Istanbul" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: ERP Integration */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t.onboarding.erpSystem}</label>
                <select value={data.erpSystem} onChange={(e) => updateField('erpSystem', e.target.value)} className={inputClass}>
                  <option value="SAP">SAP</option>
                  <option value="Oracle">Oracle</option>
                  <option value="Microsoft Dynamics">Microsoft Dynamics</option>
                  <option value="Logo">Logo Tiger</option>
                  <option value="Netsis">Netsis</option>
                  <option value="Other">Diger</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t.onboarding.apiEndpoint}</label>
                <input type="text" value={data.apiEndpoint} onChange={(e) => updateField('apiEndpoint', e.target.value)} className={inputClass} placeholder="https://erp.company.com/api" />
              </div>
              <div>
                <label className={labelClass}>{t.onboarding.apiKey}</label>
                <input type="password" value={data.apiKey} onChange={(e) => updateField('apiKey', e.target.value)} className={inputClass} placeholder="sk_..." />
              </div>
              <button
                onClick={handleTestConnection}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Database className="w-4 h-4" />
                {t.onboarding.testConnection}
              </button>
              {connectionTested && (
                <div className="flex items-center gap-2 text-[13px] text-green-600">
                  <Check className="w-4 h-4" />
                  {t.onboarding.connectionSuccess}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Carrier Setup */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {data.carriers.map((carrier) => (
                <div key={carrier.id} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={carrier.name}
                      onChange={(e) => updateCarrier(carrier.id, 'name', e.target.value)}
                      className={inputClass}
                      placeholder={t.onboarding.carrierName}
                    />
                    <select
                      value={carrier.serviceType}
                      onChange={(e) => updateCarrier(carrier.id, 'serviceType', e.target.value)}
                      className={inputClass}
                    >
                      <option value="FTL">FTL</option>
                      <option value="LTL">LTL</option>
                      <option value="Express">Express</option>
                      <option value="Last Mile">Last Mile</option>
                    </select>
                  </div>
                  <button
                    onClick={() => removeCarrier(carrier.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addCarrier}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-[13px] font-medium text-slate-400 hover:text-orange-500 hover:border-orange-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t.onboarding.addCarrier}
              </button>
            </div>
          )}

          {/* Step 4: Rules Config */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t.onboarding.maxDistance}</label>
                  <input type="number" value={data.maxDistance} onChange={(e) => updateField('maxDistance', Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t.onboarding.maxWeight}</label>
                  <input type="number" value={data.maxWeight} onChange={(e) => updateField('maxWeight', Number(e.target.value))} className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={data.timeWindowRequired}
                  onChange={(e) => updateField('timeWindowRequired', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                />
                <label className="text-[14px] text-slate-700">{t.onboarding.timeWindowRequired}</label>
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-[14px] text-slate-500 mb-4">{t.onboarding.reviewConfig}</p>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.onboarding.companyName}</span>
                  <p className="text-[14px] text-slate-800">{data.companyName || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.onboarding.taxId}</span>
                  <p className="text-[14px] text-slate-800">{data.taxId || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.onboarding.city}</span>
                  <p className="text-[14px] text-slate-800">{data.city || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.onboarding.erpSystem}</span>
                  <p className="text-[14px] text-slate-800">{data.erpSystem}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.sidebar.carriers} ({data.carriers.length})</span>
                {data.carriers.map((c) => (
                  <p key={c.id} className="text-[14px] text-slate-800">{c.name} — {c.serviceType}</p>
                ))}
                {data.carriers.length === 0 && <p className="text-[14px] text-slate-400">—</p>}
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.onboarding.maxDistance}</span>
                  <p className="text-[14px] text-slate-800">{data.maxDistance} km</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.onboarding.maxWeight}</span>
                  <p className="text-[14px] text-slate-800">{data.maxWeight} kg</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.onboarding.timeWindowRequired}</span>
                  <p className="text-[14px] text-slate-800">{data.timeWindowRequired ? t.common.yes : t.common.no}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="px-5 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t.onboarding.previous}
            </button>
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
                disabled={!canNext()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-400/10 transition-all"
              >
                {t.common.next}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-[13px] font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 shadow-lg shadow-green-500/10 transition-all flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.onboarding.completeSetup}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
