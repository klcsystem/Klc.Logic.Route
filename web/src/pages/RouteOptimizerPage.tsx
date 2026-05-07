import { useState } from 'react'
import { Loader2, Truck, MapPin, BarChart3, Zap } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
import StopListPanel from '../components/route-optimizer/StopListPanel'
import OptimizedRouteMap from '../components/route-optimizer/OptimizedRouteMap'
import ComparisonView from '../components/route-optimizer/ComparisonView'
import type { VrpVehicle, VrpStop, VrpSolution } from '../api/routeOptimization'

const mockVehicles: VrpVehicle[] = [
  { id: 'v1', plateNumber: '34 KLC 001', capacityKg: 8000, capacityM3: 40, costPerKm: 12.5, startLat: 41.0082, startLng: 28.9784, available: true },
  { id: 'v2', plateNumber: '34 KLC 003', capacityKg: 5000, capacityM3: 25, costPerKm: 9.0, startLat: 41.0082, startLng: 28.9784, available: true },
  { id: 'v3', plateNumber: '06 KLC 012', capacityKg: 12000, capacityM3: 60, costPerKm: 15.0, startLat: 39.9334, startLng: 32.8597, available: true },
  { id: 'v4', plateNumber: '35 KLC 005', capacityKg: 6000, capacityM3: 30, costPerKm: 10.5, startLat: 38.4237, startLng: 27.1428, available: false },
]

const mockStops: VrpStop[] = [
  { id: 's1', address: 'Tuzla OSB, Istanbul', lat: 40.82, lng: 29.30, demandKg: 1200, demandM3: 6, timeWindowStart: '08:00', timeWindowEnd: '12:00', serviceDurationMin: 20 },
  { id: 's2', address: 'Gebze Organize Sanayi, Kocaeli', lat: 40.80, lng: 29.43, demandKg: 800, demandM3: 4, timeWindowStart: '09:00', timeWindowEnd: '14:00', serviceDurationMin: 15 },
  { id: 's3', address: 'Nilufer, Bursa', lat: 40.22, lng: 28.87, demandKg: 1500, demandM3: 7, timeWindowStart: '10:00', timeWindowEnd: '16:00', serviceDurationMin: 25 },
  { id: 's4', address: 'Sincan OSB, Ankara', lat: 39.97, lng: 32.58, demandKg: 2000, demandM3: 10, timeWindowStart: '08:00', timeWindowEnd: '18:00', serviceDurationMin: 30 },
  { id: 's5', address: 'Ostim OSB, Ankara', lat: 39.97, lng: 32.76, demandKg: 900, demandM3: 5, serviceDurationMin: 15 },
  { id: 's6', address: 'Bornova, Izmir', lat: 38.47, lng: 27.22, demandKg: 1100, demandM3: 5, timeWindowStart: '09:00', timeWindowEnd: '15:00', serviceDurationMin: 20 },
  { id: 's7', address: 'Cigli, Izmir', lat: 38.50, lng: 27.08, demandKg: 700, demandM3: 3, serviceDurationMin: 15 },
  { id: 's8', address: 'Eskisehir Organize Sanayi', lat: 39.78, lng: 30.52, demandKg: 1300, demandM3: 6, timeWindowStart: '08:00', timeWindowEnd: '14:00', serviceDurationMin: 20 },
]

