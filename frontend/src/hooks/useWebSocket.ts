'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameMessage } from '@/types/game'

export const useWebSocket = ({
  sessionId,
  playerId,
  onMessage,
  onConnect,
  onDisconnect,
}: {
  sessionId: string
  playerId: string
  onMessage?: (message: GameMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
}) => {
  const socketRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId || !playerId) return

    const connectSocket = () => {
      try {
        // تحديد الرابط والبروتوكول تلقائياً بما يتوافق مع Render وجلساطه الآمنة
        const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        
        let wsProtocol = isLocal ? 'ws' : 'wss'
        let backendHost = isLocal ? 'localhost:8000' : window.location.host

        // إذا كان هناك متغير بيئة مخصص للباك إند
        const envUrl = process.env.NEXT_PUBLIC_WS_URL
        if (envUrl) {
          if (envUrl.startsWith('https://')) {
            backendHost = envUrl.replace('https://', '')
            wsProtocol = 'wss'
          } else if (envUrl.startsWith('http://')) {
            backendHost = envUrl.replace('http://', '')
            wsProtocol = 'ws'
          } else if (envUrl.startsWith('wss://') || envUrl.startsWith('ws://')) {
            // لو كان مكتوب جاهز بالبروتوكول
            const wsUrlFull = `${envUrl}/api/ws/game/${sessionId}/${playerId}`
            console.log('[WebSocket] Connecting to:', wsUrlFull)
            var ws = new WebSocket(wsUrlFull)
            setupWs(ws)
            return
          }
        }

        const wsUrl = `${wsProtocol}://${backendHost}/api/ws/game/${sessionId}/${playerId}`
        console.log('[WebSocket] Connecting to:', wsUrl)
        var ws = new WebSocket(wsUrl)
        setupWs(ws)

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Connection failed'
        setError(errorMsg)
        console.error('[WebSocket] Connection error:', err)
      }
    }

    const setupWs = (ws: WebSocket) => {
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
        console.error('[WebSocket] ❌ Error event:', event)
        setError('WebSocket connection error')
      }
      
      ws.onclose = () => {
        console.log('[WebSocket] ❌ Disconnected')
        setIsConnected(false)
        onDisconnect?.()
      }
      
      socketRef.current = ws
    }

    connectSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [sessionId, playerId, onMessage, onConnect, onDisconnect])

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
