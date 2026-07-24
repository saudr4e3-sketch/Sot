"""
نظام WebSocket المتقدم مع عداد زمني تلقائي
Advanced WebSocket System with Background Timer

المميزات:
- نظام مؤقت تلقائي لكل جلسة مزاد (30 ثانية)
- إدارة متقدمة للاتصالات والجلسات
- معالجة تلقائية لانتهاء الوقت
- بث مباشر لجميع المتصلين
- تكامل مع بوت الذكاء الاصطناعي Goat
- تنظيف تلقائي للموارد
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import json
import logging
import asyncio
from typing import Dict, Set, Optional, Any
from datetime import datetime, timedelta
from uuid import uuid4
from enum import Enum

from app.game.auction import AuctionManager
from app.game.match_engine import MatchEngine
from app.game.goat_bot import goat_ai
from app import schemas

logger = logging.getLogger(__name__)

router = APIRouter()

# ==================== Constants ====================

# إعدادات المؤقت
DEFAULT_TIMER_DURATION = 30  # ثانية
TIMER_CHECK_INTERVAL = 0.5   # فحص المؤقت كل نصف ثانية
BOT_RESPONSE_DELAY = 1.5     # تأخير استجابة البوت (محاكاة تفكير)
MAX_CONSECUTIVE_SKIPS = 2    # الحد الأقصى للتخطيات المتتالية
CLEANUP_INTERVAL = 300       # تنظيف الجلسات غير النشطة كل 5 دقائق


class TimerStatus(Enum):
    """حالات المؤقت"""
    RUNNING = "running"
    PAUSED = "paused"
    EXPIRED = "expired"
    STOPPED = "stopped"


class SessionTimer:
    """
    مؤقت جلسة المزاد - يدير الوقت المتبقي لكل دور
    """
    def __init__(self, session_id: str, duration: int = DEFAULT_TIMER_DURATION):
        self.session_id = session_id
        self.duration = duration
        self.remaining = duration
        self.status = TimerStatus.STOPPED
        self.started_at: Optional[datetime] = None
        self.last_activity: Optional[datetime] = None
        self.current_player_id: Optional[str] = None
        self._task: Optional[asyncio.Task] = None
    
    def start(self, player_id: str) -> None:
        """بدء المؤقت للاعب محدد"""
        self.remaining = self.duration
        self.status = TimerStatus.RUNNING
        self.started_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.current_player_id = player_id
        logger.debug(f"⏱️ Timer started for session {self.session_id}, player {player_id}")
    
    def pause(self) -> None:
        """إيقاف المؤقت مؤقتاً"""
        if self.status == TimerStatus.RUNNING:
            elapsed = (datetime.utcnow() - self.started_at).total_seconds()
            self.remaining = max(0, self.duration - elapsed)
            self.status = TimerStatus.PAUSED
            logger.debug(f"⏸️ Timer paused for session {self.session_id}, remaining: {self.remaining:.1f}s")
    
    def resume(self) -> None:
        """استئناف المؤقت"""
        if self.status == TimerStatus.PAUSED:
            self.duration = self.remaining
            self.status = TimerStatus.RUNNING
            self.started_at = datetime.utcnow()
            logger.debug(f"▶️ Timer resumed for session {self.session_id}")
    
    def reset(self, player_id: str = None) -> None:
        """إعادة تعيين المؤقت"""
        self.remaining = self.duration
        self.status = TimerStatus.STOPPED if player_id is None else TimerStatus.RUNNING
        self.started_at = datetime.utcnow() if player_id else None
        self.current_player_id = player_id
        self.last_activity = datetime.utcnow()
        logger.debug(f"🔄 Timer reset for session {self.session_id}")
    
    def stop(self) -> None:
        """إيقاف المؤقت نهائياً"""
        self.status = TimerStatus.STOPPED
        self.current_player_id = None
        if self._task:
            self._task.cancel()
            self._task = None
        logger.debug(f"⏹️ Timer stopped for session {self.session_id}")
    
    def is_expired(self) -> bool:
        """التحقق مما إذا كان المؤقت قد انتهى"""
        if self.status != TimerStatus.RUNNING:
            return False
        elapsed = (datetime.utcnow() - self.started_at).total_seconds()
        self.remaining = max(0, self.duration - elapsed)
        return self.remaining <= 0
    
    def get_remaining(self) -> float:
        """الحصول على الوقت المتبقي"""
        if self.status == TimerStatus.RUNNING:
            elapsed = (datetime.utcnow() - self.started_at).total_seconds()
            self.remaining = max(0, self.duration - elapsed)
        return self.remaining
    
    def to_dict(self) -> Dict[str, Any]:
        """تحويل إلى قاموس للإرسال"""
        return {
            "remaining": round(self.get_remaining(), 1),
            "duration": self.duration,
            "status": self.status.value,
            "current_player_id": self.current_player_id,
        }


class ConnectionManager:
    """
    مدير الاتصالات والجلسات المتقدم
    
    يدير:
    - اتصالات WebSocket النشطة
    - جلسات المزاد
    - المؤقتات الخلفية
    - مهام المراقبة المستمرة
    """
    def __init__(self):
        # الاتصالات النشطة
        self.active_connections: Dict[str, WebSocket] = {}
        
        # جلسات المزاد
        self.sessions: Dict[str, AuctionManager] = {}
        
        # مؤقتات الجلسات
        self.timers: Dict[str, SessionTimer] = {}
        
        # مهام المراقبة
        self._timer_tasks: Dict[str, asyncio.Task] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
        
        # تتبع اللاعبين في كل جلسة
        self.session_players: Dict[str, Set[str]] = {}
        
        # قفل للعمليات المتزامنة
        self._lock = asyncio.Lock()
        
        # بدء مهمة التنظيف الدورية
        self._start_cleanup_task()
    
    async def connect(self, websocket: WebSocket, connection_id: str) -> None:
        """
        قبول اتصال WebSocket جديد
        
        Args:
            websocket: اتصال WebSocket
            connection_id: معرف الاتصال (session_id_player_id)
        """
        await websocket.accept()
        
        async with self._lock:
            self.active_connections[connection_id] = websocket
        
        # استخراج session_id من connection_id
        session_id = "_".join(connection_id.split("_")[:-1])
        
        # إضافة اللاعب إلى مجموعة الجلسة
        if session_id not in self.session_players:
            self.session_players[session_id] = set()
        self.session_players[session_id].add(connection_id)
        
        logger.info(f"✅ Client connected: {connection_id} (session: {session_id})")
        logger.info(f"📊 Active connections: {len(self.active_connections)}")
    
    async def disconnect(self, connection_id: str) -> None:
        """
        فصل اتصال WebSocket
        
        Args:
            connection_id: معرف الاتصال
        """
        async with self._lock:
            if connection_id in self.active_connections:
                del self.active_connections[connection_id]
        
        # إزالة اللاعب من مجموعة الجلسة
        session_id = "_".join(connection_id.split("_")[:-1])
        if session_id in self.session_players:
            self.session_players[session_id].discard(connection_id)
            
            # إذا لم يعد هناك لاعبين في الجلسة، قم بإيقاف المؤقت
            if not self.session_players[session_id]:
                await self.stop_session_timer(session_id)
        
        logger.info(f"❌ Client disconnected: {connection_id}")
        logger.info(f"📊 Active connections: {len(self.active_connections)}")
    
    async def broadcast(self, data: dict, session_id: str = None) -> None:
        """
        بث رسالة لجميع المتصلين أو لجلسة محددة
        
        Args:
            data: البيانات المراد بثها
            session_id: معرف الجلسة (اختياري، إذا لم يحدد يتم البث للجميع)
        """
        disconnected = []
        
        if session_id:
            # بث للاعبين في جلسة محددة
            target_prefix = f"{session_id}_"
            for conn_id, websocket in self.active_connections.items():
                if conn_id.startswith(target_prefix):
                    try:
                        await websocket.send_json(data)
                    except Exception as e:
                        logger.error(f"❌ Error sending to {conn_id}: {e}")
                        disconnected.append(conn_id)
        else:
            # بث للجميع
            for conn_id, websocket in self.active_connections.items():
                try:
                    await websocket.send_json(data)
                except Exception as e:
                    logger.error(f"❌ Error broadcasting to {conn_id}: {e}")
                    disconnected.append(conn_id)
        
        # تنظيف الاتصالات المقطوعة
        for conn_id in disconnected:
            await self.disconnect(conn_id)
    
    async def send_to_player(
        self, 
        session_id: str, 
        player_id: str, 
        data: dict
    ) -> bool:
        """
        إرسال رسالة للاعب محدد
        
        Args:
            session_id: معرف الجلسة
            player_id: معرف اللاعب
            data: البيانات المراد إرسالها
            
        Returns:
            True إذا تم الإرسال بنجاح
        """
        connection_id = f"{session_id}_{player_id}"
        
        if connection_id in self.active_connections:
            try:
                await self.active_connections[connection_id].send_json(data)
                return True
            except Exception as e:
                logger.error(f"❌ Error sending to player {player_id}: {e}")
                await self.disconnect(connection_id)
        
        return False
    
    def get_session(self, session_id: str) -> Optional[AuctionManager]:
        """الحصول على جلسة مزاد"""
        return self.sessions.get(session_id)
    
    def create_session(
        self, 
        session_id: str, 
        player1_id: str, 
        player2_id: str
    ) -> AuctionManager:
        """
        إنشاء جلسة مزاد جديدة
        
        Args:
            session_id: معرف الجلسة
            player1_id: معرف اللاعب الأول
            player2_id: معرف اللاعب الثاني
            
        Returns:
            كائن AuctionManager
        """
        auction = AuctionManager(session_id, player1_id, player2_id)
        self.sessions[session_id] = auction
        
        # إنشاء مؤقت للجلسة
        self.timers[session_id] = SessionTimer(session_id)
        
        logger.info(f"🎮 Session created: {session_id} ({player1_id} vs {player2_id})")
        return auction
    
    def get_timer(self, session_id: str) -> Optional[SessionTimer]:
        """الحصول على مؤقت الجلسة"""
        return self.timers.get(session_id)
    
    async def start_session_timer(
        self, 
        session_id: str, 
        player_id: str
    ) -> None:
        """
        بدء المؤقت الخلفي للجلسة
        
        Args:
            session_id: معرف الجلسة
            player_id: معرف اللاعب صاحب الدور
        """
        timer = self.get_timer(session_id)
        if not timer:
            timer = SessionTimer(session_id)
            self.timers[session_id] = timer
        
        timer.start(player_id)
        
        # إلغاء المهمة السابقة إذا وجدت
        if session_id in self._timer_tasks:
            self._timer_tasks[session_id].cancel()
        
        # إنشاء مهمة مراقبة جديدة
        self._timer_tasks[session_id] = asyncio.create_task(
            self._monitor_timer(session_id)
        )
        
        logger.info(f"⏱️ Timer started for session {session_id}, player {player_id}")
    
    async def stop_session_timer(self, session_id: str) -> None:
        """
        إيقاف المؤقت الخلفي للجلسة
        
        Args:
            session_id: معرف الجلسة
        """
        timer = self.get_timer(session_id)
        if timer:
            timer.stop()
        
        # إلغاء مهمة المراقبة
        if session_id in self._timer_tasks:
            self._timer_tasks[session_id].cancel()
            del self._timer_tasks[session_id]
        
        logger.info(f"⏹️ Timer stopped for session {session_id}")
    
    async def _monitor_timer(self, session_id: str) -> None:
        """
        مهمة مراقبة المؤقت الخلفي
        
        تتحقق دورياً من انتهاء الوقت وتتخذ الإجراء المناسب
        
        Args:
            session_id: معرف الجلسة
        """
        logger.info(f"🔍 Timer monitoring started for session {session_id}")
        
        try:
            while True:
                await asyncio.sleep(TIMER_CHECK_INTERVAL)
                
                timer = self.get_timer(session_id)
                if not timer or timer.status != TimerStatus.RUNNING:
                    break
                
                # إرسال تحديث المؤقت لجميع المتصلين
                await self.broadcast({
                    "type": "timer_update",
                    "session_id": session_id,
                    "timer": timer.to_dict(),
                    "timestamp": datetime.utcnow().isoformat(),
                }, session_id)
                
                # التحقق من انتهاء الوقت
                if timer.is_expired():
                    logger.info(f"⏰ Timer expired for session {session_id}, player {timer.current_player_id}")
                    await self._handle_timer_expiration(session_id)
                    break
                    
        except asyncio.CancelledError:
            logger.info(f"🛑 Timer monitoring cancelled for session {session_id}")
        except Exception as e:
            logger.error(f"❌ Timer monitoring error for session {session_id}: {e}")
    
    async def _handle_timer_expiration(self, session_id: str) -> None:
        """
        معالجة انتهاء المؤقت
        
        Args:
            session_id: معرف الجلسة
        """
        auction = self.get_session(session_id)
        timer = self.get_timer(session_id)
        
        if not auction or not timer:
            return
        
        expired_player = timer.current_player_id
        
        # إرسال إشعار بانتهاء الوقت
        await self.broadcast({
            "type": "timer_expired",
            "session_id": session_id,
            "player_id": expired_player,
            "message": f"⏰ انتهى وقت اللاعب {expired_player}",
            "timestamp": datetime.utcnow().isoformat(),
        }, session_id)
        
        # تحديث حالة المزاد (تخطي تلقائي أو إنهاء)
        try:
            success, state = auction.check_timer_expired()
            
            if success:
                # إيقاف المؤقت الحالي
                timer.stop()
                
                if state.get("auction_completed"):
                    # اكتمل المزاد - إرسال النتيجة النهائية
                    await self.broadcast({
                        "type": "auction_completed",
                        "session_id": session_id,
                        "data": state,
                        "timestamp": datetime.utcnow().isoformat(),
                    }, session_id)
                    logger.info(f"🏁 Auction completed for session {session_id}")
                else:
                    # تحديد اللاعب التالي
                    next_player = state.get("current_turn_player")
                    
                    # إرسال حالة المزاد المحدثة
                    await self.broadcast({
                        "type": "auction_state",
                        "session_id": session_id,
                        "data": state,
                        "timestamp": datetime.utcnow().isoformat(),
                    }, session_id)
                    
                    # بدء مؤقت للاعب التالي
                    if next_player:
                        await self.start_session_timer(session_id, next_player)
                        
                        # إذا كان الدور على البوت، نفذ حركته تلقائياً
                        if next_player == "Goat_Bot" or "bot" in next_player.lower():
                            await self._execute_bot_turn(session_id)
            else:
                logger.warning(f"⚠️ Timer expiration handling failed for session {session_id}")
                
        except Exception as e:
            logger.error(f"❌ Error handling timer expiration: {e}")
    
    async def _execute_bot_turn(self, session_id: str) -> None:
        """
        تنفيذ دور البوت تلقائياً
        
        Args:
            session_id: معرف الجلسة
        """
        try:
            # تأخير لمحاكاة تفكير البوت
            await asyncio.sleep(BOT_RESPONSE_DELAY)
            
            auction = self.get_session(session_id)
            if not auction:
                return
            
            state = auction.get_auction_state()
            current_bid = state.get("highest_bid", 0)
            current_player = state.get("current_player", {})
            player_rating = current_player.get("rating", 80)
            player_position = current_player.get("position", "MID")
            cards_remaining = 9 - state.get("auction_index", 0)
            
            # استخدام ذكاء البوت لاتخاذ القرار
            bot_decision = goat_ai.decide_bid(
                current_bid=current_bid,
                player_rating=player_rating,
                max_budget=100,
                position=player_position,
                cards_remaining=cards_remaining
            )
            
            if bot_decision.get("should_bid") and bot_decision.get("amount", 0) > current_bid:
                # البوت يزايد
                bot_amount = bot_decision["amount"]
                success, state = auction.place_bid("Goat_Bot", bot_amount)
                
                if success:
                    await self.broadcast({
                        "type": "bid_placed",
                        "session_id": session_id,
                        "player_id": "Goat_Bot",
                        "amount": bot_amount,
                        "bot_strategy": bot_decision.get("strategy", "unknown"),
                        "data": state,
                        "timestamp": datetime.utcnow().isoformat(),
                    }, session_id)
                    
                    # بدء مؤقت للاعب البشري
                    next_player = state.get("current_turn_player")
                    if next_player:
                        await self.start_session_timer(session_id, next_player)
            else:
                # البوت يتخطى
                success, state = auction.skip_bid("Goat_Bot")
                
                if success:
                    await self.broadcast({
                        "type": "turn_skipped",
                        "session_id": session_id,
                        "player_id": "Goat_Bot",
                        "reason": bot_decision.get("reason", "تخطي استراتيجي"),
                        "data": state,
                        "timestamp": datetime.utcnow().isoformat(),
                    }, session_id)
                    
                    # التحقق من اكتمال المزاد
                    if state.get("auction_completed"):
                        await self.broadcast({
                            "type": "auction_completed",
                            "session_id": session_id,
                            "data": state,
                        }, session_id)
                    else:
                        next_player = state.get("current_turn_player")
                        if next_player:
                            await self.start_session_timer(session_id, next_player)
                            
        except Exception as e:
            logger.error(f"❌ Error executing bot turn: {e}")
    
    def _start_cleanup_task(self) -> None:
        """بدء مهمة تنظيف الجلسات غير النشطة"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_inactive_sessions())
    
    async def _cleanup_inactive_sessions(self) -> None:
        """تنظيف الجلسات غير النشطة بشكل دوري"""
        while True:
            try:
                await asyncio.sleep(CLEANUP_INTERVAL)
                
                current_time = datetime.utcnow()
                sessions_to_remove = []
                
                for session_id, timer in self.timers.items():
                    if timer.last_activity:
                        inactive_time = (current_time - timer.last_activity).total_seconds()
                        # إزالة الجلسات غير النشطة لأكثر من 30 دقيقة
                        if inactive_time > 1800:
                            sessions_to_remove.append(session_id)
                
                for session_id in sessions_to_remove:
                    logger.info(f"🧹 Cleaning up inactive session: {session_id}")
                    await self.stop_session_timer(session_id)
                    
                    if session_id in self.timers:
                        del self.timers[session_id]
                    if session_id in self.sessions:
                        del self.sessions[session_id]
                    if session_id in self.session_players:
                        del self.session_players[session_id]
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"❌ Cleanup task error: {e}")


