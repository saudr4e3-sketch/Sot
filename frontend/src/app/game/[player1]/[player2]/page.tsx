'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { AuctionState, GameMessage } from '@/types/game'
import AuctionTimer from '@/components/game/AuctionTimer'
import AuctionProgress from '@/components/game/AuctionProgress'
import CommentaryView from '@/components/game/CommentaryView'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { AlertCircle, Loader, Play } from 'lucide-react'

export default function GamePage() {
  const params = useParams()
  const player1Id = params.player1 as string
  const player2Id = params.player2 as string
  
  const {
    auctionState,
    setAuctionState,
    setIsLoading,
    setError,
    error: storeError,
    isLoading,
  } = useGameStore()
  
  const [sessionId, setSessionId] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [commentary, setCommentary] = useState<any[]>([])

  // Initialize WebSocket connection
  const handleGameMessage = useCallback((message: GameMessage) => {
    console.log('[Game] Message:', message.type)
    
    if (message.type === 'auction_started') {
      setAuctionState(message.data)
      setIsLoading(false)
    } else if (message.type === 'bid_placed') {
      setAuctionState(message.data)
      setIsLoading(false)
    } else if (message.type === 'turn_skipped') {
      setAuctionState(message.data)
      setIsLoading(false)
    } else if (message.type === 'auction_completed') {
      setAuctionState(message.data.state)
      setIsLoading(false)
    } else if (message.type === 'match_completed') {
      setCommentary(message.data.commentary || [])
      setIsLoading(false)
    } else if (message.error) {
      setError(message.error)
      setIsLoading(false)
    }
  }, [setAuctionState, setIsLoading, setError])

  const { isConnected, send } = useWebSocket({
    sessionId,
    playerId: player1Id,
    onMessage: handleGameMessage,
    onConnect: () => {
      console.log('[Game] Connected to WebSocket')
      setIsLoading(false)
    },
    onDisconnect: () => {
      console.log('[Game] Disconnected from WebSocket')
      setError('Connection lost. Please refresh the page.')
    },
  })

  // Initialize game
  useEffect(() => {
    if (!isInitialized && isConnected) {
      const newSessionId = `session_${Date.now()}`
      setSessionId(newSessionId)
      setIsInitialized(true)
      setIsLoading(true)
      
      // Send start auction message
      send({
        type: 'start_auction',
        action: 'start_auction',
        opponent_id: player2Id,
      })
    }
  }, [isConnected, isInitialized, player2Id, send, setIsLoading])

  const handlePlaceBid = (amount: number) => {
    setIsLoading(true)
    send({
      type: 'place_bid',
      action: 'place_bid',
      session_id: sessionId,
      player_id: player1Id,
      amount,
    })
  }

  const handleSkipBid = () => {
    setIsLoading(true)
    send({
      type: 'skip_bid',
      action: 'skip_bid',
      session_id: sessionId,
      player_id: player1Id,
    })
  }

  const handleStartMatch = () => {
    setIsLoading(true)
    send({
      type: 'start_match',
      action: 'start_match',
      session_id: sessionId,
      player_id: player1Id,
    })
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm">
          <Loader className="animate-spin mx-auto mb-4 text-accent-terracotta" size={40} />
          <p className="text-text-primary font-semibold">Connecting to game...</p>
        </Card>
      </div>
    )
  }

  if (!auctionState) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm">
          <Loader className="animate-spin mx-auto mb-4 text-accent-terracotta" size={40} />
          <p className="text-text-primary font-semibold">Initializing auction...</p>
        </Card>
      </div>
    )
  }

  const isAuctionComplete = auctionState.status === 'completed'
  const isPlayersTurn = auctionState.current_turn_player === player1Id

  return (
    <main className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-bg-alt border-b border-dark-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-2xl sm:text-3xl">⚽</div>
            <h1 className="text-lg sm:text-xl font-bold text-text-primary">OSM FUT Auction</h1>
          </div>
          <div className="text-xs sm:text-sm text-text-secondary hidden sm:block">
            Session: <span className="text-accent-terracotta font-mono">{sessionId.slice(0, 15)}...</span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {storeError && (
          <Card className="p-3 sm:p-4 mb-6 bg-status-error/10 border border-status-error flex items-start gap-3">
            <AlertCircle className="text-status-error flex-shrink-0 mt-1" size={18} />
            <p className="text-status-error text-sm">{storeError}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left - Main Auction Control */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <AuctionTimer
              timeRemaining={Math.max(0, auctionState.timer_remaining)}
              currentBid={auctionState.highest_bid}
              isYourTurn={isPlayersTurn}
              currentPosition={auctionState.current_position}
              onBid={handlePlaceBid}
              onSkip={handleSkipBid}
              disabled={!isPlayersTurn || isLoading}
            />

            {/* Teams Overview */}
            <Card className="p-4 sm:p-6">
              <h3 className="font-bold text-text-primary mb-4 text-base sm:text-lg">Team Status</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-btn bg-dark-bg-alt border-2 border-accent-terracotta/30">
                  <p className="text-xs text-text-secondary mb-2">Your Team</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-terracotta">
                    {Object.values(auctionState.player1_team).flat().length}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Cards</p>
                </div>
                <div className="p-3 sm:p-4 rounded-btn bg-dark-bg-alt border-2 border-accent-gold/30">
                  <p className="text-xs text-text-secondary mb-2">Opponent</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-gold">
                    {Object.values(auctionState.player2_team).flat().length}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Cards</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right - Progress & Commentary */}
          <div className="space-y-4 sm:space-y-6">
            <AuctionProgress state={auctionState} />
            <CommentaryView commentary={commentary} isLive={!isAuctionComplete} maxHeight="max-h-64 sm:max-h-96" />

            {/* Action Buttons */}
            {isAuctionComplete && (
              <Button
                onClick={handleStartMatch}
                className="w-full"
                size="lg"
                loading={isLoading}
              >
                <Play size={18} className="mr-2" />
                Start Match
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer with Developer Signature */}
      <footer className="bg-dark-bg-alt border-t border-dark-card mt-8 sm:mt-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
          <p className="text-text-secondary text-xs sm:text-sm">
            © 2024 OSM FUT Dual Battle. All rights reserved.
          </p>
          <p className="text-text-secondary text-xs sm:text-sm whitespace-nowrap">
            Developer: <span className="text-accent-terracotta font-semibold">Saud Yahya Al-Faifi</span> | <span className="text-accent-terracotta font-semibold">0535103986</span>
          </p>
        </div>
      </footer>
    </main>
  )
}
