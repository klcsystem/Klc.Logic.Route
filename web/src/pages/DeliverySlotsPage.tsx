import { useState } from 'react'
import { Clock, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { toast } from '../components/ui/Toast'

interface DeliverySlot {
  id: string
  date: string
  startTime: string
  endTime: string
  customerName: string | null
  customerPhone: string | null
  zipCode: string | null
  status: string
  reservedAt: string | null
  confirmedAt: string | null
  expiresAt: string | null
}

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  Available: { label: 'Müsait', variant: 'success' },
  Reserved: { label: 'Rezerve', variant: 'warning' },
  Confirmed: { label: 'Onaylı', variant: 'info' },
  Expired: { label: 'Süresi Dolmuş', variant: 'error' },
}

export default function DeliverySlotsPage() {
  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [zipCode, setZipCode] = useState('')
  const [slots, setSlots] = useState<DeliverySlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const fetchSlots = async () => {
    setIsLoading(true)
    setHasSearched(true)
    try {
      const params: Record<string, string> = { date }
      if (zipCode.trim()) params.zipCode = zipCode.trim()
      const res = await api.get('/delivery-slots/available', { params })
      const data = res.data?.data || res.data || []
      setSlots(Array.isArray(data) ? data : [])
    } catch {
      toast('error', 'Teslimat slotları yüklenemedi')
      setSlots([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReserve = async (slot: DeliverySlot) => {
    const customerName = prompt('Müşteri adı:')
    if (!customerName) return
    const customerPhone = prompt('Müşteri telefon:')
    if (!customerPhone) return

    try {
      await api.post('/delivery-slots/reserve', {
        slotId: slot.id,
        customerName,
        customerPhone,
      })
      toast('success', 'Slot rezerve edildi')
      fetchSlots()
    } catch {
      toast('error', 'Rezervasyon yapılamadı')
    }
  }

  const handleConfirm = async (slot: DeliverySlot) => {
    try {
      await api.post(`/delivery-slots/${slot.id}/confirm`)
      toast('success', 'Slot onaylandı')
      fetchSlots()
    } catch {
      toast('error', 'Onaylama başarısız')
    }
  }

  const available = slots.filter(s => s.status === 'Available').length
  const reserved = slots.filter(s => s.status === 'Reserved').length
  const confirmed = slots.filter(s => s.status === 'Confirmed').length

  const kpis = [
    { label: 'Toplam Slot', value: slots.length.toString(), icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Müsait', value: available.toString(), icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: 'Rezerve', value: reserved.toString(), icon: AlertCircle, color: 'text-orange-600 bg-orange-50' },
    { label: 'Onaylı', value: confirmed.toString(), icon: CheckCircle2, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Teslimat Slotları</h1>
        <p className="text-[14px] text-slate-400 mt-1">Teslimat zaman dilimi yönetimi ve müşteri slot tercihleri</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
            />
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Posta Kodu (opsiyonel)</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="34000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
            />
          </div>
          <button
            onClick={fetchSlots}
            disabled={isLoading || !date}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Slotları Getir
          </button>
        </div>
      </div>

      {hasSearched && !isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => <StatCard key={kpi.label} {...kpi} />)}
          </div>

          {/* Slots Table */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-[15px] font-semibold text-slate-800">{date} Teslimat Slotları</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Zaman Dilimi</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Posta Kodu</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Müşteri</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Telefon</th>
                    <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                    <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(slot => {
                    const statusInfo = statusMap[slot.status] || { label: slot.status, variant: 'default' as const }
                    return (
                      <tr key={slot.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-[13px] font-semibold text-slate-800">{slot.startTime} - {slot.endTime}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-[13px] text-slate-600">{slot.zipCode || '--'}</td>
                        <td className="px-6 py-3.5 text-[13px] text-slate-700">{slot.customerName || '--'}</td>
                        <td className="px-6 py-3.5 text-[13px] text-slate-600">{slot.customerPhone || '--'}</td>
                        <td className="px-6 py-3.5 text-center"><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></td>
                        <td className="px-6 py-3.5 text-center">
                          {slot.status === 'Available' && (
                            <button onClick={() => handleReserve(slot)} className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-[12px] font-medium hover:bg-orange-100 transition-colors border border-orange-200">
                              Rezerve Et
                            </button>
                          )}
                          {slot.status === 'Reserved' && (
                            <button onClick={() => handleConfirm(slot)} className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-[12px] font-medium hover:bg-green-100 transition-colors border border-green-200">
                              Onayla
                            </button>
                          )}
                          {(slot.status === 'Confirmed' || slot.status === 'Expired') && (
                            <span className="text-[12px] text-slate-400">--</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {slots.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-[14px] text-slate-400">Bu tarih için slot bulunamadı</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
        </div>
      )}
    </div>
  )
}
