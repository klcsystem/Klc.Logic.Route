import api from './client'
import type { ApiResponse } from '../types'

interface LoginResponse {
  token: string
  email: string
  firstName: string
  lastName: string
  role: string
  userId: string
  tenantId: string
  permissions: string[]
}

interface AuthUser {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  tenantId: string
  permissions: string[]
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }).then(r => r.data),

  me: () =>
    api.get<ApiResponse<AuthUser>>('/auth/me').then(r => r.data),
}

export type { LoginResponse, AuthUser }
