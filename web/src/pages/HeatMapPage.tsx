import { useState, useMemo } from 'react'
import { MapPin, Flame, Filter, BarChart3 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface OrderPoint {
  id: string
  destinationCity: string
  destinationLat: number | null
  destinationLng: number | null
  status: string
  createdAt: string
}

interface ClusterPoint {
  key: string
  lat: number
  lng: number
  count: number
  city: string
}

const ordersApi = {
  getAll: (page = 1, pageSize = 5000) =>
    api.get('/orders', { params: { page, pageSize } }).then(r => r.data),
}

function clusterOrders(orders: OrderPoint[]): ClusterPoint[] {
  const clusters = new Map<string, ClusterPoint>()

  for (const order of orders) {
    if (order.destinationLat == null || order.destinationLng == null) continue
    // Round to 2 decimal places for clustering
    const roundedLat = Math.round(order.destinationLat * 100) / 100
    const roundedLng = Math.round(order.destinationLng * 100) / 100
    const key = `${roundedLat},${roundedLng}`

    if (clusters.has(key)) {
      clusters.get(key)!.count++
    } else {
      clusters.set(key, {
        key,
        lat: roundedLat,
        lng: roundedLng,
        count: 1,
        city: order.destinationCity || 'Bilinmiyor',
      })
    }
  }

  return Array.from(clusters.values()).sort((a, b) => b.count - a.count)
}

function getHeatColor(count: number, max: number): string {
  const ratio = count / Math.max(max, 1)
  if (ratio > 0.66) return 'bg-red-500/80 border-red-600'
  if (ratio > 0.33) return 'bg-amber-400/80 border-amber-500'
  return 'bg-green-400/80 border-green-500'
}

function getHeatColorLabel(count: number, max: number): string {
  const ratio = count / Math.max(max, 1)
  if (ratio > 0.66) return 'Yuksek'
  if (ratio > 0.33) return 'Orta'
  return 'Dusuk'
}

function getRadius(count: number, max: number): number {
  const base = 8
  const maxR = 40
  return base + (count / Math.max(max, 1)) * (maxR - base)
}

export default function HeatMapPage() {
  const [filterCity, setFilterCity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const { data: ordersData, isLoading } = useApi<OrderPoint[]>(
    () => ordersApi.getAll(1, 5000),
    [],
  )

  const orders: OrderPoint[] = ordersData || []

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filterCity && o.destinationCity && !o.destinationCity.toLowerCase().includes(filterCity.toLowerCase())) return false
      if (filterStatus && o.status !== filterStatus) return false
      if (filterDateFrom && o.createdAt < filterDateFrom) return false
      if (filterDateTo && o.createdAt > filterDateTo) return false
      return true
    })
  }, [orders, filterCity, filterStatus, filterDateFrom, filterDateTo])

  const clusters = useMemo(() => clusterOrders(filteredOrders), [filteredOrders])
  const maxCount = clusters.length > 0 ? clusters[0].count : 1
  const totalWithCoords = filteredOrders.filter(o => o.destinationLat != null).length
  const hottestZone = clusters.length > 0 ? clusters[0].city : '-'
  const avgPerZone = clusters.length > 0 ? Math.round(totalWithCoords / clusters.length) : 0

  // Unique cities and statuses for filter dropdowns
  const cities = useMemo(() => {
    const set = new Set<string>()
    orders.forEach(o => { if (o.destinationCity) set.add(o.destinationCity) })
    return Array.from(set).sort()
  }, [orders])

  const statuses = useMemo(() => {
    const set = new Set<string>()
    orders.forEach(o => { if (o.status) set.add(o.status) })
    return Array.from(set).sort()
  }, [orders])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sipariş Yoğunluk Haritasi</h1>
          <p className="text-sm text-slate-500 mt-1">Bölgelere gore sipariş dağılımı ve yoğunluk analizi</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Toplam Sipariş" value={totalWithCoords} icon={MapPin} color="bg-blue-50 text-blue-600" />
        <StatCard label="En Yogun Bölge" value={hottestZone} icon={Flame} color="bg-red-50 text-red-600" />
        <StatCard label="Ort. Sipariş/Bölge" value={avgPerZone} icon={BarChart3} color="bg-amber-50 text-amber-600" />
        <StatCard label="Toplam Bölge" value={clusters.length} icon={MapPin} color="bg-green-50 text-green-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filtreler</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tüm Şehirler</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tüm Durumlar</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Baslangic"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Bitis"
          />
        </div>
      </div>

      {/* Heat Map Visualization */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Yoğunluk Haritasi</h2>
          <p className="text-xs text-slate-400 mt-0.5">Koordinat kumeleme ile sipariş yoğunluğu (2 ondalik hassasiyet)</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">Yükleniyor...</div>
        ) : clusters.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400">Koordinat verisi bulunamadı</div>
        ) : (
          <div className="relative bg-slate-50" style={{ height: 500 }}>
            {/* Simple SVG-based heat map */}
            <svg viewBox="25 35 20 10" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {/* Turkey approximate outline background */}
              <rect x="25" y="35" width="20" height="10" fill="#f1f5f9" rx="0.5" />

              {clusters.map(cluster => {
                const r = getRadius(cluster.count, maxCount) / 100
                const ratio = cluster.count / Math.max(maxCount, 1)
                const fill = ratio > 0.66 ? '#ef4444' : ratio > 0.33 ? '#f59e0b' : '#22c55e'
                const opacity = 0.3 + ratio * 0.5

                return (
                  <g key={cluster.key}>
                    <circle
                      cx={cluster.lng}
                      cy={cluster.lat}
                      r={r}
                      fill={fill}
                      opacity={opacity}
                      stroke={fill}
                      strokeWidth={0.02}
                    />
                    {cluster.count > 2 && (
                      <text
                        x={cluster.lng}
                        y={cluster.lat + 0.05}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={0.15}
                        fill="#1e293b"
                        fontWeight="bold"
                      >
                        {cluster.count}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 shadow-sm border border-slate-200 text-xs">
              <div className="font-medium text-slate-700 mb-2">Yoğunluk</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-600">Yuksek</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-600">Orta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-slate-600">Dusuk</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cluster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Bölge Detayları</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">#</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Bölge</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Koordinat</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Sipariş Sayısı</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Yoğunluk</th>
              </tr>
            </thead>
            <tbody>
              {clusters.slice(0, 50).map((cluster, idx) => (
                <tr key={cluster.key} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{cluster.city}</td>
                  <td className="px-4 py-3 text-slate-500">{cluster.lat.toFixed(2)}, {cluster.lng.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{cluster.count}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      getHeatColor(cluster.count, maxCount).replace('bg-', 'bg-').replace('/80', '/20').replace('border-', 'text-')
                    }`}>
                      {getHeatColorLabel(cluster.count, maxCount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
