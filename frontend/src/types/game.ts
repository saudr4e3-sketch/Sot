/**
 * ============================================================================
 * OSM FUT Dual Battle - Centralized Game Type Definitions
 * Version: 5.0.0 - Enterprise Grade, Fully Decoupled, No Circular Imports
 * ============================================================================
 *
 * This file contains ALL TypeScript type definitions for the OSM FUT Dual Battle
 * game. It is a standalone module with zero internal imports to prevent any
 * circular dependency or self-import issues during the build process.
 *
 * Types are organized by domain: Players, Auction, Match, WebSocket, and Store.
 *
 * @author Saud Yahya Al-Faifi
 * @contact 0535103986
 * @version 5.0.0
 */

// ============================================================================
// SECTION 1: CORE ENTITY TYPES
// ============================================================================

/**
 * Represents a football player's core attributes.
 */
export interface Player {
  id: number
  api_id: number
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'ATT' | 'MGR' | string
  rating: number
  team: string
  image_url: string
  nationality: string
  age: number
  rarity: 'Legendary' | 'Medium' | 'Weak'

  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number

  stamina?: number
  aggression?: number
  composure?: number
  vision?: number
  leadership?: number

  potential?: number
  market_value?: string
  weekly_wage?: number
  contract_until?: string
  playing_style?: string
  is_custom?: boolean

  status?: 'active' | 'injured' | 'suspended' | 'fatigued'
  injury_type?: string
  fatigue_level?: number
  morale?: number
  form?: number

  special_traits?: string[]
  skill_moves?: number
  weak_foot_ability?: number
  preferred_foot?: 'Left' | 'Right' | 'Both'

  height_cm?: number
  weight_kg?: number

  international_caps?: number
  achievements?: string[]

  created_at?: string
  updated_at?: string
}

/**
 * Represents a football manager's attributes.
 */
export interface Manager {
  id: number
  api_id: number
  name: string
  tactic_rating: number
  nationality: string
  image_url: string
  experience: number
  rarity: 'Legendary' | 'Medium' | 'Weak'

  preferred_formation?: string
  secondary_formation?: string
  tactical_style?: string
  playing_style?: string
  defensive_style?: string
  attacking_style?: string

  attack_coaching?: number
  defense_coaching?: number
  midfield_coaching?: number
  youth_development?: number
  motivation_skill?: number
  discipline?: number
  adaptability?: number
  pressure_handling?: number

  description?: string
  achievements?: string[]
  special_abilities?: string[]
  leadership_style?: string
  philosophy?: string
  market_value?: number
  contract_until?: string

  created_at?: string
  updated_at?: string
}

// ============================================================================
// SECTION 2: CARD & COLLECTION TYPES
// ============================================================================

export type CardType = 'player' | 'manager'
export type AcquisitionMethod = 'auction' | 'mystery_card' | 'trade' | 'reward' | 'starter'

/**
 * Represents a card in a player's collection.
 */
export interface Card extends Omit<Partial<Player>, 'market_value'>, Omit<Partial<Manager>, 'market_value'> {
  type: CardType
  is_mystery: boolean
  acquired_from: AcquisitionMethod
  bid_amount?: number
  acquired_at_timestamp?: number
  card_id?: string
  serial_number?: number

  is_active?: boolean
  is_injured?: boolean
  matches_played?: number
  goals_scored?: number
  assists?: number

  purchase_price?: number
  current_value?: number

  chemistry_bonus?: number
  position_bonus?: number
  market_value?: string | number
}

// ============================================================================
// SECTION 3: AUCTION STATE TYPES
// ============================================================================

export type AuctionStatus =
  | 'waiting'
  | 'active'
  | 'bidding'
  | 'bid_placed'
  | 'turn_passed'
  | 'sold'
  | 'mystery_generated'
  | 'completed'
  | 'idle'
  | string

export type AuctionPhase =
  | 'pending'
  | 'active'
  | 'bidding'
  | 'finalizing'
  | 'sold'
  | 'skipped'
  | 'mystery'

