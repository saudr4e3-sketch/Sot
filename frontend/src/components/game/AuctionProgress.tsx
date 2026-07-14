import React from 'react'
import { AuctionState } from '@/types/game'
import Card from '@/components/ui/Card'
import { Users, TrendingUp } from 'lucide-react'

interface AuctionProgressProps {
  state: AuctionState
}

const AuctionProgress: React.FC<AuctionProgressProps> = ({ state }) => {
  const progress = (state.auction_index / state.total_positions) * 100
  const player1Cards = Object.values(state.player1_team).flat().length
  const player2Cards = Object.values(state.player2_team).flat().length

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      {/* Auction Sequence Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-text-secondary uppercase">Auction Progress</p>
          <p className="text-xs font-bold text-accent-terracotta">
            {state.auction_index + 1} / {state.total_positions}
          </p>
        </div>
        <div className="w-full bg-dark-bg-alt rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-accent-terracotta to-accent-gold h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Auction Sequence Display */}
      <div>
        <p className="text-xs font-semibold text-text-secondary mb-2 uppercase">Sequence</p>
        <div className="grid grid-cols-9 gap-1">
          {state.auction_sequence.map((pos, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-btn text-center text-xs font-bold transition-all duration-300 ${
                idx === state.auction_index
                  ? 'bg-accent-terracotta text-white animate-bounce-auction shadow-lg'
                  : idx < state.auction_index
                  ? 'bg-status-success/20 text-status-success border border-status-success/30'
                  : 'bg-dark-bg-alt text-text-secondary border border-dark-card'
              }`}
            >
              {pos}
            </div>
          ))}
        </div>
      </div>

      {/* Players Info */}
      <div className="grid grid-cols-2 gap-3">
        {/* Player 1 */}
        <div className={`p-3 rounded-btn transition-all ${
          state.current_turn_player === 'player1'
            ? 'bg-accent-terracotta/15 border-2 border-accent-terracotta/50 shadow-md'
            : 'bg-dark-bg-alt border border-dark-card'
        }`}>
          <p className="text-xs text-text-secondary mb-1">You</p>
          <p className="text-lg sm:text-xl font-bold text-text-primary">
            {player1Cards}
          </p>
          <p className="text-xs text-text-muted mt-1">Cards</p>
        </div>

        {/* Player 2 */}
        <div className={`p-3 rounded-btn transition-all ${
          state.current_turn_player === 'player2'
            ? 'bg-accent-terracotta/15 border-2 border-accent-terracotta/50 shadow-md'
            : 'bg-dark-bg-alt border border-dark-card'
        }`}>
          <p className="text-xs text-text-secondary mb-1">Opponent</p>
          <p className="text-lg sm:text-xl font-bold text-text-primary">
            {player2Cards}
          </p>
          <p className="text-xs text-text-muted mt-1">Cards</p>
        </div>
      </div>

      {/* Status */}
      <div className="text-xs text-text-secondary p-2 sm:p-3 rounded-btn bg-dark-bg-alt text-center border border-dark-card">
        Status: <span className="text-accent-terracotta font-bold uppercase">{state.status}</span>
      </div>
    </Card>
  )
}

export default AuctionProgress
