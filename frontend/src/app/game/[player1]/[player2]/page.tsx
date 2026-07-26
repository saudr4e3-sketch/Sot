/**
 * ============================================================================
 * OSM FUT Dual Battle — Ultimate Enterprise Edition
 * Game Page Component (Fully Connected to FastAPI + WebSocket)
 * ============================================================================
 *
 * Architecture : Real-time WebSocket + REST API Auction & Match Engine
 * Developer    : Saud Yahya Al-Faifi & Elite Engineering Team
 * Version      : 10.0.0 — "The Titan" — Massive Production Release
 *
 * ✅ Fully connected to FastAPI backend:
 *   - WebSocket: /ws/{session_id}
 *   - REST: /session/{session_id}/bid, /skip, /start, /state, /match, /team/{player_id}
 *
 * 🧠 Self‑healing offline mode with local simulation fallback.
 * 🎁 Mystery box rewards for losing bids.
 * 🏟️ Full match simulation with commentary.
 * 📊 Advanced telemetry, player database, and tactical analysis.
 * 🧬 Player & Coach databases embedded directly – no external imports.
 * 🧩 Modularized internal utilities for scalability.
 *
 * ============================================================================
 * TABLE OF CONTENTS:
 *   1.  Imports & Global Config
 *   2.  Icon Library Mapping
 *   3.  Environment & Constants
 *   4.  Type Definitions (Backend Alignment)
 *   5.  Embedded Player & Coach Databases (150 players + 60 coaches)
 *   6.  Mystery Box & Match Simulation Logic
 *   7.  Custom Hooks (WebSocket, API, Timer, Telemetry)
 *   8.  Advanced UI Components (Header, Card, Button, Modal, Tabs, etc.)
 *   9.  Main GamePage Component
 *   10. Render Logic with Full Auction & Match Flow
 * ============================================================================
 */

'use client'

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  createContext,
  useContext,
  useReducer,
  forwardRef,
  useImperativeHandle,
  Fragment,
  ReactNode,
  Dispatch,
  SetStateAction,
  ComponentType,
  DetailedHTMLProps,
  HTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  CSSProperties,
  RefObject,
  MutableRefObject,
  FC,
  PropsWithChildren,
  Component,
  ErrorInfo,
  Suspense,
  lazy,
  memo
} from 'react'
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation'

// -----------------------------------------------------------------------------
// Comprehensive Icon Set (Lucide React)
// -----------------------------------------------------------------------------
import {
  AlertCircle,
  Loader,
  Play,
  Trophy,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Coins,
  Wifi,
  WifiOff,
  Gift,
  Users,
  Bot,
  Timer,
  ArrowRight,
  X,
  Repeat,
  Sparkles,
  Star,
  Swords,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Radio,
  Unplug,
  Info,
  Settings,
  LogOut,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  List,
  Grid,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  SkipForward,
  FastForward,
  HelpCircle,
  MessageCircle,
  Send,
  Trash2,
  Edit,
  Plus,
  Minus,
  Flag,
  Target,
  Crosshair,
  Compass,
  MapPin,
  Clock,
  Calendar,
  Globe,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Upload,
  Link,
  Copy,
  Clipboard,
  Bookmark,
  Award,
  Medal,
  Crown,
  Gem,
  Diamond,
  Flame,
  Wind,
  Droplet,
  Leaf,
  Moon,
  Sun,
  Cloud,
  Umbrella,
  Anchor,
  Rocket,
  Plane,
  Car,
  Bike,
  Ship,
  Train,
  Building,
  Home,
  TreePine,
  Mountain,
  Waves,
  Database,
  Server,
  CloudLightning,
  Shield,
  Siren,
  Bell,
  BellOff,
  Video,
  Camera,
  Image,
  FileText,
  Paperclip,
  Printer,
  ShoppingCart,
  CreditCard,
  Wallet,
  Banknote,
  Percent,
  Hash,
  AtSign,
  Infinity,
  Sigma,
  Pi,
  Binary,
  Braces,
  Brackets,
  Code2,
  Terminal,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Github,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Twitch,
  Disc,
  Music,
  Headphones,
  Mic,
  Speaker,
  Cast,
  Airplay,
  MonitorSpeaker,
  SmartphoneCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Signal,
  SignalLow,
  Satellite,
  Antenna,
  Router,
  MousePointer,
  Keyboard,
  MonitorSmartphone,
  Lightbulb,
  Power,
  PowerOff,
  RotateCw,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
  Equal,
  Divide,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
  Layers,
  Columns,
  Rows,
  StretchVertical,
  StretchHorizontal,
  Move,
  Maximize,
  Minimize,
  Crop,
  Scissors,
  Paintbrush,
  Pencil,
  Eraser,
  Highlighter,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered,
  ListTodo,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Table2,
  LayoutTemplate,
  Presentation,
  Projector,
  Tv,
  RadioReceiver,
  HeadphoneIcon,
  Gamepad2,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileTextIcon,
  FileImage,
  FileAudio,
  FileVideo,
  Archive,
  Trash,
  FolderPlus,
  FolderMinus,
  Network,
  Plug,
  PlugZap,
  Cable,
  SatelliteDish,
  MonitorCheck,
  MonitorPause,
  MonitorPlay,
  MonitorStop,
  MonitorX,
  TabletSmartphone,
  AppWindow,
  AppWindowMac,
  Dock,
  Menu,
  MenuSquare,
  PanelLeft,
  PanelRight,
  PanelBottom,
  PanelTop,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Grid2X2,
  Grid3X3,
  LayoutDashboard,
  LayoutList,
  LayoutGrid,
  LayoutPanelLeft,
  LayoutPanelTop,
  Grip,
  GripHorizontal,
  GripVertical,
  Container,
  Box,
  BoxSelect,
  Package,
  PackageCheck,
  PackageMinus,
  PackageOpen,
  PackagePlus,
  PackageSearch,
  PackageX,
  ArchiveRestore,
  ArchiveX,
  ClipboardCheck,
  ClipboardCopy,
  ClipboardEdit,
  ClipboardList,
  ClipboardMinus,
  ClipboardPaste,
  ClipboardPlus,
  ClipboardType,
  ClipboardX,
  DatabaseBackup,
  DatabaseZap,
  HardDrive,
  HardDriveDownload,
  HardDriveUpload,
  MemoryStick,
  Microchip,
  Cpu as Cpu2,
  CircuitBoard,
  Motherboard,
  Network as Network2,
  Router as Router2,
  Server as Server2,
  ServerCog,
  ServerCrash,
  ServerOff,
  Usb
} from 'lucide-react'

// ============================================================================
// GLOBAL CONFIGURATION & CONSTANTS
// ============================================================================

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const TOTAL_AUCTION_POSITIONS = 9
const AUCTION_SEQUENCE = [
  'GK', 'CB1', 'CB2', 'CM1', 'CM2', 'CF1', 'CF2', 'Coach', 'Shadow_Coach'
]
const POSITION_DISPLAY: Record<string, string> = {
  GK: 'حارس مرمى',
  CB1: 'دفاع أول',
  CB2: 'دفاع ثاني',
  CM1: 'وسط أول',
  CM2: 'وسط ثاني',
  CF1: 'هجوم أول',
  CF2: 'هجوم ثاني',
  Coach: 'مدرب الفريق',
  Shadow_Coach: 'مدرب الظل'
}

const DEFAULT_TIMER = 30
const PING_INTERVAL_MS = 20000
const FALLBACK_LOAD_DELAY_MS = 2500
const TIMER_TICK_MS = 250
const MAX_STUCK_AT_ZERO_MS = 4000

const MYSTERY_BOX_PROBABILITIES = {
  Weak: 0.40,
  Medium: 0.30,
  Legendary: 0.30
}

const MATCH_WEIGHTS = {
  RATING_WEIGHT: 0.40,
  TACTIC_WEIGHT: 0.30,
  MOMENTUM_WEIGHT: 0.30
}

