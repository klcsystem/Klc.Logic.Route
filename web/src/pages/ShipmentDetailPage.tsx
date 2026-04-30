import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Package, Weight, Box, Scale, AlertTriangle, Snowflake, Calculator, Check, X, Send, MapPin, CheckCircle2 } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
import type { Shipment, ShipmentItem, ShipmentEvent, Recommendation, ShipmentStatus } from '../types'

const mockItems: ShipmentItem[] = [
  { id: 'i1', shipmentId: 's1', productCode: 'PRD-001', productName: 'Sut 1L Kutu', quantity: 500, weightKg: 520, volumeM3: 0.8, desiWeight: 160, lengthCm: 40, widthCm: 30, heightCm: 25 },
  { id: 'i2', shipmentId: 's1', productCode: 'PRD-002', productName: 'Yogurt 500g', quantity: 300, weightKg: 160, volumeM3: 0.4, desiWeight: 80, lengthCm: 30, widthCm: 25, heightCm: 20 },
  { id: 'i3', shipmentId: 's1', productCode: 'PRD-003', productName: 'Tereyagi 250g', quantity: 200, weightKg: 55, volumeM3: 0.15, desiWeight: 30, lengthCm: 20, widthCm: 15, heightCm: 10 },
]

const mockEvents: ShipmentEvent[] = [
  { id: 'e1', shipmentId: 's1', eventType: 'Created', status: 'Draft', description: 'Sevkiyat olusturuldu', createdAt: '2024-03-15 08:00', createdBy: 'Sistem' },
  { id: 'e2', shipmentId: 's1', eventType: 'Calculated', status: 'Calculated', description: 'Karar motoru calistirildi — Aras Kargo secildi', createdAt: '2024-03-15 08:15', createdBy: 'Sistem' },
  { id: 'e3', shipmentId: 's1', eventType: 'Approved', status: 'Approved', description: 'Sevkiyat onaylandi', createdAt: '2024-03-15 09:30', createdBy: 'A. Yilmaz' },
  { id: 'e4', shipmentId: 's1', eventType: 'SentToProvider', status: 'SentToProvider', description: 'Aras Kargo\'ya gonderildi', createdAt: '2024-03-15 10:00', createdBy: 'Sistem' },
  { id: 'e5', shipmentId: 's1', eventType: 'Loading', status: 'Loading', description: 'Yuklenme basladi — Istanbul depo', location: 'Istanbul', createdAt: '2024-03-15 11:00', createdBy: 'M. Kaya' },
  { id: 'e6', shipmentId: 's1', eventType: 'InTransit', status: 'InTransit', description: 'Yola cikti — tahmini varis: 16 Mart 14:00', createdAt: '2024-03-15 12:30', createdBy: 'Sistem' },
]

const mockRecommendation: Recommendation = {
  selectedProviderName: 'Aras Kargo',
  calculatedPrice: 8450,
  alternativeProvider1: 'Yurtici Kargo',
  alternativePrice1: 9100,
  alternativeProvider2: 'MNG Kargo',
  alternativePrice2: 7200,
  savingsAmount: 650,
  savingsPercent: 7.1,
  reason: 'Fiyat-performans optimumu',
  scorePrice: 78,
  scoreSpeed: 92,
  scoreReliability: 85,
  overallScore: 84,
  recommendedVehicle: 'Tir',
  explanation: 'Istanbul-Ankara arasi FTL tasimada Aras Kargo, hiz ve guvenilirlik dengesinde en uygun secenek. MNG %7 daha ucuz ancak transit sure 1 gun fazla.',
}

const mockShipment: Shipment = {
  id: 's1',
  shipmentNumber: 'SHP-2024-0412',
  orderId: '1',
  originCity: 'Istanbul',
  destinationCity: 'Ankara',
  status: 'InTransit',
  priority: 'Urgent',
  totalWeightKg: 735,
  totalVolumeM3: 1.35,
  totalDesiWeight: 270,
  chargeableWeight: 735,
  palletCount: 4,
  isHazardous: false,
  requiresColdChain: true,
  recommendedVehicle: 'Tir',
  selectedProviderName: 'Aras Kargo',
  calculatedPrice: 8450,
  currency: 'TRY',
  requestedDeliveryDate: '2024-03-16',
  items: mockItems,
  events: mockEvents,
  recommendation: mockRecommendation,
  createdAt: '2024-03-15',
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'> = {
  Draft: 'default', Calculated: 'info', PendingApproval: 'warning', Approved: 'success',
  SentToProvider: 'orange', VehicleAssigned: 'orange', Loading: 'orange',
  InTransit: 'orange', Delivered: 'success', Completed: 'success', Cancelled: 'error',
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-slate-600 w-28">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[13px] font-semibold text-slate-800 w-10 text-right">{value}%</span>
    </div>
  )
}

