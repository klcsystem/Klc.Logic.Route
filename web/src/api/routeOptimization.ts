import api from './client'
import type { ApiResponse } from '../types'

export interface VrpVehicle {
  id: string
  plateNumber: string
  capacityKg: number
  capacityM3: number
  costPerKm: number
  startLat: number
  startLng: number
  available: boolean
}

export interface VrpStop {
  id: string
  address: string
  lat: number
  lng: number
  demandKg: number
  demandM3: number
  timeWindowStart?: string
  timeWindowEnd?: string
  serviceDurationMin: number
}

export interface VrpSolveRequest {
  vehicles: VrpVehicle[]
  stops: VrpStop[]
  depotLat: number
  depotLng: number
}

export interface VrpRouteStop {
  stopId: string
  address: string
  lat: number
  lng: number
  sequence: number
  arrivalTime: string
  departureTime: string
}

export interface VrpRoute {
  vehicleId: string
  plateNumber: string
  stops: VrpRouteStop[]
  totalDistanceKm: number
  totalDurationMin: number
  totalCost: number
  loadKg: number
  loadM3: number
  utilizationPercent: number
}

export interface VrpSolution {
  routes: VrpRoute[]
  totalDistanceKm: number
  totalDurationMin: number
  totalCost: number
  vehicleUtilization: number
  unassignedStops: string[]
  co2SavedKg: number
}

export const routeOptimizationApi = {
  solve: (request: VrpSolveRequest) =>
    api.post<ApiResponse<VrpSolution>>('/route-optimization/solve', request).then(r => r.data),

  getVehicles: () =>
    api.get<ApiResponse<VrpVehicle[]>>('/route-optimization/vehicles').then(r => r.data),

  getStops: () =>
    api.get<ApiResponse<VrpStop[]>>('/route-optimization/stops').then(r => r.data),
}
