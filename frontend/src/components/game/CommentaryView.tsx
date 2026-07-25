/**
 * ============================================================================
 * OSM FUT Dual Battle - Enterprise Live Commentary Component
 * Version: 4.0.0 - Smart Event Highlighting, Auto-Scroll, Fully Decoupled Types
 * ============================================================================
 */

'use client'

import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import Card from '@/components/ui/Card'
import { 
  Tv2, 
  Goal, 
  Flag, 
  ShieldAlert, 
  Siren, 
  Zap, 
  Clock, 
  Star,
  UserCheck,
  UserX,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  Trophy
} from 'lucide-react'

// ==================== LOCAL TYPES (Decoupled from Global Types) ====================

type CommentaryType = 
  | 'kickoff' 
  | 'action' 
  | 'goal' 
  | 'save' 
  | 'foul' 
  | 'card' 
  | 'halftime' 
  | 'fulltime' 
  | 'tactical_shift' 
  | 'highlight'
  | string

type CommentaryTone = 'excited' | 'tense' | 'analytical' | 'dramatic' | 'neutral' | 'euphoric'

interface CommentaryEvent {
  minute: number
  type: CommentaryType
  text: string
  author?: string
  is_goal?: boolean
  is_key_moment?: boolean
  tone?: CommentaryTone
  team_side?: 'home' | 'away' | 'player1' | 'player2'
  impact_score?: number
  event_category?: 'goal' | 'save' | 'foul' | 'card' | 'tactical_shift' | 'chance' | 'tackle' | 'highlight' | string
}

interface CommentaryViewProps {
  commentary: CommentaryEvent[] | null | undefined
  isLive?: boolean
  maxHeight?: string
}

// ==================== EVENT DETECTION & HIGHLIGHTING ENGINE ====================

interface EventStyleConfig {
  icon: React.ReactNode
  badge: string
  badgeBg: string
  textColor: string
  borderColor: string
  bgEffect: string
  animate: boolean
}

const DEFAULT_EVENT_STYLE: EventStyleConfig = {
  icon: <MessageSquare size={12} />,
  badge: '',
  badgeBg: 'bg-dark-card/60',
  textColor: 'text-text-secondary',
  borderColor: 'border-dark-card',
  bgEffect: '',
  animate: false
}

