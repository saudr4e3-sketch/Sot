import React from 'react'
import Card from '@/components/ui/Card'
import { AlertCircle, Star } from 'lucide-react'

interface PlayerCardProps {
  name: string
  position: string
  rating: number
  team?: string
  image_url?: string
  rarity?: 'Legendary' | 'Medium' | 'Weak'
  is_mystery?: boolean
}

const rarityColors = {
  'Legendary': 'border-yellow-500 bg-yellow-500/10',
  'Medium': 'border-blue-500 bg-blue-500/10',
  'Weak': 'border-gray-500 bg-gray-500/10',
}

const rarityBadgeColors = {
  'Legendary': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50',
  'Medium': 'bg-blue-500/20 text-blue-300 border border-blue-500/50',
  'Weak': 'bg-gray-500/20 text-gray-300 border border-gray-500/50',
}

const rarityEmoji = {
  'Legendary': '⭐⭐⭐⭐⭐',
  'Medium': '⭐⭐⭐⭐',
  'Weak': '⭐⭐⭐',
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  position,
  rating,
  team,
  image_url,
  rarity = 'Legendary',
  is_mystery,
}) => {
  // توليد صورة افتراضية احترافية لبطاقة FUT في حال لم تتوافر صورة خاصة للاعب
  const fallbackImage = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80`
  const cardImage = image_url || fallbackImage

  return (
    <div className={`rounded-card overflow-hidden border-2 transition-all duration-200 ${rarityColors[rarity]}`}>
      {/* Image Section */}
      <div className="relative h-48 bg-dark-bg-alt overflow-hidden flex items-center justify-center">
        <img
          src={cardImage}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = fallbackImage
          }}
        />
        
        {/* Rating & Position Overlay badge */}
        <div className="absolute bottom-2 left-2 bg-dark-bg/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-accent-gold/40 text-center">
          <p className="text-xs font-bold text-accent-gold font-mono">{rating}</p>
          <p className="text-[10px] font-extrabold text-text-primary">{position}</p>
        </div>

        {/* Rarity Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-btn text-xs font-bold ${rarityBadgeColors[rarity]}`}>
          {rarity}
        </div>
        
        {/* Mystery Badge */}
        {is_mystery && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-btn bg-accent-terracotta/90 text-white text-xs font-bold animate-pulse-terracotta">
            <AlertCircle size={14} />
            Mystery
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{position}</p>
          <h3 className="text-sm font-bold text-text-primary truncate">{name}</h3>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs text-text-secondary truncate flex-1">{team || "Elite Club"}</p>
          <div className="bg-accent-terracotta/20 px-2 py-1 rounded-btn flex-shrink-0 ml-2">
            <p className="text-xs font-bold text-accent-terracotta">{rating.toFixed(1)}</p>
          </div>
        </div>

        <div className="text-xs text-yellow-300">
          {rarityEmoji[rarity]}
        </div>
      </div>
    </div>
  )
}

export default PlayerCard
