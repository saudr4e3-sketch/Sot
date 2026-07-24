import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PlayerCard from './PlayerCard'
import { 
  Clock, 
  TrendingUp, 
  Target, 
  ChevronDown, 
  Award, 
  Zap, 
  Shield, 
  Flame, 
  Activity,
  Gavel,
  SkipForward,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  DollarSign,
  BarChart3,
  ChevronUp,
  History,
  Radio,
  Bot,
  User,
  Timer
} from 'lucide-react'

// ==================== Types & Interfaces ====================

interface BidHistoryEntry {
  amount: number
  time: string
  player: 'you' | 'opponent' | 'bot'
  type: 'bid' | 'skip' | 'auto'
  timestamp: number
}

interface QuickBidPreset {
  label: string
  amount: number
  description: string
  icon: React.ReactNode
  color: string
}

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

// ==================== Constants ====================

const BID_PRESETS: QuickBidPreset[] = [
  {
    label: 'Min Bid',
    amount: 0, // سيتم حسابه ديناميكياً
    description: 'الحد الأدنى',
    icon: <ChevronUp size={14} />,
    color: 'border-blue-500/30 hover:bg-blue-500/10 text-blue-400'
  },
  {
    label: 'Low Raise',
    amount: 0,
    description: 'زيادة طفيفة',
    icon: <TrendingUp size={14} />,
    color: 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400'
  },
  {
    label: 'Medium Raise',
    amount: 0,
    description: 'زيادة متوسطة',
    icon: <Zap size={14} />,
    color: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400'
  },
  {
    label: 'Power Bid',
    amount: 0,
    description: 'عرض قوي',
    icon: <Flame size={14} />,
    color: 'border-orange-500/30 hover:bg-orange-500/10 text-orange-400'
  },
  {
    label: 'Max Pressure',
    amount: 0,
    description: 'أقصى ضغط',
    icon: <Sparkles size={14} />,
    color: 'border-purple-500/30 hover:bg-purple-500/10 text-purple-400'
  },
  {
    label: 'Dominance',
    amount: 0,
    description: 'هيمنة كاملة',
    icon: <Award size={14} />,
    color: 'border-red-500/30 hover:bg-red-500/10 text-red-400'
  }
]

const TIMER_WARNING_THRESHOLD = 10  // ثواني
const TIMER_CRITICAL_THRESHOLD = 5  // ثواني
const MAX_BID_HISTORY = 8
const BID_ANIMATION_DURATION = 500   // مللي ثانية

// ==================== Sub-Components ====================

