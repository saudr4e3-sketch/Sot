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
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Loader, Play, Trophy, ShieldCheck, Zap, Activity, Cpu, Coins, Wifi, WifiOff, Gift, Users, Bot } from 'lucide-react'

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

const MYSTERY_BOX_PROBABILITIES = {
  Weak: 0.40,
  Medium: 0.30,
  Legendary: 0.30
}

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
    Weak: Math.floor(Math.random() * 10) + 70,
    Medium: Math.floor(Math.random() * 10) + 80,
    Legendary: Math.floor(Math.random() * 6) + 90
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
  }, [player1Id, addLog, setAuctionState, checkMysteryBoxAward])

  const handleGameMessage = useCallback((rawMessage: any) => {
    if (!rawMessage || !isMountedRef.current) return

    const message = rawMessage as Record<string, any>
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
      }
    }
    setIsLoading(false)
  }, [setAuctionState, setIsLoading, addLog, sessionId, player1Id, isBotMatch, checkMysteryBoxAward])

  const { isConnected, send } = useWebSocket({
    sessionId,
    playerId: player1Id,
    onMessage: handleGameMessage,
    onConnect: () => {
      if (!isMountedRef.current) return
      setIsLoading(false)
      setConnectionStatus('connected')
    },
    onDisconnect: () => {
      if (!isMountedRef.current) return
      setConnectionStatus('disconnected')
    },
  })

  const handlePlaceBid = useCallback((amount: number) => {
    if (!isConnected) return
    if (bidInProgress) return
    setBidInProgress(true)
    setIsLoading(true)
    send({ type: 'place_bid', action: 'place_bid', session_id: sessionId, player_id: player1Id, amount, timestamp: Date.now() } as any)
    setTimeout(() => { if (bidInProgress && isMountedRef.current) { setBidInProgress(false); setIsLoading(false) } }, 5000)
  }, [send, sessionId, player1Id, isConnected, setIsLoading, bidInProgress])

  const handleSkipBid = useCallback(() => {
    autoSkipSentRef.current = true
    if (!isConnected) {
      advanceLocally()
      return
    }
    setIsLoading(true)
    send({ type: 'skip_bid', action: 'skip_bid', session_id: sessionId, player_id: player1Id, timestamp: Date.now() } as any)
  }, [send, sessionId, player1Id, isConnected, setIsLoading, advanceLocally])

  const handleStartMatch = useCallback(() => {
    setIsLoading(true)
    setIsSimulating(true)
    const currentState = currentAuctionStateRef.current || safeState
    const p1Team = currentState.team1 || currentState.player1_team || []
    const p2Team = currentState.team2 || currentState.player2_team || []
    
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
    
    setAuctionState({
      ...currentState,
      match_result: result,
      status: 'match_completed'
    })
  }, [setAuctionState, setIsLoading])

  const handleCloseMysteryBox = useCallback(() => {
    setShowMysteryBox(false)
    setCurrentMysteryBox(null)
  }, [])

  const safeState = auctionState || buildDefaultAuctionState(sessionId, player1Id, isBotMatch)
  const isAuctionComplete = safeState.status === 'completed' || safeState.status === 'match_completed'
  const opponentInfo = safeState.opponent_info || { id: player2Id, name: player2Id === 'Goat_Bot' ? 'GOAT-X 🐐' : player2Id, budget: 100, team: [] }
  const p1Team = safeState.team1 || safeState.player1_team || []
  const p2Team = safeState.team2 || safeState.player2_team || opponentInfo.team || []
  const p1TeamCount = Array.isArray(p1Team) ? p1Team.length : Object.values(p1Team).flat().length
  const p2TeamCount = Array.isArray(p2Team) ? p2Team.length : Object.values(p2Team).flat().length
  const p2Budget = (opponentInfo as any).budget || (opponentInfo as any).total_budget || 100
  const displayMatchResult = matchSimulation || safeState.match_result

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Trophy size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OSM FUT Dual Battle</h1>
              <p className="text-xs text-slate-400">Manager: <span className="text-white font-semibold">{player1Id}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl font-mono border border-emerald-500/30 flex items-center gap-1.5">
              {isBotMatch ? <Bot size={14} /> : <Users size={14} />}
              {isBotMatch ? 'Vs GOAT-X (Bot)' : `Room: ${player2Id}`}
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5 border ${isConnected ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>

        {/* AUCTION & BATTLE ARENA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PLAYER 1 STATS */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck size={16} /> {player1Id}
            </h3>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Budget: <strong className="text-emerald-400">{safeState.player1_budget ?? 100}M</strong></span>
              <span>Cards: <strong className="text-white">{p1TeamCount}/9</strong></span>
            </div>
          </div>

          {/* CENTRAL AUCTION / MATCH HUB */}
          <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 text-center space-y-4 flex flex-col justify-center items-center">
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              Position: {safeState.current_position || 'GK'} ({ (safeState.auction_index ?? 0) + 1 } / 9)
            </span>

            {safeState.current_player ? (
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">{safeState.current_player.name}</h4>
                <p className="text-xs text-emerald-400 font-bold">Rating: {safeState.current_player.rating}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Waiting for next player card...</p>
            )}

            <div className="text-2xl font-black text-amber-400 font-mono">
              Bid: {safeState.highest_bid || 0}M
            </div>

            {/* ACTION BUTTONS */}
            {!isAuctionComplete ? (
              <div className="flex gap-2 w-full pt-2">
                <Button 
                  onClick={() => handlePlaceBid((safeState.highest_bid || 0) + 5)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Place Bid (+5M) 💰
                </Button>
                <Button 
                  onClick={handleSkipBid}
                  className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Skip ⏭️
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleStartMatch}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
              >
                <Play size={16} /> Start Match Simulation ⚽
              </Button>
            )}
          </div>

          {/* OPPONENT STATS */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
              <Bot size={16} /> {opponentInfo.name}
            </h3>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Budget: <strong className="text-purple-400">{p2Budget}M</strong></span>
              <span>Cards: <strong className="text-white">{p2TeamCount}/9</strong></span>
            </div>
          </div>

        </div>

        {/* MATCH RESULT DISPLAY */}
        {displayMatchResult && (
          <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/30 text-center space-y-3">
            <h3 className="text-lg font-bold text-emerald-400">Match Result 🏆</h3>
            <div className="text-3xl font-black font-mono tracking-wider">
              {displayMatchResult.score.player1} - {displayMatchResult.score.player2}
            </div>
            <p className="text-xs text-slate-400">Winner: <span className="text-white font-bold">{displayMatchResult.winner === 'player1' ? player1Id : opponentInfo.name}</span></p>
          </div>
        )}

      </div>

      {/* MYSTERY BOX MODAL */}
      {showMysteryBox && currentMysteryBox && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
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
    </div>
  )
}
