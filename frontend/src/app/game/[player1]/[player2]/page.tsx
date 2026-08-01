'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function GamePage() {
  const params = useParams();
  const player1 = params?.player1 as string || '';
  const player2 = params?.player2 as string || '';

  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // جلب حالة اللعبة أو تهيئة الجلسة عند تحميل الصفحة
    if (player1 && player2) {
      setLoading(false);
    }
  }, [player1, player2]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse">جاري تحميل ساحة المعركة... ⚽</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-500 flex items-center justify-center">
        <div>خطأ: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
            OSM FUT Dual Battle 🎮
          </h1>
          <div className="text-sm bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            الخصوم: <span className="text-amber-400 font-bold">{player1}</span> vs <span className="text-emerald-400 font-bold">{player2}</span>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* لوحة التحكم الجانبية */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-amber-400">إحصائيات الفريق</h2>
            <div className="space-y-3 text-slate-300">
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span>متقييم الفريق (OVR):</span>
                <span className="font-bold text-emerald-400">85</span>
              </div>
              <div className="flex justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span>الميزانية المتبقية:</span>
                <span className="font-bold text-amber-400">150M</span>
              </div>
            </div>
          </div>

          {/* منطقة المزاد الرئيسية */}
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block px-4 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-sm font-semibold mb-4">
                جولة المزاد الحالية
              </div>
              <h3 className="text-3xl font-black mb-2 text-white">في انتظار انطلاق البطاقة...</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                استعد لتقديم عروضك السريعة والمنافسة على أساطير اللعبة بأفضل الأسعار التكتيكية.
              </p>
              
              {/* أزرار المزايدة السريعة */}
              <div className="flex flex-wrap justify-center gap-3">
                <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-900/30">
                  +10M
                </button>
                <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-900/30">
                  +20M
                </button>
                <button className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-900/30">
                  +50M
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
