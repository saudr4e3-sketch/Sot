"""
OSM FUT Dual Battle - Pydantic Schemas
======================================
Data validation and serialization schemas with comprehensive type hints,
field validators, and production-ready configurations.

Features:
- Strict type validation with Pydantic v2 compatibility
- Custom field validators for business logic
- Computed properties and helper methods
- Comprehensive documentation
- Pagination and filtering support
- WebSocket message schemas
- API request/response models
"""

from pydantic import (
    BaseModel, 
    Field, 
    field_validator, 
    model_validator,
    ConfigDict,
    computed_field,
    ValidationInfo
)
from typing import Optional, List, Dict, Any, Union, Literal
from datetime import datetime
from enum import Enum

# ==================== Enums ====================

class PlayerPosition(str, Enum):
    """مراكز اللاعبين"""
    GK = "GK"
    DEF = "DEF"
    MID = "MID"
    ATT = "ATT"


class CardRarity(str, Enum):
    """مستويات ندرة البطاقات"""
    LEGENDARY = "Legendary"
    MEDIUM = "Medium"
    WEAK = "Weak"


class GameStatus(str, Enum):
    """حالات جلسة اللعبة"""
    WAITING = "waiting"
    AUCTION = "auction"
    MATCH = "match"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AuctionPhase(str, Enum):
    """مراحل المزاد"""
    PENDING = "pending"
    ACTIVE = "active"
    BIDDING = "bidding"
    FINALIZING = "finalizing"
    SOLD = "sold"
    SKIPPED = "skipped"
    MYSTERY = "mystery"


class PlayerStatus(str, Enum):
    """حالات اللاعب"""
    ACTIVE = "active"
    INJURED = "injured"
    SUSPENDED = "suspended"
    FATIGUED = "fatigued"


class MessageType(str, Enum):
    """أنواع رسائل WebSocket"""
    BID = "bid"
    SKIP = "skip"
    TIMER = "timer"
    AUCTION_STATE = "auction_state"
    MATCH_RESULT = "match_result"
    MYSTERY_CARD = "mystery_card"
    ERROR = "error"
    INFO = "info"


# ==================== Player Schemas ====================

class PlayerBase(BaseModel):
    """
    نموذج أساسي للاعب - يحتوي على الخصائص المشتركة
    """
    name: str = Field(
        ..., 
        min_length=1, 
        max_length=255,
        description="اسم اللاعب الكامل"
    )
    position: str = Field(
        ..., 
        description="مركز اللاعب (GK, DEF, MID, ATT)"
    )
    rating: float = Field(
        ..., 
        ge=1.0, 
        le=99.0,
        description="التقييم العام للاعب (1-99)"
    )
    team: str = Field(
        ..., 
        min_length=1,
        description="النادي الحالي للاعب"
    )
    image_url: Optional[str] = Field(
        None,
        max_length=500,
        description="رابط صورة اللاعب"
    )
    nationality: Optional[str] = Field(
        None,
        max_length=100,
        description="جنسية اللاعب"
    )
    age: Optional[int] = Field(
        None, 
        ge=16, 
        le=50,
        description="عمر اللاعب"
    )
    rarity: str = Field(
        ..., 
        description="مستوى ندرة البطاقة (Legendary, Medium, Weak)"
    )
    
    @field_validator('position')
    @classmethod
    def validate_position(cls, v: str) -> str:
        """التحقق من صحة المركز"""
        valid_positions = ['GK', 'DEF', 'MID', 'ATT']
        if v.upper() not in valid_positions:
            raise ValueError(f'المركز يجب أن يكون أحد: {valid_positions}')
        return v.upper()
    
    @field_validator('rarity')
    @classmethod
    def validate_rarity(cls, v: str) -> str:
        """التحقق من صحة الندرة"""
        valid_rarities = ['Legendary', 'Medium', 'Weak']
        if v not in valid_rarities:
            raise ValueError(f'الندرة يجب أن تكون إحدى: {valid_rarities}')
        return v
    
    @field_validator('rating')
    @classmethod
    def round_rating(cls, v: float) -> float:
        """تقريب التقييم إلى خانة عشرية واحدة"""
        return round(v, 1)


