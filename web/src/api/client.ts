import axios from 'axios'

const isProduction = window.location.hostname !== 'localhost'
const API_URL = import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:2701/api')

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: tenant header + bearer token
api.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId') || '00000000-0000-0000-0000-000000000001'
  config.headers['X-Tenant-Id'] = tenantId

  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor: 401 redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// Notifications
export const notificationsApi = {
  getAll: (page = 1, pageSize = 50) =>
    api.get('/notifications', { params: { page, pageSize } }).then(r => r.data),
  getUnreadCount: () =>
    api.get('/notifications/unread-count').then(r => r.data),
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`).then(r => r.data),
  markAllAsRead: () =>
    api.put('/notifications/read-all').then(r => r.data),
}

export default api
