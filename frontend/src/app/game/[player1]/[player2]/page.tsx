'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

// Build WS path matching backend handler: /api/ws/game/{session_id}/{player_id}
const WS_PATH = (base: string, sessionId: string, playerId: string) => {
  if (!base) return `ws://localhost:8000/api/ws/game/${sessionId}/${playerId}`;
  if (base.startsWith('ws://') || base.startsWith('wss://')) return `${base.replace(/\/+$/,'')}/api/ws/game/${sessionId}/${playerId}`;
  if (base.startsWith('https://')) return `wss://${base.replace(/^https:\/\//,'').replace(/\/+$/,'')}/api/ws/game/${sessionId}/${playerId}`;
  if (base.startsWith('http://')) return `ws://${base.replace(/^http:\/\//,'').replace(/\/+$/,'')}/api/ws/game/${sessionId}/${playerId}`;
  return `ws://${base}/api/ws/game/${sessionId}/${playerId}`;
};

function formatMoney(val?: number | null) {
  if (!val && val !== 0) return '0M';
  return `${Math.round(val)}M`;
}

export default function GamePage() {
  const params = useParams();
  const player1 = (params?.player1 as string) || '';
  const player2 = (params?.player2 as string) || '';

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bidInput, setBidInput] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const prevHighestRef = useRef<number>(0);
  const expiryHandledRef = useRef<boolean>(false);

  const createSession = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: player1 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.detail || 'فشل إنشاء الجلسة');
      const sid = data?.data?.session_id || data?.session_id || data?.data?.sessionId || data?.sessionId;
      setSessionId(sid);
      setLoading(false);
      return sid;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل إنشاء الجلسة');
      setLoading(false);
      return null;
    }
  }, [API_BASE, player1]);

  useEffect(() => {
    if (!player1) {
      setError('معرّف اللاعب غير مُحدد');
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const sid = await createSession();
      if (!sid || !mounted) return;

      const wsUrl = WS_PATH(WS_BASE, sid, player1);
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.info('WebSocket opened', wsUrl);
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg?.type === 'state_update') {
              const newState = msg.data;
              const prev = prevHighestRef.current || 0;
              const newHighest = Number(newState?.highest_bid || 0);
              if (newHighest > prev) {
                setSecondsLeft(30);
                expiryHandledRef.current = false;
              }
              prevHighestRef.current = newHighest;
              setGameState(newState);
            } else if (['auction_started', 'bid_placed', 'turn_skipped', 'match_result', 'auction_state', 'timer_update'].includes(msg?.type)) {
              fetch(`${API_BASE}/session/${sid}/state`)
                .then((r) => r.json())
                .then((j) => {
                  const s = j?.data || j;
                  const newHighest = Number(s?.highest_bid || 0);
                  prevHighestRef.current = newHighest;
                  setGameState(s);
                  setSecondsLeft(30);
                  expiryHandledRef.current = false;
                })
                .catch(() => null);
            }
          } catch (e) {
            console.error('ws message parse', e);
          }
        };

        ws.onclose = (ev) => {
          setIsConnected(false);
          console.warn('WebSocket closed', { url: wsUrl, code: (ev as CloseEvent)?.code, reason: (ev as CloseEvent)?.reason });

          // If we don't have game state yet, surface a clear error to the user
          if (!gameState) {
            const code = (ev as CloseEvent)?.code ?? 'غير معروف';
            const reason = (ev as CloseEvent)?.reason ?? 'لا يوجد سبب موضح';
            setError(`اتصال WebSocket مغلق (code: ${code}). السبب: ${reason}`);
            setLoading(false);
          }

          setTimeout(() => {
            if (wsRef.current !== ws) return;
            if (sessionId) {
              const newWs = new WebSocket(WS_PATH(WS_BASE, sessionId, player1));
              wsRef.current = newWs;
            }
          }, 2000);
        };

        ws.onerror = (ev) => {
          console.error('WebSocket error', { url: wsUrl, event: ev });
          const reason = (ev && (ev as any).message) ? (ev as any).message : 'خطأ في WebSocket';
          setError(`فشل اتصال WebSocket: ${reason}`);
          setLoading(false);
        };
      } catch (e) {
        console.error('WS connection failed', e);
        setError(`فشل إنشاء WebSocket: ${e instanceof Error ? e.message : String(e)}`);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
    };
  }, [player1, createSession, WS_BASE, API_BASE, sessionId, gameState]);

  useEffect(() => {
    if (!gameState) return;
    setSecondsLeft(30);
    expiryHandledRef.current = false;
  }, [gameState?.current_turn]);

  useEffect(() => {
    if (!gameState) return;
    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!expiryHandledRef.current) {
            expiryHandledRef.current = true;
            (async () => {
              try {
                const cur = gameState.current_turn;
                await fetch(`${API_BASE}/session/${sessionId}/skip`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ player_id: cur }),
                });
                const r = await fetch(`${API_BASE}/session/${sessionId}/state`);
                const j = await r.json();
                setGameState(j?.data || j);
              } catch (e) {
                console.error('skip on expiry failed', e);
              }
            })();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [gameState, API_BASE, sessionId]);

  const sendBid = useCallback(async (amount: number) => {
    if (!sessionId) return;
    try {
      const resp = await fetch(`${API_BASE}/session/${sessionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: player1, amount }),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.detail || j?.message || 'فشل في تقديم العرض');
      const stateResp = await fetch(`${API_BASE}/session/${sessionId}/state`);
      const stateJson = await stateResp.json();
      setGameState(stateJson?.data || stateJson);
      setBidInput('');
      setSecondsLeft(30);
      expiryHandledRef.current = false;
      setError(null);
    } catch (e: any) {
      console.error('bid error', e);
      setError(e.message || 'فشل في تقديم العرض');
    }
  }, [API_BASE, sessionId, player1]);

  const doSkip = useCallback(async () => {
    if (!sessionId) return;
    try {
      await fetch(`${API_BASE}/session/${sessionId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: player1 }),
      });
      const stateResp = await fetch(`${API_BASE}/session/${sessionId}/state`);
      const stateJson = await stateResp.json();
      setGameState(stateJson?.data || stateJson);
      setSecondsLeft(30);
      expiryHandledRef.current = false;
    } catch (e) {
      console.error('skip error', e);
    }
  }, [API_BASE, sessionId, player1]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 text-white" dir="rtl">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping"></div>
          <div className="w-16 h-16 rounded-full border-4 border-t-amber-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <p className="text-lg font-bold tracking-wide text-zinc-300">جاري الدخول إلى غرفة المزاد...</p>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div className="min-h-screen bg-neutral-950 text-rose-500 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-rose-950/40 border border-rose-800/60 p-6 rounded-2xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">تعذر الاتصال بالساحة</h2>
          <p className="text-sm text-rose-300/80">{error}</p>
        </div>
      </div>
    );
  }

  const highest = Number(gameState?.highest_bid || 0);
  const currentTurn = gameState?.current_turn || player1;
  const isMyTurn = currentTurn === player1;
  const card = gameState?.current_card;
  const timerPercent = (secondsLeft / 30) * 100;

  const quickBid = (inc: number) => {
    const base = highest > 0 ? highest : 0;
    sendBid(Math.round(base + inc));
  };

  const onConfirmBid = () => {
    const v = Number(bidInput.replace(/[^0-9.]/g, ''));
    if (!v || v <= highest) {
      setError('يجب أن تكون المزايدة أعلى من السعر الحالي');
      return;
    }
    sendBid(v);
  };

  return (
    <main className="min-h-screen bg-[#07090e] text-white selection:bg-amber-500 selection:text-black font-sans pb-12" dir="rtl">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]"></span>
            <span className="font-black text-xl tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
              OSM FUT Battle
            </span>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-4 py-1.5 rounded-full text-xs font-semibold shadow-inner">
            <span className="text-amber-400 font-bold">{player1}</span>
            <span className="text-zinc-500 font-black italic">VS</span>
            <span className="text-cyan-400 font-bold">{player2 || 'الخصم'}</span>
            <span className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`} />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Match Context & Stats */}
        <aside className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          {/* Team Power Overview */}
          <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-amber-400 rounded-full"></span>
              بيانات النادي
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800/60 p-4 rounded-2xl">
                <span className="text-xs text-zinc-500 block mb-1">تقييم الفريق (OVR)</span>
                <span className="text-3xl font-black text-emerald-400">{gameState?.teams?.player1?.total_power ?? '—'}</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/60 p-4 rounded-2xl">
                <span className="text-xs text-zinc-500 block mb-1">الميزانية المتاحة</span>
                <span className="text-3xl font-black text-amber-400">
                  {gameState?.bot_info?.remaining_budget ? formatMoney(gameState.bot_info.remaining_budget) : '100M'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Action Feed */}
          <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-full"></span>
              سجل أحداث المزاد
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {Array.isArray(gameState?.auction_log) && gameState.auction_log.length > 0 ? (
                gameState.auction_log.slice().reverse().map((ev: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-950/50 border border-zinc-800/40 px-3 py-2.5 rounded-xl">
                    <span className="text-zinc-300 font-medium">{ev.player ?? ev.winner ?? 'لاعب'}: {ev.action}</span>
                    <span className="font-bold text-amber-400">{ev.amount ? formatMoney(ev.amount) : '—'}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-600">بانتظار حركة المزايدات...</div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Side: FUT Card Display & Bidding Arena */}
        <section className="lg:col-span-8 space-y-6 order-1 lg:order-2">
          {/* Main Card Arena */}
          <div className="relative bg-gradient-to-b from-zinc-900/60 via-zinc-950/90 to-zinc-950 border border-zinc-800/80 rounded-3xl p-6 lg:p-8 shadow-2xl overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header: Turn status & Timer bar */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-2 ${
                  isMyTurn ? 'bg-amber-400 text-black shadow-[0_0_15px_#f59e0b80]' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-black animate-pulse' : 'bg-zinc-500'}`} />
                  {isMyTurn ? 'دورك للمزايدة' : `الدور: ${currentTurn}`}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-zinc-500 block font-bold">الوقت المتبقي</span>
                  <span className={`text-2xl font-black ${secondsLeft <= 5 ? 'text-rose-500 animate-bounce' : 'text-zinc-200'}`}>
                    00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
                  </span>
                </div>
              </div>
            </div>

            {/* Timer Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  secondsLeft <= 5 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                }`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>

            {/* Center Stage: FUT Card + Price Panel */}
            <div className="relative z-10 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* FIFA Ultimate Team Card Mock */}
              <div className="flex justify-center">
                <div className="relative w-64 h-96 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-200 to-amber-700 p-1 shadow-[0_20px_40px_rgba(0,0,0,0.8)] transform hover:scale-105 tran[...]" />
              </div>

              {/* Price & Action Section */}
              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 block mb-1">أعلى عرض قائم</span>
                  <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                    {formatMoney(highest)}
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400">مزايدة سريعة فوق السعر:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, 50].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => quickBid(amt)}
                        disabled={!isMyTurn}
                        className="py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 hover:bg-amber-400 hover:text-black hover:border-amber-400 font-bold transition-all duration-200 acti[...]"
                      >
                        +{amt}M
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Bid & Skip Actions */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <input
                      aria-label="amount"
                      inputMode="numeric"
                      value={bidInput}
                      onChange={(e) => setBidInput(e.target.value)}
                      placeholder={`أعلى من ${highest}`}
                      className="w-full bg-zinc-950 border border-zinc-700/60 rounded-xl px-4 text-center font-bold text-lg text-white focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={onConfirmBid}
                      disabled={!isMyTurn}
                      className="px-6 py-3 rounded-xl font-black bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_#10b98140] transition-all duration-200 active:scale-95 disabled:op[...]"
                    >
                      مزايدة
                    </button>
                  </div>

                  <button
                    onClick={doSkip}
                    disabled={!isMyTurn}
                    className="w-full py-2.5 rounded-xl font-bold bg-zinc-900/80 hover:bg-rose-950/50 hover:text-rose-400 border border-zinc-800 hover:border-rose-800 transition-all duration-200 [...]"
                  >
                    تخطي الدور (Skip)
                  </button>
                </div>

                {error && <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-xl text-center">{error}</div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
