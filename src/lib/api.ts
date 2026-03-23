import { useAuthStore } from '@/stores/auth'

const API_BASE = '/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
}

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const { method = 'GET', body, headers = {} } = options
  const token = useAuthStore.getState().token

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers
    }
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)
  return response.json()
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),
  
  getMe: () => api<{ id: string; email: string; name: string; role: string }>('/auth/login'),
  
  changePassword: (oldPassword: string, newPassword: string) =>
    api('/auth/password', {
      method: 'PUT',
      body: { oldPassword, newPassword }
    }),
  
  forgotPassword: (email: string) =>
    api('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    }),
  
  resetPassword: (email: string, code: string, newPassword: string) =>
    api('/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword }
    }),
  
  checkInit: () => api<{ initialized: boolean; adminExists: boolean }>('/auth/init'),
  
  init: (email: string, password: string, name?: string) =>
    api('/auth/init', {
      method: 'POST',
      body: { email, password, name }
    })
}

// Birthdays API
export const birthdaysApi = {
  list: (search?: string, department?: string, calendarType?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (department) params.set('department', department)
    if (calendarType) params.set('calendarType', calendarType)
    const query = params.toString()
    return api<any[]>(`/birthdays${query ? `?${query}` : ''}`)
  },
  
  get: (id: string) => api<any>(`/birthdays/${id}`),
  
  create: (data: any) =>
    api<any>('/birthdays', {
      method: 'POST',
      body: data
    }),
  
  update: (id: string, data: any) =>
    api<any>(`/birthdays/${id}`, {
      method: 'PUT',
      body: data
    }),
  
  delete: (id: string) =>
    api(`/birthdays/${id}`, {
      method: 'DELETE'
    }),
  
  upcoming: (days: number = 30) =>
    api<any[]>(`/birthdays/upcoming?days=${days}`),
  
  departments: () => api<string[]>('/birthdays/departments')
}

// Settings API
export const settingsApi = {
  get: () => api<Record<string, string>>('/settings'),
  
  update: (settings: Record<string, string>) =>
    api('/settings', {
      method: 'PUT',
      body: { settings }
    }),
  
  getSMTP: () => api<any>('/settings/smtp'),
  
  updateSMTP: (data: any) =>
    api('/settings/smtp', {
      method: 'PUT',
      body: data
    }),
  
  getPort: () => api<{ port: number }>('/settings/port'),
  
  updatePort: (port: number) =>
    api('/settings/port', {
      method: 'PUT',
      body: { port }
    })
}

// Logs API
export const logsApi = {
  list: (page: number = 1, limit: number = 20, status?: string) => {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('limit', limit.toString())
    if (status) params.set('status', status)
    return api<{ logs: any[]; pagination: any }>(`/logs?${params}`)
  }
}
