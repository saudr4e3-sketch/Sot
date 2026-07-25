/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Game Page Component
 * Architecture: Real-time WebSocket Auction & Match Simulation Hub
 * Developer: Saud Yahya Al-Faifi (Phone: 0535103986)
 * Version: 7.0.0 - Mystery Box, Smart Match Engine, Anti-Duplicate Players
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
import MatchSimulation from '@/components/game/MatchSimulation'
import MysteryBoxCard from '@/components/game/MysteryBoxCard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { AlertCircle, Loader, Play, Trophy, ShieldCheck, Zap, Activity, Cpu, Coins, Wifi, WifiOff, Gift, Users, Bot } from 'lucide-react'

// ============================================================================
// LOCAL TYPE DEFINITIONS
// ============================================================================

interface CurrentPlayerInfo {
  name: string
  position: string
  rating: number
  image_url?: string
  rarity?: string
  id?: string
}

interface BotInfo {
  id: string
  name: string
  budget: number
  total_budget: number
  cards_acquired: number
  current_mindset?: string
  is_bot: boolean
  team: any[]
}

interface MysteryBoxCard {
  id: string
  name: string
  position: string
  rating: number
  rarity: 'Weak' | 'Medium' | 'Legendary'
  image_url?: string
}

interface MatchResult {
  winner: string
  score: { player1: number; player2: number }
  commentary: any[]
  match_stats: {
    possession: { player1: number; player2: number }
    shots: { player1: number; player2: number }
    rating_impact: number
    tactic_impact: number
    momentum_impact: number
  }
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
  current_player?: CurrentPlayerInfo | null
  team1?: any[]
  team2?: any[]
  is_bot_match?: boolean
  mystery_boxes?: MysteryBoxCard[]
  match_result?: MatchResult
  last_auction_loser?: string
  [key: string]: any
}

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const TOTAL_AUCTION_POSITIONS = 9
const AUCTION_SEQUENCE = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'MGR']
const DEFAULT_TIMER = 30
const PING_INTERVAL_MS = 20000
const FALLBACK_LOAD_DELAY_MS = 2500
const TIMER_TICK_MS = 250
const MAX_STUCK_AT_ZERO_MS = 4000

// Mystery Box Probability Configuration
const MYSTERY_BOX_PROBABILITIES = {
  Weak: 0.40,
  Medium: 0.30,
  Legendary: 0.30
}

// Match Engine Weights
const MATCH_WEIGHTS = {
  RATING_WEIGHT: 0.40,
  TACTIC_WEIGHT: 0.30,
  MOMENTUM_WEIGHT: 0.30
}

const buildDefaultAuctionState = (sessionId: string, player1Id: string, isBotMatch: boolean = false): AuctionState => {
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
    auction_sequence: [...AUCTION_SEQUENCE],
    player1_team: {} as Record<string, any>,
    player2_team: {} as Record<string, any>,
    player1_budget: 100,
    player2_budget: 100,
    player1_total_spent: 0,
    player2_total_spent: 0,
    is_bot_match: isBotMatch,
    mystery_boxes: [],
    opponent_info: isBotMatch ? {
      id: 'Goat_Bot',
      name: 'GOAT-X',
      budget: 100,
      cards_acquired: 0,
      total_budget: 100,
      current_mindset: 'MASTERMIND',
      team: [],
      is_bot: true
    } as BotInfo : undefined,
    current_player: null
  } as AuctionState
}

