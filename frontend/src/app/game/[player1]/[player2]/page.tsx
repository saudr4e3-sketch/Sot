/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Game Page Component
 * Architecture: Real-time WebSocket Auction & Match Simulation Hub
 * Developer: Saud Yahya Al-Faifi (Phone: 0535103986)
 * Version: 3.0.1 Production Enterprise Grade (Type-Safe & WebSocket State Sync)
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
import { AlertCircle, Loader, Play, Trophy, ShieldCheck, Zap, Activity, RefreshCw, Cpu, Database, Coins, Users } from 'lucide-react'

// --- Helper Functions ---
const buildDefaultAuctionState = (sessionId: string, player1Id: string): AuctionState => {
  return {
    session_id: sessionId,
    status: 'bidding',
    timer_remaining: 30,
    highest_bid: 0,
    highest_bidder: null,
    current_turn_player: player1Id,
    current_position: 'GK',
    auction_index: 0,
    total_positions: 9,
    auction_sequence: ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'MGR'],
    player1_team: {},
    player2_team: {},
    opponent_info: {
      id: 'Goat_Bot',
      name: 'GOAT-X',
      budget: 100,
      cards_acquired: 0,
      total_budget: 100,
      current_mindset: 'MASTERMIND',
      team: [],
      is_bot: true
    },
    current_player: { 
      rating: 90, 
      name: 'Thibaut Courtois', 
      position: 'GK',
      image_url: 'https://cdn.sofifa.net/players/210/257/25_120.png',
      rarity: 'Legendary'
    }
  } as unknown as AuctionState;
};