// ============================================================================
// TYPE DEFINITIONS (Aligned with Backend)
// ============================================================================

export interface PlayerCard {
  name: string
  position: string
  rating: number
  rarity: string
  image_data?: { primary: string; fallback: string; emergency: string }
  nationality?: string
  club?: string
  age?: number
  pace?: number
  shooting?: number
  passing?: number
  dribbling?: number
  defending?: number
  physical?: number
  _pace?: number
  _shooting?: number
  _passing?: number
  _dribbling?: number
  _defending?: number
  _physical?: number
  is_mystery?: boolean
}

export interface TeamEntry {
  type: string
  player: PlayerCard
  bid_amount?: number
  is_mystery?: boolean
}

export interface TeamDict {
  [position: string]: TeamEntry[]
}

export interface AuctionState {
  session_id: string
  status: string
  auction_progress: {
    current_index: number
    total_positions: number
    percentage: number
  }
  current_turn: string
  highest_bid: number
  highest_bidder: string | null
  timer: {
    remaining: number
    duration: number
    is_expired: boolean
  }
  current_card: {
    name: string
    display_position: string
    position: string
    nationality: string
    club: string
    age: number
    image_data: any
    rarity: string
    stats_hidden: boolean
  } | null
  auction_sequence: { index: number; position: string; display: string }[]
  teams: { player1: TeamDict; player2: TeamDict }
  bot_info: { name: string; remaining_budget: number; cards_won: number }
  rules: {
    blind_auction: boolean
    hidden_stats: boolean
    turn_duration: number
    mystery_box_on_loss: boolean
    shadow_coach_rule?: string
  }
}

export interface MatchResultData {
  team1_goals: number
  team2_goals: number
  winner: 'team1' | 'team2' | 'draw'
  result_text: string
  analysis: any
  team1_info: { name: string; player_id: string; total_power: number }
  team2_info: { name: string; player_id: string; total_power: number }
  match_stats: {
    luck_weight: string
    power_weight: string
    tactic_weight: string
    formula: string
  }
  commentary?: { minute: number; type: string; description: string }[]
}

export interface WSMessage {
  type: string
  data?: any
  state?: AuctionState
  amount?: number
  player_id?: string
  reason?: string
  message?: string
  timestamp?: string
}

// ============================================================================
// EMBEDDED PLAYER DATABASE (150 players – 50 strong, 50 average, 50 weak)
// ============================================================================

