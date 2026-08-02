# Image protection helpers and candidate builder for player images
from typing import List

def svg_silhouette_data_url(position: str, name: str = "", dark: bool = True) -> str:
    color = "#0b0b0b" if dark else "#ffffff"
    accent = "#374151" if dark else "#9ca3af"
    text = position or ""
    svg = (
        f"<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'>"
        f"<rect width='100%' height='100%' fill='{color}'/>"
        f"<circle cx='200' cy='180' r='80' fill='{accent}' opacity='0.12'/>"
        f"<rect x='80' y='320' width='240' height='200' fill='{accent}' opacity='0.06'/>"
        f"<text x='200' y='560' font-size='28' fill='{accent}' text-anchor='middle' font-family='Arial, Helvetica, sans-serif'>{text}</text>"
        "</svg>"
    )
    return "data:image/svg+xml;utf8," + svg.replace("#", "%23")


def default_player_data_url() -> str:
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'>"
        "<rect width='100%' height='100%' fill='#050505'/>"
        "<text x='200' y='300' font-size='20' fill='#374151' text-anchor='middle' font-family='Arial, Helvetica, sans-serif'>Player Image Unavailable</text>"
        "</svg>"
    )
    return "data:image/svg+xml;utf8," + svg.replace("#", "%23")

class ImageProtectionSystem:
    CDN_BASE_URL = "https://cdn.osm-fut.com/players"
    FALLBACK_CDN = "https://cdn2.osm-fut.com/players"

    @classmethod
    def get_silhouette_data_url(cls, position: str, name: str = "") -> str:
        return svg_silhouette_data_url(position, name, dark=True)

    @classmethod
    def get_emergency_data_url(cls) -> str:
        return default_player_data_url()


def build_image_candidates_for_player(player: dict) -> List[str]:
    candidates: List[str] = []
    fifa_id = player.get("fifa_id") or player.get("sofifa_id") or player.get("ea_id")
    if fifa_id:
        candidates.append(f"https://cdn.sofifa.net/players/{fifa_id}.png")
        candidates.append(f"{ImageProtectionSystem.CDN_BASE_URL}/{fifa_id}.png")

    image_field = player.get("image")
    if image_field:
        s = str(image_field)
        if s.startswith("http"):
            candidates.append(s)
        else:
            candidates.append(f"{ImageProtectionSystem.CDN_BASE_URL}/{s}.png")

    remote = player.get("remote_image")
    if remote:
        candidates.append(remote)

    pos = player.get("position") or player.get("display_position") or ""
    candidates.append(ImageProtectionSystem.get_silhouette_data_url(pos, player.get("name", "")))

    candidates.append(ImageProtectionSystem.get_emergency_data_url())

    # dedupe
    seen = set()
    final = []
    for u in candidates:
        if u not in seen:
            final.append(u)
            seen.add(u)
    return final
