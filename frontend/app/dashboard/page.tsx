'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { FaGift, FaPlus, FaShare, FaEdit, FaTrash, FaSignOutAlt, FaLock, FaUsers } from 'react-icons/fa'
import { toast } from 'react-toastify'

interface WishlistItem {
  id: number
  title: string
  description: string | null
  url: string | null
  image_url: string | null
  price: number | null
  currency: string
  priority: number
  is_reserved: boolean
  is_pooling: boolean
  total_contributed?: number
}

interface Wishlist {
  id: number
  title: string
  description: string | null
  slug: string
  is_public: boolean
  created_at: string
  items: WishlistItem[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWishlistTitle, setNewWishlistTitle] = useState('')
  const [newWishlistDescription, setNewWishlistDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    loadWishlists()
  }, [isAuthenticated, router])

  const loadWishlists = async () => {
    try {
      const response = await api.get('/api/wishlists')
      setWishlists(response.data)
    } catch (error) {
      console.error('Error loading wishlists:', error)
      toast.error('Ошибка загрузки вишлистов')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const response = await api.post('/api/wishlists', {
        title: newWishlistTitle,
        description: newWishlistDescription,
        is_public: true,
      })
      
      setWishlists([response.data, ...wishlists])
      setShowCreateModal(false)
      setNewWishlistTitle('')
      setNewWishlistDescription('')
      toast.success('Вишлист создан!')
    } catch (error) {
      console.error('Error creating wishlist:', error)
      toast.error('Ошибка создания вишлиста')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteWishlist = async (id: number) => {
    if (!confirm('Удалить этот вишлист?')) return
    
    try {
      await api.delete(`/api/wishlists/${id}`)
      setWishlists(wishlists.filter(w => w.id !== id))
      toast.success('Вишлист удалён')
    } catch (error) {
      console.error('Error deleting wishlist:', error)
      toast.error('Ошибка удаления вишлиста')
    }
  }

  const copyPublicLink = async (slug: string) => {
    const url = `${window.location.origin}/wishlist/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Ссылка скопирована!')
    } catch {
      toast.error('Не удалось скопировать ссылку')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getItemsStats = (wishlist: Wishlist) => {
    const total = wishlist.items.length
    const reserved = wishlist.items.filter(item => item.is_reserved).length
    const pooling = wishlist.items.filter(item => item.is_pooling).length
    
    return { total, reserved, pooling }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <FaGift className="text-3xl text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-800">Wishlist</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Привет, {user?.username}!</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <FaSignOutAlt />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Мои вишлисты</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            <FaPlus />
            <span>Создать вишлист</span>
          </button>
        </div>

        {wishlists.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaGift className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              У вас пока нет вишлистов
            </h3>
            <p className="text-gray-600 mb-6">
              Создайте свой первый вишлист и начните добавлять желаемые подарки!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Создать первый вишлист
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((wishlist) => {
              const stats = getItemsStats(wishlist)
              
              return (
                <div key={wishlist.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {wishlist.title}
                  </h3>
                  {wishlist.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {wishlist.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Всего товаров:</span>
                      <span className="font-semibold text-gray-800">{stats.total}</span>
                    </div>
                    
                    {stats.reserved > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 flex items-center">
                          <FaLock className="mr-1" />
                          Зарезервировано:
                        </span>
                        <span className="font-semibold text-green-700">{stats.reserved}</span>
                      </div>
                    )}
                    
                    {stats.pooling > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-600 flex items-center">
                          <FaUsers className="mr-1" />
                          Коллективные:
                        </span>
                        <span className="font-semibold text-purple-700">{stats.pooling}</span>
                      </div>
                    )}
                  </div>

                  {wishlist.items.some(item => item.is_pooling && item.total_contributed !== undefined) && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs font-semibold text-purple-900 mb-2">Сборы:</p>
                      {wishlist.items
                        .filter(item => item.is_pooling)
                        .map(item => (
                          <div key={item.id} className="flex justify-between text-xs mb-1">
                            <span className="text-purple-700 truncate flex-1 mr-2">{item.title}</span>
                            <span className="text-purple-900 font-semibold whitespace-nowrap">
                              {item.total_contributed || 0} / {item.price || 0} {item.currency}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {stats.reserved > 0 && (
                    <div className="mb-4 p-2 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-700">
                        🎁 <strong>Секретный режим:</strong> Вы видите только факт резервирования, но не имена - сюрприз не испорчен!
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{wishlist.is_public ? 'Публичный' : 'Приватный'}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/wishlist/${wishlist.slug}/edit`}
                      className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <FaEdit />
                      <span>Редактировать</span>
                    </Link>
                    <button
                      onClick={() => copyPublicLink(wishlist.slug)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      title="Скопировать ссылку"
                    >
                      <FaShare />
                    </button>
                    <button
                      onClick={() => handleDeleteWishlist(wishlist.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      title="Удалить"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Создать новый вишлист
            </h3>
            <form onSubmit={handleCreateWishlist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={newWishlistTitle}
                  onChange={(e) => setNewWishlistTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Например: Мой день рождения 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={newWishlistDescription}
                  onChange={(e) => setNewWishlistDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Дополнительная информация о вишлисте"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
