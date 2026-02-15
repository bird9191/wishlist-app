import { useEffect, useRef, useState } from 'react'

interface WSMessage {
  type: string
  wishlist_id: number
  item_id?: number
  data: any
}

export const useWebSocket = (wishlistId: number | null, onMessage: (message: WSMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const onMessageRef = useRef(onMessage)
  
  // Обновляем ref при изменении callback
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!wishlistId) return

    let isMounted = true
    
    const connect = () => {
      if (!isMounted) return
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = process.env.NEXT_PUBLIC_API_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000'
      const wsUrl = `${protocol}//${host}/api/items/ws/${wishlistId}`

      try {
        ws.current = new WebSocket(wsUrl)

        ws.current.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
        }

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WSMessage
            onMessageRef.current(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.current.onclose = () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
          
          // Попытка переподключения через 3 секунды, только если компонент смонтирован
          if (isMounted) {
            reconnectTimeout.current = setTimeout(() => {
              console.log('Attempting to reconnect...')
              connect()
            }, 3000)
          }
        }
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
      }
    }
    
    connect()

    return () => {
      isMounted = false
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [wishlistId]) // Только wishlistId в dependencies

  return { isConnected }
}