function detectEventStyle(event: CommentaryEvent): EventStyleConfig {
  const text = (event.text ?? '').toLowerCase()
  const type = event.type ?? ''
  const category = event.event_category ?? ''

  // كشف الأهداف
  if (
    type === 'goal' || 
    event.is_goal === true ||
    category === 'goal' ||
    text.includes('goal') || 
    text.includes('هدف') || 
    text.includes('سجل') || 
    text.includes('يسجل') ||
    text.includes('goooal') ||
    text.includes('!⚽')
  ) {
    return {
      icon: <Goal size={14} className="text-emerald-300" />,
      badge: 'GOAL!',
      badgeBg: 'bg-emerald-500/20',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/50',
      bgEffect: 'bg-emerald-500/5',
      animate: true
    }
  }

  // كشف الكروت الحمراء
  if (
    type === 'card' && (text.includes('red') || text.includes('أحمر') || text.includes('طرد')) ||
    text.includes('red card') || 
    text.includes('بطاقة حمراء') || 
    text.includes('مطرود') ||
    text.includes('!🟥')
  ) {
    return {
      icon: <UserX size={14} className="text-red-400" />,
      badge: 'RED CARD',
      badgeBg: 'bg-red-500/20',
      textColor: 'text-red-300',
      borderColor: 'border-red-500/50',
      bgEffect: 'bg-red-500/5',
      animate: true
    }
  }

  // كشف الكروت الصفراء
  if (
    type === 'card' && (text.includes('yellow') || text.includes('أصفر') || text.includes('إنذار')) ||
    text.includes('yellow card') || 
    text.includes('بطاقة صفراء') ||
    text.includes('!🟨')
  ) {
    return {
      icon: <AlertTriangle size={14} className="text-amber-400" />,
      badge: 'YELLOW CARD',
      badgeBg: 'bg-amber-500/20',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/50',
      bgEffect: 'bg-amber-500/5',
      animate: false
    }
  }

  // كشف الفرص الضائعة والتصديات
  if (
    type === 'save' || 
    category === 'save' ||
    text.includes('save') || 
    text.includes('تصدي') || 
    text.includes('أنقذ') ||
    text.includes('miss') || 
    text.includes('ضائعة') || 
    text.includes('أضاع') ||
    text.includes('!🧤')
  ) {
    return {
      icon: <ShieldAlert size={14} className="text-sky-400" />,
      badge: 'BIG SAVE',
      badgeBg: 'bg-sky-500/20',
      textColor: 'text-sky-300',
      borderColor: 'border-sky-500/50',
      bgEffect: 'bg-sky-500/5',
      animate: true
    }
  }

  // كشف الأخطاء والركلات الحرة
  if (
    type === 'foul' || 
    category === 'foul' ||
    text.includes('foul') || 
    text.includes('خطأ') || 
    text.includes('مخالفة') ||
    text.includes('ركلة حرة') ||
    text.includes('free kick')
  ) {
    return {
      icon: <Siren size={14} className="text-orange-400" />,
      badge: 'FOUL',
      badgeBg: 'bg-orange-500/20',
      textColor: 'text-orange-300',
      borderColor: 'border-orange-500/50',
      bgEffect: 'bg-orange-500/5',
      animate: false
    }
  }

  // كشف البداية والنهاية
  if (
    type === 'kickoff' || 
    type === 'halftime' || 
    type === 'fulltime' ||
    text.includes('صافرة البداية') ||
    text.includes('نهاية الشوط') ||
    text.includes('نهاية المباراة') ||
    text.includes('kick-off') ||
    text.includes('half-time') ||
    text.includes('full-time')
  ) {
    return {
      icon: <Clock size={14} className="text-purple-400" />,
      badge: 'WHISTLE',
      badgeBg: 'bg-purple-500/20',
      textColor: 'text-purple-300',
      borderColor: 'border-purple-500/50',
      bgEffect: 'bg-purple-500/5',
      animate: false
    }
  }

  // كشف اللحظات المفتاحية
  if (
    event.is_key_moment === true ||
    category === 'highlight' ||
    type === 'highlight' ||
    text.includes('!⭐')
  ) {
    return {
      icon: <Star size={14} className="text-amber-300" />,
      badge: 'KEY MOMENT',
      badgeBg: 'bg-amber-500/20',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/50',
      bgEffect: 'bg-amber-500/5',
      animate: true
    }
  }

  // كشف التغييرات التكتيكية
  if (
    type === 'tactical_shift' || 
    category === 'tactical_shift' ||
    text.includes('تغيير') ||
    text.includes('تبديل') ||
    text.includes('substitution') ||
    text.includes('!🔄')
  ) {
    return {
      icon: <UserCheck size={14} className="text-indigo-400" />,
      badge: 'SUB',
      badgeBg: 'bg-indigo-500/20',
      textColor: 'text-indigo-300',
      borderColor: 'border-indigo-500/50',
      bgEffect: 'bg-indigo-500/5',
      animate: false
    }
  }

  return DEFAULT_EVENT_STYLE
}

// ==================== MAIN COMPONENT ====================

