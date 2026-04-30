import api from './client'
import type { ApiResponse, ErpConnection } from '../types'

export const settingsApi = {
  getErpConnections: () =>
    api.get<ApiResponse<ErpConnection[]>>('/settings/erp-connections').then(r => r.data),

  getErpConnection: (id: string) =>
    api.get<ApiResponse<ErpConnection>>(`/settings/erp-connections/${id}`).then(r => r.data),

  createErpConnection: (data: Partial<ErpConnection>) =>
    api.post<ApiResponse<ErpConnection>>('/settings/erp-connections', data).then(r => r.data),

  updateErpConnection: (id: string, data: Partial<ErpConnection>) =>
    api.put<ApiResponse<ErpConnection>>(`/settings/erp-connections/${id}`, data).then(r => r.data),

  testErpConnection: (id: string) =>
    api.post<ApiResponse<{ success: boolean; message?: string }>>(`/settings/erp-connections/${id}/test`).then(r => r.data),

  deleteErpConnection: (id: string) =>
    api.delete(`/settings/erp-connections/${id}`).then(r => r.data),
}
