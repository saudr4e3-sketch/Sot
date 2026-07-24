"""
OSM FUT Dual Battle - Main Application Server
=============================================
FastAPI Application Entry Point with Advanced Features

Features:
- Comprehensive error handling and validation
- Advanced health monitoring and diagnostics
- Production-grade middleware configuration
- Structured logging and telemetry
- Graceful shutdown and resource management
- Extensible router architecture
"""

import os
import sys
import time
import json
import logging
import platform
import traceback
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# استيراد الراوترات الخاصة بالمشروع
from app.api import players, websocket
from app.utils.constants import CORS_ORIGINS

# ==================== إعداد التسجيل المتقدم ====================

# تنسيق السجلات المخصص
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-25s | %(funcName)-20s | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# إعداد معالجات السجلات
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt=LOG_DATE_FORMAT,
    handlers=[
        logging.StreamHandler(sys.stdout),
        # يمكن إضافة FileHandler للإنتاج
        # logging.FileHandler("logs/app.log", encoding="utf-8")
    ]
)

# إنشاء مسجلات متخصصة
logger = logging.getLogger("main")
access_logger = logging.getLogger("access")
error_logger = logging.getLogger("error")
performance_logger = logging.getLogger("performance")

# ضبط مستويات التسجيل للمكتبات الخارجية
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("websockets").setLevel(logging.WARNING)

# ==================== أدوات التشخيص ====================

def print_diagnostics():
    """طباعة معلومات تشخيصية شاملة عند بدء التشغيل"""
    separator = "=" * 70
    
    print(f"\n{separator}")
    print(f"🔍 SYSTEM DIAGNOSTICS")
    print(f"{separator}")
    
    # معلومات النظام
    print(f"🖥️  Platform: {platform.platform()}")
    print(f"🐍 Python Version: {sys.version}")
    print(f"📁 Current Working Directory: {os.getcwd()}")
    
    # متغيرات البيئة المهمة
    env_vars = ["PORT", "ENVIRONMENT", "DATABASE_URL", "REDIS_URL", "SECRET_KEY"]
    print(f"\n📋 Environment Variables:")
    for var in env_vars:
        value = os.environ.get(var)
        if value:
            # إخفاء القيم الحساسة
            if "SECRET" in var or "KEY" in var or "PASSWORD" in var:
                value = "***HIDDEN***"
            print(f"   {var}: {value}")
        else:
            print(f"   {var}: [NOT SET]")
    
    # فحص الملفات والمجلدات
    print(f"\n📂 Directory Structure Check:")
    critical_paths = [
        ("app/static", "Static Files Directory"),
        ("app/api", "API Routes Directory"),
        ("app/utils", "Utilities Directory"),
        ("app/game", "Game Logic Directory"),
    ]
    
    for path, description in critical_paths:
        full_path = os.path.join(os.getcwd(), path)
        exists = os.path.exists(full_path)
        status_icon = "✅" if exists else "❌"
        print(f"   {status_icon} {description}: {path} ({'Found' if exists else 'MISSING!'})")
        
        if exists:
            try:
                files = os.listdir(full_path)
                print(f"      Files: {len(files)} items")
            except Exception as e:
                print(f"      Error listing files: {e}")
    
    # فحص الراوترات
    print(f"\n🔌 Router Status:")
    try:
        from app.api import players, websocket
        print(f"   ✅ Players Router: Loaded")
        print(f"   ✅ WebSocket Router: Loaded")
    except ImportError as e:
        print(f"   ❌ Router Import Error: {e}")
    
    # فحص الذاكرة (إذا كانت psutil متاحة)
    try:
        import psutil
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        print(f"\n💾 Memory Usage:")
        print(f"   RSS: {memory_info.rss / 1024 / 1024:.1f} MB")
        print(f"   VMS: {memory_info.vms / 1024 / 1024:.1f} MB")
    except ImportError:
        print(f"\n💾 Memory Usage: [psutil not installed]")
    
    print(f"\n{separator}\n")

# تنفيذ التشخيص
print_diagnostics()

# ==================== إعدادات الخادم ====================

# معلومات الخادم للتتبع
SERVER_INFO = {
    "application": "OSM FUT Dual Battle",
    "version": "1.0.0",
    "environment": os.environ.get("ENVIRONMENT", "development"),
    "python_version": sys.version,
    "platform": platform.platform(),
    "start_time": None,  # سيتم تعيينه عند بدء التشغيل
    "requests_processed": 0,
    "errors_encountered": 0,
    "active_connections": 0,
}

