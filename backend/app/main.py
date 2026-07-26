"""
OSM FUT Dual Battle - Main Application Server (مُطوَّر مع تخزين مؤقت، سجل مباريات، WebSocket محسّن)
====================================================================================================
التحسينات:
1. دعم تخزين الجلسات في ملفات (مع بنية قابلة للتوسع لـ Redis لاحقاً) لمنع فقدان البيانات عند إعادة التشغيل.
2. مسار GET /api/matches/history لعرض سجل المباريات.
3. تحسين WebSocket مع heartbeat/ping-pong وإدارة أفضل للاتصالات المقطوعة.
"""

import os
import sys
import time
import json
import logging
import platform
import traceback
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager
from collections import defaultdict
import pickle

from fastapi import FastAPI, Request, status, HTTPException, Path, Query, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field, validator

# ==================== استيراد الراوترات الأصلية ====================
try:
    from app.api import players, websocket
    ROUTERS_AVAILABLE = True
except ImportError:
    players = None
    websocket = None
    ROUTERS_AVAILABLE = False
    logging.warning("⚠️ لم يتم العثور على app.api.players / websocket - سيتم تشغيل النظام بدونهما")

try:
    from app.utils.constants import CORS_ORIGINS
except ImportError:
    CORS_ORIGINS = ["*"]
    logging.warning("⚠️ لم يتم العثور على app.utils.constants - سيتم استخدام CORS_ORIGINS = ['*']")

# ==================== استيراد نظام المزاد ====================
try:
    from auction import OSMDualBattle, AUCTION_POSITIONS, POSITION_DISPLAY
    GAME_AVAILABLE = True
except ImportError:
    GAME_AVAILABLE = False
    logging.error("❌ لم يتم العثور على auction.py - لن يعمل نظام المزاد")
    sys.exit(1)

# ==================== إعداد التسجيل ====================
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-25s | %(funcName)-20s | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt=LOG_DATE_FORMAT,
    handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler("server.log", encoding="utf-8")]
)

logger = logging.getLogger("main")
error_logger = logging.getLogger("error")
performance_logger = logging.getLogger("performance")

logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("websockets").setLevel(logging.WARNING)

# ==================== أدوات التشخيص ====================
def print_diagnostics():
    separator = "=" * 70
    print(f"\n{separator}")
    print(f"🔍 SYSTEM DIAGNOSTICS")
    print(f"{separator}")
    print(f"🖥️  Platform: {platform.platform()}")
    print(f"🐍 Python Version: {sys.version}")
    print(f"📁 Working Directory: {os.getcwd()}")
    env_vars = ["PORT", "ENVIRONMENT", "REDIS_URL"]
    for var in env_vars:
        val = os.environ.get(var)
        print(f"   {var}: {val if val else '[NOT SET]'}")
    print(f"\n📂 Core Files Check:")
    for f in ["auction.py", "app/api/players.py"]:
        exists = os.path.exists(f)
        print(f"   {'✅' if exists else '❌'} {f}")
    print(f"   {'✅' if ROUTERS_AVAILABLE else '❌'} Routers: {'Loaded' if ROUTERS_AVAILABLE else 'Missing'}")
    print(f"   {'✅' if GAME_AVAILABLE else '❌'} Game Engine: {'Loaded' if GAME_AVAILABLE else 'Missing'}")
    print(f"{separator}\n")

print_diagnostics()

# ==================== واجهة التخزين القابلة للتوسع ====================
class StorageBackend:
    """فئة أساسية للتخزين المؤقت (ملفات حالياً، Redis في المستقبل)"""
    async def save_session(self, session_id: str, data: dict):
        raise NotImplementedError

    async def load_session(self, session_id: str) -> Optional[dict]:
        raise NotImplementedError

    async def delete_session(self, session_id: str):
        raise NotImplementedError

    async def list_sessions(self) -> List[str]:
        raise NotImplementedError

