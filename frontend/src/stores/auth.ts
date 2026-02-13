import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse } from '@/types'
import { authApi } from '@/api/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))

  const isAuthenticated = computed(() => !!accessToken.value)

  async function login(email: string, password: string) {
    const response = await authApi.login({ email, password })
    const data: AuthResponse = response.data
    
    user.value = data.user
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    
    return data
  }

  async function register(email: string, password: string, name?: string) {
    const response = await authApi.register({ email, password, name })
    const data: AuthResponse = response.data
    
    user.value = data.user
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    
    return data
  }

  async function fetchProfile() {
    if (!accessToken.value) return null
    
    try {
      const response = await authApi.me()
      user.value = response.data
      return user.value
    } catch {
      logout()
      return null
    }
  }

  async function logout() {
    if (refreshToken.value) {
      try {
        await authApi.logout(refreshToken.value)
      } catch {
        // Ignore logout errors
      }
    }
    
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  function initialize() {
    if (accessToken.value) {
      fetchProfile()
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    initialize,
  }
})
