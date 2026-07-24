import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import { AlertCircle, Star, Shield, Zap, Award, Flame, TrendingUp, Activity, BarChart2 } from 'lucide-react'

interface PlayerCardProps {
  name: string
  position: string
  rating: number
  team?: string
  image_url?: string
  rarity?: 'Legendary' | 'Medium' | 'Weak'
  is_mystery?: boolean
  nationality?: string
  potential?: number
  market_value?: string
  style?: string
  experience_years?: number
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
}

const rarityColors = {
  'Legendary': 'border-amber-400 bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-dark-bg-alt shadow-amber-500/20 shadow-2xl',
  'Medium': 'border-sky-400 bg-gradient-to-b from-sky-500/20 via-blue-500/10 to-dark-bg-alt shadow-sky-500/20 shadow-2xl',
  'Weak': 'border-slate-400 bg-gradient-to-b from-slate-500/20 via-zinc-500/10 to-dark-bg-alt shadow-slate-500/10 shadow-xl',
}

const rarityBadgeColors = {
  'Legendary': 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border border-amber-300 font-black shadow-lg',
  'Medium': 'bg-gradient-to-r from-sky-500 to-blue-500 text-white border border-sky-300 font-bold shadow-md',
  'Weak': 'bg-gradient-to-r from-slate-600 to-zinc-600 text-slate-200 border border-slate-400 font-semibold',
}

const rarityEmoji = {
  'Legendary': '⭐⭐⭐⭐⭐ (Ultimate Icon & Legend)',
  'Medium': '⭐⭐⭐⭐ (Advanced Pro Star)',
  'Weak': '⭐⭐⭐ (Developing Challenger)',
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  position,
  rating,
  team,
  image_url,
  rarity = 'Legendary',
  is_mystery,
  nationality,
  potential,
  market_value,
  style,
  experience_years,
  pace = 85,
  shooting = 82,
  passing = 84,
  dribbling = 86,
  defending = 80,
  physical = 83,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const fallbackImage = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80`
  const cardImage = image_url || fallbackImage

  return (
    <div className={`rounded-3xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-[1.02] ${rarityColors[rarity]}`}>
      {/* Top Banner & FUT Card Header */}
      <div className="relative h-64 bg-gradient-to-tr from-dark-bg via-dark-bg-alt to-dark-card overflow-hidden flex items-center justify-center border-b border-dark-card/60">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <img
          src={cardImage}
          alt={name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-90' : 'opacity-40'}`}
          onError={(e) => {
            e.currentTarget.src = fallbackImage
          }}
        />

        {/* FUT Rating & Position Badge Box */}
        <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-400/50 text-center shadow-xl">
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tighter leading-none">{rating}</div>
          <div className="text-xs font-extrabold text-slate-100 tracking-wider mt-1">{position}</div>
          {nationality && (
            <div className="text-[10px] text-amber-200/90 font-medium mt-0.5 tracking-wide">{nationality}</div>
          )}
        </div>

        {/* Rarity Badge Header */}
        <div className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider ${rarityBadgeColors[rarity]}`}>
          {rarity}
        </div>

        {/* Mystery Card Indicator Banner */}
        {is_mystery && (
          <div className="absolute inset-x-0 bottom-0 bg-accent-terracotta/95 backdrop-blur-md py-2 px-4 flex items-center justify-center gap-2 text-white text-xs font-bold animate-pulse shadow-lg">
            <AlertCircle size={16} />
            <span>Mystery Bonus Card Activated & Secured!</span>
          </div>
        )}
      </div>

      {/* Detailed Card Body Section */}
      <div className="p-5 space-y-4 bg-dark-bg-alt/95 backdrop-blur-lg">
        <div className="border-b border-dark-card pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-accent-terracotta uppercase tracking-widest flex items-center gap-1.5">
              <Award size={14} /> Official Tactical Profile
            </span>
            {potential && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
                POTENTIAL: {potential}
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-black text-text-primary truncate mt-1.5">{name}</h3>
        </div>

        {/* Extended Stats Attributes Grid (FUT Style) */}
        <div className="grid grid-cols-3 gap-2 py-1 bg-dark-bg/60 p-3 rounded-xl border border-dark-card">
          <div className="flex justify-between items-center px-2 py-1 border-r border-dark-card/50">
            <span className="text-[11px] text-text-secondary font-semibold">PAC</span>
            <span className="text-xs font-black text-text-primary font-mono">{pace}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1 border-r border-dark-card/50">
            <span className="text-[11px] text-text-secondary font-semibold">SHO</span>
            <span className="text-xs font-black text-text-primary font-mono">{shooting}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1">
            <span className="text-[11px] text-text-secondary font-semibold">PAS</span>
            <span className="text-xs font-black text-text-primary font-mono">{passing}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1 border-r border-dark-card/50">
            <span className="text-[11px] text-text-secondary font-semibold">DRI</span>
            <span className="text-xs font-black text-text-primary font-mono">{dribbling}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1 border-r border-dark-card/50">
            <span className="text-[11px] text-text-secondary font-semibold">DEF</span>
            <span className="text-xs font-black text-text-primary font-mono">{defending}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1">
            <span className="text-[11px] text-text-secondary font-semibold">PHY</span>
            <span className="text-xs font-black text-text-primary font-mono">{physical}</span>
          </div>
        </div>

        {/* Additional Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-dark-bg p-2.5 rounded-xl border border-dark-card flex flex-col justify-center">
            <span className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Associated Club</span>
            <span className="text-text-primary font-extrabold truncate mt-0.5">{team || "Elite Free Agent"}</span>
          </div>

          <div className="bg-dark-bg p-2.5 rounded-xl border border-dark-card flex flex-col justify-center">
            <span className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Market Valuation</span>
            <span className="text-amber-400 font-extrabold truncate mt-0.5 font-mono">{market_value || "65M €"}</span>
          </div>

          {style && (
            <div className="bg-dark-bg p-2.5 rounded-xl border border-dark-card flex flex-col justify-center">
              <span className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Playing System</span>
              <span className="text-sky-400 font-extrabold truncate mt-0.5">{style}</span>
            </div>
          )}

          {experience_years !== undefined && (
            <div className="bg-dark-bg p-2.5 rounded-xl border border-dark-card flex flex-col justify-center">
              <span className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Career Experience</span>
              <span className="text-indigo-400 font-extrabold truncate mt-0.5 font-mono">{experience_years} Years Active</span>
            </div>
          )}
        </div>

        {/* Comprehensive Rating Footer Bar */}
        <div className="flex justify-between items-center pt-3 border-t border-dark-card">
          <div className="text-[11px] font-bold text-amber-300 tracking-tight flex items-center gap-1">
            <Star size={13} className="fill-amber-300 text-amber-300" /> {rarityEmoji[rarity]}
          </div>
          <div className="bg-gradient-to-r from-accent-terracotta/30 to-amber-500/20 px-3.5 py-1.5 rounded-xl border border-accent-terracotta/40 shadow-inner">
            <span className="text-xs font-black text-accent-terracotta font-mono">OVR {rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerCard
