import React, { useState } from 'react';
import { Users, Flame, Coins, Radio, Film, Sparkles, Play, Eye } from 'lucide-react';
import { EXPLORE_STREAMERS } from '../data/mockData';
import { LiveMode, LiveStreamer, PostVideo } from '../types';
import { VideoFeedCard } from './VideoFeedCard';

interface HomeFeedProps {
  onStartLive: (mode: LiveMode) => void;
  onOpenSetupModal: () => void;
  onOpenPostVideo: () => void;
  onWatchStream: (streamer: LiveStreamer) => void;
  userCoins?: number;
  userDiamonds?: number;
  videos: PostVideo[];
}

const CATEGORY_TABS = ['All', '🔥 Popular', '🎉 Party Live', '🎵 Music', '🎮 Gaming'];

export const HomeFeed: React.FC<HomeFeedProps> = ({
  onWatchStream,
  userCoins,
  userDiamonds,
  videos,
}) => {
  const coinsBalance = userCoins !== undefined ? userCoins : (userDiamonds ?? 0);
  // Feed view mode: 'all' (combined spotlight + videos) vs 'videos' (short vertical videos) vs 'live' (live streamers)
  const [feedSection, setFeedSection] = useState<'all' | 'videos' | 'live'>('all');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredStreamers = EXPLORE_STREAMERS.filter((s) => {
    if (activeCategory === 'All' || activeCategory === '🔥 Popular') return true;
    if (activeCategory === '🎉 Party Live') return s.mode === 'party';
    if (activeCategory === '🎵 Music') return s.category === 'Music';
    if (activeCategory === '🎮 Gaming') return s.category === 'Gaming';
    return true;
  });

  // Top featured active live streamer for the spotlight
  const featuredStreamer = EXPLORE_STREAMERS[0];

  return (
    <div id="home-feed-screen" className="flex-1 overflow-y-auto pb-24 px-4 pt-3 max-w-2xl mx-auto w-full">
      {/* ================= 1. LIVE NOW STORIES RAIL ================= */}
      {EXPLORE_STREAMERS.length > 0 && (
        <div id="live-now-stories-rail" className="mb-4">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>अहिले प्रत्यक्ष लाइभ</span>
                <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/15 px-1.5 py-0.2 rounded-full border border-rose-500/30">
                  LIVE NOW
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] text-amber-300 font-bold">
              <Coins size={11} className="text-amber-400" />
              <span>{coinsBalance.toLocaleString()} Coins</span>
            </div>
          </div>

          {/* Horizontal scrollable live streamers list */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {EXPLORE_STREAMERS.map((streamer) => (
              <button
                key={streamer.id}
                type="button"
                id={`live-story-item-${streamer.id}`}
                onClick={() => onWatchStream(streamer)}
                className="group flex flex-col items-center shrink-0 w-18 text-center transition-transform hover:scale-105 active:scale-95"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-500 animate-pulse">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-950 bg-neutral-900">
                    <img
                      src={streamer.avatar}
                      alt={streamer.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  {/* Glowing Live badge */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full border border-neutral-950 uppercase tracking-wider shadow">
                    LIVE
                  </span>
                </div>

                <span className="text-[11px] font-medium text-white truncate w-16 mt-2 block">
                  {streamer.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-neutral-400 font-medium flex items-center justify-center gap-0.5">
                  <Eye size={9} className="text-emerald-400" />
                  {streamer.viewerCount > 1000
                    ? `${(streamer.viewerCount / 1000).toFixed(1)}k`
                    : streamer.viewerCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= 2. MAIN FEED NAVIGATION TABS ================= */}
      <div className="flex items-center p-1 bg-neutral-900 border border-white/10 rounded-2xl mb-4 shadow-sm">
        <button
          type="button"
          id="tab-feed-all"
          onClick={() => setFeedSection('all')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            feedSection === 'all'
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Flame size={14} />
          <span>सबै (All)</span>
        </button>

        <button
          type="button"
          id="tab-feed-videos"
          onClick={() => setFeedSection('videos')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            feedSection === 'videos'
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Film size={14} />
          <span>📹 भिडियोहरू ({videos.length})</span>
        </button>

        <button
          type="button"
          id="tab-feed-live"
          onClick={() => setFeedSection('live')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            feedSection === 'live'
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Radio size={14} className="animate-pulse" />
          <span>🔴 लाइभ रुम ({filteredStreamers.length})</span>
        </button>
      </div>

      {/* ================= SECTION A: ALL (COMBINED VIEW) ================= */}
      {feedSection === 'all' && (
        <div id="combined-feed-container" className="space-y-4">
          {/* Spotlight: Featured Live Streamer Card */}
          {featuredStreamer && (
            <div
              id="featured-live-spotlight"
              onClick={() => onWatchStream(featuredStreamer)}
              className="group relative rounded-3xl overflow-hidden bg-neutral-900 border border-white/15 shadow-xl cursor-pointer transition-transform hover:scale-[1.01] active:scale-98"
            >
              <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
                <img
                  src={featuredStreamer.thumbnail}
                  alt={featuredStreamer.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 text-white shadow-lg ${
                      featuredStreamer.mode === 'party' ? 'bg-indigo-600' : 'bg-rose-600'
                    }`}
                  >
                    <Radio size={12} className="animate-pulse" />
                    {featuredStreamer.mode === 'party' ? '🎉 Party Live Room' : '🔴 Face Live Broadcast'}
                  </span>

                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-emerald-400 border border-white/10">
                    <Users size={12} />
                    <span>{featuredStreamer.viewerCount.toLocaleString()} viewers</span>
                  </div>
                </div>

                {/* Bottom Details Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={featuredStreamer.avatar}
                        alt={featuredStreamer.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border-2 border-rose-500 object-cover"
                      />
                      <div>
                        <h4 className="text-sm font-bold leading-tight">{featuredStreamer.name}</h4>
                        <span className="text-[11px] text-neutral-300">{featuredStreamer.handle}</span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-white/95 line-clamp-1 max-w-md">
                      {featuredStreamer.title}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>हेर्नुहोस् (Watch)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Videos Header in 'All' view */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles size={15} className="text-rose-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                नयाँ भिडियोहरू (New Videos)
              </h3>
            </div>
            <span className="text-xs text-neutral-400">{videos.length} videos</span>
          </div>

          {/* Videos Feed */}
          {videos.length === 0 ? (
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 text-center">
              <Film size={32} className="text-neutral-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-white mb-0.5">कुनै नयाँ भिडियो छैन</p>
              <p className="text-xs text-neutral-400">तल्लो (+) बटन थिचेर नयाँ भिडियो पोस्ट गर्नुहोस्!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <VideoFeedCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION B: ONLY VIDEO FEED ================= */}
      {feedSection === 'videos' && (
        <div id="video-feed-container">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles size={15} className="text-rose-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                नयाँ भिडियो फिड (Latest Videos)
              </h3>
            </div>
            <span className="text-xs text-neutral-400">{videos.length} videos</span>
          </div>

          {videos.length === 0 ? (
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 text-center my-4">
              <Film size={36} className="text-neutral-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-white mb-1">अहिलेसम्म कुनै भिडियो पोस्ट गरिएको छैन</p>
              <p className="text-xs text-neutral-400 mb-2">
                तलको (+) आइकनमा थिचेर भिडियो पोस्ट गर्नुहोस् वा लाइभ बस्नुहोस्!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <VideoFeedCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION C: ONLY LIVE STREAMERS GRID ================= */}
      {feedSection === 'live' && (
        <div id="live-streamers-section">
          {/* Categories Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-3">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                id={`tab-${tab.toLowerCase().replace(/[^a-z]/g, '')}`}
                onClick={() => setActiveCategory(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === tab
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <Flame size={16} className="text-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                सक्रिय लाइभ रुमहरू (Active Live Rooms)
              </h3>
            </div>
            <span className="text-xs text-neutral-400">
              {filteredStreamers.length} active rooms
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredStreamers.map((streamer) => (
              <div
                key={streamer.id}
                id={`stream-card-${streamer.id}`}
                onClick={() => onWatchStream(streamer)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-lg cursor-pointer transition-transform hover:scale-[1.01] active:scale-98"
              >
                {/* Thumbnail */}
                <img
                  src={streamer.thumbnail}
                  alt={streamer.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-white shadow ${
                      streamer.mode === 'party' ? 'bg-indigo-600' : 'bg-rose-600'
                    }`}
                  >
                    <Radio size={10} className="animate-pulse" />
                    {streamer.mode === 'party' ? 'Party Live' : 'Face Live'}
                  </span>

                  <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-medium text-white/90">
                    <Users size={11} className="text-emerald-400" />
                    <span>{streamer.viewerCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Bottom Stream Details */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={streamer.avatar}
                      alt={streamer.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border border-rose-500 object-cover"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold truncate block">{streamer.name}</span>
                      <span className="text-[10px] text-neutral-300 block">{streamer.handle}</span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold line-clamp-1 mb-1.5 text-white/95">
                    {streamer.title}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {streamer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] bg-white/15 backdrop-blur-sm px-1.5 py-0.5 rounded text-white/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
