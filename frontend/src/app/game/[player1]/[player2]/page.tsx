/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Game Page Component
 * Architecture: Real-time WebSocket Auction & Match Simulation Hub
 * Developer: Saud Yahya Al-Faifi (Phone: 0535103986)
 * Version: 5.0.0 - Fully Compatible WebSocket Types, Defensive State, Robust UI
 * ============================================================================
 */

'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import AuctionTimer from '@/components/game/AuctionTimer'
import AuctionProgress from '@/components/game/AuctionProgress'
import CommentaryView from '@/components/game/CommentaryView'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { AlertCircle, Loader, Play, Trophy, ShieldCheck, Zap, Activity, Cpu, Coins, Wifi, WifiOff } from 'lucide-react'

// ============================================================================
// LOCAL TYPE DEFINITIONS (Decoupled to avoid import conflicts)
// ============================================================================

interface CurrentPlayerInfo {
  name: string
  position: string
  rating: number
  image_url?: string
  rarity?: string
  nationality?: string
  team?: string
  age?: number
}

interface BotInfo {
  id: string
  name: string
  version?: string
  budget: number
  total_budget: number
  cards_acquired: number
  current_mindset?: string
  risk_profile?: string
  is_bot: boolean
  team: any[]
}

interface AuctionState {
  session_id: string
  status: string
  current_position: string
  auction_index: number
  total_positions: number
  auction_sequence: string[]
  current_turn_player: string
  highest_bid: number
  highest_bidder: string | null
  timer_remaining: number
  player1_budget: number
  player2_budget: number
  player1_total_spent: number
  player2_total_spent: number
  player1_team: Record<string, any>
  player2_team: Record<string, any>
  opponent_info?: BotInfo
  bot_info?: BotInfo
  current_player?: CurrentPlayerInfo | null
  next_position?: string | null
  team1?: any[]
  team2?: any[]
  [key: string]: any
}

// ============================================================================
// UTILITY FUNCTIONS & CONSTANTS
// ============================================================================

const TOTAL_AUCTION_POSITIONS = 9
const DEFAULT_TIMER = 30
const PING_INTERVAL_MS = 20000
const FALLBACK_LOAD_DELAY_MS = 2500

