// ==================== TYPES & INTERFACES ====================

interface PlayerCard {
  name: string;
  position: string;
  rating: number;
  image: string;
  rarity: 'Legendary' | 'Medium' | 'Weak';
  nationality: string;
  club: string;
  age: number;
}

interface AuctionState {
  session_id: string;
  status: 'waiting' | 'active' | 'bid_placed' | 'turn_passed' | 'sold' | 'mystery_generated' | 'completed';
  current_position: string;
  auction_index: number;
  total_positions: number;
  current_turn_player: string;
  highest_bid: number;
  highest_bidder: string | null;
  timer_remaining: number;
  timer_duration: number;
  player1_team: Record<string, any[]>;
  player2_team: Record<string, any[]>;
  auction_sequence: string[];
  current_player: PlayerCard;
  bot_info: {
    name: string;
    budget_remaining: number;
    cards_won: number;
    strategy: string;
  };
  next_position: string | null;
  auction_progress: number;
}

interface MatchResult {
  player1_score: number;
  player2_score: number;
  player1_strength: number;
  player2_strength: number;
  player1_tactic: number;
  player2_tactic: number;
  player1_luck: number;
  player2_luck: number;
  winner: 'player1' | 'player2' | 'draw';
  commentary: MatchCommentary[];
}

interface MatchCommentary {
  minute: number;
  event: string;
  type: 'goal' | 'chance' | 'save' | 'tackle' | 'foul' | 'whistle' | 'highlight';
}

// ==================== MAIN AUCTION & MATCH COMPONENT ====================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Zap,
  SkipForward,
  Gavel,
  Trophy,
  Swords,
  Star,
  Shield,
  Flame,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  Target,
  Users,
  ChevronRight,
  DollarSign,
  Bot,
  User,
  Sparkles,
  Clock,
  ArrowRight,
  Loader,
  Flag
} from 'lucide-react';

// ==================== CONSTANTS & CONFIGURATION ====================

const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  },
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 1.5, repeat: Infinity }
    }
  }
};

const RARITY_COLORS = {
  Legendary: 'from-amber-500 to-yellow-400 border-amber-400',
  Medium: 'from-sky-500 to-blue-400 border-sky-400',
  Weak: 'from-slate-500 to-zinc-400 border-slate-400'
};

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MID: 'bg-green-500/20 text-green-400 border-green-500/30',
  ATT: 'bg-red-500/20 text-red-400 border-red-500/30',
  MGR: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

// ==================== SUB-COMPONENTS ====================

const TimerDisplay: React.FC<{
  timeRemaining: number;
  totalDuration: number;
  isActive: boolean;
}> = ({ timeRemaining, totalDuration, isActive }) => {
  const percentage = (timeRemaining / totalDuration) * 100;
  const isLow = timeRemaining <= 10;
  const isCritical = timeRemaining <= 5;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-dark-card"
          />
          <motion.circle
            cx="24"
            cy="24"
            r="20"
            stroke={isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#3b82f6'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - percentage / 100)}`}
            initial={false}
            animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - percentage / 100) }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock
            size={16}
            className={`${isActive && isLow ? 'animate-pulse' : ''} ${
              isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-blue-400'
            }`}
          />
        </div>
      </div>
      <div>
        <div className={`text-2xl font-black font-mono ${
          isCritical ? 'text-red-400 animate-pulse' : isLow ? 'text-amber-400' : 'text-slate-100'
        }`}>
          {Math.ceil(timeRemaining)}
        </div>
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          Seconds
        </div>
      </div>
    </div>
  );
};

