import { Construction } from 'lucide-react'
import { useI18n } from '../i18n'

interface PlaceholderPageProps {
  title: string
  subtitle?: string
}

export default function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-orange-400" />
      </div>
      <h1 className="text-[22px] font-bold text-slate-900 tracking-tight mb-2">{title}</h1>
      <p className="text-[14px] text-slate-400 max-w-md">
        {subtitle || t.placeholder.comingSoon}
      </p>
    </div>
  )
}
