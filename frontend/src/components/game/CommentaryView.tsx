import React from 'react'
import { Commentary } from '@/types/game'
import Card from '@/components/ui/Card'
import { Tv2 } from 'lucide-react'

interface CommentaryViewProps {
  commentary: Commentary[]
  isLive?: boolean
  maxHeight?: string
}

const CommentaryView: React.FC<CommentaryViewProps> = ({ 
  commentary, 
  isLive = false,
  maxHeight = 'max-h-96'
}) => {
  return (
    <Card className={`p-4 sm:p-6 space-y-3 flex flex-col ${maxHeight}`}>
      <div className="flex items-center gap-2">
        <Tv2 className="text-accent-terracotta flex-shrink-0" size={20} />
        <h3 className="font-bold text-text-primary text-sm sm:text-base">Live Commentary</h3>
        {isLive && <div className="w-2 h-2 bg-status-error rounded-full animate-pulse ml-auto" />}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {commentary.length === 0 ? (
          <p className="text-text-secondary text-xs sm:text-sm text-center py-4 sm:py-8">⏳ Waiting for match to begin...</p>
        ) : (
          commentary.map((event, idx) => (
            <div
              key={idx}
              className="text-xs sm:text-sm border-l-2 border-accent-terracotta pl-3 py-1 sm:py-2 animate-fade-in"
            >
              <p className="text-xs text-accent-terracotta font-semibold">Min {event.minute}'</p>
              <p className="text-text-primary mt-1">{event.text}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export default CommentaryView
