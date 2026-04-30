import api from './client'
import type { ApiResponse, PagedResult, Contract, ContractRate } from '../types'

export const contractsApi = {
  getAll: (params?: { providerId?: string; status?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PagedResult<Contract>>>('/contracts', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Contract>>(`/contracts/${id}`).then(r => r.data),

  create: (data: Partial<Contract>) =>
    api.post<ApiResponse<Contract>>('/contracts', data).then(r => r.data),

  update: (id: string, data: Partial<Contract>) =>
    api.put<ApiResponse<Contract>>(`/contracts/${id}`, data).then(r => r.data),

  getRates: (contractId: string) =>
    api.get<ApiResponse<ContractRate[]>>(`/contracts/${contractId}/rates`).then(r => r.data),

  createRate: (contractId: string, data: Partial<ContractRate>) =>
    api.post<ApiResponse<ContractRate>>(`/contracts/${contractId}/rates`, data).then(r => r.data),

  updateRate: (contractId: string, rateId: string, data: Partial<ContractRate>) =>
    api.put<ApiResponse<ContractRate>>(`/contracts/${contractId}/rates/${rateId}`, data).then(r => r.data),

  deleteRate: (contractId: string, rateId: string) =>
    api.delete(`/contracts/${contractId}/rates/${rateId}`).then(r => r.data),
}
