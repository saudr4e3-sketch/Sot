"""Dynamic Live Commentary System

Generates realistic, text-based live commentary for match events
based on simulation outcomes.
"""

import random
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


class CommentaryGenerator:
    """Generates dynamic match commentary"""
    
    def __init__(self):
        """Initialize commentary generator"""
        self.commentary_library = self._build_commentary_library()
    
    def generate_commentary(self, p1_score: float, p2_score: float, p1_strength: float, p2_strength: float, winner: str) -> List[Dict[str, str]]:
        """Generate match commentary
        
        Args:
            p1_score: Player 1 final score
            p2_score: Player 2 final score
            p1_strength: Player 1 squad strength
            p2_strength: Player 2 squad strength
            winner: Match winner ("player1", "player2", "draw")
            
        Returns:
            List of commentary events with timestamps
        """
        events = []
        
        # Match start
        events.append({
            "minute": 0,
            "type": "kickoff",
            "text": "⚽ The match begins! Both teams take to the field."
        })
        
        # First half commentary (simulation)
        first_half_events = self._generate_half_commentary(15, p1_score, p2_score, p1_strength, p2_strength, "first")
        events.extend(first_half_events)
        
        # Half time
        events.append({
            "minute": 45,
            "type": "halftime",
            "text": f"🔔 Half Time | Shots: Player 1 {int(p1_score*2)}, Player 2 {int(p2_score*2)}"
        })
        
        # Second half commentary
        second_half_events = self._generate_half_commentary(15, p1_score, p2_score, p1_strength, p2_strength, "second")
        events.extend(second_half_events)
        
        # Match end
        result_text = ""
        if winner == "player1":
            result_text = f"🎉 FULL TIME | Player 1 wins {int(p1_score)} - {int(p2_score)}. Dominant performance!"
        elif winner == "player2":
            result_text = f"🎉 FULL TIME | Player 2 wins {int(p2_score)} - {int(p1_score)}. Incredible comeback!"
        else:
            result_text = f"🎉 FULL TIME | Draw {int(p1_score)} - {int(p2_score)}. A thrilling encounter!"
        
        events.append({
            "minute": 90,
            "type": "fulltime",
            "text": result_text
        })
        
        logger.info(f"Generated {len(events)} commentary events")
        return events
    
    def _generate_half_commentary(self, event_count: int, p1_score: float, p2_score: float, p1_strength: float, p2_strength: float, half: str) -> List[Dict[str, str]]:
        """Generate commentary for one half
        
        Args:
            event_count: Number of events to generate
            p1_score: Player 1 score
            p2_score: Player 2 score
            p1_strength: Player 1 strength
            p2_strength: Player 2 strength
            half: "first" or "second"
            
        Returns:
            List of commentary events
        """
        events = []
        start_minute = 0 if half == "first" else 45
        
        for i in range(event_count):
            minute = start_minute + random.randint(2, 8)
            
            # Determine which team is dominant
            if p1_strength > p2_strength:
                commentary = self._get_random_commentary("dominant")
            elif p2_strength > p1_strength:
                commentary = self._get_random_commentary("defensive")
            else:
                commentary = self._get_random_commentary("balanced")
            
            events.append({
                "minute": minute,
                "type": "action",
                "text": commentary
            })
        
        return events
    
    def _build_commentary_library(self) -> Dict[str, List[str]]:
        """Build library of commentary templates
        
        Returns:
            Dictionary with commentary by type
        """
        return {
            "dominant": [
                "🔥 Excellent passing movement! The dominant team controls possession.",
                "⚽ A powerful shot just goes wide! The attacking team presses forward.",
                "🎯 Another chance created! The formation is working perfectly.",
                "💪 A fierce attack! The opposition defense is under pressure.",
                "🚀 Brilliant buildup play! The tactical setup is paying dividends.",
                "⚡ Quick counter-attack! The team shows great attacking intent.",
                "🏆 Clinical finishing on display! Another opportunity wasted.",
                "🎪 Dazzling skill display! The midfield controls the rhythm.",
            ],
            "defensive": [
                "🛡️ A crucial defensive intervention! The back line holds firm.",
                "🔒 Solid defending! The goalkeeper remains vigilant.",
                "💥 A brilliant tackle breaks up the play!",
                "⚔️ Excellent positioning denies the attacking threat!",
                "🎯 The defense reads the game perfectly! Another clearance.",
                "🚨 A desperate last-ditch block! Drama at the back.",
                "🏅 Superb tactical discipline! The team stays organized.",
                "🛑 A timely interception! The defense stays compact.",
            ],
            "balanced": [
                "🤝 Both teams are well-matched! The contest remains tight.",
                "⚽ An even contest with chances for both sides.",
                "🎪 The intensity rises as both teams push forward!",
                "🔄 The momentum shifts! A key moment approaching.",
                "💭 Tactical chess match in the midfield!",
                "🎯 Both keepers are busy today!",
                "⚡ The pace of the game quickens!",
                "🌟 A brilliant piece of play, but well defended!",
            ]
        }
    
    def _get_random_commentary(self, commentary_type: str) -> str:
        """Get random commentary for type
        
        Args:
            commentary_type: Type of commentary
            
        Returns:
            Random commentary string
        """
        library = self.commentary_library.get(commentary_type, self.commentary_library["balanced"])
        return random.choice(library)
