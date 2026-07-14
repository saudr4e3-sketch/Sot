from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Player Schemas
class PlayerBase(BaseModel):
    name: str
    position: str
    rating: float
    team: str
    image_url: Optional[str] = None
    nationality: Optional[str] = None
    age: Optional[int] = None
    rarity: str

class PlayerCreate(PlayerBase):
    api_id: int

class Player(PlayerBase):
    id: int
    api_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Manager Schemas
class ManagerBase(BaseModel):
    name: str
    tactic_rating: float
    image_url: Optional[str] = None
    nationality: Optional[str] = None
    experience: Optional[int] = None
    rarity: str

class ManagerCreate(ManagerBase):
    api_id: int

class Manager(ManagerBase):
    id: int
    api_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Game Session Schemas
class GameSessionCreate(BaseModel):
    player1_id: str
    player2_id: str

class GameSessionUpdate(BaseModel):
    status: Optional[str] = None
    current_turn: Optional[str] = None
    auction_index: Optional[int] = None
    player1_team: Optional[Dict[str, Any]] = None
    player2_team: Optional[Dict[str, Any]] = None
    winner_id: Optional[str] = None

class GameSession(BaseModel):
    id: str
    player1_id: str
    player2_id: str
    status: str
    current_turn: Optional[str]
    player1_team: Dict[str, Any]
    player2_team: Dict[str, Any]
    auction_index: int
    winner_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Bid Schemas
class BidCreate(BaseModel):
    session_id: str
    player_id: str
    amount: float
    card_position: int

class Bid(BidCreate):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# WebSocket Messages
class BidMessage(BaseModel):
    session_id: str
    player_id: str
    amount: float

class SkipMessage(BaseModel):
    session_id: str
    player_id: str

class MysteryCardMessage(BaseModel):
    session_id: str
    player_id: str
    card: Dict[str, Any]
    position: str

class MatchResultMessage(BaseModel):
    session_id: str
    winner_id: str
    player1_score: int
    player2_score: int
    commentary: List[str]

# Match Schemas
class MatchResult(BaseModel):
    id: int
    session_id: str
    player1_id: str
    player2_id: str
    winner_id: str
    player1_score: int
    player2_score: int
    player1_strength: float
    player2_strength: float
    player1_tactic: float
    player2_tactic: float
    player1_luck: float
    player2_luck: float
    commentary: List[Dict[str, str]]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Generic Response
class MessageResponse(BaseModel):
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
