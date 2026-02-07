import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import { toast } from 'react-toastify'

export interface User {
  id: number
  email: string
  username: string
  is_active: boolean
  avatar_url?: string
  created_at: string
  oauth_provider?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await api.post('/api/auth/login/json', { email, password })
          const { access_token, user } = response.data
          
          localStorage.setItem('token', access_token)
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
          })
          
          toast.success('Успешный вход!')
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Ошибка входа'
          toast.error(message)
          throw error
        }
      },

      register: async (email: string, username: string, password: string) => {
        try {
          const response = await api.post('/api/auth/register', {
            email,
            username,
            password,
          })
          const { access_token, user } = response.data
          
          localStorage.setItem('token', access_token)
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
          })
          
          toast.success('Регистрация успешна!')
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Ошибка регистрации'
          toast.error(message)
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        toast.info('Вы вышли из системы')
      },

      setUser: (user: User, token: string) => {
        localStorage.setItem('token', token)
        set({
          user,
          token,
          isAuthenticated: true,
        })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