# إنشاء مدير الاتصالات العام
manager = ConnectionManager()


# ==================== WebSocket Endpoint ====================

@router.websocket("/game/{session_id}/{player_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    session_id: str, 
    player_id: str
):
    """
    نقطة نهاية WebSocket للتواصل المباشر في اللعبة
    
    المعاملات:
        websocket: اتصال WebSocket
        session_id: معرف جلسة اللعبة
        player_id: معرف اللاعب
    """
    connection_id = f"{session_id}_{player_id}"
    await manager.connect(websocket, connection_id)
    
    # إرسال تأكيد الاتصال
    await websocket.send_json({
        "type": "connected",
        "session_id": session_id,
        "player_id": player_id,
        "message": "تم الاتصال بنجاح",
        "timestamp": datetime.utcnow().isoformat(),
    })
    
    try:
        while True:
            # استقبال البيانات مع مهلة للتحقق من الاتصال
            try:
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=60  # مهلة 60 ثانية للرسالة التالية
                )
            except asyncio.TimeoutError:
                # إرسال ping للتحقق من الاتصال
                try:
                    await websocket.send_json({
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except:
                    break
                continue
            
            action = data.get("action")
            
            logger.info(
                f"📩 Received action '{action}' from {player_id} "
                f"in session {session_id}"
            )
            
            # توجيه الإجراء إلى المعالج المناسب
            if action == "start_auction":
                await handle_start_auction(websocket, session_id, player_id, data)
            elif action == "add_bot":
                await handle_add_bot(websocket, session_id, player_id, data)
            elif action == "place_bid":
                await handle_place_bid(websocket, session_id, player_id, data)
            elif action == "skip_bid":
                await handle_skip_bid(websocket, session_id, player_id, data)
            elif action == "start_match":
                await handle_start_match(websocket, session_id, player_id, data)
            elif action == "get_state":
                await handle_get_state(websocket, session_id, player_id, data)
            elif action == "check_timer":
                await handle_check_timer(websocket, session_id, player_id, data)
            elif action == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"إجراء غير معروف: {action}",
                    "timestamp": datetime.utcnow().isoformat(),
                })
    
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"❌ WebSocket error for {connection_id}: {e}")
    finally:
        await manager.disconnect(connection_id)


