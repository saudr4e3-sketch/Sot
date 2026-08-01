from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional
import logging

from app import schemas
from app.utils.image_handler import fetch_and_cache_image

logger = logging.getLogger(__name__)

router = APIRouter()

# Mock player database for testing
MOCK_PLAYERS = [
    {
        "id": 1,
        "api_id": 5203,
        "name": "Cristiano Ronaldo",
        "position": "ATT",
        "rating": 89.5,
        "team": "Al Nassr",
        "image_url": "https://via.placeholder.com/300?text=Ronaldo",
        "nationality": "PT",
        "age": 38,
        "rarity": "Legendary"
    },
    {
        "id": 2,
        "api_id": 5207,
        "name": "Lionel Messi",
        "position": "ATT",
        "rating": 91.0,
        "team": "Inter Miami",
        "image_url": "https://via.placeholder.com/300?text=Messi",
        "nationality": "AR",
        "age": 36,
        "rarity": "Legendary"
    },
    {
        "id": 3,
        "api_id": 5209,
        "name": "Karim Benzema",
        "position": "ATT",
        "rating": 87.0,
        "team": "Al-Ittihad",
        "image_url": "https://via.placeholder.com/300?text=Benzema",
        "nationality": "FR",
        "age": 35,
        "rarity": "Legendary"
    },
    {
        "id": 4,
        "api_id": 5210,
        "name": "Vinicius Jr",
        "position": "ATT",
        "rating": 86.5,
        "team": "Real Madrid",
        "image_url": "https://via.placeholder.com/300?text=Vinicius",
        "nationality": "BR",
        "age": 23,
        "rarity": "Legendary"
    },
    {
        "id": 5,
        "api_id": 5211,
        "name": "Erling Haaland",
        "position": "ATT",
        "rating": 89.0,
        "team": "Manchester City",
        "image_url": "https://via.placeholder.com/300?text=Haaland",
        "nationality": "NO",
        "age": 23,
        "rarity": "Legendary"
    }
]

@router.get("/", response_model=List[schemas.Player])
async def get_players(
    position: Optional[str] = Query(None),
    rarity: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(10)
) -> List[schemas.Player]:
    """Get list of available players
    
    Args:
        position: Filter by position (GK, DEF, MID, ATT)
        rarity: Filter by rarity (Legendary, Medium, Weak)
        skip: Pagination skip
        limit: Pagination limit
        
    Returns:
        List of player schemas
    """
    players = MOCK_PLAYERS
    
    if position:
        players = [p for p in players if p["position"] == position]
    
    if rarity:
        players = [p for p in players if p["rarity"] == rarity]
    
    return players[skip:skip + limit]

@router.get("/{player_id}", response_model=schemas.Player)
async def get_player(player_id: int) -> schemas.Player:
    """Get specific player by ID
    
    Args:
        player_id: Player ID
        
    Returns:
        Player schema
        
    Raises:
        HTTPException: If player not found
    """
    for player in MOCK_PLAYERS:
        if player["id"] == player_id:
            return player
    
    raise HTTPException(status_code=404, detail="Player not found")

@router.get("/{player_id}/image")
async def get_player_image(player_id: int):
    """Proxy endpoint to fetch player image with caching and fallbacks."""
    target = None
    for player in MOCK_PLAYERS:
        if player["id"] == player_id:
            target = player
            break
    if not target:
        raise HTTPException(status_code=404, detail="Player not found")

    # build URL candidates: support new image_data structure or legacy image_url
    urls = []
    imgdata = target.get("image_data")
    if imgdata:
        # prefer primary, then fallback, then emergency
        for k in ("primary", "fallback", "emergency"):
            v = imgdata.get(k)
            if v:
                urls.append(v)
    # legacy field
    if target.get("image_url"):
        urls.append(target.get("image_url"))

    if not urls:
        raise HTTPException(status_code=404, detail="No image URLs available for player")

    cache_key = f"player_image_{player_id}"
    data = await fetch_and_cache_image(urls, cache_key)
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch player image")

    # try to detect simple content type by header (best effort)
    # default to jpeg
    content_type = "image/jpeg"
    return Response(content=data, media_type=content_type)

@router.post("/", response_model=schemas.Player)
async def create_player(player: schemas.PlayerCreate) -> schemas.Player:
    """Create new player
    
    Args:
        player: Player create schema
        
    Returns:
        Created player schema
    """
    new_player = {
        "id": len(MOCK_PLAYERS) + 1,
        **player.model_dump()
    }
    MOCK_PLAYERS.append(new_player)
    logger.info(f"Player created: {new_player['name']}")
    return new_player