# إحصائيات الأداء
PERFORMANCE_METRICS = {
    "total_requests": 0,
    "total_errors": 0,
    "average_response_time": 0.0,
    "endpoints": {},
}

# ==================== معالجات دورة الحياة ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    إدارة دورة حياة التطبيق مع إعدادات متقدمة
    """
    # ===== بدء التشغيل =====
    startup_start = time.time()
    
    logger.info("=" * 60)
    logger.info("🎮 OSM FUT Dual Battle Server Starting...")
    logger.info(f"📅 Timestamp: {datetime.now(timezone.utc).isoformat()}")
    logger.info(f"🌍 Environment: {SERVER_INFO['environment']}")
    logger.info("=" * 60)
    
    # تسجيل وقت بدء التشغيل
    SERVER_INFO["start_time"] = datetime.now(timezone.utc)
    
    # إعداد الموارد عند بدء التشغيل
    try:
        # تحميل قواعد البيانات
        logger.info("📂 Loading player database...")
        # يمكن إضافة تحميل قاعدة البيانات هنا
        
        # إعداد الاتصالات
        logger.info("🔌 Initializing connections...")
        # يمكن إضافة اتصالات Redis، قاعدة البيانات، إلخ
        
        # التحقق من المكونات الأساسية
        logger.info("🔍 Verifying core components...")
        _verify_core_components()
        
    except Exception as e:
        logger.error(f"❌ Startup initialization error: {e}")
        logger.error(traceback.format_exc())
        # عدم إيقاف التطبيق، السماح بالتشغيل مع الموارد المتاحة
    
    startup_duration = time.time() - startup_start
    logger.info(f"✅ Server initialized in {startup_duration:.2f} seconds")
    logger.info(f"📡 Ready to accept connections")
    logger.info("=" * 60)
    
    yield  # التطبيق يعمل هنا
    
    # ===== إيقاف التشغيل =====
    shutdown_start = time.time()
    
    logger.info("=" * 60)
    logger.info("🎮 OSM FUT Dual Battle Server Shutting Down...")
    logger.info(f"📊 Total requests processed: {SERVER_INFO['requests_processed']}")
    logger.info(f"❌ Total errors: {SERVER_INFO['errors_encountered']}")
    
    # تنظيف الموارد
    try:
        # إغلاق الاتصالات
        logger.info("🔌 Closing connections...")
        # يمكن إضافة إغلاق اتصالات Redis، قاعدة البيانات، إلخ
        
        # حفظ البيانات المؤقتة
        logger.info("💾 Saving state...")
        # يمكن إضافة حفظ الحالة هنا
        
    except Exception as e:
        logger.error(f"❌ Shutdown cleanup error: {e}")
    
    shutdown_duration = time.time() - shutdown_start
    logger.info(f"✅ Server shutdown completed in {shutdown_duration:.2f} seconds")
    logger.info("=" * 60)

# ==================== إنشاء التطبيق ====================

app = FastAPI(
    title="OSM FUT Dual Battle API",
    description="""
    ## 🎮 Real-time 1v1 Tactical Football Auction Game
    
    ### Features:
    - **Live Auction System**: Bid against AI in real-time
    - **Match Simulation**: 30/30/40 ratio engine
    - **Mystery Cards**: Random card generation
    - **WebSocket Support**: Real-time game updates
    
    ### Technical Details:
    - Backend: Python FastAPI
    - Real-time: WebSocket connections
    - Database: In-memory with persistence
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={
        "name": "OSM FUT Support",
        "url": "https://github.com/your-repo",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# ==================== إعدادات الوسائط (Middleware) ====================

# 1. CORS - Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Request-ID",
        "X-Client-Version",
        "Accept",
        "Origin",
    ],
    expose_headers=[
        "X-Request-ID",
        "X-Response-Time",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
    ],
    max_age=600,  # تخزين مؤقت لطلبات OPTIONS لمدة 10 دقائق
)

# 2. GZip - ضغط الاستجابات
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # الحد الأدنى لحجم الاستجابة للضغط (بايت)
)

# 3. Trusted Host - أمان المضيفين الموثوقين (للإنتاج)
if SERVER_INFO["environment"] == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"],  # تعديل حسب النطاقات المسموح بها
    )

# ==================== وسيط مخصص للتسجيل والتتبع ====================

