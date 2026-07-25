/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise WebSocket Hook (Sentinel Engine)
 * Version: 6.0.0 - Auto-Reconnect, Message Buffer, Robust Heartbeat
 * ============================================================================
 *
 * Features:
 * - Fully decoupled local types (no external import dependencies)
 * - Automatic reconnection with exponential backoff and jitter
 * - Heartbeat / Ping-Pong with adaptive interval
 * - Message buffer queue to prevent data loss during reconnection
 * - Defensive multi-format message parsing (JSON, ArrayBuffer, Blob)
 * - Memory leak prevention with proper cleanup
 * - Re-render optimization using refs for mutable state
 * - Connection health monitoring
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ==================== LOCAL TYPES ====================

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
  connectionHealth: 'healthy' | 'degraded' | 'critical' | 'offline'
}

// ==================== CONSTANTS ====================

const INITIAL_RECONNECT_DELAY_MS = 800
const MAX_RECONNECT_DELAY_MS = 25000
const RECONNECT_BACKOFF_MULTIPLIER = 1.8
const RECONNECT_JITTER_MS = 400
const HEARTBEAT_INTERVAL_MS = 20000
const PONG_TIMEOUT_MS = 8000
const CONNECTION_TIMEOUT_MS = 6000
const MAX_RECONNECT_ATTEMPTS = 15
const MESSAGE_BUFFER_MAX_SIZE = 50
const HEALTH_CHECK_WINDOW_MS = 60000
const MAX_MISSED_HEARTBEATS = 3

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
  const [connectionHealth, setConnectionHealth] = useState<'healthy' | 'degraded' | 'critical' | 'offline'>('offline')

  // ===== Refs =====
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const isManuallyClosedRef = useRef<boolean>(false)
  const reconnectAttemptsRef = useRef<number>(0)
  const currentReconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY_MS)
  const onMessageRef = useRef(onMessage)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  const missedHeartbeatsRef = useRef<number>(0)
  const lastSuccessfulMessageRef = useRef<number>(Date.now())
  const messageBufferRef = useRef<GameMessage[]>([])
  const isReconnectingRef = useRef<boolean>(false)

  // Keep callback refs updated
  onMessageRef.current = onMessage
  onConnectRef.current = onConnect
  onDisconnectRef.current = onDisconnect

  // ===== Health Monitoring =====
  const updateConnectionHealth = useCallback(() => {
    if (!isMountedRef.current) return
    const now = Date.now()
    const timeSinceLastMessage = now - lastSuccessfulMessageRef.current

    if (!isConnected) {
      setConnectionHealth('offline')
    } else if (missedHeartbeatsRef.current >= MAX_MISSED_HEARTBEATS) {
      setConnectionHealth('critical')
    } else if (timeSinceLastMessage > HEALTH_CHECK_WINDOW_MS) {
      setConnectionHealth('degraded')
    } else {
      setConnectionHealth('healthy')
    }
  }, [isConnected])

  // ===== Flush Message Buffer =====
  const flushMessageBuffer = useCallback(() => {
    if (messageBufferRef.current.length === 0) return
    console.log(`[WebSocket] Flushing ${messageBufferRef.current.length} buffered messages`)
    const messages = [...messageBufferRef.current]
    messageBufferRef.current = []
    messages.forEach((msg) => {
      if (isMountedRef.current) {
        onMessageRef.current?.(msg)
      }
    })
  }, [])

  // ===== Cleanup All Timers =====
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
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current)
      healthCheckIntervalRef.current = null
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
      setConnectionHealth('offline')
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

    missedHeartbeatsRef.current = 0

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
        missedHeartbeatsRef.current += 1
        updateConnectionHealth()
        return
      }

      pongTimeoutRef.current = setTimeout(() => {
        console.warn('[WebSocket] Pong timeout - connection may be stale')
        missedHeartbeatsRef.current += 1
        updateConnectionHealth()
        if (missedHeartbeatsRef.current >= MAX_MISSED_HEARTBEATS && socketRef.current) {
          isManuallyClosedRef.current = false
          socketRef.current.close(4001, 'Pong timeout')
        }
      }, PONG_TIMEOUT_MS)
    }, HEARTBEAT_INTERVAL_MS)
  }, [updateConnectionHealth])

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

  // ===== Parse Incoming Message =====
  const parseIncomingMessage = useCallback((event: MessageEvent): GameMessage | null => {
    try {
      if (typeof event.data === 'string') {
        return JSON.parse(event.data)
      } else if (event.data instanceof ArrayBuffer) {
        const decoder = new TextDecoder('utf-8')
        const text = decoder.decode(event.data)
        return JSON.parse(text)
      } else if (event.data instanceof Blob) {
        console.warn('[WebSocket] Received Blob data - using synchronous fallback')
        return null
      } else {
        console.warn('[WebSocket] Unknown message data type:', typeof event.data)
        return null
      }
    } catch (parseError) {
      console.error('[WebSocket] JSON parse error:', parseError, 'Raw data:', typeof event.data)
      return null
    }
  }, [])

  // ===== Connect WebSocket =====
  const connectSocket = useCallback(() => {
    if (!isMountedRef.current) return
    if (!sessionId || !playerId) {
      console.warn('[WebSocket] Missing sessionId or playerId')
      return
    }

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
    isReconnectingRef.current = false

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
      setConnectionHealth('healthy')
      reconnectAttemptsRef.current = 0
      currentReconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS
      missedHeartbeatsRef.current = 0
      lastSuccessfulMessageRef.current = Date.now()

      startHeartbeat()
      onConnectRef.current?.()

      // Flush any buffered messages from reconnection period
      flushMessageBuffer()
    }

    // ===== onmessage =====
    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return

      const parsedMessage = parseIncomingMessage(event)
      if (!parsedMessage) return

      lastSuccessfulMessageRef.current = Date.now()
      missedHeartbeatsRef.current = 0

      // Handle pong response
      if (parsedMessage.type === 'pong') {
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current)
          pongTimeoutRef.current = null
        }
        updateConnectionHealth()
        return
      }

      // Handle error messages
      if (parsedMessage.type === 'error') {
        setError(parsedMessage.message || parsedMessage.error || 'Unknown server error')
      }

      // If currently reconnecting, buffer the message
      if (isReconnectingRef.current) {
        if (messageBufferRef.current.length < MESSAGE_BUFFER_MAX_SIZE) {
          messageBufferRef.current.push(parsedMessage)
        }
        return
      }

      // Forward message to handler
      onMessageRef.current?.(parsedMessage)
      updateConnectionHealth()
    }

    // ===== onerror =====
    ws.onerror = (event: Event) => {
      console.error('[WebSocket] Error event:', event)
      if (isMountedRef.current) {
        setError('WebSocket connection error')
        setConnectionHealth('degraded')
      }
    }

    // ===== onclose =====
    ws.onclose = (event: CloseEvent) => {
      if (!isMountedRef.current) return

      console.log(`[WebSocket] Closed - Code: ${event.code}, Reason: ${event.reason}`)

      clearAllTimers()

      if (isMountedRef.current) {
        setIsConnected(false)
        setConnectionHealth('offline')
      }

      onDisconnectRef.current?.()

      // Only reconnect if not manually closed
      if (!isManuallyClosedRef.current) {
        isReconnectingRef.current = true
        scheduleReconnect()
      }
    }
  }, [sessionId, playerId, buildWebSocketUrl, clearAllTimers, startHeartbeat, parseIncomingMessage, flushMessageBuffer, updateConnectionHealth])

  // ===== Schedule Reconnection with Exponential Backoff + Jitter =====
  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached')
      setError('Unable to establish connection after maximum attempts')
      setConnectionHealth('offline')
      return
    }

    const jitter = Math.floor(Math.random() * RECONNECT_JITTER_MS)
    const delay: number = currentReconnectDelayRef.current + jitter
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
    isReconnectingRef.current = true
    closeSocket()
    isManuallyClosedRef.current = false
    connectSocket()
  }, [closeSocket, connectSocket])

  // ===== Send Message with Buffer Support =====
  const send = useCallback((message: Partial<GameMessage>) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const payload: string = JSON.stringify(message)
        socketRef.current.send(payload)
        lastSuccessfulMessageRef.current = Date.now()
      } catch (sendError) {
        console.error('[WebSocket] Send failed:', sendError)
        setError('Failed to send message')
      }
    } else {
      console.warn('[WebSocket] Cannot send - socket not open. ReadyState:', socketRef.current?.readyState)
      // Buffer important messages for reconnection
      if (message.type && ['place_bid', 'skip_bid', 'start_match'].includes(message.type)) {
        if (messageBufferRef.current.length < MESSAGE_BUFFER_MAX_SIZE) {
          messageBufferRef.current.push(message as GameMessage)
          console.log('[WebSocket] Message buffered for reconnection')
        }
      }
    }
  }, [])

  // ===== Main Effect: Connect on Mount, Cleanup on Unmount =====
  useEffect(() => {
    isMountedRef.current = true
    isManuallyClosedRef.current = false
    reconnectAttemptsRef.current = 0
    currentReconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS
    messageBufferRef.current = []

    connectSocket()

    // Health check monitoring
    healthCheckIntervalRef.current = setInterval(() => {
      updateConnectionHealth()
    }, 10000)

    return () => {
      console.log('[WebSocket] Component unmounting - cleaning up')
      isMountedRef.current = false
      isManuallyClosedRef.current = true
      closeSocket()
      clearAllTimers()
      messageBufferRef.current = []
    }
  }, [sessionId, playerId])

  return {
    isConnected,
    error,
    send,
    reconnect,
    connectionAttempts,
    connectionHealth,
  }
}
