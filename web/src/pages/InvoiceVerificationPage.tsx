import { FileText, Upload, Search } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'

interface InvoiceRow { id: string; invoiceNo: string; carrier: string; invoiceDate: string; invoiceAmount: number; calculatedAmount: number; status: 'Verified' | 'Pending' | 'Disputed' }

const mockInvoices: InvoiceRow[] = [
  { id: '1', invoiceNo: 'INV-2024-0891', carrier: 'Aras Kargo', invoiceDate: '2024-03-15', invoiceAmount: 8450, calculatedAmount: 8450, status: 'Verified' },
  { id: '2', invoiceNo: 'INV-2024-0892', carrier: 'MNG Kargo', invoiceDate: '2024-03-15', invoiceAmount: 3450, calculatedAmount: 3200, status: 'Disputed' },
  { id: '3', invoiceNo: 'INV-2024-0893', carrier: 'Yurtici Kargo', invoiceDate: '2024-03-14', invoiceAmount: 1800, calculatedAmount: 1800, status: 'Verified' },
  { id: '4', invoiceNo: 'INV-2024-0894', carrier: 'Aras Kargo', invoiceDate: '2024-03-14', invoiceAmount: 12800, calculatedAmount: 12600, status: 'Pending' },
  { id: '5', invoiceNo: 'INV-2024-0895', carrier: 'PTT Kargo', invoiceDate: '2024-03-13', invoiceAmount: 4200, calculatedAmount: 4200, status: 'Verified' },
]

const statusVariant: Record<string, 'success' | 'warning' | 'error'> = { Verified: 'success', Pending: 'warning', Disputed: 'error' }

export default function InvoiceVerificationPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const statusLabels: Record<string, string> = { Verified: t.invoice.verified, Pending: t.invoice.pending, Disputed: t.invoice.disputed }
  const filtered = mockInvoices.filter((inv) => searchTerm === '' || inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || inv.carrier.toLowerCase().includes(searchTerm.toLowerCase()))
  const totalDiff = mockInvoices.reduce((sum, inv) => sum + (inv.invoiceAmount - inv.calculatedAmount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.invoice.title}</h1><p className="text-[14px] text-slate-400 mt-1">{t.invoice.subtitle}</p></div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"><Upload className="w-4 h-4" /> {t.invoice.newInvoice}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.invoice.totalInvoices} value={String(mockInvoices.length)} change={3} icon={FileText} color="text-blue-600 bg-blue-50" />
        <StatCard label={t.invoice.pendingVerification} value={String(mockInvoices.filter(i => i.status === 'Pending').length)} change={-1} icon={FileText} color="text-amber-600 bg-amber-50" />
        <StatCard label={t.invoice.totalDifference} value={`${totalDiff.toLocaleString()} TL`} change={-5} icon={FileText} color="text-red-600 bg-red-50" />
        <StatCard label={t.invoice.verifiedAmount} value={`${mockInvoices.filter(i => i.status === 'Verified').reduce((s, i) => s + i.invoiceAmount, 0).toLocaleString()} TL`} change={8} icon={FileText} color="text-green-600 bg-green-50" />
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" /></div>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.invoiceNo}</th>
            <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.carrier}</th>
            <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.invoiceDate}</th>
            <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.invoiceAmount}</th>
            <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.calculatedAmount}</th>
            <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.invoice.difference}</th>
            <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
          </tr></thead>
          <tbody>
            {filtered.map((inv) => { const diff = inv.invoiceAmount - inv.calculatedAmount; return (
              <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{inv.invoiceNo}</td>
                <td className="px-6 py-3.5 text-[13px] text-slate-700">{inv.carrier}</td>
                <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{inv.invoiceDate}</td>
                <td className="px-6 py-3.5 text-right text-[13px] text-slate-800">{inv.invoiceAmount.toLocaleString()} TL</td>
                <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{inv.calculatedAmount.toLocaleString()} TL</td>
                <td className="px-6 py-3.5 text-right text-[13px]"><span className={diff === 0 ? 'text-green-600' : 'text-red-600'}>{diff === 0 ? '—' : `+${diff.toLocaleString()} TL`}</span></td>
                <td className="px-6 py-3.5 text-center"><Badge variant={statusVariant[inv.status]}>{statusLabels[inv.status]}</Badge></td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}
