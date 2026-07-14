# OSM FUT Dual Battle - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PLAYERS (Browser)                       │
│                   https://sot-xxx.vercel.app                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTPS + WebSocket
                        │
        ┌───────────────┴──────────────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────┐              ┌───────────────────────┐
│  FRONTEND        │              │  BACKEND (FastAPI)    │
│  (Vercel)        │◄─WebSocket──►│  (Render)             │
│                  │              │                       │
│ • Next.js        │   REST API   │ • WebSocket Server    │
│ • React          ├─────────────►│ • Game Logic          │
│ • Tailwind CSS   │              │ • Match Engine        │
│ • Zustand Store  │              │ • Mystery Cards       │
│ • Dark Mode UI   │              │ • Commentary Gen      │
└──────────────────┘              └──────────┬────────────┘
                                            │
                                            ▼
                                   ┌────────────────┐
                                   │  Database      │
                                   │  (SQLite/      │
                                   │   PostgreSQL)  │
                                   └────────────────┘
```

## 🎯 Data Flow

### Auction Flow
```
Player 1: "Place Bid"
    ↓
[Frontend] sends via WebSocket
    ↓
[Backend] validates bid
    ↓
[Backend] updates auction state
    ↓
[Backend] broadcasts to Player 2
    ↓
[Frontend] receives update
    ↓
UI updates in real-time
```

### Match Simulation Flow
```
"Start Match" button clicked
    ↓
[Frontend] sends request
    ↓
[Backend] calculates:
  • 30% Squad Strength
  • 30% Manager Tactic
  • 40% Luck
    ↓
[Backend] generates commentary
    ↓
[Backend] sends result + commentary
    ↓
[Frontend] displays live ticker
```

## 📡 Environment Variables Map

### Frontend (Vercel) → Backend (Render)

```
Frontend Environment              Backend Environment
─────────────────────────────────────────────────────
NEXT_PUBLIC_WS_URL        ──►     Server WebSocket
NEXT_PUBLIC_API_URL       ──►     FastAPI REST API
                                  
CORS_ORIGINS              ◄──     CORS_ORIGINS
```

## 🔐 Deployment Security

| Layer | Security |
|-------|----------|
| **HTTPS** | All connections encrypted |
| **CORS** | Backend validates frontend origin |
| **WebSocket WSS** | Secure WebSocket protocol |
| **Environment Variables** | Secrets never committed to git |
| **API Keys** | RapidAPI keys stored in backend only |

---

## 📊 Deployment Platforms

### Frontend: Vercel
- **Why**: Optimized for Next.js, auto-scaling, free tier
- **Deployment**: Auto-deploy on GitHub push
- **Monitoring**: Built-in analytics
- **CDN**: Global edge network

### Backend: Render
- **Why**: Free Python hosting, auto-scaling
- **Deployment**: Auto-deploy on GitHub push
- **Monitoring**: Real-time logs
- **Database**: Optional PostgreSQL

---

## 🚀 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Frontend load time | <2s | ✅ CDN enabled |
| WebSocket latency | <100ms | ✅ Real-time |
| Bid response time | <500ms | ✅ Server-side |
| Match simulation | <2s | ✅ Pre-calculated |

---

## 📋 Service Integration Points

### Vercel → Render

1. **WebSocket Connection**
   - URL: `wss://osm-fut-backend.onrender.com/api/ws/game/{session_id}/{player_id}`
   - Protocol: WebSocket Secure
   - Authentication: Session-based

2. **REST API Calls**
   - Base URL: `https://osm-fut-backend.onrender.com/api`
   - Endpoints: `/players`, `/health`
   - Authentication: None (public)

### CORS Configuration

**Backend** must allow:
- `https://sot-xxx.vercel.app` (production frontend)
- `https://sot-xxx-staging.vercel.app` (staging, if any)

---

## 🔄 CI/CD Pipeline

```
GitHub Push
    ↓
Vercel Auto-Deploy (Frontend)
    ├─ Install dependencies
    ├─ Build Next.js app
    ├─ Run tests
    └─ Deploy to CDN
    
    AND
    
Render Auto-Deploy (Backend)
    ├─ Install Python dependencies
    ├─ Run health checks
    ├─ Deploy FastAPI
    └─ Start WebSocket server
    
    ↓
Both services live and connected
```

---

**For complete deployment instructions, see: DEPLOYMENT_GUIDE.md**
