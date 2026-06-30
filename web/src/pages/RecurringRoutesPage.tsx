import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Loader2, Plus, Calendar, MapPin } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/ui/Badge'

interface RecurringRoute {
  id: string
  name: string
  schedule: 'Daily' | 'Weekly' | 'Monthly'
  isActive: boolean
  stopsCount: number
  lastActivated?: string
  description?: string
  origin?: string
  destination?: string
}

const scheduleLabels: Record<string, string> = {
  Daily: 'Günlük',
  Weekly: 'Haftalık',
  Monthly: 'Aylık',
}

const scheduleBadgeVariant = (s: string): 'info' | 'success' | 'orange' => {
  switch (s) {
    case 'Daily': return 'info'
    case 'Weekly': return 'success'
    case 'Monthly': return 'orange'
    default: return 'info'
  }
}

export default function RecurringRoutesPage() {
  const [routes, setRoutes] = useState<RecurringRoute[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get('/recurring-routes').then(r => r.data)
      const data = res?.data?.items || res?.data || []
      setRoutes(Array.isArray(data) ? data : [])
    } catch {
      // API endpoint may not exist yet - show empty state gracefully
      setRoutes([])
      setError('Tekrarlayan rota verileri yüklenemedi. API endpoint henüz aktif olmayabilir.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchRoutes() }, [fetchRoutes])

  const handleToggleActive = async (route: RecurringRoute) => {
    try {
      await api.patch(`/recurring-routes/${route.id}`, { isActive: !route.isActive })
      setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, isActive: !r.isActive } : r))
    } catch {
      // silently fail toggle
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Tekrarlayan Rotalar</h1>
          <p className="text-[14px] text-slate-400 mt-1">Düzenli rotaların otomatik tespiti ve şablonlaştırılması</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Plus className="w-4 h-4" /> Şablon Ekle
        </button>
      </div>

      {error && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-[13px] text-amber-700">{error}</p>
          <button onClick={fetchRoutes} className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-[12px] font-medium hover:bg-amber-200 transition-colors">Tekrar Dene</button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
        </div>
      )}

      {!isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ad</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Periyot</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Durak Sayısı</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Güzergah</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Son Aktifleştirme</th>
                  <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Aktif</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[13px] font-medium text-slate-800 block">{route.name}</span>
                          {route.description && <span className="text-[11px] text-slate-400">{route.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={scheduleBadgeVariant(route.schedule)}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {scheduleLabels[route.schedule] || route.schedule}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="text-[14px] font-semibold text-slate-700">{route.stopsCount}</span>
                      <span className="text-[11px] text-slate-400 ml-1">durak</span>
                    </td>
                    <td className="px-6 py-3.5">
                      {route.origin && route.destination ? (
                        <div className="flex items-center gap-1 text-[12px] text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {route.origin} → {route.destination}
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-600">
                      {route.lastActivated
                        ? new Date(route.lastActivated).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '--'}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(route)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${route.isActive ? 'bg-green-400' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${route.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
                {routes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-[14px] text-slate-400 mb-1">Henüz tekrarlayan rota şablonu yok</p>
                      <p className="text-[12px] text-slate-300">Rota verisi biriktikçe sistem otomatik şablonlar önerecektir</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
