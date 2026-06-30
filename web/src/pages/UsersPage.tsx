import { useState } from 'react'
import { Users, Plus, Search, Power, Loader2 } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Drawer from '../components/ui/Drawer'
import api from '../api/client'
import { useApi } from '../utils/useApi'
import type { ApiResponse } from '../types'

interface UserRow {
  id: string
  firstName: string
  lastName: string
  email: string
  roleId?: string
  role?: { id: string; name: string }
  isActive: boolean
  lastLoginAt?: string
}

export default function UsersPage() {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'OperationsSpecialist' })

  const { data: usersData, isLoading, refetch } = useApi(
    () => api.get<ApiResponse<UserRow[]>>('/users').then(r => r.data),
    [],
  )
  const allUsers: UserRow[] = (usersData as UserRow[] | null) || []

  const filtered = allUsers.filter((u) =>
    searchTerm === '' ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggle = (user: UserRow) => {
    const updated = { ...user, isActive: !user.isActive }
    api.put(`/users/${user.id}`, updated).then(() => refetch()).catch(() => {})
  }

  const handleSave = () => {
    setSaving(true)
    api.post('/auth/register', {
      email: formData.email,
      password: formData.password || 'Temp1234!',
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
    }).then(() => {
      setDrawerOpen(false)
      refetch()
    }).catch(() => {}).finally(() => setSaving(false))
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 bg-white'

  const getRoleName = (user: UserRow): string => {
    if (user.role?.name) return user.role.name
    return '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.users.title}</h1><p className="text-[14px] text-slate-400 mt-1">{t.users.subtitle}</p></div>
        <button onClick={() => { setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'OperationsSpecialist' }); setDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-400/10 transition-all"><Plus className="w-4 h-4" /> {t.users.newUser}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label={t.users.totalUsers} value={String(allUsers.length)} change={0} icon={Users} color="text-blue-600 bg-blue-50" />
        <StatCard label={t.users.activeUsers} value={String(allUsers.filter(u => u.isActive).length)} change={0} icon={Users} color="text-green-600 bg-green-50" />
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`${t.common.search}...`} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400" /></div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : (
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
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[13px] text-slate-400">{t.common.noData}</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{u.firstName} {u.lastName}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{u.email}</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant="info">{getRoleName(u)}</Badge></td>
                  <td className="px-6 py-3.5 text-center text-[12px] text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('tr-TR') : '—'}</td>
                  <td className="px-6 py-3.5 text-center"><Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? t.common.active : t.common.inactive}</Badge></td>
                  <td className="px-6 py-3.5 text-center"><button onClick={() => handleToggle(u)} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}><Power className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={t.users.newUser} footer={<div className="flex justify-end gap-3"><button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{t.common.cancel}</button><button onClick={handleSave} disabled={saving || !formData.email || !formData.firstName} className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[13px] font-semibold disabled:opacity-50">{saving ? t.common.loading : t.common.save}</button></div>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.users.firstName}</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.users.lastName}</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputClass} /></div>
          </div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.common.email}</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.login.password}</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputClass} placeholder="Min 8 karakter" /></div>
          <div><label className="block text-[13px] font-semibold text-slate-700 mb-2">{t.users.role}</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={inputClass}><option value="Admin">Admin</option><option value="Executive">Executive</option><option value="LogisticsManager">Logistics Manager</option><option value="OperationsSpecialist">Operations Specialist</option><option value="Finance">Finance</option></select></div>
        </div>
      </Drawer>
    </div>
  )
}
