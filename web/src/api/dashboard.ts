import api from './client'
import type { ApiResponse } from '../types'

export interface DashboardSummary {
  totalOrders: number
  pendingOrders: number
  totalShipments: number
  inTransitShipments: number
  deliveredShipments: number
  activeProviders: number
  activeContracts: number
  totalCostThisMonth: number
  averageDeliveryHours: number
}

export interface MonthlyCostSummary {
  month: number
  totalCost: number
  shipmentCount: number
}

export interface ProviderCostSummary {
  providerId: string
  providerName: string
  totalCost: number
  shipmentCount: number
}

export const dashboardApi = {
  getSummary: () =>
    api.get<ApiResponse<DashboardSummary>>('/dashboard/summary').then(r => r.data),

  getMonthlyCosts: (year?: number) =>
    api.get<ApiResponse<MonthlyCostSummary[]>>('/dashboard/monthly-costs', { params: { year } }).then(r => r.data),

  getProviderCosts: (year?: number, month?: number) =>
    api.get<ApiResponse<ProviderCostSummary[]>>('/dashboard/provider-costs', { params: { year, month } }).then(r => r.data),
}
