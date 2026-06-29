import { useState, useRef, useCallback } from 'react'
import { Upload, FileSpreadsheet, X, Loader2, ClipboardPaste, Calendar, Clock, ArrowRight, AlertCircle } from 'lucide-react'
import Drawer from './ui/Drawer'
import { ordersApi } from '../api/orders'
import { toast } from './ui/Toast'

interface ImportOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: () => void
}

interface ParsedRow {
  [key: string]: string
}

interface ColumnMapping {
  customerName: string
  destinationAddress: string
  destinationCity: string
  orderNumber: string
  totalWeightKg: string
  priority: string
}

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  customerName: 'Musteri Adi',
  destinationAddress: 'Teslimat Adresi',
  destinationCity: 'Sehir',
  orderNumber: 'Siparis No',
  totalWeightKg: 'Agirlik (kg)',
  priority: 'Oncelik',
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return { headers: [], rows: [] }

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''))
    if (values.length === 0 || (values.length === 1 && !values[0])) continue
    const row: ParsedRow = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

function guessMapping(headers: string[]): ColumnMapping {
  const lower = headers.map((h) => h.toLowerCase())
  const find = (keywords: string[]): string => {
    for (const kw of keywords) {
      const idx = lower.findIndex((h) => h.includes(kw))
      if (idx >= 0) return headers[idx]
    }
    return ''
  }

  return {
    customerName: find(['musteri', 'customer', 'firma', 'alici']),
    destinationAddress: find(['adres', 'address', 'teslimat']),
    destinationCity: find(['sehir', 'city', 'il']),
    orderNumber: find(['siparis', 'order', 'no', 'numara']),
    totalWeightKg: find(['agirlik', 'weight', 'kg']),
    priority: find(['oncelik', 'priority']),
  }
}

