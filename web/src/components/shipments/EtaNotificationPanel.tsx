import { useState } from 'react'
import { Mail, Phone, Copy, Check, Send, Link2 } from 'lucide-react'
import { useI18n } from '../../i18n'

interface EtaNotificationPanelProps {
  shipmentId: string
  trackingToken?: string
}

export default function EtaNotificationPanel({ shipmentId, trackingToken }: EtaNotificationPanelProps) {
  const { t } = useI18n()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [sendingType, setSendingType] = useState<'sms' | 'email' | null>(null)
  const [sent, setSent] = useState<'sms' | 'email' | null>(null)
  const [copied, setCopied] = useState(false)

  const trackingUrl = trackingToken
    ? `${window.location.origin}/tracking/${trackingToken}`
    : ''

  const handleSendSms = async () => {
    if (!phone) return
    setSendingType('sms')
    // TODO: Replace with real API call when backend ready
    // await api.post(`/shipments/${shipmentId}/notify-customer`, { type: 'sms', phone })
    console.log('Sending SMS for shipment:', shipmentId, 'to:', phone)
    await new Promise(r => setTimeout(r, 1000))
    setSendingType(null)
    setSent('sms')
    setTimeout(() => setSent(null), 3000)
  }

  const handleSendEmail = async () => {
    if (!email) return
    setSendingType('email')
    // TODO: Replace with real API call
    // await api.post(`/shipments/${shipmentId}/notify-customer`, { type: 'email', email })
    await new Promise(r => setTimeout(r, 1000))
    setSendingType(null)
    setSent('email')
    setTimeout(() => setSent(null), 3000)
  }

  const handleCopyLink = () => {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-4 h-4 text-orange-500" />
        <h3 className="text-[15px] font-semibold text-slate-800">{t.tracking.notifyCustomer}</h3>
      </div>

      {/* Tracking Link */}
      {trackingUrl && (
        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{t.tracking.trackingLink}</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[13px] text-slate-600 overflow-hidden">
              <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{trackingUrl}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? t.tracking.copied : t.tracking.copy}
            </button>
          </div>
        </div>
      )}

      {/* SMS */}
      <div className="mb-4">
        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{t.tracking.customerPhone}</label>
        <div className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+90 5XX XXX XX XX"
            className={inputClass}
          />
          <button
            onClick={handleSendSms}
            disabled={!phone || sendingType === 'sms'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all shrink-0"
          >
            {sendingType === 'sms' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : sent === 'sms' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            {t.tracking.sendSms}
          </button>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{t.tracking.customerEmail}</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="musteri@firma.com"
            className={inputClass}
          />
          <button
            onClick={handleSendEmail}
            disabled={!email || sendingType === 'email'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all shrink-0"
          >
            {sendingType === 'email' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : sent === 'email' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {t.tracking.sendEmail}
          </button>
        </div>
      </div>
    </div>
  )
}