const buildDefaultAuctionState = (sessionId: string, player1Id: string): AuctionState => {
  return {
    session_id: sessionId,
    status: 'bidding',
    timer_remaining: DEFAULT_TIMER,
    highest_bid: 0,
    highest_bidder: null,
    current_turn_player: player1Id,
    current_position: 'GK',
    auction_index: 0,
    total_positions: TOTAL_AUCTION_POSITIONS,
    auction_sequence: ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'MGR'],
    player1_team: {} as Record<string, any>,
    player2_team: {} as Record<string, any>,
    player1_budget: 100,
    player2_budget: 100,
    player1_total_spent: 0,
    player2_total_spent: 0,
    opponent_info: {
      id: 'Goat_Bot',
      name: 'GOAT-X',
      budget: 100,
      cards_acquired: 0,
      total_budget: 100,
      current_mindset: 'MASTERMIND',
      team: [],
      is_bot: true
    } as BotInfo,
    current_player: {
      rating: 90,
      name: 'Thibaut Courtois',
      position: 'GK',
      image_url: 'https://cdn.sofifa.net/players/210/257/25_120.png',
      rarity: 'Legendary'
    }
  } as AuctionState
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GamePage() {
  const params = useParams()
  const player1Id = (params?.player1 as string) || 'Player1'
  const player2Id = (params?.player2 as string) || 'Goat_Bot'

  const {
    auctionState,
    setAuctionState,
    setIsLoading,
    setError,
    error: storeError,
    isLoading,
  } = useGameStore()

  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [commentary, setCommentary] = useState<any[]>([])
  const [forceReady, setForceReady] = useState<boolean>(false)
  const [networkPing, setNetworkPing] = useState<number>(0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [clientLogs, setClientLogs] = useState<string[]>([])

  const lastAuctionStateRef = useRef<AuctionState | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentAuctionStateRef = useRef<AuctionState | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const isInitializedRef = useRef<boolean>(false)

  const addLog = useCallback((logText: string) => {
    if (!isMountedRef.current) return
    const timestamp = new Date().toLocaleTimeString()
    setClientLogs(prev => [`[${timestamp}] ${logText}`, ...prev.slice(0, 49)])
  }, [])

  // ..........................................................................
  // CORE: WebSocket Message Handler (accepts 'any' for maximum compatibility)
  // ..........................................................................
  const handleGameMessage = useCallback((rawMessage: any) => {
    if (!rawMessage || !isMountedRef.current) return

    const message = rawMessage as Record<string, any>
    const messageType = message.type || 'unknown'

    addLog(`📩 Server: ${messageType}`)

    const payload = message.data || message.state || message

    // Update state if auction_state is present
    if (payload && payload.auction_state) {
      const newState: AuctionState = {
        ...payload.auction_state,
        session_id: message.session_id || sessionId,
        timer_remaining: payload.timer?.remaining ?? DEFAULT_TIMER,
        opponent_info: payload.opponent_info || (payload.auction_state as any)?.opponent_info || {},
        current_turn_player: payload.auction_state.current_turn_player || player1Id,
      } as AuctionState

      if (JSON.stringify(newState) !== JSON.stringify(lastAuctionStateRef.current)) {
        setAuctionState(newState)
        lastAuctionStateRef.current = newState
        currentAuctionStateRef.current = newState
        addLog(`✅ State synced. Turn: ${newState.current_turn_player}, Card: ${(newState.auction_index ?? 0) + 1}/${TOTAL_AUCTION_POSITIONS}`)
      }
    } else if (payload && payload.status) {
      if (JSON.stringify(payload) !== JSON.stringify(lastAuctionStateRef.current)) {
        setAuctionState(payload as AuctionState)
        lastAuctionStateRef.current = payload as AuctionState
        currentAuctionStateRef.current = payload as AuctionState
      }
    }

    // Handle specific events
    switch (messageType) {
      case 'auction_started':
      case 'bot_joined':
        setIsLoading(false)
        setForceReady(true)
        break
      case 'auction_state':
      case 'state_update':
        setIsLoading(false)
        break
      case 'bid_placed':
        addLog(`💰 ${message.player_id} bids ${message.amount}M`)
        setIsLoading(false)
        break
      case 'turn_skipped':
        addLog(`⏭️ ${message.player_id} skipped`)
        setIsLoading(false)
        break
      case 'timer_expired':
        addLog(`⏰ Timeout for ${message.player_id}`)
        break
      case 'auction_completed':
        addLog('🏁 Auction finished')
        setIsLoading(false)
        break
      case 'match_completed':
        if (message.data?.commentary) setCommentary(message.data.commentary)
        setIsLoading(false)
        break
      case 'error':
        setError(message.message || 'Unknown error')
        addLog(`❌ ${message.message}`)
        setIsLoading(false)
        break
      case 'pong':
        setNetworkPing(Date.now() - (message.timestamp ? new Date(message.timestamp as string).getTime() : Date.now()))
        break
      default:
        break
    }
  }, [setAuctionState, setIsLoading, setError, addLog, sessionId, player1Id])

  // ..........................................................................
  // WEBSOCKET CONNECTION
  // ..........................................................................
  const { isConnected, send } = useWebSocket({
    sessionId,
    playerId: player1Id,
    onMessage: handleGameMessage,
    onConnect: () => {
      if (!isMountedRef.current) return
      setIsLoading(false)
      setConnectionStatus('connected')
      addLog('🔗 Connected to server')
    },
    onDisconnect: () => {
      if (!isMountedRef.current) return
      setConnectionStatus('disconnected')
      setError('Connection lost. Please refresh.')
      addLog('🔌 Disconnected')
    },
  })

  // Sync connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected')
  }, [isConnected])

  // Sync ref with state
  useEffect(() => {
    currentAuctionStateRef.current = auctionState
  }, [auctionState])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [])

  // Keep-Alive Ping
  useEffect(() => {
    if (!isConnected) return
    const keepAlive = setInterval(() => {
      if (isMountedRef.current) send({ type: 'ping', timestamp: new Date().toISOString() } as any)
    }, PING_INTERVAL_MS)
    return () => clearInterval(keepAlive)
  }, [isConnected, send])

  // Initialize Game Session
  useEffect(() => {
    if (!isInitializedRef.current && isConnected && isMountedRef.current) {
      isInitializedRef.current = true
      setIsInitialized(true)
      setIsLoading(true)
      addLog('🚀 Starting session...')

      if (player2Id === 'Goat_Bot') {
        send({ type: 'add_bot', action: 'add_bot', session_id: sessionId, player_id: player1Id } as any)
      } else {
        send({ type: 'start_auction', action: 'start_auction', opponent_id: player2Id } as any)
      }
    }
  }, [isConnected, isInitialized, player2Id, send, setIsLoading, sessionId, player1Id, addLog])

  // Fallback Loader
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!auctionState && isMountedRef.current) {
        const defaultState = buildDefaultAuctionState(sessionId, player1Id)
        setAuctionState(defaultState)
        lastAuctionStateRef.current = defaultState
        currentAuctionStateRef.current = defaultState
        setForceReady(true)
        addLog('⚡ Offline mode activated')
      }
    }, FALLBACK_LOAD_DELAY_MS)
    return () => clearTimeout(fallbackTimer)
  }, [auctionState, player1Id, sessionId, setAuctionState, addLog])

  // Game Actions
  const handlePlaceBid = useCallback((amount: number) => {
    if (isLoading || !isConnected) return
    setIsLoading(true)
    addLog(`💰 Bidding ${amount}M`)
    send({ type: 'place_bid', action: 'place_bid', session_id: sessionId, player_id: player1Id, amount } as any)
  }, [send, sessionId, player1Id, isLoading, isConnected, addLog, setIsLoading])

  const handleSkipBid = useCallback(() => {
    if (isLoading || !isConnected) return
    setIsLoading(true)
    addLog('⏭️ Skipping turn')
    send({ type: 'skip_bid', action: 'skip_bid', session_id: sessionId, player_id: player1Id } as any)
  }, [send, sessionId, player1Id, isLoading, isConnected, addLog, setIsLoading])

  const handleStartMatch = useCallback(() => {
    if (isLoading || !isConnected) return
    setIsLoading(true)
    addLog('⚽ Starting match simulation')
    send({ type: 'start_match', action: 'start_match', session_id: sessionId, player_id: player1Id } as any)
  }, [send, sessionId, player1Id, isLoading, isConnected, addLog, setIsLoading])

  // Robust Auction Timer
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (!auctionState || auctionState.status === 'completed') return

    timerIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
        return
      }

      const currentState = currentAuctionStateRef.current
      if (!currentState) return

      const currentTime: number = currentState.timer_remaining ?? DEFAULT_TIMER
      const isMyTurn: boolean = currentState.current_turn_player === player1Id

      if (currentTime > 1) {
        const updatedState: AuctionState = {
          ...currentState,
          timer_remaining: currentTime - 1,
          opponent_info: currentState.opponent_info || (currentState as any).opponent_info,
          player1_team: currentState.player1_team || (currentState as any).team1 || {},
          player2_team: currentState.player2_team || (currentState as any).team2 || {},
        } as AuctionState

        setAuctionState(updatedState)
        currentAuctionStateRef.current = updatedState
        lastAuctionStateRef.current = updatedState
      } else if (currentTime === 1 && isMyTurn) {
        addLog('⏰ Auto-skip triggered')

        const zeroState: AuctionState = {
          ...currentState,
          timer_remaining: 0,
          opponent_info: currentState.opponent_info || (currentState as any).opponent_info,
          player1_team: currentState.player1_team || (currentState as any).team1 || {},
          player2_team: currentState.player2_team || (currentState as any).team2 || {},
        } as AuctionState

        setAuctionState(zeroState)
        currentAuctionStateRef.current = zeroState
        lastAuctionStateRef.current = zeroState

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }

        handleSkipBid()
      }
    }, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [auctionState?.status, auctionState?.current_turn_player, player1Id, addLog, setAuctionState, handleSkipBid])

  // Loading Screen
  if (!forceReady && (!isConnected && !auctionState)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm space-y-4 shadow-2xl border-dark-card">
          <Loader className="animate-spin mx-auto text-accent-terracotta" size={40} />
          <p className="text-text-primary font-semibold">Connecting to Game Server</p>
          <p className="text-xs text-text-secondary">Secure WebSocket handshake in progress...</p>
          <button
            onClick={() => {
              const defaultState = buildDefaultAuctionState(sessionId, player1Id)
              setAuctionState(defaultState)
              lastAuctionStateRef.current = defaultState
              currentAuctionStateRef.current = defaultState
              setForceReady(true)
            }}
            className="w-full py-2.5 bg-accent-terracotta text-white rounded-lg font-bold text-sm hover:opacity-90 transition"
          >
            Enter Offline Mode ⚽
          </button>
        </Card>
      </div>
    )
  }

  // Main Game Interface
  const safeState = auctionState || buildDefaultAuctionState(sessionId, player1Id)
  const isAuctionComplete = safeState.status === 'completed'
  const isPlayersTurn = safeState.current_turn_player === player1Id

  const opponentInfo = (safeState as any).opponent_info || {
    id: player2Id,
    name: player2Id === 'Goat_Bot' ? 'GOAT-X 🐐' : player2Id,
    budget: 100,
    cards_acquired: 0,
    total_budget: 100,
    current_mindset: 'MASTERMIND',
    team: (safeState as any).team2 || [],
    is_bot: player2Id === 'Goat_Bot'
  }

  const p1Team = (safeState as any).team1 || safeState.player1_team || []
  const p2Team = opponentInfo.team || (safeState as any).team2 || safeState.player2_team || []

  const p1TeamCount = Array.isArray(p1Team) ? p1Team.length : (typeof p1Team === 'object' ? Object.values(p1Team).flat().length : 0)
  const p2TeamCount = Array.isArray(p2Team) ? p2Team.length : (typeof p2Team === 'object' ? Object.values(p2Team).flat().length : 0)
  const p2Budget = opponentInfo.budget || opponentInfo.total_budget || 100

  return (
    <main className="min-h-screen bg-dark-bg text-text-primary selection:bg-accent-terracotta selection:text-white">
      {/* HEADER */}
      <header className="bg-dark-bg-alt border-b border-dark-card sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl bg-dark-card p-2 rounded-2xl border border-dark-card shadow-inner">⚽</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-text-primary">OSM FUT Dual Battle</h1>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">v5.0</span>
              </div>
              <p className="text-xs text-text-secondary">Enterprise Auction & Match Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-dark-card px-3 py-1.5 rounded-xl border border-dark-card text-xs font-mono">
              {connectionStatus === 'connected' ? (
                <span className="flex items-center gap-1 text-emerald-400"><Wifi size={12} /> {networkPing}ms</span>
              ) : (
                <span className="flex items-center gap-1 text-status-error"><WifiOff size={12} /> Offline</span>
              )}
              <span className="text-text-secondary">|</span>
              <span className="text-text-secondary">Sess: <strong className="text-accent-terracotta">{sessionId.slice(0, 8)}</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {storeError && (
          <Card className="p-3 sm:p-4 bg-status-error/10 border border-status-error flex items-start gap-3 rounded-2xl shadow-lg">
            <AlertCircle className="text-status-error flex-shrink-0 mt-1" size={18} />
            <div>
              <p className="text-status-error text-sm font-bold">System Error</p>
              <p className="text-status-error text-xs opacity-90">{storeError}</p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <AuctionTimer
              timeRemaining={Math.max(0, safeState.timer_remaining ?? DEFAULT_TIMER)}
              currentBid={safeState.highest_bid ?? 0}
              isYourTurn={isPlayersTurn}
              currentPosition={safeState.current_position ?? 'GK'}
              currentPlayer={safeState.current_player}
              onBid={handlePlaceBid}
              onSkip={handleSkipBid}
              disabled={!isPlayersTurn || isLoading || isAuctionComplete || !isConnected}
            />

            {/* SQUAD MATRIX */}
            <Card className="p-5 sm:p-6 bg-gradient-to-br from-dark-bg-alt to-dark-bg border border-dark-card rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-dark-card pb-3">
                <h3 className="font-black text-text-primary text-base sm:text-lg flex items-center gap-2">
                  <Trophy size={20} className="text-accent-gold" /> Squad Acquisition Matrix
                </h3>
                <span className="text-xs font-mono text-text-secondary bg-dark-card px-2.5 py-1 rounded-lg">
                  Target: {TOTAL_AUCTION_POSITIONS} Cards
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Player 1 */}
                <div className="p-4 rounded-2xl bg-dark-bg border-2 border-accent-terracotta/30 shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition">
                    <ShieldCheck size={48} className="text-accent-terracotta" />
                  </div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Your Franchise</p>
                  <p className="text-3xl font-black font-mono text-accent-terracotta">
                    {p1TeamCount} <span className="text-sm font-normal text-text-secondary">/ {TOTAL_AUCTION_POSITIONS}</span>
                  </p>
                  <div className="w-full bg-dark-card h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-accent-terracotta h-full transition-all duration-500" style={{ width: `${(p1TeamCount / TOTAL_AUCTION_POSITIONS) * 100}%` }}></div>
                  </div>
                  {Array.isArray(p1Team) && p1Team.slice(-3).map((card: any, i: number) => (
                    <div key={i} className="mt-2 text-xs text-text-secondary flex justify-between">
                      <span>{card.name || card.position}</span>
                      <span className="text-accent-terracotta">{card.rating || ''} ⭐</span>
                    </div>
                  ))}
                </div>

                {/* Opponent (Goat Bot) */}
                <div className="p-4 rounded-2xl bg-dark-bg border-2 border-accent-gold/30 shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition">
                    <Cpu size={48} className="text-accent-gold" />
                  </div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">
                    {opponentInfo.is_bot ? '🤖 Goat AI' : '👤 Opponent'}
                  </p>
                  <p className="text-3xl font-black font-mono text-accent-gold">
                    {p2TeamCount} <span className="text-sm font-normal text-text-secondary">/ {TOTAL_AUCTION_POSITIONS}</span>
                  </p>
                  <div className="w-full bg-dark-card h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-accent-gold h-full transition-all duration-500" style={{ width: `${(p2TeamCount / TOTAL_AUCTION_POSITIONS) * 100}%` }}></div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-text-secondary">
                      <span className="flex items-center gap-1"><Coins size={12} /> Budget</span>
                      <span className="font-mono text-accent-gold">{p2Budget.toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span className="flex items-center gap-1"><Zap size={12} /> Mindset</span>
                      <span className="font-mono text-emerald-400">{opponentInfo.current_mindset || 'MASTERMIND'}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span className="flex items-center gap-1"><Activity size={12} /> Status</span>
                      <span className={`font-bold ${isPlayersTurn ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isPlayersTurn ? 'Your Turn' : 'Thinking...'}
                      </span>
                    </div>
                  </div>

                  {Array.isArray(p2Team) && p2Team.slice(-3).map((card: any, i: number) => (
                    <div key={i} className="mt-2 text-xs text-text-secondary flex justify-between">
                      <span>{card.name || card.position}</span>
                      <span className="text-accent-gold">{card.rating || ''} ⭐</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* TELEMETRY CONSOLE */}
            <Card className="p-5 bg-dark-bg-alt border border-dark-card rounded-3xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-text-secondary tracking-widest flex items-center gap-1.5">
                  <Activity size={14} className="text-accent-terracotta" /> Telemetry Console
                </span>
                <button
                  onClick={() => setClientLogs([])}
                  className="text-[10px] font-mono bg-dark-card px-2 py-0.5 rounded text-accent-gold hover:text-white transition"
                >
                  Clear ({clientLogs.length})
                </button>
              </div>
              <div className="bg-dark-bg p-3 rounded-xl border border-dark-card font-mono text-[11px] h-32 overflow-y-auto space-y-1 text-text-secondary">
                {clientLogs.length === 0 ? (
                  <p className="italic opacity-50">Awaiting events...</p>
                ) : (
                  clientLogs.map((log, index) => (
                    <div key={index} className="border-b border-dark-card/30 pb-0.5">
                      <span className="text-accent-terracotta">&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <AuctionProgress state={safeState} />
            <CommentaryView commentary={commentary} isLive={!isAuctionComplete} maxHeight="max-h-72 sm:max-h-[420px]" />

            {isAuctionComplete && (
              <Card className="p-6 bg-gradient-to-br from-accent-terracotta/20 to-dark-bg border-2 border-accent-terracotta/50 rounded-3xl shadow-2xl text-center space-y-4 animate-pulse">
                <div className="inline-flex p-3 bg-accent-terracotta text-white rounded-2xl shadow-lg">
                  <Trophy size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text-primary">Auction Complete!</h3>
                  <p className="text-xs text-text-secondary mt-1">Squads are ready. Simulate the match now.</p>
                </div>
                <Button
                  onClick={handleStartMatch}
                  className="w-full font-black py-4 shadow-xl text-base"
                  size="lg"
                  loading={isLoading}
                  disabled={!isConnected}
                >
                  <Play size={20} className="mr-2" />
                  Start Match Simulation ⚽
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-dark-bg-alt border-t border-dark-card mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
          <div>
            <p className="text-text-primary font-bold text-sm">OSM FUT Dual Battle Engine v5.0</p>
            <p className="text-text-secondary text-xs mt-0.5">© 2026 All rights reserved. Built with Next.js & FastAPI.</p>
          </div>
          <div className="bg-dark-card px-4 py-2 rounded-2xl border border-dark-card shadow-inner">
            <p className="text-xs text-text-secondary">Developer: <span className="text-accent-terracotta font-bold">Saud Yahya Al-Faifi</span></p>
            <p className="text-xs font-mono text-amber-400 mt-0.5">Contact: 0535103986</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
