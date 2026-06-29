import api from './client'
import type { ApiResponse } from '../types'

export interface VehicleEmission {
  vehicleType: string
  emissionFactorKgPerKm: number
  totalDistanceKm: number
  totalEmissionsKg: number
  emissionsSavedKg: number
  routeCount: number
}

export interface CarbonReport {
  period: string
  year: number
  month: number | null
  totalNaiveDistanceKm: number
  totalOptimizedDistanceKm: number
  distanceSavedKm: number
  totalEmissionsKg: number
  emissionsSavedKg: number
  carbonCreditTons: number
  carbonCreditValueEur: number
  marketPricePerTon: number
  byVehicleType: VehicleEmission[]
  totalRoutes: number
}

export interface MonthlySummary {
  month: number
  emissionsKg: number
  savingsKg: number
  routeCount: number
}

export interface EsgReport {
  year: number
  totalEmissionsKg: number
  totalSavingsKg: number
  savingsPercent: number
  fleetEfficiencyScore: number
  carbonCreditTons: number
  carbonCreditValueEur: number
  monthlyBreakdown: MonthlySummary[]
  rating: string
}

export interface SavingsSummary {
  totalCO2SavedKg: number
  totalCO2SavedTons: number
  carbonCreditValueEur: number
  distanceSavedKm: number
  fuelSavedLiters: number
  costSavedTry: number
  optimizedRouteCount: number
}

export const sustainabilityApi = {
  getCarbonReport: (period = 'monthly', year?: number, month?: number) =>
    api.get<ApiResponse<CarbonReport>>('/sustainability/carbon-report', { params: { period, year, month } }).then(r => r.data),

  getEsgReport: (year?: number) =>
    api.get<ApiResponse<EsgReport>>('/sustainability/esg-report', { params: { year } }).then(r => r.data),

  getSavingsSummary: () =>
    api.get<ApiResponse<SavingsSummary>>('/sustainability/savings-summary').then(r => r.data),
}
