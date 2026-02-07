'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { wishlistAPI, URLMetadata } from '@/lib/wishlistAPI'
import { FaGift, FaPlus, FaTrash, FaArrowLeft, FaSave, FaMagic, FaSpinner, FaUsers } from 'react-icons/fa'
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
  is_pooling: boolean
  is_reserved: boolean
  total_contributed?: number
}

interface Wishlist {
  id: number
  title: string
  description: string | null
  slug: string
  is_public: boolean
  items: WishlistItem[]
}

export default function EditWishlistPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const slug = params.slug as string
  
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [parsingURL, setParsingURL] = useState(false)
  
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    url: '',
    image_url: '',
    price: '',
    currency: 'RUB',
    priority: 0,
    is_pooling: false,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    loadWishlist()
  }, [isAuthenticated, slug, router])

  const loadWishlist = async () => {
    try {
      const publicResponse = await api.get(`/api/wishlists/public/${slug}`)
      const wishlistId = publicResponse.data.id
      
      const response = await api.get(`/api/wishlists/${wishlistId}`)
      setWishlist(response.data)
    } catch (error: any) {
      console.error('Error loading wishlist:', error)
      toast.error('Ошибка загрузки вишлиста')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleParseURL = async () => {
    if (!newItem.url.trim()) {
      toast.error('Введите URL товара')
      return
    }

    setParsingURL(true)
    try {
      const metadata = await wishlistAPI.parseURL(newItem.url)
      
      // Автозаполнение полей
      setNewItem({
        ...newItem,
        title: metadata.title || newItem.title,
        description: metadata.description || newItem.description,
        image_url: metadata.image_url || newItem.image_url,
        price: metadata.price || newItem.price,
        currency: metadata.currency || newItem.currency,
      })
      
      toast.success('Данные загружены!')
    } catch (error) {
      console.error('Parse error:', error)
    } finally {
      setParsingURL(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!wishlist) return

    // Валидация
    if (newItem.is_pooling && !newItem.price) {
      toast.error('Для коллективного сбора укажите цену')
      return
    }
    
    try {
      const itemData: any = {
        title: newItem.title,
        description: newItem.description || undefined,
        url: newItem.url || undefined,
        image_url: newItem.image_url || undefined,
        price: newItem.price ? parseFloat(newItem.price) : undefined,
        currency: newItem.currency,
        priority: newItem.priority,
        is_pooling: newItem.is_pooling,
      }

      const response = await api.post(`/api/wishlists/${wishlist.id}/items`, itemData)
      
      setWishlist({
        ...wishlist,
        items: [...wishlist.items, response.data],
      })
      
      setShowAddItemModal(false)
      setNewItem({
        title: '',
        description: '',
        url: '',
        image_url: '',
        price: '',
        currency: 'RUB',
        priority: 0,
        is_pooling: false,
      })
      
      toast.success('Товар добавлен!')
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Ошибка добавления товара')
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Удалить этот товар?')) return
    
    try {
      await api.delete(`/api/items/${itemId}`)
      
      if (wishlist) {
        setWishlist({
          ...wishlist,
          items: wishlist.items.filter(item => item.id !== itemId),
        })
      }
      
      toast.success('Товар удалён')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Ошибка удаления товара')
    }
  }

  const handleUpdateWishlist = async () => {
    if (!wishlist) return
    
    try {
      await api.put(`/api/wishlists/${wishlist.id}`, {
        title: wishlist.title,
        description: wishlist.description,
        is_public: wishlist.is_public,
      })
      
      toast.success('Вишлист обновлён!')
    } catch (error) {
      console.error('Error updating wishlist:', error)
      toast.error('Ошибка обновления вишлиста')
    }
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

  if (!wishlist) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 inline-flex">
            <FaArrowLeft />
            <span>Назад к дашборду</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 mr-4">
              <input
                type="text"
                value={wishlist.title}
                onChange={(e) => setWishlist({ ...wishlist, title: e.target.value })}
                className="text-3xl font-bold text-gray-800 border-b-2 border-transparent hover:border-gray-300 focus:border-primary-600 outline-none w-full mb-4"
              />
              <textarea
                value={wishlist.description || ''}
                onChange={(e) => setWishlist({ ...wishlist, description: e.target.value })}
                placeholder="Добавьте описание..."
                className="text-gray-600 border border-gray-300 rounded-lg p-3 w-full outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>
            <button
              onClick={handleUpdateWishlist}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaSave />
              <span>Сохранить</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wishlist.is_public}
                onChange={(e) => setWishlist({ ...wishlist, is_public: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-gray-700">Публичный вишлист</span>
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Товары ({wishlist.items.length})
          </h3>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus />
            <span>Добавить товар</span>
          </button>
        </div>

        {wishlist.items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaGift className="text-6xl text-gray-300 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              Товаров пока нет
            </h4>
            <p className="text-gray-600 mb-6">
              Добавьте свой первый товар в вишлист!<br />
              💡 Совет: Вставьте ссылку из магазина для автозаполнения
            </p>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Добавить товар
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-6">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  {item.title}
                </h4>
                
                {item.description && (
                  <p className="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}
                
                {item.price && (
                  <p className="text-lg font-semibold text-primary-600 mb-2">
                    {item.price} {item.currency}
                  </p>
                )}

                {item.is_pooling && (
                  <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-xs text-purple-700 font-medium flex items-center">
                      <FaUsers className="mr-1" />
                      Коллективный сбор
                    </span>
                    {item.total_contributed !== undefined && item.price && (
                      <span className="text-xs text-purple-600">
                        Собрано: {item.total_contributed} / {item.price} {item.currency}
                      </span>
                    )}
                  </div>
                )}

                {item.is_reserved && (
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-xs text-green-700 font-medium">
                      🔒 Зарезервирован
                    </span>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-center text-sm"
                    >
                      Ссылка
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    title="Удалить"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Добавить товар
            </h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              {/* URL с автозаполнением */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ✨ URL товара (для автозаполнения)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={newItem.url}
                    onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="https://ozon.ru/product/..."
                  />
                  <button
                    type="button"
                    onClick={handleParseURL}
                    disabled={parsingURL || !newItem.url}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 flex items-center space-x-2"
                  >
                    {parsingURL ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Загрузка...</span>
                      </>
                    ) : (
                      <>
                        <FaMagic />
                        <span>Загрузить</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Вставьте ссылку из Ozon, Wildberries, Яндекс.Маркет или других магазинов
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="iPhone 15 Pro"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Цвет: Titanium, 256GB"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена {newItem.is_pooling && '*'}
                  </label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="100000"
                    step="0.01"
                    min="0"
                    required={newItem.is_pooling}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Валюта
                  </label>
                  <select
                    value={newItem.currency}
                    onChange={(e) => setNewItem({ ...newItem, currency: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="RUB">₽ Рубли</option>
                    <option value="USD">$ Доллары</option>
                    <option value="EUR">€ Евро</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Приоритет
                </label>
                <select
                  value={newItem.priority}
                  onChange={(e) => setNewItem({ ...newItem, priority: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value={0}>Низкий</option>
                  <option value={1}>Средний</option>
                  <option value={2}>Высокий</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка на изображение
                </label>
                <input
                  type="url"
                  value={newItem.image_url}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Коллективные сборы */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.is_pooling}
                    onChange={(e) => setNewItem({ ...newItem, is_pooling: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <div>
                    <span className="text-gray-800 font-medium">Разрешить коллективные сборы</span>
                    <p className="text-xs text-gray-600">
                      Несколько друзей смогут скинуться на этот подарок
                    </p>
                  </div>
                </label>
                {newItem.is_pooling && !newItem.price && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Для коллективного сбора укажите цену товара
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Добавить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItemModal(false)
                    setNewItem({
                      title: '',
                      description: '',
                      url: '',
                      image_url: '',
                      price: '',
                      currency: 'RUB',
                      priority: 0,
                      is_pooling: false,
                    })
                  }}
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
