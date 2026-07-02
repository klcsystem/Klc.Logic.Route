import { useState, useCallback } from 'react'
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
import { Save, RotateCcw, GripVertical, Map, Smartphone, Eye, Scan } from 'lucide-react'
import { toast } from '../../components/ui/Toast'

interface FieldConfig {
  id: string
  label: string
  visible: boolean
}

interface DriverConfig {
  showMap: boolean
  enableMapTab: boolean
  allowReject: boolean
  allowOverrideSchedule: boolean
  allowUndo: boolean
  allowResequence: boolean
  allowAddBreak: boolean
  allowGalleryImages: boolean
  barcodeScanOnPickup: boolean
  barcodeScanOnDelivery: boolean
  barcodeValidation: boolean
  barcodeAutoComplete: boolean
  fields: FieldConfig[]
}

const defaultConfig: DriverConfig = {
  showMap: true,
  enableMapTab: true,
  allowReject: false,
  allowOverrideSchedule: false,
  allowUndo: true,
  allowResequence: false,
  allowAddBreak: true,
  allowGalleryImages: true,
  barcodeScanOnPickup: true,
  barcodeScanOnDelivery: true,
  barcodeValidation: false,
  barcodeAutoComplete: false,
  fields: [
    { id: 'address', label: 'Adres', visible: true },
    { id: 'duration', label: 'Süre', visible: true },
    { id: 'location', label: 'Konum', visible: true },
    { id: 'timeWindows', label: 'Zaman Penceresi', visible: true },
    { id: 'orderId', label: 'Sipariş ID', visible: true },
    { id: 'notes', label: 'Notlar', visible: true },
    { id: 'email', label: 'E-posta', visible: false },
    { id: 'phone', label: 'Telefon', visible: true },
    { id: 'barcode', label: 'Barkod', visible: false },
  ],
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div>
        <span className="text-[13px] text-slate-700">{label}</span>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-orange-400' : 'bg-slate-200'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

function SortableField({ field, onToggle }: { field: FieldConfig; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })

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
      className={`flex items-center justify-between p-3 rounded-xl border transition-shadow ${
        isDragging ? 'border-orange-300 shadow-lg shadow-orange-100 bg-white' : 'border-slate-100 bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-[13px] text-slate-700">{field.label}</span>
      </div>
      <button
        onClick={() => onToggle(field.id)}
        className={`w-10 h-6 rounded-full transition-colors ${field.visible ? 'bg-orange-400' : 'bg-slate-200'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${field.visible ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export default function DriverAppConfigPage() {
  const [config, setConfig] = useState<DriverConfig>(defaultConfig)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const updateConfig = useCallback(<K extends keyof DriverConfig>(key: K, value: DriverConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleField = useCallback((fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, visible: !f.visible } : f),
    }))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setConfig(prev => {
        const oldIndex = prev.fields.findIndex(f => f.id === active.id)
        const newIndex = prev.fields.findIndex(f => f.id === over.id)
        return { ...prev, fields: arrayMove(prev.fields, oldIndex, newIndex) }
      })
    }
  }, [])

  const handleRestore = () => {
    setConfig(defaultConfig)
    toast('success', 'Varsayılan ayarlara geri yüklendi')
  }

  const handleSave = () => {
    toast('success', 'Sürücü uygulama ayarları kaydedildi')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sürücü Uygulama Yapılandırmasi</h1>
        <p className="text-[14px] text-slate-400 mt-1">Mobil sürücü uygulamasinin görünüm ve davranış ayarları</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map Display */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Map className="w-5 h-5 text-orange-500" />
            <h3 className="text-[15px] font-semibold text-slate-800">Harita Görünümu</h3>
          </div>
          <div className="space-y-3">
            <Toggle checked={config.showMap} onChange={(v) => updateConfig('showMap', v)} label="Haritayı Göster" description="Ana ekranda harita görünsün" />
            <Toggle checked={config.enableMapTab} onChange={(v) => updateConfig('enableMapTab', v)} label="Harita Sekmesini Etkinleştir" description="Ayri bir harita sekmesi göster" />
          </div>
        </div>

        {/* Workflow */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Smartphone className="w-5 h-5 text-orange-500" />
            <h3 className="text-[15px] font-semibold text-slate-800">Is Akisi</h3>
          </div>
          <div className="space-y-3">
            <Toggle checked={config.allowReject} onChange={(v) => updateConfig('allowReject', v)} label="Reddetmeye İzin Ver" description="Sürücü siparişi reddedebilsin" />
            <Toggle checked={config.allowOverrideSchedule} onChange={(v) => updateConfig('allowOverrideSchedule', v)} label="Program Değişikliğine İzin Ver" description="Sürücü sıralamayı değiştirebilsin" />
            <Toggle checked={config.allowUndo} onChange={(v) => updateConfig('allowUndo', v)} label="Geri Almaya İzin Ver" description="Tamamlanan işlemi geri alabilsin" />
            <Toggle checked={config.allowResequence} onChange={(v) => updateConfig('allowResequence', v)} label="Yeniden Sıralama" description="Durak sirasini değiştirebilsin" />
            <Toggle checked={config.allowAddBreak} onChange={(v) => updateConfig('allowAddBreak', v)} label="Mola Ekleme" description="Rota arasina mola ekleyebilsin" />
          </div>
        </div>

        {/* Order Detail Fields */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Eye className="w-5 h-5 text-orange-500" />
            <h3 className="text-[15px] font-semibold text-slate-800">Sipariş Detay Alanları</h3>
          </div>
          <p className="text-[12px] text-slate-400 mb-4">Surukleyerek siralayin, toggle ile gorunurlugu ayarlayın</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={config.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {config.fields.map(field => (
                  <SortableField key={field.id} field={field} onToggle={toggleField} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Image & Barcode */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Eye className="w-5 h-5 text-orange-500" />
              <h3 className="text-[15px] font-semibold text-slate-800">Görsel Ayarları</h3>
            </div>
            <Toggle checked={config.allowGalleryImages} onChange={(v) => updateConfig('allowGalleryImages', v)} label="Galeriden Görsel Seçimi" description="Kamera yerine galeriden görsel seçebilsin" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Scan className="w-5 h-5 text-orange-500" />
              <h3 className="text-[15px] font-semibold text-slate-800">Barkod Tarama</h3>
            </div>
            <div className="space-y-3">
              <Toggle checked={config.barcodeScanOnPickup} onChange={(v) => updateConfig('barcodeScanOnPickup', v)} label="Toplamada Barkod Tara" />
              <Toggle checked={config.barcodeScanOnDelivery} onChange={(v) => updateConfig('barcodeScanOnDelivery', v)} label="Teslimatta Barkod Tara" />
              <Toggle checked={config.barcodeValidation} onChange={(v) => updateConfig('barcodeValidation', v)} label="Barkod Doğrulama" description="Barkod sipariş ile eşleşmeli" />
              <Toggle checked={config.barcodeAutoComplete} onChange={(v) => updateConfig('barcodeAutoComplete', v)} label="Otomatik Tamamla" description="Barkod sonrasi otomatik ilerle" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button onClick={handleRestore} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <RotateCcw className="w-4 h-4" /> Varsayılanlari Yukle
        </button>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Save className="w-4 h-4" /> Kaydet
        </button>
      </div>
    </div>
  )
}
