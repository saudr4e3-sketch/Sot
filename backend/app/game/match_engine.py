"""
Match Simulation Engine with 30/30/40 Ratio

Match outcome is determined by:
- 30% Squad Strength: Combined player ratings
- 30% Manager Tactic: Manager skill and formation synergy
- 40% Luck: Random variance for exciting outcomes

This ratio is STRICTLY ENFORCED and cannot be modified.

The engine simulates a complete match between two teams, generating
realistic scores, detailed commentary, and comprehensive statistics.
"""

import random
import logging
import math
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field

from app.utils.constants import MATCH_SIMULATION_WEIGHTS
from app.game.commentary import CommentaryGenerator

logger = logging.getLogger(__name__)


@dataclass
class MatchEvent:
    """Represents a single match event during simulation"""
    minute: int
    event_type: str  # 'goal', 'chance', 'save', 'tackle', 'foul', 'whistle', 'highlight'
    description: str
    team: str  # 'player1' or 'player2'
    impact_score: float = 0.0  # How much this event impacts the match flow
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary format"""
        return {
            "minute": self.minute,
            "type": self.event_type,
            "event": self.description,
            "team": self.team
        }


@dataclass
class MatchStatistics:
    """Detailed match statistics for both teams"""
    possession: Tuple[float, float] = (50.0, 50.0)
    shots: Tuple[int, int] = (0, 0)
    shots_on_target: Tuple[int, int] = (0, 0)
    corners: Tuple[int, int] = (0, 0)
    fouls: Tuple[int, int] = (0, 0)
    yellow_cards: Tuple[int, int] = (0, 0)
    red_cards: Tuple[int, int] = (0, 0)
    pass_accuracy: Tuple[float, float] = (0.0, 0.0)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert statistics to dictionary format"""
        return {
            "possession": {"player1": self.possession[0], "player2": self.possession[1]},
            "shots": {"player1": self.shots[0], "player2": self.shots[1]},
            "shots_on_target": {"player1": self.shots_on_target[0], "player2": self.shots_on_target[1]},
            "corners": {"player1": self.corners[0], "player2": self.corners[1]},
            "fouls": {"player1": self.fouls[0], "player2": self.fouls[1]},
            "yellow_cards": {"player1": self.yellow_cards[0], "player2": self.yellow_cards[1]},
            "red_cards": {"player1": self.red_cards[0], "player2": self.red_cards[1]},
            "pass_accuracy": {"player1": self.pass_accuracy[0], "player2": self.pass_accuracy[1]}
        }


