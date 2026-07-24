/**
 * ============================================================================
 * OSM FUT Dual Battle - Comprehensive TypeScript Game Types & Interfaces
 * Version: 1.0.0 Production Ready
 * Developer: Saud Yahya Al-Faifi
 * ============================================================================
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
  potential?: number
  market_value?: string
  playing_style?: string
  is_custom?: boolean
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
  preferred_formation?: string
  tactical_style?: string
  description?: string
}

export interface Card extends Partial<Player & Manager> {
  type: 'player' | 'manager'
  is_mystery: boolean
  acquired_from: 'auction' | 'mystery_card'
  bid_amount?: number
  acquired_at_timestamp?: number
  card_id?: string
  serial_number?: number
}

export interface CurrentPlayerInfo {
  name: string
  position: string
  rating: number
  image_url?: string
  rarity?: 'Legendary' | 'Medium' | 'Weak'
  nationality?: string
  team?: string
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
  potential?: number
  market_value?: string
  playing_style?: string
}

export interface AuctionState {
  session_id: string
  status: 'waiting' | 'active' | 'bidding' | 'bid_placed' | 'turn_passed' | 'sold' | 'mystery_generated' | 'completed' | string
  current_position: string
  auction_index: number
  total_positions: number
  current_turn_player: string
  highest_bid: number
  highest_bidder: string | null
  timer_remaining: number
  player1_team: Record<string, Card[]>
  player2_team: Record<string, Card[]>
  auction_sequence: string[]
  current_player?: CurrentPlayerInfo
  is_auction_finished?: boolean
  last_activity_timestamp?: number
}

export interface MatchHighlight {
  minute: number
  actor: string
  description: string
  team_side: 'home' | 'away' | 'player1' | 'player2'
  impact_score: number
  event_category: 'goal' | 'save' | 'foul' | 'card' | 'tactical_shift'
}

export interface Commentary {
  minute: number
  type: 'kickoff' | 'action' | 'goal' | 'save' | 'foul' | 'card' | 'halftime' | 'fulltime' | 'tactical_shift' | string
  text: string
  highlight?: MatchHighlight
  author?: string
}

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
  match_duration_seconds?: number
  total_shots_p1?: number
  total_shots_p2?: number
  possession_p1?: number
  possession_p2?: number
  match_id?: string
}

export interface GameMessage {
  type: string
  action?: string
  data?: any
  player_id?: string
  amount?: number
  session_id?: string
  opponent_id?: string
  error?: string
  timestamp?: number
  status_code?: number
}

export interface TeamStatistics {
  player_id: string
  total_cards: number
  positions: Record<string, number>
  auction_wins: number
  mystery_cards: number
  average_rating: number
  total_market_valuation: number
  tactical_cohesion_score?: number
}

export interface SessionMetadata {
  created_at: string
  server_region: string
  version: string
  active_users_count: number
  websocket_status: 'connected' | 'disconnected' | 'reconnecting'
  latency_ms?: number
}

export interface UserProfileConfig {
  user_id: string
  display_name: string
  university_affilliation: string
  academic_id: string
  preferred_roastery: string
  favorite_team: string
  favorite_player: string
  theme_mode?: 'dark' | 'light'
}

export interface WebSocketConfigEndpoint {
  url: string
  reconnect_interval: number
  max_retries: number
  protocols?: string[]
}

export interface AuctionHistoryItem {
  round_index: number
  position: string
  winner_id: string | null
  winning_bid: number
  card_awarded: Card | null
  timestamp: number
}
