// ==================== Enums ====================

export type UserRole = 'Planner' | 'Driver' | 'Dispatcher' | 'Manager' | 'Admin'

export type RouteStatus = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled'

export type VehicleStatus = 'Available' | 'OnRoute' | 'Maintenance' | 'OutOfService'

export type OrderStatus = 'Pending' | 'Assigned' | 'InTransit' | 'Delivered' | 'Failed' | 'Cancelled'

export type OrderPriority = 'Normal' | 'Priority' | 'Urgent'

export type ProviderType = 'FTL' | 'LTL' | 'Express' | 'LastMile' | 'Intermodal'

export type ContractStatus = 'Active' | 'Expired' | 'Draft' | 'Suspended'

export type VehicleCategory = 'Tir' | 'Kamyon' | 'Kamyonet' | 'Frigorifik' | 'Tanker' | 'LowBed'

export type PricingUnit = 'kg' | 'm3' | 'pallet' | 'trip' | 'km'

export type OptimizationStatus = 'Idle' | 'Running' | 'Completed' | 'Failed'

export type NotificationType = 'Critical' | 'Warning' | 'Info' | 'Positive'

// ==================== Core Entities ====================

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId: string
}

export interface Vehicle {
  id: string
  plateNumber: string
  type: string
  capacity: number
  capacityUnit: string
  status: VehicleStatus
  currentDriverId?: string
  currentDriverName?: string
  lastLocation?: { lat: number; lng: number }
  fuelLevel?: number
  mileage?: number
}

export interface OrderLine {
  id: string
  orderId: string
  productCode: string
  productName: string
  quantity: number
  weightKg: number
  volumeM3: number
  palletCount: number
}

export interface Order {
  id: string
  orderNumber: string
  erpReferenceId: string
  customerName: string
  originCity: string
  originAddress?: string
  originLat?: number
  originLng?: number
  destinationCity: string
  destinationAddress?: string
  destinationLat?: number
  destinationLng?: number
  totalWeightKg: number
  totalVolumeM3: number
  palletCount: number
  productCategory: string
  isHazardous: boolean
  requiresColdChain: boolean
  status: OrderStatus
  priority: OrderPriority
  requestedDeliveryDate: string
  lines: OrderLine[]
  routeId?: string
  notes?: string
  createdAt: string
}

export interface Provider {
  id: string
  name: string
  code: string
  type: ProviderType
  isActive: boolean
  serviceRegions: string | string[]
  supportedVehicleTypes: string | string[]
  contracts: { id: string }[]
  contractCount?: number
  integrationMode?: 'ApiIntegrated' | 'SelfService' | 'Managed'
  apiBaseUrl?: string
  apiKey?: string
  email?: string
  phone?: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  city?: string
  taxNumber?: string
  address?: string
  tenantId?: string
  createdAt?: string
}

export interface ContractRate {
  id: string
  contractId: string
  originRegion: string
  destinationRegion: string
  vehicleCategory: VehicleCategory
  minWeightKg: number
  maxWeightKg: number
  pricePerUnit: number
  pricingUnit: PricingUnit
  currency: string
  urgentSurchargePercent?: number
  adrSurchargePercent?: number
  frigoSurchargePercent?: number
  weekendSurchargePercent?: number
}

export interface Contract {
  id: string
  providerId: string
  providerName?: string
  name?: string
  contractNumber: string
  startDate: string
  endDate: string
  status: ContractStatus
  notes?: string
  currency?: string
  rates: ContractRate[]
  tenantId?: string
  createdAt?: string
}

export interface ErpConnection {
  id: string
  name: string
  erpType: string
  apiEndpoint: string
  apiKey: string
  isActive: boolean
  lastSyncAt?: string
  lastSyncStatus?: 'Success' | 'Failed'
  syncedOrderCount?: number
}

export interface Route {
  id: string
  routeNo: string
  date: string
  vehicleId: string
  vehiclePlate: string
  driverId: string
  driverName: string
  status: RouteStatus
  totalDistance: number
  totalDuration: number
  orderCount: number
  completedCount: number
  startTime?: string
  endTime?: string
  estimatedEndTime?: string
  optimizationScore?: number
}

