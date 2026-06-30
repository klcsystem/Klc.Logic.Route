import { useState, useMemo } from 'react'
import { BarChart3, Download, Calendar, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import { useApi } from '../utils/useApi'
import { dashboardApi } from '../api/dashboard'
import { reportsApi, type CarrierPerformance } from '../api/reports'
import { ordersApi } from '../api/orders'
import { shipmentsApi } from '../api/shipments'
import type { Order, Shipment } from '../types'

const tabs = ['shipmentReport', 'costReport', 'performanceReport'] as const

type PeriodKey = 'thisWeek' | 'thisMonth' | 'last3Months' | 'lastYear'

function getDateRange(period: PeriodKey): { from: Date; to: Date } {
  const now = new Date()
  const to = now
  let from: Date
  switch (period) {
    case 'thisWeek': from = new Date(now); from.setDate(from.getDate() - 7); break
    case 'thisMonth': from = new Date(now.getFullYear(), now.getMonth(), 1); break
    case 'last3Months': from = new Date(now); from.setMonth(from.getMonth() - 3); break
    case 'lastYear': from = new Date(now); from.setFullYear(from.getFullYear() - 1); break
    default: from = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return { from, to }
}

export default function ReportsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('shipmentReport')
  const [period, setPeriod] = useState<PeriodKey>('thisMonth')

  // Fetch real data
  const { data: summary, isLoading: summaryLoading } = useApi(() => dashboardApi.getSummary())
  const { data: monthlyCosts } = useApi(() => dashboardApi.getMonthlyCosts())
  const { data: providerCosts } = useApi(() => dashboardApi.getProviderCosts())
  const { data: carrierPerfsData, isLoading: perfsLoading } = useApi(() => reportsApi.getCarrierPerformance())
  const { data: ordersData } = useApi(() => ordersApi.getAll({ pageSize: 200 }))
  const { data: shipmentsData } = useApi(() => shipmentsApi.getAll({ pageSize: 200 }))

  const carrierPerfs: CarrierPerformance[] = carrierPerfsData || []
  const orders: Order[] = ordersData?.items || (Array.isArray(ordersData) ? ordersData as unknown as Order[] : [])
  const shipments: Shipment[] = shipmentsData?.items || (Array.isArray(shipmentsData) ? shipmentsData as unknown as Shipment[] : [])

  // Filter by time period
  const dateRange = useMemo(() => getDateRange(period), [period])
  const filteredShipments = useMemo(() =>
    shipments.filter(s => {
      const d = new Date(s.createdAt)
      return d >= dateRange.from && d <= dateRange.to
    }), [shipments, dateRange])

  const filteredOrders = useMemo(() =>
    orders.filter(o => {
      const d = new Date(o.createdAt)
      return d >= dateRange.from && d <= dateRange.to
    }), [orders, dateRange])

  // Order status breakdown
  const orderStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })
    return counts
  }, [filteredOrders])

  // Shipment status breakdown
  const shipmentStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredShipments.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1 })
    return counts
  }, [filteredShipments])

  // On-time vs late from carrier performance
  const totalOnTime = carrierPerfs.reduce((sum, cp) => sum + cp.onTimeDeliveries, 0)
  const totalLate = carrierPerfs.reduce((sum, cp) => sum + cp.lateDeliveries, 0)
  const totalDelivered = totalOnTime + totalLate
  const onTimePercent = totalDelivered > 0 ? ((totalOnTime / totalDelivered) * 100).toFixed(1) : '0'

  const totalCost = (monthlyCosts || []).reduce((sum, m) => sum + m.totalCost, 0)

  // Monthly cost chart
  const monthNames = ['', 'Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const monthlyCostChart = (monthlyCosts || []).map(m => ({
    month: monthNames[m.month] || `${m.month}`,
    cost: Math.round(m.totalCost / 1000),
    sevkiyat: m.shipmentCount,
  }))

  // Carrier performance chart data
  const carrierPerfChart = carrierPerfs.slice(0, 8).map(cp => ({
    name: (cp.providerName || 'Bilinmiyor').length > 12 ? (cp.providerName || 'Bilinmiyor').substring(0, 12) + '..' : cp.providerName || 'Bilinmiyor',
    onTime: Number(cp.onTimePercentage),
    avgHours: Number(cp.averageDeliveryHours),
    damage: cp.totalShipments > 0 ? ((cp.damagedShipments / cp.totalShipments) * 100) : 0,
  }))

  // Arrival accuracy chart
  const arrivalData = [
    { name: 'Zamaninda', value: totalOnTime, fill: '#10b981' },
    { name: 'Geciken', value: totalLate, fill: '#ef4444' },
  ]

  const kpis = [
    { label: t.reports.totalShipments, value: summary?.totalShipments?.toLocaleString() || '0', change: 0, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
    { label: t.reports.onTimeDelivery, value: `${onTimePercent}%`, change: 0, icon: BarChart3, color: 'text-green-600 bg-green-50' },
    { label: t.reports.avgTransitTime, value: summary ? `${summary.averageDeliveryHours.toFixed(1)} saat` : '0', change: 0, icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
    { label: t.reports.totalCost, value: totalCost > 0 ? `${(totalCost / 1000000).toFixed(2)}M TL` : '0', change: 0, icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
  ]

  const periodLabels: Record<string, string> = { thisWeek: t.reports.lastWeek, thisMonth: t.reports.lastMonth, last3Months: t.reports.last3Months, lastYear: t.reports.lastYear }

  const statusLabels: Record<string, string> = {
    Pending: 'Bekleyen', Assigned: 'Atanmis', InTransit: 'Yolda', Delivered: 'Teslim', Failed: 'Basarisiz', Cancelled: 'Iptal',
    Draft: 'Taslak', Calculated: 'Hesaplandi', PendingApproval: 'Onay Bekliyor', Approved: 'Onaylandi',
    SentToProvider: 'Gonderildi', VehicleAssigned: 'Arac Atandi', Loading: 'Yukleniyor', Completed: 'Tamamlandi',
  }

  const statusColors: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700', Assigned: 'bg-blue-100 text-blue-700', InTransit: 'bg-orange-100 text-orange-700',
    Delivered: 'bg-green-100 text-green-700', Failed: 'bg-red-100 text-red-700', Cancelled: 'bg-slate-100 text-slate-700',
    Draft: 'bg-slate-100 text-slate-600', Completed: 'bg-green-100 text-green-700',
  }

  const isLoading = summaryLoading || perfsLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.reports.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.reports.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 appearance-none">
              {Object.entries(periodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"><Download className="w-4 h-4" /> {t.reports.exportPdf}</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"><Download className="w-4 h-4" /> {t.reports.exportExcel}</button>
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {(t.reports as Record<string, string>)[tab]}
              </button>
            ))}
          </div>

          {/* Shipment Report: Order status breakdown + shipment status */}
          {activeTab === 'shipmentReport' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Order status breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Siparis Durumu Dagilimi ({filteredOrders.length} siparis)</h3>
                {Object.keys(orderStatusCounts).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(orderStatusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                      const pct = filteredOrders.length > 0 ? ((count / filteredOrders.length) * 100) : 0
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[12px] font-medium px-2 py-0.5 rounded ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>{statusLabels[status] || status}</span>
                            <span className="text-[13px] font-semibold text-slate-700">{count} (%{pct.toFixed(1)})</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-[13px] text-slate-400 py-8">Bu donemde siparis yok</div>
                )}
              </div>

              {/* Shipment status breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Sevkiyat Durumu ({filteredShipments.length} sevkiyat)</h3>
                {Object.keys(shipmentStatusCounts).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(shipmentStatusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                      const pct = filteredShipments.length > 0 ? ((count / filteredShipments.length) * 100) : 0
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[12px] font-medium px-2 py-0.5 rounded ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>{statusLabels[status] || status}</span>
                            <span className="text-[13px] font-semibold text-slate-700">{count} (%{pct.toFixed(1)})</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-[13px] text-slate-400 py-8">Bu donemde sevkiyat yok</div>
                )}
              </div>
            </div>
          )}

          {/* Cost Report: Monthly cost trend + Provider cost table */}
          {activeTab === 'costReport' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Aylik Maliyet Trendi (Bin TL)</h3>
                {monthlyCostChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthlyCostChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => `${v}K TL`} />
                      <Bar dataKey="cost" name="Maliyet" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[240px] text-[13px] text-slate-400">Henuz maliyet verisi yok</div>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">Tasiyici Bazli Maliyet</h3></div>
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">{t.shipments.carrier}</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Sevkiyat</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Toplam</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ortalama</th>
                  </tr></thead>
                  <tbody>
                    {(providerCosts || []).length > 0 ? (providerCosts || []).map((d) => (
                      <tr key={d.providerId} className="border-b border-slate-50">
                        <td className="px-6 py-3 text-[13px] font-medium text-slate-800">{d.providerName}</td>
                        <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.shipmentCount}</td>
                        <td className="px-6 py-3 text-right text-[13px] font-medium text-slate-800">{(d.totalCost / 1000).toFixed(0)}K TL</td>
                        <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.shipmentCount > 0 ? (d.totalCost / d.shipmentCount).toFixed(0) : 0} TL</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-[13px] text-slate-400">Veri yok</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Report: On-time chart + carrier performance table */}
          {activeTab === 'performanceReport' && (
            <div className="space-y-6">
              {/* Arrival accuracy */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Varis Dogrulugu</h3>
                  {totalDelivered > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={arrivalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" name="Adet" radius={[4, 4, 0, 0]}>
                            {arrivalData.map((entry, i) => (
                              <Bar key={i} dataKey="value" fill={entry.fill} radius={[4, 4, 0, 0]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center gap-6 mt-4 justify-center">
                        <div className="text-center">
                          <p className="text-[24px] font-bold text-green-600">{totalOnTime}</p>
                          <p className="text-[12px] text-slate-400">Zamaninda</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[24px] font-bold text-red-500">{totalLate}</p>
                          <p className="text-[12px] text-slate-400">Geciken</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[24px] font-bold text-blue-600">{onTimePercent}%</p>
                          <p className="text-[12px] text-slate-400">Basari Orani</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-[13px] text-slate-400">Performans verisi henuz yok</div>
                  )}
                </div>

                {/* Carrier on-time chart */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Zamaninda Teslim Orani</h3>
                  {carrierPerfChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={carrierPerfChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                        <Bar dataKey="onTime" name="Zamaninda %" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[240px] text-[13px] text-slate-400">Veri yok</div>
                  )}
                </div>
              </div>

              {/* Carrier performance table */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">Tasiyici Performans Tablosu</h3></div>
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Tasiyici</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Zamaninda %</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ort. Sure (saat)</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Hasar</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Toplam Sevkiyat</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Ort. Maliyet/kg</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase">Genel Puan</th>
                  </tr></thead>
                  <tbody>
                    {carrierPerfs.length > 0 ? carrierPerfs.map((d) => (
                      <tr key={d.id} className="border-b border-slate-50">
                        <td className="px-6 py-3 text-[13px] font-medium text-slate-800">{d.providerName}</td>
                        <td className="px-6 py-3 text-right text-[13px]"><span className={Number(d.onTimePercentage) >= 90 ? 'text-green-600' : 'text-amber-600'}>{Number(d.onTimePercentage).toFixed(1)}%</span></td>
                        <td className="px-6 py-3 text-right text-[13px] text-slate-600">{Number(d.averageDeliveryHours).toFixed(1)}</td>
                        <td className="px-6 py-3 text-right text-[13px]"><span className={d.damagedShipments === 0 ? 'text-green-600' : 'text-red-600'}>{d.damagedShipments}</span></td>
                        <td className="px-6 py-3 text-right text-[13px] text-slate-600">{d.totalShipments}</td>
                        <td className="px-6 py-3 text-right text-[13px] text-slate-600">{Number(d.averageCostPerKg).toFixed(2)} TL</td>
                        <td className="px-6 py-3 text-right text-[13px] font-semibold"><span className={Number(d.overallScore) >= 80 ? 'text-green-600' : Number(d.overallScore) >= 60 ? 'text-amber-600' : 'text-red-600'}>{Number(d.overallScore).toFixed(0)}</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-[13px] text-slate-400">Performans verisi yok</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