/**
 * Represents the current player being auctioned, shown in the UI.
 */
export interface CurrentPlayerInfo {
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

/**
 * Represents the complete state of an auction session.
 */
export interface AuctionState {
  player1_id?: string
  player2_id?: string

  session_id: string
  status: AuctionStatus
  current_position: string

  auction_index: number
  total_positions: number
  auction_sequence: string[]

  current_turn_player: string
  current_auction_phase?: AuctionPhase

  highest_bid: number
  highest_bidder: string | null

  timer_remaining: number
  timer_duration?: number
  turn_started_at?: string
  turn_timeout_seconds?: number

  player1_budget: number
  player1_total_spent: number
  player1_remaining_budget?: number

  player2_budget: number
  player2_total_spent: number
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

/**
 * Represents information about the AI bot opponent.
 */
export interface BotInfo {
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
  difficulty?: string
  strategy?: string
  aggression_level?: number
  last_action?: string
}

// ============================================================================
// SECTION 4: MATCH & COMMENTARY TYPES
// ============================================================================

/**
 * Represents a single commentary event during a match simulation.
 */
export interface Commentary {
  minute: number
  type: 'kickoff' | 'action' | 'goal' | 'save' | 'foul' | 'card' | 'halftime' | 'fulltime' | 'tactical_shift' | 'highlight' | string
  text: string
  author?: string
  is_goal?: boolean
  is_key_moment?: boolean
  tone?: 'excited' | 'tense' | 'analytical' | 'dramatic' | 'neutral' | 'euphoric'
  team_side?: 'home' | 'away' | 'player1' | 'player2'
  impact_score?: number
  event_category?: 'goal' | 'save' | 'foul' | 'card' | 'tactical_shift' | 'chance' | 'tackle' | 'highlight' | string
}

/**
 * Represents a match event (goal, card, etc.).
 */
export interface MatchEvent {
  minute: number
  type: 'goal' | 'chance' | 'save' | 'tackle' | 'foul' | 'whistle' | 'highlight' | string
  event: string
  team: 'player1' | 'player2'
}

/**
 * Represents a goal detail.
 */
export interface GoalDetail {
  scorer: string
  minute: number
  goal_number: number
  assist_by?: string
  goal_type?: 'shot' | 'header' | 'penalty' | 'free_kick' | 'own_goal'
}

/**
 * Represents match statistics.
 */
export interface MatchStatistics {
  possession: { player1: number; player2: number }
  shots: { player1: number; player2: number }
  shots_on_target: { player1: number; player2: number }
  corners: { player1: number; player2: number }
  fouls: { player1: number; player2: number }
  yellow_cards: { player1: number; player2: number }
  red_cards: { player1: number; player2: number }
  pass_accuracy: { player1: number; player2: number }
}

/**
 * Represents a player's performance in a match.
 */
export interface PlayerPerformance {
  rating: number
  goals: number
  assists: number
  shots: number
  passes: number
  tackles: number
  distance_covered_km?: number
}

/**
 * Represents the final result of a simulated match.
 */
export interface MatchResult {
  player1_score: number
  player2_score: number

  player1_strength: number
  player2_strength: number
  player1_tactic: number
  player2_tactic: number
  player1_luck: number
  player2_luck: number

  winner: 'player1' | 'player2' | 'draw'

  commentary: Commentary[]
  match_events?: MatchEvent[]

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
  match_status?: 'completed' | 'forfeited' | 'draw'

