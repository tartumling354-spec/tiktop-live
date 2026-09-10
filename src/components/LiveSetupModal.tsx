import React, { useState } from 'react';
import { X, User, Users, Sparkles, Tag, ArrowRight, Film, LayoutGrid } from 'lucide-react';
import { LiveMode, PartySeatCount } from '../types';

interface LiveSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchLive: (mode: LiveMode, title: string, category: string, seatCount?: PartySeatCount) => void;
  onSwitchToPostVideo?: () => void;
}

const CATEGORIES = ['General Chat', 'Singing & Music', 'Gaming & PK', 'Dance & Fun', 'Daily Life', 'Talent'];
const SEAT_OPTIONS: PartySeatCount[] = [4, 6, 9, 16, 25];

export const LiveSetupModal: React.FC<LiveSetupModalProps> = ({
  isOpen,
  onClose,
  onLaunchLive,
  onSwitchToPostVideo,
}) => {
  const [selectedMode, setSelectedMode] = useState<LiveMode>('face');
  const [title, setTitle] = useState<string>('My Awesome Live Stream ✨');
  const [category, setCategory] = useState<string>('General Chat');
  const [seatCount, setSeatCount] = useState<PartySeatCount>(6);

  if (!isOpen) return null;

  const handleStart = (modeToUse: LiveMode) => {
    // Explicitly transition directly to Live Room without back/chat redirects
    onLaunchLive(modeToUse, title.trim() || 'My Live Stream', category, seatCount);
  };

  return (
    <div
      id="live-setup-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="live-setup-modal-content"
        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-white animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h3 className="text-base sm:text-lg font-bold">Start Live Broadcast (TikTop)</h3>
          </div>
          <button
            type="button"
            id="btn-close-setup-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Mode Selection Cards: Face Live vs Party Live */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Face Live Card */}
          <div
            id="card-select-face-live"
            onClick={() => setSelectedMode('face')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition-all relative ${
              selectedMode === 'face'
                ? 'bg-gradient-to-b from-rose-500/20 to-rose-600/10 border-rose-500 shadow-lg shadow-rose-500/20 ring-1 ring-rose-400'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white mb-2 shadow-md">
              <User size={24} />
            </div>
            <h4 className="text-sm font-bold">Face Live</h4>
            <span className="text-[11px] text-rose-300 font-medium">फेस लाइभ</span>
            <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
              Solo portrait camera with beauty filters & fan chat
            </p>
            {/* Face Live Reward Tag */}
            <div className="mt-2 py-1 px-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[10px] font-bold text-amber-300 flex flex-col items-center">
              <span>🎁 1h = 10k | 2h = +10k Pts</span>
              <span className="text-[9px] text-rose-200 font-normal">२ घण्टा सम्म मात्र रिवार्ड</span>
            </div>
            {selectedMode === 'face' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white/40" />
            )}
          </div>

          {/* Party Live Card */}
          <div
            id="card-select-party-live"
            onClick={() => setSelectedMode('party')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition-all relative ${
              selectedMode === 'party'
                ? 'bg-gradient-to-b from-indigo-500/20 to-purple-600/10 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-2 shadow-md">
              <Users size={24} />
            </div>
            <h4 className="text-sm font-bold">Party Live</h4>
            <span className="text-[11px] text-indigo-300 font-medium">पार्टी लाइभ</span>
            <p className="text-[10px] text-neutral-400 mt-1 leading-tight">
              4/6/9/16/25 Seater video & audio stage with PK battles
            </p>
            {/* Party Live Reward Tag */}
            <div className="mt-2 py-1 px-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-bold text-amber-300 flex flex-col items-center">
              <span>🎁 1h = 2,000 Pts मात्र</span>
              <span className="text-[9px] text-indigo-200 font-normal">१ घण्टा मात्र रिवार्ड सीमा</span>
            </div>
            {selectedMode === 'party' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white/40" />
            )}
          </div>
        </div>

        {/* Party Seater Selector (shown when Party Live is active) */}
        {selectedMode === 'party' && (
          <div className="mb-3.5 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                <LayoutGrid size={13} className="text-indigo-400" />
                <span>Party Stage Capacity (सिट संख्या)</span>
              </label>
              <span className="text-[11px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">
                {seatCount} Seats
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {SEAT_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  id={`setup-seat-btn-${count}`}
                  onClick={() => setSeatCount(count)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                    seatCount === count
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400'
                      : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <span>{count}</span>
                  <span className="text-[9px] font-normal opacity-80">Seats</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-1.5 mb-3.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            <span>Broadcast Title</span>
          </label>
          <input
            type="text"
            id="input-broadcast-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your stream about?"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5 mb-5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Tag size={13} className="text-sky-400" />
            <span>Category</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                id={`cat-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Direct Start Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            id="btn-start-chosen-live"
            onClick={() => handleStart(selectedMode)}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 ${
              selectedMode === 'face'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/25'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/25'
            }`}
          >
            <span>Start {selectedMode === 'face' ? 'Face Live' : 'Party Live'} Now</span>
            <ArrowRight size={16} />
          </button>

          {/* Direct 1-Click Alternate Launch Buttons (Guaranteed instant trigger) */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              id="btn-direct-face-live"
              onClick={() => handleStart('face')}
              className="py-2 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <User size={13} />
              <span>Direct Face Live</span>
            </button>

            <button
              type="button"
              id="btn-direct-party-live"
              onClick={() => handleStart('party')}
              className="py-2 px-3 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Users size={13} />
              <span>Direct Party Live</span>
            </button>
          </div>

          {onSwitchToPostVideo && (
            <button
              type="button"
              id="btn-switch-to-post-video"
              onClick={() => {
                onClose();
                onSwitchToPostVideo();
              }}
              className="w-full mt-1 py-2 px-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Film size={14} />
              <span>Or Post a Video (भिडियो पोस्ट गर्नुहोस्)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