const PlayerCardDisplay: React.FC<{
  player: PlayerCard;
  isMystery?: boolean;
}> = ({ player, isMystery = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80';

  return (
    <motion.div
      variants={ANIMATION_VARIANTS.scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`relative rounded-2xl overflow-hidden border-2 bg-gradient-to-b ${
        isMystery
          ? 'from-purple-500/20 via-dark-bg-alt to-dark-bg border-purple-500/30'
          : `${RARITY_COLORS[player.rarity].replace('border-', 'from-')}/20 via-dark-bg-alt to-dark-bg border-${
              RARITY_COLORS[player.rarity].split(' ')[2] || 'slate-500'
            }/30`
      } shadow-2xl`}
    >
      <div className="relative h-48 bg-gradient-to-br from-dark-bg via-dark-bg-alt to-dark-card overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 animate-pulse flex items-center justify-center">
              <Loader size={32} className="text-slate-500 animate-spin" />
            </div>
          </div>
        )}

        <img
          src={isMystery ? '/mystery-card-bg.jpg' : (imageError ? fallbackImage : player.image)}
          alt={player.name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-90 scale-100' : 'opacity-0 scale-95'
          } ${isMystery ? 'blur-sm' : ''}`}
          loading="lazy"
        />

        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-xl border backdrop-blur-md ${POSITION_COLORS[player.position]}`}>
          <span className="text-xs font-black">{player.position}</span>
        </div>

        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r ${RARITY_COLORS[player.rarity]}`}>
          {player.rarity}
        </div>

        <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/50">
          <span className="text-xl font-black text-amber-400 font-mono">{player.rating}</span>
        </div>

        {isMystery && (
          <div className="absolute inset-0 bg-purple-900/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <Sparkles size={40} className="text-purple-400 mx-auto mb-2 animate-pulse" />
              <span className="text-lg font-black text-purple-200">???</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-lg font-black text-slate-100 truncate">
          {isMystery ? 'Mystery Card' : player.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Shield size={12} />
            {player.club || 'Free Agent'}
          </span>
          <span className="flex items-center gap-1">
            <Flag size={12} />
            {player.nationality}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const BidControls: React.FC<{
  isPlayerTurn: boolean;
  isBotTurn: boolean;
  highestBid: number;
  playerBudget: number;
  onBid: (amount: number) => void;
  onSkip: () => void;
  disabled: boolean;
}> = ({ isPlayerTurn, isBotTurn, highestBid, playerBudget, onBid, onSkip, disabled }) => {
  const [customBid, setCustomBid] = useState<number>(Math.max(0.5, Math.ceil(highestBid * 1.1)));
  const [presetBids, setPresetBids] = useState<number[]>([]);

  useEffect(() => {
    const minBid = highestBid > 0 ? Math.ceil(highestBid * 1.1) : 0.5;
    setCustomBid(minBid);
    setPresetBids([
      minBid,
      Math.ceil(minBid * 1.2),
      Math.ceil(minBid * 1.5),
      Math.ceil(minBid * 2)
    ].filter(b => b <= playerBudget));
  }, [highestBid, playerBudget]);

  const handlePresetBid = (amount: number) => {
    if (!isPlayerTurn || disabled || amount > playerBudget) return;
    onBid(amount);
  };

  const handleCustomBid = () => {
    if (!isPlayerTurn || disabled || customBid <= highestBid || customBid > playerBudget) return;
    onBid(customBid);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 py-2">
        {isPlayerTurn ? (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400"
          >
            <User size={16} />
            <span className="text-sm font-bold">Your Turn</span>
          </motion.div>
        ) : isBotTurn ? (
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400"
          >
            <Bot size={16} />
            <span className="text-sm font-bold">GOAT Bot Thinking...</span>
          </motion.div>
        ) : null}
      </div>

      <div className="bg-dark-bg/80 rounded-xl p-4 border border-dark-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
            Current Bid
          </span>
          <span className="text-xs text-slate-500">
            Your Budget: <span className="text-amber-400 font-bold">{playerBudget}M</span>
          </span>
        </div>
        <div className="text-3xl font-black text-amber-400 font-mono text-center">
          {highestBid > 0 ? `${highestBid}M €` : 'No Bids Yet'}
        </div>
      </div>

      {isPlayerTurn && (
        <div className="grid grid-cols-4 gap-2">
          {presetBids.map((amount, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePresetBid(amount)}
              disabled={disabled || amount > playerBudget}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                disabled || amount > playerBudget
                  ? 'bg-dark-card/50 text-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 shadow-lg'
              }`}
            >
              {amount}M
            </motion.button>
          ))}
        </div>
      )}

      {isPlayerTurn && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              value={customBid}
              onChange={(e) => setCustomBid(Number(e.target.value))}
              min={highestBid + 0.1}
              max={playerBudget}
              step={0.1}
              disabled={disabled}
              className="w-full bg-dark-card border border-dark-card/60 rounded-xl px-4 py-3 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">M €</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCustomBid}
            disabled={disabled || customBid <= highestBid || customBid > playerBudget}
            className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              disabled || customBid <= highestBid || customBid > playerBudget
                ? 'bg-dark-card/50 text-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:from-amber-400 hover:to-yellow-400 shadow-lg'
            }`}
          >
            <Gavel size={14} />
            BID
          </motion.button>
        </div>
      )}

      <motion.button
        whileHover={isPlayerTurn && !disabled ? { scale: 1.02 } : {}}
        whileTap={isPlayerTurn && !disabled ? { scale: 0.98 } : {}}
        onClick={onSkip}
        disabled={!isPlayerTurn || disabled}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          !isPlayerTurn || disabled
            ? 'bg-dark-card/50 text-slate-600 cursor-not-allowed'
            : 'bg-dark-card border border-dark-card/60 text-slate-400 hover:text-slate-200 hover:border-slate-500/50'
        }`}
      >
        <SkipForward size={14} />
        SKIP TURN
      </motion.button>
    </div>
  );
};