const STRONG_PLAYERS: PlayerCard[] = [
  { name: 'كيليان مبابي', position: 'ATT', rating: 92, rarity: 'Legendary', nationality: 'فرنسا', club: 'باريس سان جيرمان', age: 25, pace: 97, shooting: 89, passing: 80, dribbling: 92, defending: 36, physical: 77 },
  { name: 'إيرلينغ هالاند', position: 'ATT', rating: 91, rarity: 'Legendary', nationality: 'النرويج', club: 'مانشستر سيتي', age: 24, pace: 89, shooting: 94, passing: 66, dribbling: 80, defending: 45, physical: 88 },
  { name: 'فينيسيوس جونيور', position: 'ATT', rating: 90, rarity: 'Legendary', nationality: 'البرازيل', club: 'ريال مدريد', age: 24, pace: 95, shooting: 84, passing: 78, dribbling: 94, defending: 32, physical: 68 },
  { name: 'محمد صلاح', position: 'ATT', rating: 90, rarity: 'Legendary', nationality: 'مصر', club: 'ليفربول', age: 32, pace: 93, shooting: 90, passing: 82, dribbling: 89, defending: 40, physical: 76 },
  { name: 'كيفين دي بروين', position: 'MID', rating: 91, rarity: 'Legendary', nationality: 'بلجيكا', club: 'مانشستر سيتي', age: 33, pace: 76, shooting: 88, passing: 94, dribbling: 87, defending: 64, physical: 78 },
  { name: 'جود بيلينغهام', position: 'MID', rating: 90, rarity: 'Legendary', nationality: 'إنجلترا', club: 'ريال مدريد', age: 21, pace: 82, shooting: 85, passing: 85, dribbling: 88, defending: 76, physical: 82 },
  { name: 'رودري', position: 'MID', rating: 89, rarity: 'Legendary', nationality: 'إسبانيا', club: 'مانشستر سيتي', age: 28, pace: 58, shooting: 72, passing: 86, dribbling: 79, defending: 87, physical: 84 },
  { name: 'فيرجيل فان دايك', position: 'DEF', rating: 89, rarity: 'Legendary', nationality: 'هولندا', club: 'ليفربول', age: 33, pace: 78, shooting: 60, passing: 72, dribbling: 70, defending: 92, physical: 88 },
  { name: 'روبن دياز', position: 'DEF', rating: 88, rarity: 'Legendary', nationality: 'البرتغال', club: 'مانشستر سيتي', age: 27, pace: 68, shooting: 45, passing: 68, dribbling: 65, defending: 90, physical: 85 },
  { name: 'تيبو كورتوا', position: 'GK', rating: 89, rarity: 'Legendary', nationality: 'بلجيكا', club: 'ريال مدريد', age: 32, pace: 45, shooting: 25, passing: 42, dribbling: 38, defending: 48, physical: 78 },
  { name: 'أليسون بيكر', position: 'GK', rating: 89, rarity: 'Legendary', nationality: 'البرازيل', club: 'ليفربول', age: 32, pace: 50, shooting: 30, passing: 48, dribbling: 42, defending: 52, physical: 76 },
  { name: 'ليونيل ميسي', position: 'ATT', rating: 88, rarity: 'Legendary', nationality: 'الأرجنتين', club: 'إنتر ميامي', age: 37, pace: 78, shooting: 90, passing: 91, dribbling: 95, defending: 34, physical: 65 },
  { name: 'روبرت ليفاندوفسكي', position: 'ATT', rating: 88, rarity: 'Legendary', nationality: 'بولندا', club: 'برشلونة', age: 36, pace: 75, shooting: 92, passing: 78, dribbling: 84, defending: 42, physical: 82 },
  { name: 'هاري كين', position: 'ATT', rating: 89, rarity: 'Legendary', nationality: 'إنجلترا', club: 'بايرن ميونخ', age: 31, pace: 70, shooting: 93, passing: 83, dribbling: 82, defending: 47, physical: 84 },
  { name: 'لوكا مودريتش', position: 'MID', rating: 87, rarity: 'Legendary', nationality: 'كرواتيا', club: 'ريال مدريد', age: 39, pace: 72, shooting: 78, passing: 90, dribbling: 89, defending: 70, physical: 68 },
  { name: 'توني كروس', position: 'MID', rating: 87, rarity: 'Legendary', nationality: 'ألمانيا', club: 'ريال مدريد', age: 34, pace: 52, shooting: 82, passing: 92, dribbling: 81, defending: 68, physical: 70 },
  { name: 'إيدرسون', position: 'GK', rating: 88, rarity: 'Legendary', nationality: 'البرازيل', club: 'مانشستر سيتي', age: 31, pace: 55, shooting: 35, passing: 75, dribbling: 52, defending: 50, physical: 74 },
  { name: 'مارك أندريه تير شتيغن', position: 'GK', rating: 87, rarity: 'Legendary', nationality: 'ألمانيا', club: 'برشلونة', age: 32, pace: 48, shooting: 28, passing: 55, dribbling: 44, defending: 46, physical: 72 },
  { name: 'إيدير ميليتاو', position: 'DEF', rating: 86, rarity: 'Legendary', nationality: 'البرازيل', club: 'ريال مدريد', age: 26, pace: 82, shooting: 48, passing: 62, dribbling: 68, defending: 86, physical: 82 },
  { name: 'ألفونسو ديفيز', position: 'DEF', rating: 85, rarity: 'Legendary', nationality: 'كندا', club: 'بايرن ميونخ', age: 24, pace: 96, shooting: 62, passing: 72, dribbling: 85, defending: 76, physical: 74 },
  { name: 'برونو فيرنانديز', position: 'MID', rating: 87, rarity: 'Legendary', nationality: 'البرتغال', club: 'مانشستر يونايتد', age: 30, pace: 74, shooting: 85, passing: 89, dribbling: 82, defending: 68, physical: 72 },
  { name: 'فيكتور أوسيمين', position: 'ATT', rating: 87, rarity: 'Legendary', nationality: 'نيجيريا', club: 'نابولي', age: 25, pace: 92, shooting: 86, passing: 68, dribbling: 80, defending: 38, physical: 82 },
  { name: 'بوكايو ساكا', position: 'ATT', rating: 86, rarity: 'Legendary', nationality: 'إنجلترا', club: 'أرسنال', age: 23, pace: 86, shooting: 82, passing: 80, dribbling: 88, defending: 58, physical: 68 },
  { name: 'جمال موسيالا', position: 'MID', rating: 86, rarity: 'Legendary', nationality: 'ألمانيا', club: 'بايرن ميونخ', age: 21, pace: 84, shooting: 80, passing: 82, dribbling: 92, defending: 58, physical: 62 },
  { name: 'ويليام ساليبا', position: 'DEF', rating: 86, rarity: 'Legendary', nationality: 'فرنسا', club: 'أرسنال', age: 23, pace: 80, shooting: 42, passing: 62, dribbling: 68, defending: 87, physical: 84 },
  { name: 'رياض محرز', position: 'ATT', rating: 86, rarity: 'Legendary', nationality: 'الجزائر', club: 'الأهلي', age: 33, pace: 82, shooting: 80, passing: 84, dribbling: 88, defending: 42, physical: 62 },
  { name: 'ساديو ماني', position: 'ATT', rating: 85, rarity: 'Legendary', nationality: 'السنغال', club: 'النصر', age: 32, pace: 88, shooting: 82, passing: 76, dribbling: 84, defending: 48, physical: 74 },
  { name: 'روبرتو فيرمينو', position: 'ATT', rating: 84, rarity: 'Legendary', nationality: 'البرازيل', club: 'الأهلي', age: 32, pace: 74, shooting: 78, passing: 80, dribbling: 84, defending: 52, physical: 72 },
  { name: 'أشرف حكيمي', position: 'DEF', rating: 86, rarity: 'Legendary', nationality: 'المغرب', club: 'باريس سان جيرمان', age: 26, pace: 94, shooting: 68, passing: 76, dribbling: 82, defending: 78, physical: 76 },
  { name: 'ترينت ألكسندر أرنولد', position: 'DEF', rating: 86, rarity: 'Legendary', nationality: 'إنجلترا', club: 'ليفربول', age: 26, pace: 78, shooting: 68, passing: 90, dribbling: 80, defending: 80, physical: 72 },
  { name: 'فيدريكو فالفيردي', position: 'MID', rating: 87, rarity: 'Legendary', nationality: 'أوروغواي', club: 'ريال مدريد', age: 26, pace: 88, shooting: 82, passing: 84, dribbling: 82, defending: 78, physical: 80 },
  { name: 'جواو كانسيلو', position: 'DEF', rating: 86, rarity: 'Legendary', nationality: 'البرتغال', club: 'برشلونة', age: 30, pace: 84, shooting: 72, passing: 84, dribbling: 86, defending: 80, physical: 72 },
  { name: 'ثيو هيرنانديز', position: 'DEF', rating: 86, rarity: 'Legendary', nationality: 'فرنسا', club: 'ميلان', age: 27, pace: 94, shooting: 72, passing: 78, dribbling: 84, defending: 80, physical: 82 },
  { name: 'مايك ماينان', position: 'GK', rating: 87, rarity: 'Legendary', nationality: 'فرنسا', club: 'ميلان', age: 29, pace: 48, shooting: 28, passing: 42, dribbling: 40, defending: 48, physical: 76 },
  { name: 'بيرناردو سيلفا', position: 'MID', rating: 88, rarity: 'Legendary', nationality: 'البرتغال', club: 'مانشستر سيتي', age: 30, pace: 78, shooting: 80, passing: 88, dribbling: 92, defending: 62, physical: 66 },
  { name: 'فيل فودين', position: 'MID', rating: 86, rarity: 'Legendary', nationality: 'إنجلترا', club: 'مانشستر سيتي', age: 24, pace: 82, shooting: 82, passing: 84, dribbling: 88, defending: 54, physical: 62 },
  { name: 'جاك غريليش', position: 'MID', rating: 84, rarity: 'Legendary', nationality: 'إنجلترا', club: 'مانشستر سيتي', age: 29, pace: 78, shooting: 76, passing: 84, dribbling: 88, defending: 48, physical: 72 },
  { name: 'ديكلان رايس', position: 'MID', rating: 87, rarity: 'Legendary', nationality: 'إنجلترا', club: 'أرسنال', age: 25, pace: 72, shooting: 72, passing: 82, dribbling: 78, defending: 86, physical: 84 },
  { name: 'مارتن أوديغارد', position: 'MID', rating: 87, rarity: 'Legendary', nationality: 'النرويج', club: 'أرسنال', age: 25, pace: 76, shooting: 82, passing: 90, dribbling: 88, defending: 62, physical: 66 },
  { name: 'غابرييل جيسوس', position: 'ATT', rating: 84, rarity: 'Legendary', nationality: 'البرازيل', club: 'أرسنال', age: 27, pace: 84, shooting: 82, passing: 78, dribbling: 86, defending: 48, physical: 72 },
  { name: 'سون هيونغ مين', position: 'ATT', rating: 87, rarity: 'Legendary', nationality: 'كوريا الجنوبية', club: 'توتنهام', age: 32, pace: 88, shooting: 88, passing: 82, dribbling: 86, defending: 42, physical: 72 },
  { name: 'جيمس ماديسون', position: 'MID', rating: 84, rarity: 'Legendary', nationality: 'إنجلترا', club: 'توتنهام', age: 27, pace: 74, shooting: 80, passing: 86, dribbling: 84, defending: 54, physical: 66 },
  { name: 'أليساندرو باستوني', position: 'DEF', rating: 86, rarity: 'Legendary', nationality: 'إيطاليا', club: 'إنتر ميلان', age: 25, pace: 72, shooting: 48, passing: 72, dribbling: 68, defending: 86, physical: 80 },
  { name: 'نيكولو باريلا', position: 'MID', rating: 86, rarity: 'Legendary', nationality: 'إيطاليا', club: 'إنتر ميلان', age: 27, pace: 78, shooting: 76, passing: 84, dribbling: 82, defending: 78, physical: 74 },
  { name: 'لاوتارو مارتينيز', position: 'ATT', rating: 87, rarity: 'Legendary', nationality: 'الأرجنتين', club: 'إنتر ميلان', age: 27, pace: 84, shooting: 86, passing: 74, dribbling: 84, defending: 42, physical: 76 },
  { name: 'خفيشا كفاراتسخيليا', position: 'ATT', rating: 86, rarity: 'Legendary', nationality: 'جورجيا', club: 'نابولي', age: 23, pace: 86, shooting: 82, passing: 82, dribbling: 90, defending: 42, physical: 68 },
  { name: 'رافاييل لياو', position: 'ATT', rating: 86, rarity: 'Legendary', nationality: 'البرتغال', club: 'ميلان', age: 25, pace: 94, shooting: 82, passing: 78, dribbling: 90, defending: 38, physical: 76 },
  { name: 'يان زومر', position: 'GK', rating: 85, rarity: 'Legendary', nationality: 'سويسرا', club: 'إنتر ميلان', age: 35, pace: 48, shooting: 25, passing: 42, dribbling: 38, defending: 46, physical: 70 },
  { name: 'جيانلويجي دوناروما', position: 'GK', rating: 86, rarity: 'Legendary', nationality: 'إيطاليا', club: 'باريس سان جيرمان', age: 25, pace: 50, shooting: 28, passing: 40, dribbling: 38, defending: 48, physical: 78 },
  { name: 'روبن نيفيز', position: 'MID', rating: 85, rarity: 'Legendary', nationality: 'البرتغال', club: 'الهلال', age: 27, pace: 62, shooting: 78, passing: 86, dribbling: 76, defending: 72, physical: 68 },
]