// ============================================================================
// MYSTERY BOX GENERATOR
// ============================================================================
const generateMysteryBox = (position: string): MysteryBoxCard => {
  const rand = Math.random()
  let rarity: 'Weak' | 'Medium' | 'Legendary'
  
  if (rand < MYSTERY_BOX_PROBABILITIES.Weak) {
    rarity = 'Weak'
  } else if (rand < MYSTERY_BOX_PROBABILITIES.Weak + MYSTERY_BOX_PROBABILITIES.Medium) {
    rarity = 'Medium'
  } else {
    rarity = 'Legendary'
  }

  const ratings = {
    Weak: Math.floor(Math.random() * 10) + 70, // 70-79
    Medium: Math.floor(Math.random() * 10) + 80, // 80-89
    Legendary: Math.floor(Math.random() * 6) + 90 // 90-95
  }

  const mysteryPlayers = {
    GK: ['Mystery Keeper X', 'Shadow Guardian', 'Phantom Wall'],
    DEF: ['Iron Defender', 'Ghost Tackler', 'Mystery Shield'],
    MID: ['Shadow Playmaker', 'Mystery Maestro', 'Phantom Passer'],
    ATT: ['Ghost Striker', 'Mystery Finisher', 'Shadow Dribbler'],
    MGR: ['Mystery Tactician', 'Phantom Coach', 'Shadow Strategist']
  }

  const names = mysteryPlayers[position as keyof typeof mysteryPlayers] || ['Mystery Player']
  
  return {
    id: `mystery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: names[Math.floor(Math.random() * names.length)],
    position,
    rating: ratings[rarity],
    rarity,
    image_url: undefined
  }
}

// ============================================================================
// MATCH ENGINE CALCULATOR
// ============================================================================
const calculateMatchResult = (
  team1: any[],
  team2: any[],
  tactics1: any = {},
  tactics2: any = {}
): MatchResult => {
  // 40% Rating Calculation
  const avgRating1 = team1.reduce((sum: number, p: any) => sum + (p.rating || 75), 0) / Math.max(team1.length, 1)
  const avgRating2 = team2.reduce((sum: number, p: any) => sum + (p.rating || 75), 0) / Math.max(team2.length, 1)
  const ratingScore1 = (avgRating1 / 100) * MATCH_WEIGHTS.RATING_WEIGHT
  const ratingScore2 = (avgRating2 / 100) * MATCH_WEIGHTS.RATING_WEIGHT

  // 30% Tactics & Synergy
  const tacticScore1 = ((tactics1.formation_synergy || 0.5) + (tactics1.playstyle_effectiveness || 0.5)) / 2 * MATCH_WEIGHTS.TACTIC_WEIGHT
  const tacticScore2 = ((tactics2.formation_synergy || 0.5) + (tactics2.playstyle_effectiveness || 0.5)) / 2 * MATCH_WEIGHTS.TACTIC_WEIGHT

  // 30% Momentum & RNG
  const momentum1 = Math.random() * MATCH_WEIGHTS.MOMENTUM_WEIGHT
  const momentum2 = Math.random() * MATCH_WEIGHTS.MOMENTUM_WEIGHT

  const totalScore1 = ratingScore1 + tacticScore1 + momentum1
  const totalScore2 = ratingScore2 + tacticScore2 + momentum2

  const winner = totalScore1 >= totalScore2 ? 'player1' : 'player2'
  
  // Generate realistic scores based on total scores
  const baseGoals = Math.floor(Math.random() * 3)
  const score1 = Math.max(0, Math.floor(totalScore1 * 5) + (winner === 'player1' ? 1 : 0))
  const score2 = Math.max(0, Math.floor(totalScore2 * 5) + (winner === 'player2' ? 1 : 0))

  // Generate match stats
  const possession1 = Math.floor(40 + (totalScore1 * 30))
  const possession2 = 100 - possession1

  // Generate dynamic commentary
  const commentary = generateMatchCommentary(team1, team2, score1, score2, winner)

  return {
    winner,
    score: { player1: score1, player2: score2 },
    commentary,
    match_stats: {
      possession: { player1: possession1, player2: possession2 },
      shots: { 
        player1: Math.floor(score1 * 2 + Math.random() * 4),
        player2: Math.floor(score2 * 2 + Math.random() * 4)
      },
      rating_impact: MATCH_WEIGHTS.RATING_WEIGHT * 100,
      tactic_impact: MATCH_WEIGHTS.TACTIC_WEIGHT * 100,
      momentum_impact: MATCH_WEIGHTS.MOMENTUM_WEIGHT * 100
    }
  }
}

const generateMatchCommentary = (
  team1: any[],
  team2: any[],
  score1: number,
  score2: number,
  winner: string
): any[] => {
  const events = []
  const totalEvents = score1 + score2
  let currentMinute = 0

  // Generate goal events
  for (let i = 0; i < totalEvents; i++) {
    currentMinute = Math.floor(Math.random() * 90) + 1
    const isHome = i < score1
    const scorer = isHome 
      ? team1[Math.floor(Math.random() * team1.length)]
      : team2[Math.floor(Math.random() * team2.length)]
    
    events.push({
      minute: currentMinute,
      type: 'goal',
      player: scorer?.name || 'Player',
      team: isHome ? 'home' : 'away',
      description: `GOAL! ${scorer?.name || 'Player'} scores in the ${currentMinute}th minute!`
    })
  }

  // Sort events by minute
  events.sort((a, b) => a.minute - b.minute)

  // Add final commentary
  events.push({
    minute: 90,
    type: 'final',
    description: `Full Time! ${winner === 'player1' ? 'Player 1' : 'Player 2'} wins ${score1}-${score2}!`
  })

  return events
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GamePage() {
  const params = useParams()
  const player1Id = (params?.player1 as string) || 'Player1'
  const player2Id = (params?.player2 as string) || 'Goat_Bot'
  const isBotMatch = player2Id === 'Goat_Bot'

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
  const [showMysteryBox, setShowMysteryBox] = useState<boolean>(false)
  const [currentMysteryBox, setCurrentMysteryBox] = useState<MysteryBoxCard | null>(null)
  const [matchSimulation, setMatchSimulation] = useState<MatchResult | null>(null)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [bidInProgress, setBidInProgress] = useState<boolean>(false)

  const lastAuctionStateRef = useRef<AuctionState | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentAuctionStateRef = useRef<AuctionState | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const isInitializedRef = useRef<boolean>(false)
  const stuckAtZeroTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSkipSentRef = useRef<boolean>(false)
  const lastTurnPlayerRef = useRef<string>('')
  const forceAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const previousAuctionIndexRef = useRef<number>(-1)

  const addLog = useCallback((logText: string) => {
    if (!isMountedRef.current) return
    const timestamp = new Date().toLocaleTimeString()
    setClientLogs(prev => [`[${timestamp}] ${logText}`, ...prev.slice(0, 49)])
  }, [])

  // =========================================================================
  // CHECK FOR MYSTERY BOX AWARD
  // =========================================================================
  const checkMysteryBoxAward = useCallback((currentState: AuctionState) => {
    const prevIndex = previousAuctionIndexRef.current
    const currentIndex = currentState.auction_index ?? 0
    
    // If we moved to next auction round, check who lost
    if (prevIndex !== -1 && currentIndex > prevIndex) {
      const prevHighestBidder = lastAuctionStateRef.current?.highest_bidder
      const currentPosition = AUCTION_SEQUENCE[prevIndex]
      
      // If player1 didn't win the previous round
      if (prevHighestBidder && prevHighestBidder !== player1Id && currentPosition) {
        const mysteryBox = generateMysteryBox(currentPosition)
        setCurrentMysteryBox(mysteryBox)
        setShowMysteryBox(true)
        addLog(`🎁 Mystery Box awarded: ${mysteryBox.name} (${mysteryBox.rarity})`)
        
        // Add to player's team
        const updatedState = {
          ...currentState,
          mystery_boxes: [...(currentState.mystery_boxes || []), mysteryBox],
          player1_team: {
            ...currentState.player1_team,
            [currentPosition]: [...((currentState.player1_team as any)?.[currentPosition] || []), mysteryBox]
          }
        }
        setAuctionState(updatedState)
      }
    }
    
    previousAuctionIndexRef.current = currentIndex
  }, [player1Id, addLog, setAuctionState])

  // =========================================================================
  // LOCAL ADVANCE FUNCTION (Fallback when server does not respond)
  // =========================================================================
  const advanceLocally = useCallback(() => {
    const currentState = currentAuctionStateRef.current
    if (!currentState) return

    const nextIndex = (currentState.auction_index ?? 0) + 1
    const isFinished = nextIndex >= TOTAL_AUCTION_POSITIONS

    addLog(`🔄 Local advance: moving from card ${(currentState.auction_index ?? 0) + 1} to ${nextIndex + 1}`)

    const updatedState: AuctionState = {
      ...currentState,
      auction_index: nextIndex,
      status: isFinished ? 'completed' : 'bidding',
      timer_remaining: DEFAULT_TIMER,
      current_turn_player: player1Id,
      highest_bid: 0,
      highest_bidder: null,
      current_position: AUCTION_SEQUENCE[nextIndex] || 'MGR',
    } as AuctionState

    checkMysteryBoxAward(updatedState)
    
    setAuctionState(updatedState)
    currentAuctionStateRef.current = updatedState
    lastAuctionStateRef.current = updatedState
    autoSkipSentRef.current = false

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (stuckAtZeroTimerRef.current) {
      clearTimeout(stuckAtZeroTimerRef.current)
      stuckAtZeroTimerRef.current = null
    }
    if (forceAdvanceTimerRef.current) {
      clearTimeout(forceAdvanceTimerRef.current)
      forceAdvanceTimerRef.current = null
    }
  }, [player1Id, addLog, setAuctionState, checkMysteryBoxAward])

  // =========================================================================
  // WEBSOCKET MESSAGE HANDLER
  // =========================================================================
  const handleGameMessage = useCallback((rawMessage: any) => {
    if (!rawMessage || !isMountedRef.current) return

    const message = rawMessage as Record<string, any>
    const messageType = message.type || 'unknown'

    addLog(`📩 Server: ${messageType}`)

    const payload = message.data || message.state || message

    if (payload && payload.auction_state) {
      const newState: AuctionState = {
        ...payload.auction_state,
        session_id: message.session_id || sessionId,
        timer_remaining: payload.timer?.remaining ?? DEFAULT_TIMER,
        opponent_info: payload.opponent_info || (payload.auction_state as any)?.opponent_info || {},
        current_turn_player: payload.auction_state.current_turn_player || player1Id,
        is_bot_match: isBotMatch,
      } as AuctionState

      if (JSON.stringify(newState) !== JSON.stringify(lastAuctionStateRef.current)) {
        checkMysteryBoxAward(newState)
        setAuctionState(newState)
        lastAuctionStateRef.current = newState
        currentAuctionStateRef.current = newState
        autoSkipSentRef.current = false
        setBidInProgress(false)
        addLog(`✅ State synced. Turn: ${newState.current_turn_player}, Card: ${(newState.auction_index ?? 0) + 1}/${TOTAL_AUCTION_POSITIONS}`)
      }
    } else if (payload && payload.status) {
      if (JSON.stringify(payload) !== JSON.stringify(lastAuctionStateRef.current)) {
        checkMysteryBoxAward(payload as AuctionState)
        setAuctionState(payload as AuctionState)
        lastAuctionStateRef.current = payload as AuctionState
        currentAuctionStateRef.current = payload as AuctionState
        autoSkipSentRef.current = false
        setBidInProgress(false)
      }
    }

    switch (messageType) {
      case 'auction_started':
      case 'bot_joined':
        setIsLoading(false)
        setForceReady(true)
        break
      case 'auction_state':
      case 'state_update':
        setIsLoading(false)
        setBidInProgress(false)
        break
      case 'bid_confirmed':
        addLog(`✅ Bid confirmed for ${message.amount}M`)
        setBidInProgress(false)
        setIsLoading(false)
        break
      case 'bid_placed':
        addLog(`💰 ${message.player_id} bids ${message.amount}M`)
        setIsLoading(false)
        break
      case 'bid_rejected':
        addLog(`❌ Bid rejected: ${message.reason || 'Unknown'}`)
        setBidInProgress(false)
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
      case 'match_result':
      case 'match_completed':
        if (message.data) {
          const matchResult = message.data as MatchResult
          setMatchSimulation(matchResult)
          setCommentary(matchResult.commentary || [])
          addLog(`⚽ Match completed! Winner: ${matchResult.winner}`)
        }
        setIsLoading(false)
        setIsSimulating(false)
        break
      case 'error':
        setError(message.message || 'Unknown error')
        addLog(`❌ ${message.message}`)
        setIsLoading(false)
        setBidInProgress(false)
        break
      case 'pong':
        setNetworkPing(Date.now() - (message.timestamp ? new Date(message.timestamp as string).getTime() : Date.now()))
        break
      default:
        break
    }
  }, [setAuctionState, setIsLoading, setError, addLog, sessionId, player1Id, isBotMatch, checkMysteryBoxAward])

  // =========================================================================
  // WEBSOCKET CONNECTION
  // =========================================================================
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
      addLog('🔌 Disconnected')
    },
  })

  // Sync connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected')
  }, [isConnected])

  // Sync ref with state
  useEffect(() => {
    currentAuctionStateRef.current = auctionState as any
  }, [auctionState])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (stuckAtZeroTimerRef.current) clearTimeout(stuckAtZeroTimerRef.current)
      if (forceAdvanceTimerRef.current) clearTimeout(forceAdvanceTimerRef.current)
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

      if (isBotMatch) {
        send({ 
          type: 'init_bot_match', 
          action: 'init_bot_match', 
          session_id: sessionId, 
          player_id: player1Id,
          auction_sequence: AUCTION_SEQUENCE
        } as any)
      } else {
        send({ 
          type: 'join_room', 
          action: 'join_room', 
          room_pin: player2Id,
          session_id: sessionId,
          player_id: player1Id
        } as any)
      }
    }
  }, [isConnected, isInitialized, isBotMatch, player2Id, send, setIsLoading, sessionId, player1Id, addLog])

  // Fallback Loader
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!auctionState && isMountedRef.current) {
        const defaultState = buildDefaultAuctionState(sessionId, player1Id, isBotMatch)
        setAuctionState(defaultState)
        lastAuctionStateRef.current = defaultState
        currentAuctionStateRef.current = defaultState
        setForceReady(true)
        addLog('⚡ Offline mode activated')
      }
    }, FALLBACK_LOAD_DELAY_MS)
    return () => clearTimeout(fallbackTimer)
  }, [auctionState, player1Id, sessionId, setAuctionState, addLog, isBotMatch])

  // =========================================================================
  // GAME ACTIONS
  // =========================================================================
  const handlePlaceBid = useCallback((amount: number) => {
    if (!isConnected) {
      addLog('⚠️ Cannot bid while offline')
      return
    }
    if (bidInProgress) {
      addLog('⚠️ Bid already in progress')
      return
    }
    
    setBidInProgress(true)
    setIsLoading(true)
    addLog(`💰 Bidding ${amount}M`)
    
    send({ 
      type: 'place_bid', 
      action: 'place_bid', 
      session_id: sessionId, 
      player_id: player1Id, 
      amount,
      timestamp: Date.now()
    } as any)
    
    // Safety timeout to reset bid state
    setTimeout(() => {
      if (bidInProgress && isMountedRef.current) {
        setBidInProgress(false)
        setIsLoading(false)
        addLog('⚠️ Bid timeout - resetting state')
      }
    }, 5000)
  }, [send, sessionId, player1Id, isConnected, addLog, setIsLoading, bidInProgress])

  const handleSkipBid = useCallback(() => {
    autoSkipSentRef.current = true
    if (!isConnected) {
      addLog('⚠️ Offline skip - advancing locally')
      advanceLocally()
      return
    }
    setIsLoading(true)
    addLog('⏭️ Skipping turn')
    send({ 
      type: 'skip_bid', 
      action: 'skip_bid', 
      session_id: sessionId, 
      player_id: player1Id,
      timestamp: Date.now()
    } as any)
  }, [send, sessionId, player1Id, isConnected, addLog, setIsLoading, advanceLocally])

  const handleStartMatch = useCallback(() => {
    if (!isConnected && !isBotMatch) return
    
    setIsLoading(true)
    setIsSimulating(true)
    addLog('⚽ Starting match simulation')
    
    if (isBotMatch || !isConnected) {
      // Client-side match simulation for bot matches or offline mode
      const currentState = currentAuctionStateRef.current
      if (currentState) {
        const p1Team = (currentState.team1 || currentState.player1_team || []) as any[]
        const p2Team = (currentState.team2 || currentState.player2_team || []) as any[]
        
        // Apply 40/30/30 formula
        const result = calculateMatchResult(
          Array.isArray(p1Team) ? p1Team : Object.values(p1Team).flat(),
          Array.isArray(p2Team) ? p2Team : Object.values(p2Team).flat(),
          { formation_synergy: 0.7, playstyle_effectiveness: 0.8 },
          { formation_synergy: 0.75, playstyle_effectiveness: 0.85 }
        )
        
        setMatchSimulation(result)
        setCommentary(result.commentary)
        setIsSimulating(false)
        setIsLoading(false)
        
        // Update state with match result
        const updatedState = {
          ...currentState,
          match_result: result,
          status: 'match_completed'
        }
        setAuctionState(updatedState)
        
        addLog(`⚽ Match completed! ${result.score.player1}-${result.score.player2}`)
      }
    } else {
      send({ 
        type: 'start_match', 
        action: 'start_match', 
        session_id: sessionId, 
        player_id: player1Id,
        match_weights: MATCH_WEIGHTS
      } as any)
    }
  }, [send, sessionId, player1Id, isConnected, addLog, setIsLoading, isBotMatch, setAuctionState])

  const handleCloseMysteryBox = useCallback(() => {
    setShowMysteryBox(false)
    setCurrentMysteryBox(null)
  }, [])

  // =========================================================================
  // SELF-HEALING TIMER ENGINE (Auto-Advance on Zero)
  // =========================================================================
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (stuckAtZeroTimerRef.current) {
      clearTimeout(stuckAtZeroTimerRef.current)
      stuckAtZeroTimerRef.current = null
    }
    if (forceAdvanceTimerRef.current) {
      clearTimeout(forceAdvanceTimerRef.current)
      forceAdvanceTimerRef.current = null
    }

    if (!auctionState || auctionState.status === 'completed' || auctionState.status === 'match_completed') return

    const currentTurn = auctionState.current_turn_player || ''
    lastTurnPlayerRef.current = currentTurn

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
      } else if (currentTime <= 1) {
        // Timer reached zero
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }

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

        if (isMyTurn && !autoSkipSentRef.current) {
          addLog('⏰ Timer reached zero - Your turn. Auto-skipping.')
          handleSkipBid()
        } else if (!isMyTurn && !autoSkipSentRef.current) {
          addLog('⏰ Timer reached zero - Opponent turn. Waiting for server or advancing.')
          if (!isConnected) {
            addLog('📡 Offline detected during opponent timeout. Advancing locally.')
            advanceLocally()
          } else {
            forceAdvanceTimerRef.current = setTimeout(() => {
              if (currentAuctionStateRef.current?.timer_remaining === 0 && !autoSkipSentRef.current) {
                addLog('🔄 Server did not respond. Advancing locally.')
                advanceLocally()
              }
            }, MAX_STUCK_AT_ZERO_MS)
          }
        } else {
          addLog('🛑 Timer at zero, but skip already sent. Waiting for server.')
        }
      }
    }, TIMER_TICK_MS)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      if (stuckAtZeroTimerRef.current) {
        clearTimeout(stuckAtZeroTimerRef.current)
        stuckAtZeroTimerRef.current = null
      }
      if (forceAdvanceTimerRef.current) {
        clearTimeout(forceAdvanceTimerRef.current)
        forceAdvanceTimerRef.current = null
      }
    }
  }, [auctionState?.status, auctionState?.current_turn_player, player1Id, isConnected, addLog, setAuctionState, handleSkipBid, advanceLocally])

  // =========================================================================
  // RENDER: LOADING SCREEN
  // =========================================================================
  if (!forceReady && (!isConnected && !auctionState)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm space-y-4 shadow-2xl border-dark-card">
          <Loader className="animate-spin mx-auto text-accent-terracotta" size={40} />
          <p className="text-text-primary font-semibold">Connecting to Game Server</p>
          <p className="text-xs text-text-secondary">Secure WebSocket handshake in progress...</p>
          
          {/* Game Mode Indicator */}
          <div className="flex items-center justify-center gap-2 mt-2">
            {isBotMatch ? (
              <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <Bot size={12} /> Vs GOAT-X
              </span>
            ) : (
              <span className="bg-purple-500/20 text-purple-400 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <Users size={12} /> Room: {player2Id}
              </span>
            )}
          </div>
          
          <button
            onClick={() => {
              const defaultState = buildDefaultAuctionState(sessionId, player1Id, isBotMatch)
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

  // =========================================================================
  // RENDER: MAIN GAME INTERFACE
  // =========================================================================
  const safeState = auctionState || buildDefaultAuctionState(sessionId, player1Id, is
