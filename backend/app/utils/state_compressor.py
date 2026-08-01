import gzip

# compress small snapshot of game state before broadcast

def compress_state(state: dict) -> bytes:
    try:
        raw = json.dumps(state, ensure_ascii=False).encode('utf-8')
        return gzip.compress(raw)
    except Exception:
        return b''