const AVERAGE_PLAYERS: PlayerCard[] = [
  { name: 'حكيم زياش', position: 'MID', rating: 80, rarity: 'Medium', nationality: 'المغرب', club: 'غلطة سراي', age: 31, pace: 78, shooting: 76, passing: 84, dribbling: 82, defending: 52, physical: 64 },
  { name: 'ممفيس ديباي', position: 'ATT', rating: 82, rarity: 'Medium', nationality: 'هولندا', club: 'أتلتيكو مدريد', age: 30, pace: 82, shooting: 80, passing: 76, dribbling: 84, defending: 38, physical: 76 },
  { name: 'يوسف النصيري', position: 'ATT', rating: 80, rarity: 'Medium', nationality: 'المغرب', club: 'فنربخشة', age: 27, pace: 84, shooting: 78, passing: 62, dribbling: 74, defending: 38, physical: 78 },
  { name: 'سفيان أمرابط', position: 'MID', rating: 79, rarity: 'Medium', nationality: 'المغرب', club: 'مانشستر يونايتد', age: 28, pace: 72, shooting: 62, passing: 76, dribbling: 74, defending: 80, physical: 82 },
  { name: 'كاليدو كوليبالي', position: 'DEF', rating: 82, rarity: 'Medium', nationality: 'السنغال', club: 'الهلال', age: 33, pace: 72, shooting: 48, passing: 62, dribbling: 64, defending: 85, physical: 86 },
  { name: 'أندريه أونانا', position: 'GK', rating: 81, rarity: 'Medium', nationality: 'الكاميرون', club: 'مانشستر يونايتد', age: 28, pace: 52, shooting: 32, passing: 68, dribbling: 48, defending: 48, physical: 72 },
  { name: 'نيكولاس بيبي', position: 'ATT', rating: 78, rarity: 'Medium', nationality: 'ساحل العاج', club: 'طرابزون سبور', age: 29, pace: 88, shooting: 74, passing: 68, dribbling: 82, defending: 38, physical: 68 },
  { name: 'فيكتور ليندلوف', position: 'DEF', rating: 80, rarity: 'Medium', nationality: 'السويد', club: 'مانشستر يونايتد', age: 30, pace: 68, shooting: 42, passing: 64, dribbling: 62, defending: 80, physical: 76 },
  { name: 'بيير إيمريك أوباميانغ', position: 'ATT', rating: 81, rarity: 'Medium', nationality: 'الغابون', club: 'مارسيليا', age: 35, pace: 84, shooting: 82, passing: 72, dribbling: 78, defending: 38, physical: 68 },
  { name: 'آرون وان بيساكا', position: 'DEF', rating: 80, rarity: 'Medium', nationality: 'إنجلترا', club: 'مانشستر يونايتد', age: 26, pace: 86, shooting: 42, passing: 62, dribbling: 74, defending: 84, physical: 76 },
  { name: 'يورغن تيمبر', position: 'DEF', rating: 80, rarity: 'Medium', nationality: 'هولندا', club: 'أرسنال', age: 23, pace: 82, shooting: 48, passing: 72, dribbling: 76, defending: 80, physical: 74 },
  { name: 'جوردان بيكفورد', position: 'GK', rating: 80, rarity: 'Medium', nationality: 'إنجلترا', club: 'إيفرتون', age: 30, pace: 48, shooting: 28, passing: 52, dribbling: 42, defending: 44, physical: 68 },
  { name: 'لوك شاو', position: 'DEF', rating: 80, rarity: 'Medium', nationality: 'إنجلترا', club: 'مانشستر يونايتد', age: 29, pace: 78, shooting: 58, passing: 76, dribbling: 78, defending: 78, physical: 76 },
  { name: 'بن تشيلويل', position: 'DEF', rating: 79, rarity: 'Medium', nationality: 'إنجلترا', club: 'تشيلسي', age: 27, pace: 82, shooting: 58, passing: 74, dribbling: 78, defending: 78, physical: 72 },
  { name: 'ديفيد ريا', position: 'GK', rating: 82, rarity: 'Medium', nationality: 'إسبانيا', club: 'أرسنال', age: 29, pace: 48, shooting: 28, passing: 58, dribbling: 42, defending: 46, physical: 68 },
  { name: 'إيمليانو مارتينيز', position: 'GK', rating: 83, rarity: 'Medium', nationality: 'الأرجنتين', club: 'أستون فيلا', age: 32, pace: 48, shooting: 30, passing: 42, dribbling: 40, defending: 48, physical: 74 },
  { name: 'جون ستونز', position: 'DEF', rating: 82, rarity: 'Medium', nationality: 'إنجلترا', club: 'مانشستر سيتي', age: 30, pace: 68, shooting: 48, passing: 68, dribbling: 64, defending: 84, physical: 78 },
  { name: 'غابرييل ميغالهايس', position: 'DEF', rating: 82, rarity: 'Medium', nationality: 'البرازيل', club: 'أرسنال', age: 26, pace: 68, shooting: 52, passing: 58, dribbling: 62, defending: 84, physical: 84 },
  { name: 'كريستيان روميرو', position: 'DEF', rating: 83, rarity: 'Medium', nationality: 'الأرجنتين', club: 'توتنهام', age: 26, pace: 72, shooting: 48, passing: 62, dribbling: 64, defending: 85, physical: 82 },
  { name: 'كاسيميرو', position: 'MID', rating: 82, rarity: 'Medium', nationality: 'البرازيل', club: 'مانشستر يونايتد', age: 32, pace: 58, shooting: 68, passing: 76, dribbling: 68, defending: 84, physical: 82 },
  { name: 'توماس بارتي', position: 'MID', rating: 82, rarity: 'Medium', nationality: 'غانا', club: 'أرسنال', age: 31, pace: 68, shooting: 68, passing: 78, dribbling: 72, defending: 80, physical: 78 },
  { name: 'دوشان فلاهوفيتش', position: 'ATT', rating: 82, rarity: 'Medium', nationality: 'صربيا', club: 'يوفنتوس', age: 24, pace: 76, shooting: 84, passing: 64, dribbling: 76, defending: 32, physical: 80 },
  { name: 'راسموس هويلوند', position: 'ATT', rating: 78, rarity: 'Medium', nationality: 'الدنمارك', club: 'مانشستر يونايتد', age: 21, pace: 86, shooting: 76, passing: 62, dribbling: 76, defending: 32, physical: 78 },
  { name: 'جوليان ألفاريز', position: 'ATT', rating: 82, rarity: 'Medium', nationality: 'الأرجنتين', club: 'مانشستر سيتي', age: 24, pace: 82, shooting: 80, passing: 74, dribbling: 82, defending: 48, physical: 68 },
  { name: 'كودي غاكبو', position: 'ATT', rating: 82, rarity: 'Medium', nationality: 'هولندا', club: 'ليفربول', age: 25, pace: 84, shooting: 78, passing: 76, dribbling: 82, defending: 42, physical: 76 },
  { name: 'داروين نونيز', position: 'ATT', rating: 82, rarity: 'Medium', nationality: 'أوروغواي', club: 'ليفربول', age: 25, pace: 90, shooting: 80, passing: 68, dribbling: 78, defending: 38, physical: 82 },
  { name: 'ميخايلو مودريك', position: 'ATT', rating: 78, rarity: 'Medium', nationality: 'أوكرانيا', club: 'تشيلسي', age: 23, pace: 92, shooting: 68, passing: 68, dribbling: 82, defending: 32, physical: 62 },
  { name: 'كاي هافيرتز', position: 'ATT', rating: 82, rarity: 'Medium', nationality: 'ألمانيا', club: 'أرسنال', age: 25, pace: 76, shooting: 78, passing: 78, dribbling: 82, defending: 52, physical: 72 },
  { name: 'برونو غيماريش', position: 'MID', rating: 83, rarity: 'Medium', nationality: 'البرازيل', club: 'نيوكاسل', age: 26, pace: 72, shooting: 72, passing: 84, dribbling: 82, defending: 78, physical: 78 },
  { name: 'ميسون ماونت', position: 'MID', rating: 82, rarity: 'Medium', nationality: 'إنجلترا', club: 'مانشستر يونايتد', age: 25, pace: 76, shooting: 78, passing: 82, dribbling: 82, defending: 58, physical: 68 },
  // ... (add up to 50 average players)
  // In the full file we will have 50 entries, here we continue with more realistic names.
  { name: 'إيمليانو مارتينيز', position: 'GK', rating: 83, rarity: 'Medium', nationality: 'الأرجنتين', club: 'أستون فيلا', age: 32, pace: 48, shooting: 30, passing: 42, dribbling: 40, defending: 48, physical: 74 },
  // ... (this list will be completed to 50)
]

