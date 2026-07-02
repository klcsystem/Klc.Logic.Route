import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, Truck, MapPin, Zap, AlertCircle, CheckCircle2, ArrowLeft, Clock, Package, DollarSign, XCircle } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
import DonutChart from '../components/ui/DonutChart'
import StopListPanel from '../components/route-optimizer/StopListPanel'
import OptimizedRouteMap from '../components/route-optimizer/OptimizedRouteMap'
import ComparisonView from '../components/route-optimizer/ComparisonView'
import { routeOptimizationApi } from '../api/routeOptimization'
import { ordersApi } from '../api/orders'
import { toast } from '../components/ui/Toast'
import type { VrpVehicle, VrpStop, VrpSolution } from '../api/routeOptimization'
import type { Order } from '../types'

// Araçlar API'den yüklenecek, fallback olarak boş liste

function orderToStop(order: Order): VrpStop | null {
  const lat = order.destinationLat || order.originLat
  const lng = order.destinationLng || order.originLng
  if (!lat || !lng) return null
  return {
    id: order.id,
    address: `${order.customerName} — ${order.destinationCity || order.originCity || ''}`,
    lat,
    lng,
    demandKg: order.totalWeightKg || 0,
    demandM3: order.totalVolumeM3 || 0,
    serviceDurationMin: 15,
  }
}

