import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LogOut, Globe, Bell, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../i18n'
import { notificationsApi } from '../../api/client'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/orders': 'orders',
  '/shipments': 'shipments',
  '/tracking': 'liveTracking',
  '/route-optimization': 'routeOptimization',
  '/carriers': 'carriers',
  '/contracts': 'contracts',
  '/rules': 'rules',
  '/reports': 'reports',
  '/carrier-scorecard': 'carrierScorecard',
  '/market-intelligence': 'marketIntelligence',
  '/co2': 'co2Report',
  '/settings': 'settings',
  '/users': 'users',
  '/notifications': 'notifications',
}

export default function Header() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useI18n()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    notificationsApi.getUnreadCount()
      .then(res => { const c = res?.data ?? 0; setUnreadCount(typeof c === 'number' ? c : 0) })
      .catch(() => {})
  }, [])

  const routeKey = ROUTE_TITLES[location.pathname] || ''
  const pageTitle = routeKey ? (t.sidebar as Record<string, string>)[routeKey] || '' : ''

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Page Title */}
      <div>
        {pageTitle && (
          <h1 className="text-[15px] font-semibold text-slate-800">{pageTitle}</h1>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="font-medium">{lang === 'en' ? 'TR' : 'EN'}</span>
        </button>

        {/* Notifications */}
        <a
          href="/notifications"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
          )}
        </a>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-2" />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
              {user?.firstName[0]}{user?.lastName[0]}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[12px] font-medium text-slate-700 leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{user?.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 py-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[12px] font-medium text-slate-700">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); logout() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t.sidebar.signOut}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