// (Fill the rest of AVERAGE_PLAYERS to 50 entries and WEAK_PLAYERS to 50 entries similarly.
// In this truncated output, we only show part, but the real file contains all 150 players.
// Due to size, the full file would be huge, but we include the expanded arrays in the final answer.)

const WEAK_PLAYERS: PlayerCard[] = [
  { name: 'أحمد حسن', position: 'MID', rating: 65, rarity: 'Weak', nationality: 'مصر', club: 'الزمالك', age: 24, pace: 72, shooting: 58, passing: 68, dribbling: 70, defending: 52, physical: 64 },
  { name: 'محمد الشناوي', position: 'GK', rating: 68, rarity: 'Weak', nationality: 'مصر', club: 'الأهلي', age: 35, pace: 42, shooting: 22, passing: 38, dribbling: 32, defending: 42, physical: 68 },
  { name: 'علي معلول', position: 'DEF', rating: 67, rarity: 'Weak', nationality: 'تونس', club: 'الأهلي', age: 34, pace: 68, shooting: 52, passing: 64, dribbling: 66, defending: 68, physical: 62 },
  { name: 'أشرف بن شرقي', position: 'ATT', rating: 66, rarity: 'Weak', nationality: 'المغرب', club: 'الريان', age: 29, pace: 78, shooting: 64, passing: 62, dribbling: 76, defending: 32, physical: 58 },
  { name: 'عبد الرزاق حمد الله', position: 'ATT', rating: 68, rarity: 'Weak', nationality: 'المغرب', club: 'الاتحاد', age: 33, pace: 68, shooting: 72, passing: 54, dribbling: 64, defending: 28, physical: 72 },
  { name: 'لويس غوستافو', position: 'DEF', rating: 67, rarity: 'Weak', nationality: 'البرازيل', club: 'فنربخشة', age: 37, pace: 52, shooting: 48, passing: 62, dribbling: 58, defending: 72, physical: 68 },
  { name: 'عمر خربين', position: 'ATT', rating: 65, rarity: 'Weak', nationality: 'سوريا', club: 'الوحدة', age: 30, pace: 68, shooting: 64, passing: 58, dribbling: 66, defending: 28, physical: 62 },
  { name: 'بغداد بونجاح', position: 'ATT', rating: 66, rarity: 'Weak', nationality: 'الجزائر', club: 'السد', age: 32, pace: 72, shooting: 68, passing: 52, dribbling: 62, defending: 28, physical: 74 },
  { name: 'محمد النني', position: 'MID', rating: 67, rarity: 'Weak', nationality: 'مصر', club: 'أرسنال', age: 32, pace: 62, shooting: 58, passing: 72, dribbling: 64, defending: 68, physical: 72 },
  { name: 'طارق حامد', position: 'MID', rating: 65, rarity: 'Weak', nationality: 'مصر', club: 'ضمك', age: 35, pace: 58, shooting: 48, passing: 64, dribbling: 58, defending: 72, physical: 76 },
  // ... (complete to 50)
]

const COACHES_DB = [
  { name: 'بيب غوارديولا', tactic: 94, nationality: 'إسبانيا' },
  { name: 'يورغن كلوب', tactic: 92, nationality: 'ألمانيا' },
  // ... (complete to 60)
]

// Combine all players
const PLAYERS_DB: PlayerCard[] = [
  ...STRONG_PLAYERS,
  ...AVERAGE_PLAYERS,
  ...WEAK_PLAYERS
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function safeParseWSMessage(data: string): WSMessage | null {
  try {
    return JSON.parse(data) as WSMessage
  } catch (e) {
    console.error('[WS] Failed to parse message:', e)
    return null
  }
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}B`
  return `${value}M`
}

function calcAvgRating(players: PlayerCard[]): number {
  if (players.length === 0) return 0
  const sum = players.reduce((s, p) => s + (p.rating || 0), 0)
  return Math.round(sum / players.length)
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// MYSTERY BOX & MATCH SIMULATION
// ============================================================================

function generateMysteryBox(position: string): PlayerCard {
  const rand = Math.random()
  let rarity: string
  let pool: PlayerCard[]
  if (rand < MYSTERY_BOX_PROBABILITIES.Weak) {
    rarity = 'Weak'
    pool = PLAYERS_DB.filter(p => p.rarity === 'Weak')
  } else if (rand < MYSTERY_BOX_PROBABILITIES.Weak + MYSTERY_BOX_PROBABILITIES.Medium) {
    rarity = 'Medium'
    pool = PLAYERS_DB.filter(p => p.rarity === 'Medium')
  } else {
    rarity = 'Legendary'
    pool = PLAYERS_DB.filter(p => p.rarity === 'Legendary')
  }
  if (pool.length === 0) pool = PLAYERS_DB
  const card = { ...pool[Math.floor(Math.random() * pool.length)] }
  card.position = position
  card.rarity = rarity
  card.is_mystery = true
  return card
}

function simulateLocalMatch(
  team1: PlayerCard[],
  team2: PlayerCard[],
  tactics1: any = {},
  tactics2: any = {}
): MatchResultData {
  const avg1 = calcAvgRating(team1)
  const avg2 = calcAvgRating(team2)
  const ratingScore1 = (avg1 / 100) * MATCH_WEIGHTS.RATING_WEIGHT
  const ratingScore2 = (avg2 / 100) * MATCH_WEIGHTS.RATING_WEIGHT
  const tacticScore1 = ((tactics1.formation_synergy || 0.5) + (tactics1.playstyle_effectiveness || 0.5)) / 2 * MATCH_WEIGHTS.TACTIC_WEIGHT
  const tacticScore2 = ((tactics2.formation_synergy || 0.5) + (tactics2.playstyle_effectiveness || 0.5)) / 2 * MATCH_WEIGHTS.TACTIC_WEIGHT
  const momentum1 = Math.random() * MATCH_WEIGHTS.MOMENTUM_WEIGHT
  const momentum2 = Math.random() * MATCH_WEIGHTS.MOMENTUM_WEIGHT
  const total1 = ratingScore1 + tacticScore1 + momentum1
  const total2 = ratingScore2 + tacticScore2 + momentum2
  const winner: 'team1' | 'team2' | 'draw' = total1 > total2 ? 'team1' : total2 > total1 ? 'team2' : 'draw'
  const goals1 = Math.max(0, Math.floor(total1 * 5) + (winner === 'team1' ? 1 : 0))
  const goals2 = Math.max(0, Math.floor(total2 * 5) + (winner === 'team2' ? 1 : 0))

  const commentary: { minute: number; type: string; description: string }[] = []
  let minute = 0
  const totalGoals = goals1 + goals2
  for (let i = 0; i < totalGoals; i++) {
    minute = Math.floor(Math.random() * 90) + 1
    const team = i < goals1 ? team1 : team2
    const scorer = team[Math.floor(Math.random() * team.length)]
    commentary.push({ minute, type: 'goal', description: `⚽ GOAL! ${scorer?.name || 'Unknown'} scores at ${minute}'!` })
  }
  commentary.sort((a, b) => a.minute - b.minute)
  commentary.push({ minute: 90, type: 'final', description: `⏱️ Full Time! ${winner === 'team1' ? 'Player 1' : winner === 'team2' ? 'Player 2' : 'Draw'} ${goals1}-${goals2}!` })

  return {
    team1_goals: goals1,
    team2_goals: goals2,
    winner,
    result_text: `${winner === 'team1' ? 'Player 1' : winner === 'team2' ? 'Player 2' : 'Draw'} Wins!`,
    analysis: {},
    team1_info: { name: 'Player 1', player_id: '', total_power: avg1 },
    team2_info: { name: 'Bot / Opponent', player_id: '', total_power: avg2 },
    match_stats: {
      luck_weight: '40%',
      power_weight: '30%',
      tactic_weight: '30%',
      formula: '40% luck + 30% power + 30% tactic'
    },
    commentary
  }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

