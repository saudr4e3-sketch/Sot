/**
 * ============================================================================
 * OSM FUT Dual Battle - Comprehensive TypeScript Game Types & Interfaces
 * Version: 2.0.0 Production Ready
 * Developer: Saud Yahya Al-Faifi
 * ============================================================================
 * 
 * This file contains all TypeScript type definitions for the OSM FUT Dual Battle
 * game. It ensures type safety across the entire application including:
 * - Player & Manager cards
 * - Auction state management
 * - Match simulation results
 * - WebSocket communication
 * - User profiles & sessions
 * 
 * @version 2.0.0
 * @since 1.0.0
 */

// ==================== Core Entity Types ====================

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
  
  // Detailed Stats (FUT Style)
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
  
  // Additional Attributes
  stamina?: number
  aggression?: number
  composure?: number
  vision?: number
  leadership?: number
  
  // Career Info
  potential?: number
  market_value?: string
  weekly_wage?: number
  contract_until?: string
  playing_style?: string
  is_custom?: boolean
  
  // Status
  status?: 'active' | 'injured' | 'suspended' | 'fatigued'
  injury_type?: string
  fatigue_level?: number
  morale?: number
  form?: number
  
  // Special Traits
  special_traits?: string[]
  skill_moves?: number
  weak_foot_ability?: number
  preferred_foot?: 'Left' | 'Right' | 'Both'
  
  // Physical
  height_cm?: number
  weight_kg?: number
  
  // International
  international_caps?: number
  achievements?: string[]
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

export interface Manager {
  id: number
  api_id: number
  name: string
  tactic_rating: number
  nationality: string
  image_url: string
  experience: number
  rarity: 'Legendary' | 'Medium' | 'Weak'
  
  // Tactical
  preferred_formation?: string
  secondary_formation?: string
  tactical_style?: string
  playing_style?: string
  defensive_style?: string
  attacking_style?: string
  
  // Coaching Stats
  attack_coaching?: number
  defense_coaching?: number
  midfield_coaching?: number
  youth_development?: number
  motivation_skill?: number
  discipline?: number
  adaptability?: number
  pressure_handling?: number
  
  // Career
  description?: string
  achievements?: string[]
  special_abilities?: string[]
  leadership_style?: string
  philosophy?: string
  market_value?: number
  contract_until?: string
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

// ==================== Card Types ====================

export type CardType = 'player' | 'manager'
export type AcquisitionMethod = 'auction' | 'mystery_card' | 'trade' | 'reward' | 'starter'

export interface Card extends Partial<Player & Manager> {
  type: CardType
  is_mystery: boolean
  acquired_from: AcquisitionMethod
  bid_amount?: number
  acquired_at_timestamp?: number
  card_id?: string
  serial_number?: number
  
  // Card Status
  is_active?: boolean
  is_injured?: boolean
  matches_played?: number
  goals_scored?: number
  assists?: number
  
  // Market
  purchase_price?: number
  current_value?: number
  
  // Chemistry
  chemistry_bonus?: number
  position_bonus?: number
}

// ==================== Current Player Display ====================

export interface CurrentPlayerInfo {
  name: string
  position: string
  rating: number
  image_url?: string
  rarity?: 'Legendary' | 'Medium' | 'Weak'
  nationality?: string
  team?: string
  age?: number
  
  // Optional detailed stats (hidden during auction)
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
  potential?: number
  market_value?: string
  playing_style?: string
  
  // Card metadata
  card_id?: string
  is_mystery?: boolean
}

// ==================== Auction State ====================

export type AuctionStatus = 
  | 'waiting' 
  | 'active' 
  | 'bidding' 
  | 'bid_placed' 
  | 'turn_passed' 
  | 'sold' 
  | 'mystery_generated' 
  | 'completed'
  | string

export type AuctionPhase = 
  | 'pending'
  | 'active'
  | 'bidding'
  | 'finalizing'
  | 'sold'
  | 'skipped'
  | 'mystery'

export interface AuctionState {
  // ===== PLAYER IDENTIFIERS =====
  player1_id?: string
  player2_id?: string

  // Session Info
  session_id: string
  status: AuctionStatus
  current_position: string
  
  // Progress
  auction_index: number
  total_positions: number
  auction_sequence: string[]
  
