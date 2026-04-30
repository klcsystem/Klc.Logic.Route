import api from './client'
import type { ApiResponse, PagedResult, Shipment, CarrierOption, Recommendation } from '../types'

export const shipmentsApi = {
  getAll: (params?: { status?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PagedResult<Shipment>>>('/shipments', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Shipment>>(`/shipments/${id}`).then(r => r.data),

  create: (data: Partial<Shipment>) =>
    api.post<ApiResponse<Shipment>>('/shipments', data).then(r => r.data),

  calculate: (id: string) =>
    api.post<ApiResponse<Recommendation>>(`/shipments/${id}/calculate`).then(r => r.data),

  approve: (id: string) =>
    api.post<ApiResponse<Shipment>>(`/shipments/${id}/approve`).then(r => r.data),

  sendToProvider: (id: string) =>
    api.post<ApiResponse<Shipment>>(`/shipments/${id}/send`).then(r => r.data),

  cancel: (id: string, reason?: string) =>
    api.post<ApiResponse<Shipment>>(`/shipments/${id}/cancel`, { reason }).then(r => r.data),

  getTracking: (id: string) =>
    api.get<ApiResponse<{ events: { status: string; location: string; timestamp: string }[] }>>(`/shipments/${id}/tracking`).then(r => r.data),

  getCarrierOptions: (params: { originCity: string; destinationCity: string; weightKg: number; volumeM3: number; isHazardous: boolean; requiresColdChain: boolean; priceWeight?: number; speedWeight?: number; reliabilityWeight?: number }) =>
    api.post<ApiResponse<CarrierOption[]>>('/shipments/carrier-options', params).then(r => r.data),
}

export const recommendationsApi = {
  getRecommendation: (shipmentId: string) =>
    api.get<ApiResponse<Recommendation>>(`/recommendations/${shipmentId}`).then(r => r.data),
}
