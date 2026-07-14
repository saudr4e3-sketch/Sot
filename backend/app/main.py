from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import json
import logging

from app.api import players, websocket
from app.game.auction import AuctionManager
from app.utils.constants import CORS_ORIGINS

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global game state
game_sessions = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
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

# Include routers
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(websocket.router, prefix="/api/ws", tags=["websocket"])

# Root endpoint
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
    uvicorn.run(
        app,
        host=os.getenv("SERVER_HOST", "0.0.0.0"),
        port=int(os.getenv("SERVER_PORT", 8000))
    )