@app.middleware("http")
async def logging_and_metrics_middleware(request: Request, call_next):
    """
    وسيط مخصص لتسجيل جميع الطلبات وجمع المقاييس
    """
    # توليد معرف فريد للطلب
    request_id = f"{int(time.time() * 1000)}-{os.urandom(4).hex()}"
    request.state.request_id = request_id
    
    # تسجيل بداية الطلب
    start_time = time.time()
    
    # تحديث العدادات
    SERVER_INFO["requests_processed"] += 1
    PERFORMANCE_METRICS["total_requests"] += 1
    
    # معلومات الطلب
    client_host = request.client.host if request.client else "unknown"
    method = request.method
    url = str(request.url)
    user_agent = request.headers.get("user-agent", "unknown")
    
    logger.debug(f"📥 [{request_id}] {method} {url} from {client_host}")
    
    try:
        # معالجة الطلب
        response = await call_next(request)
        
        # حساب وقت الاستجابة
        process_time = time.time() - start_time
        
        # إضافة رؤوس مخصصة
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{process_time:.3f}s"
        response.headers["X-Server-Version"] = SERVER_INFO["version"]
        
        # تحديث مقاييس الأداء
        endpoint = request.url.path
        if endpoint not in PERFORMANCE_METRICS["endpoints"]:
            PERFORMANCE_METRICS["endpoints"][endpoint] = {
                "count": 0,
                "total_time": 0.0,
                "errors": 0,
            }
        
        PERFORMANCE_METRICS["endpoints"][endpoint]["count"] += 1
        PERFORMANCE_METRICS["endpoints"][endpoint]["total_time"] += process_time
        
        # تسجيل الطلبات البطيئة
        if process_time > 1.0:
            logger.warning(
                f"⚠️ Slow request [{request_id}]: {method} {url} "
                f"took {process_time:.3f}s"
            )
        
        # تسجيل الطلبات الناجحة
        if response.status_code < 400:
            logger.debug(
                f"✅ [{request_id}] {method} {url} "
                f"→ {response.status_code} ({process_time:.3f}s)"
            )
        
        return response
        
    except Exception as e:
        # حساب وقت الاستجابة للخطأ
        process_time = time.time() - start_time
        
        # تحديث عدادات الأخطاء
        SERVER_INFO["errors_encountered"] += 1
        PERFORMANCE_METRICS["total_errors"] += 1
        
        # تسجيل الخطأ
        error_logger.error(
            f"❌ [{request_id}] {method} {url} "
            f"→ Error after {process_time:.3f}s: {str(e)}"
        )
        error_logger.error(f"Traceback: {traceback.format_exc()}")
        
        # إعادة رمي الخطأ للمعالج العام
        raise

