'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {
  Trophy,
  Users,
  Zap,
  Gamepad2,
  ChevronDown,
  Sparkles,
  Crown,
  Dices,
  TrendingUp,
  LogOut,
  Star,
  Shield,
  Swords,
  Flame,
} from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  tag: string
  wins: number
  losses: number
  rating: number
  streak: number
  favoriteFormation: string
}

interface RuleCard {
  emoji: string
  title: string
  description: string
  icon: React.ReactNode
}

// Deterministic 5-digit tag generator: the same Player ID always resolves
// to the same tag, so it reads as an assigned identity rather than a
// random number that changes on every render.
function generatePlayerTag(id: string): string {
  if (!id.trim()) return ''
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  const tag = (hash % 90000) + 10000
  return `#${tag}`
}

function getInitials(id: string): string {
  if (!id.trim()) return '?'
  const parts = id.trim().split(/[\s_-]+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, name: 'Al_Ghaith', tag: '#40217', wins: 312, losses: 58, rating: 2984, streak: 14, favoriteFormation: '4-3-3' },
  { rank: 2, name: 'Nasser_King', tag: '#77812', wins: 298, losses: 71, rating: 2911, streak: 6, favoriteFormation: '4-2-3-1' },
  { rank: 3, name: 'BidMaster_SA', tag: '#19934', wins: 275, losses: 64, rating: 2879, streak: 9, favoriteFormation: '3-5-2' },
  { rank: 4, name: 'FalconTactics', tag: '#58261', wins: 260, losses: 80, rating: 2802, streak: 3, favoriteFormation: '4-4-2' },
  { rank: 5, name: 'Riyadh_Manager', tag: '#63390', wins: 244, losses: 77, rating: 2755, streak: 5, favoriteFormation: '4-3-3' },
  { rank: 6, name: 'GoldenBoot_7', tag: '#12045', wins: 231, losses: 90, rating: 2688, streak: -2, favoriteFormation: '4-2-3-1' },
  { rank: 7, name: 'Sultan_Auctions', tag: '#88102', wins: 219, losses: 85, rating: 2643, streak: 4, favoriteFormation: '3-4-3' },
  { rank: 8, name: 'DesertHawk', tag: '#30456', wins: 205, losses: 93, rating: 2590, streak: -1, favoriteFormation: '5-3-2' },
  { rank: 9, name: 'MidfieldGeneral', tag: '#91723', wins: 198, losses: 101, rating: 2544, streak: 2, favoriteFormation: '4-3-3' },
  { rank: 10, name: 'Zaeem_FC', tag: '#25587', wins: 187, losses: 96, rating: 2501, streak: 7, favoriteFormation: '4-4-2' },
]

const RULES: RuleCard[] = [
  {
    emoji: '🏆',
    title: 'مرحلة المزاد',
    description: 'ابنِ فريقك عبر مزايدة استراتيجية. الترتيب: حارس مرمى ← 2 مدافع ← 2 وسط ← 2 مهاجم ← 2 مدرب. كل مزايدة 30 ثانية فقط.',
    icon: <Trophy size={28} className="text-accent-terracotta" />,
  },
  {
    emoji: '🎲',
    title: 'البطاقات الغامضة',
    description: 'خسرت المزاد؟ تحصل على بطاقة غامضة فوراً! توزيع الاحتمالات: 30% أسطوري، 30% متوسط، 40% ضعيف.',
    icon: <Dices size={28} className="text-accent-terracotta" />,
  },
  {
    emoji: '⚽',
    title: 'محاكاة المباراة',
    description: 'تواجه الفرق ببعضها مع تعليق مباشر. النتيجة تُحسم عبر 30% قوة الفريق + 30% خطة المدرب + 40% الحظ.',
    icon: <Swords size={28} className="text-accent-terracotta" />,
  },
  {
    emoji: '👑',
    title: 'نظام التصنيف',
    description: 'كل انتصار يرفع تصنيفك العالمي (Rating) ويقربك من قمة لوحة المتصدرين الأسبوعية.',
    icon: <Crown size={28} className="text-accent-terracotta" />,
  },
]

const LIVE_STATS = [
  { label: 'مزادات مكتملة', value: 184392, icon: <Trophy size={18} className="text-accent-terracotta" /> },
  { label: 'مدير مسجل', value: 52810, icon: <Users size={18} className="text-accent-terracotta" /> },
  { label: 'بطاقة أسطورية سُحبت', value: 27456, icon: <Star size={18} className="text-accent-terracotta" /> },
  { label: 'مباراة الآن', value: 341, icon: <Flame size={18} className="text-accent-terracotta" /> },
]

