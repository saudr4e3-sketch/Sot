"""Match Simulation Engine with 30/30/40 Ratio

Match outcome is determined by:
- 30% Squad Strength: Combined player ratings
- 30% Manager Tactic: Manager skill and formation synergy
- 40% Luck: Random variance for exciting outcomes

This ratio is STRICTLY ENFORCED and cannot be modified.
"""

import random
import logging
from typing import Dict, List, Tuple, Any
from app.utils.constants import MATCH_SIMULATION_WEIGHTS
from app.game.commentary import CommentaryGenerator

logger = logging.getLogger(__name__)


class MatchEngine:
    """Simulates match between two teams using 30/30/40 ratio"""
    
    def __init__(self, player1_team: Dict, player2_team: Dict):
        """Initialize match engine
        
        Args:
            player1_team: Player 1's team dict with positions and cards
            player2_team: Player 2's team dict with positions and cards
        """
        self.player1_team = player1_team
        self.player2_team = player2_team
        self.commentary_generator = CommentaryGenerator()
    
    def simulate_match(self) -> Dict[str, Any]:
        """Simulate the match and return result
        
        Returns:
            Dictionary with match result and commentary
        """
        # Calculate squad strength (30%)
        player1_strength = self._calculate_squad_strength(self.player1_team)
        player2_strength = self._calculate_squad_strength(self.player2_team)
        
        # Calculate manager tactic (30%)
        player1_tactic = self._calculate_manager_tactic(self.player1_team)
        player2_tactic = self._calculate_manager_tactic(self.player2_team)
        
        # Calculate luck component (40%)
        player1_luck = random.random() * 100
        player2_luck = random.random() * 100
        
        logger.info(f"Match Simulation Factors:")
        logger.info(f"  Player1 - Strength: {player1_strength:.2f}, Tactic: {player1_tactic:.2f}, Luck: {player1_luck:.2f}")
        logger.info(f"  Player2 - Strength: {player2_strength:.2f}, Tactic: {player2_tactic:.2f}, Luck: {player2_luck:.2f}")
        
        # Calculate final scores using 30/30/40 ratio
        player1_score = self._calculate_final_score(
            player1_strength,
            player1_tactic,
            player1_luck
        )
        
        player2_score = self._calculate_final_score(
            player2_strength,
            player2_tactic,
            player2_luck
        )
        
        # Determine winner
        winner = "player1" if player1_score > player2_score else "player2" if player2_score > player1_score else "draw"
        
        # Generate commentary
        commentary = self.commentary_generator.generate_commentary(
            player1_score,
            player2_score,
            player1_strength,
            player2_strength,
            winner
        )
        
        result = {
            "player1_score": player1_score,
            "player2_score": player2_score,
            "player1_strength": player1_strength,
            "player2_strength": player2_strength,
            "player1_tactic": player1_tactic,
            "player2_tactic": player2_tactic,
            "player1_luck": player1_luck,
            "player2_luck": player2_luck,
            "winner": winner,
            "commentary": commentary
        }
        
        logger.info(f"Match Result: Player1 {player1_score} - Player2 {player2_score} | Winner: {winner}")
        return result
    
    def _calculate_squad_strength(self, team: Dict) -> float:
        """Calculate squad strength from player ratings
        
        Args:
            team: Team dictionary with positions and cards
            
        Returns:
            Squad strength score (0-100)
        """
        total_rating = 0
        card_count = 0
        
        # Sum all player ratings
        for position, cards in team.items():
            for card in cards:
                if position == "MGR":
                    # Manager tactic rating
                    rating = card.get("tactic_rating", 75)
                else:
                    # Player rating
                    rating = card.get("rating", 75)
                
                total_rating += rating
                card_count += 1
        
        # Average rating normalized to 0-100
        if card_count == 0:
            return 0
        
        strength = (total_rating / card_count) / 99 * 100  # Normalize to 100
        logger.debug(f"Squad Strength: {strength:.2f} (avg rating: {total_rating/card_count:.2f})")
        return strength
    
    def _calculate_manager_tactic(self, team: Dict) -> float:
        """Calculate manager tactical quality
        
        Args:
            team: Team dictionary with positions and cards
            
        Returns:
            Tactic score (0-100)
        """
        managers = team.get("MGR", [])
        
        if not managers:
            return 50  # Default if no manager
        
        # Use best manager's tactic rating
        best_manager_rating = max(m.get("tactic_rating", 75) for m in managers)
        
        # Normalize to 0-100
        tactic = (best_manager_rating / 95) * 100
        logger.debug(f"Manager Tactic: {tactic:.2f} (best manager rating: {best_manager_rating})")
        return tactic
    
    def _calculate_final_score(self, strength: float, tactic: float, luck: float) -> float:
        """Calculate final match score using 30/30/40 ratio
        
        STRICT WEIGHTS (cannot be modified):
        - 30% Squad Strength
        - 30% Manager Tactic
        - 40% Luck
        
        Args:
            strength: Squad strength (0-100)
            tactic: Manager tactic (0-100)
            luck: Luck component (0-100)
            
        Returns:
            Final score (0-100)
        """
        score = (
            strength * MATCH_SIMULATION_WEIGHTS["squad_strength"] +
            tactic * MATCH_SIMULATION_WEIGHTS["manager_tactic"] +
            luck * MATCH_SIMULATION_WEIGHTS["luck"]
        )
        
        # Verify weights sum to 1.0
        total_weight = sum(MATCH_SIMULATION_WEIGHTS.values())
        if abs(total_weight - 1.0) > 0.001:
            logger.error(f"CRITICAL: Weights don't sum to 1.0: {total_weight}")
        
        logger.debug(
            f"Final Score: {score:.2f} = "
            f"({strength:.2f} * 0.30) + "
            f"({tactic:.2f} * 0.30) + "
            f"({luck:.2f} * 0.40)"
        )
        return score
