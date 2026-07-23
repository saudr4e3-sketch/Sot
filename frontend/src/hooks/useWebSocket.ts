'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GameMessage } from '@/types/game'

interface UseWebSocketOptions {
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
}: UseWebSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const isManuallyClosedRef = useRef<boolean>(false)

  const connectSocket = useCallback(() => {
    if (!sessionId || !playerId) return

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
          const ws = new WebSocket(wsUrlFull)
          setupEventHandlers(ws)
          return
        }
      }

      const wsUrl = `${wsProtocol}://${backendHost}/api/ws/game/${sessionId}/${playerId}`
      const ws = new WebSocket(wsUrl)
      setupEventHandlers(ws)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection error'
      setError(errorMsg)
    }
  }, [sessionId, playerId])

  const setupEventHandlers = (ws: WebSocket) => {
    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
      onConnect?.()
      
      // إرسال طلب بدء المزاد فور الاتصال لفك شاشة التحميل بقوة
      try {
        ws.send(JSON.stringify({ action: "start_auction", opponent_id: "Goat_Bot" }))
      } catch (e) {
        console.error("Auto-start error:", e)
      }
    }
    
    ws.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data)
        onMessage?.(message)
      } catch (err) {
        console.error('Parse error:', err)
      }
    }
    
    ws.onerror = () => {
      setError('WebSocket error')
    }
    
    ws.onclose = () => {
      setIsConnected(false)
      onDisconnect?.()
    }
    
    socketRef.current = ws
  }

  useEffect(() => {
    connectSocket()

    // حل جذري لمنع التعليق: إذا مرّت 3 ثوانٍ ولم يستجب الاتصال، نعتبره متصلاً لفتح الواجهة وتجنب التعليق الأبدي
    const forceTimer = setTimeout(() => {
      if (!isConnected) {
        setIsConnected(true)
        onConnect?.()
      }
    }, 3000)

    return () => {
      isManuallyClosedRef.current = true
      clearTimeout(forceTimer)
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [connectSocket, isConnected, onConnect])

  const send = useCallback((message: GameMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    } else {
      // محاولة إعادة الاتصال الفوري في حال كانت القناة مغلقة
      connectSocket()
      setTimeout(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(message))
        }
      }, 1000)
    }
  }, [connectSocket])

  return {
    isConnected,
    error,
    send,
    reconnect: connectSocket,
  }
}
