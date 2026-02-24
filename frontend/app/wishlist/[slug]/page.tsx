'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FaGift, FaExternalLinkAlt, FaLock, FaUsers, FaCheckCircle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { wishlistAPI, Wishlist, WishlistItem } from '@/lib/wishlistAPI'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function PublicWishlistPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  
  const [reserverName, setReserverName] = useState('')
  const [reserverEmail, setReserverEmail] = useState('')
  const [reserveMessage, setReserveMessage] = useState('')
  const [reserving, setReserving] = useState(false)
  
  const [contributorName, setContributorName] = useState('')
  const [contributorEmail, setContributorEmail] = useState('')
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributeMessage, setContributeMessage] = useState('')
  const [contributing, setContributing] = useState(false)

  useEffect(() => {
    loadWishlist()
  }, [slug])

  const loadWishlist = async () => {
    try {
      const data = await wishlistAPI.getPublicWishlist(slug)
      setWishlist(data)
    } catch (error) {
      console.error('Error loading wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWSMessage = (message: any) => {
    if (message.type === 'reservation' || message.type === 'contribution' ||
        message.type === 'reservation_cancelled' || message.type === 'item_deleted') {
      loadWishlist()
    }
  }

  const { isConnected } = useWebSocket(wishlist?.id || null, handleWSMessage)

  const handleReserve = (item: WishlistItem) => {
    setSelectedItem(item)
    setShowReserveModal(true)
  }

  const handleContribute = (item: WishlistItem) => {
    setSelectedItem(item)
    setShowContributeModal(true)
  }

  const submitReservation = async () => {
    if (!selectedItem || !reserverName.trim()) {
      toast.error('Укажите ваше имя')
      return
    }

    setReserving(true)
    try {
      await wishlistAPI.reserveItem(selectedItem.id, {
        reserver_name: reserverName,
        reserver_email: reserverEmail || undefined,
        message: reserveMessage || undefined
      })
      
      setShowReserveModal(false)
      setReserverName('')
      setReserverEmail('')
      setReserveMessage('')
      loadWishlist()
    } catch (error) {
      console.error('Reservation error:', error)
    } finally {
      setReserving(false)
    }
  }

  const submitContribution = async () => {
    if (!selectedItem || !contributorName.trim()) {
      toast.error('Укажите ваше имя')
      return
    }

    const amount = parseFloat(contributionAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Укажите корректную сумму')
      return
    }

    if (selectedItem.price != null) {
      const contributed = selectedItem.total_contributed || 0
      const remaining = selectedItem.price - contributed
      if (amount > remaining) {
        toast.error(`Максимальная сумма: ${remaining} ${selectedItem.currency}`)
        return
      }
    }

    setContributing(true)
    try {
      await wishlistAPI.contributeToItem(selectedItem.id, {
        contributor_name: contributorName,
        contributor_email: contributorEmail || undefined,
        amount,
        message: contributeMessage || undefined
      })
      
      setShowContributeModal(false)
      setContributorName('')
      setContributorEmail('')
      setContributionAmount('')
      setContributeMessage('')
      loadWishlist()
    } catch (error) {
      console.error('Contribution error:', error)
    } finally {
      setContributing(false)
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 2:
        return { label: 'Высокий', color: 'bg-red-100 text-red-800' }
      case 1:
        return { label: 'Средний', color: 'bg-yellow-100 text-yellow-800' }
      default:
        return { label: 'Низкий', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getProgressPercentage = (item: WishlistItem) => {
    if (!item.price || !item.total_contributed) return 0
    return Math.min((item.total_contributed / item.price) * 100, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
          {isConnected && (
            <p className="text-xs text-green-600 mt-2">● Real-time подключен</p>
          )}
        </div>
      </div>
    )
  }

  if (!wishlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaGift className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Вишлист не найден</h2>
          <p className="text-gray-600 mb-6">Проверьте правильность ссылки</p>
          <Link href="/" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-block">
            На главную
          </Link>
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
          {isConnected && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span>Онлайн</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{wishlist.title}</h2>
          {wishlist.description && (
            <p className="text-gray-600 text-lg">{wishlist.description}</p>
          )}
        </div>

        {wishlist.items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaGift className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              В этом вишлисте пока нет товаров
            </h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.items.map((item) => {
              const priority = getPriorityLabel(item.priority)
              const progressPercentage = getProgressPercentage(item)
              const isFullyFunded = !!(item.is_pooling && item.price && item.total_contributed && item.total_contributed >= item.price)
              
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl shadow-md p-6 ${
                    item.is_reserved && !item.is_pooling ? 'opacity-60 border-2 border-green-300' : ''
                  }`}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800 flex-1">{item.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${priority.color} ml-2`}>
                      {priority.label}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  )}
                  
                  {item.price && (
                    <p className="text-lg font-semibold text-primary-600 mb-3">
                      {item.price} {item.currency}
                    </p>
                  )}

                  {item.is_pooling && item.price && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Собрано:</span>
                        <span className="font-semibold">
                          {item.total_contributed || 0} / {item.price} {item.currency}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-3 transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {item.contributions?.length || 0} участников
                        </span>
                        {isFullyFunded && (
                          <span className="text-xs text-green-600 font-semibold flex items-center">
                            <FaCheckCircle className="mr-1" />
                            Собрано!
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {item.is_reserved && !item.is_pooling && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center">
                      <FaLock className="text-green-600 mr-2" />
                      <span className="text-sm text-green-700 font-medium">
                        Кто-то уже резервировал этот подарок
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      >
                        <FaExternalLinkAlt />
                        <span>Ссылка</span>
                      </a>
                    )}

                    {item.is_pooling ? (
                      <button
                        onClick={() => handleContribute(item)}
                        disabled={isFullyFunded}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
                          isFullyFunded
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        <FaUsers />
                        <span>{isFullyFunded ? 'Собрано' : 'Скинуться'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReserve(item)}
                        disabled={item.is_reserved}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
                          item.is_reserved
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <FaLock />
                        <span>{item.is_reserved ? 'Зарезервирован' : 'Резервировать'}</span>
                      </button>
                    )}
                  </div>

                  {item.is_pooling && item.contributions && item.contributions.length > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-semibold text-purple-900 mb-2">Участники:</p>
                      <div className="space-y-1">
                        {item.contributions.map((contrib) => (
                          <div key={contrib.id} className="flex justify-between text-sm">
                            <span className="text-purple-700">{contrib.contributor_name}</span>
                            <span className="text-purple-900 font-semibold">
                              {contrib.amount} {item.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showReserveModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Зарезервировать подарок
            </h3>
            <p className="text-gray-600 mb-6">
              <strong>{selectedItem.title}</strong>
              <br />
              <span className="text-sm">Владелец вишлиста не увидит ваше имя - сюрприз не будет испорчен!</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваше имя *
                </label>
                <input
                  type="text"
                  value={reserverName}
                  onChange={(e) => setReserverName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Мария"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (опционально)
                </label>
                <input
                  type="email"
                  value={reserverEmail}
                  onChange={(e) => setReserverEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="maria@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Для уведомлений</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сообщение для других (опционально)
                </label>
                <textarea
                  value={reserveMessage}
                  onChange={(e) => setReserveMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Куплю на следующей неделе"
                  rows={2}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={submitReservation}
                  disabled={reserving}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {reserving ? 'Резервирование...' : 'Зарезервировать'}
                </button>
                <button
                  onClick={() => {
                    setShowReserveModal(false)
                    setReserverName('')
                    setReserverEmail('')
                    setReserveMessage('')
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContributeModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Внести вклад
            </h3>
            <p className="text-gray-600 mb-2">
              <strong>{selectedItem.title}</strong>
            </p>
            {selectedItem.price && (
              <div className="mb-6 p-3 bg-purple-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Собрано:</span>
                  <span className="font-semibold">
                    {selectedItem.total_contributed || 0} / {selectedItem.price} {selectedItem.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Осталось:</span>
                  <span className="font-semibold text-purple-600">
                    {selectedItem.price - (selectedItem.total_contributed || 0)} {selectedItem.currency}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваше имя *
                </label>
                <input
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Мария"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сумма *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="1000"
                    required
                    min="1"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {selectedItem.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (опционально)
                </label>
                <input
                  type="email"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="maria@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сообщение (опционально)
                </label>
                <textarea
                  value={contributeMessage}
                  onChange={(e) => setContributeMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="С радостью скинусь!"
                  rows={2}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={submitContribution}
                  disabled={contributing}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                >
                  {contributing ? 'Отправка...' : 'Внести вклад'}
                </button>
                <button
                  onClick={() => {
                    setShowContributeModal(false)
                    setContributorName('')
                    setContributorEmail('')
                    setContributionAmount('')
                    setContributeMessage('')
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Создано с помощью <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">Wishlist App</Link></p>
        </div>
      </footer>
    </div>
  )
}
