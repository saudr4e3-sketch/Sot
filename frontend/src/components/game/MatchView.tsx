"use client"

import React from 'react'

interface TimelineEvent {
  minute: number
  type: string
  actor: string
  description?: string
  x?: number
  y?: number
}

export default function MatchView({
  teamLeft = { name: 'Team A', score: 0 },
  teamRight = { name: 'Team B', score: 0 },
  minute = 0,
  timeline = [] as TimelineEvent[],
}: {
  teamLeft?: any
  teamRight?: any
  minute?: number
  timeline?: TimelineEvent[]
}) {
  return (
    <div className="match-view w-full max-w-4xl mx-auto text-white">
      {/* Scoreboard */}
      <div className="scoreboard flex items-center justify-between bg-gradient-to-r from-slate-800/60 to-slate-900/60 rounded-2xl p-4 mb-4 border border-slate-700">
        <div className="team-left flex items-center gap-3">
          <div className="badge w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-300">{teamLeft.name}</div>
          <div>
            <div className="text-sm text-slate-300">{teamLeft.name}</div>
            <div className="text-2xl font-extrabold text-amber-400">{teamLeft.score}</div>
          </div>
        </div>

        <div className="center text-center">
          <div className="minute-indicator mx-auto w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl text-white font-bold">{minute}'</div>
          <div className="text-xs text-slate-400 mt-2">الشوط الحالي</div>
        </div>

        <div className="team-right flex items-center gap-3">
          <div>
            <div className="text-sm text-slate-300 text-right">{teamRight.name}</div>
            <div className="text-2xl font-extrabold text-emerald-400">{teamRight.score}</div>
          </div>
          <div className="badge w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-300">{teamRight.name}</div>
        </div>
      </div>

      {/* Field */}
      <div className="field relative bg-gradient-to-b from-green-500/40 to-green-700/20 rounded-xl p-6 overflow-hidden border border-green-900 mb-4" style={{ height: 320 }}>
        {/* center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-blue-400 opacity-20 transform -translate-x-1/2"></div>
        {/* pitch markings (simplified) */}
        <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
          <rect x="5" y="5" width="90" height="50" fill="none" stroke="#0ea5a3" strokeOpacity="0.06" strokeWidth="0.5" rx="3" />
          <line x1="50" y1="5" x2="50" y2="55" stroke="#0ea5a3" strokeOpacity="0.06" />
        </svg>

        {/* Timeline dots on field */}
        {timeline?.map((e, i) => {
          const left = (typeof e.x === 'number' ? e.x : 50) + '%'
          const top = (typeof e.y === 'number' ? e.y : 50) + '%'
          const color = e.type === 'goal' ? 'bg-amber-400' : e.type === 'shot' ? 'bg-white' : 'bg-sky-300'
          return (
            <div key={i} className={`absolute w-4 h-4 rounded-full ${color} shadow`} style={{ left, top }} title={`${e.minute}' - ${e.actor}: ${e.type}`}></div>
          )
        })}

      </div>

      {/* Timeline list */}
      <div className="timeline bg-slate-900/40 rounded-xl p-3 border border-slate-800 max-h-56 overflow-y-auto">
        {timeline?.length ? (
          timeline.map((e, i) => (
            <div key={i} className="py-2 border-b border-slate-800 last:border-b-0 flex items-start gap-3">
              <div className="w-10 text-center text-sm font-bold text-slate-300">{e.minute}'</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{e.actor} <span className="text-xs text-slate-400">— {e.type}</span></div>
                <div className="text-xs text-slate-400">{e.description}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-slate-400 text-center py-6">لا توجد أحداث بعد</div>
        )}
      </div>
    </div>
  )
}
