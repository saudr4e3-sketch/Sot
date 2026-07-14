from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import Optional

Base = declarative_base()

class Player(Base):
    """Football Player Model"""
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    api_id = Column(Integer, unique=True, index=True)
    name = Column(String(255), nullable=False)
    position = Column(String(50), nullable=False)  # GK, DEF, MID, ATT
    rating = Column(Float, nullable=False)
    team = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)
    nationality = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    rarity = Column(String(50), nullable=False)  # Legendary, Medium, Weak
    created_at = Column(DateTime, default=datetime.utcnow)

class Manager(Base):
    """Football Manager Model"""
    __tablename__ = "managers"
    
    id = Column(Integer, primary_key=True, index=True)
    api_id = Column(Integer, unique=True, index=True)
    name = Column(String(255), nullable=False)
    tactic_rating = Column(Float, nullable=False)
    experience = Column(Integer, nullable=True)
    image_url = Column(String(500), nullable=True)
    nationality = Column(String(100), nullable=True)
    rarity = Column(String(50), nullable=False)  # Legendary, Medium, Weak
    created_at = Column(DateTime, default=datetime.utcnow)

class GameSession(Base):
    """Game Session Model"""
    __tablename__ = "game_sessions"
    
    id = Column(String(50), primary_key=True, index=True)
    player1_id = Column(String(100), nullable=False)
    player2_id = Column(String(100), nullable=False)
    status = Column(String(50), default="waiting")  # waiting, auction, match, completed
    current_turn = Column(String(100), nullable=True)
    player1_team = Column(JSON, default={})
    player2_team = Column(JSON, default={})
    auction_index = Column(Integer, default=0)
    winner_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Bid(Base):
    """Bid History Model"""
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("game_sessions.id"))
    player_id = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    card_position = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class MatchResult(Base):
    """Match Result Model"""
    __tablename__ = "match_results"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("game_sessions.id"))
    player1_id = Column(String(100), nullable=False)
    player2_id = Column(String(100), nullable=False)
    winner_id = Column(String(100), nullable=False)
    player1_score = Column(Integer, default=0)
    player2_score = Column(Integer, default=0)
    player1_strength = Column(Float, default=0.0)  # 30% weight
    player2_strength = Column(Float, default=0.0)
    player1_tactic = Column(Float, default=0.0)    # 30% weight
    player2_tactic = Column(Float, default=0.0)
    player1_luck = Column(Float, default=0.0)      # 40% weight
    player2_luck = Column(Float, default=0.0)
    commentary = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
