'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Trophy, Users, Zap, Gamepad2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const [error, setError] = useState('')

  const handleStartGame = () => {
    if (!player1Id.trim()) {
      setError('Please enter Player 1 ID')
      return
    }
    if (!player2Id.trim()) {
      setError('Please enter Player 2 ID')
      return
    }
    if (player1Id === player2Id) {
      setError('Player IDs must be different')
      return
    }
    setError('')
    router.push(`/game/${player1Id}/${player2Id}`)
  }

  return (
    <main className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-bg-alt border-b border-dark-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-bounce">⚽</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">OSM FUT Dual Battle</h1>
                <p className="text-xs sm:text-sm text-text-secondary">Real-time 1v1 Auction Game</p>
              </div>
            </div>
            <div className="text-sm text-text-secondary">v1.0.0</div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left - Game Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-accent-terracotta">The Ultimate Football Auction Battle</h2>
              <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
                Compete in real-time 1v1 tactical auctions. Build your dream team through strategic bidding, manage your squad strength, and simulate thrilling matches with dynamic commentary.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <Zap className="text-accent-terracotta mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-text-primary">Real-Time Auctions</h3>
                  <p className="text-sm text-text-secondary">30-second turn-based bidding with mystery cards</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Users className="text-accent-terracotta mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-text-primary">Head-to-Head Matches</h3>
                  <p className="text-sm text-text-secondary">Simulate matches with tactical depth and live commentary</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Trophy className="text-accent-terracotta mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-text-primary">Strategic Gameplay</h3>
                  <p className="text-sm text-text-secondary">Master auction tactics and team management</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Game Start Card */}
          <Card className="p-6 sm:p-8 border border-dark-card">
            <div className="flex items-center gap-2 mb-6">
              <Gamepad2 className="text-accent-terracotta" size={24} />
              <h3 className="text-2xl font-bold text-text-primary">Start New Game</h3>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-btn bg-status-error/10 border border-status-error">
                  <p className="text-sm text-status-error">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Player 1 ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your player ID"
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  className="w-full"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Player 2 ID
                </label>
                <input
                  type="text"
                  placeholder="Enter opponent's player ID"
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  className="w-full"
                  maxLength={50}
                />
              </div>

              <Button
                onClick={handleStartGame}
                className="w-full mt-6"
                size="lg"
              >
                Start Auction
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Game Rules Section */}
      <section className="bg-dark-bg-alt border-y border-dark-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-text-primary">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-bold text-text-primary mb-2">Auction Phase</h3>
              <p className="text-sm text-text-secondary">
                Build your team through strategic bidding. Sequence: GK → 2 DEF → 2 MID → 2 ATT → 2 MGR. Each bid gets 30 seconds.
              </p>
            </Card>

            <Card className="p-6">
              <div className="text-4xl mb-3">🎲</div>
              <h3 className="font-bold text-text-primary mb-2">Mystery Cards</h3>
              <p className="text-sm text-text-secondary">
                Lose an auction? Get a mystery card instantly! 30% Legendary, 30% Medium, 40% Weak distribution.
              </p>
            </Card>

            <Card className="p-6">
              <div className="text-4xl mb-3">⚽</div>
              <h3 className="font-bold text-text-primary mb-2">Match Simulation</h3>
              <p className="text-sm text-text-secondary">
                Teams face off with live commentary. 30% Squad Strength + 30% Manager Tactic + 40% Luck determines the victor.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer with Developer Signature */}
      <footer className="bg-dark-bg border-t border-dark-card py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <p className="text-text-secondary text-sm">
              © 2024 OSM FUT Dual Battle. All rights reserved.
            </p>
            <p className="text-text-secondary text-sm mt-4 sm:mt-0">
              Developer: <span className="text-accent-terracotta font-semibold">Saud Yahya Al-Faifi</span> | <span className="text-accent-terracotta font-semibold">0535103986</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
