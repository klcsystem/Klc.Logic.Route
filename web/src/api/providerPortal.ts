import api from './client'
import type { ApiResponse } from '../types'

export interface PortalOrder {
  id: string
  number: string
  route: string
  weight: string
  vehicleType: string
  customer: string
  requestDate: string
  status: string
}

export interface PortalVehicle {
  id: string
  plate: string
  type: string
  body: string
  tonnage: number
  insuranceEnd: string
}

export interface PortalDriver {
  id: string
  name: string
  phone: string
  licenseNo: string
  licenseEnd: string
}

export interface PortalShipment {
  id: string
  number: string
  route: string
  weight: string
  vehicle: string
  assignedDate: string
  status: string
  driverName: string | null
  plate: string | null
}

export interface PortalStats {
  activeShipmentCount: number
  pendingBidCount: number
  onTimeDeliveryRate: number
  monthlyRevenue: number
  totalShipments: number
  avgDeliveryHours: number
}

export interface TariffRow {
  id?: string
  kmFrom: number
  kmTo: number
  price: number
}

export interface PortalUser {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export const providerPortalApi = {
  // Stats
  getStats: () =>
    api.get<ApiResponse<PortalStats>>('/provider-portal/stats').then(r => r.data),

  // Orders
  getOrders: () =>
    api.get<ApiResponse<PortalOrder[]>>('/provider-portal/orders').then(r => r.data),

  submitBid: (orderId: string, data: { price: number; estimatedHours: number; vehicleType: string; note?: string }) =>
    api.post<ApiResponse<void>>(`/provider-portal/orders/${orderId}/bid`, data).then(r => r.data),

  // Tariff
  getTariff: (vehicleType?: string) =>
    api.get<ApiResponse<TariffRow[]>>('/provider-portal/tariff', { params: { vehicleType } }).then(r => r.data),

  saveTariff: (vehicleType: string, rows: TariffRow[]) =>
    api.put<ApiResponse<void>>('/provider-portal/tariff', { vehicleType, rows }).then(r => r.data),

  // Vehicles
  getVehicles: () =>
    api.get<ApiResponse<PortalVehicle[]>>('/provider-portal/vehicles').then(r => r.data),

  createVehicle: (data: Partial<PortalVehicle>) =>
    api.post<ApiResponse<PortalVehicle>>('/provider-portal/vehicles', data).then(r => r.data),

  updateVehicle: (id: string, data: Partial<PortalVehicle>) =>
    api.put<ApiResponse<PortalVehicle>>(`/provider-portal/vehicles/${id}`, data).then(r => r.data),

  deleteVehicle: (id: string) =>
    api.delete(`/provider-portal/vehicles/${id}`).then(r => r.data),

  // Drivers
  getDrivers: () =>
    api.get<ApiResponse<PortalDriver[]>>('/provider-portal/drivers').then(r => r.data),

  createDriver: (data: Partial<PortalDriver>) =>
    api.post<ApiResponse<PortalDriver>>('/provider-portal/drivers', data).then(r => r.data),

  updateDriver: (id: string, data: Partial<PortalDriver>) =>
    api.put<ApiResponse<PortalDriver>>(`/provider-portal/drivers/${id}`, data).then(r => r.data),

  deleteDriver: (id: string) =>
    api.delete(`/provider-portal/drivers/${id}`).then(r => r.data),

  // Shipments
  getShipments: () =>
    api.get<ApiResponse<PortalShipment[]>>('/provider-portal/shipments').then(r => r.data),

  updateShipmentStatus: (id: string, data: { status: string; note?: string; latitude?: number; longitude?: number }) =>
    api.put<ApiResponse<void>>(`/provider-portal/shipments/${id}/status`, data).then(r => r.data),

  // Users
  getUsers: () =>
    api.get<ApiResponse<PortalUser[]>>('/provider-portal/users').then(r => r.data),

  createUser: (data: Partial<PortalUser>) =>
    api.post<ApiResponse<PortalUser>>('/provider-portal/users', data).then(r => r.data),

  updateUser: (id: string, data: Partial<PortalUser>) =>
    api.put<ApiResponse<PortalUser>>(`/provider-portal/users/${id}`, data).then(r => r.data),

  deleteUser: (id: string) =>
    api.delete(`/provider-portal/users/${id}`).then(r => r.data),
}
