"""Extend match payload with timeline events for richer MatchView visualization."""

import random
from typing import Dict, Any, List


def build_timeline(num_events: int = 10) -> List[Dict[str, Any]]:
    timeline = []
    for i in range(num_events):
        minute = random.randint(1, 90)
        etype = random.choices(["shot", "goal", "foul", "sub"], weights=[60, 10, 20, 10])[0]
        actor = f"Player_{random.randint(1,22)}"
        xg = round(random.random(), 2) if etype == "shot" else 0.0
        timeline.append({
            "minute": minute,
            "type": etype,
            "actor": actor,
            "xg": xg,
            "x": random.randint(10, 90),
            "y": random.randint(10, 50),
            "description": {
                "shot": "تصويبة من خارج الصندوق",
                "goal": "هدف رائع!",
                "foul": "خطأ",
                "sub": "تبديل"
            }[etype]
        })
    # sort by minute
    timeline.sort(key=lambda e: e["minute"]) 
    return timeline


def simulate_match_payload(team1_name: str = "Team A", team2_name: str = "Team B") -> Dict[str, Any]:
    timeline = build_timeline(12)
    team1_goals = sum(1 for e in timeline if e["type"] == "goal" and random.random() > 0.5)
    team2_goals = sum(1 for e in timeline if e["type"] == "goal" and random.random() <= 0.5)
    return {
        "team1_info": {"name": team1_name, "goals": team1_goals},
        "team2_info": {"name": team2_name, "goals": team2_goals},
        "timeline": timeline,
        "ended": True
    }
