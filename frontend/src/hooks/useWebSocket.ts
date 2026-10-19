'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface GameMessage {
  type?: string
  action?: string
  data?: any
  state?: any
  player_id?: string
  amount?: number
  session_id?: string
  opponent_id?: string
  room_pin?: string
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
  auction_state?: any
  opponent_info?: any
  match_result?: any
  match_weights?: {
    rating_weight: number
    tactic_weight: number
    momentum_weight: number
  }
  mystery_box?: {
    id: string
    name: string
    position: string
    rating: number
    rarity: 'Weak' | 'Medium' | 'Legendary'
  }
  acquired_player_ids?: string[]
  auction_sequence?: string[]
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

const DEFAULT_AUCTION_SEQUENCE = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'MGR']
const DEFAULT_MATCH_WEIGHTS = {
  rating_weight: 0.40,
  tactic_weight: 0.30,
  momentum_weight: 0.30
}

const normalizeWsBase = (base?: string): string => {
  if (!base) return 'ws://localhost:8000'
  const trimmed = base.trim().replace(/\/+$/g, '').replace(/\/api\/?$/i, '')
  if (!trimmed) return 'ws://localhost:8000'

  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) return trimmed
  if (trimmed.startsWith('https://')) return `wss://${trimmed.replace(/^https:\/\//, '')}`
  if (trimmed.startsWith('http://')) return `ws://${trimmed.replace(/^http:\/\//, '')}`
  return `ws://${trimmed}`
}

