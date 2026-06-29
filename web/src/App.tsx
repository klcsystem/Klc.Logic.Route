import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import ContractsPage from './pages/ContractsPage'
import ProvidersPage from './pages/ProvidersPage'
import OnboardingWizard from './pages/OnboardingWizard'
import ShipmentsPage from './pages/ShipmentsPage'
import ShipmentDetailPage from './pages/ShipmentDetailPage'
import RouteOptimizationPage from './pages/RouteOptimizationPage'
import ReportsPage from './pages/ReportsPage'
import CO2Page from './pages/CO2Page'
import CarrierScorecardPage from './pages/CarrierScorecardPage'
import MarketIntelligencePage from './pages/MarketIntelligencePage'
import NotificationsPage from './pages/NotificationsPage'
import LiveTrackingPage from './pages/LiveTrackingPage'
import UsersPage from './pages/UsersPage'
import RoutingRulesPage from './pages/RoutingRulesPage'
import SettingsPage from './pages/SettingsPage'
import InvoiceVerificationPage from './pages/InvoiceVerificationPage'
import AuditLogPage from './pages/AuditLogPage'
import ErpConnectionPage from './pages/settings/ErpConnectionPage'
import FleetPage from './pages/FleetPage'
import ProviderPortalPage from './pages/ProviderPortalPage'
import LoginPage from './pages/auth/LoginPage'
import LandingPage from './pages/LandingPage'
import CustomerTrackingPage from './pages/public/CustomerTrackingPage'
import RouteOptimizerPage from './pages/RouteOptimizerPage'
import MLInsightsPage from './pages/MLInsightsPage'
import DigitalTwinPage from './pages/DigitalTwinPage'
import PlannedVsActualPage from './pages/PlannedVsActualPage'
import DeliverySlotsPage from './pages/DeliverySlotsPage'
import TerritoryPlanningPage from './pages/TerritoryPlanningPage'
import RecurringRoutesPage from './pages/RecurringRoutesPage'
import DemandForecastPage from './pages/DemandForecastPage'
import SustainabilityPage from './pages/SustainabilityPage'
import SafetyDashboardPage from './pages/SafetyDashboardPage'
import InsurancePage from './pages/InsurancePage'
import MarketplacePage from './pages/MarketplacePage'
import FeedbackPage from './pages/FeedbackPage'
import ReturnsPage from './pages/ReturnsPage'
import LearningPage from './pages/LearningPage'
import PipelinePage from './pages/PipelinePage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tracking/:token" element={<CustomerTrackingPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />

      {/* Protected Main Layout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        {/* OPERASYONLAR */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="/tracking" element={<LiveTrackingPage />} />
        <Route path="/delivery-slots" element={<DeliverySlotsPage />} />

        {/* KARAR MOTORU */}
        <Route path="/route-optimization" element={<RouteOptimizationPage />} />
        <Route path="/route-optimizer" element={<RouteOptimizerPage />} />
        <Route path="/route-optimization/:id/planned-vs-actual" element={<PlannedVsActualPage />} />
        <Route path="/carriers" element={<ProvidersPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/rules" element={<RoutingRulesPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/territory-planning" element={<TerritoryPlanningPage />} />
        <Route path="/recurring-routes" element={<RecurringRoutesPage />} />

        {/* ANALITIK */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/carrier-scorecard" element={<CarrierScorecardPage />} />
        <Route path="/market-intelligence" element={<MarketIntelligencePage />} />
        <Route path="/co2" element={<CO2Page />} />
        <Route path="/ml-insights" element={<MLInsightsPage />} />
        <Route path="/digital-twin" element={<DigitalTwinPage />} />
        <Route path="/demand-forecast" element={<DemandForecastPage />} />
        <Route path="/sustainability" element={<SustainabilityPage />} />
        <Route path="/safety" element={<SafetyDashboardPage />} />

        {/* PLATFORM */}
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/returns" element={<ReturnsPage />} />

        {/* YONETIM */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/erp" element={<ErpConnectionPage />} />
        <Route path="/invoices" element={<InvoiceVerificationPage />} />
        <Route path="/audit-logs" element={<AuditLogPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />

        {/* PROVIDER PORTAL */}
        <Route path="/provider-portal" element={<ProviderPortalPage />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
