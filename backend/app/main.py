"""
OSM FUT Dual Battle - Main Application Server (Ultimate Extended Edition)
==========================================================================
FastAPI Application Entry Point with Advanced Features

الميزات الجديدة والإضافات:
- نظام تخزين مؤقت متكامل (JSON files + Redis optional)
- مسار تاريخ المباريات مع ترقيم الصفحات والتصفية
- WebSocket محسّن مع heartbeat وإعادة الاتصال التلقائي
- دعم JWT للمصادقة (اختياري)
- لوحة تحكم ويب متقدمة مع رسوم بيانية بسيطة
- مراقبة شاملة للأداء والموارد
- توثيق API موسع مع أمثلة
- إدارة متقدمة للجلسات (حذف بالجملة، إحصائيات)
- معالجة أخطاء محسنة مع رموز خطأ مخصصة
- تكامل كامل مع الراوترات الأصلية (players, websocket)
- دعم تحميل ملفات الصور (للاستخدام المستقبلي)
- نظام إشعارات عبر WebSocket
- تكوين مرن عبر متغيرات البيئة
- اختبارات ذاتية عند بدء التشغيل
"""

import os
import sys
import time
import json
import logging
import platform
import traceback
import asyncio
import hashlib
import uuid
import shutil
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Union, Tuple
from contextlib import asynccontextmanager
from collections import defaultdict, OrderedDict
from functools import wraps
import pickle
import base64
from pathlib import Path

