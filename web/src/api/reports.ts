import api from './client'
import type { ApiResponse } from '../types'

export interface CarrierPerformance {
  id: string
  providerId: string
  providerName: string
  period: number
  year: number
  month: number
  totalShipments: number
  onTimeDeliveries: number
  lateDeliveries: number
  damagedShipments: number
  cancelledShipments: number
  onTimePercentage: number
  averageDeliveryHours: number
  totalCost: number
  averageCostPerKg: number
  co2TotalKg: number
  overallScore: number
  calculatedAt: string
}

export interface OtifReport {
  totalDelivered: number
  onTimePercent: number
  inFullPercent: number
  otifPercent: number
  lateCount: number
  byDestination: { city: string; total: number; otifPercent: number }[]
  byMonth: { period: string; total: number; otifPercent: number }[]
}

export const reportsApi = {
  getCarrierPerformance: (year?: number, month?: number) =>
    api.get<ApiResponse<CarrierPerformance[]>>('/reports/carrier-performance', { params: { year, month } }).then(r => r.data),

  getCarrierPerformanceByProvider: (providerId: string, year: number, month: number) =>
    api.get<ApiResponse<CarrierPerformance>>(`/reports/carrier-performance/${providerId}`, { params: { year, month } }).then(r => r.data),

  getOtif: () => api.get<ApiResponse<OtifReport>>('/reports/otif').then(r => r.data),
}
