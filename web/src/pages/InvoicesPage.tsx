import { useState } from 'react'
import { FileText, Plus, Loader2, Send, CheckCircle } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface InvoiceLine {
  id: string
  shipmentId: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  periodMonth: number
  periodYear: number
  totalAmount: number
  currency: string
  status: string
  createdAt: string
  sentAt: string | null
  paidAt: string | null
  lines: InvoiceLine[]
}

const invoicesApi = {
  getAll: (page = 1, pageSize = 50) =>
    api.get('/invoices', { params: { page, pageSize } }).then(r => r.data),
  getById: (id: string) =>
    api.get(`/invoices/${id}`).then(r => r.data),
  generate: (month: number, year: number, customerName?: string) =>
    api.post('/invoices/generate', { month, year, customerName }).then(r => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/invoices/${id}/status`, { status }).then(r => r.data),
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Draft': return <Badge variant="default">Taslak</Badge>
    case 'Sent': return <Badge variant="info">Gönderildi</Badge>
    case 'Paid': return <Badge variant="success">Odendi</Badge>
    default: return <Badge>{status}</Badge>
  }
}

export default function InvoicesPage() {
  const { data: invoicesData, isLoading, refetch } = useApi<Invoice[]>(
    () => invoicesApi.getAll(),
    [],
  )
  const invoices: Invoice[] = invoicesData || []

  const [generating, setGenerating] = useState(false)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const draftCount = invoices.filter(i => i.status === 'Draft').length
  const paidCount = invoices.filter(i => i.status === 'Paid').length

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await invoicesApi.generate(genMonth, genYear)
      refetch()
    } catch (err) {
      console.error('Generate error:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await invoicesApi.updateStatus(id, status)
      refetch()
      if (selectedInvoice?.id === id) {
        setSelectedInvoice({ ...selectedInvoice, status })
      }
    } catch (err) {
      console.error('Status update error:', err)
    }
  }

  const handleViewDetail = async (id: string) => {
    setLoadingDetail(true)
    try {
      const res = await invoicesApi.getById(id)
      if (res.success) setSelectedInvoice(res.data)
    } catch (err) {
      console.error('Detail error:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faturalar</h1>
          <p className="text-sm text-slate-500 mt-1">Tamamlanan sevkiyatlardan otomatik fatura oluşturma</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Toplam Fatura" value={invoices.length} icon={FileText} color="bg-blue-50 text-blue-600" />
        <StatCard label="Toplam Tutar" value={`${totalAmount.toLocaleString('tr-TR')} TRY`} icon={FileText} color="bg-green-50 text-green-600" />
        <StatCard label="Taslak" value={draftCount} icon={FileText} color="bg-amber-50 text-amber-600" />
        <StatCard label="Ödenmiş" value={paidCount} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Generate Form */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Yeni Fatura Oluştur</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ay</label>
            <select value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-24">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Yıl</label>
            <input type="number" value={genYear} onChange={e => setGenYear(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-24" />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Fatura Oluştur
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Fatura Listesi</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Yükleniyor...</div>
        ) : invoices.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Henüz fatura yok</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Fatura No</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Müşteri</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Dönem</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Tutar</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Durum</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Tarih</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => handleViewDetail(inv.id)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{inv.customerName}</td>
                    <td className="px-4 py-3 text-slate-500">{inv.periodMonth}/{inv.periodYear}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {inv.totalAmount.toLocaleString('tr-TR')} {inv.currency}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(inv.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {inv.status === 'Draft' && (
                          <button onClick={() => handleStatusUpdate(inv.id, 'Sent')}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100">
                            <Send className="w-3 h-3" /> Gönder
                          </button>
                        )}
                        {inv.status === 'Sent' && (
                          <button onClick={() => handleStatusUpdate(inv.id, 'Paid')}
                            className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100">
                            <CheckCircle className="w-3 h-3" /> Odendi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-sm text-slate-500">{selectedInvoice.customerName} - {selectedInvoice.periodMonth}/{selectedInvoice.periodYear}</p>
              </div>
              {getStatusBadge(selectedInvoice.status)}
            </div>
            {loadingDetail ? (
              <div className="flex items-center justify-center h-32 text-slate-400">Yükleniyor...</div>
            ) : (
              <div className="p-6">
                {selectedInvoice.lines && selectedInvoice.lines.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 font-medium text-slate-500">Açıklama</th>
                        <th className="text-right py-2 font-medium text-slate-500">Adet</th>
                        <th className="text-right py-2 font-medium text-slate-500">Birim Fiyat</th>
                        <th className="text-right py-2 font-medium text-slate-500">Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.lines.map((line: InvoiceLine) => (
                        <tr key={line.id} className="border-b border-slate-50">
                          <td className="py-2 text-slate-700">{line.description}</td>
                          <td className="py-2 text-right text-slate-500">{line.quantity}</td>
                          <td className="py-2 text-right text-slate-500">{line.unitPrice.toLocaleString('tr-TR')}</td>
                          <td className="py-2 text-right font-medium text-slate-900">{line.amount.toLocaleString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan={3} className="py-3 text-right font-semibold text-slate-700">Toplam:</td>
                        <td className="py-3 text-right font-bold text-lg text-slate-900">
                          {selectedInvoice.totalAmount.toLocaleString('tr-TR')} {selectedInvoice.currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p className="text-slate-400 text-center py-8">Kalem detayi bulunamadı</p>
                )}
              </div>
            )}
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
