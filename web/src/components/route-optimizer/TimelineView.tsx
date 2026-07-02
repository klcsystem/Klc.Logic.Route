import { useMemo } from 'react'
import type { VrpRoute } from '../../api/routeOptimization'

const ROUTE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899']

const TIMELINE_START = 8 // 8:00 AM
const TIMELINE_END = 17 // 5:00 PM
const TOTAL_HOURS = TIMELINE_END - TIMELINE_START

function parseTime(timeStr: string): number {
  // Accepts "HH:MM" or ISO string
  if (!timeStr) return TIMELINE_START
  const d = timeStr.includes('T') ? new Date(timeStr) : null
  if (d && !isNaN(d.getTime())) {
    return d.getHours() + d.getMinutes() / 60
  }
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60
  }
  return TIMELINE_START
}

function formatHour(h: number): string {
  const hour = Math.floor(h)
  const min = Math.round((h - hour) * 60)
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

interface TimelineViewProps {
  routes: VrpRoute[]
}

export default function TimelineView({ routes }: TimelineViewProps) {
  const hours = useMemo(() => {
    const arr: number[] = []
    for (let h = TIMELINE_START; h <= TIMELINE_END; h++) arr.push(h)
    return arr
  }, [])

  // Current time position
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  const currentPos = ((currentHour - TIMELINE_START) / TOTAL_HOURS) * 100

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-slate-800">Zaman Cizelgesi</h3>
        <span className="text-[11px] text-slate-400">
          {formatHour(TIMELINE_START)} - {formatHour(TIMELINE_END)}
        </span>
      </div>

      {routes.length === 0 ? (
        <div className="px-5 py-12 text-center text-[13px] text-slate-400">
          Henüz planlanmis rota yok
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Hour headers */}
            <div className="flex border-b border-slate-100">
              <div className="w-[160px] shrink-0 px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase">
                Sürücü
              </div>
              <div className="flex-1 relative flex">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[10px] text-slate-400 py-2 border-l border-slate-100 first:border-l-0"
                  >
                    {`${h.toString().padStart(2, '0')}:00`}
                  </div>
                ))}
              </div>
            </div>

            {/* Driver rows */}
            {routes.map((route, routeIdx) => {
              const color = ROUTE_COLORS[routeIdx % ROUTE_COLORS.length]

              return (
                <div key={route.vehicleId} className="flex border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                  {/* Driver info */}
                  <div className="w-[160px] shrink-0 px-4 py-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-slate-700 truncate">{route.plateNumber}</div>
                      <div className="text-[10px] text-slate-400">{route.stops.length} durak</div>
                    </div>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 relative py-2">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {hours.map((h) => (
                        <div key={h} className="flex-1 border-l border-slate-100 first:border-l-0" />
                      ))}
                    </div>

                    {/* Current time line */}
                    {currentHour >= TIMELINE_START && currentHour <= TIMELINE_END && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-red-400 z-20"
                        style={{ left: `${currentPos}%` }}
                      />
                    )}

                    {/* Stop blocks */}
                    <div className="relative h-8 mx-1">
                      {route.stops.map((stop, stopIdx) => {
                        const arrival = parseTime(stop.arrivalTime)
                        const departure = parseTime(stop.departureTime)
                        const duration = Math.max(departure - arrival, 0.25) // min 15 min visible

                        const left = ((arrival - TIMELINE_START) / TOTAL_HOURS) * 100
                        const width = (duration / TOTAL_HOURS) * 100

                        if (left < 0 || left > 100) return null

                        return (
                          <div
                            key={stop.stopId}
                            className="absolute top-1 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold cursor-default z-10 hover:z-30 hover:shadow-md transition-shadow"
                            style={{
                              left: `${Math.max(left, 0)}%`,
                              width: `${Math.max(width, 1.5)}%`,
                              backgroundColor: color,
                              opacity: 0.9,
                            }}
                            title={`${stop.address}\nVarış: ${stop.arrivalTime}\nAyrilis: ${stop.departureTime}`}
                          >
                            {stopIdx + 1}
                          </div>
                        )
                      })}

                      {/* Break block (simulated: 30 min break after ~halfway) */}
                      {route.stops.length >= 4 && (() => {
                        const midIdx = Math.floor(route.stops.length / 2)
                        const midStop = route.stops[midIdx]
                        if (!midStop) return null
                        const breakStart = parseTime(midStop.departureTime)
                        const breakDuration = 0.5 // 30 min
                        const left = ((breakStart - TIMELINE_START) / TOTAL_HOURS) * 100
                        const width = (breakDuration / TOTAL_HOURS) * 100

                        if (left < 0 || left > 100) return null

                        return (
                          <div
                            className="absolute top-1 h-6 rounded-md flex items-center justify-center text-[9px] font-medium text-slate-500 z-10"
                            style={{
                              left: `${left}%`,
                              width: `${Math.max(width, 1.5)}%`,
                              background: `repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 3px, #e2e8f0 3px, #e2e8f0 6px)`,
                              border: '1px solid #cbd5e1',
                            }}
                            title="Mola (30 dk)"
                          >
                            M
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Current time indicator label */}
            {currentHour >= TIMELINE_START && currentHour <= TIMELINE_END && (
              <div className="flex border-t border-slate-100">
                <div className="w-[160px] shrink-0" />
                <div className="flex-1 relative h-5">
                  <div
                    className="absolute -top-0.5 transform -translate-x-1/2 text-[9px] font-bold text-red-500 bg-red-50 px-1 rounded"
                    style={{ left: `${currentPos}%` }}
                  >
                    {formatHour(currentHour)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
