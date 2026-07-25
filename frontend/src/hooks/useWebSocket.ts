/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise WebSocket Hook
 * Version: 5.0.0 - Automatic Reconnection, Heartbeat, Decoupled Types
 * ============================================================================
 *
 * Features:
 * - Fully decoupled local types (no external import dependencies)
 * - Automatic reconnection with exponential backoff strategy
 * - Heartbeat / Ping-Pong keep-alive mechanism
 * - Defensive JSON parsing and error handling
 * - Memory leak prevention with proper cleanup
 * - Re-render optimization using refs for mutable state
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ==================== LOCAL TYPES (Decoupled from Global Types) ====================

interface GameMessage {
  type?: string
  action?: string
  data?: any
  state?: any
  player_id?: string
  amount?: number
  session_id?: string
  opponent_id?: string
  error?: string
  message?: string
  timestamp?: number | string
  status_code?: number
  request_id?: string
  reason?: string
  timer?: {
    remaining: number
    duration: number
    status: string
    current_player_id?: string
  }
  bot_name?: string
  bot_version?: string
  bot_strategy?: string
  winner_id?: string
  commentary?: any[]
  [key: string]: any
}

interface UseWebSocketOptions {
  sessionId: string
  playerId: string
  onMessage?: (message: GameMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

interface UseWebSocketReturn {
  isConnected: boolean
  error: string | null
  send: (message: Partial<GameMessage>) => void
  reconnect: () => void
  connectionAttempts: number
}

// ==================== CONSTANTS ====================

const INITIAL_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30000
const RECONNECT_BACKOFF_MULTIPLIER = 2
const HEARTBEAT_INTERVAL_MS = 25000
const PONG_TIMEOUT_MS = 10000
const CONNECTION_TIMEOUT_MS = 5000
const MAX_RECONNECT_ATTEMPTS = 10

// ==================== HOOK IMPLEMENTATION ====================

export const useWebSocket = ({
  sessionId,
  playerId,
  onMessage,
  onConnect,
  onDisconnect,
}: UseWebSocketOptions): UseWebSocketReturn => {
  // ===== State =====
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0)

  // ===== Refs (Mutable values that do not trigger re-renders) =====
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const isManuallyClosedRef = useRef<boolean>(false)
  const reconnectAttemptsRef = useRef<number>(0)
  const currentReconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY_MS)
  const onMessageRef = useRef(onMessage)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)

  // Keep callback refs updated without triggering re-renders
  onMessageRef.current = onMessage
  onConnectRef.current = onConnect
  onDisconnectRef.current = onDisconnect

  // ===== Cleanup All Timers & Intervals =====
  const clearAllTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current)
      pongTimeoutRef.current = null
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
  }, [])

  // ===== Close Socket Safely =====
  const closeSocket = useCallback(() => {
    clearAllTimers()
    if (socketRef.current) {
      isManuallyClosedRef.current = true
      socketRef.current.onopen = null
      socketRef.current.onmessage = null
      socketRef.current.onerror = null
      socketRef.current.onclose = null
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close(1000, 'Client disconnect')
      }
      socketRef.current = null
    }
    if (isMountedRef.current) {
      setIsConnected(false)
    }
  }, [clearAllTimers])

  // ===== Start Heartbeat =====
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current)
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        return
      }

      try {
        socketRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }))
      } catch (sendError) {
        console.error('[WebSocket] Heartbeat send failed:', sendError)
        return
      }

      pongTimeoutRef.current = setTimeout(() => {
        console.warn('[WebSocket] Pong timeout - connection may be stale')
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          isManuallyClosedRef.current = false
          socketRef.current.close(4001, 'Pong timeout')
        }
      }, PONG_TIMEOUT_MS)
    }, HEARTBEAT_INTERVAL_MS)
  }, [])

  // ===== Build WebSocket URL =====
  const buildWebSocketUrl = useCallback((): string => {
    if (!sessionId || !playerId) {
      return ''
    }

    const isLocal: boolean = typeof window !== 'undefined' && (
      window.location.hostname.includes('localhost') || 
      window.location.hostname.includes('127.0.0.1')
    )

    let wsProtocol: string = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'
    let backendHost: string = isLocal ? 'localhost:8000' : (typeof window !== 'undefined' ? window.location.host : '')

    const envUrl: string | undefined = process.env.NEXT_PUBLIC_WS_URL
    if (envUrl) {
      const cleanEnv: string = envUrl
        .replace(/^https?:\/\//, '')
        .replace(/^wss?:\/\//, '')
        .replace(/\/$/, '')
      backendHost = cleanEnv
      wsProtocol = envUrl.startsWith('https://') || envUrl.startsWith('wss://') ? 'wss' : 'ws'
    }

    return `${wsProtocol}://${backendHost}/api/ws/game/${sessionId}/${playerId}`
  }, [sessionId, playerId])

  // ===== Connect WebSocket =====
  const connectSocket = useCallback(() => {
    if (!isMountedRef.current) return
    if (!sessionId || !playerId) {
      console.warn('[WebSocket] Missing sessionId or playerId')
      return
    }

    // Close existing socket before creating new one
    if (socketRef.current) {
      socketRef.current.onopen = null
      socketRef.current.onmessage = null
      socketRef.current.onerror = null
      socketRef.current.onclose = null
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close(1000, 'Reconnecting')
      }
      socketRef.current = null
    }

    clearAllTimers()

    const wsUrl: string = buildWebSocketUrl()
    if (!wsUrl) {
      setError('Invalid WebSocket URL')
      return
    }

    console.log(`[WebSocket] Connecting to: ${wsUrl} (Attempt: ${reconnectAttemptsRef.current + 1})`)

    let ws: WebSocket
    try {
      ws = new WebSocket(wsUrl)
    } catch (constructorError) {
      console.error('[WebSocket] Constructor failed:', constructorError)
      setError('Failed to create WebSocket connection')
      scheduleReconnect()
      return
    }

    socketRef.current = ws
    isManuallyClosedRef.current = false

    // Connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.warn('[WebSocket] Connection timeout')
        ws.close(4002, 'Connection timeout')
      }
    }, CONNECTION_TIMEOUT_MS)

    // ===== onopen =====
    ws.onopen = () => {
      if (!isMountedRef.current) return

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      console.log('[WebSocket] Connected successfully')
      setIsConnected(true)
      setError(null)
      setConnectionAttempts(0)
      reconnectAttemptsRef.current = 0
      currentReconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS

      startHeartbeat()
      onConnectRef.current?.()
    }

    // ===== onmessage =====
    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return

      let parsedMessage: GameMessage

      try {
        if (typeof event.data === 'string') {
          parsedMessage = JSON.parse(event.data)
        } else if (event.data instanceof ArrayBuffer) {
          const decoder = new TextDecoder('utf-8')
          const text = decoder.decode(event.data)
          parsedMessage = JSON.parse(text)
        } else if (event.data instanceof Blob) {
          const reader = new FileReader()
          reader.onload = () => {
            if (reader.result && isMountedRef.current) {
              try {
                const blobMessage: GameMessage = JSON.parse(reader.result as string)
                onMessageRef.current?.(blobMessage)
              } catch (blobParseError) {
                console.error('[WebSocket] Blob parse error:', blobParseError)
              }
            }
          }
          reader.readAsText(event.data)
          return
        } else {
          console.warn('[WebSocket] Unknown message data type:', typeof event.data)
          return
        }
      } catch (parseError) {
        console.error('[WebSocket] JSON parse error:', parseError, 'Raw data:', event.data)
        return
      }

      // Handle pong response
      if (parsedMessage.type === 'pong') {
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current)
          pongTimeoutRef.current = null
        }
        return
      }

      // Forward message to handler
      if (parsedMessage.type === 'error') {
        setError(parsedMessage.message || parsedMessage.error || 'Unknown server error')
      }

      onMessageRef.current?.(parsedMessage)
    }

    // ===== onerror =====
    ws.onerror = (event: Event) => {
      console.error('[WebSocket] Error event:', event)
      if (isMountedRef.current) {
        setError('WebSocket connection error')
      }
    }

    // ===== onclose =====
    ws.onclose = (event: CloseEvent) => {
      if (!isMountedRef.current) return

      console.log(`[WebSocket] Closed - Code: ${event.code}, Reason: ${event.reason}`)

      clearAllTimers()

      if (isMountedRef.current) {
        setIsConnected(false)
      }

      onDisconnectRef.current?.()

      // Only reconnect if not manually closed and not a normal closure
      if (!isManuallyClosedRef.current && event.code !== 1000) {
        scheduleReconnect()
      }
    }
  }, [sessionId, playerId, buildWebSocketUrl, clearAllTimers, startHeartbeat])

  // ===== Schedule Reconnection with Exponential Backoff =====
  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached')
      setError('Unable to establish connection after multiple attempts')
      return
    }

    const delay: number = currentReconnectDelayRef.current
    console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (Attempt: ${reconnectAttemptsRef.current + 1})`)

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return
      reconnectAttemptsRef.current += 1
      setConnectionAttempts(reconnectAttemptsRef.current)
      currentReconnectDelayRef.current = Math.min(
        currentReconnectDelayRef.current * RECONNECT_BACKOFF_MULTIPLIER,
        MAX_RECONNECT_DELAY_MS
      )
      connectSocket()
    }, delay)
  }, [connectSocket])

  // ===== Public Reconnect Function =====
  const reconnect = useCallback(() => {
    console.log('[WebSocket] Manual reconnect triggered')
    reconnectAttemptsRef.current = 0
    currentReconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS
    setConnectionAttempts(0)
    setError(null)
    closeSocket()
    isManuallyClosedRef.current = false
    connectSocket()
  }, [closeSocket, connectSocket])

  // ===== Send Message =====
  const send = useCallback((message: Partial<GameMessage>) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const payload: string = JSON.stringify(message)
        socketRef.current.send(payload)
      } catch (sendError) {
        console.error('[WebSocket] Send failed:', sendError)
        setError('Failed to send message')
      }
    } else {
      console.warn('[WebSocket] Cannot send - socket not open. ReadyState:', socketRef.current?.readyState)
    }
  }, [])

  // ===== Main Effect: Connect on Mount, Cleanup on Unmount =====
  useEffect(() => {
    isMountedRef.current = true
    isManuallyClosedRef.current = false
    reconnectAttemptsRef.current = 0
    currentReconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS

    connectSocket()

    return () => {
      console.log('[WebSocket] Component unmounting - cleaning up')
      isMountedRef.current = false
      isManuallyClosedRef.current = true
      closeSocket()
      clearAllTimers()
    }
  }, [sessionId, playerId])

  return {
    isConnected,
    error,
    send,
    reconnect,
    connectionAttempts,
  }
}
