/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Auction Progress & Timer Component
 * Version: 5.0.0 - Fully TypeScript Safe, Decoupled from Global Types
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Card from '@/components/ui/Card'
import { 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Timer, 
  Zap,
  Hourglass,
  Bell,
  BellRing,
  AlertOctagon
} from 'lucide-react'

// ==================== LOCAL TYPES (Decoupled from Global Types) ====================

interface CurrentPlayerInfo {
  name: string
  position: string
  rating: number
  image_url?: string
  rarity?: 'Legendary' | 'Medium' | 'Weak' | string
  nationality?: string
  team?: string
  age?: number
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
  potential?: number
  market_value?: string
  playing_style?: string
  card_id?: string
  is_mystery?: boolean
}

interface AuctionStateData {
  session_id?: string
  status?: string
  current_position?: string
  auction_index?: number
  total_positions?: number
  auction_sequence?: string[]
  current_turn_player?: string
  highest_bid?: number
  highest_bidder?: string | null
  timer_remaining?: number
  player1_budget?: number
  player2_budget?: number
  player1_total_spent?: number
  player2_total_spent?: number
  player1_team?: Record<string, any[]>
  player2_team?: Record<string, any[]>
  current_player?: CurrentPlayerInfo | null
  next_position?: string | null
  player2_id?: string
  is_auction_finished?: boolean
  match_completed?: boolean
  winner_id?: string | null
  auction_progress?: number
}

interface AuctionProgressProps {
  state: AuctionStateData | null | undefined
  timerRemaining?: number
  timerDuration?: number
  onTimerExpired?: () => void
}

type TimerSeverity = 'normal' | 'warning' | 'critical' | 'expired'

// ==================== CONSTANTS ====================

const TIMER_THRESHOLDS: Record<string, number> = {
  WARNING: 15,
  CRITICAL: 5,
  EXPIRED: 0,
}

const TIMER_COLORS: Record<TimerSeverity, {
  ring: string
  text: string
  bg: string
  pulse: boolean
}> = {
  normal: {
    ring: '#3b82f6',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    pulse: false
  },
  warning: {
    ring: '#f59e0b',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    pulse: true
  },
  critical: {
    ring: '#ef4444',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    pulse: true
  },
  expired: {
    ring: '#6b7280',
    text: 'text-slate-500',
    bg: 'bg-slate-500/10',
    pulse: false
  }
}

// ==================== SUB-COMPONENTS ====================

interface CircularTimerProps {
  remaining: number
  duration: number
  isActive: boolean
  severity: TimerSeverity
  currentPlayer: string
}

