from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import json
import logging
import asyncio
from typing import Dict, Set
from uuid import uuid4

from app.game.auction import AuctionManager
from app.game.match_engine import MatchEngine
from app.game.goat_bot import goat_ai  # استيراد بوت الذكاء الاصطناعي Goat
from app import schemas

logger = logging.getLogger(__name__)

router = APIRouter()

# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.sessions: Dict[str, AuctionManager] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info(f"Client connected: {connection_id}")
    
    async def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        logger.info(f"Client disconnected: {connection_id}")
    
    async def broadcast(self, data: dict, session_id: str = None):
        """Broadcast message to all connections or specific session"""
        if session_id:
            for conn_id, websocket in self.active_connections.items():
                if session_id in conn_id:
                    try:
                        await websocket.send_json(data)
                    except Exception as e:
                        logger.error(f"Error sending to {conn_id}: {e}")
        else:
            for websocket in self.active_connections.values():
                try:
                    await websocket.send_json(data)
                except Exception as e:
                    logger.error(f"Error broadcasting: {e}")

manager = ConnectionManager()

@router.websocket("/game/{session_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, player_id: str):
    connection_id = f"{session_id}_{player_id}"
    await manager.connect(websocket, connection_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
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
            else:
                await websocket.send_json({"error": f"Unknown action: {action}"})
    
    except WebSocketDisconnect:
        await manager.disconnect(connection_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(connection_id)

async def handle_start_auction(websocket: WebSocket, session_id: str, player_id: str, data: dict):
    opponent_id = data.get("opponent_id")
    
    if session_id not in manager.sessions:
        auction = AuctionManager(session_id, player_id, opponent_id)
        manager.sessions[session_id] = auction
        state = auction.start_auction()
    else:
        auction = manager.sessions[session_id]
        # استخدام خاصية الـ state المتاحة مباشرة في الـ AuctionManager لتفادي الأخطاء
        state = getattr(auction, "state", None)
        if not state:
            state = auction.start_auction()

    await manager.broadcast({
        "type": "auction_started",
        "data": state
    }, session_id)
    
    logger.info(f"Auction started/joined for session {session_id} by {player_id}")

async def handle_add_bot(websocket: WebSocket, session_id: str, player_id: str, data: dict):
    bot_id = "Goat_Bot"
    
    if session_id not in manager.sessions:
        auction = AuctionManager(session_id, player_id, bot_id)
        manager.sessions[session_id] = auction
        state = auction.start_auction()
    else:
        auction = manager.sessions[session_id]
        state = getattr(auction, "state", None)
        if not state:
            state = auction.start_auction()
    
    await manager.broadcast({
        "type": "auction_started",
        "bot_name": goat_ai.name,
        "data": state
    }, session_id)
    
    logger.info(f"Bot Goat joined session {session_id} against {player_id}")

async def handle_place_bid(websocket: WebSocket, session_id: str, player_id: str, data: dict):
    amount = data.get("amount")
    
    auction = manager.sessions.get(session_id)
    if not auction:
        await websocket.send_json({"error": "Auction not found"})
        return
    
    success, state = auction.place_bid(player_id, amount)
    
    if success:
        await manager.broadcast({
            "type": "bid_placed",
            "player_id": player_id,
            "amount": amount,
            "data": state
        }, session_id)
        
        if getattr(auction, "player2_id", "") == "Goat_Bot" and not state.get("auction_completed"):
            await asyncio.sleep(1.5)
            current_bid = amount
            player_rating = state.get("current_player", {}).get("rating", 80)
            max_budget = 100
            
            bot_bid_amount = goat_ai.decide_bid(current_bid, player_rating, max_budget)
            if bot_bid_amount > current_bid:
                bot_success, bot_state = auction.place_bid("Goat_Bot", bot_bid_amount)
                if bot_success:
                    await manager.broadcast({
                        "type": "bid_placed",
                        "player_id": "Goat_Bot",
                        "amount": bot_bid_amount,
                        "data": bot_state
                    }, session_id)
    else:
        await websocket.send_json({
            "error": state.get("error", "Bid failed"),
            "type": "bid_failed"
        })

async def handle_skip_bid(websocket: WebSocket, session_id: str, player_id: str, data: dict):
    auction = manager.sessions.get(session_id)
    if not auction:
        await websocket.send_json({"error": "Auction not found"})
        return
    
    success, state = auction.skip_bid(player_id)
    
    if success:
        if "auction_completed" in state:
            await manager.broadcast({
                "type": "auction_completed",
                "data": state
            }, session_id)
        else:
            await manager.broadcast({
                "type": "turn_skipped",
                "player_id": player_id,
                "data": state
            }, session_id)
    else:
        await websocket.send_json({
            "error": state.get("error", "Skip failed"),
            "type": "skip_failed"
        })

async def handle_start_match(websocket: WebSocket, session_id: str, player_id: str, data: dict):
    auction = manager.sessions.get(session_id)
    if not auction:
        await websocket.send_json({"error": "Auction not found"})
        return
    
    player1_team = auction.player1_team
    player2_team = auction.player2_team
    
    match_engine = MatchEngine(player1_team, player2_team)
    match_result = match_engine.simulate_match()
    
    await manager.broadcast({
        "type": "match_completed",
        "data": match_result
    }, session_id)
    
    logger.info(f"Match simulated for session {session_id}")
