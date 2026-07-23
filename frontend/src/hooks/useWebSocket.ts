'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameMessage } from '@/types/game'

// تحديد الرابط تلقائياً بناءً على بيئة التشغيل (محلي أو رندر)
const getWsUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.host
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'ws://localhost:8000'
    }
    // إذا كان الموقع يعمل على رندر، استخدم نفس النطاق الحالي للباك إند أو الرابط المباشر
    return process.env.NEXT_PUBLIC_WS_URL || `wss://${host}`
  }
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
}

interface UseWebSocketProps {
  sessionId: string
  playerId: string
  onMessage?: (message: GameMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

export const useWebSocket = ({
  sessionId,
  playerId,
  onMessage,
  onConnect,
  onDisconnect,
}: UseWebSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Connect to WebSocket
  useEffect(() => {
    if (!sessionId || !playerId) return

    const connectSocket = async () => {
      try {
        const baseUrl = getWsUrl()
        const protocol = baseUrl.startsWith('https') || baseUrl.startsWith('wss') ? 'wss' : 'ws'
        const host = baseUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '')
        const wsUrl = `${protocol}://${host}/api/ws/game/${sessionId}/${playerId}`
        
        console.log('[WebSocket] Connecting to:', wsUrl)
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log('[WebSocket] ✅ Connected')
          setIsConnected(true)
          setError(null)
          onConnect?.()
        }
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            console.log('[WebSocket] 📨 Message:', message.type)
            onMessage?.(message)
          } catch (err) {
            console.error('[WebSocket] ❌ Parse error:', err)
          }
        }
        
        ws.onerror = (event) => {
          const errorMsg = 'WebSocket connection error'
          console.error('[WebSocket] ❌', errorMsg, event)
          setError(errorMsg)
        }
        
        ws.onclose = () => {
          console.log('[WebSocket] ❌ Disconnected')
          setIsConnected(false)
          onDisconnect?.()
        }
        
        socketRef.current = ws
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Connection failed'
        setError(errorMsg)
        console.error('[WebSocket] Connection error:', err)
      }
    }

    connectSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [sessionId, playerId, onMessage, onConnect, onDisconnect])

  // Send message
  const send = useCallback((message: GameMessage) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(message))
      console.log('[WebSocket] 📤 Sent:', message.type)
    } else {
      console.warn('[WebSocket] ⚠️ Not connected - message queued:', message.type)
    }
  }, [isConnected])

  return { isConnected, error, send }
}
