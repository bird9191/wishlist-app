import api from '@/lib/api'
import { toast } from 'react-toastify'

export interface URLMetadata {
  title?: string
  description?: string
  image_url?: string
  price?: string
  currency?: string
}

export interface WishlistItem {
  id: number
  title: string
  description?: string
  url?: string
  image_url?: string
  price?: number
  currency: string
  priority: number
  is_reserved: boolean
  is_pooling: boolean
  wishlist_id: number
  created_at: string
  updated_at?: string
  reservations?: Reservation[]
  contributions?: Contribution[]
  total_contributed?: number
}

export interface Reservation {
  id: number
  item_id: number
  reserver_name: string
  reserver_email?: string
  message?: string
  created_at: string
}

export interface Contribution {
  id: number
  item_id: number
  contributor_name: string
  contributor_email?: string
  amount: number
  message?: string
  created_at: string
}

export interface Wishlist {
  id: number
  title: string
  description?: string
  slug: string
  items: WishlistItem[]
  created_at: string
}

export const wishlistAPI = {
  // Парсинг URL
  async parseURL(url: string): Promise<URLMetadata> {
    try {
      // FastAPI ожидает просто строку URL в body
      const response = await api.post('/api/url/parse', `"${url}"`, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Не удалось загрузить данные'
      toast.error(message)
      throw error
    }
  },

  // Резервирование
  async reserveItem(itemId: number, data: { reserver_name: string; reserver_email?: string; message?: string }): Promise<Reservation> {
    try {
      const response = await api.post(`/api/items/${itemId}/reserve`, data)
      toast.success('Подарок зарезервирован!')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Не удалось зарезервировать'
      toast.error(message)
      throw error
    }
  },

  // Отмена резервирования
  async cancelReservation(itemId: number): Promise<void> {
    try {
      await api.delete(`/api/items/${itemId}/reserve`)
      toast.success('Резервирование отменено')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка отмены'
      toast.error(message)
      throw error
    }
  },

  // Внести вклад
  async contributeToItem(itemId: number, data: { contributor_name: string; contributor_email?: string; amount: number; message?: string }): Promise<Contribution> {
    try {
      const response = await api.post(`/api/items/${itemId}/contribute`, data)
      toast.success('Вклад принят!')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Не удалось внести вклад'
      toast.error(message)
      throw error
    }
  },

  // Получить публичный вишлист
  async getPublicWishlist(slug: string): Promise<Wishlist> {
    try {
      const response = await api.get(`/api/wishlists/public/${slug}`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Вишлист не найден'
      toast.error(message)
      throw error
    }
  }
}
