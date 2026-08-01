"""
Utility for resilient player image fetching and caching.
Stores images on disk cache by default, or uses Redis if available.
Provides an async fetch helper and a synchronous proxy endpoint integration.
"""
import os
import io
import aiohttp
import asyncio
import logging
import hashlib
from typing import Optional
from pathlib import Path

logger = logging.getLogger("image_handler")

CACHE_DIR = Path(os.environ.get("IMAGE_CACHE_DIR", "image_cache"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)

try:
    import redis.asyncio as redis
    REDIS = True
    REDIS_URL = os.environ.get("REDIS_URL")
    _redis_client = redis.from_url(REDIS_URL) if REDIS_URL else None
except Exception:
    REDIS = False
    _redis_client = None


async def _download_image(url: str, timeout: int = 10) -> Optional[bytes]:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=timeout) as resp:
                if resp.status == 200:
                    return await resp.read()
                else:
                    logger.debug(f"Image fetch failed {url} status={resp.status}")
                    return None
    except Exception as e:
        logger.exception(f"Exception fetching image {url}: {e}")
        return None


async def fetch_and_cache_image(urls, key: str, ttl: int = 86400) -> Optional[bytes]:
    """Try multiple urls in order and cache the resulting bytes.
    urls: iterable of url strings (primary, fallback, emergency)
    key: cache key (e.g., player_{id})
    """
    if REDIS and _redis_client:
        try:
            raw = await _redis_client.get(key)
            if raw:
                return raw
        except Exception:
            logger.exception("Redis get failed")

    # disk cache check
    hashed = hashlib.sha256(key.encode()).hexdigest()
    cache_path = CACHE_DIR / f"{hashed}.bin"
    if cache_path.exists():
        try:
            with open(cache_path, "rb") as f:
                data = f.read()
                return data
        except Exception:
            pass

    # attempt downloads with retries/backoff
    for url in urls:
        for attempt in range(3):
            data = await _download_image(url)
            if data:
                # save to cache
                try:
                    with open(cache_path, "wb") as f:
                        f.write(data)
                except Exception:
                    logger.exception("Failed writing image to disk cache")
                if REDIS and _redis_client:
                    try:
                        await _redis_client.set(key, data, ex=ttl)
                    except Exception:
                        logger.exception("Redis set failed")
                return data
            await asyncio.sleep(0.2 * (attempt + 1))
    return None
