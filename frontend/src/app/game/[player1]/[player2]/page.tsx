'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

const WS_PATH = (base: string, sessionId: string) => {
  if (!base) return `ws://localhost:8000/api/ws/${sessionId}`;
  if (base.startsWith('ws://') || base.startsWith('wss://')) return `${base.replace(/\/+$/,'')}/api/ws/${sessionId}`;
  if (base.startsWith('https://')) return `wss://${base.replace(/^https:\/\//,'').replace(/\/+$/,'')}/api/ws/${sessionId}`;
  if (base.startsWith('http://')) return `ws://${base.replace(/^http:\/\//,'').replace(/\/+$/,'')}/api/ws/${sessionId}`;
  return `ws://${base.replace(/\/+$/,'')}/api/ws/${sessionId}`;
};

function formatMoney(val?: number | null) {
  if (val === undefined || val === null) return '0M';
  return `${Math.round(val)}M`;
}

function svgSilhouetteDataUrl(position: string, dark: boolean = true) {
  const color = dark ? '#1f2937' : '#e5e7eb';
  const accent = dark ? '#374151' : '#9ca3af';
  const text = position || '';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'><rect width='100%' height='100%' fill='${color}'/><circle cx='200' cy='180' r='80' fill='${accent}' opacity='0.12'/><rect x='80' y='320' width='240' height='200' fill='${accent}' opacity='0.06'/><text x='200' y='560' font-size='28' fill='${accent}' text-anchor='middle' font-family='Arial, Helvetica, sans-serif'>${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function defaultPlayerDataUrl() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'><rect width='100%' height='100%' fill='#050505'/><text x='200' y='300' font-size='20' fill='#374151' text-anchor='middle' font-family='Arial, Helvetica, sans-serif'>Player Image Unavailable</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Build an ordered list of candidate image URLs for a player
function buildImageCandidates(player: any) {
  const candidates: string[] = [];
  // 1) If player has authoritative FIFA/EAFC id, use known CDN pattern (sofifa as example)
  if (player?.fifa_id) {
    candidates.push(`https://cdn.sofifa.net/players/${player.fifa_id}.png`);
    // alternative official pattern (try both https and https with cdn.osm-fut)
    candidates.push(`https://cdn.osm-fut.com/players/${player.fifa_id}.png`);
  }
  // 2) If player has image field (internal id or path)
  if (player?.image) {
    const img = player.image;
    if (typeof img === 'string') {
      if (img.startsWith('http')) candidates.push(img);
      else candidates.push(`https://cdn.osm-fut.com/players/${img}.png`);
    }
  }
  // 3) If card has a remote_image field
  if (player?.remote_image) {
    candidates.push(player.remote_image);
  }
  // 4) silhouette generated as data URL (position-based)
  const pos = player?.position || player?.display_position || '';
  candidates.push(svgSilhouetteDataUrl(pos || ''));
  // 5) emergency default
  candidates.push(defaultPlayerDataUrl());
  return candidates;
}

function ImageWithTripleFallback({ player, alt, className }: { player: any; alt?: string; className?: string }) {
  const candidates = buildImageCandidates(player || {});
  const [index, setIndex] = useState(0);
  const [src, setSrc] = useState(candidates[0]);

  useEffect(() => {
    const list = buildImageCandidates(player || {});
    setIndex(0);
    setSrc(list[0]);
  }, [player]);

  useEffect(() => {
    setSrc(candidates[index] || defaultPlayerDataUrl());
  }, [index]);

  const onError = () => {
    if (index < candidates.length - 1) {
      setIndex((i) => i + 1);
    }
  };

  return (
    // Use regular img for flexible fallback handling
    <img
      src={src}
      alt={alt || player?.name || 'player'}
      onError={onError}
      className={className}
      decoding="async"
      style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}
    />
  );
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

  // Bid input (numeric, in Millions)
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
      if (!resp.ok) throw new Error(data?.detail || 'Failed to create session');
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

      const wsUrl = WS_PATH(WS_BASE, sid);
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => {
          setIsConnected(true);
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
            } else if (['auction_started','bid_placed','turn_skipped','match_result'].includes(msg?.type)) {
              fetch(`${API_BASE}/session/${sid}/state`).then(r=>r.json()).then(j=>{
                const s = j?.data || j;
                const newHighest = Number(s?.highest_bid || 0);
                prevHighestRef.current = newHighest;
                setGameState(s);
                setSecondsLeft(30);
                expiryHandledRef.current = false;
              }).catch(()=>null);
            }
          } catch (e) {
            console.error('ws message parse', e);
          }
        };
        ws.onclose = () => {
          setIsConnected(false);
          setTimeout(()=>{
            if (wsRef.current !== ws) return;
            if (sessionId) {
              try { wsRef.current = new WebSocket(WS_PATH(WS_BASE, sessionId)); } catch(e){}
            }
          }, 2000);
        };
        ws.onerror = (e) => { console.error('WebSocket error', e); };
      } catch (e) {
        console.error('WS connection failed', e);
      }
    })();

    return () => { mounted = false; if (wsRef.current) { try { wsRef.current.close(); } catch(e){} }};
  }, [player1, createSession, WS_BASE, API_BASE, sessionId]);

  useEffect(() => {
    if (!gameState) return;
    setSecondsLeft(30);
    expiryHandledRef.current = false;
  }, [gameState?.current_turn]);

  useEffect(() => {
    if (!gameState) return;
    const tick = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (!expiryHandledRef.current) {
            expiryHandledRef.current = true;
            (async () => {
              try {
                const cur = gameState.current_turn;
                await fetch(`${API_BASE}/session/${sessionId}/skip`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ player_id: cur })
                });
                const r = await fetch(`${API_BASE}/session/${sessionId}/state`);
                const j = await r.json();
                setGameState(j?.data || j);
              } catch (e) { console.error('skip on expiry failed', e); }
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
    } catch (e) { console.error('skip error', e); }
  }, [API_BASE, sessionId, player1]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" dir="rtl">
        <div className="text-xl font-bold animate-pulse">جاري تحميل ساحة المزاد... ⚽</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center" dir="rtl">
        <div>خطأ: {error}</div>
      </div>
    );
  }

  const highest = Number(gameState?.highest_bid || 0);
  const currentTurn = gameState?.current_turn || player1;
  const isMyTurn = currentTurn === player1;

  const quickBid = (inc: number) => {
    const base = highest > 0 ? highest : 0;
    const target = Math.round(base + inc);
    sendBid(target);
  };

  const onConfirmBid = () => {
    const v = Number(bidInput.replace(/[^0-9.]/g, ''));
    if (!v || v <= highest) { setError('الرجاء إدخال مبلغ أعلى من أعلى عرض حالي'); return; }
    sendBid(v);
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold text-white">OSM FUT Dual Battle 🎮</h1>
          <div className="text-sm px-4 py-2 rounded-xl border border-slate-800 bg-[linear-gradient(180deg,#0b0b0b, #070707)] shadow-lg">
            الخصوم: <span className="text-amber-400 font-bold mr-2">{player1}</span> vs <span className="text-emerald-400 font-bold ml-2">{player2}</span>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="bg-[#050505] border border-[#111111] rounded-2xl p-5 shadow-[0_10px_30px_#00000080]">
            <h2 className="text-lg font-bold mb-4 text-amber-400">إحصائيات الفريق</h2>
            <div className="space-y-3 text-slate-300">
              <div className="flex justify-between bg-transparent p-3 rounded-xl border border-[#111111]">
                <span>متقييم الفريق (OVR):</span>
                <span className="font-bold text-emerald-400">{gameState?.teams?.player1?.total_power ?? '—'}</span>
              </div>
              <div className="flex justify-between bg-transparent p-3 rounded-xl border border-[#111111]">
                <span>الميزانية المتبقي</span>
                <span className="font-bold text-amber-400">{gameState?.bot_info?.remaining_budget ? formatMoney(gameState.bot_info.remaining_budget) : '—'}</span>
              </div>

              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-1">الاتصال:</div>
                <div className="text-sm font-medium">{isConnected ? <span className="text-emerald-400">متصل</span> : <span className="text-rose-500">غير متصل</span>}</div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-2 bg-[#040404] border border-[#111111] rounded-2xl p-6 shadow-[0_20px_50px_#000000b0] flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <ImageWithTripleFallback player={gameState?.current_card || {}} className="w-28 h-36" />
                <div>
                  <div className="inline-block px-4 py-1 bg-amber-500/10 text-amber-400 rounded-full text-sm font-semibold mb-2">جولة المزاد الحالية</div>
                  <h3 className="text-3xl font-extrabold mb-1">{gameState?.current_card?.name ?? 'بطاقة غير محددة'}</h3>
                  <div className="text-slate-400 text-sm">الموقع: {gameState?.current_card?.display_position ?? '—'}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">الدور الحالي</div>
                <div className="text-lg font-bold text-white">{currentTurn}</div>
                <div className="mt-3 text-xs text-slate-400">العداد:</div>
                <div className="text-2xl font-extrabold text-amber-400">{secondsLeft}s</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-3">
                <div className="text-sm text-slate-400">أعلى عرض حالي</div>
                <div className="text-4xl font-extrabold text-emerald-400">{formatMoney(highest)}</div>

                <div className="mt-4 flex items-center gap-3">
                  <input aria-label="amount" inputMode="numeric" value={bidInput} onChange={(e)=>setBidInput(e.target.value)} placeholder={String(highest+1)} className="w-40 bg-[#060606] border border-[#222222] rounded-xl px-4 py-2 text-white placeholder:text-slate-500" />
                  <button onClick={onConfirmBid} className={`px-4 py-2 rounded-xl font-bold ${isMyTurn? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-800 cursor-not-allowed'} text-white`}>تأكيد العرض</button>

                  <button onClick={doSkip} className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold">سكب</button>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <button onClick={()=>quickBid(10)} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600">+10M</button>
                  <button onClick={()=>quickBid(20)} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600">+20M</button>
                  <button onClick={()=>quickBid(50)} className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600">+50M</button>
                </div>

                {error && <div className="mt-3 text-rose-400">{error}</div>}
              </div>

              <div className="bg-[#070707] border border-[#111111] rounded-2xl p-4">
                <div className="text-sm text-slate-400 mb-2">سجل المزاد (آخر الأحداث)</div>
                <div className="max-h-40 overflow-auto text-slate-300 text-sm">
                  {Array.isArray(gameState?.auction_log) && gameState.auction_log.slice().reverse().map((ev:any, idx:number)=> (
                    <div key={idx} className="py-1 border-b border-[#0e0e0e]">
                      <div className="text-xs text-slate-500">{new Date((ev.timestamp || Date.now())*1000).toLocaleTimeString()}</div>
                      <div className="text-sm">{ev.action} — {ev.player ?? ev.winner ?? ''} {ev.amount? `: ${formatMoney(ev.amount)}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-slate-500">ملاحظة: يدعم النظام إعادة ضبط العداد إلى 30s عند تقديم مزايدة ناجحة.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
