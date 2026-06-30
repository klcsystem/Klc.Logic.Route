import { Truck, Package, Clock, DollarSign, CheckCircle2, TrendingUp, Users, MapPin, BarChart3, Leaf, FileText, ArrowRightLeft, Loader2 } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import DonutChart from '../components/ui/DonutChart'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import { dashboardApi, type DashboardSummary, type ProviderCostSummary, type MonthlyCostSummary } from '../api/dashboard'
import { reportsApi, type CarrierPerformance } from '../api/reports'
import { shipmentsApi } from '../api/shipments'
import { sustainabilityApi } from '../api/sustainability'
import { useApi } from '../utils/useApi'
import type { Shipment } from '../types'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  Draft: 'default', Loading: 'info', PendingApproval: 'warning', InTransit: 'orange', Delivered: 'success',
  Calculated: 'info', Approved: 'success', SentToProvider: 'info', VehicleAssigned: 'info', Completed: 'success', Cancelled: 'error',
}
const statusLabels: Record<string, string> = {
  Draft: 'Taslak', Loading: 'Yukleniyor', PendingApproval: 'Onay Bekliyor', InTransit: 'Yolda', Delivered: 'Teslim Edildi',
  Calculated: 'Hesaplandi', Approved: 'Onaylandi', SentToProvider: 'Gonderildi', VehicleAssigned: 'Arac Atandi', Completed: 'Tamamlandi', Cancelled: 'Iptal',
}


const integrationModeLabels: Record<string, string> = {
  ApiIntegrated: 'API Entegre',
  Managed: 'Yonetilen',
  SelfService: 'Self Servis',
}

const integrationModeVariant: Record<string, 'info' | 'success' | 'default'> = {
  ApiIntegrated: 'info',
  Managed: 'success',
  SelfService: 'default',
}

// --- Dashboard Components ---

const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#eab308', '#6366f1']

