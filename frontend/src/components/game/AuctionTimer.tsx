import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PlayerCard from './PlayerCard'
import { Clock, TrendingUp, Target, ChevronDown, Award, Zap, Shield, Flame, Activity } from 'lucide-react'

interface AuctionTimerProps {
  timeRemaining: number
  currentBid: number
  isYourTurn: boolean
  currentPosition: string
  currentPlayer?: { 
    name: string
    rating: number
    position: string
    image_url?: string
    rarity?: 'Legendary' | 'Medium' | 'Weak'
  }
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
  const [bidHistory, setBidHistory] = useState<Array<{amount: number, time: string}>>([])

  useEffect(() => {
    setIsTimerWarning(timeRemaining <= 10)
  }, [timeRemaining])

  useEffect(() => {
    if (currentBid > 0) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setBidHistory(prev => [{ amount: currentBid, time: now }, ...prev.slice(0, 4)])
    }
  }, [currentBid])

  const handleBid = () => {
    if (bidAmount > currentBid) {
      onBid(bidAmount)
      setBidAmount(bidAmount + 1000)
    }
  }

  const quickBidAmounts = [
    currentBid + 1000, 
    currentBid + 5000, 
    currentBid + 10000,
    currentBid + 25000
  ]

  const playerName = currentPlayer?.name || `Elite Star ${currentPosition}`
  const playerRating = currentPlayer?.rating || 85
  const playerRarity = currentPlayer?.rarity || 'Legendary'

  return (
    <Card className="p-5 sm:p-7 space-y-6 bg-gradient-to-b from-dark-bg-alt to-dark-bg border-2 border-dark-card shadow-2xl rounded-3xl">
      {/* Header Info & Dynamic Countdown Timer Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-dark-card pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-accent-terracotta/20 text-accent-terracotta text-xs font-black uppercase px-2.5 py-1 rounded-lg border border-accent-terracotta/30 flex items-center gap-1">
              <Flame size={12} /> Active Live Auction
            </span>
            <span className="text-xs text-text-secondary font-mono">Position: {currentPosition}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary mt-1.5 tracking-tight">
            Strategic Bidding Phase
          </h2>
        </div>
        
        {/* Timer Box */}
        <div className="flex items-center gap-3 bg-dark-bg p-3 rounded-2xl border border-dark-card shadow-inner w-full sm:w-auto justify-between sm:justify-center">
          <div className="flex items-center gap-2">
            <Clock className={isTimerWarning ? 'text-status-error animate-spin' : 'text-accent-gold'} size={20} />
            <span className="text-xs font-bold text-text-secondary uppercase">Time Left</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono px-3 py-0.5 rounded-xl ${
            isTimerWarning ? 'text-status-error bg-status-error/10 animate-pulse' : 'text-amber-400 bg-amber-400/10'
          }`}>
            {timeRemaining.toFixed(1)}s
          </div>
        </div>
      </div>

      {/* Embedded Modern Player Card Component */}
      <div className="my-2 transform transition-all duration-300 hover:scale-[1.01]">
        <PlayerCard
          name={playerName}
          position={currentPosition}
          rating={playerRating}
          rarity={playerRarity}
          image_url={currentPlayer?.image_url}
        />
      </div>

      {/* Financial Status & Current Highest Bid Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-dark-bg p-4 rounded-2xl border border-dark-card flex flex-col justify-center shadow-md">
          <span className="text-xs text-text-secondary font-semibold uppercase flex items-center gap-1">
            <TrendingUp size={14} className="text-amber-400" /> Current Highest Bid
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">
            {currentBid.toLocaleString()} €
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 flex flex-col justify-center shadow-md transition-all ${
          isYourTurn 
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Target size={14} /> Turn Status Indicator
          </span>
          <span className="text-base sm:text-lg font-black mt-1">
            {isYourTurn ? "🔥 Your Turn to Dominate & Bid!" : "⏳ Opponent's Turn - Stay Alert"}
          </span>
        </div>
      </div>

      {/* Turn Control Center & Bidding Actions */}
      {isYourTurn ? (
        <div className="space-y-4 bg-dark-bg/80 p-4 sm:p-5 rounded-2xl border border-dark-card shadow-lg">
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
              Custom Bid Allocation Engine (€)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={currentBid + 1}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="flex-1 bg-dark-card border border-dark-card text-text-primary font-mono font-bold text-lg px-4 py-2.5 rounded-xl focus:outline-none focus:border-accent-terracotta"
                disabled={disabled}
              />
              <Button
                onClick={handleBid}
                disabled={disabled || bidAmount <= currentBid}
                size="lg"
                className="px-6 font-black shadow-lg"
              >
                Place Bid
              </Button>
            </div>
          </div>

          {/* Quick Increment Bid Action Buttons */}
          <div>
            <span className="block text-[11px] font-bold text-text-secondary uppercase mb-2">
              Quick Increment Shortcuts
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className="font-mono font-bold text-xs bg-dark-card hover:bg-accent-terracotta/20 border-accent-terracotta/30"
                >
                  +{((amount - currentBid) / 1000).toFixed(0)}k €
                </Button>
              ))}
            </div>
          </div>

          {/* Skip Turn Button */}
          <div className="pt-2 border-t border-dark-card">
            <Button
              onClick={onSkip}
              variant="outline"
              className="w-full border-rose-500/50 text-rose-400 hover:bg-rose-500/10 font-bold py-3"
              disabled={disabled}
            >
              Skip Turn / Pass Card (Trigger Mystery Card)
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-dark-bg rounded-2xl border border-dark-card shadow-inner space-y-2">
          <Activity className="animate-pulse mx-auto text-accent-terracotta" size={28} />
          <p className="text-sm font-bold text-text-primary">Waiting for opponent tactical response...</p>
          <p className="text-xs text-text-secondary">Analyze the current market value and prepare your next counter-bid.</p>
        </div>
      )}

      {/* Live Recent Bidding Activity Log Feed */}
      {bidHistory.length > 0 && (
        <div className="bg-dark-bg p-3.5 rounded-2xl border border-dark-card space-y-2">
          <span className="text-[11px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1">
            <Activity size={12} className="text-accent-terracotta" /> Recent Session Bid Feed
          </span>
          <div className="space-y-1">
            {bidHistory.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono py-1 px-2 rounded-lg bg-dark-card/50">
                <span className="text-amber-400 font-bold">{item.amount.toLocaleString()} €</span>
                <span className="text-text-secondary text-[10px]">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default AuctionTimer
