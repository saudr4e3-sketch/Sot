"""Auction monkeypatch helper

This module patches OSMDualBattle._process_bot_turn to use threading.Timer
instead of time.sleep to avoid blocking the event loop. It does not modify
auction.py; it applies a runtime monkeypatch so existing logic is preserved
and only the scheduling behavior is changed.

Usage: import and call apply_patch(OSMDualBattle)
"""

import threading
import asyncio
import logging
from typing import Any

logger = logging.getLogger("auction_monkeypatch")


def _make_patched_process_bot_turn():
    def _process_bot_turn(self, bot_id: str, delay_seconds: float = 1.5):
        """
        Non-blocking bot turn processor: schedules bot action after `delay_seconds`
        using threading.Timer instead of time.sleep so we don't block event loop.

        This implementation will attempt to call existing synchronous helper
        methods on the instance (for example: _run_bot_turn or place_bot_bid_if_needed).
        If such a method returns a coroutine, it will be scheduled on the
        running asyncio loop via run_coroutine_threadsafe.
        """
        # Ensure we have a place to keep timers so we can cancel if needed
        if not hasattr(self, "_bot_timers"):
            try:
                self._bot_timers = {}
            except Exception:
                # last resort: attach to object via setattr
                setattr(self, "_bot_timers", {})

        def _execute_bot_action():
            try:
                # Prefer existing explicit runner if available
                if hasattr(self, "_run_bot_turn"):
                    try:
                        result = self._run_bot_turn(bot_id)
                        # If the result is a coroutine, schedule it on the event loop
                        if asyncio.iscoroutine(result):
                            try:
                                loop = asyncio.get_event_loop()
                            except RuntimeError:
                                loop = None
                            if loop and loop.is_running():
                                asyncio.run_coroutine_threadsafe(result, loop)
                            else:
                                # Best-effort: run in a new loop
                                try:
                                    asyncio.run(result)
                                except Exception:
                                    logger.exception("Error running bot coroutine in new loop")
                    except Exception:
                        # If sync path raised, attempt to log and continue
                        logger.exception(f"Bot sync execution error for {bot_id}")

                # If no _run_bot_turn, try fallback methods
                elif hasattr(self, "place_bot_bid_if_needed"):
                    try:
                        maybe = self.place_bot_bid_if_needed(bot_id)
                        if asyncio.iscoroutine(maybe):
                            try:
                                loop = asyncio.get_event_loop()
                            except RuntimeError:
                                loop = None
                            if loop and loop.is_running():
                                asyncio.run_coroutine_threadsafe(maybe, loop)
                            else:
                                asyncio.run(maybe)
                    except Exception:
                        logger.exception(f"Bot fallback action error for {bot_id}")
                else:
                    # No known runner — log and return silently
                    logger.debug(f"No bot runner found for {bot_id}; skipping action")

            except Exception:
                logger.exception(f"Unhandled exception in bot timer for {bot_id}")
            finally:
                # cleanup scheduled timer reference
                try:
                    if hasattr(self, "_bot_timers"):
                        self._bot_timers.pop(bot_id, None)
                except Exception:
                    pass

        # Cancel an existing pending timer for this bot if any
        existing = None
        try:
            existing = getattr(self, "_bot_timers", {}).get(bot_id)
        except Exception:
            existing = None
        if isinstance(existing, threading.Timer):
            try:
                existing.cancel()
            except Exception:
                pass

        t = threading.Timer(delay_seconds, _execute_bot_action)
        t.daemon = True
        try:
            self._bot_timers[bot_id] = t
        except Exception:
            try:
                setattr(self, "_bot_timers", {**getattr(self, "_bot_timers", {}), bot_id: t})
            except Exception:
                # give up storing reference but still start timer
                pass
        t.start()

    return _process_bot_turn


def apply_patch(cls: Any):
    """Apply the monkeypatch to the provided class (OSMDualBattle).

    This function is idempotent: calling it multiple times is safe.
    """
    if hasattr(cls, "_original_process_bot_turn"):
        logger.debug("Patch already applied (original preserved)")
        return

    # preserve original if present
    original = getattr(cls, "_process_bot_turn", None)
    setattr(cls, "_original_process_bot_turn", original)

    patched = _make_patched_process_bot_turn()
    setattr(cls, "_process_bot_turn", patched)
    logger.info("Applied auction bot timer monkeypatch to %s", cls)
