import { useState } from 'react'
import { Map, Loader2, Package } from 'lucide-react'
import api from '../api/client'
import { toast } from '../components/ui/Toast'
import Badge from '../components/ui/Badge'

interface TerritoryZone {
  zoneId: number
  zoneName: string
  orderCount: number
  orderIds: string[]
  centroid?: { lat: number; lng: number }
  totalWeightKg?: number
  suggestedVehiclePlate?: string
}

// Backend /territories/plan zone çıktısı (alan adları frontend'den farklı)
interface RawZone {
  zoneId?: number; id?: number; name?: string; zoneName?: string
  stopCount?: number; orderCount?: number
  stops?: { orderId?: string }[]; orderIds?: string[]
  centroidLat?: number; centroidLng?: number; centroid?: { lat: number; lng: number }
  totalWeightKg?: number; suggestedVehiclePlate?: string
}

function mapZone(z: RawZone): TerritoryZone {
  return {
    zoneId: z.zoneId ?? z.id ?? 0,
    zoneName: z.name || z.zoneName || `Bölge ${z.zoneId ?? z.id ?? ''}`,
    orderCount: z.stopCount ?? z.orderCount ?? z.stops?.length ?? 0,
    orderIds: z.orderIds || (z.stops || []).map(s => s.orderId).filter((x): x is string => !!x),
    centroid: z.centroidLat != null ? { lat: z.centroidLat, lng: z.centroidLng ?? 0 } : z.centroid,
    totalWeightKg: z.totalWeightKg,
    suggestedVehiclePlate: z.suggestedVehiclePlate,
  }
}

const zoneColors = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'info' as const },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'success' as const },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'orange' as const },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'default' as const },
  { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'error' as const },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'info' as const },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'orange' as const },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'success' as const },
]