const mockSolution: VrpSolution = {
  routes: [
    {
      vehicleId: 'v1', plateNumber: '34 KLC 001',
      stops: [
        { stopId: 's1', address: 'Tuzla OSB, Istanbul', lat: 40.82, lng: 29.30, sequence: 1, arrivalTime: '08:30', departureTime: '08:50' },
        { stopId: 's2', address: 'Gebze Organize Sanayi, Kocaeli', lat: 40.80, lng: 29.43, sequence: 2, arrivalTime: '09:20', departureTime: '09:35' },
        { stopId: 's3', address: 'Nilufer, Bursa', lat: 40.22, lng: 28.87, sequence: 3, arrivalTime: '11:00', departureTime: '11:25' },
      ],
      totalDistanceKm: 285, totalDurationMin: 240, totalCost: 3562, loadKg: 3500, loadM3: 17, utilizationPercent: 44,
    },
    {
      vehicleId: 'v2', plateNumber: '34 KLC 003',
      stops: [
        { stopId: 's8', address: 'Eskisehir Organize Sanayi', lat: 39.78, lng: 30.52, sequence: 1, arrivalTime: '10:30', departureTime: '10:50' },
        { stopId: 's4', address: 'Sincan OSB, Ankara', lat: 39.97, lng: 32.58, sequence: 2, arrivalTime: '12:45', departureTime: '13:15' },
        { stopId: 's5', address: 'Ostim OSB, Ankara', lat: 39.97, lng: 32.76, sequence: 3, arrivalTime: '13:30', departureTime: '13:45' },
      ],
      totalDistanceKm: 520, totalDurationMin: 360, totalCost: 4680, loadKg: 4200, loadM3: 21, utilizationPercent: 84,
    },
    {
      vehicleId: 'v3', plateNumber: '06 KLC 012',
      stops: [
        { stopId: 's6', address: 'Bornova, Izmir', lat: 38.47, lng: 27.22, sequence: 1, arrivalTime: '13:00', departureTime: '13:20' },
        { stopId: 's7', address: 'Cigli, Izmir', lat: 38.50, lng: 27.08, sequence: 2, arrivalTime: '13:45', departureTime: '14:00' },
      ],
      totalDistanceKm: 580, totalDurationMin: 420, totalCost: 8700, loadKg: 1800, loadM3: 8, utilizationPercent: 15,
    },
  ],
  totalDistanceKm: 1385,
  totalDurationMin: 1020,
  totalCost: 16942,
  vehicleUtilization: 48,
  unassignedStops: [],
  co2SavedKg: 145,
}

export default function RouteOptimizerPage() {
  const { t } = useI18n()
  const [vehicles] = useState<VrpVehicle[]>(mockVehicles)
  const [stops, setStops] = useState<VrpStop[]>(mockStops)
  const [solution, setSolution] = useState<VrpSolution | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [activeTab, setActiveTab] = useState<'vehicles' | 'stops'>('stops')

  const depotLat = 41.0082
  const depotLng = 28.9784

  const handleOptimize = () => {
    setIsOptimizing(true)
    setSolution(null)
    // TODO: Replace with real API call
    // routeOptimizationApi.solve({ vehicles, stops, depotLat, depotLng }).then(r => { if (r.success) setSolution(r.data) })
    setTimeout(() => {
      setSolution(mockSolution)
      setIsOptimizing(false)
    }, 2500)
  }

  const availableVehicles = vehicles.filter(v => v.available)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.vrp.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.vrp.subtitle}</p>
      </div>

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
                    {/* Utilization bar from solution */}
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
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || stops.length === 0 || availableVehicles.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[14px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all"
          >
            {isOptimizing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t.vrp.optimizing}</>
            ) : (
              <><Zap className="w-5 h-5" /> {t.vrp.optimize}</>
            )}
          </button>
        </div>

        {/* Right Panel — Map + Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <OptimizedRouteMap solution={solution} depotLat={depotLat} depotLng={depotLng} />

          {/* Results Summary */}
          {solution && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: t.vrp.totalDistance, value: `${solution.totalDistanceKm.toLocaleString()} km`, icon: MapPin, color: 'text-blue-600 bg-blue-50' },
                  { label: t.vrp.totalDuration, value: `${Math.round(solution.totalDurationMin / 60)} saat`, icon: BarChart3, color: 'text-green-600 bg-green-50' },
                  { label: t.vrp.totalCost, value: `${solution.totalCost.toLocaleString()} TRY`, icon: Truck, color: 'text-orange-600 bg-orange-50' },
                  { label: t.vrp.vehicleUtil, value: `${solution.vehicleUtilization}%`, icon: Truck, color: 'text-purple-600 bg-purple-50' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
                    <div className={`w-9 h-9 rounded-xl ${kpi.color} flex items-center justify-center mb-2`}>
                      <kpi.icon className="w-4 h-4" />
                    </div>
                    <div className="text-[18px] font-bold text-slate-900 tracking-tight">{kpi.value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Comparison */}
              <ComparisonView optimized={solution} />
            </>
          )}

          {/* Empty state */}
          {!solution && !isOptimizing && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
              <Zap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-[15px] font-medium text-slate-400 mb-2">{t.vrp.title}</p>
              <p className="text-[13px] text-slate-300">{t.vrp.emptyState}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