function ActionButtons({ status, t }: { status: ShipmentStatus; t: ReturnType<typeof useI18n>['t'] }) {
  const btnPrimary = 'flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all'
  const btnSecondary = 'flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors'
  const btnDanger = 'flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {status === 'Draft' && <button className={btnPrimary}><Calculator className="w-4 h-4" /> {t.shipments.calculate}</button>}
      {status === 'Calculated' && <><button className={btnPrimary}><Check className="w-4 h-4" /> {t.shipments.approve}</button><button className={btnSecondary}>{t.routeOptimization.selectCarrier}</button></>}
      {status === 'PendingApproval' && <><button className={btnPrimary}><Check className="w-4 h-4" /> {t.shipments.approve}</button><button className={btnDanger}><X className="w-4 h-4" /> {t.shipments.reject}</button></>}
      {status === 'Approved' && <button className={btnPrimary}><Send className="w-4 h-4" /> {t.shipments.sendToProviderBtn}</button>}
      {status === 'InTransit' && <button className={btnSecondary}><MapPin className="w-4 h-4" /> {t.shipments.track}</button>}
      {status === 'Delivered' && <button className={btnPrimary}><CheckCircle2 className="w-4 h-4" /> {t.shipments.complete}</button>}
      {!['Completed', 'Cancelled'].includes(status) && <button className={btnDanger}><X className="w-4 h-4" /> {t.shipments.cancelShipment}</button>}
    </div>
  )
}

