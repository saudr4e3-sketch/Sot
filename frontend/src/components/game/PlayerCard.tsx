import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import { AlertCircle, Star, Shield, Zap, Award, Flame, TrendingUp } from 'lucide-react'

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
}

const rarityColors = {
  'Legendary': 'border-amber-400 bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-dark-bg-alt shadow-amber-500/20 shadow-xl',
  'Medium': 'border-sky-400 bg-gradient-to-b from-sky-500/20 via-blue-500/10 to-dark-bg-alt shadow-sky-500/20 shadow-xl',
  'Weak': 'border-slate-400 bg-gradient-to-b from-slate-500/20 via-zinc-500/10 to-dark-bg-alt shadow-slate-500/10 shadow-lg',
}

const rarityBadgeColors = {
  'Legendary': 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border border-amber-300 font-black',
  'Medium': 'bg-gradient-to-r from-sky-500 to-blue-500 text-white border border-sky-300 font-bold',
  'Weak': 'bg-gradient-to-r from-slate-600 to-zinc-600 text-slate-200 border border-slate-400 font-semibold',
}

const rarityEmoji = {
  'Legendary': '⭐⭐⭐⭐⭐ (Elite Icon)',
  'Medium': '⭐⭐⭐⭐ (Pro Star)',
  'Weak': '⭐⭐⭐ (Rising Talent)',
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
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const fallbackImage = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80`
  const cardImage = image_url || fallbackImage

  return (
    <div className={`rounded-2xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-[1.02] ${rarityColors[rarity]}`}>
      {/* Top Banner & Rarity */}
      <div className="relative h-56 bg-gradient-to-tr from-dark-bg via-dark-bg-alt to-dark-card overflow-hidden flex items-center justify-center border-b border-dark-card/50">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <img
          src={cardImage}
          alt={name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-90' : 'opacity-40'}`}
          onError={(e) => {
            e.currentTarget.src = fallbackImage
          }}
        />

        {/* FUT Style Rating & Position Box */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/40 text-center shadow-lg">
          <div className="text-xl font-black text-amber-400 font-mono tracking-tighter leading-none">{rating}</div>
          <div className="text-[11px] font-extrabold text-slate-200 tracking-wider mt-0.5">{position}</div>
          {nationality && (
            <div className="text-[9px] text-amber-200/80 font-medium mt-0.5">{nationality}</div>
          )}
        </div>

        {/* Rarity Badge Header */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-md ${rarityBadgeColors[rarity]}`}>
          {rarity}
        </div>

        {/* Mystery Card Indicator */}
        {is_mystery && (
          <div className="absolute inset-x-0 bottom-0 bg-accent-terracotta/90 backdrop-blur-sm py-1.5 px-3 flex items-center justify-center gap-2 text-white text-xs font-bold animate-pulse">
            <AlertCircle size={15} />
            <span>Mystery Bonus Card Unlocked!</span>
          </div>
        )}
      </div>

      {/* Detailed Info Container */}
      <div className="p-4 space-y-3 bg-dark-bg-alt/90 backdrop-blur">
        <div className="border-b border-dark-card pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-accent-terracotta uppercase tracking-widest">{position} Profile</span>
            {potential && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                POT: {potential}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-black text-text-primary truncate mt-1">{name}</h3>
        </div>

        {/* Extra Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-dark-bg p-2 rounded-lg border border-dark-card flex flex-col justify-center">
            <span className="text-text-secondary text-[10px] uppercase font-semibold">Club / Team</span>
            <span className="text-text-primary font-bold truncate mt-0.5">{team || "Free Agent"}</span>
          </div>

          <div className="bg-dark-bg p-2 rounded-lg border border-dark-card flex flex-col justify-center">
            <span className="text-text-secondary text-[10px] uppercase font-semibold">Market Value</span>
            <span className="text-amber-400 font-bold truncate mt-0.5 font-mono">{market_value || "N/A"}</span>
          </div>

          {style && (
            <div className="bg-dark-bg p-2 rounded-lg border border-dark-card flex flex-col justify-center">
              <span className="text-text-secondary text-[10px] uppercase font-semibold">Tactical Style</span>
              <span className="text-sky-400 font-bold truncate mt-0.5">{style}</span>
            </div>
          )}

          {experience_years !== undefined && (
            <div className="bg-dark-bg p-2 rounded-lg border border-dark-card flex flex-col justify-center">
              <span className="text-text-secondary text-[10px] uppercase font-semibold">Experience</span>
              <span className="text-indigo-400 font-bold truncate mt-0.5 font-mono">{experience_years} Years</span>
            </div>
          )}
        </div>

        {/* Rating Footer Bar */}
        <div className="flex justify-between items-center pt-2 border-t border-dark-card">
          <div className="text-[11px] font-medium text-amber-300 tracking-tighter">
            {rarityEmoji[rarity]}
          </div>
          <div className="bg-gradient-to-r from-accent-terracotta/30 to-amber-500/20 px-3 py-1 rounded-lg border border-accent-terracotta/40">
            <span className="text-xs font-black text-accent-terracotta font-mono">OVR {rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerCard
