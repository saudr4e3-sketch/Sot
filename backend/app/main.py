"""
OSM FUT Dual Battle - Main Application Server (Ultimate Extended Edition)
(Updated to apply auction_monkeypatch at startup on work/full-upgrade branch)
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
    # استيراد واضح ضمن حزمة التطبيق
    from app.game.auction import OSMDualBattle, AUCTION_POSITIONS, POSITION_DISPLAY
    GAME_AVAILABLE = True
except Exception:
    try:
        # محاولة استيراد نس��ي إذا شُغل الملف بشكل مستقل
        from .game.auction import OSMDualBattle, AUCTION_POSITIONS, POSITION_DISPLAY
        GAME_AVAILABLE = True
    except Exception as e:
        GAME_AVAILABLE = False
        # استخدام logger لو كان معدًّا لاحقًا
        try:
            logging.getLogger("main").error("FATAL: auction module not found: %s", e)
        except Exception:
            pass
        print("FATAL: auction module not found. System cannot start.")
        sys.exit(1)

# Apply auction monkeypatch to avoid blocking sleeps (idempotent)
try:
    from app.game import auction_monkeypatch
    try:
        auction_monkeypatch.apply_patch(OSMDualBattle)
        logging.getLogger("main").info("Applied auction_monkeypatch to OSMDualBattle at startup")
    except Exception:
        logging.getLogger("main").exception("Failed to apply auction_monkeypatch at startup")
except Exception:
    # if auction_monkeypatch isn't present yet, continue; package init may apply later
    logging.getLogger("main").debug("auction_monkeypatch not available at import time; will attempt later")

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

# rest of file unchanged
