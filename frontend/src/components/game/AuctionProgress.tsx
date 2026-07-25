/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Auction Progress Component
 * Developer: Saud Yahya Al-Faifi (Phone: 0535103986)
 * ============================================================================
 */

'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import AuctionState from '@/types/game'
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

// ==================== Types ====================

interface AuctionProgressProps {
  state: AuctionState
  timerRemaining?: number
  timerDuration?: number
  onTimerExpired?: () => void
}

type TimerSeverity = 'normal' | 'warning' | 'critical' | 'expired'

// ==================== Constants ====================

const TIMER_THRESHOLDS = {
  WARNING: 15,    // ثواني - بدء التحذير
  CRITICAL: 5,    // ثواني - حالة حرجة
  EXPIRED: 0,     // انتهى الوقت
}

const TIMER_COLORS: Record<TimerSeverity, {
  ring: string
  text: string
  bg: string
  pulse: boolean
}> = {
  normal: {
    ring: '#3b82f6',    // أزرق
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    pulse: false
  },
  warning: {
    ring: '#f59e0b',    // برتقالي
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    pulse: true
  },
  critical: {
    ring: '#ef4444',    // أحمر
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    pulse: true
  },
  expired: {
    ring: '#6b7280',    // رمادي
    text: 'text-slate-500',
    bg: 'bg-slate-500/10',
    pulse: false
  }
}