class PlayerCreate(PlayerBase):
    """
    نموذج إنشاء لاعب جديد
    """
    api_id: int = Field(
        ..., 
        gt=0,
        description="المعرف الفريد من API الخارجي"
    )
    
    # خصائص إضافية اختيارية
    pace: Optional[int] = Field(None, ge=1, le=99, description="السرعة")
    shooting: Optional[int] = Field(None, ge=1, le=99, description="التسديد")
    passing: Optional[int] = Field(None, ge=1, le=99, description="التمرير")
    dribbling: Optional[int] = Field(None, ge=1, le=99, description="المراوغة")
    defending: Optional[int] = Field(None, ge=1, le=99, description="الدفاع")
    physical: Optional[int] = Field(None, ge=1, le=99, description="القوة البدنية")


class PlayerUpdate(BaseModel):
    """
    نموذج تحديث بيانات اللاعب - جميع الحقول اختيارية
    """
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    position: Optional[str] = None
    rating: Optional[float] = Field(None, ge=1.0, le=99.0)
    team: Optional[str] = Field(None, min_length=1)
    image_url: Optional[str] = Field(None, max_length=500)
    nationality: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=16, le=50)
    rarity: Optional[str] = None
    status: Optional[str] = None
    
    @field_validator('rating')
    @classmethod
    def round_rating(cls, v: Optional[float]) -> Optional[float]:
        """تقريب التقييم إذا تم توفيره"""
        if v is not None:
            return round(v, 1)
        return v


class Player(PlayerBase):
    """
    نموذج استجابة اللاعب - يحتوي على جميع البيانات
    """
    id: int = Field(..., description="المعرف الداخلي للاعب")
    api_id: int = Field(..., description="المعرف من API الخارجي")
    created_at: datetime = Field(..., description="تاريخ إنشاء السجل")
    updated_at: Optional[datetime] = Field(None, description="تاريخ آخر تحديث")
    
    # خصائص افتراضية اختيارية
    status: Optional[str] = Field(None, description="حالة اللاعب الافتراضية")
    market_value: Optional[float] = Field(None, ge=0, description="القيمة السوقية")
    potential_rating: Optional[float] = Field(None, ge=1.0, le=99.0, description="التقييم المحتمل")
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "api_id": 237085,
                "name": "Erling Haaland",
                "position": "ATT",
                "rating": 91.0,
                "team": "Manchester City",
                "image_url": "https://cdn.sofifa.net/players/239/085/25_120.png",
                "nationality": "Norway",
                "age": 24,
                "rarity": "Legendary",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-06-20T14:45:00Z",
                "status": "active",
                "market_value": 180.5,
                "potential_rating": 94.0
            }
        }
    )
    
    @computed_field
    @property
    def age_category(self) -> str:
        """الفئة العمرية للاعب"""
        if self.age is None:
            return "unknown"
        if self.age < 21:
            return "young"
        elif self.age < 28:
            return "prime"
        elif self.age < 33:
            return "experienced"
        else:
            return "veteran"
    
    @computed_field
    @property
    def rating_category(self) -> str:
        """فئة التقييم"""
        if self.rating >= 88:
            return "elite"
        elif self.rating >= 80:
            return "professional"
        elif self.rating >= 70:
            return "average"
        else:
            return "developing"


# ==================== Manager Schemas ====================

class ManagerBase(BaseModel):
    """
    نموذج أساسي للمدرب
    """
    name: str = Field(
        ..., 
        min_length=1, 
        max_length=255,
        description="اسم المدرب"
    )
    tactic_rating: float = Field(
        ..., 
        ge=1.0, 
        le=99.0,
        description="التقييم التكتيكي (1-99)"
    )
    image_url: Optional[str] = Field(
        None, 
        max_length=500,
        description="رابط صورة المدرب"
    )
    nationality: Optional[str] = Field(
        None, 
        max_length=100,
        description="جنسية المدرب"
    )
    experience: Optional[int] = Field(
        None, 
        ge=0, 
        le=50,
        description="سنوات الخبرة"
    )
    rarity: str = Field(
        ..., 
        description="مستوى ندرة البطاقة"
    )
    
    @field_validator('rarity')
    @classmethod
    def validate_rarity(cls, v: str) -> str:
        valid_rarities = ['Legendary', 'Medium', 'Weak']
        if v not in valid_rarities:
            raise ValueError(f'الندرة يجب أن تكون إحدى: {valid_rarities}')
        return v
    
    @field_validator('tactic_rating')
    @classmethod
    def round_rating(cls, v: float) -> float:
        """تقريب التقييم التكتيكي"""
        return round(v, 1)


