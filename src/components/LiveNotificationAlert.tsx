import React, { useEffect } from 'react';
import { Radio, X, ExternalLink, Sparkles, Volume2 } from 'lucide-react';
import { AppUser, LiveStreamer } from '../types';

interface LiveNotificationAlertProps {
  user: AppUser;
  onWatch: () => void;
  onDismiss: () => void;
}

// Audio chime using Web Audio API (cross-browser, no external audio assets needed)
function playLiveAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.12); // E6
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // AudioContext autoplay restriction or error, gracefully ignore
  }
}

export const LiveNotificationAlert: React.FC<LiveNotificationAlertProps> = ({
  user,
  onWatch,
  onDismiss,
}) => {
  useEffect(() => {
    playLiveAlertChime();

    // Auto dismiss after 8 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      id="live-friend-notification-banner"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-neutral-900/95 backdrop-blur-xl border border-rose-500/40 rounded-2xl p-3.5 shadow-2xl shadow-rose-950/50 animate-in slide-in-from-top-6 duration-300 select-none"
    >
      <div className="flex items-start gap-3">
        {/* Pulsing Live Avatar */}
        <div className="relative shrink-0 mt-0.5">
          <img
            src={user.avatar}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-full object-cover border-2 border-rose-500 ring-2 ring-rose-500/30"
          />
          <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
            <Radio size={8} />
            <span>LIVE</span>
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <Radio size={11} className="animate-ping" />
              <span>साथी लाइभ अलर्ट (Live Friend Alert)</span>
            </span>
            <span className="text-[9px] text-neutral-400">• भर्खरै</span>
          </div>

          <p className="text-xs font-bold text-white truncate">
            {user.name}{' '}
            <span className="text-[11px] font-normal text-neutral-400">({user.handle})</span>
          </p>

          <p className="text-[11px] text-neutral-300 truncate mt-0.5">
            {user.liveTitle || 'लाइभ स्ट्रिमिङ सुरु भयो! हेर्नुहोस् र कुराकानी गर्नुहोस्'}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              id="btn-alert-watch-now"
              onClick={onWatch}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/40 transition-all active:scale-95 cursor-pointer"
            >
              <Radio size={12} />
              <span>अहिले हेर्नुहोस् (Watch Now)</span>
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              पछि हेर्ने
            </button>
          </div>
        </div>

        {/* Close Cross */}
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Dismiss Alert"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
