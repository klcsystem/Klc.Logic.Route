import api from './client'
import type { ApiResponse, PagedResult, Provider } from '../types'

export const providersApi = {
  getAll: (params?: { search?: string; type?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PagedResult<Provider>>>('/providers', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Provider>>(`/providers/${id}`).then(r => r.data),

  create: (data: Partial<Provider>) =>
    api.post<ApiResponse<Provider>>('/providers', data).then(r => r.data),

  update: (id: string, data: Partial<Provider>) =>
    api.put<ApiResponse<Provider>>(`/providers/${id}`, data).then(r => r.data),

  toggleActive: (id: string, currentlyActive: boolean) =>
    api.patch<ApiResponse<boolean>>(`/providers/${id}/active`, { isActive: !currentlyActive }).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/providers/${id}`).then(r => r.data),
}