class ManagerCreate(ManagerBase):
    """
    نموذج إنشاء مدرب جديد
    """
    api_id: int = Field(..., gt=0, description="المعرف من API الخارجي")
    
    # خصائص تكتيكية إضافية
    preferred_formation: Optional[str] = Field(None, description="التشكيل المفضل")
    playing_style: Optional[str] = Field(None, description="أسلوب اللعب")
    attack_coaching: Optional[float] = Field(None, ge=1.0, le=99.0)
    defense_coaching: Optional[float] = Field(None, ge=1.0, le=99.0)


class Manager(ManagerBase):
    """
    نموذج استجابة المدرب
    """
    id: int = Field(..., description="المعرف الداخلي")
    api_id: int = Field(..., description="المعرف من API الخارجي")
    created_at: datetime = Field(..., description="تاريخ الإنشاء")
    
    # خصائص إضافية
    preferred_formation: Optional[str] = None
    playing_style: Optional[str] = None
    attack_coaching: Optional[float] = None
    defense_coaching: Optional[float] = None
    achievements: Optional[List[str]] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)
    
    @computed_field
    @property
    def experience_level(self) -> str:
        """مستوى الخبرة"""
        if self.experience is None:
            return "rookie"
        if self.experience > 20:
            return "legendary"
        elif self.experience > 10:
            return "experienced"
        elif self.experience > 5:
            return "established"
        else:
            return "rookie"


# ==================== Game Session Schemas ====================

class GameSessionCreate(BaseModel):
    """
    نموذج إنشاء جلسة لعبة جديدة
    """
    player1_id: str = Field(
        ..., 
        min_length=1,
        description="معرف اللاعب الأول"
    )
    player2_id: str = Field(
        ..., 
        min_length=1,
        description="معرف اللاعب الثاني (أو البوت)"
    )
    
    # إعدادات اختيارية
    game_mode: Optional[str] = Field("standard", description="وضع اللعبة")
    difficulty_level: Optional[str] = Field("normal", description="مستوى الصعوبة")
    turn_timeout_seconds: Optional[int] = Field(
        30, 
        ge=10, 
        le=120,
        description="مهلة الدور بالثواني"
    )
    
    @model_validator(mode='after')
    def validate_different_players(self) -> 'GameSessionCreate':
        """التحقق من أن اللاعبين مختلفين"""
        if self.player1_id == self.player2_id:
            raise ValueError('يجب أن يكون اللاعبان مختلفين')
        return self


class GameSessionUpdate(BaseModel):
    """
    نموذج تحديث جلسة اللعبة - جميع الحقول اختيارية
    """
    status: Optional[str] = Field(None, description="حالة الجلسة")
    current_turn: Optional[str] = Field(None, description="اللاعب صاحب الدور الحالي")
    current_auction_phase: Optional[str] = Field(None, description="مرحلة المزاد الحالية")
    auction_index: Optional[int] = Field(None, ge=0, description="مؤشر المزاد الحالي")
    highest_bid: Optional[float] = Field(None, ge=0, description="أعلى مزايدة حالية")
    highest_bidder: Optional[str] = Field(None, description="صاحب أعلى مزايدة")
    player1_team: Optional[Dict[str, Any]] = Field(None, description="تشكيلة اللاعب الأول")
    player2_team: Optional[Dict[str, Any]] = Field(None, description="تشكيلة اللاعب الثاني")
    player1_budget: Optional[float] = Field(None, ge=0, description="ميزانية اللاعب الأول")
    player2_budget: Optional[float] = Field(None, ge=0, description="ميزانية اللاعب الثاني")
    player1_total_spent: Optional[float] = Field(None, ge=0)
    player2_total_spent: Optional[float] = Field(None, ge=0)
    winner_id: Optional[str] = Field(None, description="معرف الفائز")
    match_completed: Optional[bool] = Field(None, description="هل اكتملت المباراة")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid_statuses = ['waiting', 'auction', 'match', 'completed', 'cancelled']
            if v not in valid_statuses:
                raise ValueError(f'الحالة يجب أن تكون إحدى: {valid_statuses}')
        return v