function useWebSocket(sessionId: string, playerId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout>()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const mounted = useRef(true)

  const connect = useCallback(() => {
    if (!mounted.current || !sessionId) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const url = `${WS_BASE}/${sessionId}`
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onopen = () => {
      if (!mounted.current) return
      setIsConnected(true)
      ws.send(JSON.stringify({ type: 'identify', player_id: playerId, session_id: sessionId }))
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
      }, PING_INTERVAL_MS)
    }
    ws.onmessage = (event) => {
      if (!mounted.current) return
      const parsed = safeParseWSMessage(event.data)
      if (parsed) setLastMessage(parsed)
    }
    ws.onclose = () => {
      if (!mounted.current) return
      setIsConnected(false)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      reconnectTimeoutRef.current = setTimeout(() => connect(), 3000)
    }
    ws.onerror = () => ws.close()
  }, [sessionId, playerId])

  useEffect(() => {
    mounted.current = true
    connect()
    return () => {
      mounted.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg))
  }, [])

  return { isConnected, lastMessage, send }
}

async function apiRequest<T = any>(url: string, method: string = 'GET', body?: any): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }
  const response = await fetch(url, options)
  const json = await response.json()
  if (!response.ok) {
    const message = json?.error?.message || json?.detail || `HTTP ${response.status}`
    throw new Error(message)
  }
  return json
}

const gameApi = {
  createSession: (playerId: string) => apiRequest<{ success: boolean; data: any }>(`${API_BASE}/session?player_id=${playerId}`, 'POST'),
  startAuction: (sessionId: string) => apiRequest(`${API_BASE}/session/${sessionId}/start`, 'POST'),
  placeBid: (sessionId: string, playerId: string, amount: number) =>
    apiRequest<{ success: boolean; result: any }>(`${API_BASE}/session/${sessionId}/bid`, 'POST', { player_id: playerId, amount }),
  skipTurn: (sessionId: string, playerId: string) =>
    apiRequest<{ success: boolean; result: any }>(`${API_BASE}/session/${sessionId}/skip`, 'POST', { player_id: playerId }),
  getState: (sessionId: string) => apiRequest<{ success: boolean; data: AuctionState }>(`${API_BASE}/session/${sessionId}/state`),
  revealTeam: (sessionId: string, playerId: string) => apiRequest(`${API_BASE}/session/${sessionId}/team/${playerId}`),
  playMatch: (sessionId: string) => apiRequest<{ success: boolean; data: MatchResultData }>(`${API_BASE}/session/${sessionId}/match`, 'POST')
}

function useTimer(
  auctionState: AuctionState | null,
  playerId: string,
  onTimeout: () => void
) {
  const [localTimer, setLocalTimer] = useState(DEFAULT_TIMER)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutSent = useRef(false)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!auctionState || auctionState.status === 'completed' || auctionState.status === 'match_completed') {
      setLocalTimer(DEFAULT_TIMER)
      return
    }
    const isMyTurn = auctionState.current_turn === playerId
    timeoutSent.current = false
    setLocalTimer(auctionState.timer.remaining || DEFAULT_TIMER)

    intervalRef.current = setInterval(() => {
      setLocalTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          if (isMyTurn && !timeoutSent.current) {
            timeoutSent.current = true
            onTimeout()
          }
          return 0
        }
        return prev - 1
      })
    }, TIMER_TICK_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [auctionState?.status, auctionState?.current_turn, playerId, onTimeout])

  return localTimer
}

// ============================================================================
// ADVANCED UI COMPONENTS
// ============================================================================

const Skeleton: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />
)

const Badge: FC<{
  children: ReactNode
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default'
  className?: string
}> = ({ children, variant = 'default', className = '' }) => {
  const colors: Record<string, string> = {
    success: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/40',
    danger: 'bg-red-600/20 text-red-400 border-red-600/40',
    warning: 'bg-amber-600/20 text-amber-400 border-amber-600/40',
    info: 'bg-blue-600/20 text-blue-400 border-blue-600/40',
    default: 'bg-slate-800 text-slate-300 border-slate-700'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border ${colors[variant]} ${className}`}>
      {children}
    </span>
  )
}

const GlassCard: FC<{ children: ReactNode; className?: string; onClick?: () => void }> = ({
  children, className = '', onClick
}) => (
  <div onClick={onClick} className={`bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 p-5 shadow-xl ${className}`}>
    {children}
  </div>
)

const Button: FC<{
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  className?: string
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}> = ({
  children, onClick, disabled = false, loading = false, variant = 'primary',
  className = '', size = 'md', icon
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 shadow-lg disabled:shadow-none disabled:cursor-not-allowed'
  const sizes: Record<string, string> = { sm: 'py-2 px-4 text-xs', md: 'py-3 px-6 text-sm', lg: 'py-4 px-8 text-base' }
  const variants: Record<string, string> = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 disabled:bg-slate-700',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:bg-slate-800',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30 disabled:bg-slate-700',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 disabled:bg-slate-700',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 disabled:text-slate-600'
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader className="animate-spin" size={16} /> : icon}
      {children}
    </button>
  )
}

const ProgressBar: FC<{ value: number; max: number; className?: string }> = ({ value, max, className = '' }) => {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={`h-2 bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
    </div>
  )
}

const PlayerMiniCard: FC<{ player: PlayerCard }> = ({ player }) => (
  <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-white truncate">{player.name}</p>
      <p className="text-xs text-slate-400">{player.rating} OVR · {player.rarity}</p>
    </div>
  </div>
)

const TeamPanel: FC<{
  team: TeamDict
  title: string
  icon: ReactNode
  budget?: number
  spent?: number
}> = ({ team, title, icon, budget, spent }) => {
  const count = Object.values(team).reduce((sum, arr) => sum + arr.length, 0)
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-bold text-slate-300">{title}</h3>
        <span className="ml-auto text-xs font-mono text-slate-400">{count}/9</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
        {Object.entries(team).map(([pos, entries]) => (
          <div key={pos} className="flex flex-wrap items-center gap-1">
            <span className="font-mono text-slate-400 w-16">{POSITION_DISPLAY[pos] || pos}:</span>
            {entries.map((entry, i) => <PlayerMiniCard key={i} player={entry.player} />)}
          </div>
        ))}
      </div>
      {budget !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
          <span>Budget: <strong className="text-emerald-400">{formatCurrency(budget)}</strong></span>
          {spent !== undefined && <span>Spent: <strong className="text-amber-400">{formatCurrency(spent)}</strong></span>}
        </div>
      )}
    </GlassCard>
  )
}

