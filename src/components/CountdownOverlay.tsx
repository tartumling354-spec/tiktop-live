import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Radio, Zap, ArrowRight } from 'lucide-react';
import { LiveMode } from '../types';

interface CountdownOverlayProps {
  mode: LiveMode;
  roomTitle: string;
  roomCategory: string;
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  mode,
  roomTitle,
  roomCategory,
  onComplete,
}) => {
  const [count, setCount] = useState<number | 'LIVE'>(3);
  const [scaleKey, setScaleKey] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound synthesis helper (Web Audio API)
  const playBeep = (freq: number, duration: number = 0.15) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio policy issues
    }
  };

  useEffect(() => {
    // Initial sound for 3
    playBeep(440, 0.2);

    const timer3 = setTimeout(() => {
      setCount(2);
      setScaleKey((k) => k + 1);
      playBeep(520, 0.2);
    }, 1000);

    const timer2 = setTimeout(() => {
      setCount(1);
      setScaleKey((k) => k + 1);
      playBeep(660, 0.2);
    }, 2000);

    const timer1 = setTimeout(() => {
      setCount('LIVE');
      setScaleKey((k) => k + 1);
      playBeep(880, 0.4);
    }, 3000);

    const timerDone = setTimeout(() => {
      onComplete();
    }, 3900);

    return () => {
      clearTimeout(timer3);
      clearTimeout(timer2);
      clearTimeout(timer1);
      clearTimeout(timerDone);
    };
  }, [onComplete]);

  return (
    <div
      id="live-start-countdown-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-between p-6 select-none animate-fade-in"
    >
      {/* Top Details */}
      <div className="w-full max-w-md pt-4 text-center">
        <div className="inline-flex items-center gap-2 bg-rose-600/30 border border-rose-500/50 px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-300 mb-2 shadow-lg">
          <Radio size={14} className="animate-pulse" />
          <span>Starting {mode === 'face' ? 'Face Live' : 'Party Live'}</span>
        </div>

        <h2 className="text-lg sm:text-xl font-black text-white line-clamp-1 drop-shadow-md">
          {roomTitle}
        </h2>
        <span className="text-xs text-neutral-400 font-medium">
          Category: {roomCategory} • Camera & Audio Ready
        </span>
      </div>

      {/* Center 3-2-1 Animated Numbers */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div
          key={scaleKey}
          className="relative flex items-center justify-center animate-scale-up"
        >
          {/* Animated Glow Ring */}
          <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border-4 border-rose-500/40 animate-ping" />
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-600/30 via-pink-600/30 to-indigo-600/30 border-2 border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-rose-600/50">
            {count === 'LIVE' ? (
              <div className="text-center animate-bounce">
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 tracking-wider">
                  LIVE!
                </span>
                <span className="block text-2xl mt-1">🚀</span>
              </div>
            ) : (
              <span className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-rose-200 to-rose-500 font-mono drop-shadow-lg">
                {count}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Tip Text */}
        <p className="text-sm font-semibold text-neutral-200 mt-6 flex items-center gap-1.5 drop-shadow">
          <Sparkles size={16} className="text-amber-400 animate-spin" />
          <span>
            {count === 3 && 'Get ready to shine! Smile for the camera 😊'}
            {count === 2 && 'Connecting viewers and setting up live chat 💬'}
            {count === 1 && 'Almost there! 1 second to broadcast 🎙️'}
            {count === 'LIVE' && "You're LIVE! Say hello to your audience! 🎉"}
          </span>
        </p>
      </div>

      {/* Bottom Action / Skip Button */}
      <div className="w-full max-w-md pb-6 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-rose-500" />
          <span>High-definition streaming engine</span>
        </div>

        <button
          type="button"
          id="btn-skip-countdown"
          onClick={onComplete}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-all flex items-center gap-1 border border-white/15 active:scale-95"
        >
          <span>Start Now</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