class GameSession(BaseModel):
    """
    نموذج استجابة جلسة اللعبة
    """
    id: str = Field(..., description="معرف الجلسة الفريد")
    player1_id: str = Field(..., description="معرف اللاعب الأول")
    player2_id: str = Field(..., description="معرف اللاعب الثاني")
    status: str = Field(..., description="حالة الجلسة")
    current_turn: Optional[str] = Field(None, description="اللاعب صاحب الدور الحالي")
    current_auction_phase: Optional[str] = Field(None, description="مرحلة المزاد")
    player1_team: Dict[str, Any] = Field(default_factory=dict, description="تشكيلة اللاعب الأول")
    player2_team: Dict[str, Any] = Field(default_factory=dict, description="تشكيلة اللاعب الثاني")
    auction_index: int = Field(0, description="مؤشر المزاد الحالي")
    total_auctions: int = Field(9, description="إجمالي المزادات")
    highest_bid: float = Field(0.0, description="أعلى مزايدة")
    highest_bidder: Optional[str] = Field(None, description="صاحب أعلى مزايدة")
    player1_budget: float = Field(100.0, description="ميزانية اللاعب الأول")
    player2_budget: float = Field(100.0, description="ميزانية اللاعب الثاني")
    player1_total_spent: float = Field(0.0)
    player2_total_spent: float = Field(0.0)
    player1_cards_won: int = Field(0, description="البطاقات التي فاز بها اللاعب الأول")
    player2_cards_won: int = Field(0, description="البطاقات التي فاز بها اللاعب الثاني")
    winner_id: Optional[str] = Field(None, description="معرف الفائز")
    match_completed: bool = Field(False, description="هل اكتملت المباراة")
    turn_timeout_seconds: int = Field(30, description="مهلة الدور")
    created_at: datetime = Field(..., description="تاريخ الإنشاء")
    updated_at: datetime = Field(..., description="تاريخ آخر تحديث")
    completed_at: Optional[datetime] = Field(None, description="تاريخ الاكتمال")
    
    model_config = ConfigDict(from_attributes=True)
    
    @computed_field
    @property
    def player1_remaining_budget(self) -> float:
        """الميزانية المتبقية للاعب الأول"""
        return round(self.player1_budget - self.player1_total_spent, 2)
    
    @computed_field
    @property
    def player2_remaining_budget(self) -> float:
        """الميزانية المتبقية للاعب الثاني"""
        return round(self.player2_budget - self.player2_total_spent, 2)
    
    @computed_field
    @property
    def auction_progress_percentage(self) -> float:
        """نسبة تقدم المزاد"""
        if self.total_auctions == 0:
            return 0.0
        return round((self.auction_index / self.total_auctions) * 100, 1)


# ==================== Bid Schemas ====================