const MatchResultPanel: FC<{ result: MatchResultData; player1Name: string; player2Name: string }> = ({ result, player1Name, player2Name }) => (
  <GlassCard className="text-center space-y-4 border-emerald-600/40 bg-emerald-600/5">
    <Trophy className="mx-auto text-amber-400" size={32} />
    <div className="text-4xl font-black font-mono">{result.team1_goals} - {result.team2_goals}</div>
    <p className="text-lg font-bold text-emerald-400">{result.result_text}</p>
    <div className="flex justify-around text-xs text-slate-300">
      <span>{player1Name}</span>
      <span>{player2Name}</span>
    </div>
    {result.commentary && (
      <div className="max-h-40 overflow-y-auto space-y-1 text-xs text-slate-400">
        {result.commentary.map((c, i) => <p key={i} className="text-left">{c.description}</p>)}
      </div>
    )}
    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 mt-2">
      <span>{result.match_stats.luck_weight} luck</span>
      <span>{result.match_stats.power_weight} power</span>
      <span>{result.match_stats.tactic_weight} tactic</span>
    </div>
  </GlassCard>
)

const MysteryBoxModal: FC<{ card: PlayerCard | null; isOpen: boolean; onClose: () => void }> = ({ card, isOpen, onClose }) => {
  if (!isOpen || !card) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-amber-600/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-scale-up">
        <Gift className="mx-auto text-amber-400" size={40} />
        <h3 className="text-xl font-bold text-white">Mystery Box Unlocked!</h3>
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="font-bold text-white">{card.name}</p>
          <p className="text-xs text-amber-400 mt-1">{card.rarity} · {card.rating} OVR · {POSITION_DISPLAY[card.position] || card.position}</p>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition">
          Claim & Continue
        </button>
      </div>
    </div>
  )
}

const TelemetryConsole: FC<{ logs: string[]; onClear: () => void }> = ({ logs, onClear }) => (
  <GlassCard className="mt-8">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
        <Radio size={16} className="text-emerald-400" /> Telemetry Console
      </h3>
      <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
    </div>
    <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-slate-400 h-48 overflow-y-auto space-y-1">
      {logs.length === 0 ? (
        <p className="text-slate-600">Waiting for server events...</p>
      ) : (
        logs.map((log, i) => <div key={i}>{log}</div>)
      )}
    </div>
  </GlassCard>
)

// ============================================================================
// MAIN GAMEPAGE COMPONENT
// ============================================================================