class MatchEngine:
    """
    Simulates a match between two teams using the 30/30/40 ratio.
    
    The simulation considers:
    - Squad strength (30%): Average player ratings normalized
    - Manager tactic (30%): Manager quality and formation synergy
    - Luck factor (40%): Random variance for unpredictability
    
    The engine generates:
    - Final match scores
    - Detailed match events and commentary
    - Comprehensive match statistics
    - Goal scorers and key moments
    """
    
    def __init__(self, player1_team: Dict, player2_team: Dict):
        """
        Initialize the match engine with two teams.
        
        Args:
            player1_team: Dictionary containing player1's team cards by position
            player2_team: Dictionary containing player2's team cards by position
            
        Expected team structure:
        {
            "GK": [{"name": "...", "rating": 85, ...}],
            "DEF": [{"name": "...", "rating": 82, ...}, ...],
            "MID": [{"name": "...", "rating": 88, ...}, ...],
            "ATT": [{"name": "...", "rating": 90, ...}, ...],
            "MGR": [{"name": "...", "tactic_rating": 85, ...}]
        }
        """
        self.player1_team = self._validate_team(player1_team)
        self.player2_team = self._validate_team(player2_team)
        self.commentary_generator = CommentaryGenerator()
        self.match_events: List[MatchEvent] = []
        self.statistics = MatchStatistics()
        
        logger.info("Match Engine initialized with two teams")
        logger.debug(f"Player1 team positions: {list(self.player1_team.keys())}")
        logger.debug(f"Player2 team positions: {list(self.player2_team.keys())}")
    
    def _validate_team(self, team: Dict) -> Dict:
        """
        Validate and normalize team structure.
        
        Args:
            team: Raw team dictionary
            
        Returns:
            Validated team dictionary with all required positions
        """
        required_positions = ["GK", "DEF", "MID", "ATT", "MGR"]
        validated_team = {}
        
        for position in required_positions:
            cards = team.get(position, [])
            if not isinstance(cards, list):
                cards = []
            
            # Filter out invalid cards
            valid_cards = [
                card for card in cards 
                if isinstance(card, dict) and "name" in card
            ]
            
            validated_team[position] = valid_cards
            
            if not valid_cards and position != "MGR":
                logger.warning(f"No valid cards found for position {position}")
        
        return validated_team
    
    def simulate_match(self) -> Dict[str, Any]:
        """
        Simulate the complete match and return comprehensive results.
        
        The simulation process:
        1. Calculate base strengths and tactics
        2. Apply luck factor with controlled randomness
        3. Generate match events and commentary
        4. Compile final statistics and results
        
        Returns:
            Dictionary containing:
            - player1_score: Final score for player 1
            - player2_score: Final score for player 2
            - player1_strength: Squad strength calculation
            - player2_strength: Squad strength calculation
            - player1_tactic: Manager tactic score
            - player2_tactic: Manager tactic score
            - player1_luck: Luck factor
            - player2_luck: Luck factor
            - winner: 'player1', 'player2', or 'draw'
            - commentary: List of match events
            - statistics: Detailed match statistics
            - goals: Goal scoring details
            - match_summary: Human-readable summary
        """
        logger.info("Starting match simulation...")
        
        # Step 1: Calculate squad strengths (30% weight)
        player1_strength = self._calculate_squad_strength(self.player1_team)
        player2_strength = self._calculate_squad_strength(self.player2_team)
        
        logger.info(f"Squad Strengths - Player1: {player1_strength:.2f}, Player2: {player2_strength:.2f}")
        
        # Step 2: Calculate manager tactics (30% weight)
        player1_tactic = self._calculate_manager_tactic(self.player1_team)
        player2_tactic = self._calculate_manager_tactic(self.player2_team)
        
        logger.info(f"Manager Tactics - Player1: {player1_tactic:.2f}, Player2: {player2_tactic:.2f}")
        
        # Step 3: Generate luck factors with controlled variance (40% weight)
        # Use triangular distribution for more realistic luck values
        player1_luck = self._generate_luck_factor(player1_strength, player1_tactic)
        player2_luck = self._generate_luck_factor(player2_strength, player2_tactic)
        
        logger.info(f"Luck Factors - Player1: {player1_luck:.2f}, Player2: {player2_luck:.2f}")
        
        # Step 4: Calculate final scores using 30/30/40 ratio
        player1_score = self._calculate_final_score(
            player1_strength, player1_tactic, player1_luck
        )
        player2_score = self._calculate_final_score(
            player2_strength, player2_tactic, player2_luck
        )
        
        # Round scores to 1 decimal place
        player1_score = round(player1_score, 1)
        player2_score = round(player2_score, 1)
        
        logger.info(f"Final Scores - Player1: {player1_score}, Player2: {player2_score}")
        
        # Step 5: Determine winner
        if player1_score > player2_score:
            winner = "player1"
        elif player2_score > player1_score:
            winner = "player2"
        else:
            winner = "draw"
        
        logger.info(f"Match Winner: {winner}")
        
        # Step 6: Generate detailed match simulation
        self._simulate_match_events(player1_score, player2_score, winner)
        
        # Step 7: Generate commentary
        commentary = self.commentary_generator.generate_commentary(
            player1_score,
            player2_score,
            player1_strength,
            player2_strength,
            winner
        )
        
        # Step 8: Generate goal details
        goals = self._generate_goal_details(player1_score, player2_score)
        
        # Step 9: Compile match summary
        match_summary = self._generate_match_summary(
            player1_score, player2_score, winner
        )
        
        # Step 10: Build final result
        result = {
            "player1_score": player1_score,
            "player2_score": player2_score,
            "player1_strength": round(player1_strength, 2),
            "player2_strength": round(player2_strength, 2),
            "player1_tactic": round(player1_tactic, 2),
            "player2_tactic": round(player2_tactic, 2),
            "player1_luck": round(player1_luck, 2),
            "player2_luck": round(player2_luck, 2),
            "winner": winner,
            "commentary": commentary,
            "events": [event.to_dict() for event in self.match_events],
            "statistics": self.statistics.to_dict(),
            "goals": goals,
            "match_summary": match_summary,
            "simulation_timestamp": datetime.utcnow().isoformat(),
            "engine_version": "2.0.0"
        }
        
        logger.info(f"Match simulation completed. Result: {match_summary}")
        return result
    
    def _calculate_squad_strength(self, team: Dict) -> float:
        """
        Calculate squad strength from player ratings.
        
        Uses weighted average where:
        - ATT and MID positions have higher weight (more impact on match)
        - DEF and GK have standard weight
        - MGR is excluded (calculated separately in tactics)
        
        Args:
            team: Team dictionary with positions and cards
            
        Returns:
            Squad strength score normalized to 0-100 scale
        """
        position_weights = {
            "ATT": 1.2,   # Attackers have highest impact
            "MID": 1.1,   # Midfielders have high impact
            "DEF": 1.0,   # Defenders have standard impact
            "GK": 0.9,    # Goalkeeper has slightly lower impact
            "MGR": 0.0    # Manager excluded from squad strength
        }
        
        total_weighted_rating = 0.0
        total_weight = 0.0
        card_count = 0
        
        for position, cards in team.items():
            weight = position_weights.get(position, 1.0)
            
            for card in cards:
                # Get rating based on card type
                if position == "MGR":
                    continue  # Skip managers in squad strength
                else:
                    # Handle different card structures
                    if "player" in card:
                        # Card has nested player object
                        rating = card["player"].get("rating", 75)
                    else:
                        # Direct card structure
                        rating = card.get("rating", 75)
                
                # Validate rating is within reasonable range
                rating = max(1, min(99, int(rating)))
                
                total_weighted_rating += rating * weight
                total_weight += weight
                card_count += 1
        
        if card_count == 0 or total_weight == 0:
            logger.warning("No valid player cards found for squad strength calculation")
            return 0.0
        
        # Calculate weighted average and normalize to 0-100
        weighted_average = total_weighted_rating / total_weight
        strength = (weighted_average / 99.0) * 100.0
        
        logger.debug(
            f"Squad Strength: {strength:.2f} "
            f"(cards: {card_count}, weighted avg rating: {weighted_average:.2f})"
        )
        
        return strength
    
    def _calculate_manager_tactic(self, team: Dict) -> float:
        """
        Calculate manager tactical quality and formation synergy.
        
        Considers:
        - Manager's tactic rating
        - Formation completeness (having all positions filled)
        - Team chemistry (balanced ratings across positions)
        
        Args:
            team: Team dictionary with positions and cards
            
        Returns:
            Tactic score normalized to 0-100 scale
        """
        managers = team.get("MGR", [])
        
        if not managers:
            logger.warning("No manager found, using default tactic value")
            return 50.0
        
        # Get the best manager's tactic rating
        best_manager_rating = 75  # Default
        for manager in managers:
            if "player" in manager:
                tactic_rating = manager["player"].get("tactic_rating", manager["player"].get("rating", 75))
            else:
                tactic_rating = manager.get("tactic_rating", manager.get("rating", 75))
            
            best_manager_rating = max(best_manager_rating, tactic_rating)
        
        # Calculate formation completeness bonus (0-10 points)
        formation_bonus = self._calculate_formation_bonus(team)
        
        # Calculate team chemistry bonus (0-5 points)
        chemistry_bonus = self._calculate_chemistry_bonus(team)
        
        # Normalize manager rating to 0-100
        base_tactic = (best_manager_rating / 95.0) * 100.0
        
        # Apply bonuses (capped at 100)
        final_tactic = min(100.0, base_tactic + formation_bonus + chemistry_bonus)
        
        logger.debug(
            f"Manager Tactic: {final_tactic:.2f} "
            f"(base: {base_tactic:.2f}, formation: +{formation_bonus:.1f}, chemistry: +{chemistry_bonus:.1f})"
        )
        
        return final_tactic
    
    def _calculate_formation_bonus(self, team: Dict) -> float:
        """
        Calculate bonus for having a complete formation.
        
        Returns:
            Bonus points (0-10)
        """
        required_positions = ["GK", "DEF", "MID", "ATT"]
        filled_positions = sum(
            1 for pos in required_positions 
            if len(team.get(pos, [])) > 0
        )
        
        # 2.5 points per filled position
        return filled_positions * 2.5
    
    def _calculate_chemistry_bonus(self, team: Dict) -> float:
        """
        Calculate team chemistry bonus based on rating balance.
        
        Returns:
            Bonus points (0-5)
        """
        ratings = []
        for position in ["GK", "DEF", "MID", "ATT"]:
            for card in team.get(position, []):
                if "player" in card:
                    rating = card["player"].get("rating", 75)
                else:
                    rating = card.get("rating", 75)
                ratings.append(rating)
        
        if len(ratings) < 2:
            return 0.0
        
        # Calculate standard deviation of ratings (lower = better chemistry)
        mean = sum(ratings) / len(ratings)
        variance = sum((r - mean) ** 2 for r in ratings) / len(ratings)
        std_dev = math.sqrt(variance)
        
        # Convert to chemistry bonus (max 5 points for very balanced team)
        chemistry = max(0.0, 5.0 - (std_dev / 10.0))
        
        return chemistry
    
    def _generate_luck_factor(self, strength: float, tactic: float) -> float:
        """
        Generate a luck factor with controlled randomness.
        
        Uses triangular distribution to create more realistic luck values:
        - Teams with higher combined strength/tactic get slightly higher luck ceiling
        - Prevents extreme outliers while maintaining unpredictability
        
        Args:
            strength: Squad strength score
            tactic: Manager tactic score
            
        Returns:
            Luck factor (0-100)
        """
        # Base luck range
        base_min = 20.0
        base_max = 80.0
        
        # Adjust range based on team quality (better teams get slightly better luck ceiling)
        combined_score = (strength + tactic) / 2.0
        quality_bonus = combined_score * 0.15  # Max 15 point bonus
        
        adjusted_min = base_min
        adjusted_max = min(100.0, base_max + quality_bonus)
        
        # Use triangular distribution for more realistic spread
        # Mode is slightly above average (teams tend to have slightly positive luck)
        mode = adjusted_min + (adjusted_max - adjusted_min) * 0.6
        
        luck = random.triangular(adjusted_min, adjusted_max, mode)
        
        return luck
    
    def _calculate_final_score(self, strength: float, tactic: float, luck: float) -> float:
        """
        Calculate final match score using STRICT 30/30/40 ratio.
        
        WEIGHTS (CANNOT BE MODIFIED):
        - 30% Squad Strength
        - 30% Manager Tactic  
        - 40% Luck
        
        Args:
            strength: Squad strength (0-100)
            tactic: Manager tactic (0-100)
            luck: Luck component (0-100)
            
        Returns:
            Final score (0-100)
            
        Raises:
            ValueError: If weights don't sum to 1.0
        """
        # Verify weights sum to 1.0 (safety check)
        total_weight = (
            MATCH_SIMULATION_WEIGHTS["squad_strength"] +
            MATCH_SIMULATION_WEIGHTS["manager_tactic"] +
            MATCH_SIMULATION_WEIGHTS["luck"]
        )
        
        if abs(total_weight - 1.0) > 0.001:
            error_msg = f"CRITICAL: Match simulation weights don't sum to 1.0! Got {total_weight}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Calculate weighted score
        score = (
            strength * MATCH_SIMULATION_WEIGHTS["squad_strength"] +  # 30%
            tactic * MATCH_SIMULATION_WEIGHTS["manager_tactic"] +     # 30%
            luck * MATCH_SIMULATION_WEIGHTS["luck"]                   # 40%
        )
        
        logger.debug(
            f"Final Score Calculation: {score:.2f} = "
            f"({strength:.2f} × 0.30) + "
            f"({tactic:.2f} × 0.30) + "
            f"({luck:.2f} × 0.40)"
        )
        
        # Ensure score is within valid range
        return max(0.0, min(100.0, score))
    
    def _simulate_match_events(
        self, 
        player1_score: float, 
        player2_score: float, 
        winner: str
    ) -> None:
        """
        Generate realistic match events based on scores.
        
        Args:
            player1_score: Final score for player 1
            player2_score: Final score for player 2
            winner: Match winner
        """
        self.match_events = []
        
        # Calculate number of goals and events
        total_goals = int(player1_score / 10) + int(player2_score / 10)
        total_goals = max(0, min(10, total_goals))  # Cap between 0-10 goals
        
        # Generate events for 90 minutes
        event_minutes = self._generate_event_minutes(total_goals)
        
        player1_goals = int(player1_score / 10)
        player2_goals = int(player2_score / 10)
        
        for i, minute in enumerate(event_minutes):
            if i < player1_goals:
                event = self._create_goal_event(minute, "player1", player1_score, player2_score)
            elif i < player1_goals + player2_goals:
                event = self._create_goal_event(minute, "player2", player1_score, player2_score)
            else:
                event = self._create_random_event(minute, player1_score, player2_score)
            
            self.match_events.append(event)
        
        # Sort events by minute
        self.match_events.sort(key=lambda e: e.minute)
        
        # Update statistics based on events
        self._update_statistics()
    
    def _generate_event_minutes(self, total_goals: int) -> List[int]:
        """
        Generate realistic distribution of event minutes.
        
        Args:
            total_goals: Total number of goals
            
        Returns:
            List of minute marks for events
        """
        minutes = []
        
        # Add goal minutes (more likely in second half and end of match)
        for _ in range(total_goals):
            # Weight towards second half and end of match
            if random.random() < 0.4:
                # First half (1-45)
                minute = random.randint(1, 45)
            elif random.random() < 0.7:
                # Second half (46-80)
                minute = random.randint(46, 80)
            else:
                # Final minutes (81-90+)
                minute = random.randint(81, 93)
            
            # Ensure no duplicate minutes
            while minute in minutes:
                minute = random.randint(1, 93)
            
            minutes.append(minute)
        
        # Add some non-goal events
        extra_events = random.randint(3, 8)
        for _ in range(extra_events):
            minute = random.randint(1, 93)
            if minute not in minutes:
                minutes.append(minute)
        
        return sorted(minutes)
    
    def _create_goal_event(
        self, 
        minute: int, 
        team: str, 
        player1_score: float, 
        player2_score: float
    ) -> MatchEvent:
        """
        Create a goal event with realistic description.
        
        Args:
            minute: Match minute
            team: Scoring team
            player1_score: Player 1's score
            player2_score: Player 2's score
            
        Returns:
            MatchEvent object
        """
        goal_types = [
            "Powerful shot from outside the box!",
            "Clinical finish after a great team move!",
            "Header from the corner kick!",
            "Penalty kick converted with confidence!",
            "Brilliant solo effort and finish!",
            "Tap-in after a defensive error!",
            "Free kick curled into the top corner!",
            "Counter-attack finished with precision!",
            "Volley from the edge of the area!",
            "Scramble in the box and it's in!"
        ]
        
        description = random.choice(goal_types)
        
        return MatchEvent(
            minute=minute,
            event_type="goal",
            description=f"GOAL! {description}",
            team=team,
            impact_score=1.0
        )
    
    def _create_random_event(
        self, 
        minute: int, 
        player1_score: float, 
        player2_score: float
    ) -> MatchEvent:
        """
        Create a random non-goal match event.
        
        Args:
            minute: Match minute
            player1_score: Player 1's score
            player2_score: Player 2's score
            
        Returns:
            MatchEvent object
        """
        events = [
            ("chance", "Great chance created but the shot goes wide!"),
            ("save", "Incredible save by the goalkeeper!"),
            ("tackle", "Crucial tackle to prevent a scoring opportunity!"),
            ("foul", "Dangerous foul just outside the box!"),
            ("chance", "Shot rattles the crossbar!"),
            ("save", "Diving save to tip the ball over the bar!"),
            ("chance", "One-on-one with the keeper but shoots straight at him!"),
            ("tackle", "Last-ditch tackle saves a certain goal!"),
            ("foul", "Yellow card shown for a reckless challenge!"),
            ("highlight", "Beautiful passing sequence from the midfield!"),
            ("chance", "Header goes just over the bar!"),
            ("save", "Double save! The keeper is on fire!"),
            ("highlight", "The crowd is on their feet after that skill!"),
            ("tackle", "Sliding tackle wins the ball cleanly!"),
            ("foul", "Controversial decision by the referee!")
        ]
        
        event_type, description = random.choice(events)
        team = random.choice(["player1", "player2"])
        
        return MatchEvent(
            minute=minute,
            event_type=event_type,
            description=description,
            team=team,
            impact_score=random.uniform(0.1, 0.5)
        )
    
    def _update_statistics(self) -> None:
        """Update match statistics based on generated events"""
        # Calculate possession based on score
        total_score = self.match_events[0].impact_score if self.match_events else 1.0
        
        # Generate realistic statistics
        self.statistics.shots = (
            random.randint(5, 20),
            random.randint(5, 20)
        )
        
        self.statistics.shots_on_target = (
            random.randint(1, self.statistics.shots[0]),
            random.randint(1, self.statistics.shots[1])
        )
        
        self.statistics.corners = (
            random.randint(2, 10),
            random.randint(2, 10)
        )
        
        self.statistics.fouls = (
            random.randint(5, 15),
            random.randint(5, 15)
        )
        
        self.statistics.yellow_cards = (
            random.randint(0, 3),
            random.randint(0, 3)
        )
        
        self.statistics.red_cards = (
            1 if random.random() < 0.05 else 0,
            1 if random.random() < 0.05 else 0
        )
        
        self.statistics.pass_accuracy = (
            round(random.uniform(70, 92), 1),
            round(random.uniform(70, 92), 1)
        )
        
        # Calculate possession based on relative team strength
        possession_diff = random.uniform(-15, 15)
        self.statistics.possession = (
            round(50 + possession_diff / 2, 1),
            round(50 - possession_diff / 2, 1)
        )
    
    def _generate_goal_details(
        self, 
        player1_score: float, 
        player2_score: float
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generate detailed goal scoring information.
        
        Args:
            player1_score: Player 1's final score
            player2_score: Player 2's final score
            
        Returns:
            Dictionary with goal details for each team
        """
        player1_goals = int(player1_score / 10)
        player2_goals = int(player2_score / 10)
        
        goal_details = {
            "player1": [],
            "player2": []
        }
        
        # Generate scorer names from team cards
        player1_scorers = self._get_potential_scorers("player1")
        player2_scorers = self._get_potential_scorers("player2")
        
        # Generate player 1 goals
        for i in range(min(player1_goals, len(player1_scorers))):
            goal_details["player1"].append({
                "scorer": player1_scorers[i],
                "minute": self.match_events[i].minute if i < len(self.match_events) else random.randint(1, 90),
                "goal_number": i + 1
            })
        
        # Generate player 2 goals
        start_idx = player1_goals
        for i in range(min(player2_goals, len(player2_scorers))):
            event_idx = start_idx + i
            goal_details["player2"].append({
                "scorer": player2_scorers[i],
                "minute": self.match_events[event_idx].minute if event_idx < len(self.match_events) else random.randint(1, 90),
                "goal_number": i + 1
            })
        
        return goal_details
    
    def _get_potential_scorers(self, team_key: str) -> List[str]:
        """
        Get list of potential goal scorers from team.
        
        Args:
            team_key: 'player1' or 'player2'
            
        Returns:
            List of player names who could score
        """
        team = self.player1_team if team_key == "player1" else self.player2_team
        scorers = []
        
        # Attackers are most likely to score
        for position in ["ATT", "MID"]:
            for card in team.get(position, []):
                if "player" in card:
                    name = card["player"].get("name", f"Player {len(scorers) + 1}")
                else:
                    name = card.get("name", f"Player {len(scorers) + 1}")
                scorers.append(name)
        
        # Add some defenders as possible scorers
        for card in team.get("DEF", []):
            if len(scorers) < 5 and random.random() < 0.3:
                if "player" in card:
                    name = card["player"].get("name", f"Defender {len(scorers) + 1}")
                else:
                    name = card.get("name", f"Defender {len(scorers) + 1}")
                scorers.append(name)
        
        # If no scorers found, use defaults
        if not scorers:
            scorers = [f"Player {i+1}" for i in range(5)]
        
        # Shuffle for variety
        random.shuffle(scorers)
        
        return scorers
    
    def _generate_match_summary(
        self, 
        player1_score: float, 
        player2_score: float, 
        winner: str
    ) -> str:
        """
        Generate human-readable match summary.
        
        Args:
            player1_score: Player 1's final score
            player2_score: Player 2's final score
            winner: Match winner
            
        Returns:
            Match summary string
        """
        if winner == "player1":
            if player1_score > player2_score + 20:
                return f"Dominant victory for Player 1! Final score: {player1_score:.1f} - {player2_score:.1f}"
            elif player1_score > player2_score + 10:
                return f"Convincing win for Player 1! Final score: {player1_score:.1f} - {player2_score:.1f}"
            else:
                return f"Narrow victory for Player 1! Final score: {player1_score:.1f} - {player2_score:.1f}"
        elif winner == "player2":
            if player2_score > player1_score + 20:
                return f"Dominant victory for Player 2! Final score: {player1_score:.1f} - {player2_score:.1f}"
            elif player2_score > player1_score + 10:
                return f"Convincing win for Player 2! Final score: {player1_score:.1f} - {player2_score:.1f}"
            else:
                return f"Narrow victory for Player 2! Final score: {player1_score:.1f} - {player2_score:.1f}"
        else:
            return f"Thrilling draw! Final score: {player1_score:.1f} - {player2_score:.1f}"
    
    def get_team_analysis(self, team_key: str) -> Dict[str, Any]:
        """
        Get detailed analysis of a team's composition.
        
        Args:
            team_key: 'player1' or 'player2'
            
        Returns:
            Team analysis dictionary
        """
        team = self.player1_team if team_key == "player1" else self.player2_team
        
        analysis = {
            "total_cards": sum(len(cards) for cards in team.values()),
            "positions_filled": sum(1 for cards in team.values() if len(cards) > 0),
            "squad_strength": self._calculate_squad_strength(team),
            "manager_tactic": self._calculate_manager_tactic(team),
            "average_rating": 0.0,
            "strongest_position": None,
            "weakest_position": None
        }
        
        # Calculate average rating
        ratings = []
        position_avg = {}
        
        for position, cards in team.items():
            if position == "MGR":
                continue
            
            pos_ratings = []
            for card in cards:
                if "player" in card:
                    rating = card["player"].get("rating", 75)
                else:
                    rating = card.get("rating", 75)
                ratings.append(rating)
                pos_ratings.append(rating)
            
            if pos_ratings:
                position_avg[position] = sum(pos_ratings) / len(pos_ratings)
        
        if ratings:
            analysis["average_rating"] = round(sum(ratings) / len(ratings), 1)
        
        if position_avg:
            analysis["strongest_position"] = max(position_avg, key=position_avg.get)
            analysis["weakest_position"] = min(position_avg, key=position_avg.get)
        
        return analysis
