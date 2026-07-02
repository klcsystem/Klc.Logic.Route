import { useState } from 'react'
import { Save, FileCheck } from 'lucide-react'
import { toast } from '../../components/ui/Toast'

type PodStatus = 'disabled' | 'optional' | 'enabled'

interface PodRow {
  orderType: string
  label: string
  note: PodStatus
  noteRequired: boolean
  signature: PodStatus
  signatureRequired: boolean
  photos: PodStatus
  photosRequired: boolean
}

const initialRows: PodRow[] = [
  { orderType: 'delivery', label: 'Teslimat', note: 'optional', noteRequired: false, signature: 'enabled', signatureRequired: true, photos: 'optional', photosRequired: false },
  { orderType: 'pickup', label: 'Toplama', note: 'optional', noteRequired: false, signature: 'optional', signatureRequired: false, photos: 'disabled', photosRequired: false },
  { orderType: 'task', label: 'Görev', note: 'enabled', noteRequired: false, signature: 'disabled', signatureRequired: false, photos: 'disabled', photosRequired: false },
  { orderType: 'failed', label: 'Başarısız / Reddedildi', note: 'enabled', noteRequired: true, signature: 'disabled', signatureRequired: false, photos: 'optional', photosRequired: false },
]

const statusOptions: { value: PodStatus; label: string }[] = [
  { value: 'disabled', label: 'Devre Disi' },
  { value: 'optional', label: 'Opsiyonel' },
  { value: 'enabled', label: 'Aktif' },
]

function StatusSelect({ value, onChange }: { value: PodStatus; onChange: (v: PodStatus) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PodStatus)}
      className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 ${
        value === 'enabled'
          ? 'border-green-200 bg-green-50 text-green-700'
          : value === 'optional'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-slate-50 text-slate-500'
      }`}
    >
      {statusOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

export default function PodSettingsPage() {
  const [rows, setRows] = useState(initialRows)

  const updateRow = (orderType: string, field: keyof PodRow, value: PodStatus | boolean) => {
    setRows(prev => prev.map(r => r.orderType === orderType ? { ...r, [field]: value } : r))
  }

  const handleSave = () => {
    toast('success', 'POD ayarları kaydedildi')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Teslimat Kaniti (POD) Ayarları</h1>
        <p className="text-[14px] text-slate-400 mt-1">Sipariş tipine gore not, imza ve fotograf gereksinimlerini yapilandirin</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-6 pb-4">
          <FileCheck className="w-5 h-5 text-orange-500" />
          <h3 className="text-[15px] font-semibold text-slate-800">POD Gereksinimleri</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-48">Sipariş Tipi</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider" colSpan={2}>Not</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider" colSpan={2}>Imza</th>
                <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider" colSpan={2}>Fotograf</th>
              </tr>
              <tr className="border-b border-slate-100">
                <th />
                <th className="px-3 py-2 text-[10px] text-slate-400">Durum</th>
                <th className="px-3 py-2 text-[10px] text-slate-400">Zorunlu</th>
                <th className="px-3 py-2 text-[10px] text-slate-400">Durum</th>
                <th className="px-3 py-2 text-[10px] text-slate-400">Zorunlu</th>
                <th className="px-3 py-2 text-[10px] text-slate-400">Durum</th>
                <th className="px-3 py-2 text-[10px] text-slate-400">Zorunlu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.orderType} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-[13px] font-medium text-slate-800">{row.label}</td>
                  <td className="px-3 py-4 text-center">
                    <StatusSelect value={row.note} onChange={(v) => updateRow(row.orderType, 'note', v)} />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.noteRequired}
                      disabled={row.note === 'disabled'}
                      onChange={(e) => updateRow(row.orderType, 'noteRequired', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 disabled:opacity-30"
                    />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <StatusSelect value={row.signature} onChange={(v) => updateRow(row.orderType, 'signature', v)} />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.signatureRequired}
                      disabled={row.signature === 'disabled'}
                      onChange={(e) => updateRow(row.orderType, 'signatureRequired', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 disabled:opacity-30"
                    />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <StatusSelect value={row.photos} onChange={(v) => updateRow(row.orderType, 'photos', v)} />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={row.photosRequired}
                      disabled={row.photos === 'disabled'}
                      onChange={(e) => updateRow(row.orderType, 'photosRequired', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 disabled:opacity-30"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Save className="w-4 h-4" /> Kaydet
        </button>
      </div>
    </div>
  )
}
