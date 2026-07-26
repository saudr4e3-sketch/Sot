
osm-fut-dual-battle/
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
│   │   ├── utils/
│   │   │   ├── constants.py
│   │   │   └── image_handler.py  # <-- نظام حماية الصور الثلاثي
│   │   └── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── utils/
│   │   │   └── imageFallback.ts    # <-- طبقة الحماية الأمامية
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
└── README.md
```

---

النظام الخلفي (Backend - Python/FastAPI)

backend/app/utils/constants.py

```python
from enum import Enum

class Position(str, Enum):
    GK = "GK"
    DEF = "DEF"
    MID = "MID"
    ATT = "ATT"
    MGR = "MGR" # Manager

AUCTION_SEQUENCE = [
    Position.GK,
    Position.DEF, Position.DEF,
    Position.MID, Position.MID,
    Position.ATT, Position.ATT,
    Position.MGR, Position.MGR
]

TIMER_DURATION = 30 # seconds

MYSTERY_CARD_PROBABILITIES = {
    "legendary": 0.33, # خارق أسطوري (5 نجوم)
    "medium": 0.33,    # متوسط (3-4 نجوم)
    "weak": 0.33,      # ضعيف (1-2 نجمة)
    # سيتم ضبط المجموع ليكون 100% مع نسبة 1% للخارق
    "ultra_legendary": 0.01
}

MATCH_WEIGHTS = {
    "luck": 0.40,
    "players": 0.30,
    "manager": 0.30
}
```

backend/app/utils/image_handler.py

```python
import hashlib
from typing import Optional

class ImageHandler:
    """
    نظام حماية الصور بثلاث طبقات:
    1. رابط الصورة الأصلي من API.
    2. صورة SVG احتياطية تُولد محلياً حسب المركز.
    3. صورة SVG عامة عند الفشل التام.
    """
    FALLBACK_IMAGES = {
        "GK": "https://via.placeholder.com/150/000000/FFFFFF/?text=GK",
        "DEF": "https://via.placeholder.com/150/1E3A8A/FFFFFF/?text=DEF",
        "MID": "https://via.placeholder.com/150/047857/FFFFFF/?text=MID",
        "ATT": "https://via.placeholder.com/150/B91C1C/FFFFFF/?text=ATT",
        "MGR": "https://via.placeholder.com/150/4B5563/FFFFFF/?text=MGR",
        "DEFAULT": "https://via.placeholder.com/150/374151/FFFFFF/?text=PLAYER"
    }

    @staticmethod
    def get_player_image_svg(name: str, position: str) -> str:
        """طبقة 2: يولد SVG ديناميكي كلاعب احتياطي."""
        color_map = {
            "GK": "#F59E0B", "DEF": "#3B82F6", "MID": "#10B981",
            "ATT": "#EF4444", "MGR": "#6B7280"
        }
        bg_color = color_map.get(position, "#374151")
        initials = "".join([n[0] for n in name.split()[:2]]).upper()
        
        svg = f"""
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
            <rect width='100' height='100' fill='{bg_color}' rx='15'/>
            <text x='50' y='55' font-family='Arial' font-size='30' fill='white' text-anchor='middle' dominant-baseline='middle' font-weight='bold'>{initials}</text>
            <text x='50' y='80' font-family='Arial' font-size='10' fill='rgba(255,255,255,0.8)' text-anchor='middle'>{position}</text>
        </svg>
        """
        return f"data:image/svg+xml;utf8,{svg}"

    @staticmethod
    def get_secure_url(original_url: Optional[str], name: str, position: str) -> str:
        """المنسق الرئيسي الذي يضمن عدم وجود خطأ 404."""
        if original_url and original_url.startswith("http"):
            return original_url
        
        # الانتقال إلى الطبقة الثانية فوراً في حال عدم وجود رابط صحيح
        return ImageHandler.get_player_image_svg(name, position)