const AuctionProgressBar: React.FC<{
  currentIndex: number;
  totalPositions: number;
  sequence: string[];
}> = ({ currentIndex, totalPositions, sequence }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-semibold">
          Card {currentIndex + 1} of {totalPositions}
        </span>
        <span className="text-amber-400 font-bold">
          {Math.round(((currentIndex + 1) / totalPositions) * 100)}%
        </span>
      </div>
      <div className="h-2 bg-dark-card rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / totalPositions) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex gap-1.5">
        {sequence.map((pos, idx) => (
          <div
            key={idx}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              idx < currentIndex
                ? 'bg-emerald-500'
                : idx === currentIndex
                ? 'bg-amber-400 animate-pulse'
                : 'bg-dark-card'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ==================== MATCH RESULT COMPONENT ====================

const MatchResultScreen: React.FC<{
  matchResult: MatchResult;
  player1Name: string;
  player2Name: string;
  onPlayAgain: () => void;
}> = ({ matchResult, player1Name, player2Name, onPlayAgain }) => {
  const [showCommentary, setShowCommentary] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);

  useEffect(() => {
    if (matchResult.commentary && matchResult.commentary.length > 0) {
      const timer = setInterval(() => {
        setCurrentMinute(prev => {
          if (prev >= matchResult.commentary.length - 1) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);

      return () => clearInterval(timer);
    }
  }, [matchResult.commentary]);

  const isPlayer1Winner = matchResult.winner === 'player1';
  const isDraw = matchResult.winner === 'draw';

  return (
    <motion.div
      variants={ANIMATION_VARIANTS.slideUp}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <Trophy size={48} className={`mx-auto ${isDraw ? 'text-slate-400' : 'text-amber-400'}`} />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-100">
          {isDraw ? 'Match Draw!' : `${isPlayer1Winner ? player1Name : player2Name} Wins!`}
        </h2>
        <p className="text-sm text-slate-400">Final Result</p>
      </div>

      <div className="bg-gradient-to-br from-dark-bg via-dark-bg-alt to-dark-card rounded-2xl p-6 border border-dark-card">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto">
              <User size={28} className="text-blue-400" />
            </div>
            <span className="block text-xs text-slate-400 font-semibold">{player1Name}</span>
            <span className={`text-4xl font-black font-mono ${isPlayer1Winner ? 'text-amber-400' : 'text-slate-300'}`}>
              {matchResult.player1_score.toFixed(1)}
            </span>
          </div>

          <div className="text-center">
            <span className="text-3xl font-black text-slate-600">VS</span>
            <div className="mt-1 px-3 py-1 rounded-full bg-dark-card border border-dark-card/60">
              <span className="text-xs font-bold text-slate-500">FINAL</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto">
              <Bot size={28} className="text-red-400" />
            </div>
            <span className="block text-xs text-slate-400 font-semibold">{player2Name}</span>
            <span className={`text-4xl font-black font-mono ${!isPlayer1Winner && !isDraw ? 'text-amber-400' : 'text-slate-300'}`}>
              {matchResult.player2_score.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-dark-bg rounded-xl p-4 border border-dark-card text-center">
          <Activity size={20} className="text-blue-400 mx-auto mb-2" />
          <div className="text-lg font-black text-slate-100">{matchResult.player1_strength.toFixed(1)}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Squad</div>
        </div>
        <div className="bg-dark-bg rounded-xl p-4 border border-dark-card text-center">
          <Target size={20} className="text-purple-400 mx-auto mb-2" />
          <div className="text-lg font-black text-slate-100">{matchResult.player1_tactic.toFixed(1)}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Tactic</div>
        </div>
        <div className="bg-dark-bg rounded-xl p-4 border border-dark-card text-center">
          <Sparkles size={20} className="text-amber-400 mx-auto mb-2" />
          <div className="text-lg font-black text-slate-100">{matchResult.player1_luck.toFixed(1)}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Luck</div>
        </div>
      </div>

      <button
        onClick={() => setShowCommentary(!showCommentary)}
        className="w-full flex items-center justify-between p-4 bg-dark-bg rounded-xl border border-dark-card text-slate-300 hover:text-slate-100 transition-colors"
      >
        <span className="font-bold text-sm flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          Match Commentary
        </span>
        <ChevronRight
          size={16}
          className={`transition-transform ${showCommentary ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {showCommentary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {matchResult.commentary?.slice(0, currentMinute + 1).map((comment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-xl border text-sm ${
                  comment.type === 'goal'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    : comment.type === 'save'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                    : 'bg-dark-bg border-dark-card text-slate-400'
                }`}
              >
                <span className="font-mono text-xs text-slate-500 mr-2">{comment.minute}'</span>
                {comment.event}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPlayAgain}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-lg hover:from-amber-400 hover:to-yellow-400 shadow-xl transition-all"
      >
        Play Again
      </motion.button>
    </motion.div>
  );
};

// ==================== MAIN AUCTION COMPONENT ====================

const AuctionAndMatchView: React.FC<{
  sessionId: string;
  player1Id: string;
  player2Id: string;
  playerName: string;
  initialBudget?: number;
}> = ({ sessionId, player1Id, player2Id, playerName, initialBudget = 100 }) => {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [playerBudget, setPlayerBudget] = useState(initialBudget);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isPlayerTurn = useMemo(() => 
    auctionState?.current_turn_player === player1Id && 
    auctionState?.status !== 'completed',
    [auctionState, player1Id]
  );

  const isBotTurn = useMemo(() => 
    auctionState?.current_turn_player === player2Id && 
    auctionState?.status !== 'completed',
    [auctionState, player2Id]
  );

  const isAuctionComplete = useMemo(() => 
    auctionState?.status === 'completed' || matchResult !== null,
    [auctionState, matchResult]
  );

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [sessionId]);

  const connectWebSocket = () => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/auction/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ action: 'start_auction' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Please refresh.');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connectWebSocket, 3000);
    };

    wsRef.current = ws;
  };

  const handleServerMessage = (data: any) => {
    if (data.type === 'auction_state') {
      setAuctionState(data.state);
      setIsLoading(false);
      setError(null);
    } else if (data.type === 'match_result') {
      setMatchResult(data.result);
      setAuctionState(prev => prev ? { ...prev, status: 'completed' } : null);
    } else if (data.type === 'error') {
      setError(data.message);
    } else if (data.type === 'bid_confirmed') {
      setLastAction(`Bid placed: ${data.amount}M`);
      updatePlayerBudget(data.amount);
    } else if (data.type === 'skip_confirmed') {
      setLastAction('Turn skipped');
    }
  };

  const updatePlayerBudget = (amount: number) => {
    setPlayerBudget(prev => {
      const newBudget = prev - amount;
      return Math.max(0, Math.round(newBudget * 100) / 100);
    });
  };

  const handleBid = useCallback((amount: number) => {
    if (!wsRef.current || !isPlayerTurn) return;
    
    wsRef.current.send(JSON.stringify({
      action: 'place_bid',
      player_id: player1Id,
      amount: amount
    }));
    
    setLastAction('');
  }, [isPlayerTurn, player1Id]);

  const handleSkip = useCallback(() => {
    if (!wsRef.current || !isPlayerTurn) return;
    
    wsRef.current.send(JSON.stringify({
      action: 'skip_bid',
      player_id: player1Id
    }));
    
    setLastAction('');
  }, [isPlayerTurn, player1Id]);

  const handlePlayAgain = useCallback(() => {
    setMatchResult(null);
    setAuctionState(null);
    setIsLoading(true);
    setPlayerBudget(initialBudget);
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ action: 'start_auction' }));
    }
  }, [initialBudget]);

  useEffect(() => {
    if (auctionState && auctionState.status !== 'completed') {
      timerIntervalRef.current = setInterval(() => {
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({ action: 'check_timer' }));
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [auctionState?.status]);

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader size={48} className="text-amber-400 mx-auto" />
          </motion.div>
          <p className="text-slate-400 font-bold">Preparing Auction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-red-500/10 rounded-2xl border border-red-500/20">
          <XCircle size={48} className="text-red-400 mx-auto" />
          <p className="text-red-400 font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isAuctionComplete && matchResult) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <MatchResultScreen
          matchResult={matchResult}
          player1Name={playerName}
          player2Name="GOAT Bot"
          onPlayAgain={handlePlayAgain}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Live Auction</h1>
          <p className="text-sm text-slate-400 mt-1">Build Your Ultimate Team</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase font-bold">Your Budget</div>
            <div className="text-lg font-black text-amber-400 font-mono">{playerBudget}M €</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <DollarSign size={20} className="text-amber-400" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle size={16} />
            <span>{lastAction}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-dark-bg-alt/90 backdrop-blur-lg rounded-2xl p-6 border border-dark-card space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Active Live Auction
                </span>
              </div>
              <TimerDisplay
                timeRemaining={auctionState?.timer_remaining ?? 30}
                totalDuration={auctionState?.timer_duration ?? 30}
                isActive={isPlayerTurn}
              />
            </div>

            {auctionState?.current_player && (
              <PlayerCardDisplay player={auctionState.current_player} />
            )}

            <BidControls
              isPlayerTurn={isPlayerTurn}
              isBotTurn={isBotTurn}
              highestBid={auctionState?.highest_bid ?? 0}
              playerBudget={playerBudget}
              onBid={handleBid}
              onSkip={handleSkip}
              disabled={false}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-dark-bg-alt/90 backdrop-blur-lg rounded-2xl p-5 border border-dark-card space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Auction Progress
            </h3>
            {auctionState && (
              <AuctionProgressBar
                currentIndex={auctionState.auction_index}
                totalPositions={auctionState.total_positions}
                sequence={auctionState.auction_sequence}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionAndMatchView;
