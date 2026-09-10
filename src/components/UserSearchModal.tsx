import React, { useState, useMemo } from 'react';
import { Search, X, Radio, MessageSquare, UserCheck, UserPlus, Copy, Check, Sparkles, Users, ArrowRight } from 'lucide-react';
import { AppUser, LiveStreamer } from '../types';
import { ALL_APP_USERS, EXPLORE_STREAMERS } from '../data/mockData';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (user: AppUser) => void;
  onWatchStream: (streamer: LiveStreamer) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onStartChat,
  onWatchStream,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'friends'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [friendsList, setFriendsList] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ALL_APP_USERS.forEach((u) => {
      init[u.userId] = u.isFriend;
    });
    return init;
  });

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(id);
    } catch {
      // Ignore
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFriend = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFriendsList((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return ALL_APP_USERS.filter((user) => {
      const matchesSearch =
        !query ||
        user.userId.toLowerCase().includes(query) ||
        user.handle.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (selectedFilter === 'live') return user.isLive;
      if (selectedFilter === 'friends') return !!friendsList[user.userId];
      return true;
    });
  }, [searchTerm, selectedFilter, friendsList]);

  if (!isOpen) return null;

  return (
    <div
      id="user-search-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="user-search-modal-card"
        className="w-full max-w-lg bg-neutral-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                ID खोज्नुहोस् (User ID Search)
              </h2>
              <p className="text-[11px] text-neutral-400">
                User ID, ह्यान्डल वा नामबाट कुनै पनि व्यक्ति खोज्नुहोस्
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-search-modal"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 bg-neutral-950/40 border-b border-white/10 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              id="input-user-search-query"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="User ID (उदा. USR-84920), @username वा नाम..."
              autoFocus
              className="w-full bg-neutral-900 border border-white/15 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Preset Quick Search Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-neutral-500 text-[10px] shrink-0">सुझावहरू:</span>
            {['USR-84920', 'USR-73910', 'USR-55219', '@aarav_live', '@pooja_vibes'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchTerm(tag)}
                className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white shrink-0 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              सबै प्रयोगकर्ता ({ALL_APP_USERS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('live')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
                selectedFilter === 'live'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Radio size={11} className="text-rose-400" />
              <span>लाइभ छन्</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('friends')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
                selectedFilter === 'friends'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              <Users size={11} />
              <span>साथीहरू</span>
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Search size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold text-neutral-400">कुनै प्रयोगकर्ता फेला परेन</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                कृपया User ID (उदा. USR-84920) वा नाम पुन: जाँच गर्नुहोस्।
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isFriend = !!friendsList[user.userId];
              const streamer = EXPLORE_STREAMERS.find((s) => s.id === user.liveStreamerId);

              return (
                <div
                  key={user.userId}
                  id={`user-search-item-${user.userId}`}
                  className="p-3.5 rounded-2xl bg-neutral-950/70 border border-white/5 hover:border-white/15 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* User info left */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className={`w-12 h-12 rounded-full object-cover border-2 ${
                            user.isLive ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-white/10'
                          }`}
                        />
                        {user.isLive && (
                          <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Radio size={7} />
                            <span>LIVE</span>
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {user.name}
                          </span>
                          {user.verified && (
                            <span className="text-[10px] text-sky-400 bg-sky-500/15 px-1.5 py-0.2 rounded-full font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-neutral-400 block truncate">
                          {user.handle}
                        </span>

                        {/* Distinctive User ID badge with Copy button */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>ID: {user.userId}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(user.userId, e)}
                            className="text-[10px] text-neutral-400 hover:text-white p-0.5"
                            title="Copy User ID"
                          >
                            {copiedId === user.userId ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Friend / Follow button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFriend(user.userId, e)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors ${
                        isFriend
                          ? 'bg-white/10 text-neutral-300 hover:bg-white/15'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      {isFriend ? (
                        <>
                          <UserCheck size={12} className="text-emerald-400" />
                          <span>साथी</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} />
                          <span>फलो / साथी</span>
                        </>
                      )}
                    </button>
                  </div>

                  {user.bio && (
                    <p className="text-[11px] text-neutral-300 leading-snug line-clamp-1">
                      {user.bio}
                    </p>
                  )}

                  {/* Actions row: Direct SMS to Inbox + Watch Live (if live) */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    {/* Action 1: SMS in Inbox */}
                    <button
                      type="button"
                      id={`btn-sms-user-${user.userId}`}
                      onClick={() => {
                        onClose();
                        onStartChat(user);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare size={13} className="text-sky-400" />
                      <span>इन्बक्समा SMS गर्नुहोस् (Message)</span>
                    </button>

                    {/* Action 2: Watch Live (if streaming) */}
                    {user.isLive && streamer && (
                      <button
                        type="button"
                        id={`btn-watch-live-${user.userId}`}
                        onClick={() => {
                          onClose();
                          onWatchStream(streamer);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/30 transition-colors cursor-pointer"
                      >
                        <Radio size={12} className="animate-pulse" />
                        <span>लाइभ हेर्नुहोस्</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
