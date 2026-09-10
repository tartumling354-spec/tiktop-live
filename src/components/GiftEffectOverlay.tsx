import React, { useEffect, useState } from 'react';
import { Gift } from '../types';

interface ActiveGiftAnimation {
  id: string;
  senderName: string;
  gift: Gift;
}

interface GiftEffectOverlayProps {
  activeGift: ActiveGiftAnimation | null;
  onFinished: () => void;
}

export const GiftEffectOverlay: React.FC<GiftEffectOverlayProps> = ({ activeGift, onFinished }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    if (!activeGift) return;

    // Generate confetti / effect particles
    const newParticles = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      size: Math.random() * 20 + 20,
      delay: Math.random() * 0.4,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      onFinished();
    }, 3200);

    return () => clearTimeout(timer);
  }, [activeGift, onFinished]);

  if (!activeGift) return null;

  return (
    <div
      id="gift-fullscreen-effect"
      className="fixed inset-0 pointer-events-none z-50 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 via-amber-950/20 to-transparent animate-pulse" />

      {/* Floating Ambient Emojis */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-2xl animate-bounce pointer-events-none transition-all"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: '1.6s',
          }}
        >
          {activeGift.gift.icon}
        </span>
      ))}

      {/* Centerpiece Gift Display */}
      <div className="relative flex flex-col items-center justify-center transform transition-transform animate-zoom-in">
        {/* Glowing Aura */}
        <div className="absolute w-44 h-44 rounded-full bg-gradient-to-r from-amber-400/50 via-rose-500/50 to-purple-500/50 blur-3xl animate-spin" />

        {/* Big Giant Icon */}
        <div className="text-7xl sm:text-8xl filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] animate-pulse">
          {activeGift.gift.icon}
        </div>

        {/* Sender banner */}
        <div className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-2xl border border-white/30 flex items-center gap-2">
          <span className="font-extrabold text-sm sm:text-base tracking-wide text-amber-100">
            {activeGift.senderName}
          </span>
          <span className="text-xs sm:text-sm font-medium">sent</span>
          <span className="font-black text-sm sm:text-base text-white underline decoration-amber-300">
            {activeGift.gift.name}
          </span>
        </div>
      </div>
    </div>
  );
};
