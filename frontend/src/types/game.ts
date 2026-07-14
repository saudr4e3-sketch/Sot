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
}

export interface Card extends Partial<Player & Manager> {
  type: 'player' | 'manager'
  is_mystery: boolean
  acquired_from: 'auction' | 'mystery_card'
}

export interface AuctionState {
  session_id: string
  status: string
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
}

export interface Commentary {
  minute: number
  type: 'kickoff' | 'action' | 'halftime' | 'fulltime'
  text: string
}

export interface GameMessage {
  type: string
  data: any
  player_id?: string
  amount?: number
  error?: string
}
