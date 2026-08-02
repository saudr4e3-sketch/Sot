"""
OSM FUT Dual Battle - Advanced Auction & Game Logic Engine
==========================================================
نظام إدارة المزادات، الجلسات، قاعدة البيانات الضخمة (لاعبين ومدربين)، والذكاء الاصطناعي للبوت.
"""

import random
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# ==================== ثوابت وتصنيفات اللعبة ====================
AUCTION_POSITIONS = ["GK", "DEF", "MID", "ATT", "COACH"]
POSITION_DISPLAY = {
    "GK": "حارس مرمى",
    "DEF": "مدافع",
    "MID": "خط وسط",
    "ATT": "مهاجم",
    "COACH": "مدرب تكتيكي"
}

# ==================== قاعدة البيانات الضخمة (اللاعبين والمدربين) ====================
# توليد بيانات ضخمة وواقعية (50 حارس، 50 مدافع، 50 وسط، 50 هجوم، 50 مدرب)
def generate_massive_database() -> Dict[str, List[Dict[str, Any]]]:
    db = {"GK": [], "DEF": [], "MID": [], "ATT": [], "COACH": []}
    
    first_names = ["محمد", "أحمد", "عمر", "خالد", "يوسف", "إبراهيم", "كريستيانو", "ليونيل", "كيفين", "كيليان", "جود", "فينيسيوس", "روبرت", "إيرلينغ", "فيرجيل", "اليسون", "تيبو", "مانويل"]
    last_names = ["الدوسري", "العمري", "البلوي", "المالكي", "الشهري", "سيلفا", "موسيالا", "رودريغو", "بيلينغهام", "مبابي", "هالاند", "دي بروين", "فان دايك", "صلاح", "بونو", "كورتوا", "نوير"]

    for pos in ["GK", "DEF", "MID", "ATT"]:
        for i in range(1, 51):
            name = f"{random.choice(first_names)} {random.choice(last_names)} {i}"
            # تدرج القوة: من ضعيف (70) إلى وسط (82) إلى قوي/أسطوري (94)
            if i <= 15:
                tier = "weak"
                ovr = random.randint(70, 76)
                base_price = random.randint(5, 15)
            elif i <= 35:
                tier = "mid"
                ovr = random.randint(77, 85)
                base_price = random.randint(16, 35)
            else:
                tier = "strong"
                ovr = random.randint(86, 95)
                base_price = random.randint(36, 75)

            db[pos].append({
                "id": f"{pos.lower()}_{i}",
                "name": name,
                "position": pos,
                "ovr": ovr,
                "tier": tier,
                "base_price": base_price,
                "image": f"https://cdn.sofifa.net/players/0{random.randint(100,999)}/24_120.png"
            })

    # 50 مدرباً
    coach_styles = ["هجومي شامل", "دفاع حديدي", "استحواذ وسط", "مرتدات سريعة"]
    for i in range(1, 51):
        db["COACH"].append({
            "id": f"coach_{i}",
            "name": f"المدرب {random.choice(first_names)} {i}",
            "position": "COACH",
            "tactics": random.choice(coach_styles),
            "boost": random.randint(2, 6),
            "base_price": random.randint(10, 30),
            "image": f"https://cdn.sofifa.net/teams/0{random.randint(10,99)}/60.png"
        })

    return db

GLOBAL_PLAYERS_DB = generate_massive_database()

# ==================== كلاس إدارة نظام المزاد واللعبة ====================
class OSMDualBattle:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self, player_id: str) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())[:8]
        
        # اختيار عشوائي لبطاقات المزاد للجلسة (مثلاً 5 جولات)
        auction_pool = []
        for pos in AUCTION_POSITIONS:
            if GLOBAL_PLAYERS_DB[pos]:
                auction_pool.append(random.choice(GLOBAL_PLAYERS_DB[pos]))

        self.sessions[session_id] = {
            "session_id": session_id,
            "host": player_id,
            "status": "waiting", # waiting, active, finished
            "current_round": 0,
            "auction_pool": auction_pool,
            "current_card": None,
            "current_bid": 0,
            "highest_bidder": None,
            "timer": 30,
            "players": {
                player_id: {"budget": 150, "squad": [], "ovr": 85},
                "Bot_AI": {"budget": 150, "squad": [], "ovr": 85}
            }
        }
        return self.sessions[session_id]

    def start_auction(self, session_id: str) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "الجلسة غير موجودة"}
        
        session["status"] = "active"
        return self.load_next_card(session_id)

    def load_next_card(self, session_id: str) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "الجلسة غير موجودة"}

        pool = session["auction_pool"]
        if session["current_round"] < len(pool):
            session["current_card"] = pool[session["current_round"]]
            session["current_bid"] = session["current_card"]["base_price"]
            session["highest_bidder": None] = None
            session["timer"] = 30
            session["current_round"] += 1
            return {"success": True, "card": session["current_card"], "status": "bidding"}
        else:
            session["status"] = "finished"
            return {"success": True, "status": "auction_ended"}

    def place_bid(self, session_id: str, player_id: str, amount: float) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session or session["status"] != "active":
            return {"success": False, "result": {"error": "المزاد غير فعال"}}

        if amount <= session["current_bid"]:
            return {"success": False, "result": {"error": "مبلغ العرض يجب أن يكون أكبر من السعر الحالي"}}

        if session["players"][player_id]["budget"] < amount:
            return {"success": False, "result": {"error": "الميزانية لا تكفي"}}

        session["current_bid"] = amount
        session["highest_bidder"] = player_id
        session["timer"] = 30 # إعادة ضبط العداد لـ 30 ثانية لكل مزايدة ناجحة

        return {
            "success": True,
            "current_bid": amount,
            "highest_bidder": player_id,
            "timer": 30
        }

    def skip_turn(self, session_id: str, player_id: str) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            return {"success": False, "result": {"error": "الجلسة غير موجودة"}}

        # إذا انسحب اللاعب، تذهب البطاقة للطرف الآخر أو تنتهي الجولة
        winner = "Bot_AI" if player_id != "Bot_AI" else session["host"]
        card = session["current_card"]
        
        if session["highest_bidder"]:
            winner = session["highest_bidder"]
            winning_price = session["current_bid"]
            session["players"][winner]["squad"].append(card)
            session["players"][winner]["budget"] -= winning_price

        # الانتقال للبطاقة التالية
        next_result = self.load_next_card(session_id)
        return {
            "success": True,
            "message": f"انتهت الجولة لصالح {winner}",
            "next_card_data": next_result
        }

    def get_auction_state(self, session_id: str) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "الجلسة غير موجودة"}
        return session

    def reveal_team(self, session_id: str, player_id: str) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "الجلسة غير موجودة"}
        return {"player_id": player_id, "squad": session["players"].get(player_id, {}).get("squad", [])}

    def play_match(self, session_id: str) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "الجلسة غير موجودة"}

        host_id = session["host"]
        host_ovr = session["players"][host_id]["ovr"]
        bot_ovr = session["players"]["Bot_AI"]["ovr"]

        # محاكاة مباراة واقعية بناءً على القوة وتقييم الفريق
        host_goals = random.randint(0, 4) if host_ovr >= bot_ovr else random.randint(0, 2)
        bot_goals = random.randint(0, 3)

        winner = host_id if host_goals > bot_goals else ("Bot_AI" if bot_goals > host_goals else "تعادل")

        return {
            "match_result": {
                host_id: host_goals,
                "Bot_AI": bot_goals,
                "winner": winner
            }
        }