```

backend/app/models.py

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
import uuid

class PlayerState(str, Enum):
    IDLE = "IDLE"
    BIDDING = "BIDDING"
    WAITING = "WAITING"
    FINISHED = "FINISHED"

class Card(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    position: str
    rating: int
    image_url: Optional[str] = None
    secure_image_url: Optional[str] = None # الرابط الآمن بعد المعالجة

class AuctionCard(Card):
    displayName: str # الاسم فقط أثناء المزاد
    displayImage: str # الصورة فقط أثناء المزاد
    # الطاقات والأرقام محذوفة نهائياً هنا لضمان المزاد الأعمى

class Team(BaseModel):
    player_id: str
    cards: List[Card] = []
    budget: float = 100.0 # مليون

class GameState(BaseModel):
    game_id: str
    players: Dict[str, Team] = {}
    current_auction_index: int = 0
    current_card: Optional[AuctionCard] = None
    current_bidder: Optional[str] = None
    current_bid: float = 0.0
    timer: int = 30
    status: str = "waiting"
```

backend/app/game/mystery_card.py

```python
import random
from typing import List
from ..models import Card
from ..utils.constants import MYSTERY_CARD_PROBABILITIES

class MysteryCardGenerator:
    def __init__(self):
        self.legendary_names = ["زيدان الظواهري", "مارادونا الصحراء", "بيليه العرب"]
        self.medium_names = ["سامي الجابر", "ياسر القحطاني", "نواف التمياط"]
        self.weak_names = ["لاعب ناشئ", "موهبة محلية", "مغمور"]

    def generate_card(self, position: str) -> Card:
        rand = random.random()
        cumulative = 0.0
        card_type = "weak"
        
        for c_type, prob in MYSTERY_CARD_PROBABILITIES.items():
            cumulative += prob
            if rand < cumulative:
                card_type = c_type
                break
        
        if card_type == "ultra_legendary":
            return Card(
                name=random.choice(self.legendary_names),
                position=position,
                rating=random.randint(96, 99),
                image_url="https://api-football.com/legend.png"
            )
        elif card_type == "legendary":
            return Card(
                name=random.choice(self.legendary_names),
                position=position,
                rating=random.randint(88, 95),
                image_url="https://api-football.com/legend.png"
            )
        elif card_type == "medium":
            return Card(
                name=random.choice(self.medium_names),
                position=position,
                rating=random.randint(75, 87),
                image_url="https://api-football.com/medium.png"
            )
        else:
            return Card(
                name=random.choice(self.weak_names),
                position=position,
                rating=random.randint(50, 74),
                image_url="https://api-football.com/weak.png"
            )
```

backend/app/game/match_engine.py

```python
import random
from typing import List, Dict
from ..models import Card, Team
from ..utils.constants import MATCH_WEIGHTS

class MatchEngine:
    @staticmethod
    def calculate_squad_strength(cards: List[Card]) -> float:
        if not cards:
            return 50.0
        return sum(c.rating for c in cards) / len(cards)

    @staticmethod
    def simulate_match(team1: Team, team2: Team) -> Dict:
        # 1. حساب قوة الفريق (30%)
        strength1 = MatchEngine.calculate_squad_strength(team1.cards)
        strength2 = MatchEngine.calculate_squad_strength(team2.cards)
        strength_factor = (strength1 - strength2) * 0.3

        # 2. قوة المدرب (30%) - نفترض أن المدرب هو آخر بطاقة
        mgr1 = next((c for c in team1.cards if c.position == "MGR"), None)
        mgr2 = next((c for c in team2.cards if c.position == "MGR"), None)
        mgr_rating1 = mgr1.rating if mgr1 else 70
        mgr_rating2 = mgr2.rating if mgr2 else 70
        manager_factor = (mgr_rating1 - mgr_rating2) * 0.3

        # 3. الحظ (40%)
        luck_factor = (random.uniform(-30, 30)) * 0.4

        # النتيجة النهائية
        team1_score = 50 + strength_factor + manager_factor + luck_factor
        team2_score = 50 - (strength_factor + manager_factor + luck_factor)

        # توليد الأهداف بناءً على النتيجة
        goals1 = max(0, int((team1_score / 100) * 5))
        goals2 = max(0, int((team2_score / 100) * 5))
        
        # تحديد الفائز
        if team1_score > team2_score:
            winner = team1.player_id
        elif team2_score > team1_score:
            winner = team2.player_id
        else:
            winner = "draw"

        return {
            "winner": winner,
            "score": f"{goals1} - {goals2}",
            "stats": {
                "strength_diff": round(strength_factor, 2),
                "manager_diff": round(manager_factor, 2),
                "luck_factor": round(luck_factor, 2)
            }
        }
```

