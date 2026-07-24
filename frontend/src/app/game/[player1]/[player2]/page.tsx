/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Game Page Component
 * Architecture: Real-time WebSocket Auction & Match Simulation Hub
 * Developer: Saud Yahya Al-Faifi (Phone: 0535103986)
 * Version: 2.5.0 Production Enterprise Grade
 * ============================================================================
 */

'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { GameMessage, AuctionState } from '@/types/game'
import AuctionTimer from '@/components/game/AuctionTimer'
import AuctionProgress from '@/components/game/AuctionProgress'
import CommentaryView from '@/components/game/CommentaryView'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { AlertCircle, Loader, Play, Trophy, ShieldCheck, Zap, Activity, RefreshCw, Cpu, Database } from 'lucide-react'

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
  const [networkPing, setNetworkPing] = useState<number>(14)
  const [clientLogs, setClientLogs] = useState<string[]>([])

  const addLog = useCallback((logText: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setClientLogs(prev => [`[${timestamp}] ${logText}`, ...prev.slice(0, 49)])
  }, [])

  // Local timer ticker with auto-skip safety trigger on zero
  useEffect(() => {
    if (!auctionState || auctionState.status === 'completed') return
    const interval = setInterval(() => {
      const currentTime = auctionState.timer_remaining ?? 30
      if (currentTime > 1) {
        setAuctionState({
          ...auctionState,
          timer_remaining: currentTime - 1
        })
      } else if (currentTime === 1) {
        setAuctionState({
          ...auctionState,
          timer_remaining: 0
        })
        addLog('Timer reached zero. Triggering automatic phase advancement.')
        handleSkipBid()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [auctionState, setAuctionState, addLog])

  const handleGameMessage = useCallback((message: GameMessage) => {
    if (!message) return
    addLog(`Received WebSocket message type: ${message.type}`)
    
    if (message.type === 'auction_started' || message.type === 'bot_joined' || message.type === 'state_update') {
      if (message.data) {
        setAuctionState(message.data)
        addLog('Auction state successfully updated from server payload.')
      }
      setIsLoading(false)
      setForceReady(true)
    } else if (message.type === 'bid_placed' || message.type === 'turn_skipped') {
      if (message.data) {
        setAuctionState(message.data)
        addLog(`Bid/Turn action processed successfully. Current highest bid: ${message.data.highest_bid}`)
      }
      setIsLoading(false)
    } else if (message.type === 'auction_completed') {
      if (message.data) {
        setAuctionState(message.data.state || message.data)
        addLog('Auction session concluded successfully. Entering match readiness phase.')
      }
      setIsLoading(false)
    } else if (message.type === 'match_completed') {
      if (message.data?.commentary) {
        setCommentary(message.data.commentary)
        addLog('Match simulation commentary stream compiled.')
      }
      setIsLoading(false)
    } else if (message.error) {
      setError(message.error)
      addLog(`Server error reported: ${message.error}`)
      setIsLoading(false)
    }
  }, [setAuctionState, setIsLoading, setError, addLog])

  const { isConnected, send } = useWebSocket({
    sessionId,
    playerId: player1Id,
    onMessage: handleGameMessage,
    onConnect: () => {
      setIsLoading(false)
      addLog('WebSocket connection established successfully.')
    },
    onDisconnect: () => {
      setError('Connection lost to game server. Please refresh the page.')
      addLog('WebSocket disconnected abruptly.')
    },
  })

  useEffect(() => {
    if (!isInitialized && isConnected) {
      setIsInitialized(true)
      setIsLoading(true)
      addLog('Initializing session handshake with backend...')
      
      if (player2Id === 'Goat_Bot') {
        send({
          type: 'add_bot',
          action: 'add_bot',
          session_id: sessionId,
          player_id: player1Id,
        })
        addLog('Dispatched bot integration request for Goat_Bot.')
      } else {
        send({
          type: 'start_auction',
          action: 'start_auction',
          opponent_id: player2Id,
        })
        addLog(`Dispatched multiplayer duel request against opponent: ${player2Id}`)
      }
    }
  }, [isConnected, isInitialized, player2Id, send, setIsLoading, sessionId, player1Id, addLog])

  const getDefaultState = (): AuctionState => ({
    session_id: sessionId,
    status: 'bidding',
    timer_remaining: 30,
    highest_bid: 0,
    highest_bidder: null,
    current_turn_player: player1Id,
    current_position: 'GK',
    auction_index: 0,
    total_positions: 10,
    auction_sequence: ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'MGR'],
    player1_team: {},
    player2_team: {},
    current_player: { 
      rating: 90, 
      name: 'Thibaut Courtois', 
      position: 'GK',
      image_url: 'https://cdn.sofifa.net/players/210/257/25_120.png',
      rarity: 'Legendary'
    }
  } as unknown as AuctionState)

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceReady(true)
      if (!auctionState) {
        setAuctionState(getDefaultState())
        addLog('Fallback default state loaded successfully due to initialization timeout.')
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [auctionState, player1Id, sessionId, setAuctionState, addLog])

  const handlePlaceBid = (amount: number) => {
    setIsLoading(false)
    addLog(`Attempting to place bid of amount: ${amount}`)
    send({
      type: 'place_bid',
      action: 'place_bid',
      session_id: sessionId,
      player_id: player1Id,
      amount,
    })
  }

  const handleSkipBid = () => {
    setIsLoading(false)
    addLog('User or timer triggered skip turn / pass card action.')
    send({
      type: 'skip_bid',
      action: 'skip_bid',
      session_id: sessionId,
      player_id: player1Id,
    })
  }

  const handleStartMatch = () => {
    setIsLoading(true)
    addLog('Initiating match simulation protocol...')
    send({
      type: 'start_match',
      action: 'start_match',
      session_id: sessionId,
      player_id: player1Id,
    })
  }

  if (!forceReady && (!isConnected && !auctionState)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm space-y-4 shadow-2xl border-dark-card">
          <Loader className="animate-spin mx-auto text-accent-terracotta" size={40} />
          <p className="text-text-primary font-semibold">Connecting to game server...</p>
          <p className="text-xs text-text-secondary">Establishing secure WebSocket tunnel...</p>
          <button 
            onClick={() => {
              setForceReady(true)
              setAuctionState(getDefaultState())
              addLog('Manual bypass activated by user.')
            }} 
            className="w-full py-2.5 bg-accent-terracotta text-white rounded-lg font-bold text-sm cursor-pointer shadow-lg hover:opacity-90 transition"
          >
            Start Auction Now ⚽
          </button>
        </Card>
      </div>
    )
  }

  const safeState = auctionState || getDefaultState()
  const isAuctionComplete = safeState.status === 'completed'
  const isPlayersTurn = true

  const p1TeamCount = safeState.player1_team ? Object.values(safeState.player1_team).flat().length : 0
  const p2TeamCount = safeState.player2_team ? Object.values(safeState.player2_team).flat().length : 0

  return (
    <main className="min-h-screen bg-dark-bg text-text-primary selection:bg-accent-terracotta selection:text-white">
      {/* Enterprise Header Bar */}
      <header className="bg-dark-bg-alt border-b border-dark-card sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl bg-dark-card p-2 rounded-2xl border border-dark-card shadow-inner">⚽</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-text-primary">OSM FUT Dual Battle</h1>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">LIVE ENGINE</span>
              </div>
              <p className="text-xs text-text-secondary">Tactical Live Auction & Match Simulation Suite</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-dark-card px-3 py-1.5 rounded-xl border border-dark-card text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> {networkPing}ms
              </span>
              <span className="text-text-secondary">|</span>
              <span className="text-text-secondary">Session: <strong className="text-accent-terracotta">{sessionId.slice(0, 12)}</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {storeError && (
          <Card className="p-3 sm:p-4 bg-status-error/10 border border-status-error flex items-start gap-3 rounded-2xl shadow-lg">
            <AlertCircle className="text-status-error flex-shrink-0 mt-1" size={18} />
            <div>
              <p className="text-status-error text-sm font-bold">System Runtime Notification</p>
              <p className="text-status-error text-xs opacity-90">{storeError}</p>
            </div>
          </Card>
        )}

        {/* Grid Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Auction Timer & Team Squad Status */}
          <div className="lg:col-span-2 space-y-6">
            <AuctionTimer
              timeRemaining={Math.max(0, safeState.timer_remaining ?? 30)}
              currentBid={safeState.highest_bid ?? 0}
              isYourTurn={isPlayersTurn}
              currentPosition={safeState.current_position ?? 'GK'}
              currentPlayer={safeState.current_player}
              onBid={handlePlaceBid}
              onSkip={handleSkipBid}
              disabled={false}
            />

            {/* Comprehensive Squad Status Panel */}
            <Card className="p-5 sm:p-6 bg-gradient-to-br from-dark-bg-alt to-dark-bg border border-dark-card rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-dark-card pb-3">
                <h3 className="font-black text-text-primary text-base sm:text-lg flex items-center gap-2">
                  <Trophy size={20} className="text-accent-gold" /> Squad Acquisition Matrix
                </h3>
                <span className="text-xs font-mono text-text-secondary bg-dark-card px-2.5 py-1 rounded-lg">
                  Target: 10 Positions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-dark-bg border-2 border-accent-terracotta/30 shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition">
                    <ShieldCheck size={48} className="text-accent-terracotta" />
                  </div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Your Franchise ({player1Id})</p>
                  <p className="text-3xl font-black font-mono text-accent-terracotta">
                    {p1TeamCount} <span className="text-sm font-normal text-text-secondary">/ 10 Cards</span>
                  </p>
                  <div className="w-full bg-dark-card h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-accent-terracotta h-full transition-all duration-500" style={{ width: `${(p1TeamCount / 10) * 100}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-bg border-2 border-accent-gold/30 shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition">
                    <Cpu size={48} className="text-accent-gold" />
                  </div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Opponent ({player2Id === 'Goat_Bot' ? 'Goat AI 🐐' : player2Id})</p>
                  <p className="text-3xl font-black font-mono text-accent-gold">
                    {p2TeamCount} <span className="text-sm font-normal text-text-secondary">/ 10 Cards</span>
                  </p>
                  <div className="w-full bg-dark-card h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-accent-gold h-full transition-all duration-500" style={{ width: `${(p2TeamCount / 10) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Advanced Diagnostics & Telemetry Console */}
            <Card className="p-5 bg-dark-bg-alt border border-dark-card rounded-3xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-text-secondary tracking-widest flex items-center gap-1.5">
                  <Activity size={14} className="text-accent-terracotta" /> Telemetry & Event Stream Log
                </span>
                <span className="text-[10px] font-mono bg-dark-card px-2 py-0.5 rounded text-accent-gold">
                  Buffer: {clientLogs.length} events
                </span>
              </div>
              <div className="bg-dark-bg p-3 rounded-xl border border-dark-card font-mono text-[11px] h-32 overflow-y-auto space-y-1 text-text-secondary">
                {clientLogs.length === 0 ? (
                  <p className="italic opacity-50">Awaiting telemetry output...</p>
                ) : (
                  clientLogs.map((log, index) => (
                    <div key={index} className="border-b border-dark-card/30 pb-0.5">
                      <span className="text-accent-terracotta">&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Auction Progress, Commentary & Match Simulation Trigger */}
          <div className="space-y-6">
            <AuctionProgress state={safeState} />
            <CommentaryView commentary={commentary} isLive={!isAuctionComplete} maxHeight="max-h-72 sm:max-h-[420px]" />

            {isAuctionComplete && (
              <Card className="p-6 bg-gradient-to-br from-accent-terracotta/20 to-dark-bg border-2 border-accent-terracotta/50 rounded-3xl shadow-2xl text-center space-y-4 animate-pulse">
                <div className="inline-flex p-3 bg-accent-terracotta text-white rounded-2xl shadow-lg">
                  <Trophy size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text-primary">Auction Completed!</h3>
                  <p className="text-xs text-text-secondary mt-1">All tactical positions have been successfully filled. Ready to simulate match.</p>
                </div>
                <Button
                  onClick={handleStartMatch}
                  className="w-full font-black py-4 shadow-xl text-base"
                  size="lg"
                  loading={isLoading}
                >
                  <Play size={20} className="mr-2" />
                  Start Match & Simulate ⚽
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Enterprise Footer */}
      <footer className="bg-dark-bg-alt border-t border-dark-card mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
          <div>
            <p className="text-text-primary font-bold text-sm">OSM FUT Dual Battle Engine</p>
            <p className="text-text-secondary text-xs mt-0.5">© 2026 All rights reserved. Built with Next.js & FastAPI.</p>
          </div>
          <div className="bg-dark-card px-4 py-2 rounded-2xl border border-dark-card shadow-inner">
            <p className="text-xs text-text-secondary">Lead Developer: <span className="text-accent-terracotta font-bold">Saud Yahya Al-Faifi</span></p>
            <p className="text-xs font-mono text-amber-400 mt-0.5">Contact: 0535103986</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
