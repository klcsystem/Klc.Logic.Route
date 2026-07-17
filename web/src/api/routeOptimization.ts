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
  vehicleType?: string
  bodyType?: string
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
  fuelCost?: number
  tollCost?: number
  driverCost?: number
  loadKg: number
  loadM3: number
  utilizationPercent: number
}

export interface VrpSolution {
  routes: VrpRoute[]
  totalDistanceKm: number
  totalDurationMin: number
  totalCost: number
  totalFuelCost?: number
  totalTollCost?: number
  totalDriverCost?: number
  dieselPriceTry?: number
  vehicleUtilization: number
  unassignedStops: string[]
  co2SavedKg: number
}

export const routeOptimizationApi = {
  solve: (request: VrpSolveRequest) => {
    // Map frontend format to backend format
    const backendRequest = {
      vehicles: request.vehicles.map(v => ({
        id: v.id,
        plate: v.plateNumber,
        capacityKg: v.capacityKg,
        capacityM3: v.capacityM3,
        depotLat: v.startLat || request.depotLat,
        depotLng: v.startLng || request.depotLng,
        vehicleType: v.vehicleType,   // maliyet (yakıt/geçiş) araç tipine göre hesaplanır
      })),
      stops: request.stops.map(s => ({
        shipmentId: s.id,
        lat: s.lat,
        lng: s.lng,
        weightKg: s.demandKg,
        volumeM3: s.demandM3,
        timeWindowStart: s.timeWindowStart ? new Date(`2026-01-01T${s.timeWindowStart}:00Z`).toISOString() : null,
        timeWindowEnd: s.timeWindowEnd ? new Date(`2026-01-01T${s.timeWindowEnd}:00Z`).toISOString() : null,
        serviceMinutes: s.serviceDurationMin,
      })),
    }
    return api.post<ApiResponse<VrpSolution>>('/route-optimization/solve', backendRequest).then(r => r.data)
  },

  getVehicles: () =>
    api.get<ApiResponse<VrpVehicle[]>>('/route-optimization/vehicles').then(r => r.data),

  getStops: () =>
    api.get<ApiResponse<VrpStop[]>>('/route-optimization/stops').then(r => r.data),

  // Planlanan rotaları sürücülere sevk et (order→InShipment, shipment'a sürücü+plaka, Canlı Takip'e düşer)
  dispatch: (solution: VrpSolution) => {
    const routes = solution.routes.map(r => ({
      vehicleId: r.vehicleId,
      vehiclePlate: r.plateNumber,
      orderIds: r.stops.map(s => s.stopId),
    }))
    return api.post<ApiResponse<DispatchResult>>('/route-optimization/dispatch', { routes }).then(r => r.data)
  },
}

export interface DispatchResult {
  dispatchedOrders: number
  shipmentsCreated: number
  driversAssigned: number
  assignments: { driver: string; phone: string; plate: string; orders: number }[]
  message: string
}
