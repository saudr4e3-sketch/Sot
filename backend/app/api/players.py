from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from app import schemas

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
        "image_url": "https://placeholder.com/150?text=Ronaldo",
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
        "image_url": "https://placeholder.com/150?text=Messi",
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
        "image_url": "https://placeholder.com/150?text=Benzema",
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
        "image_url": "https://placeholder.com/150?text=Vinicius",
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
        "image_url": "https://placeholder.com/150?text=Haaland",
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
