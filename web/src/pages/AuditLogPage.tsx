import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { useI18n } from '../i18n'
import Badge from '../components/ui/Badge'

interface AuditEntry { id: string; user: string; action: string; entity: string; entityId: string; details: string; ipAddress: string; timestamp: string }

const mockEntries: AuditEntry[] = [
  { id: '1', user: 'Ahmet Yilmaz', action: 'Login', entity: 'Auth', entityId: '-', details: 'Basarili giris', ipAddress: '192.168.1.10', timestamp: '2024-03-15 14:30:22' },
  { id: '2', user: 'Mehmet Kaya', action: 'Create', entity: 'Shipment', entityId: 'SHP-0412', details: 'Yeni sevkiyat olusturuldu', ipAddress: '192.168.1.15', timestamp: '2024-03-15 14:28:10' },
  { id: '3', user: 'Sistem', action: 'Calculate', entity: 'Shipment', entityId: 'SHP-0412', details: 'Karar motoru calistirildi — Aras Kargo secildi', ipAddress: '-', timestamp: '2024-03-15 14:28:15' },
  { id: '4', user: 'Ayse Demir', action: 'Approve', entity: 'Shipment', entityId: 'SHP-0411', details: 'Sevkiyat onaylandi', ipAddress: '192.168.1.20', timestamp: '2024-03-15 13:45:30' },
  { id: '5', user: 'Ahmet Yilmaz', action: 'Update', entity: 'Contract', entityId: 'CNT-001', details: 'Tarife kalemi eklendi', ipAddress: '192.168.1.10', timestamp: '2024-03-15 12:20:00' },
  { id: '6', user: 'Sistem', action: 'Sync', entity: 'Order', entityId: '-', details: 'ERP senkronizasyonu: 42 siparis', ipAddress: '-', timestamp: '2024-03-15 09:00:00' },
  { id: '7', user: 'Fatma Ozturk', action: 'Verify', entity: 'Invoice', entityId: 'INV-0891', details: 'Fatura dogrulandi', ipAddress: '192.168.1.25', timestamp: '2024-03-14 16:30:00' },
]

const actionColors: Record<string, 'success' | 'info' | 'warning' | 'orange' | 'default'> = { Login: 'info', Create: 'success', Update: 'warning', Delete: 'error' as 'warning', Approve: 'success', Calculate: 'orange', Sync: 'info', Verify: 'success' }

export default function AuditLogPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const filtered = mockEntries.filter((e) => {
    const matchSearch = searchTerm === '' || e.user.toLowerCase().includes(searchTerm.toLowerCase()) || e.entity.toLowerCase().includes(searchTerm.toLowerCase()) || e.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchAction = actionFilter === 'all' || e.action === actionFilter
    return matchSearch && matchAction
  })

  return (
    <div className="space-y-6">
      <div><h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.auditLog.title}</h1><p className="text-[14px] text-slate-400 mt-1">{t.auditLog.subtitle}</p></div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" /></div>
        <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400/20 appearance-none"><option value="all">{t.common.all}</option><option value="Login">Login</option><option value="Create">Create</option><option value="Update">Update</option><option value="Approve">Approve</option><option value="Calculate">Calculate</option><option value="Sync">Sync</option><option value="Verify">Verify</option></select></div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
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
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3 text-[12px] text-slate-500 font-mono">{e.timestamp}</td>
                <td className="px-6 py-3 text-[13px] text-slate-700">{e.user}</td>
                <td className="px-6 py-3 text-center"><Badge variant={actionColors[e.action] || 'default'}>{e.action}</Badge></td>
                <td className="px-6 py-3"><span className="text-[13px] text-slate-700">{e.entity}</span>{e.entityId !== '-' && <span className="text-[11px] text-slate-400 ml-1">{e.entityId}</span>}</td>
                <td className="px-6 py-3 text-[12px] text-slate-500 max-w-[250px] truncate">{e.details}</td>
                <td className="px-6 py-3 text-center text-[11px] text-slate-400 font-mono">{e.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
