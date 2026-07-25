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
  const avgRating1 = team1.reduce((sum: number, p: any) => sum + (p.rating || 75), 0) / Math.max(team1.length, 1)
  const avgRating2 = team2.reduce((sum: number, p: any) => sum + (p.rating || 75), 0) / Math.max(team2.length, 1)
  const ratingScore1 = (avgRating1 / 100) * MATCH_WEIGHTS.RATING_WEIGHT
  const ratingScore2 = (avgRating2 / 100) * MATCH_WEIGHTS.RATING_WEIGHT

  const tacticScore1 = ((tactics1.formation_synergy || 0.5) + (tactics1.playstyle_effectiveness || 0.5)) / 2 * MATCH_WEIGHTS.TACTIC_WEIGHT
  const tacticScore2 = ((tactics2.formation_synergy || 0.5) + (tactics2.playstyle_effectiveness || 0.5)) / 2 * MATCH_WEIGHTS.TACTIC_WEIGHT

  const momentum1 = Math.random() * MATCH_WEIGHTS.MOMENTUM_WEIGHT
  const momentum2 = Math.random() * MATCH_WEIGHTS.MOMENTUM_WEIGHT

  const totalScore1 = ratingScore1 + tacticScore1 + momentum1
  const totalScore2 = ratingScore2 + tacticScore2 + momentum2

  const winner = totalScore1 >= totalScore2 ? 'player1' : 'player2'
  
  const score1 = Math.max(0, Math.floor(totalScore1 * 5) + (winner === 'player1' ? 1 : 0))
  const score2 = Math.max(0, Math.floor(totalScore2 * 5) + (winner === 'player2' ? 1 : 0))

  const possession1 = Math.floor(40 + (totalScore1 * 30))
  const possession2 = 100 - possession1

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

  events.sort((a, b) => a.minute - b.minute)

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

  const checkMysteryBoxAward = useCallback((currentState: AuctionState) => {
    const prevIndex = previousAuctionIndexRef.current
    const currentIndex = currentState.auction_index ?? 0
    
    if (prevIndex !== -1 && currentIndex > prevIndex) {
      const prevHighestBidder = lastAuctionStateRef.current?.highest_bidder
      const currentPosition = AUCTION_SEQUENCE[prevIndex]
      
      if (prevHighestBidder && prevHighestBidder !== player1Id && currentPosition) {
        const mysteryBox = generateMysteryBox(currentPosition)
        setCurrentMysteryBox(mysteryBox)
        setShowMysteryBox(true)
        addLog(`🎁 Mystery Box awarded: ${mysteryBox.name} (${mysteryBox.rarity})`)
        
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

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected')
  }, [isConnected])

  useEffect(() => {
    currentAuctionStateRef.current = auctionState as any
  }, [auctionState])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (stuckAtZeroTimerRef.current) clearTimeout(stuckAtZeroTimerRef.current)
      if (forceAdvanceTimerRef.current) clearTimeout(forceAdvanceTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isConnected) return
    const keepAlive = setInterval(() => {
      if (isMountedRef.current) send({ type: 'ping', timestamp: new Date().toISOString() } as any)
    }, PING_INTERVAL_MS)
    return () => clearInterval(keepAlive)
  }, [isConnected, send])

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
      const currentState = currentAuctionStateRef.current
      if (currentState) {
        const p1Team = (currentState.team1 || currentState.player1_team || []) as any[]
        const p2Team = (currentState.team2 || currentState.player2_team || []) as any[]
        
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

  if (!forceReady && (!isConnected && !auctionState)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm space-y-4 shadow-2xl border-dark-card">
          <Loader className="animate-spin mx-auto text-accent-terracotta" size={40} />
          <p className="text-text-primary font-semibold">Connecting to Game Server</p>
          <p className="text-xs text-text-secondary">Secure WebSocket handshake in progress...</p>
          
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

  const safeState = auctionState || buildDefaultAuctionState(sessionId, player1Id, isBotMatch)
  const isAuctionComplete = safeState.status === 'completed' || safeState.status === 'match_completed'
  const isPlayersTurn = safeState.current_turn_player === player1Id
  const isMatchFinished = safeState.status === 'match_completed'

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
  const p2Budget = (opponentInfo as any).budget || (opponentInfo as any).total_budget || 100

  const displayMatchResult = matchSimulation || safeState.match_result

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Trophy size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">OSM FUT Dual Battle</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">v7.0.0</span>
              </div>
              <p className="text-xs text-slate-400">Self-Healing Auction Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl font-mono border border-emerald-500/30 flex items-center gap-1.5">
              {isBotMatch ? <Bot size={14} /> : <Users size={14} />}
              {isBotMatch ? 'Vs GOAT-X (Bot)' : `Room: ${player2Id}`}
            </span>
            <span className={`text-xs px-3.5 py-1.5 rounded-xl font-mono flex items-center gap-1.5 border ${isConnected ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </header>

        {/* MAIN GAME LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: AUCTION & CONTROLS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* LIVE AUCTION CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Auction Phase</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 font-mono text-sm text-amber-400">
                  <span>⏱️ Time Left:</span>
                  <span className="font-bold">{safeState.timer_remaining ?? 30}s</span>
                </div>
              </div>

              {/* CARD DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 text-center space-y-3">
                  <span className="text-xs font-mono uppercase bg-slate-900 px-3 py-1 rounded-full text-slate-300 border border-slate-800">
                    Position: {safeState.current_position || 'GK'} ({ (safeState.auction_index ?? 0) + 1 } / 9)
                  </span>

                  {safeState.current_player ? (
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white">{safeState.current_player.name}</h3>
                      <p className="text-sm font-bold text-emerald-400">Rating: {safeState.current_player.rating} | Rarity: {safeState.current_player.rarity || 'Elite'}</p>
                    </div>
                  ) : (
                    <div className="py-8 space-y-2">
                      <Loader className="animate-spin mx-auto text-emerald-400" size={32} />
                      <p className="text-sm text-slate-400">Waiting for next player card...</p>
                    </div>
                  )}

                  <div className="text-3xl font-black text-amber-400 font-mono pt-2">
                    Current Bid: {safeState.highest_bid || 0}M
                  </div>
                </div>

                {/* BID ACTIONS */}
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Turn Player:</span>
                      <strong className="text-white">{safeState.current_turn_player === player1Id ? 'Your Turn 🟢' : "Opponent's Turn ⏳"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Highest Bidder:</span>
                      <strong className="text-emerald-400">{safeState.highest_bidder || 'No Bids Yet'}</strong>
                    </div>
                  </div>

                  {!isAuctionComplete ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => handlePlaceBid((safeState.highest_bid || 0) + 5)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-emerald-900/20"
                      >
                        Place Bid (+5M) 💰
                      </Button>
                      <Button 
                        onClick={handleSkipBid}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl text-sm transition"
                      >
                        Skip Turn ⏭️
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleStartMatch}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl text-base transition shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2"
                    >
                      <Play size={18} /> Start Match Simulation ⚽
                    </Button>
                  )}
                </div>
              </div>

            </div>

            {/* TELEMETRY CONSOLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-300">
                  <Activity size={16} className="text-emerald-400" /> Telemetry & Activity Console
                </h3>
                <span className="text-xs text-slate-500 font-mono">Real-time WebSocket Logs</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 font-mono text-xs text-slate-400 h-40 overflow-y-auto space-y-1">
                {clientLogs.length === 0 ? (
                  <p className="text-slate-600">Connecting and waiting for server events...</p>
                ) : (
                  clientLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">{log}</div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: SQUAD ACQUISITION MATRIX */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400" size={20} /> Squad Matrix
                </h3>
                <span className="text-xs font-mono bg-slate-800 px-3 py-1 rounded-full text-slate-300">Target: 9 Cards</span>
              </div>

              {/* PLAYER 1 STATS */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-emerald-400">{player1Id}</span>
                  <span className="text-xs font-mono text-slate-400">Cards: {p1TeamCount}/9</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Budget: <strong className="text-emerald-400">{safeState.player1_budget ?? 100}M</strong></span>
                  <span>Spent: <strong className="text-amber-400">{safeState.player1_total_spent || 0}M</strong></span>
                </div>
              </div>

              {/* OPPONENT STATS */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-purple-400">{opponentInfo.name}</span>
                  <span className="text-xs font-mono text-slate-400">Cards: {p2TeamCount}/9</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Budget: <strong className="text-purple-400">{p2Budget}M</strong></span>
                  <span>Mindset: <strong className="text-white">{opponentInfo.current_mindset || 'MASTERMIND'}</strong></span>
                </div>
              </div>

            </div>

            {/* MATCH RESULT DISPLAY */}
            {displayMatchResult && (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-fade-in">
                <h3 className="text-xl font-bold text-emerald-400">Match Result 🏆</h3>
                <div className="text-4xl font-black font-mono tracking-wider text-white">
                  {displayMatchResult.score.player1} - {displayMatchResult.score.player2}
                </div>
                <p className="text-xs text-slate-400">Winner: <span className="text-white font-bold">{displayMatchResult.winner === 'player1' ? player1Id : opponentInfo.name}</span></p>
                <div className="space-y-2 pt-2">
                  {displayMatchResult.commentary?.slice(-3).map((comm: any, idx: number) => (
                    <p key={idx} className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">{comm.description}</p>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MYSTERY BOX MODAL */}
      {showMysteryBox && currentMysteryBox && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="inline-flex p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Gift size={32} />
            </div>
            <h3 className="text-xl font-bold">Mystery Box Unlocked! 🎁</h3>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-sm font-bold text-white">{currentMysteryBox.name}</p>
              <p className="text-xs text-amber-400 font-semibold">Rarity: {currentMysteryBox.rarity} | Rating: {currentMysteryBox.rating}</p>
            </div>
            <Button 
              onClick={handleCloseMysteryBox}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl text-sm transition"
            >
              Claim Player & Continue ⚡
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
