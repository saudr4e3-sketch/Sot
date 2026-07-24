/**
 * OSM FUT Dual Battle - Comprehensive TypeScript Game Types & Interfaces
 * Version: 1.0.0 Production Ready
 * Developer: Saud Yahya Al-Faifi
 */

export interface Player {
  id: number
  api_id: number
  name: string
  position: string
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
}

export interface Card extends Partial<Player & Manager> {
  type: 'player' | 'manager'
  is_mystery: boolean
  acquired_from: 'auction' | 'mystery_card'
  bid_amount?: number
  acquired_at_timestamp?: number
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
}

export interface AuctionState {
  session_id: string
  status: 'waiting' | 'active' | 'bidding' | 'bid_placed' | 'turn_passed' | 'sold' | 'mystery_generated' | 'completed'
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
}

export interface MatchHighlight {
  minute: number
  actor: string
  description: string
  team_side: 'home' | 'away'
  impact_score: number
}

export interface Commentary {
  minute: number
  type: 'kickoff' | 'action' | 'goal' | 'save' | 'foul' | 'card' | 'halftime' | 'fulltime' | 'tactical_shift'
  text: string
  highlight?: MatchHighlight
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
}

export interface TeamStatistics {
  player_id: string
  total_cards: number
  positions: Record<string, number>
  auction_wins: number
  mystery_cards: number
  average_rating: number
  total_market_valuation: number
}

export interface SessionMetadata {
  created_at: string
  server_region: string
  version: string
  active_users_count: number
  websocket_status: 'connected' | 'disconnected' | 'reconnecting'
}

export interface UserProfileConfig {
  user_id: string
  display_name: string
  university_affilliation: string
  academic_id: string
  preferred_roastery: string
  favorite_team: string
  favorite_player: string
}