  // Turn Management
  current_turn_player: string
  current_auction_phase?: AuctionPhase
  
  // Bid State
  highest_bid: number
  highest_bidder: string | null
  
  // Timer
  timer_remaining: number
  timer_duration?: number
  turn_started_at?: string
  turn_timeout_seconds?: number
  
  // ===== FINANCIAL STATE =====
  // Player 1 Budget
  player1_budget: number
  player1_total_spent: number
  player1_remaining_budget?: number
  
  // Player 2 Budget
  player2_budget: number
  player2_total_spent: number
  player2_remaining_budget?: number
  
  // ===== TEAM COMPOSITION =====
  player1_team: Record<string, Card[]>
  player2_team: Record<string, Card[]>
  
  // ===== PLAYER STATS =====
  player1_cards_won?: number
  player2_cards_won?: number
  player1_bids_count?: number
  player2_bids_count?: number
  player1_skips_count?: number
  player2_skips_count?: number
  
  // ===== CURRENT CARD =====
  current_player?: CurrentPlayerInfo
  
  // ===== GAME STATE =====
  is_auction_finished?: boolean
  match_completed?: boolean
  winner_id?: string | null
  
  // ===== METADATA =====
  last_activity_timestamp?: number
  game_mode?: string
  difficulty_level?: string
  
  // ===== BOT INFO =====
  bot_info?: BotInfo
  
  // ===== NEXT CARD =====
  next_position?: string | null
  
  // ===== PROGRESS =====
  auction_progress?: number
}

// ==================== Bot Information ====================

export interface BotInfo {
  name: string
  budget_remaining: number
  cards_won: number
  strategy: string
  difficulty?: string
  mindset?: 'predator' | 'phantom' | 'psychopath' | 'mastermind'
  aggression_level?: number
  last_action?: string
}

// ==================== Match Types ====================

export interface MatchHighlight {
  minute: number
  actor: string
  description: string
  team_side: 'home' | 'away' | 'player1' | 'player2'
  impact_score: number
  event_category: 'goal' | 'save' | 'foul' | 'card' | 'tactical_shift' | 'chance' | 'tackle' | 'highlight'
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'chance' | 'save' | 'tackle' | 'foul' | 'whistle' | 'highlight' | string
  event: string
  team: 'player1' | 'player2'
}

export interface Commentary {
  minute: number
  type: 'kickoff' | 'action' | 'goal' | 'save' | 'foul' | 'card' | 'halftime' | 'fulltime' | 'tactical_shift' | string
  text: string
  highlight?: MatchHighlight
  author?: string
  is_goal?: boolean
  is_key_moment?: boolean
  tone?: 'excited' | 'tense' | 'analytical' | 'dramatic' | 'neutral' | 'euphoric'
}

export interface MatchStatistics {
  possession: {
    player1: number
    player2: number
  }
  shots: {
    player1: number
    player2: number
  }
  shots_on_target: {
    player1: number
    player2: number
  }
  corners: {
    player1: number
    player2: number
  }
  fouls: {
    player1: number
    player2: number
  }
  yellow_cards: {
    player1: number
    player2: number
  }
  red_cards: {
    player1: number
    player2: number
  }
  pass_accuracy: {
    player1: number
    player2: number
  }
}

export interface GoalDetail {
  scorer: string
  minute: number
  goal_number: number
  assist_by?: string
  goal_type?: 'shot' | 'header' | 'penalty' | 'free_kick' | 'own_goal'
}

export interface MatchResult {
  // Final Scores
  player1_score: number
  player2_score: number
  
  // 30/30/40 Components
  player1_strength: number   // 30% Squad Strength
  player2_strength: number   // 30% Squad Strength
  player1_tactic: number     // 30% Manager Tactic
  player2_tactic: number     // 30% Manager Tactic
  player1_luck: number       // 40% Luck Factor
  player2_luck: number       // 40% Luck Factor
  
  // Result
  winner: 'player1' | 'player2' | 'draw'
  
  // Commentary
  commentary: Commentary[]
  match_events?: MatchEvent[]
  
  // Statistics
  statistics?: MatchStatistics
  goal_details?: {
    player1: GoalDetail[]
    player2: GoalDetail[]
  }
  
