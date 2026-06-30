import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface DonutChartProps {
  value: number      // percentage 0-100
  label: string      // center text
  sublabel?: string  // below center
  color?: string     // main color
  size?: number      // width/height
}

export default function DonutChart({
  value,
  label,
  sublabel,
  color = '#f97316',
  size = 160,
}: DonutChartProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const data = [
    { name: 'used', value: clampedValue },
    { name: 'remaining', value: 100 - clampedValue },
  ]

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.32}
              outerRadius={size * 0.44}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[18px] font-bold text-slate-800 leading-tight">{label}</span>
          {sublabel && (
            <span className="text-[11px] text-slate-400 mt-0.5">{sublabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}
