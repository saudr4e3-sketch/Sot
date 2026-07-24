"""
Turn-Based Auction System with Real Players Support and Advanced AI Bot

Auction Sequence (MUST FOLLOW EXACTLY):
1. Goalkeeper (GK) - 1 card
2. Defenders (DEF) - 2 cards
3. Midfielders (MID) - 2 cards
4. Attackers (ATT) - 2 cards
5. Managers (MGR) - 2 cards

Total: 9 cards (8 players + 1 manager per team)

Turn-Based Rules:
- Each player has 30 seconds per bid
- Turn passes to opponent with fresh 30-second timer
- Skip button allows pass without bidding
- Loser receives mystery card immediately
- AI Bot (Goat_Bot) analyzes market and bids intelligently
"""

import time
import logging
import json
import os
import random
import math
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from app.utils.constants import (
    AUCTION_POSITIONS,
    AUCTION_TIMER,
    TEAM_COMPOSITION
)
from app.game.mystery_card import MysteryCardGenerator

logger = logging.getLogger(__name__)

# Load real players database with comprehensive error handling
PLAYERS_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "players.json")

def load_players_database() -> Dict[str, List[Dict]]:
    """Load and validate players database from JSON file
    
    Returns:
        Dictionary mapping positions to lists of player data
    """
    try:
        if os.path.exists(PLAYERS_DB_PATH):
            with open(PLAYERS_DB_PATH, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                
            # Validate and structure the database
            validated_db = {}
            position_mapping = {
                "GK": "GK",
                "DEF": "DEF", 
                "MID": "MID",
                "ATT": "ATT",
                "MGR": "MGR"
            }
            
            for pos_key, pos_value in position_mapping.items():
                if pos_key in raw_data:
                    players = raw_data[pos_key]
                    if isinstance(players, list) and len(players) > 0:
                        # Validate each player has required fields
                        validated_players = []
                        for player in players:
                            if isinstance(player, dict) and "name" in player:
                                validated_player = {
                                    "name": player.get("name", f"Unknown {pos_value}"),
                                    "rating": player.get("rating", random.randint(75, 95)),
                                    "position": pos_value,
                                    "image": player.get("image", ""),
                                    "nationality": player.get("nationality", "Unknown"),
                                    "club": player.get("club", "Free Agent"),
                                    "age": player.get("age", random.randint(20, 35))
                                }
                                validated_players.append(validated_player)
                        
                        if validated_players:
                            validated_db[pos_value] = validated_players
                            logger.info(f"Loaded {len(validated_players)} players for position {pos_value}")
                        else:
                            logger.warning(f"No valid players found for position {pos_value}")
                    else:
                        logger.warning(f"Invalid player list for position {pos_key}")
                else:
                    logger.warning(f"Position {pos_key} not found in database")
            
            if validated_db:
                logger.info(f"Successfully loaded players database with {sum(len(v) for v in validated_db.values())} total players")
                return validated_db
            else:
                logger.error("No valid players loaded from database")
        else:
            logger.error(f"Players database file not found at {PLAYERS_DB_PATH}")
            
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format in players database: {e}")
    except Exception as e:
        logger.error(f"Unexpected error loading players database: {e}")
    
    # Return fallback database
    return generate_fallback_database()

def generate_fallback_database() -> Dict[str, List[Dict]]:
    """Generate fallback player database when real data is unavailable
    
    Returns:
        Dictionary with generated player data for each position
    """
    logger.warning("Generating fallback player database")
    
    fallback_players = {
        "GK": [
            {"name": "Manuel Neuer", "rating": 90, "position": "GK", 
             "image": "https://cdn.sofifa.net/players/117/289/25_120.png",
             "nationality": "Germany", "club": "Bayern Munich", "age": 38},
            {"name": "Thibaut Courtois", "rating": 89, "position": "GK",
             "image": "https://cdn.sofifa.net/players/184/120/25_120.png",
             "nationality": "Belgium", "club": "Real Madrid", "age": 32},
            {"name": "Alisson Becker", "rating": 89, "position": "GK",
             "image": "https://cdn.sofifa.net/players/212/831/25_120.png",
             "nationality": "Brazil", "club": "Liverpool", "age": 32},
            {"name": "Ederson Moraes", "rating": 88, "position": "GK",
             "image": "https://cdn.sofifa.net/players/210/257/25_120.png",
             "nationality": "Brazil", "club": "Manchester City", "age": 31},
            {"name": "Jan Oblak", "rating": 88, "position": "GK",
             "image": "https://cdn.sofifa.net/players/200/389/25_120.png",
             "nationality": "Slovenia", "club": "Atletico Madrid", "age": 31}
        ],
        "DEF": [
            {"name": "Virgil van Dijk", "rating": 89, "position": "DEF",
             "image": "https://cdn.sofifa.net/players/203/376/25_120.png",
             "nationality": "Netherlands", "club": "Liverpool", "age": 33},
            {"name": "Ruben Dias", "rating": 88, "position": "DEF",
             "image": "https://cdn.sofifa.net/players/239/057/25_120.png",
             "nationality": "Portugal", "club": "Manchester City", "age": 27},
            {"name": "Antonio Rudiger", "rating": 87, "position": "DEF",
             "image": "https://cdn.sofifa.net/players/210/257/25_120.png",
             "nationality": "Germany", "club": "Real Madrid", "age": 31},
            {"name": "Achraf Hakimi", "rating": 86, "position": "DEF",
             "image": "https://cdn.sofifa.net/players/233/000/25_120.png",
             "nationality": "Morocco", "club": "PSG", "age": 26},
            {"name": "Trent Alexander-Arnold", "rating": 86, "position": "DEF",
             "image": "https://cdn.sofifa.net/players/231/281/25_120.png",
             "nationality": "England", "club": "Liverpool", "age": 26}
        ],
        "MID": [
            {"name": "Kevin De Bruyne", "rating": 91, "position": "MID",
             "image": "https://cdn.sofifa.net/players/192/985/25_120.png",
             "nationality": "Belgium", "club": "Manchester City", "age": 33},
            {"name": "Jude Bellingham", "rating": 90, "position": "MID",
             "image": "https://cdn.sofifa.net/players/252/371/25_120.png",
             "nationality": "England", "club": "Real Madrid", "age": 21},
            {"name": "Rodri", "rating": 89, "position": "MID",
             "image": "https://cdn.sofifa.net/players/229/558/25_120.png",
             "nationality": "Spain", "club": "Manchester City", "age": 28},
            {"name": "Luka Modric", "rating": 87, "position": "MID",
             "image": "https://cdn.sofifa.net/players/177/003/25_120.png",
             "nationality": "Croatia", "club": "Real Madrid", "age": 39},
            {"name": "Federico Valverde", "rating": 87, "position": "MID",
             "image": "https://cdn.sofifa.net/players/239/053/25_120.png",
             "nationality": "Uruguay", "club": "Real Madrid", "age": 26}
        ],
        "ATT": [
            {"name": "Kylian Mbappe", "rating": 92, "position": "ATT",
             "image": "https://cdn.sofifa.net/players/231/747/25_120.png",
             "nationality": "France", "club": "PSG", "age": 25},
            {"name": "Erling Haaland", "rating": 91, "position": "ATT",
             "image": "https://cdn.sofifa.net/players/239/085/25_120.png",
             "nationality": "Norway", "club": "Manchester City", "age": 24},
            {"name": "Vinicius Jr", "rating": 90, "position": "ATT",
             "image": "https://cdn.sofifa.net/players/252/371/25_120.png",
             "nationality": "Brazil", "club": "Real Madrid", "age": 24},
            {"name": "Mohamed Salah", "rating": 89, "position": "ATT",
             "image": "https://cdn.sofifa.net/players/209/331/25_120.png",
             "nationality": "Egypt", "club": "Liverpool", "age": 32},
            {"name": "Lionel Messi", "rating": 88, "position": "ATT",
             "image": "https://cdn.sofifa.net/players/158/023/25_120.png",
             "nationality": "Argentina", "club": "Inter Miami", "age": 37}
        ],
        "MGR": [
            {"name": "Pep Guardiola", "rating": 92, "position": "MGR",
             "image": "https://cdn.sofifa.net/players/managers/25_120.png",
             "nationality": "Spain", "club": "Manchester City", "age": 53},
            {"name": "Jurgen Klopp", "rating": 90, "position": "MGR",
             "image": "https://cdn.sofifa.net/players/managers/25_120.png",
             "nationality": "Germany", "club": "Liverpool", "age": 57},
            {"name": "Carlo Ancelotti", "rating": 89, "position": "MGR",
             "image": "https://cdn.sofifa.net/players/managers/25_120.png",
             "nationality": "Italy", "club": "Real Madrid", "age": 65},
            {"name": "Xavi Hernandez", "rating": 86, "position": "MGR",
             "image": "https://cdn.sofifa.net/players/managers/25_120.png",
             "nationality": "Spain", "club": "Barcelona", "age": 44},
            {"name": "Mikel Arteta", "rating": 84, "position": "MGR",
             "image": "https://cdn.sofifa.net/players/managers/25_120.png",
             "nationality": "Spain", "club": "Arsenal", "age": 42}
        ]
    }
    
    return fallback_players

# Initialize the players database
REAL_PLAYERS_DB = load_players_database()

# Constants for AI Bot strategy
BOT_BUDGET = 100.0  # Bot's total budget
BOT_AGGRESSION_FACTOR = 0.7  # How aggressive the bot is in bidding
BOT_BLUFF_CHANCE = 0.3  # Probability bot will bluff
BOT_MAX_OVERPAY_PERCENT = 0.15  # Max percentage bot will overpay
POSITION_PRIORITY = {
    "GK": 0.6,
    "DEF": 0.8,
    "MID": 0.9,
    "ATT": 1.0,
    "MGR": 0.7
}

class AuctionStatus(str, Enum):
    """Auction state enumeration"""
    WAITING = "waiting"
    ACTIVE = "active"
    BID_PLACED = "bid_placed"
    TURN_PASSED = "turn_passed"
    SOLD = "sold"
    MYSTERY_GENERATED = "mystery_generated"
    COMPLETED = "completed"


@dataclass
class PlayerCard:
    """Represents a player card in auction"""
    name: str
    position: str
    rating: int
    image: str
    nationality: str = "Unknown"
    club: str = "Free Agent"
    age: int = 25
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "name": self.name,
            "position": self.position,
            "rating": self.rating,
            "image": self.image,
            "nationality": self.nationality,
            "club": self.club,
            "age": self.age
        }


