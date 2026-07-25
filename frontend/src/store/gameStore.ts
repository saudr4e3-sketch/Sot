/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Global Game State Store
 * Version: 7.0.0 - Mystery Box System, Smart Match Engine, Anti-Duplication
 * ============================================================================
 */

'use client'

import { create } from 'zustand'

// ==================== LOCAL TYPES ====================

interface CurrentPlayerInfo {
  name: string
  position: string
  rating: number
  image_url?: string
  rarity?: string
  nationality?: string
  team?: string
  age?: number
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
  potential?: number
  market_value?: string
  playing_style?: string
  card_id?: string
  is_mystery?: boolean
  id?: string
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

interface Card {
  type: string
  is_mystery: boolean
  acquired_from: string
  bid_amount?: number
  name?: string
  position?: string
  rating?: number
  rarity?: string
  image_url?: string
  card_id?: string
  mystery_rarity?: 'Weak' | 'Medium' | 'Legendary'
}

interface MysteryBoxCard {
  id: string
  name: string
  position: string
  rating: number
  rarity: 'Weak' | 'Medium' | 'Legendary'
  image_url?: string
}

interface AuctionState {
  session_id: string
  status: string
  current_position: string
  auction_index: number
  total_positions: number
  auction_sequence: string[]
  current_turn_player: string
  current_auction_phase?: string
  highest_bid: number
  highest_bidder: string | null
  timer_remaining: number
  timer_duration?: number
  player1_budget: number
  player2_budget: number
  player1_total_spent: number
  player2_total_spent: number
  player1_remaining_budget?: number
  player2_remaining_budget?: number
  player1_team: Record<string, Card[]>
  player2_team: Record<string, Card[]>
  player1_cards_won?: number
  player2_cards_won?: number
  player1_bids_count?: number
  player2_bids_count?: number
  player1_skips_count?: number
  player2_skips_count?: number
  current_player?: CurrentPlayerInfo | null
  is_auction_finished?: boolean
  match_completed?: boolean
  winner_id?: string | null
  last_activity_timestamp?: number
  game_mode?: string
  difficulty_level?: string
  bot_info?: BotInfo | null
  opponent_info?: BotInfo | null
  next_position?: string | null
  auction_progress?: number
  team1?: any[]
  team2?: any[]
  acquired_player_ids?: string[]
  is_bot_match?: boolean
  mystery_boxes?: MysteryBoxCard[]
  last_auction_loser?: string | null
  match_weights?: {
    rating_weight: number
    tactic_weight: number
    momentum_weight: number
  }
  [key: string]: any
}

interface CommentaryEvent {
  minute: number
  type: string
  text: string
  author?: string
  is_goal?: boolean
  is_key_moment?: boolean
  tone?: string
  team_side?: string
  impact_score?: number
  event_category?: string
  player?: string
  team?: string
  description?: string
}

interface GoalDetail {
  scorer: string
  minute: number
  goal_number: number
  assist_by?: string
  goal_type?: string
}

interface MatchStatistics {
  possession: { player1: number; player2: number }
  shots: { player1: number; player2: number }
  shots_on_target: { player1: number; player2: number }
  corners: { player1: number; player2: number }
  fouls: { player1: number; player2: number }
  yellow_cards: { player1: number; player2: number }
  red_cards: { player1: number; player2: number }
  pass_accuracy: { player1: number; player2: number }
}

interface MatchResult {
  player1_score: number
  player2_score: number
  player1_strength: number
  player2_strength: number
  player1_tactic: number
  player2_tactic: number
  player1_luck: number
  player2_luck: number
  winner: string
  commentary: CommentaryEvent[]
  match_events?: any[]
  statistics?: MatchStatistics
  goal_details?: { player1: GoalDetail[]; player2: GoalDetail[] }
  match_summary?: string
  man_of_the_match?: string
  match_duration_seconds?: number
  match_duration_minutes?: number
  total_shots_p1?: number
  total_shots_p2?: number
  possession_p1?: number
  possession_p2?: number
  match_id?: string
  match_date?: string
  match_status?: string
  player_performances?: Record<string, any>
  score?: { player1: number; player2: number }
  match_stats?: {
    possession: { player1: number; player2: number }
    shots: { player1: number; player2: number }
    rating_impact: number
    tactic_impact: number
    momentum_impact: number
  }
}

interface ConnectionInfo {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  latency_ms: number
  last_ping_at?: string
  last_pong_at?: string
  reconnection_attempts: number
}

interface GameEvent {
  timestamp: string
  type: string
  message: string
  data?: any
}

// ==================== MYSTERY BOX PROBABILITIES ====================

const MYSTERY_BOX_PROBABILITIES = {
  Weak: 0.40,
  Medium: 0.30,
  Legendary: 0.30
}

// ==================== MATCH ENGINE WEIGHTS ====================

const DEFAULT_MATCH_WEIGHTS = {
  rating_weight: 0.40,
  tactic_weight: 0.30,
  momentum_weight: 0.30
}

// ==================== AUCTION SEQUENCE ====================

const DEFAULT_AUCTION_SEQUENCE = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'MGR']

