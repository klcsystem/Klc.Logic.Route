import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Truck, MapPin, Route, Building2,
  FileText, Settings2, BarChart3, Star, TrendingUp, Leaf,
  Settings, Users, Bell, ChevronDown, ChevronRight,
  Navigation, ShoppingCart, Car, User, Send, TableProperties,
} from 'lucide-react'
import { useI18n } from '../../i18n'
import { useAuth } from '../../contexts/AuthContext'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  badge?: number
}

interface NavGroup {
  label: string
  icon: React.ElementType
  items: NavItem[]
}

function CollapsibleGroup({ group, defaultOpen }: { group: NavGroup; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen || false)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-blue-300/50 hover:text-blue-200/70 transition-colors"
      >
        <span>{group.label}</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 mb-3">
          {group.items.map(({ to, icon: ItemIcon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-[13px] transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-400/15 text-orange-400 font-medium'
                    : 'text-blue-100/60 hover:bg-white/5 hover:text-blue-100/90'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <ItemIcon className="w-[16px] h-[16px]" />
                {label}
              </div>
              {badge !== undefined && badge > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center">{badge}</span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Provider User Sidebar (tamamen farklı menü) ──
function ProviderSidebar() {
  const providerGroups: NavGroup[] = [
    {
      label: 'Siparişler',
      icon: ShoppingCart,
      items: [
        { to: '/provider-portal', icon: ShoppingCart, label: 'Gelen Siparişler', badge: 4 },
        { to: '/provider-portal/tariffs', icon: TableProperties, label: 'Tarife Tablosu' },
      ],
    },
    {
      label: 'Filom',
      icon: Truck,
      items: [
        { to: '/provider-portal/vehicles', icon: Car, label: 'Araçlarım' },
        { to: '/provider-portal/drivers', icon: User, label: 'Şoförlerim' },
      ],
    },
    {
      label: 'Operasyon',
      icon: Send,
      items: [
        { to: '/provider-portal/shipments', icon: Send, label: 'Sevkiyatlarım' },
        { to: '/provider-portal/tracking', icon: MapPin, label: 'Araç Takip' },
      ],
    },
    {
      label: 'Yönetim',
      icon: Settings,
      items: [
        { to: '/provider-portal/users', icon: Users, label: 'Kullanıcılar' },
        { to: '/provider-portal/settings', icon: Settings, label: 'Ayarlar' },
      ],
    },
  ]

  return (
    <>
      {/* Provider Dashboard */}
      <div className="px-3 pb-2 space-y-0.5">
        <NavLink
          to="/provider-portal"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-400/10'
                : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-[18px] h-[18px]" />
          Kontrol Paneli
        </NavLink>
      </div>

      {/* Divider */}
      <div className="px-5 py-2">
        <div className="border-t border-white/[0.06]" />
      </div>

      {/* Provider Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {providerGroups.map((group, i) => (
          <CollapsibleGroup key={group.label} group={group} defaultOpen={i < 3} />
        ))}
      </nav>
    </>
  )
}

// ── Customer Sidebar (mevcut tam menü) ──
function CustomerSidebar() {
  const { t } = useI18n()

  const navGroups: NavGroup[] = [
    {
      label: t.sidebar.operations,
      icon: Package,
      items: [
        { to: '/orders', icon: Package, label: t.sidebar.orders },
        { to: '/shipments', icon: Truck, label: t.sidebar.shipments },
        { to: '/tracking', icon: MapPin, label: t.sidebar.liveTracking },
      ],
    },
    {
      label: t.sidebar.decisionEngine,
      icon: Route,
      items: [
        { to: '/route-optimization', icon: Route, label: t.sidebar.routeOptimization },
        { to: '/carriers', icon: Building2, label: t.sidebar.carriers },
        { to: '/contracts', icon: FileText, label: t.sidebar.contracts },
        { to: '/rules', icon: Settings2, label: t.sidebar.rules },
        { to: '/fleet', icon: Truck, label: 'Filo Yönetimi' },
      ],
    },
    {
      label: t.sidebar.analytics,
      icon: BarChart3,
      items: [
        { to: '/reports', icon: BarChart3, label: t.sidebar.reports },
        { to: '/carrier-scorecard', icon: Star, label: t.sidebar.carrierScorecard },
        { to: '/market-intelligence', icon: TrendingUp, label: t.sidebar.marketIntelligence },
        { to: '/co2', icon: Leaf, label: t.sidebar.co2Report },
      ],
    },
    {
      label: t.sidebar.management,
      icon: Settings,
      items: [
        { to: '/settings', icon: Settings, label: t.sidebar.settings },
        { to: '/users', icon: Users, label: t.sidebar.users },
        { to: '/notifications', icon: Bell, label: t.sidebar.notifications },
      ],
    },
  ]

  return (
    <>
      {/* Dashboard */}
      <div className="px-3 pb-2 space-y-0.5">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-400/10'
                : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-[18px] h-[18px]" />
          Dashboard
        </NavLink>
      </div>

      {/* Divider */}
      <div className="px-5 py-2">
        <div className="border-t border-white/[0.06]" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navGroups.map((group, i) => (
          <CollapsibleGroup key={group.label} group={group} defaultOpen={i === 0} />
        ))}
      </nav>
    </>
  )
}

// ── Main Sidebar ──
export default function Sidebar() {
  const { user } = useAuth()
  const isProvider = user?.role === 'ProviderUser'

  return (
    <aside className="w-[260px] bg-[#111827] text-white min-h-screen flex flex-col border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/10">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-white">Logic.Route</h1>
            <p className="text-[10px] text-blue-300/40 uppercase tracking-[0.15em]">
              {isProvider ? 'Taşıyıcı Portalı' : 'Rota Optimizasyonu'}
            </p>
          </div>
        </div>
      </div>

      {/* Rol bazlı sidebar */}
      {isProvider ? <ProviderSidebar /> : <CustomerSidebar />}

      {/* Bottom — Rol göstergesi */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isProvider ? 'bg-blue-400' : 'bg-green-400'}`} />
          <span className="text-[11px] text-blue-300/40">
            {isProvider ? 'Taşıyıcı Hesabı' : 'Müşteri Hesabı'}
          </span>
        </div>
      </div>
    </aside>
  )
}
