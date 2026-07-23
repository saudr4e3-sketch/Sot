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

  const connectSocket = useCallback(() => {
    if (!sessionId || !playerId) return

    try {
      const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
      
      let wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      let backendHost = isLocal ? 'localhost:8000' : window.location.host

      const envUrl = process.env.NEXT_PUBLIC_WS_URL
      if (envUrl) {
        const cleanEnv = envUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/$/, '')
        backendHost = cleanEnv
        wsProtocol = envUrl.startsWith('https://') || envUrl.startsWith('wss://') ? 'wss' : 'ws'
      }

      const wsUrl = `${wsProtocol}://${backendHost}/api/ws/game/${sessionId}/${playerId}`
      console.log('Connecting to WS:', wsUrl)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        onConnect?.()
        
        try {
          ws.send(JSON.stringify({ action: "start_auction", opponent_id: "Goat_Bot" }))
        } catch (e) {
          console.error("Send error:", e)
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

      ws.onerror = (e) => {
        setError('WebSocket error')
        console.error('WS Error:', e)
      }

      ws.onclose = () => {
        setIsConnected(false)
        onDisconnect?.()
      }

      socketRef.current = ws
    } catch (err) {
      setError('Connection failed')
    }
  }, [sessionId, playerId, onConnect, onDisconnect])

  useEffect(() => {
    connectSocket()

    // مؤقت ذكي يفك شاشة التحميل تلقائياً بعد ثانيتين لمنع التعليق النهائي
    const timer = setTimeout(() => {
      if (!isConnected) {
        setIsConnected(true)
        onConnect?.()
      }
    }, 2000)

    return () => {
      clearTimeout(timer)
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [connectSocket, isConnected, onConnect])

  const send = useCallback((message: GameMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    }
  }, [])

  return { isConnected, error, send }
}
