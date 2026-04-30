import { MapPin, Truck } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'

const mockVehicles = [
  { id: '1', plate: '34 KLC 001', driver: 'Ahmet Yilmaz', status: 'InTransit', route: 'Istanbul → Ankara', progress: 65, lastUpdate: '2 dk once' },
  { id: '2', plate: '34 KLC 003', driver: 'Mehmet Kaya', status: 'Loading', route: 'Istanbul → Bursa', progress: 0, lastUpdate: '5 dk once' },
  { id: '3', plate: '34 KLC 005', driver: 'Ali Demir', status: 'InTransit', route: 'Kocaeli → Istanbul', progress: 82, lastUpdate: '1 dk once' },
  { id: '4', plate: '06 KLC 012', driver: 'Veli Ozturk', status: 'InTransit', route: 'Ankara → Izmir', progress: 35, lastUpdate: '3 dk once' },
]

export default function LiveTrackingPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.liveTracking.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.liveTracking.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="h-[500px] bg-gradient-to-br from-slate-100 to-slate-50 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mb-6">
              <MapPin className="w-10 h-10" />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-700 mb-2">{t.liveTracking.title}</h3>
            <p className="text-[13px] text-slate-400 max-w-md">{t.liveTracking.mapPlaceholder}</p>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="text-[15px] font-semibold text-slate-800 mb-1">{t.liveTracking.activeVehicles}</h3>
            <p className="text-[24px] font-bold text-orange-500">{mockVehicles.length}</p>
          </div>

          {mockVehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-slate-800">{v.plate}</span>
                    <Badge variant={v.status === 'InTransit' ? 'orange' : 'info'}>{v.status === 'InTransit' ? 'Yolda' : 'Yukleniyor'}</Badge>
                  </div>
                  <span className="text-[11px] text-slate-400">{v.driver}</span>
                </div>
              </div>
              <div className="text-[12px] text-slate-500 mb-2">{v.route}</div>
              {v.progress > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${v.progress}%` }} />
                  </div>
                  <span className="text-[11px] text-slate-500">{v.progress}%</span>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">{v.lastUpdate}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
