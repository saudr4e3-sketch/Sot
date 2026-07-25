/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Global Game State Store
 * Version: 5.0.0 - Fully Decoupled Types, Defensive State Updates, Bot Tracking
 * ============================================================================
 *
 * Features:
 * - Fully decoupled local type definitions (no external import dependencies)
 * - Comprehensive auction state management with defensive updates
 * - Budget tracking for both players
 * - Bot opponent state tracking (Goat AI)
 * - Connection status and latency monitoring
 * - Match result and commentary storage
 * - Event logging for debugging and telemetry
 * - Reset functionality for new game sessions
 */

'use client'

import { create } from 'zustand'

// ==================== LOCAL TYPES (Decoupled from Global Types) ====================

interface CurrentPlayerInfo {
  name: string
  position: string
  rating: number
  image_url?: string
  rarity?: 'Legendary' | 'Medium' | 'Weak' | string
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
  turn_started_at?: string
  turn_timeout_seconds?: number
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
  goal_details?: {
    player1: GoalDetail[]
    player2: GoalDetail[]
  }
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

// ==================== STORE INTERFACE ====================

interface GameStore {
  // Core State
  sessionId: string
  playerId: string
  auctionState: AuctionState | null
  matchResult: MatchResult | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  gamePhase: 'idle' | 'connecting' | 'auction' | 'match' | 'completed'

  // Connection State
  connectionInfo: ConnectionInfo

  // Bot State
  botState: BotInfo | null

  // Event Log
  gameEvents: GameEvent[]

