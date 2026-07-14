# OSM FUT Dual Battle

A high-performance, real-time 1v1 tactical football auction game built with FastAPI, React, and WebSockets.

## 🎮 Game Overview

**OSM FUT Dual Battle** is an exciting turn-based auction game where two players compete to build their ultimate football team through strategic bidding. The game combines auction mechanics with a sophisticated match simulation engine featuring realistic commentary.

### Core Features

- **Turn-Based Auction System**: 30-second timer per bid with Skip functionality
- **Auction Sequence**: GK → 2 DEF → 2 MID → 2 ATT → 2 Managers
- **Mystery Card Logic**: Losers receive auto-generated cards (30% Legendary, 30% Medium, 40% Weak)
- **Match Simulation**: 30% Squad Strength + 30% Manager Tactic + 40% Luck
- **Real-time Commentary**: Dynamic text-based live match narration
- **Dark Mode UI**: Deep Navy/Slate Blue with Muted Terracotta accents
- **Audio Integration**: Stadium sounds, whistles, and auction feedback

## 🏗️ Architecture

### Backend Stack
- **Framework**: FastAPI
- **Real-time Communication**: WebSockets
- **Database**: PostgreSQL/SQLite
- **External APIs**: API-Football for player data

### Frontend Stack
- **Framework**: React/Next.js
- **Styling**: Tailwind CSS
- **State Management**: Context API + Zustand
- **Audio**: Web Audio API
- **Real-time**: Socket.IO client

## 📂 Project Structure

```
OSM-FUT-Dual-Battle/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── game/
│   │   │   ├── auction.py
│   │   │   ├── mystery_card.py
│   │   │   ├── match_engine.py
│   │   │   └── commentary.py
│   │   ├── api/
│   │   │   ├── players.py
│   │   │   └── websocket.py
│   │   └── utils/
│   │       └── constants.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker & Docker Compose (optional)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📋 Game Rules (Non-Negotiable)

### Auction Mechanics
1. Each player has 30 seconds per bid
2. Turn passes to opponent with fresh timer
3. Skip button allows pass without bidding
4. Sequence: GK → DEF → DEF → MID → MID → ATT → ATT → MGR → MGR

### Mystery Card Generation
When a player loses an auction:
- **30% Legendary** (5-star players)
- **30% Medium** (3-4 star players)
- **40% Weak** (1-2 star players)

### Match Simulation
- **30% Squad Strength**: Combined player ratings
- **30% Manager Tactic**: Manager skill & formation synergy
- **40% Luck**: Random variance for exciting outcomes

## 🎨 Design System

### Colors
- **Background**: Deep Navy (#0F1419) / Slate Blue (#1A1F2E)
- **Accent**: Muted Terracotta (#D4714D)
- **Text**: Light Gray (#E8E8E8)
- **Cards**: Charcoal (#2C2C3E)

### Typography
- **Font**: Modern Arabic Sans-Serif
- **Style**: Minimalist, flat, professional

## 📊 Development Roadmap (150 Points)

### Core (50 Points)
- ✅ WebSocket stability & 2-player sync
- ✅ CORS/image fetching error resolution
- ✅ Turn-based timer implementation
- ✅ Mystery card probability logic

### Advanced (100 Points)
- UI/UX polish & design compliance
- Tactical match analytics dashboard
- ELO ranking system
- Professional sound design
- Scalability optimization

## 👨‍💻 Developer

**Saud Yahya Al-Faifi** | 0535103986

## 📄 License

MIT

---

*Built with precision. Designed for excellence.*
