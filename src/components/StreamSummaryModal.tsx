import React from 'react';
import { Trophy, Users, Heart, Gem, Sparkles, CheckCircle2 } from 'lucide-react';

interface StreamSummaryModalProps {
  isOpen: boolean;
  durationSeconds: number;
  viewerCount: number;
  likesCount: number;
  diamondsEarned: number;
  liveRewardPoints?: number;
  onClose: () => void;
}

export const StreamSummaryModal: React.FC<StreamSummaryModalProps> = ({
  isOpen,
  durationSeconds,
  viewerCount,
  likesCount,
  diamondsEarned,
  liveRewardPoints = 0,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="stream-summary-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        id="stream-summary-card"
        className="w-full max-w-sm bg-neutral-900 border border-white/15 rounded-3xl p-6 text-white text-center shadow-2xl animate-scale-in"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-rose-500/30">
          <Trophy size={32} className="text-white" />
        </div>

        <h3 className="text-xl font-bold">Live Stream Ended</h3>
        <p className="text-xs text-neutral-400 mt-1">
          Awesome broadcast! Here is your performance overview.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <Sparkles size={18} className="text-indigo-400 mb-1" />
            <span className="text-lg font-bold">{formatDuration(durationSeconds)}</span>
            <span className="text-[11px] text-neutral-400">Duration</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <Users size={18} className="text-sky-400 mb-1" />
            <span className="text-lg font-bold">{viewerCount.toLocaleString()}</span>
            <span className="text-[11px] text-neutral-400">Peak Viewers</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <Heart size={18} className="text-rose-400 mb-1" />
            <span className="text-lg font-bold">{likesCount.toLocaleString()}</span>
            <span className="text-[11px] text-neutral-400">Total Likes</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <Gem size={18} className="text-amber-400 mb-1" />
            <span className="text-lg font-bold text-amber-300">+{diamondsEarned}</span>
            <span className="text-[11px] text-neutral-400">Gift Diamonds</span>
          </div>
        </div>

        {/* Live Duration Reward Points Callout */}
        {liveRewardPoints > 0 && (
          <div className="mb-5 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-500/40 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">
                  लाइभ समय रिवार्ड (Duration Reward)
                </span>
                <span className="text-[10px] text-neutral-300">
                  माइलस्टोन पूरा गरेर प्राप्त भएको
                </span>
              </div>
            </div>
            <span className="text-base font-black text-amber-300 shrink-0">
              +{liveRewardPoints.toLocaleString()} Pts
            </span>
          </div>
        )}

        <button
          type="button"
          id="btn-finish-summary"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 font-semibold text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} />
          <span>Back to TikTop</span>
        </button>
      </div>
    </div>
  );
};