class BidCreate(BaseModel):
    """
    نموذج إنشاء مزايدة جديدة
    """
    session_id: str = Field(..., min_length=1, description="معرف الجلسة")
    player_id: str = Field(..., min_length=1, description="معرف اللاعب المزايد")
    amount: float = Field(
        ..., 
        gt=0,
        description="قيمة المزايدة (مليون يورو)"
    )
    card_position: int = Field(
        ..., 
        ge=0, 
        le=8,
        description="رقم البطاقة في المزاد (0-8)"
    )
    
    # خصائص إضافية
    bid_type: Optional[str] = Field("standard", description="نوع المزايدة")
    is_bluff: Optional[bool] = Field(False, description="هل هي مزايدة خادعة")
    
    @field_validator('amount')
    @classmethod
    def round_amount(cls, v: float) -> float:
        """تقريب قيمة المزايدة إلى خانتين عشريتين"""
        return round(v, 2)
    
    @model_validator(mode='after')
    def validate_bid_logic(self) -> 'BidCreate':
        """التحقق من منطق المزايدة"""
        if self.amount > 200:
            raise ValueError('لا يمكن أن تتجاوز المزايدة 200 مليون يورو')
        if self.card_position < 0 or self.card_position > 8:
            raise ValueError('رقم البطاقة يجب أن يكون بين 0 و 8')
        return self


class Bid(BidCreate):
    """
    نموذج استجابة المزايدة
    """
    id: int = Field(..., description="معرف المزايدة")
    timestamp: datetime = Field(..., description="توقيت المزايدة")
    status: Optional[str] = Field("placed", description="حالة المزايدة")
    is_winning_bid: Optional[bool] = Field(False, description="هل هي المزايدة الفائزة")
    response_time_seconds: Optional[float] = Field(None, description="وقت الاستجابة")
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Match Schemas ====================

class MatchStats(BaseModel):
    """
    إحصائيات المباراة
    """
    possession: Dict[str, float] = Field(default_factory=dict)
    shots: Dict[str, int] = Field(default_factory=dict)
    shots_on_target: Dict[str, int] = Field(default_factory=dict)
    corners: Dict[str, int] = Field(default_factory=dict)
    fouls: Dict[str, int] = Field(default_factory=dict)
    yellow_cards: Dict[str, int] = Field(default_factory=dict)
    red_cards: Dict[str, int] = Field(default_factory=dict)
    pass_accuracy: Dict[str, float] = Field(default_factory=dict)


class MatchCommentary(BaseModel):
    """
    نموذج التعليق على المباراة
    """
    minute: int = Field(..., ge=0, le=120, description="الدقيقة")
    type: str = Field(..., description="نوع الحدث")
    text: str = Field(..., description="نص التعليق")
    is_goal: Optional[bool] = Field(False, description="هل هو هدف")
    is_key_moment: Optional[bool] = Field(False, description="هل هي لحظة حاسمة")


class MatchResult(BaseModel):
    """
    نموذج نتيجة المباراة
    """
    id: int = Field(..., description="معرف النتيجة")
    session_id: str = Field(..., description="معرف الجلسة")
    player1_id: str = Field(..., description="معرف اللاعب الأول")
    player2_id: str = Field(..., description="معرف اللاعب الثاني")
    winner_id: str = Field(..., description="معرف الفائز")
    
    # النتائج
    player1_score: int = Field(..., ge=0, description="نتيجة اللاعب الأول")
    player2_score: int = Field(..., ge=0, description="نتيجة اللاعب الثاني")
    
    # مكونات النتيجة (30/30/40)
    player1_strength: float = Field(..., ge=0, le=100, description="قوة تشكيلة اللاعب الأول (30%)")
    player2_strength: float = Field(..., ge=0, le=100, description="قوة تشكيلة اللاعب الثاني (30%)")
    player1_tactic: float = Field(..., ge=0, le=100, description="تكتيك اللاعب الأول (30%)")
    player2_tactic: float = Field(..., ge=0, le=100, description="تكتيك اللاعب الثاني (30%)")
    player1_luck: float = Field(..., ge=0, le=100, description="حظ اللاعب الأول (40%)")
    player2_luck: float = Field(..., ge=0, le=100, description="حظ اللاعب الثاني (40%)")
    
    # تفاصيل إضافية
    commentary: List[Dict[str, Any]] = Field(default_factory=list, description="التعليق على المباراة")
    match_events: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="أحداث المباراة")
    statistics: Optional[Dict[str, Any]] = Field(default_factory=dict, description="إحصائيات المباراة")
    goal_details: Optional[Dict[str, Any]] = Field(default_factory=dict, description="تفاصيل الأهداف")
    match_summary: Optional[str] = Field(None, description="ملخص المباراة")
    man_of_the_match: Optional[str] = Field(None, description="رجل المباراة")
    
    created_at: datetime = Field(..., description="تاريخ إنشاء النتيجة")
    
    model_config = ConfigDict(from_attributes=True)
    
    @computed_field
    @property
    def total_score(self) -> int:
        """مجموع الأهداف"""
        return self.player1_score + self.player2_score
    
    @computed_field
    @property
    def score_difference(self) -> int:
        """فارق الأهداف"""
        return abs(self.player1_score - self.player2_score)
    
    @computed_field
    @property
    def is_draw(self) -> bool:
        """هل المباراة تعادل"""
        return self.player1_score == self.player2_score
    
    @computed_field
    @property
    def is_close_match(self) -> bool:
        """هل المباراة متقاربة (فارق هدف واحد)"""
        return abs(self.player1_score - self.player2_score) == 1
    
    @computed_field
    @property
    def match_description(self) -> str:
        """وصف المباراة"""
        if self.is_draw:
            return "تعادل مثير"
        elif self.score_difference >= 3:
            return "فوز ساحق"
        elif self.score_difference == 2:
            return "فوز مستحق"
        elif self.is_close_match:
            return "فوز صعب"
        return "نتيجة غير متوقعة"


