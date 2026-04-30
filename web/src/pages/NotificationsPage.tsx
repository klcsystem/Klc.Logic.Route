import { useState } from 'react'
import { Bell, Check, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react'
import { useI18n } from '../i18n'

interface NotificationItem {
  id: string
  type: 'Critical' | 'Warning' | 'Info' | 'Positive'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

const mockNotifications: NotificationItem[] = [
  { id: '1', type: 'Critical', title: 'Sevkiyat Gecikmesi', message: 'SHP-2024-0412 sevkiyati 2 saat gecikti. Aras Kargo bilgilendirildi.', isRead: false, createdAt: '2024-03-15 14:30' },
  { id: '2', type: 'Warning', title: 'Anlasma Suresi Doluyor', message: 'MNG Kargo ile CNT-2024-002 anlasmasinin suresi 15 gun icinde doluyor.', isRead: false, createdAt: '2024-03-15 11:00' },
  { id: '3', type: 'Positive', title: 'Teslim Tamamlandi', message: 'SHP-2024-0410 basariyla teslim edildi. Zamaninda teslim orani: %94.2', isRead: false, createdAt: '2024-03-14 16:45' },
  { id: '4', type: 'Info', title: 'ERP Senkronizasyon', message: '142 yeni siparis ERP\'den senkronize edildi.', isRead: true, createdAt: '2024-03-14 09:00' },
  { id: '5', type: 'Warning', title: 'Kapasite Uyarisi', message: 'Istanbul depo kapasitesinin %85\'ine ulasti.', isRead: true, createdAt: '2024-03-13 15:20' },
  { id: '6', type: 'Positive', title: 'CO2 Hedefi', message: 'Bu ayin CO2 emisyonu hedefin %14 altinda.', isRead: true, createdAt: '2024-03-13 10:00' },
  { id: '7', type: 'Info', title: 'Yeni Tasiyici', message: 'PTT Kargo sisteme eklendi ve aktif edildi.', isRead: true, createdAt: '2024-03-12 14:00' },
]

const typeConfig = {
  Critical: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-500', dot: 'bg-red-500' },
  Warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-500', dot: 'bg-amber-500' },
  Info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-500', dot: 'bg-blue-500' },
  Positive: { icon: CheckCircle2, bg: 'bg-green-50', border: 'border-green-200', iconColor: 'text-green-500', dot: 'bg-green-500' },
}

export default function NotificationsPage() {
  const { t } = useI18n()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notifications, setNotifications] = useState(mockNotifications)

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.notifications.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.notifications.subtitle}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Check className="w-4 h-4" /> {t.notifications.markAllRead}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors ${filter === 'all' ? 'bg-orange-400 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {t.notifications.all} ({notifications.length})
        </button>
        <button onClick={() => setFilter('unread')} className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors ${filter === 'unread' ? 'bg-orange-400 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {t.notifications.unread} ({unreadCount})
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((n) => {
          const config = typeConfig[n.type]
          const Icon = config.icon
          return (
            <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!n.isRead ? `${config.border} ${config.bg}` : 'border-slate-200/60'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${!n.isRead ? config.bg : 'bg-slate-50'} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.isRead && <div className={`w-2 h-2 rounded-full ${config.dot}`} />}
                    <h4 className="text-[14px] font-semibold text-slate-800">{n.title}</h4>
                  </div>
                  <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-2">{n.createdAt}</p>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-[14px] text-slate-400">{t.notifications.noNotifications}</p>
          </div>
        )}
      </div>
    </div>
  )
}
