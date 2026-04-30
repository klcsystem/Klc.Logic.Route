import { TrendingUp, BarChart3 } from 'lucide-react'
import { useI18n } from '../i18n'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'

const mockData = [
  { route: 'Istanbul → Ankara', avgMarket: 8200, ourCost: 7800, saving: 4.9, volume: 'Yuksek' },
  { route: 'Istanbul → Izmir', avgMarket: 6500, ourCost: 6100, saving: 6.2, volume: 'Orta' },
  { route: 'Istanbul → Bursa', avgMarket: 3800, ourCost: 3200, saving: 15.8, volume: 'Yuksek' },
  { route: 'Ankara → Izmir', avgMarket: 7100, ourCost: 7400, saving: -4.2, volume: 'Dusuk' },
  { route: 'Istanbul → Trabzon', avgMarket: 9500, ourCost: 9200, saving: 3.2, volume: 'Dusuk' },
]

export default function MarketIntelligencePage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div><h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{t.sidebar.marketIntelligence}</h1><p className="text-[14px] text-slate-400 mt-1">Lojistik pazar analizi ve rekabet karsilastirmasi</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pazar Ort. Maliyet" value="7,420 TL" change={-3} icon={BarChart3} color="text-blue-600 bg-blue-50" />
        <StatCard label="Bizim Ort. Maliyet" value="6,740 TL" change={-5} icon={TrendingUp} color="text-green-600 bg-green-50" />
        <StatCard label="Tasarruf Orani" value="9.2%" change={2} icon={TrendingUp} color="text-orange-600 bg-orange-50" />
        <StatCard label="Analiz Edilen Rota" value="24" change={4} icon={BarChart3} color="text-purple-600 bg-purple-50" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-[15px] font-semibold text-slate-800">Rota Bazli Pazar Karsilastirmasi</h3></div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">
            <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rota</th>
            <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pazar Ort.</th>
            <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bizim Maliyet</th>
            <th className="text-right px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fark</th>
            <th className="text-center px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hacim</th>
          </tr></thead>
          <tbody>
            {mockData.map((d) => (
              <tr key={d.route} className="border-b border-slate-50">
                <td className="px-6 py-3.5 text-[13px] font-medium text-slate-800">{d.route}</td>
                <td className="px-6 py-3.5 text-right text-[13px] text-slate-600">{d.avgMarket.toLocaleString()} TL</td>
                <td className="px-6 py-3.5 text-right text-[13px] font-medium text-slate-800">{d.ourCost.toLocaleString()} TL</td>
                <td className="px-6 py-3.5 text-right text-[13px]"><span className={d.saving >= 0 ? 'text-green-600' : 'text-red-600'}>{d.saving > 0 ? '-' : '+'}{Math.abs(d.saving)}%</span></td>
                <td className="px-6 py-3.5 text-center"><Badge variant={d.volume === 'Yuksek' ? 'success' : d.volume === 'Orta' ? 'warning' : 'default'}>{d.volume}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
