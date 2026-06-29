import { RefreshCw } from 'lucide-react'

export default function RecurringRoutesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Tekrarlayan Rotalar</h1>
        <p className="text-[14px] text-slate-400 mt-1">Duzensiz rotalarin otomatik tespiti ve sablonlastirilmasi</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
        <RefreshCw className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <p className="text-[15px] font-medium text-slate-400 mb-2">Tekrarlayan Rotalar</p>
        <p className="text-[13px] text-slate-300">Bu ozellik yakin zamanda aktif olacak</p>
      </div>
    </div>
  )
}