function ExecutiveDashboard({ summary, providerCosts, monthlyCosts, carrierPerfs, recentShipments, co2SavedTons }: {
  summary: DashboardSummary | null
  providerCosts: ProviderCostSummary[]
  monthlyCosts: MonthlyCostSummary[]
  carrierPerfs: CarrierPerformance[]
  recentShipments: Shipment[]
  co2SavedTons: number
}) {
  const monthNames = ['', 'Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const monthlyCostChart = monthlyCosts.map(m => ({ month: monthNames[m.month] || `${m.month}`, maliyet: Math.round(m.totalCost / 1000), sevkiyat: m.shipmentCount }))
  const providerCostChart = providerCosts.map((p, i) => ({ name: p.providerName, value: p.totalCost, color: PIE_COLORS[i % PIE_COLORS.length] }))
  const shipmentTrendChart = monthlyCosts.map(m => ({ month: monthNames[m.month] || `${m.month}`, sevkiyat: m.shipmentCount }))

  // Build carrier perf from real data
  const carrierPerfChart = carrierPerfs.slice(0, 5).map(cp => ({
    name: cp.providerName || 'Bilinmiyor',
    zamaninda: Number(cp.onTimePercentage),
    hasar: Number(cp.damagedShipments),
    ortalamaSure: Math.round(Number(cp.averageDeliveryHours)),
  }))

  // Build cost comparison from shipments that have recommendations
  const costComparisons = recentShipments
    .filter(s => s.recommendation && s.calculatedPrice && s.calculatedPrice > 0)
    .slice(0, 6)
    .map(s => ({
      shipmentNo: s.shipmentNumber,
      route: `${s.originCity} - ${s.destinationCity}`,
      weight: `${s.totalWeightKg} kg`,
      selected: {
        provider: s.selectedProviderName || s.recommendation!.selectedProviderName,
        price: s.calculatedPrice || s.recommendation!.calculatedPrice,
        integrationMode: s.providerIntegrationMode || 'ApiIntegrated',
      },
      alternatives: [
        ...(s.recommendation!.alternativeProvider1 ? [{ provider: s.recommendation!.alternativeProvider1, price: s.recommendation!.alternativePrice1 || 0 }] : []),
        ...(s.recommendation!.alternativeProvider2 ? [{ provider: s.recommendation!.alternativeProvider2, price: s.recommendation!.alternativePrice2 || 0 }] : []),
      ],
      savings: s.recommendation!.savingsAmount,
    }))

  const totalSavingsPotential = costComparisons.reduce((sum, c) => sum + c.savings, 0)

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Siparis" value={summary?.totalOrders.toLocaleString() || '0'} change={0} icon={Package} color="text-blue-600 bg-blue-50" />
        <StatCard label="Toplam Sevkiyat" value={summary?.totalShipments.toLocaleString() || '0'} change={0} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Aktif Tasiyici" value={summary?.activeProviders.toString() || '0'} change={0} icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
        <StatCard label="Bu Ay Maliyet" value={summary ? `${(summary.totalCostThisMonth / 1000).toFixed(0)}K TL` : '0'} change={0} icon={DollarSign} color="text-purple-600 bg-purple-50" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sevkiyat Trendi from real monthly data */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-slate-800">Aylik Sevkiyat Trendi</h3>
          </div>
          {shipmentTrendChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={shipmentTrendChart}>
                <defs>
                  <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Area type="monotone" dataKey="sevkiyat" stroke="#f97316" strokeWidth={2.5} fill="url(#colorShipments)" name="Sevkiyat" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[13px] text-slate-400">Henuz veri yok</div>
          )}
        </div>

        {/* Tasiyici Maliyet Dagilimi */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Maliyet Dagilimi</h3>
          {providerCostChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={providerCostChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {providerCostChart.map((_entry, i) => <Cell key={i} fill={providerCostChart[i].color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${(Number(v) / 1000).toFixed(0)}K TL`} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {providerCostChart.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-[12px] text-slate-600">{c.name}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-700">{(c.value / 1000).toFixed(0)}K TL</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-[13px] text-slate-400">Veri bekleniyor...</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Aylik Maliyet */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Aylik Maliyet (Bin TL)</h3>
          {monthlyCostChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyCostChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} formatter={(v) => `${v}K TL`} />
                <Bar dataKey="maliyet" name="Maliyet" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-[13px] text-slate-400">Henuz veri yok</div>
          )}
        </div>

        {/* Tasiyici Performans from API */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Performans</h3>
          {carrierPerfChart.length > 0 ? (
            <div className="space-y-4">
              {carrierPerfChart.map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-slate-700">{c.name}</span>
                    <div className="flex items-center gap-3 text-[12px]">
                      <span className="text-slate-500">Ort: {c.ortalamaSure}s</span>
                      <span className={`font-semibold ${c.zamaninda >= 95 ? 'text-green-600' : c.zamaninda >= 90 ? 'text-orange-500' : 'text-red-500'}`}>
                        %{c.zamaninda.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${c.zamaninda >= 95 ? 'bg-green-500' : c.zamaninda >= 90 ? 'bg-orange-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(c.zamaninda, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[13px] text-slate-400">Performans verisi henuz yok</div>
          )}
        </div>
      </div>

      {/* Donut Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4 text-center">Zaman Dagilimi</h3>
          <DonutChart
            value={summary ? Math.round((summary.averageDeliveryHours / (summary.averageDeliveryHours + 2)) * 100) : 65}
            label={`${summary?.averageDeliveryHours.toFixed(1) || '0'}s`}
            sublabel="Seyahat Suresi"
            color="#f97316"
            size={160}
          />
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-[12px] text-slate-500">Seyahat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="text-[12px] text-slate-500">Servis</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4 text-center">Kapasite Kullanimi</h3>
          <DonutChart
            value={summary ? Math.min(99, Math.round((summary.totalShipments / Math.max(summary.totalOrders, 1)) * 100)) : 83}
            label={`${summary ? Math.min(99, Math.round((summary.totalShipments / Math.max(summary.totalOrders, 1)) * 100)) : 83}%`}
            sublabel="Kullanilan"
            color="#22c55e"
            size={160}
          />
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-[12px] text-slate-500">Dolu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="text-[12px] text-slate-500">Bos</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4 text-center">Hacim Kullanimi</h3>
          <DonutChart
            value={summary ? Math.min(99, Math.round((summary.deliveredShipments / Math.max(summary.totalShipments, 1)) * 100)) : 71}
            label={`${summary ? Math.min(99, Math.round((summary.deliveredShipments / Math.max(summary.totalShipments, 1)) * 100)) : 71}%`}
            sublabel="Teslim Orani"
            color="#3b82f6"
            size={160}
          />
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-[12px] text-slate-500">Kullanilan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="text-[12px] text-slate-500">Kalan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Provider cost table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Bazli Maliyet Ozeti</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Tasiyici</th>
                  <th className="text-center px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Sevkiyat</th>
                  <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Toplam Maliyet</th>
                  <th className="text-right px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">Ortalama</th>
                </tr>
              </thead>
              <tbody>
                {providerCosts.length > 0 ? providerCosts.map((r) => (
                  <tr key={r.providerId} className="border-b border-slate-50">
                    <td className="px-4 py-2.5 text-[13px] font-medium text-slate-700">{r.providerName}</td>
                    <td className="px-4 py-2.5 text-center text-[13px] text-slate-600">{r.shipmentCount}</td>
                    <td className="px-4 py-2.5 text-right text-[13px] font-semibold text-slate-800">{(r.totalCost / 1000).toFixed(0)}K TL</td>
                    <td className="px-4 py-2.5 text-right text-[13px] text-slate-600">{r.shipmentCount > 0 ? (r.totalCost / r.shipmentCount).toFixed(0) : 0} TL</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[13px] text-slate-400">Veri bekleniyor...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-orange-100" />
              <span className="text-[13px] font-medium text-orange-100">CO2 Tasarrufu</span>
            </div>
            <p className="text-[28px] font-extrabold">{co2SavedTons.toFixed(1)} ton</p>
            <p className="text-[12px] text-orange-200 mt-1">Toplam karbon tasarrufu</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h4 className="text-[13px] font-semibold text-slate-800 mb-3">Siparis Durumu</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Bekleyen</span>
                <span className="text-[13px] font-semibold text-amber-600">{summary?.pendingOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Yolda</span>
                <span className="text-[13px] font-semibold text-orange-600">{summary?.inTransitShipments || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Teslim Edilen</span>
                <span className="text-[13px] font-semibold text-green-600">{summary?.deliveredShipments || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Ort. Teslimat</span>
                <span className="text-[13px] font-semibold text-blue-600">{summary?.averageDeliveryHours.toFixed(1) || 0}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Son Sevkiyatlar</h3>
        {recentShipments.length > 0 ? (
          <div className="space-y-2">
            {recentShipments.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-slate-800">{s.shipmentNumber}</span>
                      {s.selectedProviderName && <span className="text-[11px] text-slate-400">{s.selectedProviderName}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3" /> {s.originCity} - {s.destinationCity}
                      <span className="text-slate-300">|</span>
                      <Truck className="w-3 h-3" /> {s.totalWeightKg} kg
                      {s.calculatedPrice ? <><span className="text-slate-300">|</span><DollarSign className="w-3 h-3" /> {s.calculatedPrice.toLocaleString()} TL</> : null}
                    </div>
                  </div>
                </div>
                <Badge variant={statusVariant[s.status] || 'default'}>{statusLabels[s.status] || s.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[13px] text-slate-400 py-8">Henuz sevkiyat yok</div>
        )}
      </div>

      {/* Alternatif Maliyet Analizi - from real recommendation data */}
      {costComparisons.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="w-5 h-5 text-orange-500" />
            <h3 className="text-[17px] font-bold text-slate-800">Alternatif Maliyet Analizi</h3>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-[13px] text-orange-100 mb-1">Toplam tasarruf potansiyeli</p>
                <p className="text-[32px] font-extrabold">{totalSavingsPotential.toLocaleString('tr-TR')} TL</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-semibold text-orange-100">{costComparisons.length} sevkiyat karsilastirildi</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {costComparisons.map((c) => (
              <div key={c.shipmentNo} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[14px] font-bold text-slate-800">{c.shipmentNo}</span>
                    <p className="text-[12px] text-slate-400 mt-0.5">{c.route}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <p>{c.weight}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-green-50 border border-green-200 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-[13px] font-semibold text-green-800">{c.selected.provider}</span>
                    {c.selected.integrationMode && (
                      <Badge variant={integrationModeVariant[c.selected.integrationMode] || 'default'}>
                        {integrationModeLabels[c.selected.integrationMode] || c.selected.integrationMode}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[18px] font-bold text-green-700 ml-6">{c.selected.price.toLocaleString('tr-TR')} TL</p>
                </div>

                {c.alternatives.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {c.alternatives.map((alt) => {
                      const diff = c.selected.price > 0 ? ((alt.price - c.selected.price) / c.selected.price * 100).toFixed(1) : '0'
                      const isLower = alt.price < c.selected.price
                      return (
                        <div key={alt.provider} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-[12px] text-slate-600">{alt.provider}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-slate-700">{alt.price.toLocaleString('tr-TR')} TL</span>
                            <span className={`text-[11px] font-medium ${isLower ? 'text-green-600' : 'text-red-500'}`}>
                              {isLower ? '' : '+'}{diff}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {c.savings > 0 ? (
                  <div className="text-[13px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                    {c.savings.toLocaleString('tr-TR')} TL tasarruf edilebilirdi
                  </div>
                ) : (
                  <div className="text-[13px] font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                    En uygun secenek!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OperationsDashboard({ summary, recentShipments }: { summary: DashboardSummary | null; recentShipments: Shipment[] }) {
  const inTransit = recentShipments.filter(s => s.status === 'InTransit')
  const delivered = recentShipments.filter(s => s.status === 'Delivered' || s.status === 'Completed')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Sevkiyat" value={summary?.totalShipments.toString() || '0'} change={0} icon={Package} color="text-blue-600 bg-blue-50" />
        <StatCard label="Bekleyen Siparis" value={summary?.pendingOrders.toString() || '0'} change={0} icon={Clock} color="text-amber-600 bg-amber-50" />
        <StatCard label="Yoldaki Sevkiyat" value={summary?.inTransitShipments.toString() || '0'} change={0} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Teslim Edilen" value={summary?.deliveredShipments.toString() || '0'} change={0} icon={CheckCircle2} color="text-green-600 bg-green-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Yoldaki Sevkiyatlar</h3>
          {inTransit.length > 0 ? (
            <div className="space-y-2">
              {inTransit.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[13px] font-medium text-slate-800">{s.shipmentNumber}</span>
                      {s.selectedProviderName && <span className="text-[11px] text-slate-400 ml-2">{s.selectedProviderName}</span>}
                      <p className="text-[11px] text-slate-400">{s.originCity} - {s.destinationCity} | {s.totalWeightKg} kg</p>
                    </div>
                  </div>
                  <Badge variant="orange">Yolda</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[13px] text-slate-400 py-8">Yolda sevkiyat yok</div>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Son Teslim Edilenler</h3>
            {delivered.length > 0 ? (
              <div className="space-y-3">
                {delivered.slice(0, 4).map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-[13px] font-semibold text-green-800">{s.shipmentNumber}</span>
                    </div>
                    <p className="text-[12px] text-green-600">{s.originCity} - {s.destinationCity} | {s.selectedProviderName || ''}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[13px] text-slate-400 py-4">Henuz teslim edilen sevkiyat yok</div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h4 className="text-[13px] font-semibold text-slate-800 mb-3">Ozet</h4>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-[12px] text-slate-500">Aktif Anlasma</span><span className="text-[13px] font-semibold">{summary?.activeContracts || 0}</span></div>
              <div className="flex justify-between"><span className="text-[12px] text-slate-500">Aktif Tasiyici</span><span className="text-[13px] font-semibold">{summary?.activeProviders || 0}</span></div>
              <div className="flex justify-between"><span className="text-[12px] text-slate-500">Ort. Teslimat</span><span className="text-[13px] font-semibold">{summary?.averageDeliveryHours.toFixed(1) || 0}s</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FinanceDashboard({ summary, monthlyCosts, providerCosts }: { summary: DashboardSummary | null; monthlyCosts: MonthlyCostSummary[]; providerCosts: ProviderCostSummary[] }) {
  const monthNames = ['', 'Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const monthlyCostChart = monthlyCosts.map(m => ({ month: monthNames[m.month] || `${m.month}`, gerceklesen: Math.round(m.totalCost / 1000) }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bu Ay Maliyet" value={summary ? `${(summary.totalCostThisMonth / 1000).toFixed(0)}K TL` : '0'} change={0} icon={DollarSign} color="text-blue-600 bg-blue-50" />
        <StatCard label="Aktif Anlasma" value={summary?.activeContracts.toString() || '0'} change={0} icon={FileText} color="text-amber-600 bg-amber-50" />
        <StatCard label="Toplam Sevkiyat" value={summary?.totalShipments.toString() || '0'} change={0} icon={TrendingUp} color="text-green-600 bg-green-50" />
        <StatCard label="Ort. Teslimat (s)" value={summary ? `${summary.averageDeliveryHours.toFixed(1)}` : '0'} change={0} icon={BarChart3} color="text-purple-600 bg-purple-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Aylik Maliyet Trendi (Bin TL)</h3>
          {monthlyCostChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyCostChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} formatter={(v) => `${v}K TL`} />
                <Bar dataKey="gerceklesen" name="Gerceklesen" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[13px] text-slate-400">Henuz veri yok</div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Maliyet Ozeti</h3>
          {providerCosts.length > 0 ? (
            <div className="space-y-4">
              {providerCosts.map((pc) => (
                <div key={pc.providerId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{pc.providerName}</p>
                    <p className="text-[11px] text-slate-400">{pc.shipmentCount} sevkiyat</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-bold text-slate-800">{(pc.totalCost / 1000).toFixed(0)}K TL</p>
                    <span className="text-[11px] text-slate-400">Ort: {pc.shipmentCount > 0 ? (pc.totalCost / pc.shipmentCount).toFixed(0) : 0} TL</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[13px] text-slate-400">Veri bekleniyor...</div>
          )}
        </div>
      </div>
    </div>
  )
}

function LogisticsManagerDashboard({ summary, carrierPerfs, providerCosts }: { summary: DashboardSummary | null; carrierPerfs: CarrierPerformance[]; providerCosts: ProviderCostSummary[] }) {
  const carrierPerfChart = carrierPerfs.slice(0, 6).map(cp => ({
    name: cp.providerName || 'Bilinmiyor',
    zamaninda: Number(cp.onTimePercentage),
  }))
  const providerCostChart = providerCosts.map((p, i) => ({ name: p.providerName, value: p.totalCost, color: PIE_COLORS[i % PIE_COLORS.length] }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aktif Sevkiyat" value={summary?.inTransitShipments.toString() || '0'} change={0} icon={Truck} color="text-orange-600 bg-orange-50" />
        <StatCard label="Bekleyen Siparis" value={summary?.pendingOrders.toString() || '0'} change={0} icon={Clock} color="text-amber-600 bg-amber-50" />
        <StatCard label="Aktif Tasiyici" value={summary?.activeProviders.toString() || '0'} change={0} icon={DollarSign} color="text-green-600 bg-green-50" />
        <StatCard label="Teslim Edilen" value={summary?.deliveredShipments.toString() || '0'} change={0} icon={CheckCircle2} color="text-blue-600 bg-blue-50" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Performans Karsilastirma</h3>
          {carrierPerfChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={carrierPerfChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                <Bar dataKey="zamaninda" name="Zamaninda %" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[13px] text-slate-400">Performans verisi henuz yok</div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 className="text-[15px] font-semibold text-slate-800 mb-4">Tasiyici Maliyet Dagilimi</h3>
          {providerCostChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={providerCostChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {providerCostChart.map((_entry, i) => <Cell key={i} fill={providerCostChart[i].color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${(Number(v) / 1000).toFixed(0)}K TL`} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {providerCostChart.map((v) => (
                  <span key={v.name} className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} /> {v.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[13px] text-slate-400">Veri bekleniyor...</div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Main Dashboard ---

export default function DashboardPage() {
  useI18n()
  const { user } = useAuth()
  const role = user?.role || 'Admin'

  const { data: summary, isLoading: summaryLoading } = useApi(() => dashboardApi.getSummary())
  const { data: providerCosts } = useApi(() => dashboardApi.getProviderCosts())
  const { data: monthlyCosts } = useApi(() => dashboardApi.getMonthlyCosts())
  const { data: carrierPerfsData } = useApi(() => reportsApi.getCarrierPerformance())
  const { data: shipmentsData } = useApi(() => shipmentsApi.getAll({ pageSize: 10 }))
  const { data: savingsSummary } = useApi(() => sustainabilityApi.getSavingsSummary())

  const carrierPerfs: CarrierPerformance[] = carrierPerfsData || []
  const recentShipments: Shipment[] = shipmentsData?.items || (Array.isArray(shipmentsData) ? shipmentsData as unknown as Shipment[] : [])
  const co2SavedTons = savingsSummary?.totalCO2SavedTons || 0

  const roleLabels: Record<string, string> = {
    Admin: 'Yonetici', Executive: 'Ust Yonetim', LogisticsManager: 'Lojistik Muduru',
    OperationsSpecialist: 'Operasyon Uzmani', Finance: 'Finans',
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Gunaydin'
    if (hour < 18) return 'Iyi gunler'
    return 'Iyi aksamlar'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
            {greeting()}, {user?.firstName || 'Kullanici'}
          </h1>
          <p className="text-[14px] text-slate-400 mt-1">Lojistik operasyonlarinizin guncel ozeti.</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <Badge variant="orange">{roleLabels[role] || role}</Badge>
        </div>
      </div>

      {summaryLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>}
      {!summaryLoading && (role === 'Executive' || role === 'Admin') && <ExecutiveDashboard summary={summary} providerCosts={providerCosts || []} monthlyCosts={monthlyCosts || []} carrierPerfs={carrierPerfs} recentShipments={recentShipments} co2SavedTons={co2SavedTons} />}
      {!summaryLoading && role === 'LogisticsManager' && <LogisticsManagerDashboard summary={summary} carrierPerfs={carrierPerfs} providerCosts={providerCosts || []} />}
      {!summaryLoading && role === 'OperationsSpecialist' && <OperationsDashboard summary={summary} recentShipments={recentShipments} />}
      {!summaryLoading && role === 'Finance' && <FinanceDashboard summary={summary} monthlyCosts={monthlyCosts || []} providerCosts={providerCosts || []} />}
      {!summaryLoading && !['Executive', 'Admin', 'LogisticsManager', 'OperationsSpecialist', 'Finance'].includes(role) && <ExecutiveDashboard summary={summary} providerCosts={providerCosts || []} monthlyCosts={monthlyCosts || []} carrierPerfs={carrierPerfs} recentShipments={recentShipments} co2SavedTons={co2SavedTons} />}
    </div>
  )
}