const CircularTimer: React.FC<CircularTimerProps> = ({ 
  remaining, 
  duration, 
  isActive, 
  severity,
  currentPlayer
}) => {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const safeDuration = duration > 0 ? duration : 1
  const safeRemaining = Math.max(0, remaining)
  const progress = isActive ? (safeRemaining / safeDuration) * circumference : circumference
  const colors = TIMER_COLORS[severity] ?? TIMER_COLORS.normal
  
  const pulseClass = colors.pulse && isActive ? 'animate-pulse' : ''
  const displaySeconds = Math.ceil(safeRemaining)
  const isLowTime = displaySeconds <= 10
  
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg 
          className={`w-20 h-20 transform -rotate-90 transition-transform duration-300 ${pulseClass}`}
          viewBox="0 0 64 64"
        >
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-dark-card/60"
          />
          
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={colors.ring}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: severity === 'critical' ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))' : undefined
            }}
          />
          
          {severity === 'critical' && (
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="#ef4444"
              strokeWidth="2"
              fill="none"
              opacity={0.3}
              className="animate-ping"
            />
          )}
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          {severity === 'expired' ? (
            <AlertOctagon size={24} className="text-red-400 animate-bounce" />
          ) : (
            <div className="text-center">
              <span className={`text-xl font-black font-mono ${colors.text}`}>
                {displaySeconds}
              </span>
              {isLowTime && severity !== 'normal' && (
                <span className="block text-[8px] text-slate-400 font-bold uppercase">
                  sec
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={`text-center ${pulseClass}`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
          {severity === 'expired' ? 'Time Up!' : 'Remaining'}
        </p>
        {isActive && severity !== 'expired' && (
          <p className="text-[9px] text-slate-500 mt-0.5">
            {currentPlayer === 'player1' ? 'Your Turn' : 'Opponent Turn'}
          </p>
        )}
      </div>
    </div>
  )
}

interface TimerBarProps {
  remaining: number
  duration: number
  severity: TimerSeverity
  isActive: boolean
}

const TimerBar: React.FC<TimerBarProps> = ({ remaining, duration, severity, isActive }) => {
  const safeDuration = duration > 0 ? duration : 1
  const safeRemaining = Math.max(0, remaining)
  const percentage = isActive ? (safeRemaining / safeDuration) * 100 : 0
  const colors = TIMER_COLORS[severity] ?? TIMER_COLORS.normal
  
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className={colors.text} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
            {severity === 'expired' ? 'Expired' : 'Timer'}
          </span>
        </div>
        <span className={`text-xs font-mono font-black ${colors.text}`}>
          {Math.ceil(safeRemaining)}s
        </span>
      </div>
      
      <div className="w-full bg-dark-bg-alt rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${Math.max(0, Math.min(100, percentage))}%`,
            backgroundColor: colors.ring,
            boxShadow: severity === 'critical' 
              ? `0 0 10px ${colors.ring}` 
              : undefined
          }}
        />
      </div>
      
      {isActive && severity !== 'expired' && (
        <div className="flex justify-between px-0.5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 h-1 rounded-full bg-dark-card/50"
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TimerAlertProps {
  severity: TimerSeverity
  remaining: number
  currentPlayer: string
  isVisible: boolean
}

const TimerAlert: React.FC<TimerAlertProps> = ({ severity, remaining, currentPlayer, isVisible }) => {
  if (!isVisible) return null
  
  const isPlayerTurn = currentPlayer === 'player1'
  
  const alerts: Record<TimerSeverity, {
    icon: React.ReactNode
    message: string
    className: string
  }> = {
    normal: {
      icon: null,
      message: '',
      className: ''
    },
    warning: {
      icon: <Bell size={14} />,
      message: isPlayerTurn 
        ? `${remaining}s remaining - Make your move!`
        : 'Opponent is thinking...',
      className: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    },
    critical: {
      icon: <BellRing size={14} className="animate-pulse" />,
      message: isPlayerTurn
        ? `HURRY! Only ${remaining}s left!`
        : 'Opponent running out of time!',
      className: 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
    },
    expired: {
      icon: <AlertOctagon size={14} />,
      message: 'Time expired! Turn passed automatically.',
      className: 'bg-red-500/20 border-red-500/30 text-red-300'
    }
  }
  
  const alert = alerts[severity] ?? alerts.normal
  if (!alert.message) return null
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold ${alert.className} transition-all duration-300`}>
      {alert.icon}
      <span>{alert.message}</span>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================

const AuctionProgress: React.FC<AuctionProgressProps> = ({ 
  state, 
  timerRemaining: externalTimer,
  timerDuration: externalDuration = 30,
  onTimerExpired 
}) => {
  // ===== State Management =====
  const [internalTimer, setInternalTimer] = useState<number>(externalDuration)
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false)
  const [timerSeverity, setTimerSeverity] = useState<TimerSeverity>('normal')
  const [showTimerAlert, setShowTimerAlert] = useState<boolean>(true)
  const [timerTick, setTimerTick] = useState<number>(0)
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousTurnRef = useRef<string | null>(null)
  const isMountedRef = useRef<boolean>(true)
  
  // ===== Safe State Extraction (Defensive Programming) =====
  const safeState: AuctionStateData = useMemo(() => state ?? {}, [state])
  
  const auctionIndex: number = safeState.auction_index ?? 0
  const totalPositions: number = (safeState.total_positions && safeState.total_positions > 0) ? safeState.total_positions : 9
  const player1Team: Record<string, any[]> = safeState.player1_team ?? {}
  const player2Team: Record<string, any[]> = safeState.player2_team ?? {}
  const auctionSequence: string[] = (safeState.auction_sequence && safeState.auction_sequence.length > 0) ? safeState.auction_sequence : ['GK', 'DEF', 'MID', 'ATT']
  const currentTurnPlayer: string = safeState.current_turn_player ?? ''
  const auctionStatus: string = safeState.status ?? 'idle'
  const currentPlayerInfo: CurrentPlayerInfo | null = safeState.current_player ?? null
  const player1Budget: number = safeState.player1_budget ?? 100
  const player2Budget: number = safeState.player2_budget ?? 100
  const player2Id: string = safeState.player2_id ?? 'player2'
  const nextPosition: string | null = safeState.next_position ?? null
  
  // ===== Computed Values =====
  const progress: number = useMemo(() => 
    totalPositions > 0 ? (auctionIndex / totalPositions) * 100 : 0,
    [auctionIndex, totalPositions]
  )
  
  const player1Cards: number = useMemo(() => {
    try {
      return Object.values(player1Team).flat().length
    } catch {
      return 0
    }
  }, [player1Team])
  
  const player2Cards: number = useMemo(() => {
    try {
      return Object.values(player2Team).flat().length
    } catch {
      return 0
    }
  }, [player2Team])
  
  const currentTimer: number = externalTimer ?? internalTimer
  const timerDuration: number = externalDuration > 0 ? externalDuration : 30
  
  const isAuctionActive: boolean = useMemo(() => {
    const activeStatuses: string[] = ['active', 'bid_placed', 'turn_passed', 'bidding']
    return activeStatuses.includes(auctionStatus)
  }, [auctionStatus])
  
  // ===== Timer Severity Calculation =====
  const calculateSeverity = useCallback((remaining: number): TimerSeverity => {
    if (remaining <= TIMER_THRESHOLDS.EXPIRED) return 'expired'
    if (remaining <= TIMER_THRESHOLDS.CRITICAL) return 'critical'
    if (remaining <= TIMER_THRESHOLDS.WARNING) return 'warning'
    return 'normal'
  }, [])
  
  // ===== Timer Management =====
  const startInternalTimer = useCallback(() => {
    if (!isMountedRef.current) return
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    
    setInternalTimer(timerDuration)
    setIsTimerActive(true)
    setShowTimerAlert(true)
    
    timerIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
        return
      }
      
      setInternalTimer(prev => {
        const next = prev - 0.1
        if (next <= 0) {
          setIsTimerActive(false)
          setTimerSeverity('expired')
          
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
          }
          
          if (onTimerExpired) {
            onTimerExpired()
          }
          return 0
        }
        
        setTimerSeverity(calculateSeverity(next))
        return Math.max(0, next)
      })
      
      setTimerTick(prev => prev + 1)
    }, 100)
  }, [timerDuration, calculateSeverity, onTimerExpired])
  
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (isMountedRef.current) {
      setIsTimerActive(false)
    }
  }, [])
  
  // ===== Effect: Handle turn changes =====
  useEffect(() => {
    if (!isMountedRef.current) return
    
    if (currentTurnPlayer !== previousTurnRef.current) {
      previousTurnRef.current = currentTurnPlayer
      
      if (currentTurnPlayer && isAuctionActive) {
        if (externalTimer === undefined) {
          startInternalTimer()
        }
        setShowTimerAlert(true)
      } else {
        stopTimer()
      }
    }
    
    if (!isAuctionActive) {
      stopTimer()
    }
    
    return () => {
      stopTimer()
    }
  }, [currentTurnPlayer, auctionStatus, isAuctionActive, externalTimer, startInternalTimer, stopTimer])
  
  // ===== Effect: Update severity when external timer changes =====
  useEffect(() => {
    if (!isMountedRef.current) return
    if (externalTimer !== undefined) {
      setTimerSeverity(calculateSeverity(externalTimer))
      setIsTimerActive(externalTimer > 0 && isAuctionActive)
    }
  }, [externalTimer, calculateSeverity, isAuctionActive])
  
  // ===== Effect: Cleanup on unmount =====
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])
  
  // ===== Auto-hide alert after delay =====
  useEffect(() => {
    if (!isMountedRef.current) return
    if (showTimerAlert && timerSeverity === 'normal') {
      const timeout = setTimeout(() => {
        if (isMountedRef.current) setShowTimerAlert(false)
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [showTimerAlert, timerSeverity])
  
  // ===== Render Helpers =====
  const getTurnIndicatorClass = (playerKey: string): string => {
    const isCurrentTurn = currentTurnPlayer === playerKey
    
    if (isCurrentTurn && timerSeverity === 'critical') {
      return 'bg-red-500/20 border-2 border-red-500/50 shadow-lg shadow-red-500/20 animate-pulse'
    }
    if (isCurrentTurn && timerSeverity === 'warning') {
      return 'bg-amber-500/15 border-2 border-amber-500/50 shadow-md'
    }
    if (isCurrentTurn) {
      return 'bg-accent-terracotta/15 border-2 border-accent-terracotta/50 shadow-md'
    }
    
    return 'bg-dark-bg-alt border border-dark-card'
  }
  
  const getTurnTextColor = (playerKey: string): string => {
    const isCurrentTurn = currentTurnPlayer === playerKey
    
    if (isCurrentTurn && timerSeverity === 'critical') {
      return 'text-red-400'
    }
    if (isCurrentTurn && timerSeverity === 'warning') {
      return 'text-amber-400'
    }
    if (isCurrentTurn) {
      return 'text-accent-terracotta'
    }
    
    return 'text-text-secondary'
  }
  
  // ===== RENDER =====
  return (
    <Card className="p-4 sm:p-6 space-y-5">
      {/* ===== Timer Section ===== */}
      {isAuctionActive && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <CircularTimer
                remaining={currentTimer}
                duration={timerDuration}
                isActive={isTimerActive}
                severity={timerSeverity}
                currentPlayer={currentTurnPlayer}
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isTimerActive 
                      ? timerSeverity === 'critical' 
                        ? 'bg-red-400 animate-pulse' 
                        : 'bg-green-400 animate-pulse'
                      : 'bg-slate-600'
                  }`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isTimerActive ? getTurnTextColor(currentTurnPlayer) : 'text-slate-500'
                  }`}>
                    {currentTurnPlayer === 'player1' ? 'Your Turn' : 
                     currentTurnPlayer === 'player2' ? "Opponent's Turn" : 
                     'Waiting...'}
                  </span>
                </div>
                
                <div className="sm:hidden">
                  <Timer 
                    size={16} 
                    className={`${TIMER_COLORS[timerSeverity]?.text ?? 'text-slate-400'} ${
                      timerSeverity === 'critical' ? 'animate-pulse' : ''
                    }`}
                  />
                </div>
              </div>
              
              <TimerBar
                remaining={currentTimer}
                duration={timerDuration}
                severity={timerSeverity}
                isActive={isTimerActive}
              />
            </div>
          </div>
          
          <TimerAlert
            severity={timerSeverity}
            remaining={Math.ceil(currentTimer)}
            currentPlayer={currentTurnPlayer}
            isVisible={showTimerAlert && (timerSeverity !== 'normal' || currentTimer <= 10)}
          />
        </div>
      )}
      
      {/* ===== Auction Sequence Progress ===== */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Auction Progress
          </p>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1">
              {[...Array(totalPositions)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i < auctionIndex
                      ? 'bg-emerald-400'
                      : i === auctionIndex
                      ? 'bg-accent-terracotta animate-pulse'
                      : 'bg-dark-card'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-bold text-accent-terracotta font-mono">
              {auctionIndex + 1}/{totalPositions}
            </p>
          </div>
        </div>
        
        <div className="w-full bg-dark-bg-alt rounded-full h-3 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_8px)]" />
          <div
            className="bg-gradient-to-r from-accent-terracotta via-accent-terracotta to-accent-gold h-full transition-all duration-500 ease-out relative"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          >
            {progress > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
          </div>
        </div>
      </div>

      {/* ===== Auction Sequence Display ===== */}
      <div>
        <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
          Sequence
        </p>
        <div className="grid grid-cols-9 gap-1">
          {auctionSequence.map((pos: string, idx: number) => {
            const isCurrent = idx === auctionIndex
            const isCompleted = idx < auctionIndex
            const isUpcoming = idx > auctionIndex
            
            return (
              <div
                key={idx}
                className={`
                  p-2 rounded-btn text-center text-xs font-bold transition-all duration-300 relative
                  ${isCurrent
                    ? 'bg-accent-terracotta text-white animate-bounce-auction shadow-lg ring-2 ring-accent-terracotta/50 z-10'
                    : isCompleted
                    ? 'bg-status-success/20 text-status-success border border-status-success/30'
                    : 'bg-dark-bg-alt text-text-secondary border border-dark-card'
                  }
                  ${isUpcoming ? 'opacity-60 hover:opacity-100' : ''}
                `}
              >
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                )}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                )}
                <span className="relative z-10">{pos}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== Players Info ===== */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-btn transition-all duration-300 ${getTurnIndicatorClass('player1')}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-semibold uppercase tracking-wider ${getTurnTextColor('player1')}`}>
              You
            </p>
            {currentTurnPlayer === 'player1' && isTimerActive && (
              <div className={`w-1.5 h-1.5 rounded-full ${
                timerSeverity === 'critical' ? 'bg-red-400 animate-pulse' : 'bg-green-400'
              }`} />
            )}
          </div>
          
          <div className="flex items-end gap-2">
            <p className="text-lg sm:text-xl font-bold text-text-primary">
              {player1Cards}
            </p>
            <p className="text-xs text-text-muted mb-0.5">Cards</p>
          </div>
          
          <div className="mt-2 pt-2 border-t border-dark-card/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Budget</span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {player1Budget.toFixed(1)}M
              </span>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-btn transition-all duration-300 ${getTurnIndicatorClass('player2')}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-semibold uppercase tracking-wider ${getTurnTextColor('player2')}`}>
              {player2Id.includes('bot') || player2Id.includes('Goat') 
                ? '🤖 Bot' 
                : 'Opponent'
              }
            </p>
            {currentTurnPlayer === 'player2' && isTimerActive && (
              <div className={`w-1.5 h-1.5 rounded-full ${
                timerSeverity === 'critical' ? 'bg-red-400 animate-pulse' : 'bg-blue-400'
              }`} />
            )}
          </div>
          
          <div className="flex items-end gap-2">
            <p className="text-lg sm:text-xl font-bold text-text-primary">
              {player2Cards}
            </p>
            <p className="text-xs text-text-muted mb-0.5">Cards</p>
          </div>
          
          <div className="mt-2 pt-2 border-t border-dark-card/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Budget</span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {player2Budget.toFixed(1)}M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Current Card Info ===== */}
      {currentPlayerInfo && (
        <div className="p-3 rounded-btn bg-dark-bg-alt border border-dark-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                currentPlayerInfo.rarity === 'Legendary' ? 'bg-amber-400' :
                currentPlayerInfo.rarity === 'Medium' ? 'bg-sky-400' :
                'bg-slate-400'
              }`} />
              <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">
                Current Card
              </span>
            </div>
            <span className={`text-xs font-bold ${
              currentPlayerInfo.rarity === 'Legendary' ? 'text-amber-400' :
              currentPlayerInfo.rarity === 'Medium' ? 'text-sky-400' :
              'text-slate-400'
            }`}>
              {currentPlayerInfo.rarity ?? 'Standard'}
            </span>
          </div>
          <p className="text-sm font-bold text-text-primary mt-1 truncate">
            {currentPlayerInfo.name ?? 'Unknown Player'}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-text-muted">{currentPlayerInfo.position ?? 'N/A'}</span>
            <span className="text-xs text-amber-400 font-mono font-bold">
              {currentPlayerInfo.rating ?? 0}
            </span>
          </div>
        </div>
      )}

      {/* ===== Status Section ===== */}
      <div className="space-y-2">
        <div className="text-xs text-text-secondary p-2 sm:p-3 rounded-btn bg-dark-bg-alt text-center border border-dark-card">
          <span className="uppercase tracking-wider">Status: </span>
          <span className={`font-bold uppercase ${
            auctionStatus === 'active' ? 'text-green-400' :
            auctionStatus === 'completed' ? 'text-blue-400' :
            auctionStatus === 'bid_placed' ? 'text-amber-400' :
            'text-accent-terracotta'
          }`}>
            {auctionStatus}
          </span>
        </div>
        
        {nextPosition && (
          <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted">
            <TrendingUp size={12} />
            <span>Next: <span className="text-text-secondary font-bold">{nextPosition}</span></span>
          </div>
        )}
      </div>
    </Card>
  )
}

export default AuctionProgress