class FileStorageBackend(StorageBackend):
    """تطبيق تخزين باستخدام ملفات JSON"""
    def __init__(self, directory: str = "sessions"):
        self.directory = directory
        os.makedirs(directory, exist_ok=True)

    async def save_session(self, session_id: str, data: dict):
        path = os.path.join(self.directory, f"{session_id}.json")
        try:
            # لا يمكن تخزين كائنات AuctionManager مباشرة، لذا نحفظ فقط البيانات الأساسية
            # سنقوم بتخزين حالة الجلسة ونتائج المباراة فقط
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save session {session_id}: {e}")

    async def load_session(self, session_id: str) -> Optional[dict]:
        path = os.path.join(self.directory, f"{session_id}.json")
        if not os.path.exists(path):
            return None
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load session {session_id}: {e}")
            return None

    async def delete_session(self, session_id: str):
        path = os.path.join(self.directory, f"{session_id}.json")
        if os.path.exists(path):
            os.remove(path)

    async def list_sessions(self) -> List[str]:
        files = os.listdir(self.directory)
        return [f.replace('.json', '') for f in files if f.endswith('.json')]

# ==================== إعدادات الخادم ====================
SERVER_INFO = {
    "application": "OSM FUT Dual Battle",
    "version": "2.2.0",
    "environment": os.environ.get("ENVIRONMENT", "development"),
    "python_version": sys.version,
    "platform": platform.platform(),
    "start_time": None,
    "requests_processed": 0,
    "errors_encountered": 0,
    "websocket_connections": 0,
}

PERFORMANCE_METRICS = {
    "total_requests": 0,
    "total_errors": 0,
    "endpoints": {},
    "websocket_messages": 0,
}

# ==================== نظام اللعبة والتخزين ====================
game = OSMDualBattle()
storage: StorageBackend = FileStorageBackend()

# ==================== إدارة WebSocket المحسّنة ====================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = defaultdict(list)
        self.heartbeat_task: Optional[asyncio.Task] = None

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id].append(websocket)
        SERVER_INFO["websocket_connections"] = len(self._all_websockets())
        logger.info(f"WebSocket connected for session {session_id}")

    def disconnect(self, session_id: str, websocket: WebSocket):
        if websocket in self.active_connections[session_id]:
            self.active_connections[session_id].remove(websocket)
            SERVER_INFO["websocket_connections"] = len(self._all_websockets())
            logger.info(f"WebSocket disconnected for session {session_id}")
            # إذا لم يعد هناك اتصالات للجلسة، نحفظ الحالة
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, session_id: str, message: dict):
        stale = []
        for ws in self.active_connections[session_id]:
            try:
                await ws.send_json(message)
                PERFORMANCE_METRICS["websocket_messages"] += 1
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(session_id, ws)

    def _all_websockets(self):
        for sess_id, sockets in self.active_connections.items():
            yield from sockets

    async def start_heartbeat(self, interval: int = 30):
        """إرسال ping دوري للاتصالات وإزالة الميتة"""
        while True:
            await asyncio.sleep(interval)
            for session_id in list(self.active_connections.keys()):
                stale = []
                for ws in self.active_connections[session_id]:
                    try:
                        await ws.send_json({"type": "ping"})
                    except Exception:
                        stale.append(ws)
                for ws in stale:
                    self.disconnect(session_id, ws)
                if not self.active_connections.get(session_id):
                    del self.active_connections[session_id]

manager = ConnectionManager()

# ==================== نماذج البيانات ====================
class BidRequest(BaseModel):
    player_id: str = Field(..., description="معرف اللاعب")
    amount: float = Field(..., gt=0)

    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('المبلغ يجب أن يكون أكبر من صفر')
        return v

class SkipRequest(BaseModel):
    player_id: str = Field(..., description="معرف اللاعب")

class CreateSessionRequest(BaseModel):
    player_id: str = Field(..., description="معرف اللاعب البشري")
    bot_name: Optional[str] = "Goat_Bot"