# ==================== WebSocket Message Schemas ====================

class WSBaseMessage(BaseModel):
    """
    نموذج أساسي لرسائل WebSocket
    """
    type: str = Field(..., description="نوع الرسالة")
    session_id: str = Field(..., description="معرف الجلسة")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="توقيت الرسالة"
    )


class BidMessage(WSBaseMessage):
    """
    رسالة المزايدة عبر WebSocket
    """
    type: str = Field(default="bid")
    player_id: str = Field(..., description="معرف اللاعب")
    amount: float = Field(..., gt=0, description="قيمة المزايدة")
    
    @field_validator('amount')
    @classmethod
    def round_amount(cls, v: float) -> float:
        return round(v, 2)


class SkipMessage(WSBaseMessage):
    """
    رسالة تخطي الدور عبر WebSocket
    """
    type: str = Field(default="skip")
    player_id: str = Field(..., description="معرف اللاعب")


class TimerMessage(WSBaseMessage):
    """
    رسالة المؤقت عبر WebSocket
    """
    type: str = Field(default="timer")
    time_remaining: float = Field(..., ge=0, description="الوقت المتبقي")
    current_turn: str = Field(..., description="اللاعب صاحب الدور")


class AuctionStateMessage(WSBaseMessage):
    """
    رسالة حالة المزاد عبر WebSocket
    """
    type: str = Field(default="auction_state")
    current_position: str = Field(..., description="المركز الحالي")
    auction_index: int = Field(..., description="مؤشر المزاد")
    highest_bid: float = Field(0.0, description="أعلى مزايدة")
    current_player: Optional[Dict[str, Any]] = Field(None, description="اللاعب الحالي")
    player1_budget: float = Field(..., description="ميزانية اللاعب الأول")
    player2_budget: float = Field(..., description="ميزانية اللاعب الثاني")


class MysteryCardMessage(WSBaseMessage):
    """
    رسالة البطاقة الغامضة عبر WebSocket
    """
    type: str = Field(default="mystery_card")
    player_id: str = Field(..., description="معرف اللاعب المستلم")
    card: Dict[str, Any] = Field(..., description="بيانات البطاقة")
    position: str = Field(..., description="مركز البطاقة")


class MatchResultMessage(WSBaseMessage):
    """
    رسالة نتيجة المباراة عبر WebSocket
    """
    type: str = Field(default="match_result")
    winner_id: str = Field(..., description="معرف الفائز")
    player1_score: int = Field(..., ge=0)
    player2_score: int = Field(..., ge=0)
    player1_strength: float = Field(...)
    player2_strength: float = Field(...)
    player1_tactic: float = Field(...)
    player2_tactic: float = Field(...)
    player1_luck: float = Field(...)
    player2_luck: float = Field(...)
    commentary: List[Dict[str, Any]] = Field(default_factory=list)
    match_summary: Optional[str] = None


