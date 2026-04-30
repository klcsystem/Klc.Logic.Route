import { Link, Navigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../i18n'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const allowed = user.role === 'Admin' || allowedRoles.includes(user.role)
  if (!allowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <ShieldOff className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            {t.roleProtected.forbiddenTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{t.roleProtected.forbiddenBody}</p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            {t.roleProtected.backHome}
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