@dataclass
class BotState:
    """Tracks AI bot's strategy and decision making"""
    budget: float = BOT_BUDGET
    cards_won: int = 0
    total_spent: float = 0.0
    bluffs_used: int = 0
    last_bid_amount: float = 0.0
    bid_history: List[Dict] = field(default_factory=list)
    
    def get_remaining_budget(self) -> float:
        """Get remaining budget"""
        return self.budget - self.total_spent
    
    def can_bid(self, amount: float) -> bool:
        """Check if bot can afford bid"""
        return self.get_remaining_budget() >= amount
    
    def record_bid(self, amount: float) -> None:
        """Record a successful bid"""
        self.total_spent += amount
        self.cards_won += 1
        self.last_bid_amount = amount
        self.bid_history.append({
            "amount": amount,
            "timestamp": time.time()
        })
    
    def calculate_bid_strategy(self, card: PlayerCard, current_bid: float, 
                              opponent_budget: float, cards_remaining: int) -> Tuple[float, bool]:
        """Calculate optimal bid strategy
        
        Args:
            card: Current player card being auctioned
            current_bid: Current highest bid
            opponent_budget: Estimated opponent budget
            cards_remaining: Number of cards remaining in auction
            
        Returns:
            Tuple of (bid_amount, should_skip)
        """
        rating_factor = card.rating / 100.0
        position_priority = POSITION_PRIORITY.get(card.position, 0.5)
        base_value = card.rating * 0.1 * position_priority * rating_factor
        
        remaining_cards_needed = max(1, cards_remaining)
        max_spend_per_card = self.get_remaining_budget() / remaining_cards_needed
        
        competitive_bid = base_value * (1 + random.uniform(0.1, 0.3) * BOT_AGGRESSION_FACTOR)
        
        should_bluff = random.random() < BOT_BLUFF_CHANCE and current_bid > base_value * 1.5
        
        if should_bluff:
            self.bluffs_used += 1
            logger.info("Goat_Bot decided to bluff and skip bidding")
            return 0.0, True
        
        if current_bid == 0:
            bid_amount = min(competitive_bid, max_spend_per_card * 0.6)
        else:
            max_bid = min(competitive_bid * (1 + BOT_MAX_OVERPAY_PERCENT), max_spend_per_card)
            
            if current_bid >= max_bid:
                logger.info(f"Goat_Bot skipping - bid too high: {current_bid} > {max_bid}")
                return 0.0, True
            
            min_raise = current_bid * 0.1
            optimal_raise = min(current_bid * 0.25, max_bid - current_bid)
            bid_amount = current_bid + random.uniform(min_raise, optimal_raise)
        
        bid_amount = min(bid_amount, self.get_remaining_budget())
        bid_amount = round(bid_amount, 2)
        
        return bid_amount, False


