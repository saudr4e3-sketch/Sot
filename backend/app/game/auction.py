"""Turn-Based Auction System

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
"""

import time
import logging
from typing import Dict, List, Optional, Tuple
from enum import Enum
from app.utils.constants import (
    AUCTION_POSITIONS,
    AUCTION_TIMER,
    TEAM_COMPOSITION
)
from app.game.mystery_card import MysteryCardGenerator

logger = logging.getLogger(__name__)


class AuctionStatus(str, Enum):
    """Auction state enumeration"""
    WAITING = "waiting"
    ACTIVE = "active"
    BID_PLACED = "bid_placed"
    TURN_PASSED = "turn_passed"
    SOLD = "sold"
    MYSTERY_GENERATED = "mystery_generated"
    COMPLETED = "completed"


class AuctionManager:
    """Manages turn-based auction logic"""
    
    def __init__(self, session_id: str, player1_id: str, player2_id: str):
        """Initialize auction manager
        
        Args:
            session_id: Unique game session identifier
            player1_id: First player identifier
            player2_id: Second player identifier
        """
        self.session_id = session_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        
        # Auction state
        self.current_index = 0  # Position in AUCTION_POSITIONS
        self.current_turn_player = player1_id  # Who's turn it is
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.last_bid_time = None
        self.status = AuctionStatus.WAITING
        
        # Teams
        self.player1_team: Dict[str, List] = {pos: [] for pos in set(AUCTION_POSITIONS)}
        self.player2_team: Dict[str, List] = {pos: [] for pos in set(AUCTION_POSITIONS)}
        
        logger.info(f"Auction Manager initialized for session {session_id}")
        logger.info(f"Auction sequence: {' -> '.join(AUCTION_POSITIONS)}")
    
    def start_auction(self) -> Dict:
        """Start the auction
        
        Returns:
            Auction state dictionary
        """
        self.status = AuctionStatus.ACTIVE
        self.current_index = 0
        self.current_turn_player = self.player1_id
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.last_bid_time = time.time()
        
        state = self.get_auction_state()
        logger.info(f"Auction started. Current position: {AUCTION_POSITIONS[self.current_index]}")
        return state
    
    def place_bid(self, player_id: str, amount: float) -> Tuple[bool, Dict]:
        """Place a bid on current card
        
        Args:
            player_id: Player placing the bid
            amount: Bid amount
            
        Returns:
            Tuple of (success: bool, state: Dict)
        """
        # Validate it's the player's turn
        if player_id != self.current_turn_player:
            return False, {"error": "Not your turn"}
        
        # Validate bid amount
        if amount <= self.highest_bid:
            return False, {"error": "Bid must be higher than current bid"}
        
        # Update bid state
        self.highest_bid = amount
        self.highest_bidder = player_id
        self.last_bid_time = time.time()
        self.status = AuctionStatus.BID_PLACED
        
        # Pass turn to opponent
        self.current_turn_player = self.player2_id if player_id == self.player1_id else self.player1_id
        
        logger.info(f"Bid placed: {player_id} bids {amount} for {AUCTION_POSITIONS[self.current_index]}")
        return True, self.get_auction_state()
    
    def skip_bid(self, player_id: str) -> Tuple[bool, Dict]:
        """Skip bidding
        
        Args:
            player_id: Player skipping
            
        Returns:
            Tuple of (success: bool, state: Dict)
        """
        # Validate it's the player's turn
        if player_id != self.current_turn_player:
            return False, {"error": "Not your turn"}
        
        # If no bid has been placed, start bidding
        if self.highest_bid == 0:
            # Pass turn to opponent
            self.current_turn_player = self.player2_id if player_id == self.player1_id else self.player1_id
            self.status = AuctionStatus.TURN_PASSED
            logger.info(f"Turn passed: {player_id} skipped")
            return True, self.get_auction_state()
        
        # If there's an active bid, this player loses
        return self._finalize_sale()
    
    def check_timer_expired(self) -> Tuple[bool, Dict]:
        """Check if 30-second timer has expired for current turn
        
        Returns:
            Tuple of (timer_expired: bool, state: Dict)
        """
        if self.last_bid_time is None:
            return False, self.get_auction_state()
        
        elapsed = time.time() - self.last_bid_time
        if elapsed >= AUCTION_TIMER:
            # Timer expired - finalize sale or move to next
            if self.highest_bid > 0:
                return True, self._finalize_sale()[1]
            else:
                # Both players passed - move to next card
                return True, self._advance_to_next_card()[1]
        
        return False, self.get_auction_state()
    
    def _finalize_sale(self) -> Tuple[bool, Dict]:
        """Finalize the sale and generate mystery card for loser
        
        Returns:
            Tuple of (success: bool, state: Dict)
        """
        # Winner gets the card
        winner = self.highest_bidder
        loser = self.player2_id if winner == self.player1_id else self.player1_id
        position = AUCTION_POSITIONS[self.current_index]
        
        # Add to winner's team
        if winner == self.player1_id:
            self.player1_team[position].append({
                "type": "auction",
                "bid_amount": self.highest_bid
            })
        else:
            self.player2_team[position].append({
                "type": "auction",
                "bid_amount": self.highest_bid
            })
        
        logger.info(f"Sale finalized: {winner} wins for {self.highest_bid}")
        
        # Generate mystery card for loser
        mystery_card = MysteryCardGenerator.generate_mystery_card(position)
        
        if loser == self.player1_id:
            self.player1_team[position].append(mystery_card)
        else:
            self.player2_team[position].append(mystery_card)
        
        logger.info(f"Mystery card generated for loser {loser}: {mystery_card['rarity']} {position}")
        self.status = AuctionStatus.MYSTERY_GENERATED
        
        # Move to next card
        return self._advance_to_next_card()
    
    def _advance_to_next_card(self) -> Tuple[bool, Dict]:
        """Advance to next card in auction sequence
        
        Returns:
            Tuple of (success: bool, state: Dict)
        """
        self.current_index += 1
        self.highest_bid = 0.0
        self.highest_bidder = None
        self.last_bid_time = time.time()
        self.status = AuctionStatus.ACTIVE
        
        # Check if auction is complete
        if self.current_index >= len(AUCTION_POSITIONS):
            self.status = AuctionStatus.COMPLETED
            logger.info("Auction completed! All cards sold.")
            return True, {"auction_completed": True, "state": self.get_auction_state()}
        
        # Reset turn to player 1
        self.current_turn_player = self.player1_id
        
        position = AUCTION_POSITIONS[self.current_index]
        logger.info(f"Advanced to next card: {position} (index {self.current_index})")
        return True, self.get_auction_state()
    
    def get_auction_state(self) -> Dict:
        """Get current auction state
        
        Returns:
            Dictionary with complete auction state
        """
        position = AUCTION_POSITIONS[self.current_index] if self.current_index < len(AUCTION_POSITIONS) else "complete"
        time_remaining = max(0, AUCTION_TIMER - (time.time() - self.last_bid_time)) if self.last_bid_time else AUCTION_TIMER
        
        return {
            "session_id": self.session_id,
            "status": self.status.value,
            "current_position": position,
            "auction_index": self.current_index,
            "total_positions": len(AUCTION_POSITIONS),
            "current_turn_player": self.current_turn_player,
            "highest_bid": self.highest_bid,
            "highest_bidder": self.highest_bidder,
            "timer_remaining": time_remaining,
            "player1_team": self.player1_team,
            "player2_team": self.player2_team,
            "auction_sequence": AUCTION_POSITIONS
        }
    
    def get_team_stats(self, player_id: str) -> Dict:
        """Calculate team statistics
        
        Args:
            player_id: Player to get stats for
            
        Returns:
            Dictionary with team statistics
        """
        team = self.player1_team if player_id == self.player1_id else self.player2_team
        
        total_cards = sum(len(cards) for cards in team.values())
        
        stats = {
            "player_id": player_id,
            "total_cards": total_cards,
            "positions": {pos: len(team.get(pos, [])) for pos in TEAM_COMPOSITION},
            "auction_wins": sum(1 for cards in team.values() for card in cards if card.get("type") == "auction"),
            "mystery_cards": sum(1 for cards in team.values() for card in cards if card.get("is_mystery", False))
        }
        
        return stats