  player_performances?: Record<string, PlayerPerformance>
}

// ============================================================================
// SECTION 5: WEBSOCKET COMMUNICATION TYPES
// ============================================================================

/**
 * All possible WebSocket message types.
 */
export type WSMessageType =
  | 'connected'
  | 'auction_started'
  | 'auction_state'
  | 'auction_completed'
  | 'bid_placed'
  | 'bid_failed'
  | 'turn_skipped'
  | 'skip_failed'
  | 'timer_update'
  | 'timer_expired'
  | 'match_starting'
  | 'match_completed'
  | 'mystery_card'
  | 'bot_joined'
  | 'state_update'
  | 'error'
  | 'ping'
  | 'pong'
  | 'info'
  | string

/**
 * Represents the structure of a message sent or received via WebSocket.
 */
export interface GameMessage {
  type: WSMessageType
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
    status: 'running' | 'paused' | 'expired' | 'stopped'
    current_player_id?: string
  }

  bot_name?: string
  bot_version?: string
  bot_strategy?: string

  winner_id?: string
  commentary?: Commentary[]
}

/**
 * Represents the state of the auction timer.
 */
export interface TimerState {
  remaining: number
  duration: number
  status: 'running' | 'paused' | 'expired' | 'stopped'
  currentPlayerId: string | null
  startedAt: string | null
  lastActivity: string | null
}

// ============================================================================
// SECTION 6: BID & HISTORY TYPES
// ============================================================================

/**
 * Represents a single bid placed during an auction.
 */
export interface Bid {
  id: number
  session_id: string
  player_id: string
  amount: number
  card_position: number
  bid_type?: 'standard' | 'counter' | 'aggressive'
  is_bluff?: boolean
  is_winning_bid?: boolean
  status?: 'placed' | 'accepted' | 'rejected' | 'outbid'
  timestamp: string
  response_time_seconds?: number
}

/**
 * Represents an entry in the bid history UI.
 */
export interface BidHistoryEntry {
  amount: number
  time: string
  player: 'you' | 'opponent' | 'bot'
  type: 'bid' | 'skip' | 'auto'
  timestamp: number
}

// ============================================================================
// SECTION 7: GAME SESSION & CONFIGURATION TYPES
// ============================================================================

/**
 * Represents the full game session metadata.
 */
export interface GameSession {
  id: string
  player1_id: string
  player2_id: string
  status: AuctionStatus

  current_turn: string | null
  current_auction_phase?: AuctionPhase

  player1_team: Record<string, Card[]>
  player2_team: Record<string, Card[]>

  auction_index: number
  total_auctions: number
  current_card_position?: string | null
  highest_bid: number
  highest_bidder: string | null

  player1_budget: number
  player2_budget: number
  player1_total_spent: number
  player2_total_spent: number
  player1_remaining_budget?: number
  player2_remaining_budget?: number

  player1_cards_won: number
  player2_cards_won: number
  player1_bids_count: number
  player2_bids_count: number
  player1_skips_count: number
  player2_skips_count: number

  winner_id: string | null
  match_completed: boolean

  turn_started_at?: string | null
  turn_timeout_seconds: number

  game_mode?: string
  difficulty_level?: string
  settings?: Record<string, any>

  created_at: string
  updated_at: string
  completed_at?: string | null
  auction_started_at?: string | null
  match_started_at?: string | null
}

/**
 * Represents the global game configuration constants.
 */
export interface GameConfig {
  auction_timer_duration: number
  max_budget: number
  min_bid_increment: number
  total_auction_cards: number
  auction_positions: string[]
  mystery_card_probabilities: {
    Legendary: number
    Medium: number
    Weak: number
  }
  match_simulation_weights: {
    squad_strength: number
    manager_tactic: number
    luck: number
  }
}

/**
 * Represents WebSocket connection configuration.
 */
export interface WebSocketConfigEndpoint {
  url: string
  reconnect_interval: number
  max_retries: number
  protocols?: string[]
  ping_interval?: number
  timeout?: number
}

/**
 * Represents the game connection state.
 */
export interface ConnectionInfo {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  latency_ms: number
  last_ping_at?: string
  last_pong_at?: string
  reconnection_attempts: number
}

// ============================================================================
// SECTION 8: USER & PROFILE TYPES
// ============================================================================

/**
 * Represents a user's profile and preferences.
 */
export interface UserProfileConfig {
  user_id: string
  display_name: string
  university_affilliation: string
  academic_id: string
  preferred_roastery: string
  favorite_team: string
  favorite_player: string
  theme_mode?: 'dark' | 'light'

