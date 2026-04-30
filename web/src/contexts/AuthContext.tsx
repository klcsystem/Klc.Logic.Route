import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '../api/client'
import type { ApiResponse } from '../types'

interface AuthUser {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  tenantId: string
  permissions: string[]
}

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

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchCurrentUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me')
      if (data.success && data.data) {
        setUser(data.data)
      } else {
        logout()
      }
    } catch {
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password })
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Login failed')
    }

    const loginData = data.data
    const newToken = loginData.token

    localStorage.setItem('token', newToken)
    localStorage.setItem('tenantId', loginData.tenantId)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

    setToken(newToken)
    setUser({
      userId: loginData.userId,
      email: loginData.email,
      firstName: loginData.firstName,
      lastName: loginData.lastName,
      role: loginData.role,
      tenantId: loginData.tenantId,
      permissions: loginData.permissions,
    })
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false
      if (user.role === 'Admin') return true
      return user.permissions.includes(permission)
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
