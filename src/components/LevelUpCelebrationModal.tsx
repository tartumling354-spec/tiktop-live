import React, { useEffect } from 'react';
import { Crown, Sparkles, Award, Star, X } from 'lucide-react';
import { LevelInfo } from '../utils/levelSystem';

interface LevelUpCelebrationModalProps {
  isOpen: boolean;
  type: 'wealth' | 'live';
  levelInfo: LevelInfo;
  onClose: () => void;
}

export const LevelUpCelebrationModal: React.FC<LevelUpCelebrationModalProps> = ({
  isOpen,
  type,
  levelInfo,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Play synthesized Level Up fanfare
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.6);
        });
        setTimeout(() => {
          ctx.close().catch(() => {});
        }, 1200);
      }
    } catch {
      // Audio autoplay policy
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isWealth = type === 'wealth';

  return (
    <div
      id="level-up-celebration-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-white"
      onClick={onClose}
    >
      <div
        id="level-up-card"
        className="w-full max-w-sm bg-neutral-900 border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-2xl animate-scale-in relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className={`absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-40 ${
          isWealth ? 'bg-amber-500' : 'bg-emerald-500'
        }`} />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-rose-500 rounded-full blur-3xl opacity-40" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10"
        >
          <X size={18} />
        </button>

        {/* Header Icon Badge */}
        <div className="relative inline-flex items-center justify-center mb-3">
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 blur-xl opacity-60 animate-pulse" />
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${levelInfo.badgeGradient} border-2 border-white/40 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/30 transform -rotate-3 hover:rotate-0 transition-transform`}>
            {levelInfo.icon}
          </div>
          <span className="absolute -top-2 -right-2 text-xl animate-bounce">✨</span>
        </div>

        {/* Subtitle & Title */}
        <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
          <Sparkles size={14} />
          <span>लेभल वृद्धि (LEVEL UP)!</span>
          <Sparkles size={14} />
        </div>

        <h3 className="text-xl font-black text-white mb-2">
          {isWealth ? '🎉 Wealth Level Up!' : '🌟 Live Level Up!'}
        </h3>

        {/* Level badge pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-3">
          <span className="text-base font-black text-amber-300">
            {isWealth ? `👑 Wealth Lv.${levelInfo.level}` : `🎙️ Live Lv.${levelInfo.level}`}
          </span>
          <span className="text-xs text-neutral-300">
            ({levelInfo.nepaliTitle})
          </span>
        </div>

        <p className="text-xs text-neutral-300 mb-5 leading-relaxed">
          {isWealth ? (
            <>
              बधाई छ! तपाईंले <strong>{levelInfo.minVal.toLocaleString()} Coins</strong> भन्दा बढीको उपहार प्रदान गरेर <strong>Lv.{levelInfo.level} ({levelInfo.nepaliTitle})</strong> को नयाँ भीआईपी वेल्थ उपाधि हासिल गर्नुभएको छ!
            </>
          ) : (
            <>
              बधाई छ! तपाईंले दर्शकहरूबाट <strong>{levelInfo.minVal.toLocaleString()} Points</strong> भन्दा बढीको उपहार प्राप्त गरेर <strong>Lv.{levelInfo.level} ({levelInfo.nepaliTitle})</strong> को नयाँ लाइभ स्तर हासिल गर्नुभएको छ!
            </>
          )}
        </p>

        {/* Action button */}
        <button
          type="button"
          id="btn-claim-level-up"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:brightness-110 text-white font-black text-sm transition-all active:scale-95 shadow-lg border border-white/30"
        >
          शानदार! (Awesome!)
        </button>
      </div>
    </div>
  );
};