export const useWebSocket = ({
  sessionId,
  playerId,
  onMessage,
  onConnect,
  onDisconnect,
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0)
  const [connectionHealth, setConnectionHealth] = useState<'healthy' | 'degraded' | 'critical' | 'offline'>('offline')

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
  const pendingBidsRef = useRef<Map<string, { amount: number; timestamp: number }>>(new Map())
  const acquiredPlayerIdsRef = useRef<Set<string>>(new Set())

  onMessageRef.current = onMessage
  onConnectRef.current = onConnect
  onDisconnectRef.current = onDisconnect

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

  const buildWebSocketUrl = useCallback((): string => {
    if (!sessionId || !playerId) return ''

    const envUrl = process.env.NEXT_PUBLIC_WS_URL
    const wsBase = normalizeWsBase(envUrl)

    return `${wsBase}/api/ws/game/${sessionId}/${playerId}`
  }, [sessionId, playerId])

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

  const processMessageForDuplicates = useCallback((message: GameMessage): GameMessage => {
    if (message.acquired_player_ids && Array.isArray(message.acquired_player_ids)) {
      message.acquired_player_ids.forEach((id: string) => {
        acquiredPlayerIdsRef.current.add(id)
      })
    }

    if (message.auction_state?.current_player?.card_id) {
      const cardId = message.auction_state.current_player.card_id
      if (acquiredPlayerIdsRef.current.has(cardId)) {
        console.warn(`[WebSocket] Duplicate player detected: ${cardId} - Requesting new player`)
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          try {
            socketRef.current.send(JSON.stringify({
              type: 'request_new_player',
              action: 'request_new_player',
              session_id: sessionId,
              player_id: playerId,
              position: message.auction_state.current_position,
              exclude_ids: Array.from(acquiredPlayerIdsRef.current)
            }))
          } catch (sendError) {
            console.error('[WebSocket] Failed to request new player:', sendError)
          }
        }
      } else if (cardId) {
        acquiredPlayerIdsRef.current.add(cardId)
      }
    }

    return message
  }, [sessionId, playerId])

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

    const wsUrl = buildWebSocketUrl()
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
    }

    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return

      let parsedMessage = parseIncomingMessage(event)
      if (!parsedMessage) return

      parsedMessage = processMessageForDuplicates(parsedMessage)

      lastSuccessfulMessageRef.current = Date.now()
      missedHeartbeatsRef.current = 0

      if (parsedMessage.type === 'pong') {
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current)
          pongTimeoutRef.current = null
        }
        updateConnectionHealth()
        return
      }

      if (parsedMessage.type === 'error') {
        setError(parsedMessage.message || parsedMessage.error || 'Unknown server error')
      }

      if (isReconnectingRef.current) {
        if (messageBufferRef.current.length < MESSAGE_BUFFER_MAX_SIZE) {
          messageBufferRef.current.push(parsedMessage)
        }
        return
      }

      onMessageRef.current?.(parsedMessage)
      updateConnectionHealth()
    }

    ws.onerror = (event: Event) => {
      console.error('[WebSocket] Error event:', event)
      if (isMountedRef.current) {
        setError('WebSocket connection error')
        setConnectionHealth('degraded')
      }
    }

    ws.onclose = (event: CloseEvent) => {
      if (!isMountedRef.current) return

      console.log(`[WebSocket] Closed - Code: ${event.code}, Reason: ${event.reason}`)
      clearAllTimers()

      if (isMountedRef.current) {
        setIsConnected(false)
        setConnectionHealth('offline')
      }

      onDisconnectRef.current?.()

      if (!isManuallyClosedRef.current) {
        isReconnectingRef.current = true
        scheduleReconnect()
      }
    }
  }, [sessionId, playerId, buildWebSocketUrl, clearAllTimers, startHeartbeat, parseIncomingMessage, processMessageForDuplicates, updateConnectionHealth])

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached')
      setError('Unable to establish connection after maximum attempts')
      setConnectionHealth('offline')
      return
    }

    const jitter = Math.floor(Math.random() * RECONNECT_JITTER_MS)
    const delay = currentReconnectDelayRef.current + jitter
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

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    currentReconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS
    setConnectionAttempts(0)
    setError(null)
    isReconnectingRef.current = true
    closeSocket()
    isManuallyClosedRef.current = false
    connectSocket()
  }, [closeSocket, connectSocket])

  const send = useCallback((message: Partial<GameMessage>) => {
    if (message.type === 'init_bot_match' || message.type === 'start_auction') {
      message.auction_sequence = DEFAULT_AUCTION_SEQUENCE
      message.match_weights = DEFAULT_MATCH_WEIGHTS
    }

    if (message.type === 'request_new_player' || message.type === 'start_auction') {
      message.exclude_ids = Array.from(acquiredPlayerIdsRef.current)
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const payload = JSON.stringify(message)
        socketRef.current.send(payload)
        lastSuccessfulMessageRef.current = Date.now()

        if (message.type === 'place_bid' && message.amount) {
          const bidKey = `${playerId}_${message.amount}`
          pendingBidsRef.current.set(bidKey, {
            amount: message.amount,
            timestamp: Date.now()
          })
        }
      } catch (sendError) {
        console.error('[WebSocket] Send failed:', sendError)
        setError('Failed to send message')

        if (message.type === 'place_bid' && message.amount) {
          const bidKey = `${playerId}_${message.amount}`
          pendingBidsRef.current.set(bidKey, {
            amount: message.amount,
            timestamp: Date.now()
          })
        }
      }
    } else {
      console.warn('[WebSocket] Cannot send - socket not open. ReadyState:', socketRef.current?.readyState)
      if (message.type && ['place_bid', 'skip_bid', 'start_match', 'init_bot_match', 'join_room'].includes(message.type)) {
        if (messageBufferRef.current.length < MESSAGE_BUFFER_MAX_SIZE) {
          messageBufferRef.current.push(message as GameMessage)
        }

        if (message.type === 'place_bid' && message.amount) {
          const bidKey = `${playerId}_${message.amount}`
          pendingBidsRef.current.set(bidKey, {
            amount: message.amount,
            timestamp: Date.now()
          })
        }
      }
    }
  }, [playerId])

  useEffect(() => {
    isMountedRef.current = true
    isManuallyClosedRef.current = false
    reconnectAttemptsRef.current = 0
    currentReconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS
    messageBufferRef.current = []
    pendingBidsRef.current = new Map()
    acquiredPlayerIdsRef.current = new Set()

    connectSocket()

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
      pendingBidsRef.current.clear()
      acquiredPlayerIdsRef.current.clear()
    }
  }, [sessionId, playerId, connectSocket, clearAllTimers, closeSocket, updateConnectionHealth])

  return {
    isConnected,
    error,
    send,
    reconnect,
    connectionAttempts,
    connectionHealth,
  }
}