# ==================== دورة الحياة ====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_start = time.time()
    logger.info("=" * 60)
    logger.info("🎮 OSM FUT Dual Battle Server Starting...")
    logger.info(f"📅 Timestamp: {datetime.now(timezone.utc).isoformat()}")
    SERVER_INFO["start_time"] = datetime.now(timezone.utc)

    # استعادة الجلسات المحفوظة (لن نستعيد الكائنات، بل نعيد بناء القوائم)
    try:
        saved_sessions = await storage.list_sessions()
        for sid in saved_sessions:
            data = await storage.load_session(sid)
            if data:
                # استعادة الجلسات المكتملة فقط (لأن الجلسات النشطة ستعاد تهيئتها)
                game.completed_auctions[sid] = data
        logger.info(f"✅ Restored {len(saved_sessions)} saved sessions")
    except Exception as e:
        logger.error(f"Failed to restore sessions: {e}")

    # بدء مهمة heartbeat للـ WebSocket
    heartbeat_task = asyncio.create_task(manager.start_heartbeat())

    yield

    # تنظيف عند الإيقاف
    heartbeat_task.cancel()
    try:
        await heartbeat_task
    except asyncio.CancelledError:
        pass

    # حفظ جميع الجلسات النشطة والمكتملة
    for sid, auction in game.active_auctions.items():
        state = auction.get_state()
        await storage.save_session(sid, state)
    for sid, data in game.completed_auctions.items():
        await storage.save_session(sid, data)
    logger.info("✅ All sessions saved")

    logger.info("🎮 Server Shut Down.")

