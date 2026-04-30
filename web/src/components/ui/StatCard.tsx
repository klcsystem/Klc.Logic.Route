import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  icon: LucideIcon
  color: string
}

export default function StatCard({ label, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-[12px] font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-[28px] font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-[13px] text-slate-400 mt-0.5">{label}</div>
    </div>
  )
}