  // Core Actions
  setSessionId: (id: string) => void
  setPlayerId: (id: string) => void
  setAuctionState: (state: AuctionState | null) => void
  updateAuctionState: (partialState: Partial<AuctionState>) => void
  setMatchResult: (result: MatchResult | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setGamePhase: (phase: GameStore['gamePhase']) => void
  setIsInitialized: (initialized: boolean) => void

  // Budget Actions
  updatePlayer1Budget: (budget: number, spent: number) => void
  updatePlayer2Budget: (budget: number, spent: number) => void

  // Team Actions
  addCardToPlayer1Team: (position: string, card: Card) => void
  addCardToPlayer2Team: (position: string, card: Card) => void

  // Connection Actions
  setConnectionStatus: (status: ConnectionInfo['status']) => void
  updateLatency: (latencyMs: number) => void
  incrementReconnectionAttempts: () => void
  resetReconnectionAttempts: () => void

  // Bot Actions
  setBotState: (botInfo: BotInfo | null) => void
  updateBotBudget: (budget: number, cardsAcquired: number) => void

  // Event Logging
  addGameEvent: (type: string, message: string, data?: any) => void
  clearGameEvents: () => void

  // Reset
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

// ==================== STORE CREATION ====================

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  // ===== Core Actions =====
  setSessionId: (id: string) => set({ sessionId: id }),

  setPlayerId: (id: string) => set({ playerId: id }),

  setAuctionState: (state: AuctionState | null) => {
    if (state === null) {
      set({ auctionState: null })
      return
    }

    // Defensive: ensure required fields exist with safe defaults
    const safeState: AuctionState = {
      session_id: state.session_id || get().sessionId || '',
      status: state.status || 'idle',
      current_position: state.current_position || '',
      auction_index: typeof state.auction_index === 'number' ? state.auction_index : 0,
      total_positions: state.total_positions && state.total_positions > 0 ? state.total_positions : 9,
      auction_sequence: state.auction_sequence && state.auction_sequence.length > 0
        ? state.auction_sequence
        : ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'MGR'],
      current_turn_player: state.current_turn_player || '',
      current_auction_phase: state.current_auction_phase || 'pending',
      highest_bid: typeof state.highest_bid === 'number' ? state.highest_bid : 0,
      highest_bidder: state.highest_bidder || null,
      timer_remaining: typeof state.timer_remaining === 'number' ? state.timer_remaining : 30,
      timer_duration: state.timer_duration || 30,
      turn_started_at: state.turn_started_at || '',
      turn_timeout_seconds: state.turn_timeout_seconds || 30,
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
    }

    set({
      auctionState: safeState,
      gamePhase: safeState.status === 'completed' ? 'match' : 'auction',
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

  setMatchResult: (result: MatchResult | null) => {
    if (result === null) {
      set({ matchResult: null })
      return
    }

    // Defensive: ensure required fields
    const safeResult: MatchResult = {
      player1_score: typeof result.player1_score === 'number' ? result.player1_score : 0,
      player2_score: typeof result.player2_score === 'number' ? result.player2_score : 0,
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
      total_shots_p1: result.total_shots_p1 || 0,
      total_shots_p2: result.total_shots_p2 || 0,
      possession_p1: result.possession_p1 || 50,
      possession_p2: result.possession_p2 || 50,
      match_id: result.match_id || '',
      match_date: result.match_date || new Date().toISOString(),
      match_status: result.match_status || 'completed',
      player_performances: result.player_performances || {},
    }

    set({
      matchResult: safeResult,
      gamePhase: 'completed',
    })
  },

  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => {
    set({ error })
    if (error) {
      const currentEvents = get().gameEvents
      set({
        gameEvents: [
          ...currentEvents.slice(-99),
          {
            timestamp: new Date().toISOString(),
            type: 'error',
            message: error,
          },
        ],
      })
    }
  },

  setGamePhase: (phase: GameStore['gamePhase']) => set({ gamePhase: phase }),

  setIsInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

  // ===== Budget Actions =====
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

  // ===== Team Actions =====
  addCardToPlayer1Team: (position: string, card: Card) => {
    const currentState = get().auctionState
    if (!currentState) return
    const currentTeam = { ...currentState.player1_team }
    if (!currentTeam[position]) {
      currentTeam[position] = []
    }
    currentTeam[position] = [...currentTeam[position], card]
    const totalCards = Object.values(currentTeam).flat().length
    set({
      auctionState: {
        ...currentState,
        player1_team: currentTeam,
        team1: Object.values(currentTeam).flat(),
        player1_cards_won: totalCards,
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
    set({
      auctionState: {
        ...currentState,
        player2_team: currentTeam,
        team2: Object.values(currentTeam).flat(),
        player2_cards_won: totalCards,
        last_activity_timestamp: Date.now(),
      },
    })
  },

  // ===== Connection Actions =====
  setConnectionStatus: (status: ConnectionInfo['status']) => {
    set((state) => ({
      connectionInfo: {
        ...state.connectionInfo,
        status,
      },
    }))
  },

  updateLatency: (latencyMs: number) => {
    set((state) => ({
      connectionInfo: {
        ...state.connectionInfo,
        latency_ms: latencyMs,
        last_pong_at: new Date().toISOString(),
      },
    }))
  },

  incrementReconnectionAttempts: () => {
    set((state) => ({
      connectionInfo: {
        ...state.connectionInfo,
        reconnection_attempts: state.connectionInfo.reconnection_attempts + 1,
      },
    }))
  },

  resetReconnectionAttempts: () => {
    set((state) => ({
      connectionInfo: {
        ...state.connectionInfo,
        reconnection_attempts: 0,
      },
    }))
  },

  // ===== Bot Actions =====
  setBotState: (botInfo: BotInfo | null) => {
    set({ botState: botInfo })
    if (botInfo) {
      const currentState = get().auctionState
      if (currentState) {
        set({
          auctionState: {
            ...currentState,
            bot_info: botInfo,
            opponent_info: botInfo,
            last_activity_timestamp: Date.now(),
          },
        })
      }
    }
  },

  updateBotBudget: (budget: number, cardsAcquired: number) => {
    const currentBot = get().botState
    if (currentBot) {
      set({
        botState: {
          ...currentBot,
          budget: Math.max(0, budget),
          cards_acquired: cardsAcquired,
        },
      })
    }
  },

  // ===== Event Logging =====
  addGameEvent: (type: string, message: string, data?: any) => {
    set((state) => ({
      gameEvents: [
        ...state.gameEvents.slice(-99),
        {
          timestamp: new Date().toISOString(),
          type,
          message,
          data,
        },
      ],
    }))
  },

  clearGameEvents: () => set({ gameEvents: [] }),

  // ===== Reset =====
  reset: () =>
    set({
      ...createInitialState(),
      connectionInfo: { ...initialConnectionInfo },
      gameEvents: [],
    }),
}))