# ==================== إنشاء التطبيق ====================
app = FastAPI(
    title="OSM FUT Dual Battle API",
    description="⚔️ نظام المزاد والمباريات - واجهة برمجة تطبيقات متطورة",
    version="2.2.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ==================== Middleware ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "Accept"],
    expose_headers=["X-Request-ID", "X-Response-Time"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

if SERVER_INFO["environment"] == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = f"{int(time.time() * 1000)}-{os.urandom(4).hex()}"
    request.state.request_id = request_id
    start = time.time()
    SERVER_INFO["requests_processed"] += 1
    PERFORMANCE_METRICS["total_requests"] += 1
    try:
        response = await call_next(request)
        process_time = time.time() - start
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{process_time:.3f}s"
        response.headers["X-Server-Version"] = SERVER_INFO["version"]
        endpoint = request.url.path
        if endpoint not in PERFORMANCE_METRICS["endpoints"]:
            PERFORMANCE_METRICS["endpoints"][endpoint] = {"count": 0, "total_time": 0.0, "errors": 0}
        PERFORMANCE_METRICS["endpoints"][endpoint]["count"] += 1
        PERFORMANCE_METRICS["endpoints"][endpoint]["total_time"] += process_time
        return response
    except Exception as e:
        SERVER_INFO["errors_encountered"] += 1
        PERFORMANCE_METRICS["total_errors"] += 1
        raise

# ==================== معالجات الأخطاء ====================
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc):
    return JSONResponse(status_code=exc.status_code,
                        content={"success": False, "error": {"code": exc.status_code, "message": str(exc.detail)}})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc):
    errors = [{"field": " → ".join(str(loc) for loc in e["loc"]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(status_code=422,
                        content={"success": False, "error": {"code": 422, "message": "فشل التحقق", "details": errors}})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc):
    logger.critical(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500,
                        content={"success": False, "error": {"code": 500, "message": "خطأ داخلي في الخادم"}})

# ==================== Static files ====================
STATIC_DIR = os.path.join(os.getcwd(), "app", "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ==================== Original Routers ====================
if ROUTERS_AVAILABLE:
    app.include_router(players.router, prefix="/api/players", tags=["Players"])
    app.include_router(websocket.router, prefix="/api/ws", tags=["WebSocket"])

# ==================== مراقبة ====================
@app.get("/health")
async def health(): return {"status": "healthy"}

@app.get("/api/status")
async def detailed_status():
    uptime_seconds = (datetime.now(timezone.utc) - SERVER_INFO["start_time"]).total_seconds() if SERVER_INFO["start_time"] else 0
    return {"success": True, "data": {"server": SERVER_INFO, "uptime": uptime_seconds, "performance": PERFORMANCE_METRICS}}

# ==================== مسار تاريخ المباريات ====================
@app.get("/api/matches/history", tags=["المباريات"])
async def match_history(limit: int = Query(50, ge=1, le=200)):
    """عرض سجل المباريات السابقة (آخر 50 بشكل افتراضي)"""
    history = game.get_match_history(limit)
    return {"success": True, "data": history, "count": len(history)}

# ==================== WebSocket محسّن ====================
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            if action == "get_state":
                state = game.get_auction_state(session_id)
                await websocket.send_json({"type": "state_update", "data": state})
            elif action == "pong":
                # استجابة لـ heartbeat
                pass
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id, websocket)

# ==================== مسارات API ====================
@app.post("/session")
async def create_session(request: CreateSessionRequest):
    data = game.create_session(request.player_id)
    # حفظ الجلسة الجديدة
    await storage.save_session(data["session_id"], {"state": "new", "created_at": time.time()})
    return {"success": True, "data": data}

@app.get("/sessions")
async def list_sessions():
    active = list(game.active_auctions.keys())
    completed = list(game.completed_auctions.keys())
    return {"success": True, "data": {"active": active, "completed": completed, "count": len(active) + len(completed)}}

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    if session_id in game.active_auctions:
        del game.active_auctions[session_id]
    elif session_id in game.completed_auctions:
        del game.completed_auctions[session_id]
    else:
        raise HTTPException(status_code=404, detail="الجلسة غير موجودة")
    await storage.delete_session(session_id)
    return {"success": True, "message": "تم حذف الجلسة"}

@app.post("/session/{session_id}/start")
async def start_auction(session_id: str):
    result = game.start_auction(session_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    await manager.broadcast(session_id, {"type": "auction_started", "data": result})
    return {"success": True, "data": result}

@app.post("/session/{session_id}/bid")
async def place_bid(session_id: str, bid: BidRequest):
    result = game.place_bid(session_id, bid.player_id, bid.amount)
    if not result["success"]:
        msg = result.get("result", {}).get("error", "فشل العرض")
        raise HTTPException(status_code=400, detail=msg)
    state = game.get_auction_state(session_id)
    await manager.broadcast(session_id, {"type": "bid_placed", "data": state})
    # حفظ بعد كل عرض
    await storage.save_session(session_id, state)
    return result

@app.post("/session/{session_id}/skip")
async def skip_turn(session_id: str, skip: SkipRequest):
    result = game.skip_turn(session_id, skip.player_id)
    if not result["success"]:
        msg = result.get("result", {}).get("error", "فشل التخطي")
        raise HTTPException(status_code=400, detail=msg)
    state = game.get_auction_state(session_id)
    await manager.broadcast(session_id, {"type": "turn_skipped", "data": state})
    await storage.save_session(session_id, state)
    return result

@app.get("/session/{session_id}/state")
async def get_state(session_id: str):
    state = game.get_auction_state(session_id)
    if "error" in state:
        raise HTTPException(status_code=404, detail=state["error"])
    return {"success": True, "data": state}

@app.get("/session/{session_id}/team/{player_id}")
async def reveal_team(session_id: str, player_id: str):
    team = game.reveal_team(session_id, player_id)
    if "error" in team:
        raise HTTPException(status_code=404, detail=team["error"])
    return {"success": True, "data": team}

@app.post("/session/{session_id}/match")
async def play_match(session_id: str):
    result = game.play_match(session_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    await manager.broadcast(session_id, {"type": "match_result", "data": result})
    # حفظ نتيجة المباراة مع الجلسة
    await storage.save_session(session_id, game.get_auction_state(session_id))
    return {"success": True, "data": result}

# ==================== نقطة الدخول ====================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = SERVER_INFO["environment"] == "development"
    workers = int(os.environ.get("WORKERS", 1))
    logger.info(f"🚀 Starting on {host}:{port} (debug={debug})")
    uvicorn_config = {
        "app": "main:app" if not debug else app,
        "host": host,
        "port": port,
        "log_level": "info" if not debug else "debug",
        "access_log": True,
        "timeout_keep_alive": 30,
        "limit_concurrency": 1000,
        "limit_max_requests": 10000,
    }
    if debug:
        uvicorn_config["reload"] = True
        uvicorn_config["reload_dirs"] = ["app", "."]
    uvicorn.run(**uvicorn_config)
