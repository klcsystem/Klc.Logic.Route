import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Package, Route, Truck, User } from 'lucide-react'
import { ordersApi } from '../api/orders'
import type { Order } from '../types'

// ── Helpers ──

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const mStr = monday.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  const sStr = sunday.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${mStr} - ${sStr}`
}

const DAY_NAMES_TR = ['Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi', 'Pazar']

interface DayData {
  date: Date
  dateStr: string
  dayName: string
  orders: Order[]
  routeCount: number
  drivers: { name: string; stopCount: number }[]
  usedCapacityKg: number
  totalCapacityKg: number
}

// ── Component ──

export default function WeeklyPlannerPage() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    ordersApi.getAll({ pageSize: 500 })
      .then(res => {
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data as { items?: Order[] }).items || []
          setOrders(items)
        }
      })
      .catch(() => { /* fallback: empty */ })
      .finally(() => setLoading(false))
  }, [])

  const days: DayData[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      const dateStr = formatDate(date)
      const dayOrders = orders.filter(o => {
        if (!o.requestedDeliveryDate) return false
        return o.requestedDeliveryDate.startsWith(dateStr)
      })

      // Count unique routes
      const routeIds = new Set(dayOrders.filter(o => o.routeId).map(o => o.routeId))

      // Group by assigned driver (mock: use routeId as driver proxy)
      const driverMap = new Map<string, number>()
      dayOrders.forEach(o => {
        const driverKey = o.routeId || 'Unassigned'
        driverMap.set(driverKey, (driverMap.get(driverKey) || 0) + 1)
      })
      const drivers = Array.from(driverMap.entries()).map(([name, stopCount]) => ({
        name: name === 'Unassigned' ? 'Atanmamis' : `Rota ${name.slice(0, 6)}`,
        stopCount,
      }))

      const usedCapacityKg = dayOrders.reduce((sum, o) => sum + (o.totalWeightKg || 0), 0)
      // Assume a default fleet capacity of 20,000 kg per day
      const totalCapacityKg = 20000

      return {
        date,
        dateStr,
        dayName: DAY_NAMES_TR[i],
        orders: dayOrders,
        routeCount: routeIds.size,
        drivers,
        usedCapacityKg,
        totalCapacityKg,
      }
    })
  }, [weekStart, orders])

  const handlePrevWeek = () => setWeekStart(prev => addDays(prev, -7))
  const handleNextWeek = () => setWeekStart(prev => addDays(prev, 7))
  const handleToday = () => setWeekStart(getMonday(new Date()))

  const handleDayClick = (dateStr: string) => {
    navigate(`/plan?date=${dateStr}`)
  }

  const todayStr = formatDate(new Date())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Haftalık Planlama</h1>
        <p className="text-[14px] text-slate-400 mt-1">Haftalık sipariş ve rota planlama takvimi</p>
      </div>

      {/* Week Selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/60 shadow-sm px-5 py-3">
        <button
          onClick={handlePrevWeek}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Onceki Hafta
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-bold text-slate-800">{formatWeekRange(weekStart)}</h2>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-[11px] font-semibold hover:bg-orange-100 transition-colors"
          >
            Bugun
          </button>
        </div>
        <button
          onClick={handleNextWeek}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Sonraki Hafta
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-[14px] text-slate-400">Siparişler yükleniyor...</span>
        </div>
      )}

      {/* 7-Column Grid */}
      {!loading && (
        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => {
            const isToday = day.dateStr === todayStr
            const hasOrders = day.orders.length > 0
            const capacityPct = day.totalCapacityKg > 0 ? Math.min(100, Math.round((day.usedCapacityKg / day.totalCapacityKg) * 100)) : 0

            return (
              <div
                key={day.dateStr}
                onClick={() => handleDayClick(day.dateStr)}
                className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md hover:border-orange-200 ${
                  isToday ? 'border-orange-400 ring-2 ring-orange-100' : 'border-slate-200/60'
                }`}
              >
                {/* Day Header */}
                <div className="text-center mb-3">
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? 'text-orange-500' : 'text-slate-400'}`}>
                    {day.dayName}
                  </p>
                  <p className={`text-[18px] font-bold mt-0.5 ${isToday ? 'text-orange-600' : 'text-slate-800'}`}>
                    {formatShortDate(day.date)}
                  </p>
                </div>

                {/* Badges */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[12px] text-slate-600">
                      <span className="font-semibold">{day.orders.length}</span> sipariş
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Route className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[12px] text-slate-600">
                      <span className="font-semibold">{day.routeCount}</span> rota
                    </span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Kapasite</span>
                    <span className="font-semibold">{capacityPct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        capacityPct > 80 ? 'bg-red-400' : capacityPct > 50 ? 'bg-orange-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                </div>

                {/* Driver List */}
                {hasOrders && day.drivers.length > 0 && (
                  <div className="space-y-1 border-t border-slate-100 pt-2">
                    {day.drivers.slice(0, 3).map((driver, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {driver.name === 'Atanmamis' ? (
                          <Truck className="w-3 h-3 text-slate-300" />
                        ) : (
                          <User className="w-3 h-3 text-slate-400" />
                        )}
                        <span className="text-[10px] text-slate-500 truncate flex-1">{driver.name}</span>
                        <span className="text-[10px] font-semibold text-slate-600">{driver.stopCount}</span>
                      </div>
                    ))}
                    {day.drivers.length > 3 && (
                      <p className="text-[10px] text-slate-300 text-center">+{day.drivers.length - 3} daha</p>
                    )}
                  </div>
                )}

                {!hasOrders && (
                  <div className="text-center py-2">
                    <p className="text-[10px] text-slate-300">Sipariş yok</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