const CommentaryView: React.FC<CommentaryViewProps> = ({ 
  commentary, 
  isLive = false,
  maxHeight = 'max-h-96'
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const previousCommentaryLengthRef = useRef<number>(0)

  // ===== Safe Commentary Array (Defensive Programming) =====
  const safeCommentary: CommentaryEvent[] = useMemo(() => {
    if (!commentary || !Array.isArray(commentary)) return []
    return commentary
  }, [commentary])

  const isEmpty: boolean = safeCommentary.length === 0
  const currentLength: number = safeCommentary.length

  // ===== Automatic Smooth Scrolling =====
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end' 
      })
    }
  }, [])

  useEffect(() => {
    if (currentLength > previousCommentaryLengthRef.current) {
      scrollToBottom(true)
    }
    previousCommentaryLengthRef.current = currentLength
  }, [currentLength, scrollToBottom])

  useEffect(() => {
    if (currentLength > 0 && previousCommentaryLengthRef.current === 0) {
      scrollToBottom(false)
      previousCommentaryLengthRef.current = currentLength
    }
  }, [currentLength, scrollToBottom])

  return (
    <Card className={`p-4 sm:p-6 space-y-3 flex flex-col ${maxHeight}`}>
      {/* ===== Header ===== */}
      <div className="flex items-center gap-2 border-b border-dark-card/60 pb-3">
        <div className="relative">
          <Tv2 className="text-accent-terracotta flex-shrink-0" size={20} />
          {isLive && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-status-error rounded-full animate-ping" />
          )}
        </div>
        <h3 className="font-black text-text-primary text-sm sm:text-base tracking-tight">
          Live Commentary
        </h3>
        {isLive && (
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2 h-2 bg-status-error rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-status-error uppercase tracking-widest">Live</span>
          </div>
        )}
        {!isLive && !isEmpty && (
          <span className="ml-auto text-[10px] font-bold text-text-muted uppercase bg-dark-card px-2 py-0.5 rounded-full">
            Completed
          </span>
        )}
      </div>

      {/* ===== Commentary List ===== */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar"
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-dark-card flex items-center justify-center">
              <Tv2 size={24} className="text-text-muted" />
            </div>
            <p className="text-text-secondary text-xs sm:text-sm">
              {isLive ? '⏳ Waiting for match events...' : 'No match data available yet.'}
            </p>
            <p className="text-[10px] text-text-muted">
              Commentary will appear here once the match starts
            </p>
          </div>
        ) : (
          safeCommentary.map((event, idx) => {
            const style: EventStyleConfig = detectEventStyle(event)
            const isLatest: boolean = idx === safeCommentary.length - 1
            
            return (
              <div
                key={idx}
                className={`
                  relative text-xs sm:text-sm border-l-2 pl-3 py-2 sm:py-2.5 pr-2
                  transition-all duration-300 rounded-r-lg
                  ${style.borderColor}
                  ${style.bgEffect}
                  ${style.animate && isLatest ? 'animate-slide-in' : ''}
                  hover:bg-dark-card/40
                `}
              >
                {/* Minute & Badge Row */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] sm:text-xs font-black font-mono text-accent-terracotta bg-dark-card px-1.5 py-0.5 rounded">
                    {event.minute ?? '?'}&apos;
                  </span>
                  
                  {style.badge && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${style.badgeBg} ${style.textColor} tracking-wider`}>
                      {style.badge}
                    </span>
                  )}
                  
                  {event.tone && event.tone !== 'neutral' && (
                    <span className="text-[9px] font-bold text-text-muted uppercase ml-auto">
                      {event.tone}
                    </span>
                  )}
                </div>

                {/* Event Text */}
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">
                    {style.icon}
                  </span>
                  <p className={`font-semibold leading-relaxed ${style.textColor}`}>
                    {event.text ?? '...'}
                  </p>
                </div>

                {/* Author (if available) */}
                {event.author && (
                  <p className="text-[10px] text-text-muted mt-1 pl-5 italic">
                    — {event.author}
                  </p>
                )}

                {/* Impact Score Indicator */}
                {event.impact_score !== undefined && event.impact_score > 0 && (
                  <div className="absolute top-1 right-2">
                    <div className="flex items-center gap-0.5">
                      <Zap size={10} className="text-amber-400" />
                      <span className="text-[9px] font-mono text-amber-400">
                        {event.impact_score}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        
        {/* Invisible div for auto-scroll anchoring */}
        <div ref={bottomRef} className="h-0 w-full" />
      </div>

      {/* ===== Footer: Scroll to Bottom Button ===== */}
      {!isEmpty && currentLength > 3 && (
        <div className="flex justify-center pt-1">
          <button
            onClick={() => scrollToBottom(true)}
            className="text-[10px] font-bold text-text-muted hover:text-accent-terracotta flex items-center gap-1 bg-dark-card px-3 py-1 rounded-full transition-colors"
            title="Scroll to latest"
          >
            <ChevronDown size={12} />
            Latest Events
          </button>
        </div>
      )}
    </Card>
  )
}

export default CommentaryView
