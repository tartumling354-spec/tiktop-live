import React from 'react';
import { X, Clock, Users, Award, Heart, LogOut, ArrowLeft, Minimize2, Play } from 'lucide-react';

interface LeaveLiveModalProps {
  isOpen: boolean;
  isHost?: boolean;
  streamDuration: number;
  viewersCount: number;
  diamondsEarned: number;
  likesCount: number;
  onConfirmEnd: () => void;
  onMinimize?: () => void;
  onCancel: () => void;
}

export const LeaveLiveModal: React.FC<LeaveLiveModalProps> = ({
  isOpen,
  isHost = true,
  streamDuration,
  viewersCount,
  diamondsEarned,
  likesCount,
  onConfirmEnd,
  onMinimize,
  onCancel,
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remSecs = secs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${remSecs}s`;
    }
    return `${mins}m ${remSecs}s`;
  };

  return (
    <div
      id="leave-live-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        id="leave-live-card"
        className="w-full max-w-sm bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl animate-scale-in text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <LogOut size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isHost ? 'लाइभ प्रसारण छोड्ने? (End Live)' : 'लाइभ कोठा छोड्ने? (Leave Room)'}
              </h3>
              <span className="text-[11px] text-neutral-400">
                {isHost ? 'तपाईंको लाइभ प्रसारण समाप्त हुनेछ' : 'तपाईं अर्को लाइभ वा फिडमा जान सक्नुहुन्छ'}
              </span>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-leave-modal"
            onClick={onCancel}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Live Stats Snapshot */}
        <div className="my-4 bg-white/[0.04] border border-white/10 rounded-2xl p-3.5">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2.5">
            प्रसारण विवरण (Current Stream Stats)
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Clock size={14} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">समय (Duration)</span>
                <span className="text-xs font-black text-white">{formatTime(streamDuration)}</span>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users size={14} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">दर्शक (Viewers)</span>
                <span className="text-xs font-black text-white">{viewersCount > 0 ? viewersCount.toLocaleString() : '०'}</span>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Award size={14} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">उपहार अंक (Points)</span>
                <span className="text-xs font-black text-amber-300">+{diamondsEarned.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Heart size={14} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">लाइक्स (Likes)</span>
                <span className="text-xs font-black text-rose-400">+{likesCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {isHost && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-[11px] text-indigo-200 flex items-start gap-2 text-left">
              <span className="text-sm shrink-0">⏱️</span>
              <span className="leading-tight">
                तपाईंको आजको लाइभ समय सुरक्षित छ। फेरि लाइभ आउँदा यहीँबाट समय गणना जारी रहनेछ (नेपाली समय राती १२:०० बजे नयाँ समय सुरु हुन्छ)।
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Confirm End / Leave */}
          <button
            type="button"
            id="btn-confirm-leave-live"
            onClick={onConfirmEnd}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 border border-white/20"
          >
            <LogOut size={16} />
            <span>{isHost ? 'लाइभ समाप्त गर्नुहोस् (End Stream)' : 'लाइभ कोठा छोड्नुहोस् (Leave Room)'}</span>
          </button>

          {/* Optional Minimize / Background mode */}
          {onMinimize && (
            <button
              type="button"
              id="btn-minimize-live"
              onClick={onMinimize}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-neutral-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <Minimize2 size={15} className="text-neutral-300" />
              <span>ब्याकग्राउन्डमा मिनिमाइज गर्नुहोस् (Minimize)</span>
            </button>
          )}

          {/* Cancel / Keep streaming */}
          <button
            type="button"
            id="btn-cancel-leave-live"
            onClick={onCancel}
            className="w-full py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Play size={14} className="text-emerald-400" />
            <span>जारी राख्नुहोस् (Keep Streaming)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