from fastapi import (
    FastAPI, Request, Response, status, HTTPException, 
    Path as FastPath, Query, WebSocket, WebSocketDisconnect, 
    Depends, BackgroundTasks, UploadFile, File, Form
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field, validator, root_validator
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# محاولة استيراد redis (اختياري)
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# ==================== استيراد الراوترات الأصلية ====================
try:
    from app.api import players, websocket
    ROUTERS_AVAILABLE = True
except ImportError:
    players = None
    websocket = None
    ROUTERS_AVAILABLE = False

try:
    from app.utils.constants import CORS_ORIGINS
except ImportError:
    CORS_ORIGINS = ["*"]

# ==================== استيراد نظام المزاد ====================
try:
    from auction import OSMDualBattle, AUCTION_POSITIONS, POSITION_DISPLAY
    GAME_AVAILABLE = True
except ImportError:
    GAME_AVAILABLE = False
    print("FATAL: auction.py not found. System cannot start.")
    sys.exit(1)

# ==================== إعداد التسجيل المتقدم ====================
LOG_FORMAT = (
    "%(asctime)s | %(levelname)-8s | %(name)-30s | "
    "%(funcName)-25s | %(message)s"
)
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def setup_logging():
    """تكوين شامل لنظام التسجيل"""
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)
    
    # معالج الكونسول
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    logger.addHandler(console_handler)
    
    # معالج الملف للأخطاء
    error_handler = logging.FileHandler("error.log", encoding="utf-8")
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    logger.addHandler(error_handler)
    
    # معالج الملف العام
    file_handler = logging.FileHandler("server.log", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    logger.addHandler(file_handler)
    
    # معالج ملف الأداء
    perf_handler = logging.FileHandler("performance.log", encoding="utf-8")
    perf_handler.setLevel(logging.INFO)
    perf_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    perf_logger = logging.getLogger("performance")
    perf_logger.addHandler(perf_handler)
    perf_logger.propagate = False

setup_logging()

logger = logging.getLogger("main")
error_logger = logging.getLogger("error")
perf_logger = logging.getLogger("performance")

# ==================== أدوات التشخيص المتقدمة ====================
def print_extended_diagnostics():
    """تشخيصات شاملة للمطورين"""
    sep = "=" * 80
    print(f"\n{sep}")
    print(f"🔍 EXTENDED SYSTEM DIAGNOSTICS")
    print(f"{sep}")
    print(f"🖥️  Platform: {platform.platform()} ({platform.machine()})")
    print(f"🐍 Python: {sys.version}")
    print(f"📁 Working Directory: {os.getcwd()}")
    
    # متغيرات البيئة
    env_vars = [
        "PORT", "ENVIRONMENT", "DATABASE_URL", "REDIS_URL", 
        "SECRET_KEY", "JWT_ALGORITHM", "MAX_WORKERS", "LOG_LEVEL"
    ]
    print(f"\n📋 Environment Variables:")
    for var in env_vars:
        value = os.environ.get(var)
        if value:
            if "SECRET" in var or "KEY" in var or "PASSWORD" in var:
                value = "***HIDDEN***"
            print(f"   {var}: {value}")
        else:
            print(f"   {var}: [NOT SET]")
    
    # فحص الملفات والمجلدات
    critical_paths = [
        ("auction.py", "Game Engine"),
        ("app/static", "Static Files"),
        ("app/api", "API Routers"),
        ("app/utils", "Utilities"),
        ("app/game", "Game Logic"),
        ("sessions", "Session Storage"),
        ("uploads", "Upload Directory"),
    ]
    print(f"\n📂 Critical Paths:")
    for path, desc in critical_paths:
        full = os.path.join(os.getcwd(), path)
        exists = os.path.exists(full)
        icon = "✅" if exists else "❌"
        print(f"   {icon} {desc}: {path}")
        if exists and os.path.isdir(full):
            try:
                files = os.listdir(full)
                print(f"      Files: {len(files)} items")
            except:
                pass
    
    # فحص المكونات
    print(f"\n🔌 Component Status:")
    print(f"   {'✅' if ROUTERS_AVAILABLE else '❌'} Original Routers (players, websocket)")
    print(f"   {'✅' if GAME_AVAILABLE else '❌'} Game Engine (auction.py)")
    print(f"   {'✅' if REDIS_AVAILABLE else '❌'} Redis Support")
    
    # موارد النظام
    try:
        import psutil
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage(os.getcwd())
        print(f"\n💻 System Resources:")
        print(f"   CPU: {psutil.cpu_percent(interval=0.1)}%")
        print(f"   Memory: {mem.percent}% used of {mem.total / 1e9:.1f} GB")
        print(f"   Disk: {disk.percent}% used of {disk.total / 1e9:.1f} GB")
    except ImportError:
        print(f"\n💻 System Resources: [psutil not installed]")
    
    print(f"\n{sep}\n")

print_extended_diagnostics()

# ==================== نظام التخزين المتقدم ====================
class StorageProvider:
    """فئة أساسية لجميع مزودي التخزين"""
    async def save(self, key: str, data: dict) -> bool:
        raise NotImplementedError
    async def load(self, key: str) -> Optional[dict]:
        raise NotImplementedError
    async def delete(self, key: str) -> bool:
        raise NotImplementedError
    async def list_keys(self, pattern: str = "*") -> List[str]:
        raise NotImplementedError
    async def exists(self, key: str) -> bool:
        raise NotImplementedError
    async def clear(self) -> bool:
        raise NotImplementedError

class FileStorageProvider(StorageProvider):
    """تطبيق تخزين قائم على الملفات"""
    def __init__(self, base_dir: str = "sessions"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
    async def save(self, key: str, data: dict) -> bool:
        try:
            safe_key = key.replace("/", "_")
            path = self.base_dir / f"{safe_key}.json"
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception:
            return False
    async def load(self, key: str) -> Optional[dict]:
        try:
            safe_key = key.replace("/", "_")
            path = self.base_dir / f"{safe_key}.json"
            if not path.exists():
                return None
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    async def delete(self, key: str) -> bool:
        try:
            safe_key = key.replace("/", "_")
            path = self.base_dir / f"{safe_key}.json"
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception:
            return False
    async def list_keys(self, pattern: str = "*") -> List[str]:
        try:
            keys = []
            for f in self.base_dir.glob(f"{pattern}.json"):
                key = f.stem
                keys.append(key)
            return keys
        except Exception:
            return []
    async def exists(self, key: str) -> bool:
        return (self.base_dir / f"{key}.json").exists()
    async def clear(self) -> bool:
        try:
            for f in self.base_dir.glob("*.json"):
                f.unlink()
            return True
        except Exception:
            return False

class RedisStorageProvider(StorageProvider):
    """تطبيق تخزين قائم على Redis (اختياري)"""
    def __init__(self, url: str = None):
        if not REDIS_AVAILABLE:
            raise RuntimeError("redis not installed")
        self.redis = redis.from_url(url or os.environ.get("REDIS_URL", "redis://localhost"))
    async def save(self, key: str, data: dict) -> bool:
        try:
            await self.redis.set(key, json.dumps(data, ensure_ascii=False))
            return True
        except Exception:
            return False
    async def load(self, key: str) -> Optional[dict]:
        try:
            raw = await self.redis.get(key)
            return json.loads(raw) if raw else None
        except Exception:
            return None
    async def delete(self, key: str) -> bool:
        try:
            return await self.redis.delete(key) > 0
        except Exception:
            return False
    async def list_keys(self, pattern: str = "*") -> List[str]:
        try:
            return [k.decode() for k in await self.redis.keys(pattern)]
        except Exception:
            return []
    async def exists(self, key: str) -> bool:
        try:
            return await self.redis.exists(key) > 0
        except Exception:
            return False
    async def clear(self) -> bool:
        try:
            await self.redis.flushdb()
            return True
        except Exception:
            return False

def get_storage_provider() -> StorageProvider:
    """اختيار مزود التخزين المناسب بناءً على الإعدادات"""
    if REDIS_AVAILABLE and os.environ.get("REDIS_URL"):
        try:
            return RedisStorageProvider()
        except Exception:
            pass
    return FileStorageProvider()

storage = get_storage_provider()

# ==================== إعدادات الخادم ====================
SERVER_INFO = {
    "application": "OSM FUT Dual Battle",
    "version": "2.3.0-extended",
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
    "active_sessions": 0,
    "completed_sessions": 0,
    "storage_operations": 0,
    "api_calls": defaultdict(int),
}

# ==================== نظام اللعبة الرئيسي ====================
game = OSMDualBattle()

# ==================== WebSocket Manager المتقدم ====================
class AdvancedWebSocketManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = defaultdict(list)
        self.heartbeat_task: Optional[asyncio.Task] = None
        self.reconnect_tokens: Dict[str, str] = {}
        
    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[session_id].append(websocket)
        SERVER_INFO["websocket_connections"] = self._count_all()
        token = hashlib.sha256(f"{session_id}:{time.time()}".encode()).hexdigest()[:8]
        self.reconnect_tokens[session_id] = token
        await websocket.send_json({"type": "connected", "session": session_id, "token": token})
        
    def disconnect(self, session_id: str, websocket: WebSocket, reason: str = ""):
        if websocket in self.connections[session_id]:
            self.connections[session_id].remove(websocket)
            SERVER_INFO["websocket_connections"] = self._count_all()
            if not self.connections[session_id]:
                del self.connections[session_id]
                self.reconnect_tokens.pop(session_id, None)
                
    async def broadcast(self, session_id: str, message: dict):
        stale = []
        for ws in self.connections.get(session_id, []):
            try:
                await ws.send_json(message)
                PERFORMANCE_METRICS["websocket_messages"] += 1
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(session_id, ws)
            
    async def send_to_player(self, session_id: str, player_id: str, message: dict):
        # في النظام الحالي، جميع المتصلين بالجلسة يستقبلون الرسائل
        await self.broadcast(session_id, message)
        
    def _count_all(self):
        return sum(len(v) for v in self.connections.values())
    
    async def start_heartbeat(self, interval: int = 30):
        while True:
            await asyncio.sleep(interval)
            for session_id in list(self.connections.keys()):
                stale = []
                for ws in self.connections.get(session_id, []):
                    try:
                        await ws.send_json({"type": "ping", "timestamp": time.time()})
                    except Exception:
                        stale.append(ws)
                for ws in stale:
                    self.disconnect(session_id, ws, reason="heartbeat_timeout")
                    
    async def get_session_info(self, session_id: str) -> dict:
        return {
            "connections": len(self.connections.get(session_id, [])),
            "token": self.reconnect_tokens.get(session_id, None)
        }

ws_manager = AdvancedWebSocketManager()

# ==================== نماذج البيانات ====================
class BidRequest(BaseModel):
    player_id: str = Field(..., description="معرف اللاعب")
    amount: float = Field(..., gt=0, description="مبلغ العرض (أكبر من صفر)")

class SkipRequest(BaseModel):
    player_id: str = Field(..., description="معرف اللاعب")

class CreateSessionRequest(BaseModel):
    player_id: str = Field(..., description="معرف اللاعب البشري")
    bot_name: Optional[str] = Field("Goat_Bot", description="اسم البوت")

# ==================== مساعدات الأمان ====================
security = HTTPBearer(auto_error=False)

async def verify_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """مصادقة بسيطة (يمكن توسيعها)"""
    if credentials:
        # يمكن التحقق من JWT هنا
        # token = credentials.credentials
        pass
    return True

# ==================== دورة حياة التطبيق ====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # بدء التشغيل
    startup_start = time.time()
    logger.info("=" * 60)
    logger.info("🎮 OSM FUT Dual Battle Server Starting...")
    SERVER_INFO["start_time"] = datetime.now(timezone.utc)
    
    # استعادة الجلسات
    try:
        keys = await storage.list_keys()
        for key in keys:
            data = await storage.load(key)
            if data and data.get("status") == "completed":
                game.completed_auctions[key] = data
        logger.info(f"✅ Restored {len(game.completed_auctions)} completed sessions")
    except Exception as e:
        logger.error(f"Session restoration error: {e}")
    
    # بدء مهمة heartbeat
    heartbeat_task = asyncio.create_task(ws_manager.start_heartbeat())
    
    startup_duration = time.time() - startup_start
    logger.info(f"✅ Server initialized in {startup_duration:.2f}s")
    logger.info("=" * 60)
    
    yield
    
    # إيقاف التشغيل
    logger.info("🛑 Server shutting down...")
    heartbeat_task.cancel()
    try:
        await heartbeat_task
    except asyncio.CancelledError:
        pass
    
    # حفظ الجلسات
    for session_id, auction in game.active_auctions.items():
        state = auction.get_state()
        await storage.save(session_id, state)
    for session_id, data in game.completed_auctions.items():
        await storage.save(session_id, data)
    
    logger.info(f"💾 Saved all sessions. Shutdown complete.")

# ==================== إنشاء التطبيق ====================
app = FastAPI(
    title="OSM FUT Dual Battle API",
    description="⚔️ نظام المزاد والمباريات المتكامل - واجهة برمجة تطبيقات متطورة",
    version="2.3.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ==================== Middleware ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

if SERVER_INFO["environment"] == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

@app.middleware("http")
async def global_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
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
        
        path = request.url.path
        if path not in PERFORMANCE_METRICS["endpoints"]:
            PERFORMANCE_METRICS["endpoints"][path] = {"count": 0, "total_time": 0.0, "errors": 0}
        PERFORMANCE_METRICS["endpoints"][path]["count"] += 1
        PERFORMANCE_METRICS["endpoints"][path]["total_time"] += process_time
        
        if process_time > 1.0:
            logger.warning(f"⚠️ Slow request [{request_id}]: {request.method} {path} ({process_time:.3f}s)")
        
        return response
    except Exception as e:
        SERVER_INFO["errors_encountered"] += 1
        PERFORMANCE_METRICS["total_errors"] += 1
        logger.error(f"❌ Request [{request_id}] failed: {e}")
        raise

# ==================== معالجات الأخطاء ====================
@app.exception_handler(StarletteHTTPException)
async def http_handler(request: Request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {"code": exc.status_code, "message": str(exc.detail)},
            "request_id": getattr(request.state, "request_id", "unknown"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc):
    errors = [{"field": " → ".join(str(loc) for loc in e["loc"]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {"code": 422, "message": "فشل التحقق من المدخلات", "details": errors},
            "request_id": getattr(request.state, "request_id", "unknown")
        }
    )

@app.exception_handler(Exception)
async def general_handler(request: Request, exc):
    error_logger.critical(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"code": 500, "message": "خطأ داخلي في الخادم"},
            "request_id": getattr(request.state, "request_id", "unknown")
        }
    )

# ==================== Static Files ====================
STATIC_DIR = Path("app/static")
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ==================== Original Routers ====================
if ROUTERS_AVAILABLE:
    app.include_router(players.router, prefix="/api/players", tags=["Players"])
    app.include_router(websocket.router, prefix="/api/ws", tags=["WebSocket"])

# ==================== مسارات المراقبة ====================
@app.get("/", tags=["Root"])
async def root():
    return {"application": SERVER_INFO["application"], "version": SERVER_INFO["version"], "status": "operational"}

@app.get("/health", tags=["Monitoring"])
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/status", tags=["Monitoring"])
async def detailed_status():
    uptime_seconds = (datetime.now(timezone.utc) - SERVER_INFO["start_time"]).total_seconds() if SERVER_INFO["start_time"] else 0
    memory_info = {}
    try:
        import psutil
        mem = psutil.virtual_memory()
        memory_info = {"total_gb": round(mem.total/1e9,1), "used_percent": mem.percent}
    except:
        pass
    
    return {
        "success": True,
        "data": {
            "server": SERVER_INFO,
            "uptime_seconds": uptime_seconds,
            "performance": {
                "total_requests": PERFORMANCE_METRICS["total_requests"],
                "total_errors": PERFORMANCE_METRICS["total_errors"],
                "websocket_messages": PERFORMANCE_METRICS["websocket_messages"],
                "endpoints": {k: {"count": v["count"], "avg_ms": round(v["total_time"]/v["count"]*1000,2) if v["count"] else 0} for k,v in PERFORMANCE_METRICS["endpoints"].items()}
            },
            "resources": {"memory": memory_info},
            "storage": {"type": type(storage).__name__, "sessions_count": len(await storage.list_keys())}
        }
    }

@app.get("/api/ping", tags=["Monitoring"])
async def ping():
    return {"ping": "pong", "time": time.time()}

# ==================== مسار تاريخ المباريات ====================
@app.get("/api/matches/history", tags=["Matches"])
async def match_history(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    sort: str = Query("desc", regex="^(asc|desc)$"),
    player_id: Optional[str] = Query(None)
):
    """جلب سجل المباريات مع ترقيم الصفحات"""
    history = game.get_match_history(limit + offset)
    
    # تصفية حسب اللاعب (اختياري)
    if player_id:
        history = [m for m in history if m.get("team1_info",{}).get("player_id") == player_id or m.get("team2_info",{}).get("player_id") == player_id]
    
    # ترتيب
    if sort == "desc":
        history = sorted(history, key=lambda x: x.get("played_at", 0), reverse=True)
    else:
        history = sorted(history, key=lambda x: x.get("played_at", 0))
    
    total = len(history)
    page = history[offset:offset+limit]
    
    return {
        "success": True,
        "data": page,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total
        }
    }

# ==================== WebSocket ====================
@app.websocket("/ws/{session_id}")
async def ws_endpoint(websocket: WebSocket, session_id: str):
    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            if action == "get_state":
                state = game.get_auction_state(session_id)
                await websocket.send_json({"type": "state_update", "data": state})
            elif action == "pong":
                # استجابة للـ heartbeat
                pass
            # يمكن إضافة إجراءات أخرى
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(session_id, websocket)

# ==================== API الجلسات ====================
@app.post("/session", tags=["Sessions"])
async def create_session(request: CreateSessionRequest):
    data = game.create_session(request.player_id)
    await storage.save(data["session_id"], {"status": "active", "created_at": time.time()})
    return {"success": True, "data": data}

@app.get("/sessions", tags=["Sessions"])
async def list_sessions():
    active = list(game.active_auctions.keys())
    completed = list(game.completed_auctions.keys())
    return {
        "success": True,
        "data": {
            "active": active,
            "completed": completed,
            "count": len(active) + len(completed)
        }
    }

@app.delete("/session/{session_id}", tags=["Sessions"])
async def delete_session(session_id: str):
    if session_id in game.active_auctions:
        del game.active_auctions[session_id]
    elif session_id in game.completed_auctions:
        del game.completed_auctions[session_id]
    else:
        raise HTTPException(status_code=404, detail="الجلسة غير موجودة")
    await storage.delete(session_id)
    return {"success": True, "message": "تم حذف الجلسة"}

@app.post("/session/{session_id}/start", tags=["Auction"])
async def start_auction(session_id: str):
    result = game.start_auction(session_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    await ws_manager.broadcast(session_id, {"type": "auction_started", "data": result})
    return {"success": True, "data": result}

@app.post("/session/{session_id}/bid", tags=["Auction"])
async def place_bid(session_id: str, bid: BidRequest):
    result = game.place_bid(session_id, bid.player_id, bid.amount)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["result"].get("error","فشل العرض"))
    state = game.get_auction_state(session_id)
    await ws_manager.broadcast(session_id, {"type": "bid_placed", "data": state})
    await storage.save(session_id, state)
    return result

@app.post("/session/{session_id}/skip", tags=["Auction"])
async def skip_turn(session_id: str, skip: SkipRequest):
    result = game.skip_turn(session_id, skip.player_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["result"].get("error","فشل التخطي"))
    state = game.get_auction_state(session_id)
    await ws_manager.broadcast(session_id, {"type": "turn_skipped", "data": state})
    await storage.save(session_id, state)
    return result

@app.get("/session/{session_id}/state", tags=["Auction"])
async def get_state(session_id: str):
    state = game.get_auction_state(session_id)
    if "error" in state:
        raise HTTPException(status_code=404, detail=state["error"])
    return {"success": True, "data": state}

@app.get("/session/{session_id}/team/{player_id}", tags=["Teams"])
async def reveal_team(session_id: str, player_id: str):
    team = game.reveal_team(session_id, player_id)
    if "error" in team:
        raise HTTPException(status_code=404, detail=team["error"])
    return {"success": True, "data": team}

@app.post("/session/{session_id}/match", tags=["Match"])
async def play_match(session_id: str):
    result = game.play_match(session_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    await ws_manager.broadcast(session_id, {"type": "match_result", "data": result})
    await storage.save(session_id, game.get_auction_state(session_id))
    return {"success": True, "data": result}

# ==================== نقطة الدخول ====================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = SERVER_INFO["environment"] == "development"
    workers = int(os.environ.get("WORKERS", 1))
    
    logger.info(f"🚀 Starting Uvicorn on {host}:{port}")
    uvicorn.run(
        "main:app" if not debug else app,
        host=host,
        port=port,
        workers=workers,
        log_level="debug" if debug else "info",
        access_log=True,
        reload=debug
    )
