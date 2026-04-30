import { AlertTriangle, X } from 'lucide-react'
import { useI18n } from '../../i18n'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useI18n()

  if (!isOpen) return null

  const variantStyles = {
    danger: { icon: 'bg-red-100 text-red-600', button: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: 'bg-amber-100 text-amber-600', button: 'bg-amber-600 hover:bg-amber-700' },
    info: { icon: 'bg-blue-100 text-blue-600', button: 'bg-blue-600 hover:bg-blue-700' },
  }

  const style = variantStyles[variant]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 max-w-md w-full p-6">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl ${style.icon} flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-slate-800">{title}</h3>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {cancelLabel || t.common.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-white text-[13px] font-medium ${style.button} disabled:opacity-50 transition-colors`}
            >
              {confirmLabel || t.common.confirm}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
