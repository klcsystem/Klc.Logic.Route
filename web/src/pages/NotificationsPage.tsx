import { useState } from 'react'
import { Bell, Check, AlertTriangle, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { notificationsApi } from '../api/client'
import { useApi } from '../utils/useApi'
import type { Notification } from '../types'

const typeConfig: Record<string, { icon: typeof Bell; bg: string; border: string; iconColor: string; dot: string }> = {
  Critical: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-500', dot: 'bg-red-500' },
  Warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-500', dot: 'bg-amber-500' },
  Info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-500', dot: 'bg-blue-500' },
  Positive: { icon: CheckCircle2, bg: 'bg-green-50', border: 'border-green-200', iconColor: 'text-green-500', dot: 'bg-green-500' },
}

const defaultConfig = { icon: Bell, bg: 'bg-slate-50', border: 'border-slate-200', iconColor: 'text-slate-500', dot: 'bg-slate-500' }

export default function NotificationsPage() {
  const { t } = useI18n()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data: notificationsData, isLoading, refetch } = useApi(
    () => notificationsApi.getAll(1, 100),
    [],
  )

  const notifications: Notification[] = (notificationsData as unknown as { items?: Notification[] })?.items
    || (Array.isArray(notificationsData) ? notificationsData as unknown as Notification[] : [])

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      refetch()
    } catch { /* failed */ }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      refetch()
    } catch { /* failed */ }
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

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {filtered.map((n) => {
            const config = typeConfig[n.type] || defaultConfig
            const Icon = config.icon
            return (
              <div key={n.id} onClick={() => !n.isRead && handleMarkAsRead(n.id)} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!n.isRead ? `${config.border} ${config.bg} cursor-pointer` : 'border-slate-200/60'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${!n.isRead ? config.bg : 'bg-slate-50'} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!n.isRead && <div className={`w-2 h-2 rounded-full ${config.dot}`} />}
                      <h4 className="text-[14px] font-semibold text-slate-800">{n.type}</h4>
                    </div>
                    <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString('tr-TR')}</p>
                  </div>
                  {!n.isRead && (
                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id) }} className="p-1.5 rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors" title="Okundu isaretle">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
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
      )}
    </div>
  )
}
