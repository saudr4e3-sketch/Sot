from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from fastapi.staticfiles import StaticFiles

# استيراد الراوترات الخاصة بك
from app.api import players, websocket
from app.utils.constants import CORS_ORIGINS

# إعداد الـ Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🎮 OSM FUT Dual Battle Server Starting...")
    yield
    logger.info("🎮 OSM FUT Dual Battle Server Shutting Down...")

app = FastAPI(
    title="OSM FUT Dual Battle API",
    description="Real-time 1v1 tactical football auction game",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- التعديل المعتمد ---
# البقاء في مجلد app الحالي للوصول إلى المجلد الفرعي static
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# تحميل المجلد مع التأكد من وجوده
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    logger.info(f"✅ Static files successfully mounted from: {STATIC_DIR}")
else:
    logger.warning(f"⚠️ Static directory NOT found at: {STATIC_DIR}")

# Include routers
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(websocket.router, prefix="/api/ws", tags=["websocket"])

@app.get("/")
async def root():
    return {
        "message": "OSM FUT Dual Battle API",
        "version": "1.0.0",
        "developer": "Saud Yahya Al-Faifi",
        "contact": "0535103986",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Server is running"}

if __name__ == "__main__":
    import uvicorn
    # استخدام المنفذ الذي يوفره Render
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
