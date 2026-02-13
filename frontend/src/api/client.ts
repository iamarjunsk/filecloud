import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(undefined)
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = response.data

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        processQueue(null)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as AxiosError)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  
  me: () => api.get('/auth/me'),
  
  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
}

export const fileApi = {
  upload: (formData: FormData) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getContents: (folderId?: string) =>
    api.get('/files', { params: { folderId } }),
  
  getMetadata: (id: string) => api.get(`/files/${id}`),
  
  download: (id: string) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  
  delete: (id: string) => api.delete(`/files/${id}`),
  
  getPresignedUrl: (id: string) => api.get(`/files/${id}/url`),

  getChunkSize: () => api.get('/files/chunk-size'),
  
  initializeChunkedUpload: (data: {
    fileName: string
    mimeType: string
    totalSize: number
    totalChunks: number
    folderId?: string
  }) => api.post('/files/chunked/initialize', data),
  
  uploadChunkedChunk: (uploadId: string, data: FormData) =>
    api.post('/files/chunked/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getChunkedUploadStatus: (uploadId: string) =>
    api.get(`/files/chunked/status/${uploadId}`),
  
  finalizeChunkedUpload: (uploadId: string) =>
    api.post('/files/chunked/finalize', { uploadId }),
  
  cancelChunkedUpload: (uploadId: string) =>
    api.delete(`/files/chunked/cancel/${uploadId}`),

  rename: (id: string, data: { name: string }) =>
    api.patch(`/files/${id}`, data),
  
  move: (id: string, data: { folderId: string | null }) =>
    api.post(`/files/${id}/move`, data),
}

export const folderApi = {
  create: (data: { name: string; parentId?: string }) =>
    api.post('/folders', data),
  
  getContents: (folderId?: string) =>
    api.get('/folders', { params: { folderId } }),
  
  getById: (id: string) => api.get(`/folders/${id}`),
  
  delete: (id: string) => api.delete(`/folders/${id}`),
  
  getPath: (id: string) => api.get(`/folders/${id}/path`),

  rename: (id: string, data: { name: string }) =>
    api.patch(`/folders/${id}`, data),
  
  move: (id: string, data: { parentId: string | null }) =>
    api.post(`/folders/${id}/move`, data),
}

export const shareApi = {
  create: (data: { fileId?: string; folderId?: string; expiresIn?: number; password?: string }) =>
    api.post('/shares', data),
  
  getUserShares: () => api.get('/shares/me'),
  
  delete: (id: string) => api.delete(`/shares/${id}`),

  getByToken: (token: string) => api.get(`/s/${token}`),
  
  validatePassword: (token: string, password: string) =>
    api.post(`/s/${token}/validate`, { password }),
}

export default api
