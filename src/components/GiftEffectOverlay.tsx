import React, { useEffect, useState } from 'react';
import { Gift } from '../types';
import { Sparkles, Crown, Heart, Gift as GiftIcon, Users } from 'lucide-react';

export interface ActiveGiftAnimation {
  id: string;
  senderName: string;
  senderWealthLevel?: number;
  recipientName?: string;
  isAllParty?: boolean;
  recipientCount?: number;
  gift: Gift;
  luckyMultiplier?: number;
}

interface GiftEffectOverlayProps {
  activeGift: ActiveGiftAnimation | null;
  onFinished: () => void;
}

export const GiftEffectOverlay: React.FC<GiftEffectOverlayProps> = ({ activeGift, onFinished }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number; icon: string }[]>([]);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const cost = activeGift ? (activeGift.gift.coins ?? activeGift.gift.diamonds ?? 0) : 0;
  
  // Categorize reaction scale:
  // Small (< 10k): Low reaction (कम React)
  // Medium (10k - 49.9k): Medium reaction
  // Large / Mega (>= 50k): Attractive & high reaction (आकर्षक र धेरै React)
  const isSmall = cost < 10000;
  const isMedium = cost >= 10000 && cost < 50000;
  const isMega = cost >= 50000;

  useEffect(() => {
    if (!activeGift) {
      setIsClosing(false);
      return;
    }

    setIsClosing(false);

    // Play synthesized celebratory sound via Web Audio API (crisp & non-lingering)
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        if (isSmall) {
          // Gentle soft chime (0.25s)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (isMedium) {
          // Pleasant 2-note chime (0.35s)
          [523.25, 659.25].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            const t = now + idx * 0.1;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.35);
          });
        } else {
          // Mega Gift: Bright celebratory fanfare chord (0.6s)
          [440, 554.37, 659.25, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            const t = now + idx * 0.07;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.6);
          });
        }
        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 1200);
      }
    } catch {
      // Audio might be muted or unavailable
    }

    // Determine particles: lightweight & vibrant
    const particleCount = isSmall ? 6 : isMedium ? 14 : 24;
    const iconsPool = isMega 
      ? [activeGift.gift.icon, '✨', '👑', '🔥', '💎', '🎉', '⭐']
      : isMedium
      ? [activeGift.gift.icon, '✨', '💖', '🌟']
      : [activeGift.gift.icon, '✨'];

    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: isSmall ? Math.random() * 30 + 55 : Math.random() * 70 + 15,
      size: isSmall ? Math.random() * 8 + 14 : isMedium ? Math.random() * 12 + 18 : Math.random() * 16 + 22,
      delay: Math.random() * 0.3,
      icon: iconsPool[Math.floor(Math.random() * iconsPool.length)],
    }));
    setParticles(newParticles);

    // Snappy durations (much faster than previous 4.5s):
    // Small: 1200ms
    // Medium: 1700ms
    // Mega: 2300ms
    const totalDuration = isSmall ? 1200 : isMedium ? 1700 : 2300;
    const fadeOutStart = totalDuration - 300;

    const fadeTimer = setTimeout(() => {
      setIsClosing(true);
    }, fadeOutStart);

    const finishTimer = setTimeout(() => {
      onFinished();
    }, totalDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [activeGift, onFinished, isSmall, isMedium, isMega]);

  if (!activeGift) return null;

  // Format Points / Coins label
  const formattedCoins = cost >= 1000 ? `${(cost / 1000).toFixed(0)}k` : `${cost}`;
  const totalCost = activeGift.isAllParty && activeGift.recipientCount 
    ? cost * activeGift.recipientCount 
    : cost;
  const formattedTotalCost = totalCost >= 1000 ? `${(totalCost / 1000).toFixed(0)}k` : `${totalCost}`;

  return (
    <div
      id="gift-effect-overlay"
      onClick={() => onFinished()} // Tap anywhere to dismiss instantly!
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-auto cursor-pointer transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 1. SMALL GIFT: Minimal floating pill near lower area */}
      {isSmall && (
        <div className="absolute bottom-28 inset-x-4 flex flex-col items-center pointer-events-none animate-slide-up">
          {/* Particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute animate-fade-in text-sm pointer-events-none opacity-80"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animationDelay: `${p.delay}s`,
              }}
            >
              {p.icon}
            </span>
          ))}

          <div className="bg-neutral-900/90 backdrop-blur-md border border-white/20 rounded-full pl-3 pr-4 py-1.5 shadow-2xl flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">{activeGift.gift.icon}</span>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1 text-[11px]">
                <span className="font-bold text-amber-300 truncate max-w-[90px]">{activeGift.senderName}</span>
                <span className="text-neutral-400">➔</span>
                <span className="text-emerald-300 font-semibold truncate max-w-[90px]">
                  {activeGift.recipientName || 'Host'}
                </span>
              </div>
              <span className="text-[10px] text-white/90 font-medium">
                {activeGift.gift.name} <strong className="text-amber-400">+{formattedCoins} Pts</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. MEDIUM GIFT: Centered celebratory badge */}
      {isMedium && (
        <div className="relative flex flex-col items-center justify-center pointer-events-none animate-scale-up">
          {/* Subtle warm ambient glow */}
          <div className="absolute w-64 h-64 rounded-full bg-amber-500/20 blur-2xl animate-pulse pointer-events-none" />

          {/* Particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute animate-bounce pointer-events-none text-base filter drop-shadow"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animationDelay: `${p.delay}s`,
              }}
            >
              {p.icon}
            </span>
          ))}

          {/* Main Gift Container */}
          <div className="bg-neutral-900/95 backdrop-blur-md border border-amber-400/40 rounded-3xl p-4 shadow-2xl flex flex-col items-center text-center max-w-xs mx-4">
            <div className="text-5xl sm:text-6xl animate-bounce filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]">
              {activeGift.gift.icon}
            </div>

            <h3 className="text-base font-extrabold text-white mt-1">
              {activeGift.gift.name}
            </h3>

            {/* Recipient & Points Bar */}
            <div className="mt-2 bg-white/10 rounded-xl px-3 py-1 flex items-center justify-center gap-1.5 text-xs">
              <span className="text-amber-300 font-bold">{activeGift.senderName}</span>
              <span className="text-white/60">➔</span>
              <span className="text-emerald-300 font-bold">{activeGift.recipientName || 'Host'}</span>
            </div>

            <div className="mt-1.5 text-xs font-black text-amber-400">
              +{formattedCoins} Points 💎
            </div>
          </div>
        </div>
      )}

      {/* 3. MEGA GIFT: High energy, attractive, but snappy and non-obstructive */}
      {isMega && (
        <div className="relative flex flex-col items-center justify-center pointer-events-none animate-scale-up w-full max-w-sm px-4">
          {/* Soft ambient radial rays (No solid black overlay!) */}
          <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-amber-500/30 via-rose-500/30 to-purple-500/30 blur-3xl pointer-events-none animate-pulse" />

          {/* Showering Particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute animate-bounce pointer-events-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: '1.2s',
              }}
            >
              {p.icon}
            </span>
          ))}

          {/* VIP Marquee Crown & Header */}
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 p-[1.5px] rounded-2xl shadow-2xl w-full mb-2 animate-bounce-short">
            <div className="bg-neutral-950/90 rounded-2xl px-3 py-1.5 flex items-center justify-between text-center">
              <div className="flex items-center gap-1 text-amber-300 font-black text-xs uppercase tracking-wider">
                <Crown size={14} className="text-yellow-400 animate-pulse" />
                <span>VIP MEGA GIFT</span>
              </div>
              <span className="text-[10px] bg-amber-400 text-neutral-950 font-black px-2 py-0.5 rounded-md">
                +{formattedCoins} PTS
              </span>
            </div>
          </div>

          {/* Center Card */}
          <div className="bg-neutral-950/90 backdrop-blur-md border border-amber-400/50 rounded-3xl p-4 shadow-2xl flex flex-col items-center text-center w-full">
            {/* 3D Giant Gift */}
            <div className="text-7xl sm:text-8xl animate-pulse filter drop-shadow-[0_12px_24px_rgba(245,158,11,0.6)] my-1">
              {activeGift.gift.icon}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 filter drop-shadow">
              {activeGift.gift.name}
            </h2>

            {/* Recipient Information Pill */}
            <div className="mt-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-white/20 text-xs flex items-center justify-center gap-2">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                {activeGift.senderWealthLevel && (
                  <span className="text-[9px] bg-amber-400 text-neutral-950 px-1 rounded-sm font-extrabold">
                    Lv.{activeGift.senderWealthLevel}
                  </span>
                )}
                <span>{activeGift.senderName}</span>
              </span>
              <span className="text-white/60">➔</span>
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                {activeGift.isAllParty ? <Users size={12} className="text-emerald-400" /> : null}
                <span>{activeGift.recipientName || 'Host'}</span>
              </span>
            </div>

            {/* Total Points / Bonus */}
            {activeGift.isAllParty && activeGift.recipientCount ? (
              <div className="mt-1.5 text-[11px] text-amber-300 font-semibold">
                👥 सबैलाई ({activeGift.recipientCount} जनालाई) • कुल {formattedTotalCost} Coins
              </div>
            ) : null}

            {activeGift.luckyMultiplier && activeGift.luckyMultiplier > 1 && (
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black shadow animate-bounce">
                🍀 Lucky Bonus x{activeGift.luckyMultiplier}!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