# ==================== Action Handlers ====================

async def handle_start_auction(
    websocket: WebSocket, 
    session_id: str, 
    player_id: str, 
    data: dict
) -> None:
    """
    معالج بدء المزاد مع دعم الجلسات المشتركة
    
    Args:
        websocket: اتصال WebSocket
        session_id: معرف الجلسة
        player_id: معرف اللاعب
        data: بيانات الطلب
    """
    opponent_id = data.get("opponent_id", "Goat_Bot")
    
    # التحقق من وجود الجلسة مسبقاً
    if session_id not in manager.sessions:
        auction = manager.create_session(session_id, player_id, opponent_id)
        state = auction.start_auction()
        logger.info(f"🆕 New auction session created: {session_id}")
    else:
        auction = manager.get_session(session_id)
        state = auction.get_auction_state()
        logger.info(f"🔗 Player {player_id} joined existing session: {session_id}")
    
    # بدء المؤقت للاعب الأول
    current_turn = state.get("current_turn_player", player_id)
    await manager.start_session_timer(session_id, current_turn)
    
    # بث حالة المزاد لجميع المتصلين
    await manager.broadcast({
        "type": "auction_started",
        "session_id": session_id,
        "data": state,
        "timer": manager.get_timer(session_id).to_dict(),
        "timestamp": datetime.utcnow().isoformat(),
    }, session_id)
    
    logger.info(f"🚀 Auction started for session {session_id}")