class ErrorMessage(WSBaseMessage):
    """
    رسالة خطأ عبر WebSocket
    """
    type: str = Field(default="error")
    error_code: str = Field(..., description="رمز الخطأ")
    message: str = Field(..., description="رسالة الخطأ")
    details: Optional[Dict[str, Any]] = Field(None, description="تفاصيل إضافية")


# ==================== Generic Response Schemas ====================

class MessageResponse(BaseModel):
    """
    نموذج استجابة عام للـ API
    """
    status: str = Field(..., description="حالة الاستجابة (success, error)")
    message: str = Field(..., description="رسالة الاستجابة")
    data: Optional[Dict[str, Any]] = Field(None, description="البيانات الإضافية")
    request_id: Optional[str] = Field(None, description="معرف الطلب للتتبع")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="توقيت الاستجابة"
    )
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = ['success', 'error', 'warning', 'info']
        if v not in valid_statuses:
            raise ValueError(f'الحالة يجب أن تكون إحدى: {valid_statuses}')
        return v


class PaginatedResponse(BaseModel):
    """
    نموذج استجابة متصفحة (Pagination)
    """
    items: List[Any] = Field(..., description="العناصر")
    total: int = Field(..., ge=0, description="إجمالي العناصر")
    page: int = Field(..., ge=1, description="الصفحة الحالية")
    page_size: int = Field(..., ge=1, le=100, description="حجم الصفحة")
    total_pages: int = Field(..., ge=0, description="إجمالي الصفحات")
    has_next: bool = Field(..., description="هل توجد صفحة تالية")
    has_previous: bool = Field(..., description="هل توجد صفحة سابقة")


class ErrorResponse(BaseModel):
    """
    نموذج استجابة الخطأ
    """
    success: bool = Field(default=False)
    error: Dict[str, Any] = Field(..., description="تفاصيل الخطأ")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="توقيت الخطأ"
    )


# ==================== API Request Schemas ====================

class StartAuctionRequest(BaseModel):
    """
    طلب بدء المزاد
    """
    session_id: str = Field(..., min_length=1)


class PlaceBidRequest(BaseModel):
    """
    طلب تقديم مزايدة
    """
    session_id: str = Field(..., min_length=1)
    player_id: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    
    @field_validator('amount')
    @classmethod
    def round_amount(cls, v: float) -> float:
        return round(v, 2)


class SkipBidRequest(BaseModel):
    """
    طلب تخطي المزايدة
    """
    session_id: str = Field(..., min_length=1)
    player_id: str = Field(..., min_length=1)


class GetTeamStatsRequest(BaseModel):
    """
    طلب إحصائيات الفريق
    """
    session_id: str = Field(..., min_length=1)
    player_id: str = Field(..., min_length=1)


# ==================== Statistics Schemas ====================

class TeamStats(BaseModel):
    """
    إحصائيات الفريق
    """
    player_id: str = Field(..., description="معرف اللاعب")
    player_name: str = Field(..., description="اسم اللاعب")
    is_bot: bool = Field(False, description="هل هو بوت")
    total_cards: int = Field(0, description="إجمالي البطاقات")
    total_spent: float = Field(0.0, description="إجمالي المصروفات")
    remaining_budget: float = Field(0.0, description="الميزانية المتبقية")
    auction_wins: int = Field(0, description="المزادات المربوحة")
    mystery_cards: int = Field(0, description="البطاقات الغامضة")
    average_rating: float = Field(0.0, description="متوسط التقييم")
    positions_filled: int = Field(0, description="المراكز المكتملة")
    strongest_position: Optional[str] = Field(None, description="أقوى مركز")
    weakest_position: Optional[str] = Field(None, description="أضعف مركز")


class GameSummary(BaseModel):
    """
    ملخص اللعبة
    """
    session_id: str
    status: str
    winner: Optional[str] = None
    player1_stats: TeamStats
    player2_stats: TeamStats
    match_result: Optional[MatchResult] = None
    total_duration_seconds: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
