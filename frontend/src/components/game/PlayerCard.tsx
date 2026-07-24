import React, { useState, useCallback, useMemo } from 'react'
import Card from '@/components/ui/Card'
import { AlertCircle, Star, Shield, Zap, Award, Flame, TrendingUp, Activity, BarChart2, User, ImageOff } from 'lucide-react'

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

const POSITION_FALLBACKS: Record<string, string> = {
  'GK': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80',
  'DEF': 'https://images.unsplash.com/photo-1543326727-cf6c39e8f3b8?auto=format&fit=crop&w=600&q=80',
  'MID': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=600&q=80',
  'ATT': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=600&q=80',
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80'

const imageCache = new Map<string, { loaded: boolean; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000

const normalizeImageUrl = (url: string | undefined, position?: string): { url: string; isValid: boolean } => {
  if (!url || url.trim() === '') {
    return { url: getPositionFallback(position), isValid: false }
  }

  const trimmedUrl = url.trim()

  try {
    new URL(trimmedUrl)
    
    if (trimmedUrl.includes('sofifa') || trimmedUrl.includes('eaassets')) {
      const secureUrl = trimmedUrl.replace('http://', 'https://')
      const separator = secureUrl.includes('?') ? '&' : '?'
      return { url: `${secureUrl}${separator}t=${Date.now()}`, isValid: true }
    }

    return { url: trimmedUrl, isValid: true }
  } catch {
    if (trimmedUrl.startsWith('/')) {
      return { url: trimmedUrl, isValid: true }
    }
    
    if (/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(trimmedUrl)) {
      return { url: trimmedUrl, isValid: true }
    }

    return { url: getPositionFallback(position), isValid: false }
  }
}

const getPositionFallback = (position?: string): string => {
  if (position && POSITION_FALLBACKS[position]) {
    return POSITION_FALLBACKS[position]
  }
  return DEFAULT_FALLBACK
}

const isImageCached = (url: string): boolean => {
  const cached = imageCache.get(url)
  if (!cached) return false
  return cached.loaded && (Date.now() - cached.timestamp) < CACHE_DURATION
}

const ImageSkeleton: React.FC = () => (
  <div className="absolute inset-0 animate-pulse">
    <div className="w-full h-full bg-gradient-to-br from-dark-bg/80 via-dark-bg-alt/60 to-dark-card/80">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700/60 to-slate-600/40 border-2 border-slate-500/30 flex items-center justify-center">
              <User size={40} className="text-slate-500/40" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-slate-400/20 animate-ping" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-slate-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-slate-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  </div>
)

const ImageErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="absolute inset-0 bg-gradient-to-br from-dark-bg/90 via-dark-bg-alt/80 to-dark-card/90 flex items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <ImageOff size={32} className="text-slate-500" />
      <p className="text-slate-400 text-xs font-medium">صورة غير متوفرة</p>
      <button
        onClick={onRetry}
        className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 font-semibold transition-colors"
      >
        إعادة المحاولة
      </button>
    </div>
  </div>
)

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
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error' | 'cached'>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')

  const processedImage = useMemo(() => {
    const { url, isValid } = normalizeImageUrl(image_url, position)
    
    if (isImageCached(url)) {
      setImageState('cached')
    } else {
      setImageState('loading')
    }
    
    setCurrentImageUrl(url)
    return { url, isValid }
  }, [image_url, position, retryCount])

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget
    const maxRetries = 3
    
    if (retryCount < maxRetries) {
      const backoffDelay = Math.pow(2, retryCount) * 1000
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1)
      }, backoffDelay)
      
      imageCache.set(currentImageUrl, { loaded: false, timestamp: Date.now() })
    } else {
      const fallbackUrl = getPositionFallback(position)
      target.src = fallbackUrl
      setCurrentImageUrl(fallbackUrl)
      setImageState('error')
      
      imageCache.set(fallbackUrl, { loaded: true, timestamp: Date.now() })
    }
  }, [retryCount, currentImageUrl, position])

  const handleImageLoad = useCallback(() => {
    setImageState('loaded')
    imageCache.set(currentImageUrl, { loaded: true, timestamp: Date.now() })
  }, [currentImageUrl])

  const handleManualRetry = useCallback(() => {
    setRetryCount(0)
    setImageState('loading')
    const { url } = normalizeImageUrl(image_url, position)
    setCurrentImageUrl(url)
    imageCache.delete(url)
  }, [image_url, position])

  const displayImageUrl = useMemo(() => {
    if (imageState === 'cached') return currentImageUrl
    
    if (retryCount > 0 && currentImageUrl) {
      const separator = currentImageUrl.includes('?') ? '&' : '?'
      return `${currentImageUrl}${separator}_retry=${retryCount}&_t=${Date.now()}`
    }
    
    return currentImageUrl
  }, [currentImageUrl, imageState, retryCount])

  return (
    <div className={`rounded-3xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-[1.02] ${rarityColors[rarity]}`}>
      <div className="relative h-64 bg-gradient-to-tr from-dark-bg via-dark-bg-alt to-dark-card overflow-hidden flex items-center justify-center border-b border-dark-card/60">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {imageState === 'loading' && !isImageCached(currentImageUrl) && (
          <ImageSkeleton />
        )}
        
        {imageState === 'error' && retryCount >= 3 && (
          <ImageErrorState onRetry={handleManualRetry} />
        )}
        
        <img
          src={displayImageUrl}
          alt={name}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
            imageState === 'loaded' || imageState === 'cached'
              ? 'opacity-90 scale-100' 
              : 'opacity-0 scale-95'
          }`}
          loading="lazy"
          decoding="async"
          style={{
            aspectRatio: '1/1',
            objectFit: 'cover',
          }}
        />

        <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-400/50 text-center shadow-xl z-10">
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tighter leading-none">{rating}</div>
          <div className="text-xs font-extrabold text-slate-100 tracking-wider mt-1">{position}</div>
          {nationality && (
            <div className="text-[10px] text-amber-200/90 font-medium mt-0.5 tracking-wide">{nationality}</div>
          )}
        </div>

        <div className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider ${rarityBadgeColors[rarity]} z-10`}>
          {rarity}
        </div>

        {is_mystery && (
          <div className="absolute inset-x-0 bottom-0 bg-accent-terracotta/95 backdrop-blur-md py-2 px-4 flex items-center justify-center gap-2 text-white text-xs font-bold animate-pulse shadow-lg z-10">
            <AlertCircle size={16} />
            <span>Mystery Bonus Card Activated & Secured!</span>
          </div>
        )}
      </div>

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
