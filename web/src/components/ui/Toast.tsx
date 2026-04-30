import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  title: string
  message?: string
}

let toastId = 0
let addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null

export function toast(type: ToastType, title: string, message?: string) {
  addToastFn?.({ type, title, message })
}

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' },
  error: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
  warning: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-200' },
  info: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' },
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (t) => {
      const id = ++toastId
      setToasts(prev => [...prev, { ...t, id }])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000)
    }
    return () => { addToastFn = null }
  }, [])

  const remove = (id: number) => setToasts(prev => prev.filter(x => x.id !== id))

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm">
      {toasts.map(t => {
        const Icon = ICONS[t.type]
        const style = STYLES[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl shadow-slate-200/50 ${style.bg} ${style.border} animate-[slideIn_0.3s_ease-out]`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800">{t.title}</p>
              {t.message && <p className="text-[12px] text-slate-500 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