export default function GamePage() {
  const params = useParams();
  const player1Id = (params?.player1 as string) || 'Player1';
  const player2Id = (params?.player2 as string) || 'Goat_Bot';
  
  const {
    auctionState,
    setAuctionState,
    setIsLoading,
    setError,
    error: storeError,
    isLoading,
  } = useGameStore();
  
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [isInitialized, setIsInitialized] = useState(false);
  const [commentary, setCommentary] = useState<any[]>([]);
  const [forceReady, setForceReady] = useState(false);
  const [networkPing, setNetworkPing] = useState<number>(14);
  const [clientLogs, setClientLogs] = useState<string[]>([]);
  
  // مرجع لتخزين آخر حالة مزاد لمنع التحديثات غير الضرورية
  const lastAuctionStateRef = useRef<AuctionState | null>(null);

  const addLog = useCallback((logText: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setClientLogs(prev => [`[${timestamp}] ${logText}`, ...prev.slice(0, 49)]);
  }, []);

  /**
   * =========================================================================
   * CORE: WebSocket Message Handler (معالجة آمنة ومتوافقة مع TypeScript)
   * =========================================================================
   */
  const handleGameMessage = useCallback((message: GameMessage) => {
    if (!message) return;
    addLog(`📩 Received: ${message.type}`);

    // استخراج البيانات مع التوافق التام للأنواع (Type Safe)
    const payload = message.data || (message as any).state || message;
    
    // تحديث حالة المتجر إذا كانت البيانات جديدة وتحتوي على auction_state
    if (payload && payload.auction_state) {
      const newState = {
        ...payload.auction_state,
        session_id: message.session_id || sessionId,
        timer_remaining: payload.timer?.remaining ?? 30,
        team1: payload.team1 || [],
        team2: payload.team2 || [],
        opponent_info: payload.opponent_info || {},
        current_turn_player: payload.auction_state.current_turn_player || player1Id,
      };
      
      // منع التحديث المتكرر لنفس الحالة
      if (JSON.stringify(newState) !== JSON.stringify(lastAuctionStateRef.current)) {
        setAuctionState(newState as any);
        lastAuctionStateRef.current = newState as any;
        addLog(`✅ State updated. Turn: ${newState.current_turn_player}, Index: ${newState.auction_index}`);
      }
    } else if (payload && payload.status) {
      if (JSON.stringify(payload) !== JSON.stringify(lastAuctionStateRef.current)) {
        setAuctionState(payload);
        lastAuctionStateRef.current = payload;
      }
    }

    // معالجة الأحداث الخاصة
    switch (message.type) {
      case 'auction_started':
      case 'bot_joined':
      case 'state_update':
      case 'auction_state':
        setIsLoading(false);
        setForceReady(true);
        break;
        
      case 'bid_placed':
        addLog(`💰 Bid placed by ${message.player_id}: ${message.amount}M`);
        setIsLoading(false);
        break;
        
      case 'turn_skipped':
        addLog(`⏭️ ${message.player_id} skipped turn.`);
        setIsLoading(false);
        break;
        
      case 'timer_expired':
        addLog(`⏰ Timer expired for ${message.player_id}.`);
        break;
        
      case 'auction_completed':
        addLog('🏁 Auction session concluded. Ready for match simulation.');
        setIsLoading(false);
        break;
        
      case 'match_completed':
        if (message.data?.commentary) {
          setCommentary(message.data.commentary);
          addLog('📊 Match simulation commentary compiled.');
        }
        setIsLoading(false);
        break;
        
      case 'error':
        setError(message.message || 'Unknown server error');
        addLog(`❌ Server error: ${message.message}`);
        setIsLoading(false);
        break;
        
      case 'pong':
        setNetworkPing(Date.now() - (message.timestamp ? new Date(message.timestamp).getTime() : Date.now()));
        break;
    }
  }, [setAuctionState, setIsLoading, setError, addLog, sessionId, player1Id]);

  const { isConnected, send } = useWebSocket({
    sessionId,
    playerId: player1Id,
    onMessage: handleGameMessage,
    onConnect: () => {
      setIsLoading(false);
      addLog('🔗 WebSocket connection established.');
    },
    onDisconnect: () => {
      setError('Connection lost to game server. Please refresh the page.');
      addLog('🔌 WebSocket disconnected.');
    },
  });

  // Keep-Alive Ping كل 20 ثانية
  useEffect(() => {
    if (!isConnected) return;
    const keepAlive = setInterval(() => {
      send({ type: 'ping', timestamp: new Date().toISOString() });
    }, 20000);
    return () => clearInterval(keepAlive);
  }, [isConnected, send]);

  // تهيئة جلسة اللعب عند الاتصال
  useEffect(() => {
    if (!isInitialized && isConnected) {
      setIsInitialized(true);
      setIsLoading(true);
      addLog('🚀 Initializing session handshake...');
      
      if (player2Id === 'Goat_Bot') {
        send({
          type: 'add_bot',
          action: 'add_bot',
          session_id: sessionId,
          player_id: player1Id,
        });
        addLog('🤖 Bot integration request dispatched.');
      } else {
        send({
          type: 'start_auction',
          action: 'start_auction',
          opponent_id: player2Id,
        });
        addLog(`👥 Multiplayer request against: ${player2Id}`);
      }
    }
  }, [isConnected, isInitialized, player2Id, send, setIsLoading, sessionId, player1Id, addLog]);

  // مؤقت محلي وتجاوز تلقائي عند انتهاء الوقت
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!auctionState) {
        const defaultState = buildDefaultAuctionState(sessionId, player1Id);
        setAuctionState(defaultState);
        lastAuctionStateRef.current = defaultState;
        setForceReady(true);
        addLog('⚡ Fallback default state activated.');
      }
    }, 2500);
    return () => clearTimeout(fallbackTimer);
  }, [auctionState, player1Id, sessionId, setAuctionState, addLog]);

  const handleSkipBid = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    addLog('⏭️ Skipping turn...');
    send({
      type: 'skip_bid',
      action: 'skip_bid',
      session_id: sessionId,
      player_id: player1Id,
    });
  }, [send, sessionId, player1Id, isLoading, addLog, setIsLoading]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (!auctionState || auctionState.status === 'completed') return;

    timerIntervalRef.current = setInterval(() => {
      setAuctionState((prevState: any) => {
        if (!prevState) return prevState;
        
        const currentTime = prevState.timer_remaining ?? 30;
        const isMyTurn = prevState.current_turn_player === player1Id;
        
        if (currentTime > 1) {
          return { ...prevState, timer_remaining: currentTime - 1 };
        } else if (currentTime === 1 && isMyTurn) {
          addLog('⏰ Timer reached zero. Auto-skipping turn.');
          handleSkipBid();
          return { ...prevState, timer_remaining: 0 };
        }
        return prevState;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [auctionState?.status, auctionState?.current_turn_player, player1Id, addLog, handleSkipBid, setAuctionState]);

  const handlePlaceBid = useCallback((amount: number) => {
    if (isLoading) return;
    setIsLoading(true);
    addLog(`💰 Placing bid: ${amount}M`);
    send({
      type: 'place_bid',
      action: 'place_bid',
      session_id: sessionId,
      player_id: player1Id,
      amount,
    });
  }, [send, sessionId, player1Id, isLoading, addLog, setIsLoading]);

  const handleStartMatch = useCallback(() => {
    setIsLoading(true);
    addLog('⚽ Starting match simulation...');
    send({
      type: 'start_match',
      action: 'start_match',
      session_id: sessionId,
      player_id: player1Id,
    });
  }, [send, sessionId, player1Id, addLog, setIsLoading]);

  if (!forceReady && (!isConnected && !auctionState)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm space-y-4 shadow-2xl border-dark-card">
          <Loader className="animate-spin mx-auto text-accent-terracotta" size={40} />
          <p className="text-text-primary font-semibold">Connecting to game server...</p>
          <p className="text-xs text-text-secondary">Establishing secure WebSocket tunnel...</p>
          <button 
            onClick={() => {
              setForceReady(true);
              const defaultState = buildDefaultAuctionState(sessionId, player1Id);
              setAuctionState(defaultState);
              lastAuctionStateRef.current = defaultState;
              addLog('🔧 Manual bypass activated.');
            }} 
            className="w-full py-2.5 bg-accent-terracotta text-white rounded-lg font-bold text-sm cursor-pointer shadow-lg hover:opacity-90 transition"
          >
            Start Auction Now ⚽
          </button>
        </Card>
      </div>
    );
  }

  const safeState = auctionState || buildDefaultAuctionState(sessionId, player1Id);
  const isAuctionComplete = safeState.status === 'completed';
  const isPlayersTurn = safeState.current_turn_player === player1Id;
  
  const opponentInfo = (safeState as any).opponent_info || {
    id: player2Id,
    name: player2Id === 'Goat_Bot' ? 'Goat AI 🐐' : player2Id,
    budget: 100,
    cards_acquired: 0,
    total_budget: 100,
    current_mindset: 'MASTERMIND',
    team: (safeState as any).team2 || [],
    is_bot: player2Id === 'Goat_Bot'
  };
  
  const p1Team = (safeState as any).team1 || safeState.player1_team || [];
  const p2Team = opponentInfo.team || (safeState as any).team2 || safeState.player2_team || [];
  
  const p1TeamCount = Array.isArray(p1Team) ? p1Team.length : Object.values(p1Team).flat().length;
  const p2TeamCount = Array.isArray(p2Team) ? p2Team.length : Object.values(p2Team).flat().length;
  const p2Budget = opponentInfo.budget || opponentInfo.total_budget || 100;

  return (
    <main className="min-h-screen bg-dark-bg text-text-primary selection:bg-accent-terracotta selection:text-white">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AuctionTimer
              timeRemaining={Math.max(0, safeState.timer_remaining ?? 30)}
              currentBid={safeState.highest_bid ?? 0}
              isYourTurn={isPlayersTurn}
              currentPosition={safeState.current_position ?? 'GK'}
              currentPlayer={safeState.current_player}
              onBid={handlePlaceBid}
              onSkip={handleSkipBid}
              disabled={!isPlayersTurn || isLoading || isAuctionComplete}
            />

            <Card className="p-5 sm:p-6 bg-gradient-to-br from-dark-bg-alt to-dark-bg border border-dark-card rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-dark-card pb-3">
                <h3 className="font-black text-text-primary text-base sm:text-lg flex items-center gap-2">
                  <Trophy size={20} className="text-accent-gold" /> Squad Acquisition Matrix
                </h3>
                <span className="text-xs font-mono text-text-secondary bg-dark-card px-2.5 py-1 rounded-lg">
                  Target: 9 Positions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-dark-bg border-2 border-accent-terracotta/30 shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition">
                    <ShieldCheck size={48} className="text-accent-terracotta" />
                  </div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Your Franchise ({player1Id})</p>
                  <p className="text-3xl font-black font-mono text-accent-terracotta">
                    {p1TeamCount} <span className="text-sm font-normal text-text-secondary">/ 9 Cards</span>
                  </p>
                  <div className="w-full bg-dark-card h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-accent-terracotta h-full transition-all duration-500" style={{ width: `${(p1TeamCount / 9) * 100}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-bg border-2 border-accent-gold/30 shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition">
                    <Cpu size={48} className="text-accent-gold" />
                  </div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">
                    Opponent ({opponentInfo.name || 'Goat AI 🐐'})
                  </p>
                  <p className="text-3xl font-black font-mono text-accent-gold">
                    {p2TeamCount} <span className="text-sm font-normal text-text-secondary">/ 9 Cards</span>
                  </p>
                  <div className="w-full bg-dark-card h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-accent-gold h-full transition-all duration-500" style={{ width: `${(p2TeamCount / 9) * 100}%` }}></div>
                  </div>
                  
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-text-secondary">
                      <span className="flex items-center gap-1"><Coins size={12} /> Budget</span>
                      <span className="font-mono text-accent-gold">{p2Budget.toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span className="flex items-center gap-1"><Zap size={12} /> Mindset</span>
                      <span className="font-mono text-emerald-400">{opponentInfo.current_mindset || 'MASTERMIND'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-dark-bg-alt border border-dark-card rounded-3xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-text-secondary tracking-widest flex items-center gap-1.5">
                  <Activity size={14} className="text-accent-terracotta" /> Telemetry & Event Stream Log
                </span>
                <button 
                  onClick={() => setClientLogs([])}
                  className="text-[10px] font-mono bg-dark-card px-2 py-0.5 rounded text-accent-gold hover:text-white transition"
                >
                  Clear Buffer ({clientLogs.length})
                </button>
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

      <footer className="bg-dark-bg-alt border-t border-dark-card mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
          <div>
            <p className="text-text-primary font-bold text-sm">OSM FUT Dual Battle Engine v3.0</p>
            <p className="text-text-secondary text-xs mt-0.5">© 2026 All rights reserved. Built with Next.js & FastAPI.</p>
          </div>
          <div className="bg-dark-card px-4 py-2 rounded-2xl border border-dark-card shadow-inner">
            <p className="text-xs text-text-secondary">Lead Developer: <span className="text-accent-terracotta font-bold">Saud Yahya Al-Faifi</span></p>
            <p className="text-xs font-mono text-amber-400 mt-0.5">Contact: 0535103986</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
