import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Clock, TrendingUp, Target, ChevronDown, User } from 'lucide-react'

interface AuctionTimerProps {
  timeRemaining: number
  currentBid: number
  isYourTurn: boolean
  currentPosition: string
  currentPlayer?: { name: string; rating: number }
  onBid: (amount: number) => void
  onSkip: () => void
  disabled?: boolean
}

const AuctionTimer: React.FC<AuctionTimerProps> = ({
  timeRemaining,
  currentBid,
  isYourTurn,
  currentPosition,
  currentPlayer,
  onBid,
  onSkip,
  disabled,
}) => {
  const [bidAmount, setBidAmount] = useState(currentBid + 1000)
  const [isTimerWarning, setIsTimerWarning] = useState(false)

  useEffect(() => {
    setIsTimerWarning(timeRemaining <= 10)
  }, [timeRemaining])

  const handleBid = () => {
    if (bidAmount > currentBid) {
      onBid(bidAmount)
      setBidAmount(bidAmount + 1000)
    }
  }

  const quickBidAmounts = [currentBid + 1000, currentBid + 5000, currentBid + 10000]

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      {/* Position, Player Name & Timer */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase mb-1">
            Current Position: <span className="text-accent-terracotta font-bold">{currentPosition}</span>
          </p>
          {/* عرض اسم اللاعب الحقيقي والتقييم هنا */}
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-accent-gold/20 text-accent-gold text-xs font-bold px-2 py-0.5 rounded">
              {currentPlayer?.rating || 85}
            </span>
            <p className="text-xl sm:text-2xl font-bold text-text-primary">
              {currentPlayer?.name || `Star ${currentPosition}`}
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-3xl sm:text-4xl font-bold font-mono ${
            isTimerWarning ? 'text-status-error animate-pulse-terracotta' : 'text-accent-gold'
          }`}>
            {timeRemaining.toFixed(1)}
          </div>
          <p className="text-xs text-text-secondary mt-1 flex items-center justify-center gap-1">
            <Clock size={14} /> Time
          </p>
        </div>
      </div>

      {/* Current Bid Display */}
      <div className="bg-dark-bg-alt p-3 sm:p-4 rounded-btn">
        <p className="text-xs text-text-secondary mb-1 flex items-center gap-1">
          <TrendingUp size={14} /> Current Bid
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-text-primary font-mono">
          {currentBid.toLocaleString()}
        </p>
      </div>

      {/* Your Turn Indicator */}
      {isYourTurn && (
        <div className="bg-accent-terracotta/10 border-2 border-accent-terracotta/30 rounded-btn p-3 animate-bounce">
          <p className="text-sm font-semibold text-accent-terracotta flex items-center gap-2">
            <Target size={16} /> Your Turn - Place a Bid or Skip
          </p>
        </div>
      )}

      {/* Bid Input & Controls */}
      {isYourTurn && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              Your Bid Amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={currentBid + 1}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="flex-1"
                disabled={disabled}
              />
              <Button
                onClick={handleBid}
                disabled={disabled || bidAmount <= currentBid}
                size="md"
              >
                Bid
              </Button>
            </div>
          </div>

          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickBidAmounts.map((amount) => (
              <Button
                key={amount}
                onClick={() => {
                  setBidAmount(amount)
                  onBid(amount)
                }}
                variant="secondary"
                size="sm"
                disabled={disabled}
              >
                +{((amount - currentBid) / 1000).toFixed(0)}k
              </Button>
            ))}
          </div>

          <Button
            onClick={onSkip}
            variant="secondary"
            className="w-full"
            disabled={disabled}
          >
            Skip
          </Button>
        </div>
      )}

      {!isYourTurn && (
        <div className="text-center p-4 bg-dark-bg-alt rounded-btn">
          <p className="text-sm text-text-secondary">⏳ Waiting for opponent's decision...</p>
        </div>
      )}
    </Card>
  )
}

export default AuctionTimer