async def handle_add_bot(
    websocket: WebSocket, 
    session_id: str, 
    player_id: str, 
    data: dict
) -> None:
    """
    معالج إضافة البوت كخصم
    
    Args:
        websocket: اتصال WebSocket
        session_id: معرف الجلسة
        player_id: معرف اللاعب
        data: بيانات الطلب
    """
    bot_id = "Goat_Bot"
    
    if session_id not in manager.sessions:
        auction = manager.create_session(session_id, player_id, bot_id)
        state = auction.start_auction()
    else:
        auction = manager.get_session(session_id)
        state = auction.get_auction_state()
    
    # بدء المؤقت
    current_turn = state.get("current_turn_player", player_id)
    await manager.start_session_timer(session_id, current_turn)
    
    # إذا كان الدور على البوت، نفذ حركته
    if current_turn == bot_id:
        await manager._execute_bot_turn(session_id)
    
    await manager.broadcast({
        "type": "auction_started",
        "session_id": session_id,
        "bot_name": goat_ai.name,
        "bot_version": goat_ai.version,
        "data": state,
        "timer": manager.get_timer(session_id).to_dict(),
        "timestamp": datetime.utcnow().isoformat(),
    }, session_id)
    
    logger.info(f"🤖 Bot Goat joined session {session_id} against {player_id}")