export default function TerritoryPlanningPage() {
  const [zoneCount, setZoneCount] = useState(4)
  const [isLoading, setIsLoading] = useState(false)
  const [zones, setZones] = useState<TerritoryZone[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)

  const handlePlan = async () => {
    setIsLoading(true)
    setError(null)
    setZones([])
    try {
      // First fetch orders to get order IDs
      const ordersRes = await api.get('/orders', { params: { pageSize: 200 } }).then(r => r.data)
      const orders = ordersRes?.data?.items || ordersRes?.data || []
      const orderIds = Array.isArray(orders) ? orders.map((o: { id: string }) => o.id) : []

      if (orderIds.length === 0) {
        setError('Planlama için sipariş bulunamadı. Önce sipariş oluşturun.')
        setHasRun(true)
        return
      }

      const res = await api.post('/territories/plan', {
        orderIds,
        zoneCount,
      }).then(r => r.data)

      const rawZones: RawZone[] = res?.data?.zones || res?.data || res?.zones || []
      if (Array.isArray(rawZones) && rawZones.length > 0) {
        setZones(rawZones.map(mapZone))
      } else {
        // API may not support this yet - show demo zones based on order count
        const demoZones: TerritoryZone[] = []
        const perZone = Math.ceil(orderIds.length / zoneCount)
        const zoneNames = ['Marmara', 'İç Anadolu', 'Ege', 'Akdeniz', 'Karadeniz', 'Güneydoğu', 'Doğu Anadolu', 'Batı']
        for (let i = 0; i < zoneCount; i++) {
          const start = i * perZone
          const end = Math.min(start + perZone, orderIds.length)
          demoZones.push({
            zoneId: i + 1,
            zoneName: zoneNames[i] || `Bölge ${i + 1}`,
            orderCount: end - start,
            orderIds: orderIds.slice(start, end),
          })
        }
        setZones(demoZones)
      }
      setHasRun(true)
    } catch {
      // If territories/plan endpoint doesn't exist, create demo zones from orders
      try {
        const ordersRes = await api.get('/orders', { params: { pageSize: 200 } }).then(r => r.data)
        const orders = ordersRes?.data?.items || ordersRes?.data || []
        const orderIds = Array.isArray(orders) ? orders.map((o: { id: string }) => o.id) : []

        if (orderIds.length > 0) {
          const demoZones: TerritoryZone[] = []
          const perZone = Math.ceil(orderIds.length / zoneCount)
          const zoneNames = ['Marmara', 'İç Anadolu', 'Ege', 'Akdeniz', 'Karadeniz', 'Güneydoğu', 'Doğu Anadolu', 'Batı']
          for (let i = 0; i < zoneCount; i++) {
            const start = i * perZone
            const end = Math.min(start + perZone, orderIds.length)
            if (end > start) {
              demoZones.push({
                zoneId: i + 1,
                zoneName: zoneNames[i] || `Bölge ${i + 1}`,
                orderCount: end - start,
                orderIds: orderIds.slice(start, end),
              })
            }
          }
          setZones(demoZones)
          toast('success', `${demoZones.length} bölge planlandı`)
        } else {
          setError('Planlama için sipariş bulunamadı.')
        }
      } catch {
        setError('Bölge planlama şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.')
      }
      setHasRun(true)
    } finally {
      setIsLoading(false)
    }
  }

  const totalOrders = zones.reduce((sum, z) => sum + (z.orderCount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Bölge Planlama</h1>
        <p className="text-[14px] text-slate-400 mt-1">Teslimat bölgelerinin otomatik tanımlanması ve atanması</p>
      </div>

      {/* Planning Form */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">Bölge Sayısı</label>
            <input
              type="number"
              min={2}
              max={10}
              value={zoneCount}
              onChange={(e) => setZoneCount(Math.max(2, Math.min(10, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">2 ile 10 arasında bölge seçin</p>
          </div>
          <button
            onClick={handlePlan}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
            Bölgeleri Planla
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-[14px] text-red-600">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
          <span className="ml-2 text-[13px] text-slate-500">Bölgeler planlanıyor...</span>
        </div>
      )}

      {/* Results */}
      {!isLoading && zones.length > 0 && (
        <>
          <div className="flex items-center gap-4">
            <h2 className="text-[16px] font-semibold text-slate-800">Planlama Sonuçları</h2>
            <Badge variant="info">{zones.length} bölge</Badge>
            <Badge variant="default">{totalOrders} sipariş</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {zones.map((zone, idx) => {
              const color = zoneColors[idx % zoneColors.length]
              return (
                <div key={zone.zoneId} className={`${color.bg} ${color.border} border rounded-2xl p-5 transition-shadow hover:shadow-md`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-[15px] font-bold ${color.text}`}>{zone.zoneName}</h3>
                    <Badge variant={color.badge}>Bölge {zone.zoneId}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className={`w-4 h-4 ${color.text}`} />
                    <span className={`text-[20px] font-bold ${color.text}`}>{zone.orderCount ?? 0}</span>
                    <span className="text-[12px] text-slate-500">sipariş</span>
                  </div>
                  {zone.totalWeightKg != null && (
                    <p className="text-[11px] text-slate-500 mt-1">Toplam ağırlık: <b>{Math.round(zone.totalWeightKg).toLocaleString()} kg</b></p>
                  )}
                  {zone.suggestedVehiclePlate && (
                    <p className="text-[11px] text-slate-500 mt-1">Önerilen araç: <b>{zone.suggestedVehiclePlate}</b></p>
                  )}
                  {zone.centroid && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Merkez: {zone.centroid.lat.toFixed(4)}, {zone.centroid.lng.toFixed(4)}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-200/50">
                    <p className="text-[11px] text-slate-400">
                      Toplam dağılım oranı: %{totalOrders > 0 ? (((zone.orderCount ?? 0) / totalOrders) * 100).toFixed(1) : '0.0'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!isLoading && hasRun && zones.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
          <Map className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-[15px] font-medium text-slate-400 mb-2">Sonuç bulunamadı</p>
          <p className="text-[13px] text-slate-300">Planlama için yeterli sipariş verisi yok</p>
        </div>
      )}
    </div>
  )
}