# ==================== معالجات الأخطاء العامة ====================

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    معالج مركزي لأخطاء HTTP
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    error_logger.warning(
        f"⚠️ HTTP {exc.status_code} [{request_id}]: "
        f"{request.method} {request.url.path} - {exc.detail}"
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "type": "http_error",
                "message": str(exc.detail),
                "request_id": request_id,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    معالج مركزي لأخطاء التحقق من صحة المدخلات
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    # استخراج تفاصيل الأخطاء
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " → ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    error_logger.warning(
        f"⚠️ Validation Error [{request_id}]: "
        f"{request.method} {request.url.path} - {len(errors)} validation errors"
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": 422,
                "type": "validation_error",
                "message": "Request validation failed",
                "details": errors,
                "request_id": request_id,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    معالج مركزي لجميع الأخطاء غير المعالجة
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    # تسجيل تفصيلي للخطأ
    error_logger.critical(
        f"💥 Unhandled Exception [{request_id}]: "
        f"{request.method} {request.url.path} - {type(exc).__name__}: {str(exc)}"
    )
    error_logger.critical(f"Traceback: {traceback.format_exc()}")
    
    # في وضع التطوير، إرجاع تفاصيل الخطأ
    if SERVER_INFO["environment"] == "development":
        error_detail = {
            "type": type(exc).__name__,
            "message": str(exc),
            "traceback": traceback.format_exc().split("\n"),
        }
    else:
        error_detail = {
            "type": "InternalError",
            "message": "An unexpected error occurred",
        }
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": 500,
                "type": "internal_error",
                "message": "Internal server error",
                "detail": error_detail,
                "request_id": request_id,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

# ==================== مسارات الصحة والمراقبة ====================

@app.get("/", tags=["root"])
async def root():
    """
    المسار الجذري - معلومات أساسية عن الخادم
    """
    return {
        "application": SERVER_INFO["application"],
        "version": SERVER_INFO["version"],
        "environment": SERVER_INFO["environment"],
        "status": "operational",
        "documentation": "/api/docs",
    }


@app.get("/health", tags=["monitoring"])
async def health_check():
    """
    فحص صحة النظام الأساسي
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/status", tags=["monitoring"])
async def detailed_status():
    """
    تقرير مفصل عن حالة النظام
    
    يوفر معلومات شاملة عن:
    - حالة الخادم
    - استخدام الموارد
    - إحصائيات الطلبات
    - حالة الراوترات
    - معلومات الذاكرة
    """
    # حساب مدة التشغيل
    uptime_seconds = 0
    if SERVER_INFO["start_time"]:
        uptime = datetime.now(timezone.utc) - SERVER_INFO["start_time"]
        uptime_seconds = uptime.total_seconds()
    
    # تنسيق مدة التشغيل
    days = int(uptime_seconds // 86400)
    hours = int((uptime_seconds % 86400) // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    seconds = int(uptime_seconds % 60)
    
    uptime_formatted = f"{days}d {hours}h {minutes}m {seconds}s" if days > 0 else f"{hours}h {minutes}m {seconds}s"
    
    # جمع معلومات الذاكرة
    memory_info = {}
    try:
        import psutil
        process = psutil.Process(os.getpid())
        mem = process.memory_info()
        memory_info = {
            "rss_mb": round(mem.rss / 1024 / 1024, 1),
            "vms_mb": round(mem.vms / 1024 / 1024, 1),
            "cpu_percent": process.cpu_percent(interval=0.1),
            "threads": process.num_threads(),
        }
    except ImportError:
        memory_info = {"note": "psutil not installed for detailed memory info"}
    
    # إحصائيات نقاط النهاية
    endpoint_stats = {}
    for endpoint, stats in PERFORMANCE_METRICS["endpoints"].items():
        avg_time = stats["total_time"] / stats["count"] if stats["count"] > 0 else 0
        endpoint_stats[endpoint] = {
            "requests": stats["count"],
            "errors": stats["errors"],
            "avg_response_time_ms": round(avg_time * 1000, 2),
        }
    
    # حساب متوسط وقت الاستجابة العام
    total_requests = PERFORMANCE_METRICS["total_requests"]
    total_time = sum(s["total_time"] for s in PERFORMANCE_METRICS["endpoints"].values())
    avg_response_time = total_time / total_requests if total_requests > 0 else 0
    
    status_response = {
        "success": True,
        "data": {
            "server": {
                "application": SERVER_INFO["application"],
                "version": SERVER_INFO["version"],
                "environment": SERVER_INFO["environment"],
                "python_version": SERVER_INFO["python_version"],
                "platform": SERVER_INFO["platform"],
            },
            "uptime": {
                "started_at": SERVER_INFO["start_time"].isoformat() if SERVER_INFO["start_time"] else None,
                "uptime_seconds": uptime_seconds,
                "uptime_formatted": uptime_formatted,
            },
            "performance": {
                "total_requests": total_requests,
                "total_errors": PERFORMANCE_METRICS["total_errors"],
                "error_rate": round(
                    PERFORMANCE_METRICS["total_errors"] / total_requests * 100, 2
                ) if total_requests > 0 else 0,
                "avg_response_time_ms": round(avg_response_time * 1000, 2),
            },
            "resources": {
                "memory": memory_info,
                "active_connections": SERVER_INFO["active_connections"],
            },
            "endpoints": endpoint_stats,
            "routers": {
                "players": "/api/players",
                "websocket": "/api/ws",
                "docs": "/api/docs",
                "status": "/api/status",
            },
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    return status_response


@app.get("/api/ping", tags=["monitoring"])
async def ping():
    """
    مسار ping بسيط لفحص الاتصال
    """
    return {
        "ping": "pong",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "server_time": time.time(),
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """أيقونة المتصفح"""
    return JSONResponse(status_code=204, content=None)

# ==================== المسارات الثابتة ====================

# تحميل الملفات الثابتة
STATIC_DIR = os.path.join(os.getcwd(), "app", "static")

if os.path.exists(STATIC_DIR):
    try:
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
        logger.info(f"✅ Static files mounted from: {STATIC_DIR}")
        
        # سرد محتويات المجلد للتشخيص
        static_files = os.listdir(STATIC_DIR)
        logger.info(f"📁 Static files available: {len(static_files)} items")
        for file in static_files[:10]:  # عرض أول 10 ملفات فقط
            logger.debug(f"   - {file}")
        
    except Exception as e:
        logger.error(f"❌ Failed to mount static files: {e}")
else:
    logger.warning(f"⚠️ Static directory NOT found at: {STATIC_DIR}")
    
    # محاولة إنشاء المجلد
    try:
        os.makedirs(STATIC_DIR, exist_ok=True)
        logger.info(f"📁 Created static directory: {STATIC_DIR}")
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    except Exception as e:
        logger.error(f"❌ Could not create static directory: {e}")

# ==================== ربط الراوترات ====================

# راوتر اللاعبين
try:
    app.include_router(
        players.router,
        prefix="/api/players",
        tags=["Players"],
    )
    logger.info("✅ Players router registered: /api/players")
except Exception as e:
    logger.error(f"❌ Failed to register players router: {e}")

# راوتر WebSocket
try:
    app.include_router(
        websocket.router,
        prefix="/api/ws",
        tags=["WebSocket"],
    )
    logger.info("✅ WebSocket router registered: /api/ws")
except Exception as e:
    logger.error(f"❌ Failed to register websocket router: {e}")

# ==================== دوال مساعدة ====================

def _verify_core_components():
    """
    التحقق من المكونات الأساسية للتطبيق
    """
    components_status = {}
    
    # فحص الراوترات
    try:
        from app.api import players, websocket
        components_status["routers"] = "OK"
    except ImportError as e:
        components_status["routers"] = f"ERROR: {e}"
    
    # فحص الثوابت
    try:
        from app.utils.constants import (
            AUCTION_POSITIONS,
            MATCH_SIMULATION_WEIGHTS,
            MYSTERY_CARD_PROBABILITIES,
        )
        # التحقق من مجموع الأوزان
        total_weight = sum(MATCH_SIMULATION_WEIGHTS.values())
        if abs(total_weight - 1.0) > 0.001:
            logger.error(f"❌ Match simulation weights don't sum to 1.0: {total_weight}")
        
        # التحقق من مجموع الاحتمالات
        total_prob = sum(MYSTERY_CARD_PROBABILITIES.values())
        if abs(total_prob - 1.0) > 0.001:
            logger.error(f"❌ Mystery card probabilities don't sum to 1.0: {total_prob}")
        
        components_status["constants"] = "OK"
    except ImportError as e:
        components_status["constants"] = f"ERROR: {e}"
    
    # فحص محرك المباراة
    try:
        from app.game.match_engine import MatchEngine
        components_status["match_engine"] = "OK"
    except ImportError as e:
        components_status["match_engine"] = f"ERROR: {e}"
    
    # فحص مولد التعليق
    try:
        from app.game.commentary import CommentaryGenerator
        components_status["commentary"] = "OK"
    except ImportError as e:
        components_status["commentary"] = f"ERROR: {e}"
    
    # تسجيل حالة المكونات
    for component, status in components_status.items():
        if status == "OK":
            logger.info(f"   ✅ {component}: {status}")
        else:
            logger.error(f"   ❌ {component}: {status}")

# ==================== نقطة الدخول الرئيسية ====================

if __name__ == "__main__":
    import uvicorn
    
    # إعدادات التشغيل
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = SERVER_INFO["environment"] == "development"
    workers = int(os.environ.get("WORKERS", 1))
    
    logger.info("=" * 60)
    logger.info(f"🚀 Starting Uvicorn Server")
    logger.info(f"   Host: {host}")
    logger.info(f"   Port: {port}")
    logger.info(f"   Environment: {SERVER_INFO['environment']}")
    logger.info(f"   Debug Mode: {debug}")
    logger.info(f"   Workers: {workers}")
    logger.info(f"   API Docs: http://{host}:{port}/api/docs")
    logger.info(f"   Status: http://{host}:{port}/api/status")
    logger.info("=" * 60)
    
    # إعدادات Uvicorn للإنتاج
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
    
    # إضافة reload في وضع التطوير
    if debug:
        uvicorn_config["reload"] = True
        uvicorn_config["reload_dirs"] = ["app"]
    
    # تشغيل الخادم
    uvicorn.run(**uvicorn_config)