// ==================== Sub-Components ====================

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
  const progress = isActive ? (remaining / duration) * circumference : circumference
  const colors = TIMER_COLORS[severity]
  
  const pulseClass = colors.pulse && isActive ? 'animate-pulse' : ''
  const displaySeconds = Math.ceil(remaining)
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
  const percentage = isActive ? (remaining / duration) * 100 : 0
  const colors = TIMER_COLORS[severity]
  
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
          {Math.ceil(remaining)}s
        </span>
      </div>
      
      <div className="w-full bg-dark-bg-alt rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${percentage}%`,
            backgroundColor: colors.ring,
            boxShadow: severity === 'critical' ? `0 0 10px ${colors.ring}` : undefined
          }}
        />
      </div>
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
  
  const alerts: Record<TimerSeverity, { icon: React.ReactNode; message: string; className: string }> = {
    normal: { icon: null, message: '', className: '' },
    warning: {
      icon: <Bell size={14} />,
      message: isPlayerTurn ? `${remaining}s remaining - Make your move!` : 'Opponent is thinking...',
      className: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    },
    critical: {
      icon: <BellRing size={14} className="animate-pulse" />,
      message: isPlayerTurn ? `HURRY! Only ${remaining}s left!` : 'Opponent running out of time!',
      className: 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
    },
    expired: {
      icon: <AlertOctagon size={14} />,
      message: 'Time expired! Turn passed automatically.',
      className: 'bg-red-500/20 border-red-500/30 text-red-300'
    }
  }
  
  const alert = alerts[severity]
  if (!alert.message) return null
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold ${alert.className} transition-all duration-300`}>
      {alert.icon}
      <span>{alert.message}</span>
    </div>
  )
}

// ==================== Main Component ====================

const AuctionProgress: React.FC<AuctionProgressProps> = ({ 
  state, 
  timerRemaining: externalTimer,
  timerDuration: externalDuration = 30,
  onTimerExpired 
}) => {
  const [internalTimer, setInternalTimer] = useState<number>(externalDuration)
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false)
  const [timerSeverity, setTimerSeverity] = useState<TimerSeverity>('normal')
  const [showTimerAlert, setShowTimerAlert] = useState<boolean>(true)
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousTurnRef = useRef<string | null>(null)
  
  const progress = useMemo(() => 
    ((state?.auction_index || 0) / (state?.total_positions || 9)) * 100,
    [state?.auction_index, state?.total_positions]
  )
  
  const player1Cards = useMemo(() => {
    const p1 = state?.player1_team || (state as any)?.team1 || {};
    return Array.isArray(p1) ? p1.length : Object.values(p1).flat().length;
  }, [state?.player1_team, (state as any)?.team1])
  
  const player2Cards = useMemo(() => {
    const p2 = state?.player2_team || (state as any)?.team2 || {};
    return Array.isArray(p2) ? p2.length : Object.values(p2).flat().length;
  }, [state?.player2_team, (state as any)?.team2])
  
  const currentTimer = externalTimer ?? internalTimer
  const timerDuration = externalDuration
  
  const isAuctionActive = useMemo(() => 
    state?.status === 'active' || state?.status === 'bid_placed' || state?.status === 'turn_passed' || state?.status === 'bidding',
    [state?.status]
  )
  
  const calculateSeverity = useCallback((remaining: number): TimerSeverity => {
    if (remaining <= TIMER_THRESHOLDS.EXPIRED) return 'expired'
    if (remaining <= TIMER_THRESHOLDS.CRITICAL) return 'critical'
    if (remaining <= TIMER_THRESHOLDS.WARNING) return 'warning'
    return 'normal'
  }, [])
  
  const startInternalTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    setInternalTimer(timerDuration)
    setIsTimerActive(true)
    setShowTimerAlert(true)
    
    timerIntervalRef.current = setInterval(() => {
      setInternalTimer(prev => {
        const next = prev - 0.1
        if (next <= 0) {
          setIsTimerActive(false)
          setTimerSeverity('expired')
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
          onTimerExpired?.()
          return 0
        }
        setTimerSeverity(calculateSeverity(next))
        return Math.max(0, next)
      })
    }, 100)
  }, [timerDuration, calculateSeverity, onTimerExpired])
  
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setIsTimerActive(false)
  }, [])
  
  useEffect(() => {
    const currentTurn = state?.current_turn_player
    if (currentTurn !== previousTurnRef.current) {
      previousTurnRef.current = currentTurn || null
      if (currentTurn && isAuctionActive) {
        if (externalTimer === undefined) startInternalTimer()
        setShowTimerAlert(true)
      } else {
        stopTimer()
      }
    }
    if (!isAuctionActive) stopTimer()
    return () => stopTimer()
  }, [state?.current_turn_player, state?.status, isAuctionActive, externalTimer, startInternalTimer, stopTimer])
  
  useEffect(() => {
    if (externalTimer !== undefined) {
      setTimerSeverity(calculateSeverity(externalTimer))
      setIsTimerActive(externalTimer > 0 && isAuctionActive)
    }
  }, [externalTimer, calculateSeverity, isAuctionActive])

  const getTurnIndicatorClass = (playerKey: string) => {
    const isCurrentTurn = state?.current_turn_player === playerKey
    if (isCurrentTurn && timerSeverity === 'critical') return 'bg-red-500/20 border-2 border-red-500/50 shadow-lg shadow-red-500/20 animate-pulse'
    if (isCurrentTurn && timerSeverity === 'warning') return 'bg-amber-500/15 border-2 border-amber-500/50 shadow-md'
    if (isCurrentTurn) return 'bg-accent-terracotta/15 border-2 border-accent-terracotta/50 shadow-md'
    return 'bg-dark-bg-alt border border-dark-card'
  }
  
  const getTurnTextColor = (playerKey: string) => {
    const isCurrentTurn = state?.current_turn_player === playerKey
    if (isCurrentTurn && timerSeverity === 'critical') return 'text-red-400'
    if (isCurrentTurn && timerSeverity === 'warning') return 'text-amber-400'
    if (isCurrentTurn) return 'text-accent-terracotta'
    return 'text-text-secondary'
  }
  
  return (
    <Card className="p-4 sm:p-6 space-y-5">
      {isAuctionActive && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <CircularTimer
                remaining={currentTimer}
                duration={timerDuration}
                isActive={isTimerActive}
                severity={timerSeverity}
                currentPlayer={state?.current_turn_player || ''}
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isTimerActive ? (timerSeverity === 'critical' ? 'bg-red-400 animate-pulse' : 'bg-green-400 animate-pulse') : 'bg-slate-600'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isTimerActive ? getTurnTextColor(state?.current_turn_player || '') : 'text-slate-500'}`}>
                    {state?.current_turn_player === 'player1' ? 'Your Turn' : "Opponent's Turn"}
                  </span>
                </div>
                <div className="sm:hidden">
                  <Timer size={16} className={`${TIMER_COLORS[timerSeverity].text} ${timerSeverity === 'critical' ? 'animate-pulse' : ''}`} />
                </div>
              </div>
              <TimerBar remaining={currentTimer} duration={timerDuration} severity={timerSeverity} isActive={isTimerActive} />
            </div>
          </div>
          <TimerAlert severity={timerSeverity} remaining={Math.ceil(currentTimer)} currentPlayer={state?.current_turn_player || ''} isVisible={showTimerAlert && (timerSeverity !== 'normal' || currentTimer <= 10)} />
        </div>
      )}
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Auction Progress</p>
          <p className="text-xs font-bold text-accent-terracotta font-mono">{(state?.auction_index || 0) + 1}/{state?.total_positions || 9}</p>
        </div>
        <div className="w-full bg-dark-bg-alt rounded-full h-3 overflow-hidden relative">
          <div className="bg-gradient-to-r from-accent-terracotta via-accent-terracotta to-accent-gold h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Sequence</p>
        <div className="grid grid-cols-9 gap-1">
          {state?.auction_sequence?.map((pos: string, idx: number) => {
            const isCurrent = idx === state.auction_index
            const isCompleted = idx < state.auction_index
            return (
              <div key={idx} className={`p-2 rounded-btn text-center text-xs font-bold transition-all duration-300 relative ${isCurrent ? 'bg-accent-terracotta text-white shadow-lg ring-2 ring-accent-terracotta/50 z-10' : isCompleted ? 'bg-status-success/20 text-status-success border border-status-success/30' : 'bg-dark-bg-alt text-text-secondary border border-dark-card'}`}>
                <span>{pos}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-btn transition-all duration-300 ${getTurnIndicatorClass('player1')}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${getTurnTextColor('player1')}`}>You</p>
          <p className="text-lg sm:text-xl font-bold text-text-primary">{player1Cards} <span className="text-xs text-text-muted">Cards</span></p>
          <div className="mt-2 pt-2 border-t border-dark-card/50 flex justify-between text-[10px] text-text-muted">
            <span>Budget</span>
            <span className="text-amber-400 font-mono font-bold">{state?.player1_budget?.toFixed(1) || '100.0'}M</span>
          </div>
        </div>

        <div className={`p-3 rounded-btn transition-all duration-300 ${getTurnIndicatorClass('player2')}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${getTurnTextColor('player2')}`}>Opponent</p>
          <p className="text-lg sm:text-xl font-bold text-text-primary">{player2Cards} <span className="text-xs text-text-muted">Cards</span></p>
          <div className="mt-2 pt-2 border-t border-dark-card/50 flex justify-between text-[10px] text-text-muted">
            <span>Budget</span>
            <span className="text-amber-400 font-mono font-bold">{state?.player2_budget?.toFixed(1) || '100.0'}M</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default AuctionProgress