async def handle_place_bid(
    websocket: WebSocket, 
    session_id: str, 
    player_id: str, 
    data: dict
) -> None:
    """
    معالج تقديم المزايدة مع استجابة البوت التلقائية
    
    Args:
        websocket: اتصال WebSocket
        session_id: معرف الجلسة
        player_id: معرف اللاعب
        data: بيانات المزايدة
    """
    amount = data.get("amount")
    
    if amount is None or amount <= 0:
        await websocket.send_json({
            "type": "error",
            "message": "قيمة المزايدة غير صالحة",
        })
        return
    
    auction = manager.get_session(session_id)
    if not auction:
        await websocket.send_json({
            "type": "error",
            "message": "جلسة المزاد غير موجودة",
        })
        return
    
    # تقديم المزايدة
    success, state = auction.place_bid(player_id, amount)
    
    if success:
        # إيقاف المؤقت الحالي
        await manager.stop_session_timer(session_id)
        
        # بث تأكيد المزايدة
        await manager.broadcast({
            "type": "bid_placed",
            "session_id": session_id,
            "player_id": player_id,
            "amount": amount,
            "data": state,
            "timestamp": datetime.utcnow().isoformat(),
        }, session_id)
        
        # التحقق من اكتمال المزاد
        if state.get("auction_completed"):
            await manager.broadcast({
                "type": "auction_completed",
                "session_id": session_id,
                "data": state,
            }, session_id)
        else:
            # بدء مؤقت للاعب التالي
            next_player = state.get("current_turn_player")
            if next_player:
                await manager.start_session_timer(session_id, next_player)
                
                # إذا كان الدور على البوت
                if next_player == "Goat_Bot":
                    await manager._execute_bot_turn(session_id)
    else:
        await websocket.send_json({
            "type": "bid_failed",
            "message": state.get("error", "فشلت المزايدة"),
            "data": state,
            "timestamp": datetime.utcnow().isoformat(),
        })