  // Summary
  match_summary?: string
  man_of_the_match?: string
  match_duration_seconds?: number
  match_duration_minutes?: number
  
  // Legacy stats (maintained for backward compatibility)
  total_shots_p1?: number
  total_shots_p2?: number
  possession_p1?: number
  possession_p2?: number
  
  // Metadata
  match_id?: string
  match_date?: string
  match_status?: 'completed' | 'forfeited' | 'draw'
  
  // Performance
  player_performances?: Record<string, PlayerPerformance>
}

export interface PlayerPerformance {
  rating: number
  goals: number
  assists: number
  shots: number
  passes: number
  tackles: number
  distance_covered_km?: number
}

// ==================== Bid Types ====================

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

export interface BidHistoryEntry {
  amount: number
  time: string
  player: 'you' | 'opponent' | 'bot'
  type: 'bid' | 'skip' | 'auto'
  timestamp: number
}

// ==================== WebSocket Message Types ====================

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
  | 'error'
  | 'ping'
  | 'pong'
  | 'info'

export interface GameMessage {
  type: WSMessageType | string
  action?: string
  data?: any
  player_id?: string
  amount?: number
  session_id?: string
  opponent_id?: string
  error?: string
  message?: string
  timestamp?: number | string
  status_code?: number
  request_id?: string
  
  // Timer specific
  timer?: {
    remaining: number
    duration: number
    status: 'running' | 'paused' | 'expired' | 'stopped'
    current_player_id?: string
  }
  
  // Bot specific
  bot_name?: string
  bot_version?: string
  bot_strategy?: string
  
  // Match specific
  winner_id?: string
  commentary?: Commentary[]
}

// ==================== Timer Types ====================

export type TimerStatus = 'running' | 'paused' | 'expired' | 'stopped'

export interface TimerState {
  remaining: number
  duration: number
  status: TimerStatus
  currentPlayerId: string | null
  startedAt: string | null
  lastActivity: string | null
}

// ==================== Statistics Types ====================

export interface TeamStatistics {
  player_id: string
  player_name?: string
  is_bot?: boolean
  
  // Card Stats
  total_cards: number
  positions: Record<string, number>
  auction_wins: number
  mystery_cards: number
  
  // Ratings
  average_rating: number
  highest_rated_player?: string
  lowest_rated_player?: string
  
  // Financial
  total_spent: number
  remaining_budget: number
  total_market_valuation: number
  
  // Tactical
  tactical_cohesion_score?: number
  strongest_position?: string
  weakest_position?: string
  
  // Performance
  matches_played?: number
  matches_won?: number
  matches_lost?: number
  matches_drawn?: number
}

// ==================== Session Types ====================

export interface SessionMetadata {
  created_at: string
  updated_at?: string
  completed_at?: string
  server_region: string
  version: string
  active_users_count: number
  websocket_status: 'connected' | 'disconnected' | 'reconnecting'
  latency_ms?: number
  uptime_seconds?: number
  
  // Performance
  total_requests?: number
  total_errors?: number
  avg_response_time_ms?: number
}

export interface GameSession {
  id: string
  player1_id: string
  player2_id: string
  status: AuctionStatus
  
  // Turn
  current_turn: string | null
  current_auction_phase?: AuctionPhase
  
  // Teams
  player1_team: Record<string, Card[]>
  player2_team: Record<string, Card[]>
  
  // Auction Progress
  auction_index: number
  total_auctions: number
  current_card_position?: string | null
  highest_bid: number
  highest_bidder: string | null
  
  // Financial
  player1_budget: number
  player2_budget: number
  player1_total_spent: number
  player2_total_spent: number
  player1_remaining_budget?: number
  player2_remaining_budget?: number
  
  // Stats
  player1_cards_won: number
  player2_cards_won: number
  player1_bids_count: number
  player2_bids_count: number
  player1_skips_count: number
  player2_skips_count: number
  
  // Result
  winner_id: string | null
  match_completed: boolean
  
  // Timer
  turn_started_at?: string | null
  turn_timeout_seconds: number
  
