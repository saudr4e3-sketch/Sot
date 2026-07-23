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

# --- أدوات التشخيص (ستظهر في الـ Logs) ---
print(f"--- DEBUG: Current Working Directory (os.getcwd()): {os.getcwd()} ---")
print(f"--- DEBUG: Files in current directory: {os.listdir(os.getcwd())} ---")
# ------------------------------------------

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- المسار المصحح للتشغيل الفعلي ---
# بناءً على أن العمل من /app والملفات داخل app/static
STATIC_DIR = os.path.join(os.getcwd(), "app", "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    logger.info(f"✅ Static files mounted from: {STATIC_DIR}")
else:
    logger.warning(f"⚠️ Static directory NOT found at: {STATIC_DIR}")

# Include routers
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(websocket.router, prefix="/api/ws", tags=["websocket"])

@app.get("/")
async def root():
    return {"message": "OSM FUT Dual Battle API", "status": "operational"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