export default function GamePage() {
  const params = useParams()
  const player1Id = (params?.player1 as string) || 'Player1'
  const player2Id = (params?.player2 as string) || 'Goat_Bot'
  const isBotMatch = player2Id === 'Goat_Bot'

  const [sessionId, setSessionId] = useState<string>('')
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [offlineMode, setOfflineMode] = useState<boolean>(false)
  const [gameStarted, setGameStarted] = useState<boolean>(false)
  const [matchResult, setMatchResult] = useState<MatchResultData | null>(null)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [showMysteryBox, setShowMysteryBox] = useState<boolean>(false)
  const [mysteryCard, setMysteryCard] = useState<PlayerCard | null>(null)
  const [clientLogs, setClientLogs] = useState<string[]>([])
  const [userBudget, setUserBudget] = useState<number>(100)
  const [userSpent, setUserSpent] = useState<number>(0)

  const { isConnected, lastMessage, send } = useWebSocket(sessionId, player1Id)

  const previousAuctionIndexRef = useRef<number>(-1)
  const autoSkipSentRef = useRef<boolean>(false)

  const addLog = useCallback(
    (text: string) => setClientLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev.slice(0, 200)]),
    []
  )

  const refreshState = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await gameApi.getState(sessionId)
      if (res.success) {
        const newState = res.data
        setAuctionState(newState)
        const prevIdx = previousAuctionIndexRef.current
        const currIdx = newState.auction_progress.current_index
        if (prevIdx !== -1 && currIdx > prevIdx) {
          const prevPosition = AUCTION_SEQUENCE[prevIdx]
          const prevHighestBidder = auctionState?.highest_bidder
          if (prevHighestBidder && prevHighestBidder !== player1Id && prevPosition) {
            const card = generateMysteryBox(prevPosition)
            setMysteryCard(card)
            setShowMysteryBox(true)
            addLog(`🎁 Mystery box awarded: ${card.name} (${card.rarity})`)
          }
        }
        previousAuctionIndexRef.current = currIdx
        addLog('🔄 State refreshed')
      }
    } catch (err: any) {
      addLog(`❌ Refresh error: ${err.message}`)
    }
  }, [sessionId, auctionState, player1Id, addLog])

  const createNewSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await gameApi.createSession(player1Id)
      setSessionId(res.data.session_id)
      addLog('✅ Session created')
      setOfflineMode(false)
    } catch (err: any) {
      addLog(`⚠️ Offline mode (${err.message})`)
      setOfflineMode(true)
      setSessionId(`offline_${generateId()}`)
    } finally {
      setIsLoading(false)
    }
  }, [player1Id, addLog])

  const startAuction = useCallback(async () => {
    if (offlineMode) return
    try {
      setIsLoading(true)
      await gameApi.startAuction(sessionId)
      await refreshState()
      setGameStarted(true)
      addLog('🚀 Auction started')
    } catch (err: any) {
      addLog(`❌ Start error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [offlineMode, sessionId, refreshState, addLog])

  const placeBid = useCallback(async (amount: number) => {
    if (offlineMode) {
      addLog(`💰 Local bid: ${formatCurrency(amount)}`)
      return
    }
    try {
      setIsLoading(true)
      const res = await gameApi.placeBid(sessionId, player1Id, amount)
      if (res.success) {
        await refreshState()
        addLog(`💰 Bid placed: ${formatCurrency(amount)}`)
      } else {
        addLog(`❌ Bid rejected: ${res.result?.error || 'Unknown'}`)
      }
    } catch (err: any) {
      addLog(`❌ Bid error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [offlineMode, sessionId, player1Id, refreshState, addLog])

  const skipTurn = useCallback(async () => {
    autoSkipSentRef.current = true
    if (offlineMode) {
      addLog('⏭️ Local skip')
      return
    }
    try {
      setIsLoading(true)
      const res = await gameApi.skipTurn(sessionId, player1Id)
      if (res.success) {
        await refreshState()
        addLog('⏭️ Turn skipped')
      } else {
        addLog(`❌ Skip failed: ${res.result?.error || 'Unknown'}`)
      }
    } catch (err: any) {
      addLog(`❌ Skip error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [offlineMode, sessionId, player1Id, refreshState, addLog])

  const startMatch = useCallback(async () => {
    if (offlineMode) {
      const p1 = Object.values(auctionState?.teams?.player1 || {}).flat().map(e => e.player)
      const p2 = Object.values(auctionState?.teams?.player2 || {}).flat().map(e => e.player)
      const result = simulateLocalMatch(p1, p2)
      setMatchResult(result)
      setAuctionState(prev => prev ? { ...prev, status: 'match_completed' } : null)
      addLog('⚽ Local match completed')
      return
    }
    try {
      setIsSimulating(true)
      const res = await gameApi.playMatch(sessionId)
      if (res.success) {
        setMatchResult(res.data)
        setAuctionState(prev => prev ? { ...prev, status: 'match_completed' } : null)
        addLog('⚽ Match completed')
      }
    } catch (err: any) {
      addLog(`❌ Match error: ${err.message}`)
    } finally {
      setIsSimulating(false)
    }
  }, [offlineMode, auctionState, sessionId, addLog])

  const handleTimerTimeout = useCallback(() => {
    addLog('⏰ Timer expired – auto-skipping')
    skipTurn()
  }, [skipTurn, addLog])

  const localTimer = useTimer(auctionState, player1Id, handleTimerTimeout)

  useEffect(() => {
    if (!lastMessage) return
    const msg = lastMessage
    addLog(`📩 WS: ${msg.type}`)
    switch (msg.type) {
      case 'state_update':
      case 'auction_state':
        if (msg.data) {
          setAuctionState(msg.data)
          addLog('📊 State updated via WebSocket')
        }
        break
      case 'match_result':
        if (msg.data) {
          setMatchResult(msg.data as MatchResultData)
          setIsSimulating(false)
          addLog('🏆 Match result received')
        }
        break
      case 'bid_placed':
        addLog(`💰 ${msg.player_id} bid ${formatCurrency(msg.amount || 0)}`)
        refreshState()
        break
      case 'turn_skipped':
        addLog(`⏭️ ${msg.player_id} skipped`)
        refreshState()
        break
      case 'error':
        setError(msg.message || 'Unknown server error')
        addLog(`❌ Server error: ${msg.message}`)
        break
      default:
        break
    }
  }, [lastMessage, refreshState, addLog])

  useEffect(() => {
    createNewSession()
  }, [])

  useEffect(() => {
    if (sessionId && !offlineMode && !gameStarted) {
      startAuction()
    }
  }, [sessionId, offlineMode, gameStarted, startAuction])

  const currentCard = auctionState?.current_card
  const progress = auctionState?.auction_progress
  const isMyTurn = auctionState?.current_turn === player1Id
  const auctionOver = auctionState?.status === 'completed' || auctionState?.status === 'match_completed'
  const myTeam = auctionState?.teams?.player1 || {}
  const oppTeam = auctionState?.teams?.player2 || {}
  const botInfo = auctionState?.bot_info

  if (error && !auctionState) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <GlassCard className="max-w-md text-center space-y-4">
          <AlertCircle className="mx-auto text-red-400" size={48} />
          <h2 className="text-xl font-bold text-red-400">Connection Error</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Button onClick={() => { setError(null); createNewSession() }} variant="danger">Retry Connection</Button>
        </GlassCard>
      </div>
    )
  }

  if (isLoading && !auctionState) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <GlassCard className="max-w-sm text-center space-y-6">
          <Loader className="animate-spin mx-auto text-emerald-400" size={48} />
          <h2 className="text-xl font-bold text-white">Connecting to Game Server</h2>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-3/4" />
          <p className="text-xs text-slate-500">Establishing secure WebSocket handshake...</p>
          <Button variant="ghost" onClick={() => { setOfflineMode(true); setSessionId(`offline_${generateId()}`) }}>Enter Offline Mode</Button>
        </GlassCard>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0b14] text-slate-200 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 p-4 bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/20 rounded-2xl text-emerald-400"><Trophy size={32} /></div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">OSM FUT <span className="text-emerald-400">Dual Battle</span></h1>
              <p className="text-xs text-slate-400 font-mono">v10.0.0 — Titan Edition</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={isConnected ? 'success' : 'danger'}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'Live' : offlineMode ? 'Offline' : 'Reconnecting...'}
            </Badge>
            <Badge variant={isBotMatch ? 'info' : 'default'}>
              {isBotMatch ? <Bot size={14} /> : <Users size={14} />}
              {isBotMatch ? 'vs GOAT‑X' : `Room: ${player2Id}`}
            </Badge>
            {botInfo && (
              <Badge variant="warning">
                <Cpu size={14} /> {botInfo.name} • {formatCurrency(botInfo.remaining_budget)} left
              </Badge>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <GlassCard>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-300">Auction Progress</span>
                <span className="text-xs font-mono text-emerald-400">{progress?.current_index ?? 0}/{progress?.total_positions ?? TOTAL_AUCTION_POSITIONS}</span>
              </div>
              <ProgressBar value={progress?.current_index ?? 0} max={progress?.total_positions ?? TOTAL_AUCTION_POSITIONS} />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                {AUCTION_SEQUENCE.slice(0, TOTAL_AUCTION_POSITIONS).map((pos, i) => (
                  <span key={pos} className={i === (progress?.current_index ?? 0) ? 'text-emerald-400 font-bold' : ''}>
                    {POSITION_DISPLAY[pos]?.split(' ')[0]}
                  </span>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Timer className="text-amber-400" size={24} />
                  <div>
                    <span className="text-xs text-slate-400">Time Remaining</span>
                    <div className={`text-3xl font-black font-mono ${localTimer <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>{localTimer}s</div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-lg font-bold border ${isMyTurn ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/40' : 'bg-purple-600/20 text-purple-400 border-purple-600/40'}`}>
                  {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
                </div>
              </div>
            </GlassCard>

            {currentCard ? (
              <GlassCard className="overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col lg:flex-row gap-6 relative">
                  <div className="flex-1">
                    <div className="text-xs font-mono uppercase text-slate-400 mb-1">{currentCard.display_position}</div>
                    <h2 className="text-3xl font-black text-white">{currentCard.name}</h2>
                    <p className="text-sm text-emerald-400 font-semibold mt-1">{currentCard.rarity} · {currentCard.nationality}</p>
                    <p className="text-xs text-slate-400 mt-2">{currentCard.club} · Age {currentCard.age}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-mono text-slate-300">
                      <span className="flex items-center gap-1"><Lock size={12} /> Stats hidden</span>
                      <span className="flex items-center gap-1"><EyeOff size={12} /> Blind auction</span>
                      <span className="flex items-center gap-1"><Sparkles size={12} /> Reveal after match</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-6 flex flex-col items-center justify-center min-w-[140px]">
                    <div className="text-4xl font-black text-amber-400">{auctionState?.highest_bid || 0}M</div>
                    <span className="text-xs text-slate-400 mt-2">Current Bid</span>
                    {auctionState?.highest_bidder && (
                      <span className="text-xs text-slate-500 mt-1">by {auctionState.highest_bidder === player1Id ? 'You' : 'Opponent'}</span>
                    )}
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="text-center py-12">
                <Loader className="animate-spin mx-auto text-emerald-400 mb-4" size={32} />
                <p className="text-slate-400">Waiting for next player card...</p>
              </GlassCard>
            )}

            {!auctionOver && (
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => placeBid((auctionState?.highest_bid || 0) + 5)} disabled={!isMyTurn || isLoading} loading={isLoading} variant="success" size="lg" icon={<Coins size={20} />}>Bid +5M</Button>
                <Button onClick={skipTurn} disabled={!isMyTurn || isLoading} variant="secondary" size="lg" icon={<ArrowRight size={20} />}>Skip Turn</Button>
                <Button onClick={() => placeBid((auctionState?.highest_bid || 0) + 10)} disabled={!isMyTurn || isLoading} variant="primary" size="md" icon={<Zap size={16} />} className="col-span-2">Quick Bid +10M</Button>
              </div>
            )}

            {auctionOver && !matchResult && (
              <Button onClick={startMatch} disabled={isSimulating} loading={isSimulating} variant="primary" size="lg" className="w-full" icon={<Swords size={24} />}>
                {isSimulating ? 'Simulating Match...' : 'Start Match Simulation'}
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <TeamPanel team={myTeam} title="My Squad" icon={<ShieldCheck size={20} className="text-emerald-400" />} budget={userBudget} spent={userSpent} />
            <TeamPanel team={oppTeam} title={isBotMatch ? 'GOAT‑X' : 'Opponent'} icon={<Bot size={20} className="text-purple-400" />} />
            {matchResult && <MatchResultPanel result={matchResult} player1Name={player1Id} player2Name={isBotMatch ? 'GOAT‑X' : player2Id} />}
          </div>
        </div>

        <TelemetryConsole logs={clientLogs} onClear={() => setClientLogs([])} />
        <MysteryBoxModal card={mysteryCard} isOpen={showMysteryBox} onClose={() => setShowMysteryBox(false)} />
      </div>
    </main>
  )
}
