import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useI18n } from '../../i18n'
import type { SimulationResult } from '../../api/simulation'

interface CostImpactChartProps {
  result: SimulationResult
}

export default function CostImpactChart({ result }: CostImpactChartProps) {
  const { t } = useI18n()

  const data = result.costBreakdown.map(item => ({
    name: item.category,
    [t.simulation.current]: item.current,
    [t.simulation.simulated]: item.simulated,
  }))

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <h3 className="text-[15px] font-semibold text-slate-800 mb-1">{t.simulation.costBreakdown}</h3>
      <p className="text-[12px] text-slate-400 mb-4">{t.simulation.costBreakdownDesc}</p>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 30, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(value) => `${Number(value).toLocaleString()} TRY`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Bar dataKey={t.simulation.current} fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={32} />
          <Bar dataKey={t.simulation.simulated} fill="#f97316" radius={[6, 6, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
