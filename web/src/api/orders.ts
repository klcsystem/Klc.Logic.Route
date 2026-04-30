import api from './client'
import type { ApiResponse, PagedResult, Order } from '../types'

export const ordersApi = {
  getAll: (params?: { status?: string; city?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PagedResult<Order>>>('/orders', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`).then(r => r.data),

  syncErp: (connectionId?: string) =>
    api.post<ApiResponse<{ syncedCount: number }>>('/orders/sync-erp', { connectionId }).then(r => r.data),

  importOrder: (data: Partial<Order>) =>
    api.post<ApiResponse<Order>>('/orders', data).then(r => r.data),
}
