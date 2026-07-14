'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameMessage } from '@/types/game'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000'

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
        // WebSocket connection for real-time game communication
        const protocol = WS_URL.includes('localhost') ? 'ws' : 'wss'
        const host = WS_URL.replace(/^https?:\/\//, '')
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