backend/app/api/websocket.py

```python
import asyncio
import random
from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..game.auction import AuctionManager
from ..game.mystery_card import MysteryCardGenerator
from ..game.match_engine import MatchEngine
from ..models import GameState, PlayerState, AuctionCard, Card, Team
from ..utils.constants import AUCTION_SEQUENCE, TIMER_DURATION
from ..utils.image_handler import ImageHandler

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.games: Dict[str, GameState] = {}
        self.tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, game_id: str, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = websocket
        
        if game_id not in self.games:
            self.games[game_id] = GameState(game_id=game_id)
        
        game = self.games[game_id]
        if player_id not in game.players:
            game.players[player_id] = Team(player_id=player_id)

        if len(game.players) == 2 and game.status == "waiting":
            game.status = "bidding"
            await self.start_auction_round(game_id)

    async def start_auction_round(self, game_id: str):
        game = self.games[game_id]
        game.current_auction_index = 0
        # إلغاء أي مهمة سابقة
        if game_id in self.tasks:
            self.tasks[game_id].cancel()
        self.tasks[game_id] = asyncio.create_task(self.run_auction_sequence(game_id))

    async def run_auction_sequence(self, game_id: str):
        game = self.games[game_id]
        mystery_gen = MysteryCardGenerator()

        while game.current_auction_index < len(AUCTION_SEQUENCE):
            position = AUCTION_SEQUENCE[game.current_auction_index]
            
            # توليد بطاقة المزاد الأعمى
            full_card = mystery_gen.generate_card(position)
            secure_img = ImageHandler.get_secure_url(full_card.image_url, full_card.name, position)
            
            auction_card = AuctionCard(
                **full_card.dict(),
                displayName=full_card.name,
                displayImage=secure_img
            )
            game.current_card = auction_card
            game.current_bid = random.uniform(10, 50) # سعر ابتدائي
            game.timer = TIMER_DURATION

            # إرسال بطاقة المزاد الأعمى للاعبين
            await self.broadcast(game_id, {
                "event": "new_auction",
                "card": auction_card.dict(),
                "current_bid": game.current_bid,
                "timer": game.timer,
                "position_index": game.current_auction_index
            })

            # انتظار المزايدة (30 ثانية)
            bidder = None
            for _ in range(TIMER_DURATION):
                await asyncio.sleep(1)
                game.timer -= 1
                if bidder:
                    break
            
            if not bidder:
                # لا أحد قدم عرضاً، البطاقة تحترق
                await self.broadcast(game_id, {"event": "auction_timeout"})
            else:
                winner_id = bidder
                loser_id = [p for p in game.players if p != winner_id][0]
                
                # إعطاء البطاقة للفائز
                game.players[winner_id].cards.append(full_card)
                game.players[winner_id].budget -= game.current_bid
                
                # الخاسر يحصل على بطاقة غامضة
                mystery_card = mystery_gen.generate_card(position)
                mystery_img = ImageHandler.get_secure_url(mystery_card.image_url, mystery_card.name, position)
                mystery_card.secure_image_url = mystery_img
                game.players[loser_id].cards.append(mystery_card)

                await self.broadcast(game_id, {
                    "event": "auction_end",
                    "winner": winner_id,
                    "won_card": full_card.dict(),
                    "loser": loser_id,
                    "mystery_card": mystery_card.dict()
                })

            game.current_auction_index += 1

        # انتهاء المزاد، بدء المباراة
        await self.simulate_match(game_id)

    async def simulate_match(self, game_id: str):
        game = self.games[game_id]
        p1, p2 = list(game.players.values())
        engine = MatchEngine()
        result = engine.simulate_match(p1, p2)
        
        await self.broadcast(game_id, {
            "event": "match_result",
            "result": result
        })
        game.status = "finished"

    async def broadcast(self, game_id: str, message: dict):
        game = self.games.get(game_id)
        if not game:
            return
        for player_id in game.players:
            ws = self.active_connections.get(player_id)
            if ws:
                await ws.send_json(message)

manager = ConnectionManager()
router = APIRouter()

@router.websocket("/ws/{game_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, player_id: str):
    await manager.connect(websocket, game_id, player_id)
    try:
        while True:
            data = await websocket.receive_json()
            # منطق استقبال العروض
            if data["event"] == "bid":
                game = manager.games.get(game_id)
                if game and game.current_bidder is None:
                    game.current_bidder = player_id
                    game.current_bid = data["amount"]
                    # إيقاف المؤقت
    except WebSocketDisconnect:
        # تنظيف
        pass
```

