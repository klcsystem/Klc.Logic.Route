import { useState } from 'react'
import { FileText, Upload, Search, Loader2, Filter } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface InvoiceAudit {
  id: string
  invoiceNo?: string
  invoiceNumber?: string
  shipmentId?: string
  shipmentNumber?: string
  providerName?: string
  invoiceAmount: number
  expectedAmount: number
  difference?: number
  differenceAmount?: number
  differencePercent: number
  status: string | number
  reviewedBy?: string
  invoiceDate?: string
  createdAt: string
}

interface InvoiceAuditResult {
  items: InvoiceAudit[]
  totalCount: number
}

// Backend, status'u bazen sayisal enum ("0".."3") bazen string ad ("Approved") olarak donuyor.
// Ikisini de tek bir kanonik degere indirgiyoruz. Seed: 0=Pending, 1=NeedsReview, 2=Flagged, 3=Approved.
type CanonicalStatus = 'Approved' | 'Flagged' | 'Pending' | 'NeedsReview'
function normalizeStatus(raw: string | number | undefined): CanonicalStatus {
  const s = String(raw ?? '').trim()
  switch (s) {
    case '3': case 'Approved': case 'Verified': return 'Approved'
    case '2': case 'Flagged': case 'Disputed': return 'Flagged'
    case '1': case 'NeedsReview': case 'Rejected': return 'NeedsReview'
    case '0': case 'Pending': default: return 'Pending'
  }
}

const statusVariant: Record<CanonicalStatus, 'success' | 'warning' | 'error' | 'info'> = {
  Approved: 'success',
  Pending: 'warning',
  Flagged: 'error',
  NeedsReview: 'info',
}

export default function InvoiceVerificationPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState<InvoiceAudit | null>(null)

  // Tumunu cekip filtrelemeyi client-side yapiyoruz: backend status'u numeric string
  // sakliyor, string ad ("Approved") ile server-side filtre bos donerdi.
  const { data: auditsData, isLoading } = useApi(
    () => api.get('/invoice-audits').then(r => r.data),
    [],
  )

  const audits: InvoiceAudit[] = (auditsData as unknown as InvoiceAuditResult)?.items
    || (Array.isArray(auditsData) ? auditsData as unknown as InvoiceAudit[] : [])

  const statusLabels: Record<CanonicalStatus, string> = {
    Approved: t.invoice.verified,
    Pending: t.invoice.pending,
    Flagged: t.invoice.disputed,
    NeedsReview: 'Inceleme Gerekli',
  }

  const invNo = (a: InvoiceAudit) => a.invoiceNumber || a.invoiceNo || ''
  const filteredAudits = audits.filter((a) => {
    const st = normalizeStatus(a.status)
    if (statusFilter !== 'all' && st !== statusFilter) return false
    if (searchTerm === '') return true
    const q = searchTerm.toLowerCase()
    return invNo(a).toLowerCase().includes(q) || (a.providerName || '').toLowerCase().includes(q)
  })

  const totalCount = audits.length
  const approvedCount = audits.filter(a => normalizeStatus(a.status) === 'Approved').length
  const flaggedCount = audits.filter(a => normalizeStatus(a.status) === 'Flagged').length
  const pendingCount = audits.filter(a => { const s = normalizeStatus(a.status); return s === 'Pending' || s === 'NeedsReview' }).length

  const kpis = [
    { label: t.invoice.totalInvoices, value: totalCount.toString(), change: 0, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: t.invoice.verified, value: approvedCount.toString(), change: 0, icon: FileText, color: 'text-green-600 bg-green-50' },
    { label: t.invoice.disputed, value: flaggedCount.toString(), change: 0, icon: FileText, color: 'text-red-600 bg-red-50' },
    { label: t.invoice.pending, value: pendingCount.toString(), change: 0, icon: FileText, color: 'text-amber-600 bg-amber-50' },
  ]

  const handleRowClick = (audit: InvoiceAudit) => {
    setSelectedAudit(audit)
    setDetailDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.invoice.title}</h1>
          <p className="text-[14px] text-slate-400 mt-1">{t.invoice.subtitle}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all">
          <Upload className="w-4 h-4" /> {t.invoice.newInvoice}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 appearance-none">
            <option value="all">{t.common.all}</option>
            <option value="Approved">{t.invoice.verified}</option>
            <option value="Pending">{t.invoice.pending}</option>
            <option value="Flagged">{t.invoice.disputed}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.invoiceNo}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sevkiyat</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.carrier}</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.invoiceAmount}</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.calculatedAmount}</th>
              <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.difference}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fark %</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inceleyen</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && filteredAudits.map((a) => {
                const diff = a.difference ?? a.differenceAmount ?? (a.invoiceAmount - a.expectedAmount)
                const diffPct = a.differencePercent || (a.expectedAmount ? ((diff / a.expectedAmount) * 100) : 0)
                const st = normalizeStatus(a.status)
                return (
                  <tr key={a.id} onClick={() => handleRowClick(a)} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{invNo(a) || '--'}</td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-500">{a.shipmentNumber || '--'}</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-700">{a.providerName || '--'}</td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-slate-800">{a.invoiceAmount.toLocaleString()} TL</td>
                    <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{a.expectedAmount.toLocaleString()} TL</td>
                    <td className="px-6 py-3.5 text-right text-[13px]">
                      <span className={diff === 0 ? 'text-green-600' : 'text-red-600'}>
                        {diff === 0 ? '--' : `${diff > 0 ? '+' : ''}${diff.toLocaleString()} TL`}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center text-[12px]">
                      <span className={Math.abs(diffPct) < 1 ? 'text-green-600' : 'text-red-600'}>
                        {diffPct === 0 ? '--' : `${diffPct > 0 ? '+' : ''}${diffPct.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <Badge variant={statusVariant[st]}>{statusLabels[st]}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-[12px] text-slate-500">{a.reviewedBy || '--'}</td>
                  </tr>
                )
              })}
              {!isLoading && filteredAudits.length === 0 && <tr><td colSpan={9} className="px-6 py-12 text-center text-[14px] text-slate-400">{t.common.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <Drawer isOpen={detailDrawerOpen} onClose={() => setDetailDrawerOpen(false)} title={selectedAudit ? invNo(selectedAudit) : ''} width="max-w-xl">
        {selectedAudit && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[normalizeStatus(selectedAudit.status)]}>{statusLabels[normalizeStatus(selectedAudit.status)]}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([
                [t.invoice.carrier, selectedAudit.providerName || '--'],
                ['Sevkiyat', selectedAudit.shipmentNumber || '--'],
                [t.invoice.invoiceAmount, `${selectedAudit.invoiceAmount.toLocaleString()} TL`],
                [t.invoice.calculatedAmount, `${selectedAudit.expectedAmount.toLocaleString()} TL`],
                [t.invoice.difference, `${(selectedAudit.difference ?? selectedAudit.differenceAmount ?? (selectedAudit.invoiceAmount - selectedAudit.expectedAmount)).toLocaleString()} TL`],
                ['Fark %', `${(selectedAudit.differencePercent || 0).toFixed(1)}%`],
                ['Inceleyen', selectedAudit.reviewedBy || '--'],
                [t.common.date, selectedAudit.invoiceDate || new Date(selectedAudit.createdAt).toLocaleDateString('tr-TR')],
              ] as const).map(([label, value]) => (
                <div key={label}><span className="text-[11px] font-semibold text-slate-400 uppercase">{label}</span><p className="text-[14px] text-slate-800 mt-1">{value}</p></div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