  language?: string
  notifications_enabled?: boolean
  sound_enabled?: boolean

  games_played?: number
  games_won?: number
  total_cards_collected?: number
  total_spent?: number
  rank?: number
}

// ============================================================================
// SECTION 9: API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper.
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: number
    type: string
    message: string
    details?: any
    request_id?: string
  }
  timestamp: string
}

/**
 * Generic paginated response.
 */
export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

// ============================================================================
// SECTION 10: HISTORY TYPES
// ============================================================================

/**
 * Represents a single item in the auction history.
 */
export interface AuctionHistoryItem {
  round_index: number
  position: string
  winner_id: string | null
  winning_bid: number
  card_awarded: Card | null
  timestamp: number
  losing_player_received_mystery?: boolean
  mystery_card?: Card
}

/**
 * Represents a single item in the match history.
 */
export interface MatchHistoryItem {
  match_id: string
  opponent_id: string
  opponent_name: string
  player_score: number
  opponent_score: number
  winner_id: string
  match_date: string
  match_duration_seconds: number
  commentary: Commentary[]
}

// ============================================================================
// SECTION 11: TEAM & STATISTICS TYPES
// ============================================================================

/**
 * Represents team-wide statistics.
 */
export interface TeamStatistics {
  player_id: string
  player_name?: string
  is_bot?: boolean

  total_cards: number
  positions: Record<string, number>
  auction_wins: number
  mystery_cards: number

  average_rating: number
  highest_rated_player?: string
  lowest_rated_player?: string

  total_spent: number
  remaining_budget: number
  total_market_valuation: number

  tactical_cohesion_score?: number
  strongest_position?: string
  weakest_position?: string

  matches_played?: number
  matches_won?: number
  matches_lost?: number
  matches_drawn?: number
}

// ============================================================================
// SECTION 12: GAME STORE TYPES (for Zustand)
// ============================================================================

/**
 * Represents a game event for logging/debugging.
 */
export interface GameEvent {
  timestamp: string
  type: string
  message: string
  data?: any
}

// ============================================================================
// SECTION 13: UTILITY TYPES
// ============================================================================

export type Position = 'GK' | 'DEF' | 'MID' | 'ATT' | 'MGR'
export type Rarity = 'Legendary' | 'Medium' | 'Weak'
export type GameRolePlayer = 'player1' | 'player2'
export type MatchWinner = 'player1' | 'player2' | 'draw'
export type TeamSide = 'home' | 'away' | 'player1' | 'player2'
export type BidType = 'standard' | 'counter' | 'aggressive'
export type CardStatus = 'active' | 'injured' | 'benched'
export type GameMode = 'standard' | 'tournament' | 'friendly' | 'ranked'
export type Difficulty = 'easy' | 'normal' | 'hard' | 'legend'
export type GamePhase = 'idle' | 'connecting' | 'auction' | 'match' | 'completed'
export type TimerSeverity = 'normal' | 'warning' | 'critical' | 'expired'

// ============================================================================
// SECTION 14: GAME CONSTANTS
// ============================================================================

export const GAME_CONSTANTS = {
  MAX_BUDGET: 100,
  DEFAULT_TIMER: 30,
  TOTAL_AUCTION_CARDS: 9,
  MIN_BID_INCREMENT: 0.5,
  MYSTERY_CARD_PROBABILITIES: {
    Legendary: 0.30,
    Medium: 0.30,
    Weak: 0.40,
  },
  MATCH_WEIGHTS: {
    squad_strength: 0.30,
    manager_tactic: 0.30,
    luck: 0.40,
  },
  POSITIONS: ['GK', 'DEF', 'MID', 'ATT', 'MGR'] as Position[],
  AUCTION_SEQUENCE: ['GK', 'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT', 'MGR', 'MGR'],
} as const
