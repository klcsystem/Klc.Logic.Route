import api from './client'
import type { ApiResponse } from '../types'

export interface LocationEntry {
  id: string
  code: string
  name: string
  locationType: 'Depot' | 'Warehouse' | 'Hub' | 'Customer' | 'CrossDock' | 'PickupPoint'
  address: string
  city: string
  district: string
  latitude?: number
  longitude?: number
  isActive: boolean
  capacity?: number
  workingHours?: string
  contactName?: string
  contactPhone?: string
  createdAt?: string
  updatedAt?: string
}

export const locationsApi = {
  getAll: (params?: { search?: string; type?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<LocationEntry[]>>('/locations', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<LocationEntry>>(`/locations/${id}`).then(r => r.data),

  create: (data: Partial<LocationEntry>) =>
    api.post<ApiResponse<LocationEntry>>('/locations', data).then(r => r.data),

  update: (id: string, data: Partial<LocationEntry>) =>
    api.put<ApiResponse<LocationEntry>>(`/locations/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/locations/${id}`).then(r => r.data),
}
