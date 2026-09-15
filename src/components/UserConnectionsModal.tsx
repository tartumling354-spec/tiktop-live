import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  UserCheck,
  UserPlus,
  Heart,
  Users,
  ShieldCheck,
  Radio,
  Lock,
  Globe,
  Settings,
  Play,
  Film,
  Sparkles,
  ExternalLink,
  Crown
} from 'lucide-react';
import {
  ConnectionUser,
  getFollowingList,
  saveFollowingList,
  getFollowersList,
  saveFollowersList,
  getUserPrivacySettings,
  UserPrivacySettings
} from '../utils/userPrivacyDb';
import { PostVideo } from '../types';

export type ConnectionTabType = 'following' | 'followers' | 'likes';

interface UserConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ConnectionTabType;
  onOpenSettingsPrivacy?: () => void;
  allVideos?: PostVideo[];
  onSelectVideo?: (video: PostVideo) => void;
}

export const UserConnectionsModal: React.FC<UserConnectionsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'following',
  onOpenSettingsPrivacy,
  allVideos = [],
  onSelectVideo,
}) => {
  const [activeTab, setActiveTab] = useState<ConnectionTabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingList, setFollowingList] = useState<ConnectionUser[]>([]);
  const [followersList, setFollowersList] = useState<ConnectionUser[]>([]);
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings>(getUserPrivacySettings());

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFollowingList(getFollowingList());
      setFollowersList(getFollowersList());
      setPrivacySettings(getUserPrivacySettings());
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Toggle Following
  const handleToggleFollow = (userId: string) => {
    const updated = followingList.map((user) => {
      if (user.id === userId) {
        return { ...user, isFollowing: !user.isFollowing };
      }
      return user;
    });
    setFollowingList(updated);
    saveFollowingList(updated);
  };

  // Toggle Follower follow back
  const handleToggleFollowerBack = (userId: string) => {
    const updated = followersList.map((user) => {
      if (user.id === userId) {
        return { ...user, isFollowing: !user.isFollowing };
      }
      return user;
    });
    setFollowersList(updated);
    saveFollowersList(updated);
  };

  // Filtered lists
  const filteredFollowing = followingList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowers = followersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Liked videos (either videos with isLiked or select popular ones)
  const likedVideos = allVideos.filter((v) => v.isLiked || v.likesCount > 4000);

  // Privacy labels
  const getPrivacyLabel = (visibility: string) => {
    if (visibility === 'only_me') return { text: 'म मात्र (गोप्य / Only Me)', icon: Lock, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    if (visibility === 'followers') return { text: 'फलोअरहरूले मात्र (Followers Only)', icon: Users, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { text: 'सबैले हेर्न सक्ने (सार्वजनिक / Public)', icon: Globe, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const currentPrivacy =
    activeTab === 'following'
      ? getPrivacyLabel(privacySettings.followingVisibility)
      : activeTab === 'followers'
      ? getPrivacyLabel(privacySettings.followersVisibility)
      : getPrivacyLabel(privacySettings.likesVisibility);

  const PrivacyIcon = currentPrivacy.icon;

  return (
    <div
      id="user-connections-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="user-connections-modal-card"
        className="w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-neutral-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              {activeTab === 'following' ? <UserCheck size={16} /> : activeTab === 'followers' ? <Users size={16} /> : <Heart size={16} />}
            </div>
            <h2 className="text-base font-bold text-white">
              {activeTab === 'following' ? 'Following (फलोइङ)' : activeTab === 'followers' ? 'Followers (फलोअर्स)' : 'Liked Videos (मन परेका)'}
            </h2>
          </div>

          <button
            type="button"
            id="btn-close-connections-modal"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Tabs: Following (128) | Followers (14.8K) | Likes (86.2K) */}
        <div className="grid grid-cols-3 bg-neutral-950/40 border-b border-white/10 p-1.5 gap-1">
          <button
            type="button"
            id="tab-btn-following"
            onClick={() => {
              setActiveTab('following');
              setSearchQuery('');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
              activeTab === 'following'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm font-black leading-tight text-white">{followingList.length}</span>
            <span className="text-[10px] text-neutral-400">Following</span>
          </button>

          <button
            type="button"
            id="tab-btn-followers"
            onClick={() => {
              setActiveTab('followers');
              setSearchQuery('');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
              activeTab === 'followers'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm font-black leading-tight text-white">14.8K</span>
            <span className="text-[10px] text-neutral-400">Followers</span>
          </button>

          <button
            type="button"
            id="tab-btn-likes"
            onClick={() => {
              setActiveTab('likes');
              setSearchQuery('');
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
              activeTab === 'likes'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm font-black leading-tight text-rose-400">86.2K</span>
            <span className="text-[10px] text-neutral-400">Likes</span>
          </button>
        </div>

        {/* Privacy Status Bar */}
        <div className="px-4 py-2 bg-neutral-950/60 border-b border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-neutral-400 shrink-0">दृश्यता (Visibility):</span>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 truncate ${currentPrivacy.color}`}>
              <PrivacyIcon size={11} className="shrink-0" />
              <span className="truncate">{currentPrivacy.text}</span>
            </span>
          </div>

          {onOpenSettingsPrivacy && (
            <button
              type="button"
              id="btn-connections-change-privacy"
              onClick={() => {
                onClose();
                onOpenSettingsPrivacy();
              }}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 shrink-0 ml-2"
              title="सेटिङमा गोपनीयता परिवर्तन गर्नुहोस्"
            >
              <Settings size={11} />
              <span>बदल्नुहोस्</span>
            </button>
          )}
        </div>

        {/* Search Bar for Following & Followers */}
        {(activeTab === 'following' || activeTab === 'followers') && (
          <div className="px-4 pt-3 pb-1">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'following' ? 'फलो गरेका क्रिएटर खोज्नुहोस्...' : 'फलोअर खोज्नुहोस्...'}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {/* 1. FOLLOWING LIST */}
          {activeTab === 'following' && (
            <>
              {filteredFollowing.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">
                  <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
                  <p>कुनै क्रिएटर फेला परेन</p>
                </div>
              ) : (
                filteredFollowing.map((creator) => (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-11 h-11 rounded-full object-cover border border-white/15"
                        />
                        {creator.isLive && (
                          <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[8px] font-extrabold px-1 rounded-full border border-black flex items-center gap-0.5 animate-pulse">
                            <Radio size={8} />
                            <span>LIVE</span>
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white truncate block">{creator.name}</span>
                          {creator.verified && <ShieldCheck size={12} className="text-sky-400 shrink-0" />}
                          {creator.level && (
                            <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30 shrink-0">
                              Lv.{creator.level}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono block truncate">{creator.handle}</span>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5 max-w-[200px]">{creator.bio}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(creator.id)}
                      className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                        creator.isFollowing
                          ? 'bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-neutral-300 border border-white/15'
                          : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                      }`}
                    >
                      {creator.isFollowing ? 'Following' : '+ Follow'}
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* 2. FOLLOWERS LIST */}
          {activeTab === 'followers' && (
            <>
              {filteredFollowers.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p>कुनै फलोअर फेला परेन</p>
                </div>
              ) : (
                filteredFollowers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={follower.avatar}
                        alt={follower.name}
                        className="w-11 h-11 rounded-full object-cover border border-white/15 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white truncate block">{follower.name}</span>
                          {follower.verified && <ShieldCheck size={12} className="text-sky-400 shrink-0" />}
                          {follower.level && (
                            <span className="text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 px-1 rounded border border-purple-500/30 shrink-0">
                              Lv.{follower.level}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono block truncate">{follower.handle}</span>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5 max-w-[200px]">{follower.bio}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFollowerBack(follower.id)}
                      className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                        follower.isFollowing
                          ? 'bg-white/10 hover:bg-white/15 text-neutral-300 border border-white/15'
                          : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                      }`}
                    >
                      {follower.isFollowing ? 'Friends 🤝' : '+ Follow Back'}
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* 3. LIKES TAB (Liked Videos & Posts) */}
          {activeTab === 'likes' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-rose-950/30 to-black/60 border border-rose-500/20 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">कुल प्राप्त लाइक्स (Total Likes)</span>
                  <span className="text-[10px] text-neutral-400">तपाईंको भिडियोहरूमा कुल ८६,२०० लाइक्स संकलित</span>
                </div>
                <div className="flex items-center gap-1 text-rose-400 font-black text-lg">
                  <Heart size={18} className="fill-rose-500" />
                  <span>86.2K</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-neutral-300">मन परेका भिडियोहरू (Liked Videos)</span>
                <span className="text-[10px] text-neutral-400">{likedVideos.length} भिडियोहरू</span>
              </div>

              {likedVideos.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                  <Heart size={32} className="mx-auto mb-2 text-neutral-600" />
                  <p className="text-xs text-neutral-400">कुनै भिडियो मन परेको छैन</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {likedVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => {
                        if (onSelectVideo) onSelectVideo(video);
                      }}
                      className="group relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-rose-500/50 transition-all cursor-pointer aspect-[3/4] flex flex-col justify-end p-2.5 shadow-md"
                    >
                      {video.videoUrl ? (
                        <video
                          src={video.videoUrl}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-neutral-900 to-neutral-800" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      <div className="relative z-10 space-y-1">
                        <div className="flex items-center justify-between text-white text-[10px] font-bold">
                          <span className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                            <Heart size={11} className="text-rose-500 fill-rose-500" />
                            <span>{video.likesCount.toLocaleString()}</span>
                          </span>
                          <span className="bg-black/50 p-1 rounded-full text-white/80 group-hover:text-white">
                            <Play size={10} className="fill-white" />
                          </span>
                        </div>

                        <p className="text-[11px] text-white font-medium line-clamp-1 leading-tight">
                          {video.caption || 'TikTop Video'}
                        </p>

                        <div className="flex items-center gap-1 text-[9px] text-neutral-300">
                          <span className="font-mono truncate">{video.authorHandle}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-neutral-950/70 flex items-center justify-between text-xs text-neutral-400">
          <span>TikTop Community Connections</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-white hover:text-neutral-300"
          >
            बन्द गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  );
};