export default function Home() {
  const router = useRouter()
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const [error, setError] = useState('')
  const [showProfile, setShowProfile] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)

  const player1Tag = generatePlayerTag(player1Id)
  const player2Tag = generatePlayerTag(player2Id)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStartGame = () => {
    if (!player1Id.trim()) {
      setError('الرجاء إدخال معرف اللاعب الأول')
      return
    }
    if (!player2Id.trim()) {
      setError('الرجاء إدخال معرف اللاعب الثاني')
      return
    }
    if (player1Id.trim() === player2Id.trim()) {
      setError('يجب أن يكون معرفا اللاعبين مختلفين')
      return
    }
    setError('')
    router.push(`/game/${encodeURIComponent(player1Id.trim())}/${encodeURIComponent(player2Id.trim())}`)
  }

  const handlePlayVsGoat = () => {
    if (!player1Id.trim()) {
      setError('الرجاء إدخال معرف اللاعب الأول أولاً')
      return
    }
    setError('')
    router.push(`/game/${encodeURIComponent(player1Id.trim())}/Goat_Bot`)
  }

  const handleResetProfile = () => {
    setPlayer1Id('')
    setPlayer2Id('')
    setError('')
    setShowProfile(false)
  }

  return (
    <main className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-bg-alt border-b border-dark-card sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-dark-bg-alt/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-bounce">⚽</div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                  OSM FUT Dual Battle
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary">Real-time 1v1 Auction Game</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-secondary bg-dark-card px-3 py-1.5 rounded-full border border-dark-card">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-terracotta opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-terracotta"></span>
                </span>
                v1.2.0 · Live
              </div>

              {/* Profile Avatar */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setShowProfile((prev) => !prev)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                      player1Id.trim()
                        ? 'bg-gradient-to-br from-accent-terracotta to-[#7a3b2e] text-white border-accent-terracotta shadow-lg shadow-accent-terracotta/30'
                        : 'bg-dark-card text-text-secondary border-dark-card group-hover:border-accent-terracotta/50'
                    }`}
                  >
                    {getInitials(player1Id)}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-text-secondary transition-transform hidden sm:block ${showProfile ? 'rotate-180' : ''}`}
                  />
                </button>

                {showProfile && (
                  <div className="absolute right-0 mt-3 w-72 bg-dark-bg-alt border border-dark-card rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <div className="bg-gradient-to-br from-accent-terracotta/20 to-transparent p-5 border-b border-dark-card">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-accent-terracotta to-[#7a3b2e] text-white border-2 border-accent-terracotta shadow-lg shadow-accent-terracotta/30">
                          {getInitials(player1Id)}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary leading-tight">
                            {player1Id.trim() || 'ضيف'}
                          </p>
                          <p className="text-xs text-accent-terracotta font-mono font-semibold">
                            {player1Tag || 'أدخل معرفك للحصول على رقم'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary flex items-center gap-2">
                          <Shield size={14} /> الحالة
                        </span>
                        <span className="text-green-500 font-semibold">
                          {player1Id.trim() ? 'جاهز للمعركة' : 'غير مسجل'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary flex items-center gap-2">
                          <TrendingUp size={14} /> التصنيف
                        </span>
                        <span className="text-text-primary font-semibold">
                          {player1Id.trim() ? '1000 (مبدئي)' : '—'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetProfile}
                        className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-status-error border border-status-error/30 hover:bg-status-error/10 rounded-lg py-2 transition-colors cursor-pointer"
                      >
                        <LogOut size={14} /> تسجيل خروج / مسح البيانات
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left - Game Info */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-accent-terracotta/10 border border-accent-terracotta/30 text-accent-terracotta text-xs font-semibold px-3 py-1.5 rounded-full">
              <Sparkles size={14} />
              أكثر من 52,000 مدير يلعبون الآن
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-text-primary leading-tight">
                معركة المزاد الرياضية <span className="text-accent-terracotta">الأقوى</span>
              </h2>
              <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
                نافس في مزادات تكتيكية لحظية 1 ضد 1. ابنِ فريق أحلامك عبر مزايدة استراتيجية، أدر قوة تشكيلتك، وعِش محاكاة مباريات مشوّقة بتعليق ديناميكي حي.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <Zap className="text-accent-terracotta mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-text-primary">مزادات لحظية</h3>
                  <p className="text-sm text-text-secondary">مزايدة بنظام الأدوار خلال 30 ثانية مع بطاقات غامضة</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Users className="text-accent-terracotta mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-text-primary">مواجهات وجهاً لوجه</h3>
                  <p className="text-sm text-text-secondary">محاكاة مباريات بعمق تكتيكي وتعليق حي مباشر</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Trophy className="text-accent-terracotta mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-text-primary">لعب استراتيجي</h3>
                  <p className="text-sm text-text-secondary">أتقن تكتيكات المزاد وإدارة الفريق</p>
                </div>
              </div>
            </div>

            {/* Live Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {LIVE_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-dark-bg-alt border border-dark-card rounded-xl p-3 text-center hover:border-accent-terracotta/40 transition-colors"
                >
                  <div className="flex justify-center mb-1">{stat.icon}</div>
                  <p className="font-bold text-text-primary text-sm sm:text-base">
                    {stat.value.toLocaleString('en-US')}
                  </p>
                  <p className="text-[10px] sm:text-xs text-text-secondary">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Game Start Card */}
          <Card className="p-6 sm:p-8 border border-dark-card relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-accent-terracotta/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-6 relative">
              <Gamepad2 className="text-accent-terracotta" size={24} />
              <h3 className="text-2xl font-bold text-text-primary">ابدأ مباراة جديدة</h3>
            </div>

            <div className="space-y-4 relative">
              {error && (
                <div className="p-3 rounded-btn bg-status-error/10 border border-status-error">
                  <p className="text-sm text-status-error">{error}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    معرف اللاعب الأول
                  </label>
                  {player1Tag && (
                    <span className="text-xs font-mono font-bold text-accent-terracotta bg-accent-terracotta/10 px-2 py-0.5 rounded-full">
                      {player1Tag}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="أدخل معرفك"
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  className="w-full"
                  maxLength={50}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    معرف اللاعب الثاني
                  </label>
                  {player2Tag && (
                    <span className="text-xs font-mono font-bold text-accent-terracotta bg-accent-terracotta/10 px-2 py-0.5 rounded-full">
                      {player2Tag}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="أدخل معرف الخصم"
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  className="w-full"
                  maxLength={50}
                />
              </div>

              <Button onClick={handleStartGame} className="w-full mt-2" size="lg">
                ابدأ المزاد
              </Button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-dark-card"></div>
                <span className="flex-shrink mx-4 text-text-secondary text-xs uppercase">أو</span>
                <div className="flex-grow border-t border-dark-card"></div>
              </div>

              <button
                type="button"
                onClick={handlePlayVsGoat}
                className="w-full bg-dark-bg-alt hover:bg-dark-card text-text-primary border border-accent-terracotta/50 py-3.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>🤖 العب ضد الذكاء الاصطناعي (Goat 🐐)</span>
              </button>
            </div>
          </Card>
        </div>
      </section>

      {/* Game Rules Section */}
      <section className="bg-dark-bg-alt border-y border-dark-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-text-primary">كيف تعمل اللعبة</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {RULES.map((rule) => (
              <Card
                key={rule.title}
                className="p-6 hover:border-accent-terracotta/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="text-4xl mb-3">{rule.emoji}</div>
                <h3 className="font-bold text-text-primary mb-2">{rule.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{rule.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2">
            <Crown className="text-accent-terracotta" size={26} />
            أفضل المدراء هذا الموسم
          </h2>
          <span className="text-xs text-text-secondary hidden sm:block">يتم التحديث كل ساعة</span>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-card text-text-secondary text-xs uppercase">
                  <th className="text-right px-4 py-3 font-semibold">الترتيب</th>
                  <th className="text-right px-4 py-3 font-semibold">اللاعب</th>
                  <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">التشكيلة</th>
                  <th className="text-right px-4 py-3 font-semibold">فوز/خسارة</th>
                  <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">السلسلة</th>
                  <th className="text-right px-4 py-3 font-semibold">التصنيف</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD_DATA.map((entry) => (
                  <tr
                    key={entry.tag}
                    className="border-b border-dark-card last:border-0 hover:bg-dark-card/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-text-primary">
                      <div className="flex items-center gap-1.5">
                        {entry.rank === 1 && <Crown size={14} className="text-[#FFD700]" />}
                        {entry.rank === 2 && <Crown size={14} className="text-[#C0C0C0]" />}
                        {entry.rank === 3 && <Crown size={14} className="text-[#CD7F32]" />}
                        #{entry.rank}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-terracotta to-[#7a3b2e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(entry.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary leading-tight">{entry.name}</p>
                          <p className="text-[11px] text-accent-terracotta font-mono">{entry.tag}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                      {entry.favoriteFormation}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <span className="text-green-500 font-semibold">{entry.wins}</span>
                      {' / '}
                      <span className="text-status-error font-semibold">{entry.losses}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          entry.streak >= 0
                            ? 'text-green-500 bg-green-500/10'
                            : 'text-status-error bg-status-error/10'
                        }`}
                      >
                        {entry.streak >= 0 ? `+${entry.streak}` : entry.streak}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-accent-terracotta">
                      {entry.rating.toLocaleString('en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Footer with Developer Signature */}
      <footer className="bg-dark-bg border-t border-dark-card py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-2">
            <p className="text-text-secondary text-sm">
              © 2024 OSM FUT Dual Battle. All rights reserved.
            </p>
            <p className="text-text-secondary text-sm">
              Developer: <span className="text-accent-terracotta font-semibold">Saud Yahya Al-Faifi</span> |{' '}
              <span className="text-accent-terracotta font-semibold">0535103986</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
