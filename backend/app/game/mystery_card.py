"""Mystery Card Generation Engine

When a player loses an auction, the server generates a mystery card
with STRICT probability distribution:
- 30% Legendary (5-star players)
- 30% Medium (3-4 star players)  
- 40% Weak (1-2 star players)

No modifications permitted to these probabilities.
"""

import random
import logging
from typing import Dict, Any, Optional
from app.utils.constants import (
    MYSTERY_CARD_PROBABILITIES,
    PLAYER_RATING_RANGES,
    MANAGER_RATING_RANGES
)

logger = logging.getLogger(__name__)


class MysteryCardGenerator:
    """Generates mystery cards for auction losers using strict probability"""
    
    @staticmethod
    def generate_mystery_card(
        position: str,
        player_database: list = None
    ) -> Dict[str, Any]:
        """Generate a mystery card for the given position
        
        Args:
            position: Card position (GK, DEF, MID, ATT, MGR)
            player_database: List of available players to choose from
            
        Returns:
            Dict containing card data with actual player info
        """
        
        # STRICT PROBABILITY CALCULATION
        rarity = MysteryCardGenerator._determine_rarity()
        logger.info(f"Mystery card generated with rarity: {rarity}")
        
        # Generate mystery card with synthetic data
        # In production, this would fetch from API-Football database
        if position == "MGR":
            card = MysteryCardGenerator._generate_manager_card(rarity)
        else:
            card = MysteryCardGenerator._generate_player_card(position, rarity)
        
        return card
    
    @staticmethod
    def _determine_rarity() -> str:
        """Determine rarity using STRICT probabilities
        
        Must follow these percentages EXACTLY:
        - 30% Legendary
        - 30% Medium
        - 40% Weak
        
        Returns:
            Rarity level: "Legendary", "Medium", or "Weak"
        """
        # Generate random number between 0 and 1
        rand_val = random.random()
        
        # STRICT PROBABILITY BOUNDARIES
        if rand_val < MYSTERY_CARD_PROBABILITIES["Legendary"]:  # 0.00 - 0.30
            return "Legendary"
        elif rand_val < (
            MYSTERY_CARD_PROBABILITIES["Legendary"] + 
            MYSTERY_CARD_PROBABILITIES["Medium"]
        ):  # 0.30 - 0.60
            return "Medium"
        else:  # 0.60 - 1.00
            return "Weak"
    
    @staticmethod
    def _generate_player_card(position: str, rarity: str) -> Dict[str, Any]:
        """Generate a player mystery card
        
        Args:
            position: Player position (GK, DEF, MID, ATT)
            rarity: Rarity level
            
        Returns:
            Player card dictionary
        """
        rating_range = PLAYER_RATING_RANGES[rarity]
        rating = random.uniform(rating_range[0], rating_range[1])
        
        # Placeholder data - in production, fetch from API-Football
        card = {
            "id": random.randint(10000, 99999),
            "name": f"Mystery Player {random.randint(1, 999)}",
            "position": position,
            "rating": round(rating, 1),
            "team": f"Team {random.choice(['A', 'B', 'C', 'D', 'E'])}",
            "nationality": random.choice(["SA", "BR", "FR", "EN", "ES", "IT", "DE", "AR"]),
            "age": random.randint(20, 36),
            "image_url": f"https://placeholder.com/150?text=Player_{random.randint(1, 999)}",
            "rarity": rarity,
            "type": "player",
            "is_mystery": True,
            "acquired_from": "mystery_card"
        }
        
        logger.info(f"Generated {rarity} player mystery card: {card['name']} ({card['position']})")
        return card
    
    @staticmethod
    def _generate_manager_card(rarity: str) -> Dict[str, Any]:
        """Generate a manager mystery card
        
        Args:
            rarity: Rarity level
            
        Returns:
            Manager card dictionary
        """
        tactic_range = MANAGER_RATING_RANGES[rarity]
        tactic_rating = random.uniform(tactic_range[0], tactic_range[1])
        
        # Placeholder data - in production, fetch from API-Football
        card = {
            "id": random.randint(10000, 99999),
            "name": f"Mystery Manager {random.randint(1, 999)}",
            "tactic_rating": round(tactic_rating, 1),
            "experience": random.randint(5, 30),
            "nationality": random.choice(["SA", "BR", "FR", "EN", "ES", "IT", "DE", "AR"]),
            "image_url": f"https://placeholder.com/150?text=Manager_{random.randint(1, 999)}",
            "rarity": rarity,
            "type": "manager",
            "is_mystery": True,
            "acquired_from": "mystery_card",
            "formations": ["4-3-3", "4-2-3-1", "3-5-2"]  # Random tactics
        }
        
        logger.info(f"Generated {rarity} manager mystery card: {card['name']}")
        return card
    
    @staticmethod
    def validate_probability_distribution(samples: int = 100000) -> Dict[str, float]:
        """Validate that probability distribution matches specification
        
        WARNING: This is for testing only. Do NOT use in production.
        
        Args:
            samples: Number of samples to generate
            
        Returns:
            Dictionary with actual probabilities
        """
        legendary_count = 0
        medium_count = 0
        weak_count = 0
        
        for _ in range(samples):
            rarity = MysteryCardGenerator._determine_rarity()
            if rarity == "Legendary":
                legendary_count += 1
            elif rarity == "Medium":
                medium_count += 1
            else:
                weak_count += 1
        
        actual_distribution = {
            "Legendary": legendary_count / samples,
            "Medium": medium_count / samples,
            "Weak": weak_count / samples
        }
        
        logger.info(f"Probability Validation (n={samples}):")
        logger.info(f"  Legendary: {actual_distribution['Legendary']:.4f} (expected: 0.3000)")
        logger.info(f"  Medium: {actual_distribution['Medium']:.4f} (expected: 0.3000)")
        logger.info(f"  Weak: {actual_distribution['Weak']:.4f} (expected: 0.4000)")
        
        return actual_distribution