export interface RouteStop {
  id: string
  routeId: string
  orderId: string
  sequence: number
  customerName: string
  address: string
  lat: number
  lng: number
  estimatedArrival: string
  actualArrival?: string
  status: 'Pending' | 'Arrived' | 'Completed' | 'Skipped'
  distanceFromPrev: number
  durationFromPrev: number
}

export interface Depot {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  isDefault: boolean
}

export interface Zone {
  id: string
  name: string
  color: string
  polygon: { lat: number; lng: number }[]
  assignedVehicleIds: string[]
}

export interface Notification {
  id: string
  type: NotificationType
  message: string
  relatedEntityType?: string
  relatedEntityId?: string
  isRead: boolean
  createdAt: string
}

// ==================== Shipment ====================

export type ShipmentStatus = 'Draft' | 'Calculated' | 'PendingApproval' | 'Approved' | 'SentToProvider' | 'VehicleAssigned' | 'Loading' | 'InTransit' | 'Delivered' | 'Completed' | 'Cancelled'

export type ShipmentPriority = 'Normal' | 'Priority' | 'Urgent'

export interface ShipmentItem {
  id: string
  shipmentId: string
  productCode: string
  productName: string
  quantity: number
  weightKg: number
  volumeM3: number
  desiWeight: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
}

export interface ShipmentEvent {
  id: string
  shipmentId: string
  eventType: string
  status: ShipmentStatus
  description: string
  location?: string
  createdAt: string
  createdBy: string
}

export interface Recommendation {
  selectedProviderName: string
  calculatedPrice: number
  alternativeProvider1?: string
  alternativePrice1?: number
  alternativeProvider2?: string
  alternativePrice2?: number
  savingsAmount: number
  savingsPercent: number
  reason: string
  scorePrice: number
  scoreSpeed: number
  scoreReliability: number
  overallScore: number
  recommendedVehicle: string
  explanation: string
}

export interface Shipment {
  id: string
  shipmentNumber: string
  orderId?: string
  originAddress?: string | null
  originCity?: string | null
  destinationAddress?: string | null
  destinationCity?: string | null
  status: ShipmentStatus
  priority: ShipmentPriority
  totalWeightKg: number
  totalVolumeM3: number
  totalDesiWeight: number
  chargeableWeight: number
  palletCount: number
  isHazardous: boolean
  requiresColdChain: boolean
  isStackable?: boolean
  recommendedVehicle: VehicleCategory
  selectedProviderId?: string | null
  selectedProviderName?: string
  selectedContractRateId?: string | null
  providerIntegrationMode?: 'ApiIntegrated' | 'SelfService' | 'Managed'
  calculatedPrice?: number
  currency: string
  requestedPickupDate?: string
  requestedDeliveryDate?: string
  actualPickupDate?: string
  actualDeliveryDate?: string
  driverName?: string | null
  driverPhone?: string | null
  vehiclePlate?: string | null
  currentLatitude?: number | null
  currentLongitude?: number | null
  lastTrackingUpdate?: string | null
  estimatedArrival?: string | null
  notes?: string | null
  items: ShipmentItem[]
  events?: ShipmentEvent[]
  recommendation?: Recommendation | null
  createdAt: string
}

export interface CarrierOption {
  providerId: string
  providerName: string
  contractId: string
  vehicleCategory: VehicleCategory
  estimatedCost: number
  currency: string
  estimatedTransitDays: number
  score: number
  scorePrice: number
  scoreSpeed: number
  scoreReliability: number
  priceBreakdown: {
    baseCost: number
    surcharges: { label: string; amount: number }[]
  }
}

// ==================== Dashboard ====================

export interface DashboardKpi {
  label: string
  value: number | string
  change?: number
  changeLabel?: string
  color?: string
}

// ==================== Shared ====================

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  errors?: string[]
}

export interface SelectOption {
  value: string
  label: string
}