interface TimerDisplayProps {
  timeRemaining: number
  isYourTurn: boolean
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeRemaining, isYourTurn }) => {
  const isWarning = timeRemaining <= TIMER_WARNING_THRESHOLD && timeRemaining > TIMER_CRITICAL_THRESHOLD
  const isCritical = timeRemaining <= TIMER_CRITICAL_THRESHOLD
  const isExpired = timeRemaining <= 0
  
  // حساب نسبة التقدم
  const progress = Math.max(0, Math.min(100, (timeRemaining / 30) * 100))
  
  // تحديد الألوان حسب الحالة
  const getTimerColors = () => {
    if (isExpired) return {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: 'text-red-400',
      bar: 'bg-red-500',
      glow: 'shadow-red-500/20'
    }
    if (isCritical) return {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: 'text-red-400 animate-pulse',
      bar: 'bg-red-500',
      glow: 'shadow-red-500/20'
    }
    if (isWarning) return {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: 'text-amber-400',
      bar: 'bg-amber-500',
      glow: 'shadow-amber-500/10'
    }
    return {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: 'text-blue-400',
      bar: 'bg-blue-500',
      glow: 'shadow-blue-500/10'
    }
  }
  
  const colors = getTimerColors()
  
  return (
    <div className={`flex items-center gap-3 ${colors.bg} p-3 rounded-2xl border ${colors.border} ${colors.glow} shadow-inner w-full sm:w-auto justify-between sm:justify-center transition-all duration-300`}>
      {/* Timer Icon with Animation */}
      <div className="relative">
        {isCritical ? (
          <AlertTriangle size={20} className={`${colors.icon} animate-bounce`} />
        ) : isExpired ? (
          <Timer size={20} className={colors.icon} />
        ) : (
          <Clock size={20} className={`${colors.icon} ${isWarning ? 'animate-spin-slow' : ''}`} />
        )}
        
        {/* Progress Ring */}
        <svg className="absolute -top-1 -left-1 w-[26px] h-[26px] transform -rotate-90">
          <circle
            cx="13"
            cy="13"
            r="11"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-dark-card/30"
          />
          <circle
            cx="13"
            cy="13"
            r="11"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 11}`}
            strokeDashoffset={`${2 * Math.PI * 11 * (1 - progress / 100)}`}
            className={colors.text.replace('text', 'stroke')}
          />
        </svg>
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          {isExpired ? 'Expired' : 'Time Left'}
        </span>
        <span className={`text-2xl sm:text-3xl font-black font-mono px-2 py-0.5 rounded-xl transition-all duration-300 ${
          isCritical ? `${colors.text} animate-pulse scale-110` : 
          isWarning ? colors.text :
          'text-slate-200'
        }`}>
          {timeRemaining.toFixed(1)}
          <span className="text-sm font-bold ml-0.5">s</span>
        </span>
      </div>
      
      {/* Turn Status Dot */}
      <div className="flex flex-col items-center gap-1">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
          isYourTurn 
            ? isCritical 
              ? 'bg-red-400 animate-ping' 
              : 'bg-green-400'
            : 'bg-slate-600'
        }`} />
        <span className="text-[8px] text-text-muted font-bold uppercase">
          {isYourTurn ? 'You' : 'Opp'}
        </span>
      </div>
    </div>
  )
}

interface BidHistoryItemProps {
  entry: BidHistoryEntry
  isNew: boolean
}

