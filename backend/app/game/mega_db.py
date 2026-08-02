import os
import sqlite3
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

DB_PATH_DEFAULT = Path(__file__).resolve().parents[2] / "data" / "mega.db"

class MegaDatabase:
    """Lightweight SQLite-based store for players and coaches.

    - Idempotent initialization: does not overwrite existing DB unless force=True
    - Provides convenience methods to query all players/coaches and to seed default data
    - Stores a JSON `meta` column for extensible fields (fifa_id, image, remote_image, etc.)
    """

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = Path(db_path) if db_path else DB_PATH_DEFAULT
        self.conn: Optional[sqlite3.Connection] = None
        self._ensure_parent()
        self.connect()
        self._migrate()

    def _ensure_parent(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def connect(self):
        self.conn = sqlite3.connect(str(self.db_path))
        # Return rows as dict
        self.conn.row_factory = sqlite3.Row

    def close(self):
        if self.conn:
            self.conn.commit()
            self.conn.close()
            self.conn = None

    def _migrate(self):
        cur = self.conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            position TEXT NOT NULL,
            meta JSON,
            image_data_candidates JSON,
            created_at TEXT
        )
        """)
        cur.execute("""
        CREATE TABLE IF NOT EXISTS coaches (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            meta JSON,
            created_at TEXT
        )
        """)
        self.conn.commit()

    def has_players(self) -> bool:
        cur = self.conn.cursor()
        cur.execute("SELECT COUNT(1) as c FROM players")
        r = cur.fetchone()
        return r["c"] > 0

    def insert_player(self, player: Dict[str, Any]):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO players (id, name, position, meta, image_data_candidates, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                player.get("id"),
                player.get("name"),
                player.get("position"),
                json.dumps(player.get("meta", {}), ensure_ascii=False),
                json.dumps(player.get("image_data_candidates", []), ensure_ascii=False),
                datetime.utcnow().isoformat()
            )
        )
        self.conn.commit()

    def insert_coach(self, coach: Dict[str, Any]):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO coaches (id, name, meta, created_at) VALUES (?, ?, ?, ?)",
            (
                coach.get("id"),
                coach.get("name"),
                json.dumps(coach.get("meta", {}), ensure_ascii=False),
                datetime.utcnow().isoformat()
            )
        )
        self.conn.commit()

    def get_all_players(self) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM players ORDER BY position, name")
        rows = cur.fetchall()
        out = []
        for r in rows:
            out.append({
                "id": r["id"],
                "name": r["name"],
                "position": r["position"],
                "meta": json.loads(r["meta"]) if r["meta"] else {},
                "image_data_candidates": json.loads(r["image_data_candidates"]) if r["image_data_candidates"] else [],
            })
        return out

    def get_all_coaches(self) -> List[Dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM coaches ORDER BY name")
        rows = cur.fetchall()
        out = []
        for r in rows:
            out.append({
                "id": r["id"],
                "name": r["name"],
                "meta": json.loads(r["meta"]) if r["meta"] else {}
            })
        return out

    def seed_default_data(self, force: bool = False):
        """Seed a compact set of players and coaches organized by positions.

        This function is idempotent unless force=True.
        """
        if self.has_players() and not force:
            return {"seeded": False, "reason": "players already exist"}

        # A compact but representative seed across GK, DEF, MID, FWD
        sample_players = [
            {"id": "p_gk_01", "name": "Ali Al-Najjar", "position": "GK", "meta": {"fifa_id": "101", "image": "ali_najjar"}},
            {"id": "p_def_01", "name": "Omar Haddad", "position": "DEF", "meta": {"fifa_id": "202", "image": "omar_haddad"}},
            {"id": "p_def_02", "name": "Yousef Kareem", "position": "DEF", "meta": {"fifa_id": "203", "image": "yousef_kareem"}},
            {"id": "p_mid_01", "name": "Khaled Mansour", "position": "MID", "meta": {"fifa_id": "304", "image": "khaled_mansour"}},
            {"id": "p_mid_02", "name": "Nasser Al-Bishi", "position": "MID", "meta": {"fifa_id": "305", "image": "nasser_bishi"}},
            {"id": "p_fwd_01", "name": "Fahad Al-Salem", "position": "FWD", "meta": {"fifa_id": "401", "image": "fahad_salem"}},
            {"id": "p_fwd_02", "name": "Sami Qassem", "position": "FWD", "meta": {"remote_image": "https://example.com/images/sami_qassem.png"}},
        ]

        sample_coaches = [
            {"id": "c_01", "name": "Coach Alawi", "meta": {"style": "attacking"}},
            {"id": "c_02", "name": "Coach Hamed", "meta": {"style": "balanced"}},
        ]

        # Build image candidates for each player using the same triple-fallback logic
        for p in sample_players:
            p_meta = p.get("meta", {})
            candidates = self._build_image_candidates_from_meta(p_meta, p.get("position"))
            p["image_data_candidates"] = candidates
            self.insert_player(p)

        for c in sample_coaches:
            self.insert_coach(c)

        return {"seeded": True, "players": len(sample_players), "coaches": len(sample_coaches)}

    def _build_image_candidates_from_meta(self, meta: Dict[str, Any], position: Optional[str] = None) -> List[str]:
        """Local implementation of the triple-fallback builder.

        Order:
          1) sofifa/canonical CDN if fifa_id provided
          2) internal CDN path (cdn.osm-fut.com)
          3) remote_image if provided
          4) silhouette data URL
          5) emergency data URL
        """
        candidates: List[str] = []
        fifa_id = meta.get("fifa_id") or meta.get("sofifa_id") or meta.get("ea_id")
        if fifa_id:
            candidates.append(f"https://cdn.sofifa.net/players/{fifa_id}.png")
            candidates.append(f"https://cdn.osm-fut.com/players/{fifa_id}.png")

        image_field = meta.get("image")
        if image_field:
            s = str(image_field)
            if s.startswith("http"):
                candidates.append(s)
            else:
                candidates.append(f"https://cdn.osm-fut.com/players/{s}.png")

        remote = meta.get("remote_image")
        if remote:
            candidates.append(remote)

        # silhouette data url (simple inline SVG)
        pos = position or meta.get("position") or meta.get("display_position") or ""
        svg = self._svg_silhouette(pos)
        candidates.append(svg)

        # emergency default
        candidates.append(self._default_player_svg())

        # dedupe preserving order
        seen = set()
        final = []
        for u in candidates:
            if u not in seen:
                final.append(u)
                seen.add(u)
        return final

    def _svg_silhouette(self, position: str) -> str:
        color = "%230b0b0b"
        accent = "%23374151"
        text = (position or "").replace('#', '')
        svg = (
            f"<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'>"
            f"<rect width='100%' height='100%' fill='{color}'/>"
            f"<circle cx='200' cy='180' r='80' fill='{accent}' opacity='0.12'/>"
            f"<rect x='80' y='320' width='240' height='200' fill='{accent}' opacity='0.06'/>"
            f"<text x='200' y='560' font-size='28' fill='{accent}' text-anchor='middle' font-family='Arial, Helvetica, sans-serif'>{text}</text>"
            "</svg>"
        )
        return "data:image/svg+xml;utf8," + svg

    def _default_player_svg(self) -> str:
        svg = (
            "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'>"
            "<rect width='100%' height='100%' fill='%23050505'/>"
            "<text x='200' y='300' font-size='20' fill='%23374151' text-anchor='middle' font-family='Arial, Helvetica, sans-serif'>Player Image Unavailable</text>"
            "</svg>"
        )
        return "data:image/svg+xml;utf8," + svg


# If this file is run directly, initialize DB and seed data (safe/idempotent)
if __name__ == '__main__':
    db = MegaDatabase()
    res = db.seed_default_data()
    print(json.dumps(res, indent=2, ensure_ascii=False))
    db.close()
