'use client'

import { create } from 'zustand'
import { AuctionState, MatchResult } from '@/types/game'

interface GameStore {
  sessionId: string
  playerId: string
  auctionState: AuctionState | null
  matchResult: MatchResult | null
  isLoading: boolean
  error: string | null

  setSessionId: (id: string) => void
  setPlayerId: (id: string) => void
  setAuctionState: (state: AuctionState) => void
  setMatchResult: (result: MatchResult) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  sessionId: '',
  playerId: '',
  auctionState: null,
  matchResult: null,
  isLoading: false,
  error: null,

  setSessionId: (id: string) => set({ sessionId: id }),
  setPlayerId: (id: string) => set({ playerId: id }),
  setAuctionState: (state: AuctionState) => set({ auctionState: state }),
  setMatchResult: (result: MatchResult) => set({ matchResult: result }),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  reset: () => set({
    sessionId: '',
    playerId: '',
    auctionState: null,
    matchResult: null,
    isLoading: false,
    error: null,
  }),
}))
