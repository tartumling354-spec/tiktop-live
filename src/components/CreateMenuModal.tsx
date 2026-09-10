import React from 'react';
import { X, Film, User, Users, ChevronRight, Sparkles } from 'lucide-react';
import { LiveMode } from '../types';

interface CreateMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPostVideo: () => void;
  onSelectLive: (mode: LiveMode) => void;
}

export const CreateMenuModal: React.FC<CreateMenuModalProps> = ({
  isOpen,
  onClose,
  onSelectPostVideo,
  onSelectLive,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="create-menu-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="create-menu-content"
        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl text-white animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h3 className="text-base font-bold text-white">Create on TikTop</h3>
          </div>
          <button
            type="button"
            id="btn-close-create-menu"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Main Action Cards */}
        <div className="space-y-2.5 mb-4">
          {/* 1. POST VIDEO OPTION (New feature requested) */}
          <div
            id="btn-create-post-video"
            onClick={() => {
              onClose();
              onSelectPostVideo();
            }}
            className="group p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-600/15 to-purple-600/20 border border-rose-500/40 hover:border-rose-400 cursor-pointer transition-all active:scale-98 flex items-center justify-between shadow-lg shadow-rose-500/10"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Film size={24} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">Post Video</h4>
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-500/25 px-1.5 py-0.2 rounded">
                    नयाँ (New)
                  </span>
                </div>
                <span className="text-xs text-rose-300 font-medium block">भिडियो पोस्ट गर्नुहोस्</span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Upload or record video with trending sounds & tags
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-rose-400 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* 2. FACE LIVE */}
          <div
            id="btn-create-face-live"
            onClick={() => {
              onClose();
              onSelectLive('face');
            }}
            className="group p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/40 hover:bg-rose-500/5 cursor-pointer transition-all active:scale-98 flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <User size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Face Live</h4>
                <span className="text-xs text-rose-300 font-medium block">फेस लाइभ</span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Solo portrait camera broadcast with beauty glow & fan chat
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* 3. PARTY LIVE */}
          <div
            id="btn-create-party-live"
            onClick={() => {
              onClose();
              onSelectLive('party');
            }}
            className="group p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 cursor-pointer transition-all active:scale-98 flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Users size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Party Live</h4>
                <span className="text-xs text-indigo-300 font-medium block">पार्टी लाइभ</span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  8-Seat audio/video stage, PK battles & group fun
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-neutral-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center py-1">
          <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>High-Definition local broadcast with zero external latency</span>
          </p>
        </div>
      </div>
    </div>
  );
};
