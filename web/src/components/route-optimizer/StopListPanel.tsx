import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MapPin, Weight, Box, Clock, Trash2, Plus } from 'lucide-react'
import { useI18n } from '../../i18n'
import type { VrpStop } from '../../api/routeOptimization'

interface StopListPanelProps {
  stops: VrpStop[]
  onStopsChange: (stops: VrpStop[]) => void
}

function SortableStop({ stop, onRemove }: { stop: VrpStop; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border p-3 flex items-start gap-2 transition-shadow ${
        isDragging ? 'border-orange-300 shadow-lg shadow-orange-100' : 'border-slate-200/60'
      }`}
    >
      <button {...attributes} {...listeners} className="mt-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="text-[13px] font-medium text-slate-800 truncate">{stop.address}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{stop.demandKg} kg</span>
          <span className="flex items-center gap-1"><Box className="w-3 h-3" />{stop.demandM3} m3</span>
          {stop.timeWindowStart && stop.timeWindowEnd && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{stop.timeWindowStart}-{stop.timeWindowEnd}</span>
          )}
        </div>
      </div>
      <button onClick={() => onRemove(stop.id)} className="text-slate-300 hover:text-red-400 transition-colors mt-1">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function StopListPanel({ stops, onStopsChange }: StopListPanelProps) {
  const { t } = useI18n()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [newWeight, setNewWeight] = useState(100)
  const [newVolume, setNewVolume] = useState(0.5)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = stops.findIndex(s => s.id === active.id)
      const newIndex = stops.findIndex(s => s.id === over.id)
      onStopsChange(arrayMove(stops, oldIndex, newIndex))
    }
  }

  const handleRemove = (id: string) => {
    onStopsChange(stops.filter(s => s.id !== id))
  }

  const handleAdd = () => {
    if (!newAddress) return
    const newStop: VrpStop = {
      id: `stop-${Date.now()}`,
      address: newAddress,
      lat: 39.9 + Math.random() * 1.5,
      lng: 30 + Math.random() * 3,
      demandKg: newWeight,
      demandM3: newVolume,
      serviceDurationMin: 15,
    }
    onStopsChange([...stops, newStop])
    setNewAddress('')
    setNewWeight(100)
    setNewVolume(0.5)
    setShowAddForm(false)
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-800">
          {t.vrp.stops} ({stops.length})
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-orange-600 hover:bg-orange-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.vrp.addStop}
        </button>
      </div>

      {showAddForm && (
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
          <input
            type="text"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            placeholder={t.vrp.addressPlaceholder}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={newWeight} onChange={e => setNewWeight(Number(e.target.value))} placeholder="Agirlik (kg)" className={inputClass} />
            <input type="number" step="0.1" value={newVolume} onChange={e => setNewVolume(Number(e.target.value))} placeholder="Hacim (m3)" className={inputClass} />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newAddress}
            className="w-full px-3 py-2 rounded-lg bg-orange-400 text-white text-[12px] font-semibold hover:bg-orange-500 disabled:opacity-50 transition-colors"
          >
            {t.vrp.addStop}
          </button>
        </div>
      )}

      <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {stops.map(stop => (
              <SortableStop key={stop.id} stop={stop} onRemove={handleRemove} />
            ))}
          </SortableContext>
        </DndContext>
        {stops.length === 0 && (
          <div className="text-center py-8 text-slate-300">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p className="text-[13px]">{t.vrp.noStops}</p>
          </div>
        )}
      </div>
    </div>
  )
}
