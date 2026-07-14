import os
from dotenv import load_dotenv

load_dotenv()

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Auction Constants
AUCTION_POSITIONS = [
    "GK",        # 1 Goalkeeper
    "DEF",       # 2 Defenders
    "DEF",
    "MID",       # 2 Midfielders
    "MID",
    "ATT",       # 2 Attackers
    "ATT",
    "MGR",       # 2 Managers
    "MGR"
]

AUCTION_TIMER = 30  # seconds per bid

# Mystery Card Probability (MUST FOLLOW STRICTLY)
# When a player loses an auction, they receive a mystery card with these probabilities:
MYSTERY_CARD_PROBABILITIES = {
    "Legendary": 0.30,  # 30% - 5 star players
    "Medium": 0.30,     # 30% - 3-4 star players
    "Weak": 0.40        # 40% - 1-2 star players
}

# Match Simulation Engine (30/30/40 RATIO - STRICT COMPLIANCE)
# These weights determine match outcome
MATCH_SIMULATION_WEIGHTS = {
    "squad_strength": 0.30,   # 30% - Squad combined ratings
    "manager_tactic": 0.30,   # 30% - Manager skill & formation
    "luck": 0.40              # 40% - Random variance
}

# Player Ratings
PLAYER_RATING_RANGES = {
    "Legendary": (85, 99),
    "Medium": (75, 84),
    "Weak": (60, 74)
}

MANAGER_RATING_RANGES = {
    "Legendary": (88, 95),
    "Medium": (78, 87),
    "Weak": (65, 77)
}

# Team Composition
TEAM_COMPOSITION = {
    "GK": 1,
    "DEF": 2,
    "MID": 2,
    "ATT": 2,
    "MGR": 2
}

# API Configuration
API_FOOTBALL_BASE_URL = os.getenv("API_FOOTBALL_BASE_URL", "https://api-football-v1.p.rapidapi.com")
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY", "")

# Footer Signature
DEVELOPER_SIGNATURE = {
    "name": "Saud Yahya Al-Faifi",
    "contact": "0535103986"
}

# Design System Colors
DESIGN_COLORS = {
    "background": "#0F1419",          # Deep Navy
    "background_alt": "#1A1F2E",      # Slate Blue
    "accent": "#D4714D",              # Muted Terracotta
    "text_primary": "#E8E8E8",        # Light Gray
    "text_secondary": "#A0A0A0",      # Medium Gray
    "card_bg": "#2C2C3E",             # Charcoal
    "success": "#4CAF50",
    "error": "#F44336",
    "warning": "#FF9800"
}