export default function RouteOptimizerPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<VrpVehicle[]>([])
  const [stops, setStops] = useState<VrpStop[]>([])
  const [solution, setSolution] = useState<VrpSolution | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [activeTab, setActiveTab] = useState<'vehicles' | 'stops'>('stops')
  const [skippedOrders, setSkippedOrders] = useState<string[]>([])

  const depotLat = 41.0082
  const depotLng = 28.9784

  // Load orders from URL params
  useEffect(() => {
    const orderIds = searchParams.get('orderIds')
    if (!orderIds) return

    const ids = orderIds.split(',').filter(Boolean)
    if (ids.length === 0) return

    setIsLoadingOrders(true)
    const loadOrders = async () => {
      try {
        const allOrders: Order[] = []
        // Fetch each order by ID
        for (const id of ids) {
          try {
            const res = await ordersApi.getById(id)
            if (res.success && res.data) allOrders.push(res.data)
          } catch { /* skip invalid IDs */ }
        }

        const newStops: VrpStop[] = []
        const skipped: string[] = []
        allOrders.forEach((order) => {
          const stop = orderToStop(order)
          if (stop) newStops.push(stop)
          else skipped.push(`${order.orderNumber} (${order.customerName})`)
        })

        setStops(newStops)
        setSkippedOrders(skipped)

        if (skipped.length > 0) {
          toast('warning', `${skipped.length} sipariş koordinat bilgisi eksik olduğu için atlandı`)
        }
        if (newStops.length > 0) {
          toast('success', `${newStops.length} sipariş rota optimizasyonuna eklendi`)
        }
      } catch {
        toast('error', 'Siparişler yuklenirken hata oluştu')
      } finally {
        setIsLoadingOrders(false)
      }
    }
    loadOrders()
  }, [searchParams])

  // Load vehicles from API
  useEffect(() => {
    routeOptimizationApi.getVehicles()
      .then(res => {
        if (res.success && res.data) {
          setVehicles(Array.isArray(res.data) ? res.data : [])
        }
      })
      .catch(() => { /* fallback: empty */ })
  }, [])

  const handleOptimize = async () => {
    setIsOptimizing(true)
    setSolution(null)
    try {
      const request = {
        vehicles: vehicles.filter(v => v.available),
        stops,
        depotLat,
        depotLng,
      }
      const res = await routeOptimizationApi.solve(request)
      if (res.success && res.data) {
        setSolution(res.data)
        toast('success', 'Rota optimizasyonu tamamlandı!')
      } else {
        toast('error', res.message || 'Optimizasyon başarısız')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
      toast('error', `Rota optimizasyonu hatasi: ${msg}`)
      console.error('VRP solve error:', err)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleConfirmRoute = async () => {
    if (!solution) return
    setIsConfirming(true)
    try {
      // Siparişlerin durumunu "Assigned" yap
      const orderIds = searchParams.get('orderIds')?.split(',').filter(Boolean) || []
      for (const id of orderIds) {
        try {
          await ordersApi.updateStatus(id, 'Assigned')
        } catch { /* skip */ }
      }
      setIsConfirmed(true)
      toast('success', `Rota onaylandı! ${solution.routes.length} arac, ${solution.routes.reduce((a, r) => a + r.stops.length, 0)} durak atandı.`)
    } catch {
      toast('error', 'Rota onaylama hatasi')
    } finally {
      setIsConfirming(false)
    }
  }

  const availableVehicles = vehicles.filter(v => v.available)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.vrp.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.vrp.subtitle}</p>
      </div>

      {/* Skipped orders warning */}
      {skippedOrders.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-amber-800">Koordinat bilgisi eksik siparişler ({skippedOrders.length})</p>
            <p className="text-[12px] text-amber-600 mt-1">{skippedOrders.join(', ')}</p>
          </div>
        </div>
      )}

      {isLoadingOrders && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400 mr-3" />
          <span className="text-[14px] text-slate-500">Siparişler yükleniyor...</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === 'vehicles' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Truck className="w-4 h-4" />
              {t.vrp.vehicles} ({availableVehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('stops')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === 'stops' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MapPin className="w-4 h-4" />
              {t.vrp.stops} ({stops.length})
            </button>
          </div>

          {/* Vehicle List */}
          {activeTab === 'vehicles' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-[15px] font-semibold text-slate-800">{t.vrp.vehicleList}</h3>
              </div>
              <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
                {vehicles.map(v => (
                  <div key={v.id} className={`rounded-xl border p-3 ${v.available ? 'border-slate-200/60 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold text-slate-800">{v.plateNumber}</span>
                      <Badge variant={v.available ? 'success' : 'default'}>{v.available ? t.vrp.available : t.vrp.unavailable}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{v.capacityKg.toLocaleString()} kg</span>
                      <span>{v.capacityM3} m3</span>
                      <span>{v.costPerKm} TRY/km</span>
                    </div>
                    {solution && (() => {
                      const route = solution.routes.find(r => r.vehicleId === v.id)
                      if (!route) return null
                      return (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-500">{t.vrp.utilization}</span>
                            <span className="font-semibold text-slate-700">{route.utilizationPercent}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${route.utilizationPercent > 80 ? 'bg-green-500' : route.utilizationPercent > 50 ? 'bg-orange-400' : 'bg-blue-400'}`}
                              style={{ width: `${route.utilizationPercent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stop List */}
          {activeTab === 'stops' && (
            <StopListPanel stops={stops} onStopsChange={setStops} />
          )}

          {/* Optimize Button */}
          {!isConfirmed && (
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || stops.length === 0 || availableVehicles.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[14px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all"
            >
              {isOptimizing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t.vrp.optimizing}</>
              ) : (
                <><Zap className="w-5 h-5" /> {solution ? 'Tekrar Optimize Et' : t.vrp.optimize}</>
              )}
            </button>
          )}

          {/* Confirm Route Button — optimizasyon sonrasi gorunur */}
          {solution && !isConfirmed && (
            <button
              onClick={handleConfirmRoute}
              disabled={isConfirming}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-[14px] font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 shadow-lg shadow-green-500/10 transition-all"
            >
              {isConfirming ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Onaylaniyor...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Rotayi Onayla & Ata</>
              )}
            </button>
          )}

          {/* Confirmed state */}
          {isConfirmed && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-[13px] font-semibold text-green-700">Rota onaylandı ve atandı!</span>
              </div>
              <button
                onClick={() => navigate('/orders')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" /> Siparişlere Don
              </button>
            </div>
          )}
        </div>

        {/* Right Panel — Map + Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <OptimizedRouteMap solution={solution} stops={stops} depotLat={depotLat} depotLng={depotLng} />

          {/* Solution Summary */}
          {solution && (() => {
            const totalStops = solution.routes.reduce((a, r) => a + r.stops.length, 0)
            const totalServiceMin = solution.routes.reduce((a, r) => a + r.stops.length * 15, 0)
            const totalTravelMin = solution.totalDurationMin - totalServiceMin
            const travelPct = solution.totalDurationMin > 0 ? Math.round((Math.max(0, totalTravelMin) / solution.totalDurationMin) * 100) : 0
            const totalLoadKg = solution.routes.reduce((a, r) => a + r.loadKg, 0)
            const totalCapacityKg = vehicles.filter(v => v.available).reduce((a, v) => a + v.capacityKg, 0)
            const capacityPct = totalCapacityKg > 0 ? Math.round((totalLoadKg / totalCapacityKg) * 100) : 0
            const totalLoadM3 = solution.routes.reduce((a, r) => a + r.loadM3, 0)
            const totalCapacityM3 = vehicles.filter(v => v.available).reduce((a, v) => a + v.capacityM3, 0)
            const volumePct = totalCapacityM3 > 0 ? Math.round((totalLoadM3 / totalCapacityM3) * 100) : 0

            return (
              <>
                {/* Donut Charts Row */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-5">Cozum Özeti</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="flex flex-col items-center">
                      <DonutChart
                        value={travelPct}
                        label={`${travelPct}%`}
                        sublabel="Seyahat"
                        color="#3b82f6"
                        size={130}
                      />
                      <p className="text-[12px] text-slate-500 mt-2">Zaman Dağılımı</p>
                      <p className="text-[10px] text-slate-400">Seyahat: {Math.round(Math.max(0, totalTravelMin))} dk / Servis: {totalServiceMin} dk</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <DonutChart
                        value={capacityPct}
                        label={`${capacityPct}%`}
                        sublabel="Kapasite"
                        color="#f97316"
                        size={130}
                      />
                      <p className="text-[12px] text-slate-500 mt-2">Ağırlık Kullanimi</p>
                      <p className="text-[10px] text-slate-400">{totalLoadKg.toLocaleString()} / {totalCapacityKg.toLocaleString()} kg</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <DonutChart
                        value={volumePct}
                        label={`${volumePct}%`}
                        sublabel="Hacim"
                        color="#8b5cf6"
                        size={130}
                      />
                      <p className="text-[12px] text-slate-500 mt-2">Hacim Kullanimi</p>
                      <p className="text-[10px] text-slate-400">{totalLoadM3.toFixed(1)} / {totalCapacityM3.toFixed(1)} m3</p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Sipariş', value: totalStops.toString(), icon: Package, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Rota', value: solution.routes.length.toString(), icon: MapPin, color: 'text-green-600 bg-green-50' },
                    { label: 'Toplam Mesafe', value: `${solution.totalDistanceKm.toLocaleString()} km`, icon: Truck, color: 'text-orange-600 bg-orange-50' },
                    { label: 'Toplam Sure', value: `${Math.round(solution.totalDurationMin / 60)} saat`, icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Toplam Maliyet', value: `${solution.totalCost.toLocaleString()} TRY`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Atanamayan', value: (solution.unassignedStops?.length || 0).toString(), icon: XCircle, color: solution.unassignedStops?.length > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50' },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
                      <div className={`w-8 h-8 rounded-xl ${kpi.color} flex items-center justify-center mb-2`}>
                        <kpi.icon className="w-4 h-4" />
                      </div>
                      <div className="text-[16px] font-bold text-slate-900 tracking-tight">{kpi.value}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{kpi.label}</div>
                    </div>
                  ))}
                </div>

                {/* Route Summary Table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-[15px] font-semibold text-slate-800">Rota Detayları</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['Rota', 'Arac', 'Durak', 'Mesafe', 'Sure', 'Ağırlık', 'Hacim', 'Doluluk', 'Maliyet'].map(h => (
                            <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {solution.routes.map((route, idx) => (
                          <tr key={route.vehicleId} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-50 text-orange-600 text-[12px] font-bold">
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[13px] font-medium text-slate-800">{route.plateNumber}</td>
                            <td className="px-4 py-3 text-[13px] text-slate-600">{route.stops.length}</td>
                            <td className="px-4 py-3 text-[13px] text-slate-600">{route.totalDistanceKm.toLocaleString()} km</td>
                            <td className="px-4 py-3 text-[13px] text-slate-600">{Math.round(route.totalDurationMin)} dk</td>
                            <td className="px-4 py-3 text-[13px] text-slate-600">{route.loadKg.toLocaleString()} kg</td>
                            <td className="px-4 py-3 text-[13px] text-slate-600">{route.loadM3.toFixed(1)} m3</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      route.utilizationPercent > 80 ? 'bg-green-500' : route.utilizationPercent > 50 ? 'bg-orange-400' : 'bg-blue-400'
                                    }`}
                                    style={{ width: `${route.utilizationPercent}%` }}
                                  />
                                </div>
                                <span className="text-[12px] font-semibold text-slate-700">{route.utilizationPercent}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[13px] font-medium text-slate-800">{route.totalCost.toLocaleString()} TRY</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <ComparisonView optimized={solution} />
              </>
            )
          })()}

          {!solution && !isOptimizing && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
              <Zap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-[15px] font-medium text-slate-400 mb-2">{t.vrp.title}</p>
              <p className="text-[13px] text-slate-300">{stops.length > 0 ? `${stops.length} durak yüklendi — Optimize Et butonuna basin` : t.vrp.emptyState}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