backend/app/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.websocket import router as ws_router

app = FastAPI(title="OSM FUT Dual Battle", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)

@app.get("/health")
async def health_check():
    return {"status": "100% Stable", "system": "OSM FUT Dual Battle"}
```

---

الواجهة الأمامية (Frontend - React/TypeScript)

frontend/src/utils/imageFallback.ts

```typescript
export const getPositionFallbackSVG = (name: string, position: string): string => {
  const colorMap: Record<string, string> = {
    GK: '#F59E0B',
    DEF: '#3B82F6',
    MID: '#10B981',
    ATT: '#EF4444',
    MGR: '#6B7280',
  };
  const bgColor = colorMap[position] || '#374151';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${bgColor}" rx="15"/>
      <text x="50" y="55" font-family="Arial" font-size="30" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${initials}</text>
      <text x="50" y="80" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">${position}</text>
    </svg>
  `)}`;
};

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  name: string,
  position: string
) => {
  const target = e.currentTarget;
  target.onerror = null; // منع التكرار
  target.src = getPositionFallbackSVG(name, position);
};
```

frontend/src/components/AuctionCardComponent.tsx

```typescript
import React from 'react';
import { handleImageError } from '../utils/imageFallback';

interface AuctionCardProps {
  displayName: string;
  displayImage: string;
  position: string;
}

const AuctionCardComponent: React.FC<AuctionCardProps> = ({ displayName, displayImage, position }) => {
  return (
    <div className="bg-charcoal p-6 rounded-2xl shadow-2xl w-64 text-center border border-gray-700">
      {/* أثناء المزاد: الاسم والصورة فقط، بدون طاقات أو أرقام */}
      <img
        src={displayImage}
        alt={displayName}
        className="w-32 h-32 mx-auto rounded-full object-cover mb-4 bg-gray-800"
        onError={(e) => handleImageError(e, displayName, position)}
      />
      <h3 className="text-light-gray text-xl font-bold">{displayName}</h3>
      <p className="text-muted-terracotta uppercase tracking-wider mt-1">{position}</p>
      <p className="text-xs text-gray-500 italic mt-2">القدرات مخفية</p>
    </div>
  );
};

export default AuctionCardComponent;
```

frontend/src/App.tsx

```typescript
import React, { useEffect, useState } from 'react';
import AuctionCardComponent from './components/AuctionCardComponent';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/game123/player1');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setGameState(data);
    };
    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-deep-navy text-light-gray flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-muted-terracotta mb-8">OSM FUT Dual Battle</h1>
      <p className="text-lg text-gray-400">المهندس: سعود يحيى الفيفي | 0535103986</p>
      {gameState?.event === 'new_auction' && (
        <AuctionCardComponent
          displayName={gameState.card.displayName}
          displayImage={gameState.card.displayImage}
          position={gameState.card.position}
        />
      )}
    </div>
  );
};

export default App;
```

frontend/tailwind.config.js

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0F1419',
        'slate-blue': '#1A1F2E',
        'muted-terracotta': '#D4714D',
        'light-gray': '#E8E8E8',
        'charcoal': '#2C2C3E',
      },
    },
  },
  plugins: [],
};
