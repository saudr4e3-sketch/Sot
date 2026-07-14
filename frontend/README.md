# OSM FUT Dual Battle - Frontend

🎮 **Real-time 1v1 Tactical Football Auction Game**

## 🎨 Design System Compliance (MASTER DIRECTIVE)

### Color Palette
- **Background**: Carbon Black (#0F1419) / Deep Navy (#1A1F2E)
- **Cards**: Charcoal (#2C2C3E)
- **Primary Action**: Muted Terracotta (#D4714D) ← ALL Bid/Skip/Play buttons
- **Secondary**: Champagne Gold (#D4AF9F)
- **Text**: Light Gray (#E8E8E8)

### Design Principles
- Card-based UI with soft rounded corners (12px)
- Minimalist, flat design aesthetic
- Arabic-friendly typography
- Responsive for mobile and desktop
- Smooth animations and transitions

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── game/         # Game pages
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   │   ├── Button.tsx        # Muted Terracotta buttons
│   │   │   └── Card.tsx          # Card containers
│   │   └── game/         # Game-specific components
│   │       ├── AuctionTimer.tsx       # 30-sec timer + bid controls
│   │       ├── AuctionProgress.tsx    # Sequence tracker
│   │       ├── PlayerCard.tsx         # Player card display
│   │       └── CommentaryView.tsx     # Live commentary ticker
│   ├── hooks/
│   │   └── useWebSocket.ts       # Real-time WebSocket hook
│   ├── store/
│   │   └── gameStore.ts          # Zustand state management
│   ├── types/
│   │   └── game.ts               # TypeScript interfaces
│   └── styles/
│       └── globals.css           # Global styles
├── public/
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Server starts at: **http://localhost:3000**

### Build for Production

```bash
npm run build
npm start
```

## 🔧 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_WS_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🎯 Core Features

### WebSocket-Bound Components
- **AuctionTimer**: Synced with backend 30-second timer
- **AuctionProgress**: Real-time auction sequence tracking
- **CommentaryView**: Live match ticker from backend
- **PlayerCard**: Displays real player images and data

### Responsive Design
- ✅ Mobile-first approach
- ✅ Tablet & desktop optimized
- ✅ Touch-friendly bid controls
- ✅ Smooth animations on all devices

### Game Logic Synchronization
- WebSocket listeners for all game events
- Real-time state updates via Zustand
- Automatic bid validation
- Turn-based synchronization

## 👨‍💻 Developer Signature

**MANDATORY FOOTER** (Hard-coded in all pages):
```
Developer: Saud Yahya Al-Faifi | 0535103986
```

---

*Built with precision. Designed for excellence.*