export default function ShipmentDetailPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const shipment = mockShipment

  const statusLabels: Record<string, string> = {
    Draft: t.shipments.draft, Calculated: t.shipments.calculated, PendingApproval: t.shipments.pendingApproval,
    Approved: t.shipments.approved, SentToProvider: t.shipments.sentToProvider, VehicleAssigned: t.shipments.vehicleAssigned,
    Loading: t.shipments.loading, InTransit: t.shipments.inTransit, Delivered: t.shipments.delivered,
    Completed: t.shipments.completed, Cancelled: t.shipments.cancelled,
  }

  const priorityVariant: Record<string, 'default' | 'warning' | 'error'> = { Normal: 'default', Priority: 'warning', Urgent: 'error' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/shipments')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{shipment.shipmentNumber}</h1>
              <Badge variant={statusVariant[shipment.status]}>{statusLabels[shipment.status]}</Badge>
              <Badge variant={priorityVariant[shipment.priority]}>{shipment.priority}</Badge>
              {shipment.isHazardous && <Badge variant="error"><AlertTriangle className="w-3 h-3 mr-1" />ADR</Badge>}
              {shipment.requiresColdChain && <Badge variant="info"><Snowflake className="w-3 h-3 mr-1" />Frigo</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[14px] text-slate-500">
              <span>{shipment.originCity}</span>
              <ArrowRight className="w-4 h-4 text-orange-400" />
              <span>{shipment.destinationCity}</span>
              <span className="text-slate-300 mx-2">|</span>
              <span>{t.shipments.requestedDate}: {shipment.requestedDeliveryDate}</span>
            </div>
          </div>
        </div>
        <ActionButtons status={shipment.status} t={t} />
      </div>

      {/* Cargo Info Cards — 4-grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.shipments.totalWeight, value: `${shipment.totalWeightKg.toLocaleString()} kg`, icon: Weight, color: 'text-blue-600 bg-blue-50' },
          { label: t.shipments.totalVolume, value: `${shipment.totalVolumeM3} m³`, icon: Box, color: 'text-green-600 bg-green-50' },
          { label: t.shipments.desiWeight, value: `${shipment.totalDesiWeight}`, icon: Package, color: 'text-amber-600 bg-amber-50' },
          { label: t.shipments.chargeableWeight, value: `${shipment.chargeableWeight} kg`, icon: Scale, color: 'text-purple-600 bg-purple-50' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-[24px] font-bold text-slate-900 tracking-tight">{card.value}</div>
            <div className="text-[13px] text-slate-400 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Items + Recommendation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-800">{t.shipments.items} ({shipment.items.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Urun</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Adet</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Agirlik</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hacim</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Desi</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Boyutlar</th>
                </tr></thead>
                <tbody>
                  {shipment.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="px-6 py-3"><div className="text-[13px] text-slate-800">{item.productName}</div><div className="text-[11px] text-slate-400">{item.productCode}</div></td>
                      <td className="px-6 py-3 text-right text-[13px] text-slate-600">{item.quantity}</td>
                      <td className="px-6 py-3 text-right text-[13px] text-slate-600">{item.weightKg} kg</td>
                      <td className="px-6 py-3 text-right text-[13px] text-slate-600">{item.volumeM3} m³</td>
                      <td className="px-6 py-3 text-right text-[13px] text-slate-600">{item.desiWeight}</td>
                      <td className="px-6 py-3 text-right text-[12px] text-slate-400">{item.lengthCm}x{item.widthCm}x{item.heightCm} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendation Card */}
          {shipment.recommendation && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-white">
                <h2 className="text-[15px] font-semibold text-slate-800">{t.shipments.decisionResult}</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Selected + Alternatives */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border-2 border-orange-300 bg-orange-50/50">
                    <span className="text-[11px] font-semibold text-orange-500 uppercase">{t.shipments.selectedProvider}</span>
                    <p className="text-[16px] font-bold text-slate-900 mt-1">{shipment.recommendation.selectedProviderName}</p>
                    <p className="text-[20px] font-bold text-orange-500 mt-1">{shipment.recommendation.calculatedPrice.toLocaleString()} {shipment.currency}</p>
                  </div>
                  {shipment.recommendation.alternativeProvider1 && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.shipments.alternative} 1</span>
                      <p className="text-[14px] font-medium text-slate-700 mt-1">{shipment.recommendation.alternativeProvider1}</p>
                      <p className="text-[16px] font-semibold text-slate-500 mt-1">{shipment.recommendation.alternativePrice1?.toLocaleString()} {shipment.currency}</p>
                    </div>
                  )}
                  {shipment.recommendation.alternativeProvider2 && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">{t.shipments.alternative} 2</span>
                      <p className="text-[14px] font-medium text-slate-700 mt-1">{shipment.recommendation.alternativeProvider2}</p>
                      <p className="text-[16px] font-semibold text-slate-500 mt-1">{shipment.recommendation.alternativePrice2?.toLocaleString()} {shipment.currency}</p>
                    </div>
                  )}
                </div>

                {/* Savings */}
                <div className="flex items-center gap-3">
                  <Badge variant="success">{t.shipments.savings}: {shipment.recommendation.savingsAmount.toLocaleString()} {shipment.currency} ({shipment.recommendation.savingsPercent}%)</Badge>
                  <Badge variant="info">{t.shipments.recommendedVehicle}: {shipment.recommendation.recommendedVehicle}</Badge>
                </div>

                {/* Scoring Bars */}
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-700 mb-3">{t.shipments.scoring}</h4>
                  <div className="space-y-2.5">
                    <ScoreBar label={t.shipments.price} value={shipment.recommendation.scorePrice} color="bg-blue-500" />
                    <ScoreBar label={t.shipments.speed} value={shipment.recommendation.scoreSpeed} color="bg-green-500" />
                    <ScoreBar label={t.shipments.reliability} value={shipment.recommendation.scoreReliability} color="bg-amber-500" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-700">{t.shipments.overallScore}:</span>
                    <span className="text-[18px] font-bold text-orange-500">{shipment.recommendation.overallScore}</span>
                    <span className="text-[13px] text-slate-400">/ 100</span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <h4 className="text-[12px] font-semibold text-blue-600 uppercase mb-1">{t.shipments.explanation}</h4>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{shipment.recommendation.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.shipments.generalInfo}</h3>
            <div className="space-y-3">
              {[
                [t.shipments.carrier, shipment.selectedProviderName || '—'],
                [t.shipments.vehicle, `${shipment.recommendedVehicle}`],
                ['Palet', `${shipment.palletCount}`],
                [t.shipments.cost, shipment.calculatedPrice ? `${shipment.calculatedPrice.toLocaleString()} ${shipment.currency}` : '—'],
                [t.shipments.requestedDate, shipment.requestedDeliveryDate || '—'],
                [t.shipments.actualDate, shipment.actualDeliveryDate || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500">{label}</span>
                  <span className="text-[13px] font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-4">{t.shipments.timeline}</h3>
            <div className="space-y-0">
              {shipment.events.map((ev, i) => (
                <div key={ev.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1 ${i === shipment.events.length - 1 ? 'bg-orange-400 ring-4 ring-orange-100' : 'bg-green-400'}`} />
                    {i < shipment.events.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[ev.status]}>{statusLabels[ev.status]}</Badge>
                    </div>
                    <p className="text-[13px] text-slate-700 mt-1">{ev.description}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ev.createdAt} — {ev.createdBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
