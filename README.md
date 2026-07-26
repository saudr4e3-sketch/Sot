# OSM FUT Dual Battle

A high-performance, real-time 1v1 tactical football auction game built with FastAPI, React, and WebSockets.

## 🎮 Game Overview

**OSM FUT Dual Battle** is an exciting turn-based auction game where two players compete to build their ultimate football team through strategic bidding. The game combines auction mechanics with a sophisticated match simulation engine featuring realistic commentary.

### Core Features

- **Turn-Based Auction System**: 30-second timer per bid with Skip functionality
- **Auction Sequence**: GK → CB → CB → AMF/CM → AMF/CM → CF → CF → Coach (9 rounds total)
- **Blind Auction**: Bidders see only player name and image, all stats and ratings are hidden
- **Mystery Card Logic**: Losers receive auto-generated cards (33% Weak, 33% Medium, 33% Strong, 1% Ultra Legendary)
- **Match Simulation**: 40% Luck + 30% Squad Strength + 30% Manager Tactic
- **Real-time Commentary**: Dynamic text-based live match narration
- **Dark Mode UI**: Deep Navy/Slate Blue with Muted Terracotta accents
- **Triple-Layer Image Protection**: Prevents 404 errors on Render deployment
- **Audio Integration**: Stadium sounds, whistles, and auction feedback

## 🏗️ Architecture

### Backend Stack
- **Framework**: FastAPI
- **Real-time Communication**: WebSockets (native, not Socket.IO)
- **Database**: PostgreSQL/SQLite via SQLAlchemy
- **External APIs**: API-Football for player data (optional)

### Frontend Stack
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **Audio**: Web Audio API
- **Real-time**: Native WebSocket client

## 📂 Project Structure


OSM-FUT-Dual-Battle/
├── backend/
│   ├── app/
│   │   ├── init.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── game/
│   │   │   ├── init.py
│   │   │   ├── auction.py
│   │   │   ├── mystery_card.py
│   │   │   ├── match_engine.py
│   │   │   └── commentary.py
│   │   ├── api/
│   │   │   ├── init.py
│   │   │   ├── players.py
│   │   │   └── websocket.py
│   │   └── utils/
│   │       ├── init.py
│   │       ├── constants.py
│   │       └── image_handler.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── GameRoom.tsx
│   │   │   └── ResultPage.tsx
│   │   ├── components/
│   │   │   ├── AuctionCard.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── BidControls.tsx
│   │   │   ├── TeamDisplay.tsx
│   │   │   ├── MatchCommentary.tsx
│   │   │   └── MysteryCardReveal.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useTimer.ts
│   │   │   └── useAudio.ts
│   │   ├── context/
│   │   │   └── GameContext.tsx
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── utils/
│   │   │   ├── imageFallback.ts
│   │   │   └── audioManager.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   ├── audio/
│   │   │   ├── bid-tick.mp3
│   │   │   ├── auction-win.mp3
│   │   │   ├── stadium-ambient.mp3
│   │   │   └── goal-roar.mp3
│   │   └── favicon.ico
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker & Docker Compose (optional)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

Frontend Setup
cd frontend
npm install
npm run dev

📋 Game Rules (Non-Negotiable)
Auction Mechanics
 * Both players connected via WebSocket to same game room
 * Each bid round lasts 30 seconds
 * Players can bid any amount within their budget or skip
 * Sequence strict: GK → DEF1 → DEF2 → MID1 → MID2 → ATT1 → ATT2 → MGR1 → MGR2
 * During bidding: ONLY name and image visible (blind auction)
 * After bidding: full stats revealed to both players
Mystery Card Generation
When a player loses an auction:
 * 1% Ultra Legendary (96-99 rating)
 * 33% Legendary (88-95 rating)
 * 33% Medium (75-87 rating)
 * 33% Weak (50-74 rating)
   (Total: 100% - corrected from original 90% bug)
Match Simulation
 * 40% Luck: Random variance for exciting outcomes
 * 30% Squad Strength: Combined outfield player ratings
 * 30% Manager Tactic: Manager rating + card synergy bonus
🎨 Design System
Colors
 * Background: Deep Navy (#0F1419) / Slate Blue (#1A1F2E)
 * Accent: Muted Terracotta (#D4714D)
 * Text: Light Gray (#E8E8E8)
 * Cards: Charcoal (#2C2C3E)
 * Success: Emerald (#10B981)
 * Danger: Crimson (#EF4444)
 * Warning: Amber (#F59E0B)
Typography
 * Font: 'Cairo', Modern Arabic Sans-Serif
 * Style: Minimalist, flat, professional
 * Scale: 12px / 14px / 16px / 20px / 24px / 32px / 48px
Image Protection (Triple Layer)
 * Layer 1: Original API URL with CORS proxy fallback
 * Layer 2: Dynamic SVG generator based on player initials + position
 * Layer 3: Static placeholder per position as last resort
📊 Development Roadmap (150 Points)
Core (50 Points)
 * ✅ WebSocket stability & 2-player sync
 * ✅ CORS/image fetching error resolution
 * ✅ Turn-based timer implementation
 * ✅ Mystery card probability logic (fixed to 100%)
Advanced (100 Points)
 * UI/UX polish & design compliance
 * Tactical match analytics dashboard
 * ELO ranking system
 * Professional sound design
 * Scalability optimization
👨‍💻 Developer
Saud Yahya Al-Faifi | 0535103986
📄 License
MIT
Built with precision. Designed for excellence.

