import React, { useEffect } from 'react';
import { Trophy, Gem, Sparkles, CheckCircle2, Clock, Zap } from 'lucide-react';
import { LiveMode } from '../types';

interface LiveRewardCelebrationModalProps {
  isOpen: boolean;
  points: number;
  title: string;
  titleNep: string;
  description: string;
  isCapReached: boolean;
  mode: LiveMode;
  onClose: () => void;
}

export const LiveRewardCelebrationModal: React.FC<LiveRewardCelebrationModalProps> = ({
  isOpen,
  points,
  title,
  titleNep,
  description,
  isCapReached,
  mode,
  onClose,
}) => {
  // Auto-close after 8 seconds if user doesn't tap
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="live-reward-celebration-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="live-reward-celebration-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-gradient-to-b from-neutral-900 via-neutral-900 to-black border-2 border-amber-500/50 rounded-3xl p-6 text-center text-white shadow-2xl shadow-amber-500/20 relative overflow-hidden animate-scale-in"
      >
        {/* Glowing aura effect */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Icons */}
        <div className="relative mb-4 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 p-1 shadow-xl shadow-rose-500/40 animate-bounce">
            <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center">
              <Trophy size={40} className="text-amber-400 drop-shadow-md" />
            </div>
          </div>
          <Sparkles className="absolute -top-1 -right-2 text-yellow-300 animate-spin" size={24} />
          <Gem className="absolute -bottom-1 -left-2 text-amber-400 animate-pulse" size={22} />
        </div>

        {/* Mode Tag */}
        <div className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-[11px] font-bold text-neutral-200 mb-2 border border-white/10">
          <Zap size={12} className="text-amber-400" />
          <span>{mode === 'face' ? 'Face Live Reward' : 'Party Live Reward'}</span>
        </div>

        {/* Nepali Milestone Header */}
        <h3 className="text-lg font-black text-amber-300 tracking-tight leading-snug">
          {titleNep}
        </h3>
        <p className="text-xs text-neutral-300 font-semibold mt-0.5">{title}</p>

        {/* Big Points Award Card */}
        <div className="my-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-500/40 flex items-center justify-center gap-2.5 shadow-inner">
          <Gem size={28} className="text-amber-400 animate-bounce" />
          <div className="flex flex-col items-start">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
              +{points.toLocaleString()} Points
            </span>
            <span className="text-[10px] text-amber-200/80 uppercase font-bold tracking-wider">
              तपाईंको खातामा थपियो (Points Credited)
            </span>
          </div>
        </div>

        {/* Explanation text */}
        <p className="text-xs text-neutral-300 leading-relaxed mb-4 px-2">
          {description}
        </p>

        {/* Cap notification if applicable */}
        {isCapReached ? (
          <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-center gap-2 text-[11px] text-neutral-300">
            <Clock size={14} className="text-rose-400 shrink-0" />
            <span>
              {mode === 'face'
                ? '२ घण्टा पूरा! Face Live को अधिकतम २०,००० Points रिवार्ड पूरा भयो। लाइभ जति पनि बस्न मिल्छ।'
                : '२ घण्टा पूरा! Party Live को अधिकतम ४,००० Points रिवार्ड पूरा भयो। साथीहरूसँग जति समय पनि लाइभ बस्न मिल्छ।'}
            </span>
          </div>
        ) : (
          <div className="mb-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-center gap-2 text-[11px] text-emerald-300">
            <Clock size={14} className="text-emerald-400 shrink-0" />
            <span>
              थप १ घण्टा लाइभ बसेपछि अर्को {mode === 'face' ? '१०,०००' : '२,०००'} Points प्राप्त हुनेछ!
            </span>
          </div>
        )}

        {/* Claim / Confirm Button */}
        <button
          type="button"
          id="btn-claim-live-reward"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-bold text-sm shadow-lg shadow-rose-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} />
          <span>बुझिलिनुहोस् (Claim & Continue)</span>
        </button>
      </div>
    </div>
  );
};
