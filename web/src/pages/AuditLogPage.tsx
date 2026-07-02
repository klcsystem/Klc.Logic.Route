import { useState } from 'react'
import { Search, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'
import api from '../api/client'
import { useApi } from '../utils/useApi'

interface AuditEntry {
  id: string
  userId?: string
  userName?: string
  user?: string
  action: string
  entityType?: string
  entity?: string
  entityId?: string
  details?: string
  description?: string
  ipAddress?: string
  createdAt?: string
  timestamp?: string
}

interface AuditResult {
  items: AuditEntry[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const actionColors: Record<string, 'success' | 'info' | 'warning' | 'orange' | 'default' | 'error'> = {
  Login: 'info',
  Create: 'success',
  Update: 'warning',
  Delete: 'error',
  Approve: 'success',
  Calculate: 'orange',
  Sync: 'info',
  Verify: 'success',
}

export default function AuditLogPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const { data: auditData, isLoading } = useApi(
    () => api.get('/audit', { params: { search: searchTerm || undefined, action: actionFilter !== 'all' ? actionFilter : undefined, page, pageSize } }).then(r => r.data),
    [searchTerm, actionFilter, page],
  )

  const auditResult = auditData as unknown as AuditResult | null
  const entries: AuditEntry[] = auditResult?.items || (Array.isArray(auditData) ? auditData as unknown as AuditEntry[] : [])
  const totalCount = auditResult?.totalCount || entries.length
  const totalPages = auditResult?.totalPages || Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.auditLog.title}</h1>
        <p className="text-[14px] text-slate-400 mt-1">{t.auditLog.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }} className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 appearance-none">
            <option value="all">{t.common.all}</option>
            <option value="Login">Login</option>
            <option value="Create">Create</option>
            <option value="Update">Update</option>
            <option value="Delete">Delete</option>
            <option value="Approve">Approve</option>
            <option value="Calculate">Calculate</option>
            <option value="Sync">Sync</option>
            <option value="Verify">Verify</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.auditLog.timestamp}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.auditLog.user}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.auditLog.action}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.auditLog.entity}</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.auditLog.details}</th>
              <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.auditLog.ipAddress}</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-orange-400 mx-auto" /></td></tr>}
              {!isLoading && entries.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 text-[12px] text-slate-500 font-mono">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString('tr-TR') : e.timestamp || '--'}
                  </td>
                  <td className="px-6 py-3 text-[13px] text-slate-700">{e.userName || e.user || '--'}</td>
                  <td className="px-6 py-3 text-center"><Badge variant={actionColors[e.action] || 'default'}>{e.action}</Badge></td>
                  <td className="px-6 py-3">
                    <span className="text-[13px] text-slate-700">{e.entityType || e.entity || '--'}</span>
                    {e.entityId && e.entityId !== '-' && <span className="text-[11px] text-slate-400 ml-1">{e.entityId}</span>}
                  </td>
                  <td className="px-6 py-3 text-[12px] text-slate-500 max-w-[250px] truncate">{e.details || e.description || '--'}</td>
                  <td className="px-6 py-3 text-center text-[11px] text-slate-400 font-mono">{e.ipAddress || '--'}</td>
                </tr>
              ))}
              {!isLoading && entries.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-[14px] text-slate-400">{t.common.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-slate-500">
            Toplam {totalCount} kayıt - Sayfa {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
