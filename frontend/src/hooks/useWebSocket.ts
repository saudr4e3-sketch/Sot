'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameMessage } from '@/types/game'

interface UseWebSocketOptions {
  sessionId: string
  playerId: string
  onMessage?: (message: GameMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

export const useWebSocket = ({
  sessionId,
  playerId,
  onMessage,
  onConnect,
  onDisconnect,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
}: UseWebSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0)
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManuallyClosedRef = useRef<boolean>(false)

  const connectSocket = useCallback(() => {
    if (!sessionId || !playerId) {
      console.warn('[WebSocket Hook] ⚠️ Missing sessionId or playerId, skipping connection.')
      return
    }

    try {
      isManuallyClosedRef.current = false
      const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
      
      let wsProtocol = isLocal ? 'ws' : 'wss'
      let backendHost = isLocal ? 'localhost:8000' : window.location.host

      const envUrl = process.env.NEXT_PUBLIC_WS_URL
      if (envUrl) {
        if (envUrl.startsWith('https://')) {
          backendHost = envUrl.replace('https://', '')
          wsProtocol = 'wss'
        } else if (envUrl.startsWith('http://')) {
          backendHost = envUrl.replace('http://', '')
          wsProtocol = 'ws'
        } else if (envUrl.startsWith('wss://') || envUrl.startsWith('ws://')) {
          const wsUrlFull = `${envUrl}/api/ws/game/${sessionId}/${playerId}`
          console.log('[WebSocket Hook] 🔌 Connecting to custom full URL:', wsUrlFull)
          const ws = new WebSocket(wsUrlFull)
          setupEventHandlers(ws)
          return
        }
      }

      const wsUrl = `${wsProtocol}://${backendHost}/api/ws/game/${sessionId}/${playerId}`
      console.log('[WebSocket Hook] 🔌 Connecting to standard URL:', wsUrl)
      const ws = new WebSocket(wsUrl)
      setupEventHandlers(ws)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown connection error'
      setError(errorMsg)
      console.error('[WebSocket Hook] ❌ Connection execution failed:', err)
    }
  }, [sessionId, playerId])

  const setupEventHandlers = (ws: WebSocket) => {
    ws.onopen = () => {
      console.log('[WebSocket Hook] ✅ Connection established successfully.')
      setIsConnected(true)
      setError(null)
      setConnectionAttempts(0)
      onConnect?.()
    }
    
    ws.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data)
        console.log('[WebSocket Hook] 📨 Message received:', message.type)
        onMessage?.(message)
      } catch (err) {
        console.error('[WebSocket Hook] ❌ Failed to parse incoming message JSON:', err)
      }
    }
    
    ws.onerror = (event) => {
      console.error('[WebSocket Hook] ❌ Network or protocol error event:', event)
      setError('WebSocket connection encountered an error.')
    }
    
    ws.onclose = (event) => {
      console.log(`[WebSocket Hook] ❌ Connection closed. Code: ${event.code}, Reason: ${event.reason}`)
      setIsConnected(false)
      onDisconnect?.()

      // محاولة إعادة الاتصال التلقائي إذا لم يتم الإغلاق بشكل يدوي
      if (!isManuallyClosedRef.current && connectionAttempts < reconnectAttempts) {
        console.log(`[WebSocket Hook] 🔄 Attempting to reconnect (${connectionAttempts + 1}/${reconnectAttempts})...`)
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionAttempts((prev) => prev + 1)
          connectSocket()
        }, reconnectInterval)
      }
    }
    
    socketRef.current = ws
  }

  useEffect(() => {
    connectSocket()

    return () => {
      isManuallyClosedRef.current = true
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current) {
        console.log('[WebSocket Hook] 🔌 Cleaning up and closing socket connection.')
        socketRef.current.close()
      }
    }
  }, [connectSocket])

  const send = useCallback((message: GameMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
      console.log('[WebSocket Hook] 📤 Message sent successfully:', message.type)
    } else {
      console.warn('[WebSocket Hook]رياضيات ⚠️ Cannot send message, socket is not open. Current state:', socketRef.current?.readyState)
    }
  }, [])

  return {
    isConnected,
    error,
    send,
    reconnect: connectSocket,
  }
}