class AuctionManager:
    """Manages turn-based auction logic with AI Bot integration"""
    
    def __init__(self, session_id: str, player1_id: str, player2_id: str):
        self.session_id = session_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        
        self.current_index = 0
        self.current_turn_player = player1_id
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.last_bid_time = None
        self.status = AuctionStatus.WAITING
        
        self.current_card: Optional[PlayerCard] = None
        self.auction_cards: List[PlayerCard] = []
        self.used_player_names: Dict[str, List[str]] = {pos: [] for pos in AUCTION_POSITIONS}
        
        self.player1_team: Dict[str, List[Dict]] = {pos: [] for pos in set(AUCTION_POSITIONS)}
        self.player2_team: Dict[str, List[Dict]] = {pos: [] for pos in set(AUCTION_POSITIONS)}
        
        self.bot_state = BotState()
        self.opponent_estimated_budget = 100.0
        
        self._generate_auction_cards()
        logger.info(f"Auction Manager initialized for session {session_id}")
    
    def _generate_auction_cards(self) -> None:
        self.auction_cards = []
        for position in AUCTION_POSITIONS:
            card = self._select_random_player(position)
            if card:
                self.auction_cards.append(card)
    
    def _select_random_player(self, position: str) -> Optional[PlayerCard]:
        position_pool = REAL_PLAYERS_DB.get(position, [])
        if not position_pool:
            return None
        
        available_players = [
            p for p in position_pool 
            if p.get("name", "") not in self.used_player_names.get(position, [])
        ]
        
        if not available_players:
            available_players = position_pool
            self.used_player_names[position] = []
        
        if not available_players:
            return PlayerCard(
                name=f"Legendary {position}",
                position=position,
                rating=random.randint(85, 95),
                image="https://cdn.sofifa.net/players/default/25_120.png",
                nationality="International",
                club="All Stars",
                age=28
            )
        
        selected = random.choice(available_players)
        self.used_player_names[position].append(selected.get("name", ""))
        
        return PlayerCard(
            name=selected.get("name", f"Star {position}"),
            position=position,
            rating=selected.get("rating", random.randint(75, 95)),
            image=selected.get("image", "https://cdn.sofifa.net/players/default/25_120.png"),
            nationality=selected.get("nationality", "Unknown"),
            club=selected.get("club", "Free Agent"),
            age=selected.get("age", random.randint(20, 35))
        )
    
    def start_auction(self) -> Dict:
        self.status = AuctionStatus.ACTIVE
        self.current_index = 0
        self.current_turn_player = self.player1_id
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.last_bid_time = time.time()
        
        if self.current_index < len(self.auction_cards):
            self.current_card = self.auction_cards[self.current_index]
        
        return self.get_auction_state()
    
    def place_bid(self, player_id: str, amount: float) -> Tuple[bool, Dict]:
        if self.status not in [AuctionStatus.ACTIVE, AuctionStatus.BID_PLACED, AuctionStatus.TURN_PASSED]:
            return False, {"error": "Auction is not active"}
        
        if player_id != self.current_turn_player:
            return False, {"error": "Not your turn"}
        
        if amount <= self.highest_bid:
            return False, {"error": f"Bid must be higher than current bid of {self.highest_bid}"}
        
        self.highest_bid = amount
        self.highest_bidder = player_id
        self.last_bid_time = time.time()
        self.status = AuctionStatus.BID_PLACED
        
        if player_id == self.player2_id:
            self.bot_state.record_bid(amount)
        else:
            if amount > 0:
                self.opponent_estimated_budget = max(self.opponent_estimated_budget, amount * 1.5)
        
        self.current_turn_player = self.player2_id if player_id == self.player1_id else self.player1_id
        
        if self.current_turn_player == self.player2_id:
            return self._process_bot_turn()
        
        return True, self.get_auction_state()
    
    def skip_bid(self, player_id: str) -> Tuple[bool, Dict]:
        if self.status not in [AuctionStatus.ACTIVE, AuctionStatus.BID_PLACED, AuctionStatus.TURN_PASSED]:
            return False, {"error": "Auction is not active"}
        
        if player_id != self.current_turn_player:
            return False, {"error": "Not your turn"}
        
        if self.highest_bid == 0:
            self.current_turn_player = self.player2_id if player_id == self.player1_id else self.player1_id
            self.status = AuctionStatus.TURN_PASSED
            self.last_bid_time = time.time()
            
            if self.current_turn_player == self.player2_id:
                return self._process_bot_turn()
            
            return True, self.get_auction_state()
        
        return self._finalize_sale()
    
    def check_timer_expired(self) -> Tuple[bool, Dict]:
        if self.last_bid_time is None or self.status == AuctionStatus.COMPLETED:
            return False, self.get_auction_state()
        
        elapsed = time.time() - self.last_bid_time
        if elapsed >= AUCTION_TIMER:
            if self.highest_bid > 0:
                return True, self._finalize_sale()[1]
            else:
                if self.current_turn_player == self.player2_id:
                    self.current_turn_player = self.player1_id
                    self.last_bid_time = time.time()
                    self.status = AuctionStatus.TURN_PASSED
                    return True, self.get_auction_state()
                else:
                    self.current_turn_player = self.player2_id
                    self.last_bid_time = time.time()
                    self.status = AuctionStatus.TURN_PASSED
                    return self._process_bot_turn()
        
        return False, self.get_auction_state()
    
    def _process_bot_turn(self) -> Tuple[bool, Dict]:
        if self.current_card is None:
            return False, {"error": "No current card"}
        
        cards_remaining = len(self.auction_cards) - self.current_index
        bid_amount, should_skip = self.bot_state.calculate_bid_strategy(
            self.current_card,
            self.highest_bid,
            self.opponent_estimated_budget,
            cards_remaining
        )
        
        time.sleep(random.uniform(0.5, 1.0))
        
        if should_skip or bid_amount <= self.highest_bid:
            return self.skip_bid(self.player2_id)
        else:
            return self.place_bid(self.player2_id, bid_amount)
    
    def _finalize_sale(self) -> Tuple[bool, Dict]:
        if self.current_card is None:
            return False, {"error": "No current card to finalize"}
        
        winner = self.highest_bidder
        loser = self.player2_id if winner == self.player1_id else self.player1_id
        position = AUCTION_POSITIONS[self.current_index]
        
        winner_card = {
            "type": "auction",
            "player": self.current_card.to_dict(),
            "bid_amount": self.highest_bid,
            "won_at": time.time()
        }
        
        if winner == self.player1_id:
            self.player1_team[position].append(winner_card)
        else:
            self.player2_team[position].append(winner_card)
        
        mystery_card = MysteryCardGenerator.generate_mystery_card(position)
        mystery_card["received_at"] = time.time()
        mystery_card["auction_position"] = position
        
        if loser == self.player1_id:
            self.player1_team[position].append(mystery_card)
        else:
            self.player2_team[position].append(mystery_card)
        
        self.status = AuctionStatus.MYSTERY_GENERATED
        return self._advance_to_next_card()
    
    def _advance_to_next_card(self) -> Tuple[bool, Dict]:
        self.current_index += 1
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.last_bid_time = time.time()
        
        if self.current_index >= len(self.auction_cards):
            self.status = AuctionStatus.COMPLETED
            self.current_card = None
            return True, {"auction_completed": True, "state": self.get_auction_state()}
        
        self.current_card = self.auction_cards[self.current_index]
        self.status = AuctionStatus.ACTIVE
        self.current_turn_player = self.player1_id
        
        return True, self.get_auction_state()
    
    def get_auction_state(self) -> Dict:
        position = AUCTION_POSITIONS[self.current_index] if self.current_index < len(AUCTION_POSITIONS) else "complete"
        time_remaining = max(0, AUCTION_TIMER - (time.time() - self.last_bid_time)) if self.last_bid_time else AUCTION_TIMER
        
        current_player_info = self.current_card.to_dict() if self.current_card else {
            "name": f"Unknown {position}",
            "position": position,
            "rating": 0,
            "image": "",
            "nationality": "Unknown",
            "club": "Free Agent",
            "age": 0
        }
        
        bot_budget = self.bot_state.get_remaining_budget() if hasattr(self, 'bot_state') else BOT_BUDGET
        
        return {
            "session_id": self.session_id,
            "status": self.status.value,
            "current_position": position,
            "auction_index": self.current_index,
            "total_positions": len(AUCTION_POSITIONS),
            "current_turn_player": self.current_turn_player,
            "highest_bid": self.highest_bid,
            "highest_bidder": self.highest_bidder,
            "timer_remaining": round(time_remaining, 1),
            "timer_duration": AUCTION_TIMER,
            "player1_team": self.player1_team,
            "player2_team": self.player2_team,
            "auction_sequence": AUCTION_POSITIONS,
            "current_player": current_player_info,
            "bot_info": {
                "name": "Goat_Bot",
                "budget_remaining": round(bot_budget, 2),
                "cards_won": self.bot_state.cards_won if hasattr(self, 'bot_state') else 0,
                "strategy": "Advanced AI"
            },
            "next_position": AUCTION_POSITIONS[self.current_index + 1] if self.current_index + 1 < len(AUCTION_POSITIONS) else None,
            "auction_progress": round((self.current_index / len(AUCTION_POSITIONS)) * 100, 1)
        }
    
    def get_team_stats(self, player_id: str) -> Dict:
        team = self.player1_team if player_id == self.player1_id else self.player2_team
        is_bot = player_id == self.player2_id
        
        total_cards = sum(len(cards) for cards in team.values())
        total_spent = sum(
            card.get("bid_amount", 0) 
            for cards in team.values() 
            for card in cards 
            if card.get("type") == "auction"
        )
        
        ratings = [
            card.get("player", {}).get("rating", 0)
            for cards in team.values()
            for card in cards
            if card.get("type") == "auction" and "player" in card
        ]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        return {
            "player_id": player_id,
            "is_bot": is_bot,
            "player_name": "Goat_Bot" if is_bot else "Human Player",
            "total_cards": total_cards,
            "total_spent": round(total_spent, 2),
            "positions": {
                pos: {
                    "count": len(team.get(pos, [])),
                    "cards": team.get(pos, [])
                }
                for pos in TEAM_COMPOSITION
            },
            "auction_wins": sum(1 for cards in team.values() for card in cards if card.get("type") == "auction"),
            "mystery_cards": sum(1 for cards in team.values() for card in cards if card.get("is_mystery", False)),
            "average_rating": round(avg_rating, 1),
            "remaining_budget": round(self.bot_state.get_remaining_budget() if is_bot else self.opponent_estimated_budget - total_spent, 2)
        }
    
    def force_complete_auction(self) -> Dict:
        """Force complete the auction immediately"""
        self.status = AuctionStatus.COMPLETED
        self.current_card = None
        logger.info(f"Auction {self.session_id} was forcefully completed.")
        return {"auction_completed": True, "state": self.get_auction_state()}