async def handle_skip_bid(
    websocket: WebSocket, 
    session_id: str, 
    player_id: str, 
    data: dict
) -> None:
    """
    معالج تخطي المزايدة
    
    Args:
        websocket: اتصال WebSocket
        session_id: معرف الجلسة
        player_id: معرف اللاعب
        data: بيانات الطلب
    """
    auction = manager.get_session(session_id)
    if not auction:
        await websocket.send_json({
            "type": "error",
            "message": "جلسة المزاد غير موجودة",
        })
        return
    
    # تخطي المزايدة
    success, state = auction.skip_bid(player_id)
    
    if success:
        # إيقاف المؤقت الحالي
        await manager.stop_session_timer(session_id)
        
        # بث تأكيد التخطي
        await manager.broadcast({
            "type": "turn_skipped",
            "session_id": session_id,
            "player_id": player_id,
            "data": state,
            "timestamp": datetime.utcnow().isoformat(),
        }, session_id)
        
        # التحقق من اكتمال المزاد
        if state.get("auction_completed"):
            await manager.broadcast({
                "type": "auction_completed",
                "session_id": session_id,
                "data": state,
            }, session_id)
        else:
            # بدء مؤقت للاعب التالي
            next_player = state.get("current_turn_player")
            if next_player:
                await manager.start_session_timer(session_id, next_player)
                
                # إذا كان الدور على البوت
                if next_player == "Goat_Bot":
                    await manager._execute_bot_turn(session_id)
    else:
        await websocket.send_json({
            "type": "skip_failed",
            "message": state.get("error", "فشل التخطي"),
            "data": state,
            "timestamp": datetime.utcnow().isoformat(),
        })