const BidHistoryItem: React.FC<BidHistoryItemProps> = ({ entry, isNew }) => {
  const getPlayerInfo = (player: string) => {
    switch (player) {
      case 'you':
        return {
          icon: <User size={10} />,
          label: 'You',
          color: 'text-blue-400',
          bg: 'bg-blue-500/10'
        }
      case 'bot':
        return {
          icon: <Bot size={10} />,
          label: 'Bot',
          color: 'text-purple-400',
          bg: 'bg-purple-500/10'
        }
      default:
        return {
          icon: <User size={10} />,
          label: 'Opp',
          color: 'text-red-400',
          bg: 'bg-red-500/10'
        }
    }
  }
  
  const info = getPlayerInfo(entry.player)
  
  return (
    <div className={`
      flex justify-between items-center text-xs py-2 px-3 rounded-lg
      transition-all duration-300
      ${isNew ? 'animate-slide-in bg-amber-500/10 border border-amber-500/20' : 'bg-dark-card/50'}
    `}>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${info.bg}`}>
          {info.icon}
          <span className={`text-[10px] font-bold ${info.color}`}>{info.label}</span>
        </div>
        {entry.type === 'skip' && (
          <span className="text-[9px] text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded">
            SKIP
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <span className={`font-mono font-bold ${
          entry.type === 'skip' ? 'text-slate-500 line-through' : 'text-amber-400'
        }`}>
          {entry.type === 'skip' ? 'Pass' : `${entry.amount.toLocaleString()} €`}
        </span>
        <span className="text-[9px] text-text-muted font-mono">{entry.time}</span>
      </div>
    </div>
  )
}

// ==================== Main Component ====================

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
  // ===== State Management =====
  const [bidAmount, setBidAmount] = useState<number>(0)
  const [bidHistory, setBidHistory] = useState<BidHistoryEntry[]>([])
  const [isTimerWarning, setIsTimerWarning] = useState(false)
  const [isTimerCritical, setIsTimerCritical] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [showBidAnimation, setShowBidAnimation] = useState(false)
  const [lastBidDirection, setLastBidDirection] = useState<'up' | 'down' | null>(null)
  const [bidInputFocused, setBidInputFocused] = useState(false)
  const [recentlySkipped, setRecentlySkipped] = useState(false)
  
  // Refs
  const bidInputRef = useRef<HTMLInputElement>(null)
  const previousBidRef = useRef<number>(currentBid)
  
  // ===== Computed Values =====
  const playerName = useMemo(() => 
    currentPlayer?.name || `Elite Star ${currentPosition}`,
    [currentPlayer?.name, currentPosition]
  )
  
  const playerRating = useMemo(() => 
    currentPlayer?.rating || 85,
    [currentPlayer?.rating]
  )
  
  const playerRarity = useMemo(() => 
    currentPlayer?.rarity || 'Legendary',
    [currentPlayer?.rarity]
  )
  
  // حساب الحد الأدنى للمزايدة
  const minBid = useMemo(() => 
    currentBid > 0 ? Math.ceil(currentBid * 1.05) : 500000,
    [currentBid]
  )
  
  // حساب المزايدات السريعة
  const quickBidAmounts = useMemo(() => {
    const base = currentBid > 0 ? currentBid : 1000000
    const increments = [0.05, 0.10, 0.20, 0.35, 0.50, 0.75]
    
    return increments.map((inc, index) => ({
      ...BID_PRESETS[index],
      amount: Math.ceil(base * (1 + inc) / 100000) * 100000
    }))
  }, [currentBid])
  
  // ===== Effects =====
  
  // تحديث حالة المؤقت
  useEffect(() => {
    setIsTimerWarning(timeRemaining <= TIMER_WARNING_THRESHOLD && timeRemaining > TIMER_CRITICAL_THRESHOLD)
    setIsTimerCritical(timeRemaining <= TIMER_CRITICAL_THRESHOLD)
  }, [timeRemaining])
  
  // تحديث سجل المزايدات
  useEffect(() => {
    if (currentBid > 0 && currentBid !== previousBidRef.current) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      })
      
      const direction = currentBid > previousBidRef.current ? 'up' : 'down'
      setLastBidDirection(direction)
      setShowBidAnimation(true)
      
      const newEntry: BidHistoryEntry = {
        amount: currentBid,
        time: timeStr,
        player: isYourTurn ? 'opponent' : 'you',
        type: 'bid',
        timestamp: now.getTime()
      }
      
      setBidHistory(prev => [newEntry, ...prev].slice(0, MAX_BID_HISTORY))
      previousBidRef.current = currentBid
      
      // إعادة تعيين المبلغ المقترح
      setBidAmount(Math.ceil(currentBid * 1.1 / 100000) * 100000)
      
      // إخفاء الأنيميشن بعد فترة
      const timeout = setTimeout(() => setShowBidAnimation(false), BID_ANIMATION_DURATION)
      return () => clearTimeout(timeout)
    }
  }, [currentBid, isYourTurn])
  
  // تحديث المبلغ الأولي
  useEffect(() => {
    if (bidAmount === 0 && currentBid >= 0) {
      setBidAmount(minBid)
    }
  }, [minBid, bidAmount, currentBid])
  
  // إعادة تعيين حالة التخطي
  useEffect(() => {
    if (recentlySkipped) {
      const timeout = setTimeout(() => setRecentlySkipped(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [recentlySkipped])
  
  // ===== Event Handlers =====
  
  const handleBid = useCallback(() => {
    if (bidAmount > currentBid && !disabled) {
      // تأثير الضغط
      setShowBidAnimation(true)
      
      onBid(bidAmount)
      
      // إضافة للسجل
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      })
      
      const newEntry: BidHistoryEntry = {
        amount: bidAmount,
        time: timeStr,
        player: 'you',
        type: 'bid',
        timestamp: now.getTime()
      }
      
      setBidHistory(prev => [newEntry, ...prev].slice(0, MAX_BID_HISTORY))
      setSelectedPreset(null)
      
      // زيادة المبلغ المقترح للخطوة التالية
      setBidAmount(Math.ceil(bidAmount * 1.15 / 100000) * 100000)
      
      setTimeout(() => setShowBidAnimation(false), BID_ANIMATION_DURATION)
    }
  }, [bidAmount, currentBid, disabled, onBid])
  
  const handleQuickBid = useCallback((amount: number) => {
    if (!disabled) {
      setBidAmount(amount)
      onBid(amount)
      
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      })
      
      const newEntry: BidHistoryEntry = {
        amount: amount,
        time: timeStr,
        player: 'you',
        type: 'bid',
        timestamp: now.getTime()
      }
      
      setBidHistory(prev => [newEntry, ...prev].slice(0, MAX_BID_HISTORY))
    }
  }, [disabled, onBid])
  
  const handleSkip = useCallback(() => {
    if (!disabled) {
      setRecentlySkipped(true)
      
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      })
      
      const newEntry: BidHistoryEntry = {
        amount: 0,
        time: timeStr,
        player: 'you',
        type: 'skip',
        timestamp: now.getTime()
      }
      
      setBidHistory(prev => [newEntry, ...prev].slice(0, MAX_BID_HISTORY))
      onSkip()
    }
  }, [disabled, onSkip])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && bidAmount > currentBid) {
      handleBid()
    }
  }, [handleBid, disabled, bidAmount, currentBid])
  
  // ===== Render =====
  return (
    <Card className="p-5 sm:p-7 space-y-6 bg-gradient-to-b from-dark-bg-alt to-dark-bg border-2 border-dark-card shadow-2xl rounded-3xl">
      {/* ===== Header Section ===== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-dark-card pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Indicator */}
            <span className="bg-accent-terracotta/20 text-accent-terracotta text-xs font-black uppercase px-2.5 py-1 rounded-lg border border-accent-terracotta/30 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-terracotta opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-terracotta" />
              </span>
              Live Auction
            </span>
            
            {/* Position Badge */}
            <span className="text-xs text-text-secondary font-mono bg-dark-card px-2 py-1 rounded-lg border border-dark-card/50">
              {currentPosition}
            </span>
            
            {/* Rarity Badge */}
            {playerRarity && (
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${
                playerRarity === 'Legendary' 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : playerRarity === 'Medium'
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
              }`}>
                {playerRarity}
              </span>
            )}
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-text-primary mt-2 tracking-tight">
            Strategic Bidding Phase
          </h2>
        </div>
        
        {/* Timer Display */}
        <TimerDisplay timeRemaining={timeRemaining} isYourTurn={isYourTurn} />
      </div>

      {/* ===== Player Card Section ===== */}
      <div className="my-2 transform transition-all duration-300 hover:scale-[1.01]">
        <PlayerCard
          name={playerName}
          position={currentPosition}
          rating={playerRating}
          rarity={playerRarity}
          image_url={currentPlayer?.image_url}
        />
      </div>

      {/* ===== Financial Status Panel ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Current Highest Bid */}
        <div className={`
          bg-dark-bg p-4 rounded-2xl border border-dark-card flex flex-col justify-center shadow-md
          transition-all duration-300 relative overflow-hidden
          ${showBidAnimation ? 'scale-[1.02]' : ''}
        `}>
          {/* Bid Direction Indicator */}
          {lastBidDirection && showBidAnimation && (
            <div className={`absolute top-2 right-2 transition-all duration-300 ${
              lastBidDirection === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {lastBidDirection === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          )}
          
          <span className="text-xs text-text-secondary font-semibold uppercase flex items-center gap-1">
            <Gavel size={14} className="text-amber-400" /> 
            Current Highest Bid
          </span>
          
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {currentBid.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-amber-400/70">€</span>
          </div>
          
          {/* Bid Comparison */}
          {currentBid > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-dark-card rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500/50 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentBid / 100000000) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-text-muted font-mono">
                {((currentBid / 100000000) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Turn Status */}
        <div className={`p-4 rounded-2xl border-2 flex flex-col justify-center shadow-md transition-all duration-300 ${
          isYourTurn 
            ? isTimerCritical
              ? 'bg-red-500/10 border-red-500/40 text-red-300 animate-pulse'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-500/10 border-slate-500/40 text-slate-300'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Radio size={14} className={isYourTurn ? 'animate-pulse' : ''} /> 
            Turn Status
          </span>
          
          <span className="text-base sm:text-lg font-black mt-1 flex items-center gap-2">
            {isYourTurn ? (
              <>
                <Zap size={18} className="text-amber-400" />
                Your Turn to Bid!
              </>
            ) : (
              <>
                <Clock size={18} />
                Opponent's Turn
              </>
            )}
          </span>
          
          {/* Timer Warning for Critical State */}
          {isYourTurn && isTimerCritical && (
            <span className="text-xs text-red-400 font-bold mt-1 animate-pulse">
              ⚠️ Hurry! Time is running out!
            </span>
          )}
        </div>
      </div>

      {/* ===== Bidding Controls ===== */}
      {isYourTurn ? (
        <div className="space-y-4 bg-dark-bg/80 p-4 sm:p-5 rounded-2xl border border-dark-card shadow-lg">
          {/* Custom Bid Input */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-amber-400" />
                Custom Bid Amount
              </span>
              <span className="text-[10px] text-text-muted font-normal">
                Min: {minBid.toLocaleString()} €
              </span>
            </label>
            
            <div className="flex gap-2">
              <div className={`
                flex-1 relative rounded-xl transition-all duration-300
                ${bidInputFocused ? 'ring-2 ring-accent-terracotta/50' : ''}
                ${bidAmount <= currentBid ? 'ring-2 ring-red-500/30' : ''}
              `}>
                <input
                  ref={bidInputRef}
                  type="number"
                  min={minBid}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  onFocus={() => setBidInputFocused(true)}
                  onBlur={() => setBidInputFocused(false)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-dark-card border border-dark-card text-text-primary font-mono font-bold text-lg px-4 py-3 rounded-xl focus:outline-none transition-all"
                  disabled={disabled}
                  placeholder={`Min: ${minBid.toLocaleString()}`}
                />
                
                {/* Quick Adjust Buttons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                  <button
                    onClick={() => setBidAmount(prev => Math.ceil(prev * 1.05 / 100000) * 100000)}
                    className="p-0.5 hover:bg-dark-bg rounded transition-colors"
                    disabled={disabled}
                  >
                    <ChevronUp size={12} className="text-text-muted" />
                  </button>
                  <button
                    onClick={() => setBidAmount(prev => Math.max(minBid, Math.floor(prev * 0.95 / 100000) * 100000))}
                    className="p-0.5 hover:bg-dark-bg rounded transition-colors"
                    disabled={disabled}
                  >
                    <ChevronDown size={12} className="text-text-muted" />
                  </button>
                </div>
              </div>
              
              <Button
                onClick={handleBid}
                disabled={disabled || bidAmount <= currentBid}
                size="lg"
                className={`
                  px-6 font-black shadow-lg transition-all duration-300
                  ${!disabled && bidAmount > currentBid 
                    ? 'animate-pulse-subtle hover:scale-105' 
                    : ''
                  }
                `}
              >
                <Gavel size={16} className="mr-1" />
                Place Bid
              </Button>
            </div>
            
            {/* Validation Message */}
            {bidAmount <= currentBid && bidAmount > 0 && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                Bid must be higher than current bid ({currentBid.toLocaleString()} €)
              </p>
            )}
          </div>

          {/* Quick Bid Presets */}
          <div>
            <span className="block text-[11px] font-bold text-text-secondary uppercase mb-2 flex items-center gap-1.5">
              <Zap size={12} className="text-amber-400" />
              Quick Bid Shortcuts
            </span>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickBidAmounts.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickBid(preset.amount)}
                  disabled={disabled}
                  className={`
                    relative p-3 rounded-xl border font-mono font-bold text-xs
                    transition-all duration-200
                    ${preset.color}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}
                    ${selectedPreset === index ? 'ring-2 ring-accent-terracotta scale-105' : ''}
                    group
                  `}
                  onMouseEnter={() => setSelectedPreset(index)}
                  onMouseLeave={() => setSelectedPreset(null)}
                >
                  {/* Preset Content */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider">
                      {preset.label}
                    </span>
                    <span className="text-sm">
                      {(preset.amount / 1000000).toFixed(1)}M €
                    </span>
                    <span className="text-[9px] opacity-60">
                      {preset.description}
                    </span>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-current/5 to-transparent" />
                </button>
              ))}
            </div>
          </div>

          {/* Skip Button */}
          <div className="pt-2 border-t border-dark-card">
            <Button
              onClick={handleSkip}
              variant="secondary"
              className={`
                w-full border font-bold py-3 transition-all duration-300
                ${recentlySkipped 
                  ? 'border-slate-500/50 text-slate-400 bg-slate-500/10' 
                  : 'border-rose-500/50 text-rose-400 hover:bg-rose-500/10'
                }
              `}
              disabled={disabled}
            >
              <SkipForward size={16} className="mr-2" />
              {recentlySkipped ? 'Turn Skipped ✓' : 'Skip Turn / Pass Card'}
            </Button>
            
            {!disabled && (
              <p className="text-[9px] text-text-muted text-center mt-1.5">
                Skipping may trigger a Mystery Card for the loser
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Waiting State */
        <div className="text-center p-6 bg-dark-bg rounded-2xl border border-dark-card shadow-inner space-y-3">
          {/* Animated Waiting Indicator */}
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-dark-card rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-accent-terracotta rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-transparent border-b-amber-400 rounded-full animate-spin-slow" />
            <Activity className="absolute inset-0 m-auto text-accent-terracotta animate-pulse" size={24} />
          </div>
          
          <div>
            <p className="text-sm font-bold text-text-primary">
              Waiting for opponent's tactical response...
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Analyze the current market value and prepare your next counter-bid
            </p>
          </div>
          
          {/* Quick Stats While Waiting */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-dark-card/50 p-2 rounded-lg">
              <span className="text-[9px] text-text-muted block">Position</span>
              <span className="text-xs font-bold text-text-primary">{currentPosition}</span>
            </div>
            <div className="bg-dark-card/50 p-2 rounded-lg">
              <span className="text-[9px] text-text-muted block">Rating</span>
              <span className="text-xs font-bold text-amber-400">{playerRating}</span>
            </div>
            <div className="bg-dark-card/50 p-2 rounded-lg">
              <span className="text-[9px] text-text-muted block">Rarity</span>
              <span className="text-xs font-bold text-text-primary">{playerRarity}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== Bid History Feed ===== */}
      {bidHistory.length > 0 && (
        <div className="bg-dark-bg p-3.5 rounded-2xl border border-dark-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
              <History size={12} className="text-accent-terracotta" /> 
              Bid History
            </span>
            <span className="text-[9px] text-text-muted font-mono">
              {bidHistory.length} events
            </span>
          </div>
          
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {bidHistory.map((entry, idx) => (
              <BidHistoryItem 
                key={entry.timestamp} 
                entry={entry} 
                isNew={idx === 0}
              />
            ))}
          </div>
          
          {/* History Summary */}
          {bidHistory.length >= 3 && (
            <div className="pt-2 border-t border-dark-card/50 flex items-center justify-between text-[9px] text-text-muted">
              <span>
                Avg Bid: {Math.round(bidHistory
                  .filter(e => e.type === 'bid')
                  .reduce((acc, e) => acc + e.amount, 0) / 
                  Math.max(1, bidHistory.filter(e => e.type === 'bid').length)
                ).toLocaleString()} €
              </span>
              <span>
                Skips: {bidHistory.filter(e => e.type === 'skip').length}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ==================== Export ====================

export default AuctionTimer
