import React from 'react';
import { Compass, Flame, Trophy, Mic2, Gamepad2, Sparkles, Search } from 'lucide-react';
import { EXPLORE_STREAMERS } from '../data/mockData';
import { LiveStreamer } from '../types';

interface ExploreViewProps {
  onWatchStream: (streamer: LiveStreamer) => void;
  onOpenSearch?: () => void;
}

const LEADERBOARD = [
  { rank: 1, name: 'Pooja Vibes', points: '142,500 Pts', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', badge: '👑' },
  { rank: 2, name: 'Aarav Live', points: '98,200 Pts', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', badge: '🥈' },
  { rank: 3, name: 'Ktm Beats', points: '76,900 Pts', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', badge: '🥉' },
];

export const ExploreView: React.FC<ExploreViewProps> = ({ onWatchStream, onOpenSearch }) => {
  return (
    <div id="explore-screen" className="flex-1 overflow-y-auto pb-24 max-w-2xl mx-auto w-full px-4 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Compass size={20} className="text-rose-500" />
          <h2 className="text-lg font-bold text-white">Explore Trending Streams</h2>
        </div>
      </div>

      {/* ID Search Trigger Bar */}
      <button
        type="button"
        id="btn-explore-search-trigger"
        onClick={onOpenSearch}
        className="w-full mb-4 py-2.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 border border-white/15 rounded-2xl flex items-center justify-between text-neutral-400 hover:text-white transition-all shadow-md group cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Search size={16} className="text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs sm:text-sm font-medium">User ID (उदा. USR-84920), नाम वा ह्यान्डल खोज्नुहोस्...</span>
        </div>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-neutral-300 font-mono">
          ID Search
        </span>
      </button>

      {/* Top Streamers Leaderboard */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 mb-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Trophy size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              लाइभ पोइन्ट र्याङ्किङ (Live Points Rankings)
            </h3>
          </div>
          <span className="text-[10px] text-neutral-400">Weekly Top</span>
        </div>

        <div className="space-y-2">
          {LEADERBOARD.map((item) => (
            <div
              key={item.rank}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-neutral-400 w-4">{item.badge}</span>
                <img
                  src={item.avatar}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-white">{item.name}</span>
              </div>
              <span className="text-xs font-bold text-amber-400">{item.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Topics */}
      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-1">
          <Sparkles size={13} className="text-rose-400" />
          <span>Hot Categories</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-rose-950 to-neutral-900 border border-rose-500/20 rounded-xl p-3 flex flex-col items-center text-center">
            <Mic2 size={20} className="text-rose-400 mb-1" />
            <span className="text-xs font-bold text-white">Karaoke</span>
            <span className="text-[10px] text-neutral-400">1.2k Live</span>
          </div>
          <div className="bg-gradient-to-br from-indigo-950 to-neutral-900 border border-indigo-500/20 rounded-xl p-3 flex flex-col items-center text-center">
            <Gamepad2 size={20} className="text-indigo-400 mb-1" />
            <span className="text-xs font-bold text-white">PK Battles</span>
            <span className="text-[10px] text-neutral-400">840 Live</span>
          </div>
          <div className="bg-gradient-to-br from-amber-950 to-neutral-900 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center text-center">
            <Flame size={20} className="text-amber-400 mb-1" />
            <span className="text-xs font-bold text-white">Party Chat</span>
            <span className="text-[10px] text-neutral-400">2.4k Live</span>
          </div>
        </div>
      </div>

      {/* Recommended Streams */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
        Recommended For You
      </h3>
      <div className="space-y-3">
        {EXPLORE_STREAMERS.map((s) => (
          <div
            key={s.id}
            onClick={() => onWatchStream(s)}
            className="flex gap-3 p-2.5 rounded-2xl bg-neutral-900/70 border border-white/5 hover:border-white/20 cursor-pointer transition-all active:scale-98"
          >
            <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0">
              <img
                src={s.thumbnail}
                alt={s.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] font-bold px-1.5 py-0.5 rounded text-white">
                {s.mode === 'party' ? 'Party' : 'Face'}
              </span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-xs font-bold text-white truncate">{s.title}</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">{s.name}</span>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-400">
                <span>{s.category}</span>
                <span>•</span>
                <span className="text-rose-400 font-semibold">{s.viewerCount} watching</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