async def handle_start_match(
    websocket: WebSocket, 
    session_id: str, 
    player_id: str, 
    data: dict
) -> None:
    """
    معالج بدء المباراة والمحاكاة
    
    Args:
        websocket: اتصال WebSocket
        session_id: معرف الجلسة
        player_id: معرف اللاعب
        data: بيانات الطلب
    """
    auction = manager.get_session(session_id)
    if not auction:
        await websocket.send_json({
            "type": "error",
            "message": "جلسة المزاد غير موجودة",
        })
        return
    
    # إيقاف المؤقت
    await manager.stop_session_timer(session_id)
    
    # إرسال إشعار ببدء المحاكاة
    await manager.broadcast({
        "type": "match_starting",
        "session_id": session_id,
        "message": "⚽ جاري محاكاة المباراة...",
        "timestamp": datetime.utcnow().isoformat(),
    }, session_id)
    
    # محاكاة المباراة
    try:
        player1_team = auction.player1_team
        player2_team = auction.player2_team
        
        match_engine = MatchEngine(player1_team, player2_team)
        match_result = match_engine.simulate_match()
        
        # بث نتيجة المباراة
        await manager.broadcast({
            "type": "match_completed",
            "session_id": session_id,
            "data": match_result,
            "timestamp": datetime.utcnow().isoformat(),
        }, session_id)
        
        logger.info(
            f"⚽ Match simulated for session {session_id}: "
            f"{match_result['player1_score']} - {match_result['player2_score']}"
        )
        
    except Exception as e:
        logger.error(f"❌ Match simulation error: {e}")
        await manager.broadcast({
            "type": "error",
            "message": "حدث خطأ أثناء محاكاة المباراة",
            "timestamp": datetime.utcnow().isoformat(),
        }, session_id)


async def handle_get_state(
    websocket: WebSocket, 
    session_id: str, 
    player_id: str, 
    data: dict
) -> None:
    """
    معالج طلب حالة المزاد الحالية
    
    Args:
        websocket: اتصال WebSocket
        session_id: معرف الجلسة
        player_id: معرف اللاعب
        data: بيانات الطلب
    """
    auction = manager.get_session(session_id)
    if not auction:
        await websocket.send_json({
            "type": "error",
            "message": "جلسة المزاد غير موجودة",
        })
        return
    
    state = auction.get_auction_state()
    timer = manager.get_timer(session_id)
    
    await websocket.send_json({
        "type": "auction_state",
        "session_id": session_id,
        "data": state,
        "timer": timer.to_dict() if timer else None,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def handle_check_timer(
    websocket: WebSocket, 
    session_id: str, 
    player_id: str, 
    data: dict
) -> None:
    """
    معالج التحقق من المؤقت (يستخدم من قبل العميل للمزامنة)
    
    Args:
        websocket: اتصال WebSocket
        session_id: معرف الجلسة
        player_id: معرف اللاعب
        data: بيانات الطلب
    """
    timer = manager.get_timer(session_id)
    
    if timer:
        # التحقق من انتهاء المؤقت
        if timer.is_expired():
            await manager._handle_timer_expiration(session_id)
        else:
            await websocket.send_json({
                "type": "timer_update",
                "session_id": session_id,
                "timer": timer.to_dict(),
                "timestamp": datetime.utcnow().isoformat(),
            })
    else:
        await websocket.send_json({
            "type": "timer_update",
            "session_id": session_id,
            "timer": None,
