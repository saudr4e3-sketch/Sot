'use client'

import React, {useState, useEffect} from 'react'
import { getPlayerImageUrls, prefetchImage } from '@/utils/imageFallback'

export default function PlayerMiniCard({player}:{player:any}){
  const urls = getPlayerImageUrls(player)
  const [src,setSrc] = useState<string>(urls[0] || '/static/placeholder-player.png')
  const [loading,setLoading] = useState<boolean>(true)

  useEffect(()=> {
    let cancelled = false
    async function load() {
      setLoading(true)
      for (const u of urls) {
        try {
          await new Promise<boolean>((res,rej)=>{
            const img = new Image()
            img.onload = ()=> res(true)
            img.onerror = ()=> rej(false)
            img.src = u
          })
          if (!cancelled) { setSrc(u); setLoading(false); return }
        } catch(e){}
      }
      if(!cancelled){ setSrc('/static/placeholder-player.png'); setLoading(false) }
    }
    load()
    urls.slice(1,3).forEach(prefetchImage)
    return ()=> { cancelled = true }
  }, [player])

  const rarity = player?.rarity || 'Medium'
  const glow = rarity === 'Legendary' ? 'ring-2 ring-amber-400' : rarity === 'Medium' ? 'ring-2 ring-sky-400' : 'ring-1 ring-slate-600'

  return (
    <div className={`player-mini flex items-center gap-3 p-2 rounded-lg bg-slate-900 ${glow}`}>
      <img src={src} alt={player?.name || 'Player'} className={`w-16 h-16 rounded-full object-cover transition-all ${loading? 'filter blur-sm scale-105':'filter-none scale-100'}`} loading="lazy"/>
      <div className="flex-1">
        <div className="text-sm font-semibold">{player?.name}</div>
        <div className="text-xs text-slate-400">{player?.team} • {player?.rating}</div>
      </div>
    </div>
  )
}
