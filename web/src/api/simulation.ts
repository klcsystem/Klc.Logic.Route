import api from './client'
import type { ApiResponse } from '../types'

export interface SimulationScenario {
  vehicleCountDelta: number
  demandChangePercent: number
  fuelPriceChangePercent: number
}

export interface SimulationMetrics {
  totalCost: number
  totalDistanceKm: number
  totalDurationMin: number
  co2EmissionsKg: number
  vehicleUtilizationPercent: number
  avgDeliveryTimeHours: number
  onTimeDeliveryPercent: number
  activeVehicles: number
  activeShipments: number
}

export interface SimulationResult {
  current: SimulationMetrics
  simulated: SimulationMetrics
  costBreakdown: { category: string; current: number; simulated: number }[]
}

export const simulationApi = {
  getCurrentMetrics: () =>
    api.get<ApiResponse<SimulationMetrics>>('/simulation/current').then(r => r.data),

  runSimulation: (scenario: SimulationScenario) =>
    api.post<ApiResponse<SimulationResult>>('/simulation/run', scenario).then(r => r.data),
}