export default function ImportOrdersModal({ isOpen, onClose, onImportComplete }: ImportOrdersModalProps) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    customerName: '', destinationAddress: '', destinationCity: '',
    orderNumber: '', totalWeightKg: '', priority: '',
  })
  const [planningDate, setPlanningDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [serviceDuration, setServiceDuration] = useState(5)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [step, setStep] = useState<'input' | 'mapping'>('input')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setFile(null)
    setPasteText('')
    setHeaders([])
    setRows([])
    setMapping({ customerName: '', destinationAddress: '', destinationCity: '', orderNumber: '', totalWeightKg: '', priority: '' })
    setStep('input')
    setIsImporting(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const processText = useCallback((text: string) => {
    const { headers: h, rows: r } = parseCSV(text)
    if (h.length === 0) {
      toast('error', 'Dosya bos veya gecersiz format')
      return
    }
    setHeaders(h)
    setRows(r)
    setMapping(guessMapping(h))
    setStep('mapping')
  }, [])

  const handleFile = useCallback((f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (text) processText(text)
    }
    reader.readAsText(f)
  }, [processText])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handlePasteProcess = () => {
    if (!pasteText.trim()) return
    // Treat each line as a destination address
    const lines = pasteText.trim().split('\n').filter((l) => l.trim())
    const csvText = 'Adres\n' + lines.map((l) => l.trim()).join('\n')
    processText(csvText)
  }

  const handleImport = async () => {
    if (rows.length === 0) return
    setIsImporting(true)

    try {
      let successCount = 0
      let failCount = 0

      for (const row of rows) {
        try {
          const orderData = {
            orderNumber: mapping.orderNumber ? row[mapping.orderNumber] : `IMP-${Date.now()}-${successCount}`,
            customerName: mapping.customerName ? row[mapping.customerName] : 'Imported',
            destinationAddress: mapping.destinationAddress ? row[mapping.destinationAddress] : '',
            destinationCity: mapping.destinationCity ? row[mapping.destinationCity] : '',
            totalWeightKg: mapping.totalWeightKg ? Number(row[mapping.totalWeightKg]) || 0 : 0,
            priority: (mapping.priority ? row[mapping.priority] || 'Normal' : 'Normal') as 'Normal' | 'Priority' | 'Urgent',
            requestedDeliveryDate: planningDate,
            serviceDurationMinutes: serviceDuration,
          }
          await ordersApi.importOrder(orderData)
          successCount++
        } catch {
          failCount++
        }
      }

      if (successCount > 0) {
        toast('success', `${successCount} siparis basariyla eklendi${failCount > 0 ? `, ${failCount} hata` : ''}`)
        onImportComplete?.()
        handleClose()
      } else {
        toast('error', 'Hicbir siparis eklenemedi')
      }
    } catch {
      toast('error', 'Import sirasinda hata olustu')
    } finally {
      setIsImporting(false)
    }
  }

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Siparis Import"
      width="max-w-2xl"
      footer={
        step === 'mapping' ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Geri
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-400">{rows.length} satir</span>
              <button
                onClick={handleImport}
                disabled={isImporting || rows.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isImporting ? 'Import ediliyor...' : 'Import Et'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <button onClick={handleClose} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
              Kapat
            </button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        {step === 'input' && (
          <>
            {/* Mode tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  mode === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Dosya Yukle
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  mode === 'paste' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" /> Adres Yapistir
              </button>
            </div>

            {mode === 'upload' && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-orange-400 bg-orange-50'
                    : file
                      ? 'border-green-300 bg-green-50'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-10 h-10 text-green-500" />
                    <p className="text-[14px] font-medium text-green-700">{file.name}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setHeaders([]); setRows([]) }}
                      className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" /> Kaldir
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className={`w-10 h-10 ${isDragging ? 'text-orange-400' : 'text-slate-300'}`} />
                    <div>
                      <p className="text-[14px] font-medium text-slate-600">Dosyayi surukleyip birakin</p>
                      <p className="text-[12px] text-slate-400 mt-1">veya dosya secmek icin tiklayin</p>
                    </div>
                    <p className="text-[11px] text-slate-400">CSV, TSV, Excel (.xlsx, .xls)</p>
                  </div>
                )}
              </div>
            )}

            {mode === 'paste' && (
              <div className="space-y-3">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Her satira bir adres yazin veya yapistirin...&#10;&#10;Istanbul Kadikoy Bagdat Caddesi No:123&#10;Ankara Cankaya Ataturk Bulvari No:45&#10;Izmir Karsiyaka Cemal Gursel Caddesi No:78"
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white resize-none"
                />
                <button
                  onClick={handlePasteProcess}
                  disabled={!pasteText.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-orange-400/10 transition-all"
                >
                  <ArrowRight className="w-4 h-4" /> Devam Et
                </button>
              </div>
            )}

            {/* Planning settings */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Planlama Tarihi
                </label>
                <input
                  type="date"
                  value={planningDate}
                  onChange={(e) => setPlanningDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Servis Suresi (dk)
                </label>
                <input
                  type="number"
                  min={1}
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                />
              </div>
            </div>
          </>
        )}

        {step === 'mapping' && (
          <>
            {/* Column mapping */}
            <div>
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Sutun Eslestirme</h4>
              <div className="space-y-3">
                {(Object.keys(FIELD_LABELS) as Array<keyof ColumnMapping>).map((field) => (
                  <div key={field} className="flex items-center gap-3">
                    <span className="text-[13px] text-slate-600 w-36 flex-shrink-0">{FIELD_LABELS[field]}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <select
                      value={mapping[field]}
                      onChange={(e) => updateMapping(field, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                    >
                      <option value="">-- Sec --</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <h4 className="text-[13px] font-semibold text-slate-700 mb-3">Onizleme (ilk 5 satir)</h4>
              {rows.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-[13px] text-amber-700">Veri bulunamadi</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {headers.map((h) => (
                            <th key={h} className="text-left px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            {headers.map((h) => (
                              <td key={h} className="px-3 py-2 text-slate-600 whitespace-nowrap max-w-[200px] truncate">{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Planning settings (also on mapping step) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Planlama Tarihi
                </label>
                <input
                  type="date"
                  value={planningDate}
                  onChange={(e) => setPlanningDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Servis Suresi (dk)
                </label>
                <input
                  type="number"
                  min={1}
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  )
}
