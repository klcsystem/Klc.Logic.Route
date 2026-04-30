import { useState } from 'react'
import { Users, Plus, Search, Power } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'

interface UserRow { id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean; lastLogin?: string }

const mockUsers: UserRow[] = [
  { id: '1', firstName: 'Ahmet', lastName: 'Yilmaz', email: 'ahmet@klcsystem.com', role: 'Admin', isActive: true, lastLogin: '2024-03-15 14:30' },
  { id: '2', firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet@klcsystem.com', role: 'LogisticsManager', isActive: true, lastLogin: '2024-03-15 12:00' },
  { id: '3', firstName: 'Ayse', lastName: 'Demir', email: 'ayse@klcsystem.com', role: 'OperationsSpecialist', isActive: true, lastLogin: '2024-03-15 11:45' },
  { id: '4', firstName: 'Fatma', lastName: 'Ozturk', email: 'fatma@klcsystem.com', role: 'Finance', isActive: true, lastLogin: '2024-03-14 16:00' },
  { id: '5', firstName: 'Ali', lastName: 'Celik', email: 'ali@klcsystem.com', role: 'OperationsSpecialist', isActive: false, lastLogin: '2024-02-28 09:00' },
]

export default function UsersPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState(mockUsers)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', role: 'OperationsSpecialist' })

  const filtered = users.filter((u) => searchTerm === '' || `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  const handleToggle = (id: string) => setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u))
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.users.title}</h1><p className="text-[14px] text-slate-400 mt-1">{t.users.subtitle}</p></div>
        <button onClick={() => { setFormData({ firstName: '', lastName: '', email: '', role: 'OperationsSpecialist' }); setDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"><Plus className="w-4 h-4" /> {t.users.newUser}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label={t.users.totalUsers} value={String(users.length)} change={2} icon={Users} color="text-blue-600 bg-blue-50" />
        <StatCard label={t.users.activeUsers} value={String(users.filter(u => u.isActive).length)} change={0} icon={Users} color="text-green-600 bg-green-50" />
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" /></div>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.name}</th>
            <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.email}</th>
            <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.users.role}</th>
            <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.users.lastLogin}</th>
            <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.status}</th>
            <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.common.actions}</th>
          </tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{u.firstName} {u.lastName}</td>
                <td className="px-6 py-3.5 text-[13px] text-slate-600">{u.email}</td>
                <td className="px-6 py-3.5 text-center"><Badge variant="info">{u.role}</Badge></td>
                <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{u.lastLogin || '—'}</td>
                <td className="px-6 py-3.5 text-center"><Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? t.common.active : t.common.inactive}</Badge></td>
                <td className="px-6 py-3.5 text-center"><button onClick={() => handleToggle(u.id)} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}><Power className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={t.users.newUser} footer={<div className="flex justify-end gap-3"><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button><button className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold">{t.common.save}</button></div>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.users.firstName}</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.users.lastName}</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.common.email}</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.users.role}</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={inputClass}><option value="Admin">Admin</option><option value="Executive">Executive</option><option value="LogisticsManager">Logistics Manager</option><option value="OperationsSpecialist">Operations Specialist</option><option value="Finance">Finance</option></select></div>
        </div>
      </Drawer>
    </div>
  )
}
