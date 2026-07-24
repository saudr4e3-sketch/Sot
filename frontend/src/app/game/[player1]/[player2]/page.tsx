'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { GameMessage } from '@/types/game'
import AuctionTimer from '@/components/game/AuctionTimer'
import AuctionProgress from '@/components/game/AuctionProgress'
import CommentaryView from '@/components/game/CommentaryView'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { AlertCircle, Loader, Play } from 'lucide-react'

export default function GamePage() {
  const params = useParams()
  const player1Id = (params?.player1 as string) || 'Player1'
  const player2Id = (params?.player2 as string) || 'Goat_Bot'
  
  const {
    auctionState,
    setAuctionState,
    setIsLoading,
    setError,
    error: storeError,
    isLoading,
  } = useGameStore()
  
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`)
  const [isInitialized, setIsInitialized] = useState(false)
  const [commentary, setCommentary] = useState<any[]>([])
  const [forceReady, setForceReady] = useState(false)

  const handleGameMessage = useCallback((message: GameMessage) => {
    if (!message) return
    
    if (message.type === 'auction_started' || message.type === 'bot_joined') {
      if (message.data) {
        setAuctionState(message.data)
      }
      setIsLoading(false)
      setForceReady(true)
    } else if (message.type === 'bid_placed' || message.type === 'turn_skipped') {
      if (message.data) {
        setAuctionState(message.data)
      }
      setIsLoading(false)
    } else if (message.type === 'auction_completed') {
      if (message.data) {
        setAuctionState(message.data.state || message.data)
      }
      setIsLoading(false)
    } else if (message.type === 'match_completed') {
      if (message.data?.commentary) {
        setCommentary(message.data.commentary)
      }
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
      setIsLoading(false)
    },
    onDisconnect: () => {
      setError('Connection lost. Please refresh the page.')
    },
  })

  useEffect(() => {
    if (!isInitialized && isConnected) {
      setIsInitialized(true)
      setIsLoading(true)
      
      if (player2Id === 'Goat_Bot') {
        send({
          type: 'add_bot',
          action: 'add_bot',
          session_id: sessionId,
          player_id: player1Id,
        })
      } else {
        send({
          type: 'start_auction',
          action: 'start_auction',
          opponent_id: player2Id,
        })
      }
    }
  }, [isConnected, isInitialized, player2Id, send, setIsLoading, sessionId, player1Id])

  // ضمان إعطاء حالة افتراضية آمنة لمنع انهيار الواجهة
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceReady(true)
      if (!auctionState) {
        setAuctionState({
          status: 'bidding',
          timer_remaining: 30,
          highest_bid: 0,
          current_turn_player: player1Id,
          current_position: 'GK',
          player1_team: {},
          player2_team: {},
          current_player: { rating: 80, name: 'Starting Player' }
        } as any)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [auctionState, player1Id, setAuctionState])

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

  // شاشة التحميل الآمنة التي تحتوي على خيار تخطي يدوي فوري
  if (!forceReady && (!isConnected || !auctionState)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm space-y-4">
          <Loader className="animate-spin mx-auto text-accent-terracotta" size={40} />
          <p className="text-text-primary font-semibold">
            {!isConnected ? "Connecting to game..." : "Initializing auction..."}
          </p>
          <button 
            onClick={() => {
              setForceReady(true)
              setAuctionState({
                status: 'bidding',
                timer_remaining: 30,
                highest_bid: 0,
                current_turn_player: player1Id,
                current_position: 'GK',
                player1_team: {},
                player2_team: {},
                current_player: { rating: 80, name: 'Starting Player' }
              } as any)
            }} 
            className="w-full py-2 bg-accent-terracotta text-white rounded-lg font-bold text-sm cursor-pointer shadow-md"
          >
            تخطي الدخول للمزاد فوراً
          </button>
        </Card>
      </div>
    )
  }

  // تجهيز الحالة بأمان تام لتجنب أي أخطاء قراءة
  const safeState = auctionState || {
    status: 'bidding',
    timer_remaining: 30,
    highest_bid: 0,
    current_turn_player: player1Id,
    current_position: 'GK',
    player1_team: {},
    player2_team: {},
    current_player: { rating: 80, name: 'Starting Player' }
  }

  const isAuctionComplete = safeState.status === 'completed'
  const isPlayersTurn = safeState.current_turn_player === player1Id

  const p1TeamCount = safeState.player1_team ? Object.values(safeState.player1_team).flat().length : 0
  const p2TeamCount = safeState.player2_team ? Object.values(safeState.player2_team).flat().length : 0

  return (
    <main className="min-h-screen bg-dark-bg">
      <header className="bg-dark-bg-alt border-b border-dark-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-2xl sm:text-3xl">⚽</div>
            <h1 className="text-lg sm:text-xl font-bold text-text-primary">OSM FUT Auction</h1>
          </div>
          <div className="text-xs sm:text-sm text-text-secondary hidden sm:block">
            Session: <span className="text-accent-terracotta font-mono">{sessionId ? sessionId.slice(0, 15) : ''}...</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {storeError && (
          <Card className="p-3 sm:p-4 mb-6 bg-status-error/10 border border-status-error flex items-start gap-3">
            <AlertCircle className="text-status-error flex-shrink-0 mt-1" size={18} />
            <p className="text-status-error text-sm">{storeError}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <AuctionTimer
              timeRemaining={Math.max(0, safeState.timer_remaining ?? 30)}
              currentBid={safeState.highest_bid ?? 0}
              isYourTurn={isPlayersTurn}
              currentPosition={safeState.current_position ?? 'GK'}
              onBid={handlePlaceBid}
              onSkip={handleSkipBid}
              disabled={!isPlayersTurn || isLoading}
            />

            <Card className="p-4 sm:p-6">
              <h3 className="font-bold text-text-primary mb-4 text-base sm:text-lg">Team Status</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-btn bg-dark-bg-alt border-2 border-accent-terracotta/30">
                  <p className="text-xs text-text-secondary mb-2">Your Team</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-terracotta">
                    {p1TeamCount}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Cards</p>
                </div>
                <div className="p-3 sm:p-4 rounded-btn bg-dark-bg-alt border-2 border-accent-gold/30">
                  <p className="text-xs text-text-secondary mb-2">Opponent ({player2Id === 'Goat_Bot' ? 'Goat 🐐' : 'Opponent'})</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-gold">
                    {p2TeamCount}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">Cards</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <AuctionProgress state={safeState} />
            <CommentaryView commentary={commentary} isLive={!isAuctionComplete} maxHeight="max-h-64 sm:max-h-96" />

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
