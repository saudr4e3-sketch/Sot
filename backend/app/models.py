"""
OSM FUT Dual Battle - Database Models
======================================
SQLAlchemy ORM Models with Advanced Relationships and Indexing

Features:
- Comprehensive relationship mapping between all entities
- Advanced indexing for query optimization
- Production-ready data types and constraints
- Extended fields for tactical and financial tracking
- Virtual injury and card status tracking
- Budget and resource management
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, 
    JSON, ForeignKey, Text, Enum as SQLEnum, Index, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import enum

Base = declarative_base()

# ==================== Enums ====================

class PlayerPosition(str, enum.Enum):
    """مراكز اللاعبين"""
    GK = "GK"
    DEF = "DEF"
    MID = "MID"
    ATT = "ATT"


class ManagerPosition(str, enum.Enum):
    """مراكز المدربين"""
    MGR = "MGR"


class CardRarity(str, enum.Enum):
    """ندرة البطاقات"""
    LEGENDARY = "Legendary"
    MEDIUM = "Medium"
    WEAK = "Weak"


class GameStatus(str, enum.Enum):
    """حالات جلسة اللعبة"""
    WAITING = "waiting"
    AUCTION = "auction"
    MATCH = "match"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class PlayerStatus(str, enum.Enum):
    """حالات اللاعبين الافتراضية"""
    ACTIVE = "active"
    INJURED = "injured"
    SUSPENDED = "suspended"
    FATIGUED = "fatigued"
    SUBSTITUTED = "substituted"


class InjurySeverity(str, enum.Enum):
    """شدة الإصابات"""
    LIGHT = "light"        # إصابة خفيفة (1-2 أيام)
    MODERATE = "moderate"  # إصابة متوسطة (3-5 أيام)
    SEVERE = "severe"      # إصابة شديدة (7-14 يوم)
    CRITICAL = "critical"  # إصابة حرجة (21+ يوم)


class AuctionPhase(str, enum.Enum):
    """مراحل المزاد"""
    PENDING = "pending"
    ACTIVE = "active"
    BIDDING = "bidding"
    FINALIZING = "finalizing"
    SOLD = "sold"
    SKIPPED = "skipped"
    MYSTERY = "mystery"


class CardType(str, enum.Enum):
    """أنواع البطاقات"""
    AUCTION = "auction"
    MYSTERY = "mystery"
    TRADE = "trade"
    REWARD = "reward"
    STARTER = "starter"


class ManagerStyle(str, enum.Enum):
    """أساليب المدربين"""
    POSSESSION = "استحواذ"
    COUNTER_ATTACK = "هجمة مرتدة"
    HIGH_PRESS = "ضغط عالي"
    DEFENSIVE = "دفاعي"
    BALANCED = "متوازن"
    DIRECT = "مباشر"


# ==================== النماذج الأساسية ====================

class Player(Base):
    """
    نموذج اللاعبين - Football Player Model
    
    يحتوي على معلومات شاملة عن اللاعبين بما في ذلك:
    - البيانات الأساسية (الاسم، المركز، التقييم)
    - الإحصائيات التفصيلية
    - معلومات النادي والجنسية
    - المهارات الخاصة
    """
    __tablename__ = "players"
    
    # المفاتيح الأساسية
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    api_id = Column(Integer, unique=True, index=True, nullable=True)
    
    # المعلومات الأساسية
    name = Column(String(255), nullable=False, index=True)
    position = Column(String(50), nullable=False, index=True)
    rating = Column(Float, nullable=False, index=True)
    rarity = Column(String(50), nullable=False, default=CardRarity.MEDIUM.value, index=True)
    
    # معلومات النادي والجنسية
    team = Column(String(255), nullable=False, default="Free Agent")
    nationality = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)
    preferred_foot = Column(String(20), nullable=True, default="Right")
    
    # الوسائط
    image_url = Column(String(500), nullable=True)
    card_image_url = Column(String(500), nullable=True)
    
    # الإحصائيات التفصيلية (FUT Style)
    pace = Column(Integer, nullable=True, default=75)
    shooting = Column(Integer, nullable=True, default=75)
    passing = Column(Integer, nullable=True, default=75)
    dribbling = Column(Integer, nullable=True, default=75)
    defending = Column(Integer, nullable=True, default=75)
    physical = Column(Integer, nullable=True, default=75)
    
    # إحصائيات إضافية
    stamina = Column(Integer, nullable=True, default=80)
    aggression = Column(Integer, nullable=True, default=50)
    composure = Column(Integer, nullable=True, default=70)
    vision = Column(Integer, nullable=True, default=70)
    leadership = Column(Integer, nullable=True, default=50)
    
    # القيم السوقية والعقود
    market_value = Column(Float, nullable=True, default=0.0)
    weekly_wage = Column(Float, nullable=True, default=0.0)
    contract_until = Column(DateTime, nullable=True)
    release_clause = Column(Float, nullable=True)
    
    # المهارات الخاصة
    special_traits = Column(JSON, nullable=True, default=list)
    skill_moves = Column(Integer, nullable=True, default=2)
    weak_foot_ability = Column(Integer, nullable=True, default=2)
    
    # الحالة الافتراضية
    status = Column(String(50), nullable=False, default=PlayerStatus.ACTIVE.value)
    injury_type = Column(String(100), nullable=True)
    injury_severity = Column(String(50), nullable=True)
    injury_days_remaining = Column(Integer, nullable=True, default=0)
    fatigue_level = Column(Float, nullable=True, default=0.0)
    morale = Column(Float, nullable=True, default=0.75)
    form = Column(Float, nullable=True, default=0.7)
    
    # بيانات وصفية
    potential_rating = Column(Float, nullable=True)
    experience_years = Column(Integer, nullable=True, default=0)
    international_caps = Column(Integer, nullable=True, default=0)
    achievements = Column(JSON, nullable=True, default=list)
    
    # تتبع زمني
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    
    # العلاقات
    sessions_as_player1 = relationship(
        "GameSession",
        foreign_keys="GameSession.player1_id",
        back_populates="player1",
        lazy="select"
    )
    sessions_as_player2 = relationship(
        "GameSession",
        foreign_keys="GameSession.player2_id",
        back_populates="player2",
        lazy="select"
    )
    game_sessions = relationship(
        "GameSession",
        primaryjoin="or_(Player.id==GameSession.player1_id, Player.id==GameSession.player2_id)",
        viewonly=True,
        lazy="dynamic"
    )
    
    # الفهارس المركبة
    __table_args__ = (
        Index('idx_player_position_rating', 'position', 'rating'),
        Index('idx_player_rarity_rating', 'rarity', 'rating'),
        Index('idx_player_nationality', 'nationality'),
        Index('idx_player_team_rating', 'team', 'rating'),
        Index('idx_player_status', 'status'),
    )
    
    def __repr__(self):
        return f"<Player(id={self.id}, name='{self.name}', position='{self.position}', rating={self.rating})>"
    
    def to_dict(self, include_stats: bool = False) -> Dict[str, Any]:
        """تحويل اللاعب إلى قاموس"""
        data = {
            "id": self.id,
            "api_id": self.api_id,
            "name": self.name,
            "position": self.position,
            "rating": self.rating,
            "rarity": self.rarity,
            "team": self.team,
            "nationality": self.nationality,
            "age": self.age,
            "height_cm": self.height_cm,
            "weight_kg": self.weight_kg,
            "preferred_foot": self.preferred_foot,
            "image_url": self.image_url,
            "card_image_url": self.card_image_url,
            "market_value": self.market_value,
            "status": self.status,
            "fatigue_level": self.fatigue_level,
            "morale": self.morale,
            "form": self.form,
            "potential_rating": self.potential_rating,
            "experience_years": self.experience_years,
            "international_caps": self.international_caps,
        }
        
        if include_stats:
            data.update({
                "pace": self.pace,
                "shooting": self.shooting,
                "passing": self.passing,
                "dribbling": self.dribbling,
                "defending": self.defending,
                "physical": self.physical,
                "stamina": self.stamina,
                "aggression": self.aggression,
                "composure": self.composure,
                "vision": self.vision,
                "leadership": self.leadership,
                "special_traits": self.special_traits,
                "skill_moves": self.skill_moves,
                "weak_foot_ability": self.weak_foot_ability,
            })
        
        return data


class Manager(Base):
    """
    نموذج المدربين - Football Manager Model
    
    يحتوي على معلومات المدربين بما في ذلك:
    - البيانات الأساسية
    - التقييمات التكتيكية
    - أساليب اللعب والتشكيلات
    """
    __tablename__ = "managers"
    
    # المفاتيح الأساسية
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    api_id = Column(Integer, unique=True, index=True, nullable=True)
    
    # المعلومات الأساسية
    name = Column(String(255), nullable=False, index=True)
    tactic_rating = Column(Float, nullable=False, index=True)
    rarity = Column(String(50), nullable=False, default=CardRarity.MEDIUM.value, index=True)
    
    # الخبرة والمعلومات الشخصية
    experience = Column(Integer, nullable=True, default=10)
    nationality = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    image_url = Column(String(500), nullable=True)
    
    # التكتيك والأسلوب
    preferred_formation = Column(String(50), nullable=True, default="4-3-3")
    secondary_formation = Column(String(50), nullable=True, default="4-4-2")
    playing_style = Column(String(100), nullable=True, default=ManagerStyle.BALANCED.value)
    defensive_style = Column(String(100), nullable=True, default="متوازن")
    attacking_style = Column(String(100), nullable=True, default="منظم")
    
    # تقييمات تفصيلية
    attack_coaching = Column(Float, nullable=True, default=75.0)
    defense_coaching = Column(Float, nullable=True, default=75.0)
    midfield_coaching = Column(Float, nullable=True, default=75.0)
    youth_development = Column(Float, nullable=True, default=70.0)
    motivation_skill = Column(Float, nullable=True, default=75.0)
    discipline = Column(Float, nullable=True, default=70.0)
    adaptability = Column(Float, nullable=True, default=0.7)
    pressure_handling = Column(Float, nullable=True, default=0.7)
    
    # القيم المالية
    market_value = Column(Float, nullable=True, default=0.0)
    contract_until = Column(DateTime, nullable=True)
    
    # الإنجازات والسمات الخاصة
    achievements = Column(JSON, nullable=True, default=list)
    special_abilities = Column(JSON, nullable=True, default=list)
    leadership_style = Column(String(100), nullable=True)
    philosophy = Column(String(100), nullable=True)
    
    # تتبع زمني
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # الفهارس المركبة
    __table_args__ = (
        Index('idx_manager_rarity_rating', 'rarity', 'tactic_rating'),
        Index('idx_manager_nationality', 'nationality'),
        Index('idx_manager_style', 'playing_style'),
    )
    
    def __repr__(self):
        return f"<Manager(id={self.id}, name='{self.name}', tactic_rating={self.tactic_rating})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """تحويل المدرب إلى قاموس"""
        return {
            "id": self.id,
            "api_id": self.api_id,
            "name": self.name,
            "tactic_rating": self.tactic_rating,
            "rarity": self.rarity,
            "experience": self.experience,
            "nationality": self.nationality,
            "age": self.age,
            "image_url": self.image_url,
            "preferred_formation": self.preferred_formation,
            "secondary_formation": self.secondary_formation,
            "playing_style": self.playing_style,
            "defensive_style": self.defensive_style,
            "attacking_style": self.attacking_style,
            "attack_coaching": self.attack_coaching,
            "defense_coaching": self.defense_coaching,
            "midfield_coaching": self.midfield_coaching,
            "youth_development": self.youth_development,
            "motivation_skill": self.motivation_skill,
            "discipline": self.discipline,
            "adaptability": self.adaptability,
            "pressure_handling": self.pressure_handling,
            "market_value": self.market_value,
            "achievements": self.achievements,
            "special_abilities": self.special_abilities,
            "leadership_style": self.leadership_style,
            "philosophy": self.philosophy,
        }


class GameSession(Base):
    """
    نموذج جلسة اللعبة - Game Session Model
    
    يحتوي على:
    - معلومات الجلسة واللاعبين
    - حالة المزاد والمباراة
    - الميزانيات والإحصائيات
    - تتبع الأدوار والوقت
    """
    __tablename__ = "game_sessions"
    
    # المفاتيح الأساسية
    id = Column(String(50), primary_key=True, index=True)
    
    # معرفات اللاعبين
    player1_id = Column(String(100), nullable=False, index=True)
    player2_id = Column(String(100), nullable=False, index=True)
    
    # حالة الجلسة
    status = Column(
        String(50), 
        nullable=False, 
        default=GameStatus.WAITING.value,
        index=True
    )
    
    # حالة المزاد الحالية
    current_turn = Column(String(100), nullable=True)
    current_auction_phase = Column(
        String(50), 
        nullable=True, 
        default=AuctionPhase.PENDING.value
    )
    
    # تكوين الفرق
    player1_team = Column(JSON, default=dict)
    player2_team = Column(JSON, default=dict)
    
    # تقدم المزاد
    auction_index = Column(Integer, default=0)
    total_auctions = Column(Integer, default=9)
    current_card_position = Column(String(50), nullable=True)
    highest_bid = Column(Float, default=0.0)
    highest_bidder = Column(String(100), nullable=True)
    
    # الميزانيات
    player1_budget = Column(Float, default=100.0)
    player2_budget = Column(Float, default=100.0)
    player1_total_spent = Column(Float, default=0.0)
    player2_total_spent = Column(Float, default=0.0)
    
    # إحصائيات المزاد
    player1_bids_count = Column(Integer, default=0)
    player2_bids_count = Column(Integer, default=0)
    player1_skips_count = Column(Integer, default=0)
    player2_skips_count = Column(Integer, default=0)
    player1_cards_won = Column(Integer, default=0)
    player2_cards_won = Column(Integer, default=0)
    
    # نتيجة المباراة
    winner_id = Column(String(100), nullable=True)
    match_completed = Column(Boolean, default=False)
    
    # التوقيت
    turn_started_at = Column(DateTime, nullable=True)
    turn_timeout_seconds = Column(Integer, default=30)
    auction_started_at = Column(DateTime, nullable=True)
    match_started_at = Column(DateTime, nullable=True)
    
    # بيانات وصفية
    game_mode = Column(String(50), nullable=True, default="standard")
    difficulty_level = Column(String(50), nullable=True, default="normal")
    
    # إعدادات إضافية
    settings = Column(JSON, nullable=True, default=dict)
    
    # تتبع زمني
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # العلاقات
    player1 = relationship(
        "Player",
        foreign_keys=[player1_id],
        back_populates="sessions_as_player1",
        lazy="select",
        primaryjoin="foreign(GameSession.player1_id)==Player.id"
    )
    player2 = relationship(
        "Player",
        foreign_keys=[player2_id],
        back_populates="sessions_as_player2",
        lazy="select",
        primaryjoin="foreign(GameSession.player2_id)==Player.id"
    )
    
    bids = relationship(
        "Bid",
        back_populates="session",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="Bid.timestamp"
    )
    
    match_results = relationship(
        "MatchResult",
        back_populates="session",
        lazy="select",
        cascade="all, delete-orphan",
        uselist=False
    )
    
    auction_logs = relationship(
        "AuctionLog",
        back_populates="session",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )
    
    player_cards = relationship(
        "PlayerCard",
        back_populates="session",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )
    
    # الفهارس المركبة
    __table_args__ = (
        Index('idx_session_status_created', 'status', 'created_at'),
        Index('idx_session_players', 'player1_id', 'player2_id'),
        Index('idx_session_winner', 'winner_id'),
    )
    
    def __repr__(self):
        return f"<GameSession(id='{self.id}', status='{self.status}', auction_index={self.auction_index})>"
    
    def to_dict(self, include_relations: bool = False) -> Dict[str, Any]:
        """تحويل الجلسة إلى قاموس"""
        data = {
            "id": self.id,
            "player1_id": self.player1_id,
            "player2_id": self.player2_id,
            "status": self.status,
            "current_turn": self.current_turn,
            "current_auction_phase": self.current_auction_phase,
            "player1_team": self.player1_team,
            "player2_team": self.player2_team,
            "auction_index": self.auction_index,
            "total_auctions": self.total_auctions,
            "current_card_position": self.current_card_position,
            "highest_bid": self.highest_bid,
            "highest_bidder": self.highest_bidder,
            "player1_budget": self.player1_budget,
            "player2_budget": self.player2_budget,
            "player1_total_spent": self.player1_total_spent,
            "player2_total_spent": self.player2_total_spent,
            "player1_bids_count": self.player1_bids_count,
            "player2_bids_count": self.player2_bids_count,
            "player1_skips_count": self.player1_skips_count,
            "player2_skips_count": self.player2_skips_count,
            "player1_cards_won": self.player1_cards_won,
            "player2_cards_won": self.player2_cards_won,
            "winner_id": self.winner_id,
            "match_completed": self.match_completed,
            "turn_timeout_seconds": self.turn_timeout_seconds,
            "game_mode": self.game_mode,
            "difficulty_level": self.difficulty_level,
            "settings": self.settings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "auction_started_at": self.auction_started_at.isoformat() if self.auction_started_at else None,
            "match_started_at": self.match_started_at.isoformat() if self.match_started_at else None,
        }
        
        if include_relations:
            data["bids"] = [bid.to_dict() for bid in self.bids]
            if self.match_results:
                data["match_result"] = self.match_results.to_dict()
        
        return data
    
    def get_remaining_budget(self, player_id: str) -> float:
        """الحصول على الميزانية المتبقية للاعب"""
        if player_id == self.player1_id:
            return self.player1_budget - self.player1_total_spent
        elif player_id == self.player2_id:
            return self.player2_budget - self.player2_total_spent
        return 0.0
    
    def get_team_summary(self, player_id: str) -> Dict[str, Any]:
        """الحصول على ملخص تشكيلة اللاعب"""
        team = self.player1_team if player_id == self.player1_id else self.player2_team
        
        summary = {
            "total_cards": 0,
            "positions_filled": 0,
            "average_rating": 0.0,
            "strongest_position": None,
            "weakest_position": None,
            "total_spent": self.player1_total_spent if player_id == self.player1_id else self.player2_total_spent,
            "remaining_budget": self.get_remaining_budget(player_id),
        }
        
        if team:
            ratings = []
            position_ratings = {}
            
            for position, cards in team.items():
                if cards:
                    summary["positions_filled"] += 1
                    pos_ratings = []
                    for card in cards:
                        if isinstance(card, dict):
                            rating = card.get("player", {}).get("rating", 75)
                            if isinstance(rating, dict):
                                rating = rating.get("rating", 75)
                        else:
                            rating = 75
                        ratings.append(rating)
                        pos_ratings.append(rating)
                        summary["total_cards"] += 1
                    
                    if pos_ratings:
                        position_ratings[position] = sum(pos_ratings) / len(pos_ratings)
            
            if ratings:
                summary["average_rating"] = round(sum(ratings) / len(ratings), 1)
            
            if position_ratings:
                summary["strongest_position"] = max(position_ratings, key=position_ratings.get)
                summary["weakest_position"] = min(position_ratings, key=position_ratings.get)
        
        return summary


class Bid(Base):
    """
    نموذج المزايدات - Bid History Model
    
    يسجل تاريخ المزايدات في كل جلسة
    """
    __tablename__ = "bids"
    
    # المفاتيح الأساسية
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # مفاتيح خارجية
    session_id = Column(
        String(50), 
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # معلومات المزايدة
    player_id = Column(String(100), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    card_position = Column(Integer, nullable=False)
    
    # معلومات إضافية
    bid_type = Column(String(50), nullable=True, default="standard")  # standard, counter, aggressive
    is_bluff = Column(Boolean, default=False)
    is_winning_bid = Column(Boolean, default=False)
    
    # حالة المزايدة
    status = Column(String(50), nullable=True, default="placed")  # placed, accepted, rejected, outbid
    
    # توقيت
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    response_time_seconds = Column(Float, nullable=True)
    
    # العلاقات
    session = relationship(
        "GameSession",
        back_populates="bids",
        lazy="select"
    )
    
    # الفهارس المركبة
    __table_args__ = (
        Index('idx_bid_session_player', 'session_id', 'player_id'),
        Index('idx_bid_session_timestamp', 'session_id', 'timestamp'),
        Index('idx_bid_player_timestamp', 'player_id', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<Bid(id={self.id}, session='{self.session_id}', amount={self.amount})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """تحويل المزايدة إلى قاموس"""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "player_id": self.player_id,
            "amount": self.amount,
            "card_position": self.card_position,
            "bid_type": self.bid_type,
            "is_bluff": self.is_bluff,
            "is_winning_bid": self.is_winning_bid,
            "status": self.status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "response_time_seconds": self.response_time_seconds,
        }


class MatchResult(Base):
    """
    نموذج نتيجة المباراة - Match Result Model
    
    يحتوي على:
    - النتائج النهائية
    - تحليل القوة والتكتيك والحظ
    - التعليق والأحداث
    - إحصائيات المباراة التفصيلية
    """
    __tablename__ = "match_results"
    
    # المفاتيح الأساسية
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # مفاتيح خارجية
    session_id = Column(
        String(50), 
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # نتيجة واحدة لكل جلسة
        index=True
    )
    
    # معرفات اللاعبين
    player1_id = Column(String(100), nullable=False, index=True)
    player2_id = Column(String(100), nullable=False, index=True)
    winner_id = Column(String(100), nullable=False, index=True)
    
    # النتائج
    player1_score = Column(Integer, default=0)
    player2_score = Column(Integer, default=0)
    
    # مكونات النتيجة (30/30/40)
    player1_strength = Column(Float, default=0.0, comment="30% weight - Squad strength")
    player2_strength = Column(Float, default=0.0, comment="30% weight - Squad strength")
    player1_tactic = Column(Float, default=0.0, comment="30% weight - Manager tactic")
    player2_tactic = Column(Float, default=0.0, comment="30% weight - Manager tactic")
    player1_luck = Column(Float, default=0.0, comment="40% weight - Random luck factor")
    player2_luck = Column(Float, default=0.0, comment="40% weight - Random luck factor")
    
    # التعليق والأحداث
    commentary = Column(JSON, default=list)
    match_events = Column(JSON, default=list)
    
    # إحصائيات المباراة
    statistics = Column(JSON, default=dict)
    
    # تفاصيل الأهداف
    goal_details = Column(JSON, default=dict)
    
    # أداء اللاعبين
    player_performances = Column(JSON, default=dict)
    man_of_the_match = Column(String(255), nullable=True)
    
    # ملخص المباراة
    match_summary = Column(Text, nullable=True)
    match_duration_minutes = Column(Integer, default=90)
    
    # حالة المباراة
    match_status = Column(String(50), nullable=True, default="completed")  # completed, forfeited, draw
    
    # تتبع زمني
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    match_date = Column(DateTime, nullable=True)
    
    # العلاقات
    session = relationship(
        "GameSession",
        back_populates="match_results",
        lazy="select"
    )
    
    # الفهارس المركبة
    __table_args__ = (
        Index('idx_match_winner', 'winner_id', 'created_at'),
        Index('idx_match_players', 'player1_id', 'player2_id'),
        Index('idx_match_session', 'session_id', 'created_at'),
    )
    
    def __repr__(self):
        return f"<MatchResult(id={self.id}, session='{self.session_id}', score={self.player1_score}-{self.player2_score})>"
    
    def to_dict(self, include_commentary: bool = False) -> Dict[str, Any]:
        """تحويل نتيجة المباراة إلى قاموس"""
        data = {
            "id": self.id,
            "session_id": self.session_id,
            "player1_id": self.player1_id,
            "player2_id": self.player2_id,
            "winner_id": self.winner_id,
            "player1_score": self.player1_score,
            "player2_score": self.player2_score,
            "player1_strength": self.player1_strength,
            "player2_strength": self.player2_strength,
            "player1_tactic": self.player1_tactic,
            "player2_tactic": self.player2_tactic,
            "player1_luck": self.player1_luck,
            "player2_luck": self.player2_luck,
            "statistics": self.statistics,
            "goal_details": self.goal_details,
            "player_performances": self.player_performances,
            "man_of_the_match": self.man_of_the_match,
            "match_summary": self.match_summary,
            "match_duration_minutes": self.match_duration_minutes,
            "match_status": self.match_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "match_date": self.match_date.isoformat() if self.match_date else None,
        }
        
        if include_commentary:
            data["commentary"] = self.commentary
            data["match_events"] = self.match_events
        
        return data


# ==================== نماذج إضافية للميزات المتقدمة ====================

class PlayerCard(Base):
    """
    نموذج بطاقات اللاعبين في الجلسات
    
    يتتبع حالة كل بطاقة تم الحصول عليها خلال المزاد
    """
    __tablename__ = "player_cards"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(
        String(50), 
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # معلومات البطاقة
    card_type = Column(String(50), nullable=False, default=CardType.AUCTION.value)  # auction, mystery
    position = Column(String(50), nullable=False)
    rarity = Column(String(50), nullable=False)
    
    # بيانات اللاعب/المدرب
    player_data = Column(JSON, nullable=True)  # بيانات اللاعب
    manager_data = Column(JSON, nullable=True)  # بيانات المدرب
    
    # معلومات الاكتساب
    acquired_by = Column(String(100), nullable=False, index=True)
    acquisition_method = Column(String(50), nullable=False)
    bid_amount = Column(Float, nullable=True)
    
    # حالة البطاقة
    is_active = Column(Boolean, default=True)
    is_injured = Column(Boolean, default=False)
    injury_type = Column(String(100), nullable=True)
    matches_played = Column(Integer, default=0)
    goals_scored = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    
    # تتبع زمني
    acquired_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    
    # العلاقات
    session = relationship("GameSession", back_populates="player_cards")
    
    __table_args__ = (
        Index('idx_card_session_player', 'session_id', 'acquired_by'),
        Index('idx_card_position_rarity', 'position', 'rarity'),
    )


class AuctionLog(Base):
    """
    نموذج سجل المزاد التفصيلي
    
    يسجل كل حدث في المزاد للتحليل والتتبع
    """
    __tablename__ = "auction_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(
        String(50), 
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # تفاصيل الحدث
    event_type = Column(String(50), nullable=False)  # start, bid, skip, win, mystery, timeout
    player_id = Column(String(100), nullable=True)
    card_position = Column(Integer, nullable=True)
    amount = Column(Float, nullable=True)
    
    # بيانات إضافية
    event_data = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    
    # توقيت
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # العلاقات
    session = relationship("GameSession", back_populates="auction_logs")
    
    __table_args__ = (
        Index('idx_auction_log_session_event', 'session_id', 'event_type'),
        Index('idx_auction_log_timestamp', 'timestamp'),
    )


class PlayerInjury(Base):
    """
    نموذج إصابات اللاعبين
    
    يتتبع الإصابات الافتراضية خلال الموسم
    """
    __tablename__ = "player_injuries"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    
    # تفاصيل الإصابة
    injury_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False, default=InjurySeverity.LIGHT.value)
    description = Column(Text, nullable=True)