// ==================== STORE INTERFACE ====================

interface GameStore {
  sessionId: string
  playerId: string
  auctionState: AuctionState | null
  matchResult: MatchResult | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  gamePhase: 'idle' | 'connecting' | 'auction' | 'match' | 'completed'

  connectionInfo: ConnectionInfo
  botState: BotInfo | null
  gameEvents: GameEvent[]

  setSessionId: (id: string) => void
  setPlayerId: (id: string) => void
  setAuctionState: (state: AuctionState | null) => void
  updateAuctionState: (partialState: Partial<AuctionState>) => void
  advanceToNextCard: (nextPlayerData: CurrentPlayerInfo | null) => void
  setMatchResult: (result: MatchResult | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setGamePhase: (phase: GameStore['gamePhase']) => void
  setIsInitialized: (initialized: boolean) => void

  updatePlayer1Budget: (budget: number, spent: number) => void
  updatePlayer2Budget: (budget: number, spent: number) => void

  addCardToPlayer1Team: (position: string, card: Card) => void
  addCardToPlayer2Team: (position: string, card: Card) => void

  markPlayerAsAcquired: (playerId: string) => void
  isPlayerAcquired: (playerId: string) => boolean

  setConnectionStatus: (status: ConnectionInfo['status']) => void
  updateLatency: (latencyMs: number) => void
  incrementReconnectionAttempts: () => void
  resetReconnectionAttempts: () => void

  setBotState: (botInfo: BotInfo | null) => void
  updateBotBudget: (budget: number, cardsAcquired: number) => void

  addGameEvent: (type: string, message: string, data?: any) => void
  clearGameEvents: () => void

  // ===== Mystery Box & Match Engine Methods =====
  generateMysteryBox: (position: string) => MysteryBoxCard
  addMysteryBoxToPlayer: (playerId: 'player1' | 'player2', mysteryBox: MysteryBoxCard) => void
  calculateMatchResult: (team1: any[], team2: any[], tactics1?: any, tactics2?: any) => MatchResult
  setMatchWeights: (weights: { rating_weight: number; tactic_weight: number; momentum_weight: number }) => void
  
  reset: () => void
}

// ==================== INITIAL STATE ====================

const initialConnectionInfo: ConnectionInfo = {
  status: 'disconnected',
  latency_ms: 0,
  reconnection_attempts: 0,
}

const createInitialState = () => ({
  sessionId: '',
  playerId: '',
  auctionState: null,
  matchResult: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  gamePhase: 'idle' as GameStore['gamePhase'],
  connectionInfo: { ...initialConnectionInfo },
  botState: null,
  gameEvents: [],
})

// ==================== MYSTERY BOX GENERATOR ====================

const generateMysteryBoxInternal = (position: string): MysteryBoxCard => {
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
    GK: ['Mystery Keeper X', 'Shadow Guardian', 'Phantom Wall', 'Ghost Goalie', 'Enigma Stopper'],
    DEF: ['Iron Defender', 'Ghost Tackler', 'Mystery Shield', 'Shadow Blocker', 'Phantom Wall'],
    MID: ['Shadow Playmaker', 'Mystery Maestro', 'Phantom Passer', 'Ghost Dribbler', 'Enigma Creator'],
    ATT: ['Ghost Striker', 'Mystery Finisher', 'Shadow Dribbler', 'Phantom Scorer', 'Enigma Forward'],
    MGR: ['Mystery Tactician', 'Phantom Coach', 'Shadow Strategist', 'Ghost Manager', 'Enigma Leader']
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

// ==================== MATCH ENGINE CALCULATOR ====================

const calculateMatchResultInternal = (
  team1: any[],
  team2: any[],
  tactics1: any = {},
  tactics2: any = {},
  weights: { rating_weight: number; tactic_weight: number; momentum_weight: number } = DEFAULT_MATCH_WEIGHTS
): MatchResult => {
  const avgRating1 = team1.reduce((sum: number, p: any) => sum + (p.rating || 75), 0) / Math.max(team1.length, 1)
  const avgRating2 = team2.reduce((sum: number, p: any) => sum + (p.rating || 75), 0) / Math.max(team2.length, 1)
  const ratingScore1 = (avgRating1 / 100) * weights.rating_weight
  const ratingScore2 = (avgRating2 / 100) * weights.rating_weight

  const tacticScore1 = ((tactics1.formation_synergy || 0.5) + (tactics1.playstyle_effectiveness || 0.5)) / 2 * weights.tactic_weight
  const tacticScore2 = ((tactics2.formation_synergy || 0.5) + (tactics2.playstyle_effectiveness || 0.5)) / 2 * weights.tactic_weight

  const momentum1 = Math.random() * weights.momentum_weight
  const momentum2 = Math.random() * weights.momentum_weight

  const totalScore1 = ratingScore1 + tacticScore1 + momentum1
  const totalScore2 = ratingScore2 + tacticScore2 + momentum2

  const winner = totalScore1 >= totalScore2 ? 'player1' : 'player2'
  
  const score1 = Math.max(0, Math.floor(totalScore1 * 5) + (winner === 'player1' ? 1 : 0))
  const score2 = Math.max(0, Math.floor(totalScore2 * 5) + (winner === 'player2' ? 1 : 0))

  const possession1 = Math.floor(40 + (totalScore1 * 30))
  const possession2 = 100 - possession1
  const shots1 = Math.floor(score1 * 2 + Math.random() * 4)
  const shots2 = Math.floor(score2 * 2 + Math.random() * 4)
  const shotsOnTarget1 = Math.floor(shots1 * 0.6)
  const shotsOnTarget2 = Math.floor(shots2 * 0.6)

  const commentary = generateMatchCommentary(team1, team2, score1, score2, winner)

  const goalDetailsPlayer1: GoalDetail[] = []
  const goalDetailsPlayer2: GoalDetail[] = []
  
  for (let i = 0; i < score1; i++) {
    const scorer = team1[Math.floor(Math.random() * team1.length)]
    goalDetailsPlayer1.push({
      scorer: scorer?.name || 'Unknown Player',
      minute: Math.floor(Math.random() * 90) + 1,
      goal_number: i + 1,
      goal_type: ['Header', 'Long Shot', 'Penalty', 'Free Kick', 'Tap-in'][Math.floor(Math.random() * 5)]
    })
  }
  
  for (let i = 0; i < score2; i++) {
    const scorer = team2[Math.floor(Math.random() * team2.length)]
    goalDetailsPlayer2.push({
      scorer: scorer?.name || 'Unknown Player',
      minute: Math.floor(Math.random() * 90) + 1,
      goal_number: i + 1,
      goal_type: ['Header', 'Long Shot', 'Penalty', 'Free Kick', 'Tap-in'][Math.floor(Math.random() * 5)]
    })
  }

  const allPlayers = [...team1, ...team2]
  const motm = allPlayers[Math.floor(Math.random() * allPlayers.length)]

  return {
    player1_score: score1,
    player2_score: score2,
    player1_strength: ratingScore1,
    player2_strength: ratingScore2,
    player1_tactic: tacticScore1,
    player2_tactic: tacticScore2,
    player1_luck: momentum1,
    player2_luck: momentum2,
    winner,
    commentary,
    score: { player1: score1, player2: score2 },
    match_stats: {
      possession: { player1: possession1, player2: possession2 },
      shots: { player1: shots1, player2: shots2 },
      rating_impact: weights.rating_weight * 100,
      tactic_impact: weights.tactic_weight * 100,
      momentum_impact: weights.momentum_weight * 100
    },
    statistics: {
      possession: { player1: possession1, player2: possession2 },
      shots: { player1: shots1, player2: shots2 },
      shots_on_target: { player1: shotsOnTarget1, player2: shotsOnTarget2 },
      corners: { player1: Math.floor(Math.random() * 8), player2: Math.floor(Math.random() * 8) },
      fouls: { player1: Math.floor(Math.random() * 15), player2: Math.floor(Math.random() * 15) },
      yellow_cards: { player1: Math.floor(Math.random() * 3), player2: Math.floor(Math.random() * 3) },
      red_cards: { player1: Math.random() < 0.1 ? 1 : 0, player2: Math.random() < 0.1 ? 1 : 0 },
      pass_accuracy: { player1: Math.floor(75 + Math.random() * 20), player2: Math.floor(75 + Math.random() * 20) }
    },
    goal_details: { player1: goalDetailsPlayer1, player2: goalDetailsPlayer2 },
    match_summary: `Match ended ${score1}-${score2}. ${winner === 'player1' ? 'Player 1' : 'Player 2'} wins!`,
    man_of_the_match: motm?.name || 'Unknown Player',
    match_duration_seconds: 5400,
    match_duration_minutes: 90,
    total_shots_p1: shots1,
    total_shots_p2: shots2,
    possession_p1: possession1,
    possession_p2: possession2,
    match_id: `match_${Date.now()}`,
    match_date: new Date().toISOString(),
    match_status: 'completed',
    player_performances: {}
  }
}

const generateMatchCommentary = (
  team1: any[],
  team2: any[],
  score1: number,
  score2: number,
  winner: string
): CommentaryEvent[] => {
  const events: CommentaryEvent[] = []
  const usedMinutes: number[] = []

  for (let i = 0; i < score1; i++) {
    let minute: number
    do {
      minute = Math.floor(Math.random() * 90) + 1
    } while (usedMinutes.includes(minute))
    usedMinutes.push(minute)
    
    const scorer = team1[Math.floor(Math.random() * team1.length)]
    events.push({
      minute,
      type: 'goal',
      text: `GOAL! ${scorer?.name || 'Player'} scores for Player 1 in the ${minute}th minute!`,
      player: scorer?.name || 'Unknown Player',
      team: 'home',
      team_side: 'player1',
      description: `GOAL! ${scorer?.name || 'Player'} scores in the ${minute}th minute!`,
      is_goal: true,
      is_key_moment: true,
      tone: 'exciting',
      impact_score: 8,
      event_category: 'goal'
    })
  }

  for (let i = 0; i < score2; i++) {
    let minute: number
    do {
      minute = Math.floor(Math.random() * 90) + 1
    } while (usedMinutes.includes(minute))
    usedMinutes.push(minute)
    
    const scorer = team2[Math.floor(Math.random() * team2.length)]
    events.push({
      minute,
      type: 'goal',
      text: `GOAL! ${scorer?.name || 'Player'} scores for Player 2 in the ${minute}th minute!`,
      player: scorer?.name || 'Unknown Player',
      team: 'away',
      team_side: 'player2',
      description: `GOAL! ${scorer?.name || 'Player'} scores in the ${minute}th minute!`,
      is_goal: true,
      is_key_moment: true,
      tone: 'exciting',
      impact_score: 8,
      event_category: 'goal'
    })
  }

  const keyMoments = [
    { type: 'save', text: 'Brilliant save by the goalkeeper!' },
    { type: 'chance', text: 'Close chance! Just wide of the post.' },
    { type: 'tackle', text: 'Crucial tackle to stop the attack.' },
    { type: 'substitution', text: 'Tactical substitution being made.' },
    { type: 'injury', text: 'Player down, medical staff on the field.' }
  ]

  const numKeyMoments = Math.floor(Math.random() * 3) + 2
  for (let i = 0; i < numKeyMoments; i++) {
    let minute: number
    do {
      minute = Math.floor(Math.random() * 90) + 1
    } while (usedMinutes.includes(minute))
    usedMinutes.push(minute)
    
    const moment = keyMoments[Math.floor(Math.random() * keyMoments.length)]
    events.push({
      minute,
      type: moment.type,
      text: moment.text,
      team_side: Math.random() < 0.5 ? 'player1' : 'player2',
      description: moment.text,
      is_goal: false,
      is_key_moment: true,
      tone: 'neutral',
      impact_score: 5,
      event_category: 'key_moment'
    })
  }

  events.push({
    minute: 90,
    type: 'final',
    text: `Full Time! ${winner === 'player1' ? 'Player 1' : 'Player 2'} wins ${score1}-${score2}!`,
    description: `Full Time! ${winner === 'player1' ? 'Player 1' : 'Player 2'} wins ${score1}-${score2}!`,
    is_goal: false,
    is_key_moment: true,
    tone: 'celebratory',
    impact_score: 10,
    event_category: 'full_time'
  })

  events.sort((a, b) => a.minute - b.minute)

  return events
}

// ==================== STORE CREATION ====================

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  setSessionId: (id: string) => set({ sessionId: id }),

  setPlayerId: (id: string) => set({ playerId: id }),

  setAuctionState: (state: AuctionState | null) => {
    if (state === null) {
      set({ auctionState: null })
      return
    }

    const safeState: AuctionState = {
      session_id: state.session_id || get().sessionId || '',
      status: state.status || 'idle',
      current_position: state.current_position || '',
      auction_index: typeof state.auction_index === 'number' ? state.auction_index : 0,
      total_positions: state.total_positions && state.total_positions > 0 ? state.total_positions : 9,
      auction_sequence: state.auction_sequence && state.auction_sequence.length > 0
        ? state.auction_sequence
        : [...DEFAULT_AUCTION_SEQUENCE],
      current_turn_player: state.current_turn_player || '',
      current_auction_phase: state.current_auction_phase || 'pending',
      highest_bid: typeof state.highest_bid === 'number' ? state.highest_bid : 0,
      highest_bidder: state.highest_bidder || null,
      timer_remaining: typeof state.timer_remaining === 'number' ? state.timer_remaining : 30,
      timer_duration: state.timer_duration || 30,
      player1_budget: typeof state.player1_budget === 'number' ? state.player1_budget : 100,
      player2_budget: typeof state.player2_budget === 'number' ? state.player2_budget : 100,
      player1_total_spent: typeof state.player1_total_spent === 'number' ? state.player1_total_spent : 0,
      player2_total_spent: typeof state.player2_total_spent === 'number' ? state.player2_total_spent : 0,
      player1_remaining_budget: state.player1_remaining_budget || (100 - (state.player1_total_spent || 0)),
      player2_remaining_budget: state.player2_remaining_budget || (100 - (state.player2_total_spent || 0)),
      player1_team: state.player1_team || (state as any).team1 || {},
      player2_team: state.player2_team || (state as any).team2 || {},
      player1_cards_won: state.player1_cards_won || 0,
      player2_cards_won: state.player2_cards_won || 0,
      player1_bids_count: state.player1_bids_count || 0,
      player2_bids_count: state.player2_bids_count || 0,
      player1_skips_count: state.player1_skips_count || 0,
      player2_skips_count: state.player2_skips_count || 0,
      current_player: state.current_player || null,
      is_auction_finished: state.is_auction_finished || false,
      match_completed: state.match_completed || false,
      winner_id: state.winner_id || null,
      last_activity_timestamp: state.last_activity_timestamp || Date.now(),
      game_mode: state.game_mode || 'standard',
      difficulty_level: state.difficulty_level || 'normal',
      bot_info: state.bot_info || state.opponent_info || null,
      opponent_info: state.opponent_info || state.bot_info || null,
      next_position: state.next_position || null,
      auction_progress: state.auction_progress || 0,
      team1: (state as any).team1 || [],
      team2: (state as any).team2 || [],
      acquired_player_ids: state.acquired_player_ids || [],
      is_bot_match: state.is_bot_match || false,
      mystery_boxes: state.mystery_boxes || [],
      last_auction_loser: state.last_auction_loser || null,
      match_weights: state.match_weights || DEFAULT_MATCH_WEIGHTS,
    }

    set({
      auctionState: safeState,
      gamePhase: safeState.status === 'completed' || safeState.status === 'match_completed' ? 'match' : 'auction',
    })
  },

  updateAuctionState: (partialState: Partial<AuctionState>) => {
    const currentState = get().auctionState
    if (!currentState) return
    set({
      auctionState: {
        ...currentState,
        ...partialState,
        last_activity_timestamp: Date.now(),
      },
    })
  },

  advanceToNextCard: (nextPlayerData: CurrentPlayerInfo | null) => {
    const currentState = get().auctionState
    if (!currentState) return

    const nextIndex = (currentState.auction_index ?? 0) + 1
    const totalPositions = currentState.total_positions ?? 9
    const isFinished = nextIndex >= totalPositions

    const currentAcquiredIds = currentState.acquired_player_ids || []
    let updatedAcquiredIds = [...currentAcquiredIds]

    if (nextPlayerData && nextPlayerData.name && (nextPlayerData.card_id || nextPlayerData.id)) {
      const playerId = nextPlayerData.card_id || nextPlayerData.id || ''
      if (playerId && !updatedAcquiredIds.includes(playerId)) {
        updatedAcquiredIds = [...updatedAcquiredIds, playerId]
      }
    }

    const nextPosition = isFinished ? '' : (currentState.auction_sequence && currentState.auction_sequence[nextIndex]) || DEFAULT_AUCTION_SEQUENCE[nextIndex] || ''

    const updatedState: AuctionState = {
      ...currentState,
      auction_index: nextIndex,
      status: isFinished ? 'completed' : 'bidding',
      current_position: nextPosition,
      current_player: nextPlayerData,
      timer_remaining: currentState.timer_duration || 30,
      highest_bid: 0,
      highest_bidder: null,
      current_turn_player: currentState.session_id ? (currentState.current_turn_player || '') : '',
      is_auction_finished: isFinished,
      acquired_player_ids: updatedAcquiredIds,
      last_activity_timestamp: Date.now(),
    }

    set({
      auctionState: updatedState,
      gamePhase: isFinished ? 'match' : 'auction',
    })
  },

  setMatchResult: (result: MatchResult | null) => {
    if (result === null) {
      set({ matchResult: null })
      return
    }

    const safeResult: MatchResult = {
      player1_score: typeof result.player1_score === 'number' ? result.player1_score : (result.score?.player1 || 0),
      player2_score: typeof result.player2_score === 'number' ? result.player2_score : (result.score?.player2 || 0),
      player1_strength: typeof result.player1_strength === 'number' ? result.player1_strength : 0,
      player2_strength: typeof result.player2_strength === 'number' ? result.player2_strength : 0,
      player1_tactic: typeof result.player1_tactic === 'number' ? result.player1_tactic : 0,
      player2_tactic: typeof result.player2_tactic === 'number' ? result.player2_tactic : 0,
      player1_luck: typeof result.player1_luck === 'number' ? result.player1_luck : 0,
      player2_luck: typeof result.player2_luck === 'number' ? result.player2_luck : 0,
      winner: result.winner || 'draw',
      commentary: Array.isArray(result.commentary) ? result.commentary : [],
      match_events: result.match_events || [],
      statistics: result.statistics || undefined,
      goal_details: result.goal_details || undefined,
      match_summary: result.match_summary || '',
      man_of_the_match: result.man_of_the_match || '',
      match_duration_seconds: result.match_duration_seconds || 0,
      match_duration_minutes: result.match_duration_minutes || 0,
      total_shots_p1: result.total_shots_p1 || (result.match_stats?.shots?.player1 || 0),
      total_shots_p2: result.total_shots_p2 || (result.match_stats?.shots?.player2 || 0),
      possession_p1: result.possession_p1 || (result.match_stats?.possession?.player1 || 50),
      possession_p2: result.possession_p2 || (result.match_stats?.possession?.player2 || 50),
      match_id: result.match_id || '',
      match_date: result.match_date || new Date().toISOString(),
      match_status: result.match_status || 'completed',
      player_performances: result.player_performances || {},
      score: result.score || { player1: result.player1_score || 0, player2: result.player2_score || 0 },
      match_stats: result.match_stats || {
        possession: { player1: result.possession_p1 || 50, player2: result.possession_p2 || 50 },
        shots: { player1: result.total_shots_p1 || 0, player2: result.total_shots_p2 || 0 },
        rating_impact: 40,
        tactic_impact: 30,
        momentum_impact: 30
      }
    }

    set({ matchResult: safeResult, gamePhase: 'completed' })
  },

  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => {
    set({ error })
    if (error) {
      const currentEvents = get().gameEvents
      set({
        gameEvents: [
          ...currentEvents.slice(-99),
          { timestamp: new Date().toISOString(), type: 'error', message: error },
        ],
      })
    }
  },

  setGamePhase: (phase: GameStore['gamePhase']) => set({ gamePhase: phase }),

  setIsInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

  updatePlayer1Budget: (budget: number, spent: number) => {
    const currentState = get().auctionState
    if (!currentState) return
    set({
      auctionState: {
        ...currentState,
        player1_budget: Math.max(0, budget),
        player1_total_spent: spent,
        player1_remaining_budget: Math.max(0, budget),
        last_activity_timestamp: Date.now(),
      },
    })
  },

  updatePlayer2Budget: (budget: number, spent: number) => {
    const currentState = get().auctionState
    if (!currentState) return
    set({
      auctionState: {
        ...currentState,
        player2_budget: Math.max(0, budget),
        player2_total_spent: spent,
        player2_remaining_budget: Math.max(0, budget),
        last_activity_timestamp: Date.now(),
      },
    })
  },

  addCardToPlayer1Team: (position: string, card: Card) => {
    const currentState = get().auctionState
    if (!currentState) return
    const currentTeam = { ...currentState.player1_team }
    if (!currentTeam[position]) {
      currentTeam[position] = []
    }
    currentTeam[position] = [...currentTeam[position], card]
    const totalCards = Object.values(currentTeam).flat().length

    const currentAcquiredIds = currentState.acquired_player_ids || []
    let updatedAcquiredIds = [...currentAcquiredIds]
    if (card.card_id && !updatedAcquiredIds.includes(card.card_id)) {
      updatedAcquiredIds = [...updatedAcquiredIds, card.card_id]
    }

    set({
      auctionState: {
        ...currentState,
        player1_team: currentTeam,
        team1: Object.values(currentTeam).flat(),
        player1_cards_won: totalCards,
        acquired_player_ids: updatedAcquiredIds,
        last_activity_timestamp: Date.now(),
      },
    })
  },

  addCardToPlayer2Team: (position: string, card: Card) => {
    const currentState = get().auctionState
    if (!currentState) return
    const currentTeam = { ...currentState.player2_team }
    if (!currentTeam[position]) {
      currentTeam[position] = []
    }
    currentTeam[position] = [...currentTeam[position], card]
    const totalCards = Object.values(currentTeam).flat().length

    const currentAcquiredIds = currentState.acquired_player_ids || []
    let updatedAcquiredIds = [...currentAcquiredIds]
    if (card.card_id && !updatedAcquiredIds.includes(card.card_id)) {
      updatedAcquiredIds = [...updatedAcquiredIds, card.card_id]
    }

    set({
      auctionState: {
        ...currentState,
        player2_team: currentTeam,
        team2: Object.values(currentTeam).flat(),
        player2_cards_won: totalCards,
        acquired_player_ids: updatedAcquiredIds,
        last_activity_timestamp: Date.now(),
      },
    })
  },

  markPlayerAsAcquired: (playerId: string) => {
    const currentState = get().auctionState
    if (!currentState) return
    const currentAcquiredIds = currentState.acquired_player_ids || []
    if (!currentAcquiredIds.includes(playerId)) {
      set({
        auctionState: {
          ...currentState,
          acquired_player_ids: [...currentAcquiredIds, playerId],
          last_activity_timestamp: Date.now(),
        },
      })
    }
  },

  isPlayerAcquired: (playerId: string) => {
    const currentState = get().auctionState
    if (!currentState || !currentState.acquired_player_ids) return false
    return currentState.acquired_player_ids.includes(playerId)
  },

  setConnectionStatus: (status: ConnectionInfo['status']) => {
    const info = get().connectionInfo
    set({
      connectionInfo: {
        ...info,
        status,
        last_ping_at: status === 'connected' ? new Date().toISOString() : info.last_ping_at,
      },
    })
  },

  updateLatency: (latencyMs: number) => {
    const info = get().connectionInfo
    set({
      connectionInfo: {
        ...info,
        latency_ms: latencyMs,
        last_pong_at: new Date().toISOString(),
      },
    })
  },

  incrementReconnectionAttempts: () => {
    const info = get().connectionInfo
    set({
      connectionInfo: {
        ...info,
        reconnection_attempts: info.reconnection_attempts + 1,
      },
    })
  },

  resetReconnectionAttempts: () => {
    const info = get().connectionInfo
    set({
      connectionInfo: {
        ...info,
        reconnection_attempts: 0,
      },
    })
  },

  setBotState: (botInfo: BotInfo | null) => set({ botState: botInfo }),

  updateBotBudget: (budget: number, cardsAcquired: number) => {
    const bot = get().botState
    if (!bot) return
    set({
      botState: {
        ...bot,
        budget: Math.max(0, budget),
        cards_acquired: cardsAcquired,
      },
    })
  },

  addGameEvent: (type: string, message: string, data?: any) => {
    const events = get().gameEvents
    set({
      gameEvents: [
        ...events.slice(-99),
        {
          timestamp: new Date().toISOString(),
          type,
          message,
          data,
        },
      ],
    })
  },

  clearGameEvents: () => set({ gameEvents: [] }),

  generateMysteryBox: (position: string) => {
    const mysteryBox = generateMysteryBoxInternal(position)
    const currentState = get().auctionState
    if (currentState) {
      set({
        auctionState: {
          ...currentState,
          mystery_boxes: [...(currentState.mystery_boxes || []), mysteryBox],
          last_activity_timestamp: Date.now(),
        },
      })
    }
    return mysteryBox
  },

  addMysteryBoxToPlayer: (playerId: 'player1' | 'player2', mysteryBox: MysteryBoxCard) => {
    const currentState = get().auctionState
    if (!currentState) return

    const position = mysteryBox.position || 'DEF'
    const card: Card = {
      type: 'mystery_box',
      is_mystery: true,
      acquired_from: 'mystery_box',
      name: mysteryBox.name,
      position: mysteryBox.position,
      rating: mysteryBox.rating,
      rarity: mysteryBox.rarity,
      image_url: mysteryBox.image_url,
      card_id: mysteryBox.id,
      mystery_rarity: mysteryBox.rarity,
    }

    if (playerId === 'player1') {
      get().addCardToPlayer1Team(position, card)
    } else {
      get().addCardToPlayer2Team(position, card)
    }
  },

  calculateMatchResult: (team1: any[], team2: any[], tactics1?: any, tactics2?: any) => {
    const weights = get().auctionState?.match_weights || DEFAULT_MATCH_WEIGHTS
    const result = calculateMatchResultInternal(team1, team2, tactics1 || {}, tactics2 || {}, weights)
    set({ matchResult: result, gamePhase: 'completed' })
    return result
  },

  setMatchWeights: (weights: { rating_weight: number; tactic_weight: number; momentum_weight: number }) => {
    const currentState = get().auctionState
    if (!currentState) return
    set({
      auctionState: {
        ...currentState,
        match_weights: weights,
        last_activity_timestamp: Date.now(),
      },
    })
  },

  reset: () => set(createInitialState()),
}))