  // Metadata
  game_mode?: string
  difficulty_level?: string
  settings?: Record<string, any>
  
  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string | null
  auction_started_at?: string | null
  match_started_at?: string | null
}

// ==================== User Types ====================

export interface UserProfileConfig {
  user_id: string
  display_name: string
  university_affilliation: string
  academic_id: string
  preferred_roastery: string
  favorite_team: string
  favorite_player: string
  theme_mode?: 'dark' | 'light'
  
  // Preferences
  language?: string
  notifications_enabled?: boolean
  sound_enabled?: boolean
  
  // Stats
  games_played?: number
  games_won?: number
  total_cards_collected?: number
  total_spent?: number
  rank?: number
}

// ==================== Configuration Types ====================

export interface WebSocketConfigEndpoint {
  url: string
  reconnect_interval: number
  max_retries: number
  protocols?: string[]
  ping_interval?: number
  timeout?: number
}

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

// ==================== History Types ====================

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

// ==================== API Response Types ====================

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

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

// ==================== Component Props Types ====================

export interface AuctionTimerProps {
  timeRemaining: number
  currentBid: number
  isYourTurn: boolean
  currentPosition: string
  currentPlayer?: CurrentPlayerInfo
  onBid: (amount: number) => void
  onSkip: () => void
  disabled?: boolean
  playerBudget?: number
  playerTotalSpent?: number
}

export interface AuctionProgressProps {
  state: AuctionState
  timerRemaining?: number
  timerDuration?: number
  onTimerExpired?: () => void
}

export interface PlayerCardProps {
  name: string
  position: string
  rating: number
  team?: string
  image_url?: string
  rarity?: 'Legendary' | 'Medium' | 'Weak'
  is_mystery?: boolean
  nationality?: string
  potential?: number
  market_value?: string
  style?: string
  experience_years?: number
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
}

// ==================== Action Types (Redux/State Management) ====================

export type GameAction =
  | { type: 'SET_AUCTION_STATE'; payload: AuctionState }
  | { type: 'UPDATE_TIMER'; payload: { remaining: number } }
  | { type: 'PLACE_BID'; payload: { player_id: string; amount: number } }
  | { type: 'SKIP_TURN'; payload: { player_id: string } }
  | { type: 'SET_MATCH_RESULT'; payload: MatchResult }
  | { type: 'ADD_MYSTERY_CARD'; payload: { card: Card } }
  | { type: 'SET_ERROR'; payload: { message: string } }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_BUDGET'; payload: { player_id: string; budget: number; spent: number } }

// ==================== Utility Types ====================

export type Position = 'GK' | 'DEF' | 'MID' | 'ATT' | 'MGR'
export type Rarity = 'Legendary' | 'Medium' | 'Weak'
export type GameRolePlayer = 'player1' | 'player2'
export type MatchWinner = 'player1' | 'player2' | 'draw'
export type TeamSide = 'home' | 'away' | 'player1' | 'player2'
export type BidType = 'standard' | 'counter' | 'aggressive'
export type CardStatus = 'active' | 'injured' | 'benched'
export type GameMode = 'standard' | 'tournament' | 'friendly' | 'ranked'
export type Difficulty = 'easy' | 'normal' | 'hard' | 'legend'

// ==================== Constants ====================

export const GAME_CONSTANTS = {
  MAX_BUDGET: 100,               // مليون يورو
  DEFAULT_TIMER: 30,             // ثانية
  TOTAL_AUCTION_CARDS: 9,        // 8 لاعبين + 1 مدرب
  MIN_BID_INCREMENT: 0.5,        // مليون يورو
  MYSTERY_CARD_PROBABILITIES: {
    Legendary: 0.30,             // 30%
    Medium: 0.30,                // 30%
    Weak: 0.40                   // 40%
  },
  MATCH_WEIGHTS: {
    squad_strength: 0.30,       // 30%
    manager_tactic: 0.30,       // 30%
    luck: 0.40                  // 40%
  },
  POSITIONS: ['GK', 'DEF', 'MID', 'ATT', 'MGR'] as Position[],
  AUCTION_SEQUENCE: ['GK', 'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT', 'MGR', 'MGR'],
} as const

// ==================== Export All ====================

export type {
  // Re-export utility types
  Position,
  Rarity,
  MatchWinner,
  TeamSide,
  BidType,
  CardStatus,
  GameMode,
  Difficulty,
}
