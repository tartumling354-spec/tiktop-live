import React, { useState } from 'react';
import { Coins, Award, ShieldCheck, Settings, Film, Play, Heart, MessageSquare, Edit3, Camera, Copy, Check, LogOut, Crown, Sparkles, TrendingUp, X, ChevronRight, Info } from 'lucide-react';
import { LiveMode, PostVideo, UserProfile, AuthUser, RegisteredAccount } from '../types';
import { EditProfileModal } from './EditProfileModal';
import { AppSettingsModal, SettingsTabType } from './AppSettingsModal';
import { UserConnectionsModal, ConnectionTabType } from './UserConnectionsModal';
import { getStoredWealthTotal, calculateWealthLevel, getStoredLiveTotal, calculateLiveLevel, WEALTH_TIERS, LIVE_TIERS } from '../utils/levelSystem';
import { isUserAdminAuthorized } from '../utils/adminFinanceDb';

interface ProfileViewProps {
  userCoins?: number;
  userDiamonds?: number;
  userPoints?: number;
  onRechargeDiamonds?: () => void;
  onOpenRechargeCoins?: () => void;
  onOpenWithdrawPoints?: () => void;
  onOpenAdminPanel?: () => void;
  onStartLive?: (mode: LiveMode) => void;
  onOpenPostVideo?: () => void;
  userVideos: PostVideo[];
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onTriggerTestLiveAlert?: () => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onSwitchAccount?: (mode?: 'login' | 'signup') => void;
  onSelectAccountDirectly?: (account: RegisteredAccount) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userCoins,
  userDiamonds,
  userPoints = 0,
  onRechargeDiamonds,
  onOpenRechargeCoins,
  onOpenWithdrawPoints,
  onOpenAdminPanel,
  onStartLive,
  onOpenPostVideo,
  userVideos,
  profile,
  onUpdateProfile,
  onTriggerTestLiveAlert,
  authUser,
  onLogout,
  onSwitchAccount,
  onSelectAccountDirectly,
}) => {
  const [selectedVideoToWatch, setSelectedVideoToWatch] = useState<PostVideo | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsTabType>('privacy');
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState<boolean>(false);
  const [connectionsTab, setConnectionsTab] = useState<ConnectionTabType>('following');
  const [copiedMyId, setCopiedMyId] = useState(false);
  const [selectedLevelModal, setSelectedLevelModal] = useState<'wealth' | 'live' | null>(null);

  const coinsBalance = userCoins !== undefined ? userCoins : (userDiamonds ?? 0);
  const handleRecharge = onOpenRechargeCoins || onRechargeDiamonds || (() => {});
  const handleWithdraw = onOpenWithdrawPoints || (() => {});

  const handleCopyMyId = () => {
    const idToCopy = profile.userId || 'USR-99201';
    try {
      navigator.clipboard.writeText(idToCopy);
    } catch {
      // Ignore
    }
    setCopiedMyId(true);
    setTimeout(() => setCopiedMyId(false), 2000);
  };

  const wealthTotal = getStoredWealthTotal();
  const wealthInfo = calculateWealthLevel(wealthTotal);
  const liveTotal = getStoredLiveTotal();
  const liveInfo = calculateLiveLevel(liveTotal);

  return (
    <div id="profile-screen" className="flex-1 overflow-y-auto pb-24 max-w-2xl mx-auto w-full px-4 pt-3">
      {/* Profile Card */}
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-5 mb-4 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-rose-600/30 via-indigo-600/30 to-purple-600/30" />

        {/* Top-Right Quick Settings Button */}
        <button
          type="button"
          id="btn-profile-top-settings"
          onClick={() => {
            setSettingsModalTab('permissions');
            setIsSettingsModalOpen(true);
          }}
          className="absolute top-3 right-3 z-10 py-1.5 px-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-neutral-200 transition-all active:scale-95 shadow-md flex items-center gap-1.5"
          title="Settings (सेटिङ)"
        >
          <Settings size={14} className="text-amber-400" />
          <span className="text-[11px] font-bold text-white">सेटिङ</span>
        </button>

        <div className="relative pt-6">
          {/* Avatar and Flanking Wealth Level (Left) & Live Level (Right) - आयताकार (Rectangular) बक्सहरू */}
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3.5 mb-3 max-w-lg mx-auto px-1">
            {/* Left: Wealth Level Box (आयताकार बक्स / Rectangular Card) */}
            <div
              id="profile-wealth-level-box"
              onClick={() => setSelectedLevelModal('wealth')}
              className="flex-1 max-w-[128px] sm:max-w-[165px] bg-gradient-to-br from-amber-500/15 via-neutral-900/95 to-black/90 border border-amber-400/40 hover:border-amber-400/70 rounded-xl p-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden shrink"
              title="Wealth Level - अरुलाई उपहार पठाउँदा बढ्ने (Click to view details)"
            >
              {/* Top Row: Icon + Title & Level */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr ${wealthInfo.badgeGradient} border border-white/20 flex items-center justify-center text-xs sm:text-sm shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                  {wealthInfo.icon}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-tight truncate font-sans">
                      Wealth
                    </span>
                    <span className="text-[9px] font-mono font-black text-amber-300 shrink-0">
                      Lv.{wealthInfo.level}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white truncate leading-tight">
                    {wealthInfo.nepaliTitle}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Progress Bar & Coins */}
              <div className="w-full">
                <div className="w-full bg-black/70 rounded-full h-1.5 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-yellow-400 to-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${wealthInfo.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[8px] text-neutral-400 mt-1 font-mono font-medium">
                  <span className="text-amber-300/90 font-bold truncate">
                    {wealthTotal >= 1000 ? `${(wealthTotal / 1000).toFixed(wealthTotal % 1000 === 0 ? 0 : 1)}k` : wealthTotal} Coins
                  </span>
                  <span className="text-neutral-300 shrink-0">
                    {wealthInfo.level >= 10 ? 'MAX' : `${wealthInfo.progress}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Profile Avatar */}
            <div className="relative shrink-0">
              <div
                id="avatar-photo-clickable"
                onClick={() => setIsEditProfileOpen(true)}
                className="w-18 h-18 sm:w-22 sm:h-22 rounded-full overflow-hidden border-3 border-rose-500 shadow-xl cursor-pointer ring-4 ring-rose-500/20 group relative transition-transform hover:scale-105 active:scale-95"
                title="Click to change profile photo"
              >
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Camera size={20} className="text-white drop-shadow" />
                </div>
              </div>

              {/* Floating Camera Button badge */}
              <button
                type="button"
                id="btn-edit-avatar-badge"
                onClick={() => setIsEditProfileOpen(true)}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg border-2 border-neutral-900 transition-all active:scale-90 cursor-pointer"
                title="Change Profile Photo"
              >
                <Camera size={12} />
              </button>
            </div>

            {/* Right: Live Level Box (आयताकार बक्स / Rectangular Card) */}
            <div
              id="profile-live-level-box"
              onClick={() => setSelectedLevelModal('live')}
              className="flex-1 max-w-[128px] sm:max-w-[165px] bg-gradient-to-br from-emerald-500/15 via-neutral-900/95 to-black/90 border border-emerald-400/40 hover:border-emerald-400/70 rounded-xl p-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden shrink"
              title="Live Level - उपहार पाउने लाइभ स्तर (Click to view details)"
            >
              {/* Top Row: Icon + Title & Level */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr ${liveInfo.badgeGradient} border border-white/20 flex items-center justify-center text-xs sm:text-sm shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                  {liveInfo.icon}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tight truncate font-sans">
                      Live
                    </span>
                    <span className="text-[9px] font-mono font-black text-emerald-300 shrink-0">
                      Lv.{liveInfo.level}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white truncate leading-tight">
                    {liveInfo.nepaliTitle}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Progress Bar & Points */}
              <div className="w-full">
                <div className="w-full bg-black/70 rounded-full h-1.5 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${liveInfo.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[8px] text-neutral-400 mt-1 font-mono font-medium">
                  <span className="text-emerald-300/90 font-bold truncate">
                    {liveTotal >= 1000 ? `${(liveTotal / 1000).toFixed(liveTotal % 1000 === 0 ? 0 : 1)}k` : liveTotal} Pts
                  </span>
                  <span className="text-neutral-300 shrink-0">
                    {liveInfo.level >= 10 ? 'MAX' : `${liveInfo.progress}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coins (Left) & Points (Right) Boxes matching Level boxes, with Name & Bio in the center */}
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3.5 mb-3 max-w-lg mx-auto px-1">
            {/* Left (बायाँ - Wealth Level को तल): Coins (सिक्का) Box (Level जत्रै बक्स) */}
            <div
              id="profile-coins-card"
              onClick={handleRecharge}
              className="flex-1 max-w-[128px] sm:max-w-[165px] bg-gradient-to-br from-amber-500/15 via-neutral-900/95 to-black/90 border border-amber-400/40 hover:border-amber-400/70 rounded-xl p-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden shrink text-left"
              title="Coins (सिक्का) रिचार्ज गर्न ट्याप गर्नुहोस्"
            >
              {/* Top Row: Icon + Title & Recharge */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                  <Coins size={15} className="text-amber-400" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-tight truncate font-sans">
                      Coins
                    </span>
                    <span className="text-[8px] bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                      +रिचार्ज
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white truncate leading-tight">
                    सिक्का
                  </p>
                </div>
              </div>

              {/* Bottom Row: Balance */}
              <div className="w-full pt-1 border-t border-white/10 font-mono">
                <div className="flex items-center justify-between text-[8px] text-neutral-400">
                  <span className="text-base sm:text-lg font-black text-amber-300 truncate">
                    {coinsBalance.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-neutral-400 font-medium">Coins</span>
                </div>
              </div>
            </div>

            {/* Center (बीचमा): Name, Handle, ID, and Bio */}
            <div className="flex-1 min-w-0 text-center px-1">
              <div className="flex items-center justify-center gap-1">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">{profile.name}</h2>
                <ShieldCheck size={14} className="text-sky-400 shrink-0" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-neutral-400 block truncate">{profile.handle}</span>

              {/* User ID Badge with Copy */}
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                  <span>ID: {profile.userId || 'USR-99201'}</span>
                </span>
                <button
                  type="button"
                  id="btn-copy-my-user-id"
                  onClick={handleCopyMyId}
                  className="p-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy User ID"
                >
                  {copiedMyId ? (
                    <Check size={10} className="text-emerald-400" />
                  ) : (
                    <Copy size={10} />
                  )}
                </button>
              </div>

              <p className="text-[10px] sm:text-[11px] text-neutral-300 mt-1 line-clamp-2 leading-tight max-w-[190px] mx-auto">
                {profile.bio || 'Welcome to my official TikTop profile! 🌟'}
              </p>
            </div>

            {/* Right (दायाँ - Live Level को तल): Points (अंक) Box (Level जत्रै बक्स) */}
            <div
              id="profile-points-card"
              onClick={handleWithdraw}
              className="flex-1 max-w-[128px] sm:max-w-[165px] bg-gradient-to-br from-rose-500/15 via-neutral-900/95 to-black/90 border border-rose-400/40 hover:border-rose-400/70 rounded-xl p-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden shrink text-left"
              title="Points निकासी गर्न यहाँ ट्याप गर्नुहोस्"
            >
              {/* Top Row: Icon + Title & Withdraw */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                  <Award size={15} className="text-rose-400" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-tight truncate font-sans">
                      Points
                    </span>
                    <span className="text-[8px] bg-rose-500/25 hover:bg-rose-500/40 text-rose-300 font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                      💸निकासी
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white truncate leading-tight">
                    अंक
                  </p>
                </div>
              </div>

              {/* Bottom Row: Points & Approx USD */}
              <div className="w-full pt-1 border-t border-white/10 font-mono">
                <div className="flex items-center justify-between text-[8px]">
                  <span className="text-base sm:text-lg font-black text-rose-400 truncate">
                    {userPoints.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold truncate">
                    ≈${(userPoints / 100000).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit Profile, Admin Console & Logout (तल्लो सेटिङ बटन हटाइएको) */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              id="btn-open-edit-profile"
              onClick={() => setIsEditProfileOpen(true)}
              className="py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Edit3 size={13} className="text-rose-400" />
              <span>Edit Profile</span>
            </button>

            {/* Restricted Admin Panel Button - Only visible to admin */}
            {onOpenAdminPanel && isUserAdminAuthorized(profile || authUser) && (
              <button
                type="button"
                id="btn-profile-admin-console"
                onClick={onOpenAdminPanel}
                className="py-1.5 px-3.5 rounded-full bg-gradient-to-r from-rose-600/30 via-red-600/30 to-amber-600/30 hover:from-rose-600/50 hover:to-amber-600/50 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                title="गोप्य एडमिन कन्सोल (Admin Finance & Approval Console)"
              >
                <ShieldCheck size={13} className="text-amber-400" />
                <span>🔒 एडमिन प्यानल</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                id="btn-logout-profile"
                onClick={onLogout}
                className="py-1.5 px-3 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                title="Log out of this account"
              >
                <LogOut size={13} className="text-rose-400" />
                <span>लगआउट (Log Out)</span>
              </button>
            )}
          </div>

          {/* Stats Bar - Clickable Following, Followers & Likes (चिक गरेर हेर्न सकिने) */}
          <div className="flex justify-center items-center gap-4 sm:gap-8 my-4 pt-3 border-t border-white/10">
            <button
              type="button"
              id="btn-profile-stat-following"
              onClick={() => {
                setConnectionsTab('following');
                setIsConnectionsModalOpen(true);
              }}
              className="group px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-center cursor-pointer border border-transparent hover:border-white/10"
              title="Click to view Following list"
            >
              <span className="block text-sm sm:text-base font-black text-white group-hover:text-rose-400 transition-colors">
                128
              </span>
              <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 uppercase font-bold tracking-wider">
                Following 👥
              </span>
            </button>

            <button
              type="button"
              id="btn-profile-stat-followers"
              onClick={() => {
                setConnectionsTab('followers');
                setIsConnectionsModalOpen(true);
              }}
              className="group px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-center cursor-pointer border border-transparent hover:border-white/10"
              title="Click to view Followers list"
            >
              <span className="block text-sm sm:text-base font-black text-white group-hover:text-rose-400 transition-colors">
                14.8K
              </span>
              <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 uppercase font-bold tracking-wider">
                Followers 🌟
              </span>
            </button>

            <button
              type="button"
              id="btn-profile-stat-likes"
              onClick={() => {
                setConnectionsTab('likes');
                setIsConnectionsModalOpen(true);
              }}
              className="group px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-center cursor-pointer border border-transparent hover:border-white/10"
              title="Click to view Likes"
            >
              <span className="block text-sm sm:text-base font-black text-white group-hover:text-rose-400 transition-colors flex items-center justify-center gap-1">
                <span>86.2K</span>
                <Heart size={12} className="text-rose-500 fill-rose-500" />
              </span>
              <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 uppercase font-bold tracking-wider">
                Likes ❤️
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* My Posted Videos (मेरो भिडियोहरू) */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Film size={15} className="text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              My Posted Videos (मेरो भिडियोहरू)
            </h3>
          </div>
          <span className="text-xs text-rose-400 font-semibold">{userVideos.length} Videos</span>
        </div>

        {userVideos.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
            <Film size={28} className="text-neutral-500 mx-auto mb-1.5" />
            <p className="text-xs text-neutral-400 mb-2">No videos posted yet</p>
            <button
              type="button"
              onClick={onOpenPostVideo}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300"
            >
              + Post your first video now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {userVideos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setSelectedVideoToWatch(vid)}
                className="group relative aspect-[9/14] rounded-xl overflow-hidden bg-black border border-white/15 cursor-pointer hover:border-rose-500 transition-all"
              >
                <video
                  src={vid.videoUrl}
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] text-white font-medium">
                  <span className="flex items-center gap-0.5">
                    <Heart size={10} className="fill-rose-500 text-rose-500" />
                    <span>{vid.likesCount}</span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Play size={10} className="fill-white" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Playback Modal for profile video */}
      {selectedVideoToWatch && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedVideoToWatch(null)}
        >
          <div
            className="w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden relative bg-black border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={selectedVideoToWatch.videoUrl}
              autoPlay
              controls
              playsInline
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setSelectedVideoToWatch(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Level Details Modal (Wealth Level or Live Level) */}
      {selectedLevelModal && (
        <div
          id="modal-level-details"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedLevelModal(null)}
        >
          <div
            className="bg-neutral-900 border border-white/15 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b border-white/10 flex items-center justify-between ${
              selectedLevelModal === 'wealth'
                ? 'bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-950/20'
                : 'bg-gradient-to-r from-emerald-500/20 via-neutral-900 to-teal-950/20'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-md ${
                  selectedLevelModal === 'wealth'
                    ? `bg-gradient-to-tr ${wealthInfo.badgeGradient} border border-amber-400/40`
                    : `bg-gradient-to-tr ${liveInfo.badgeGradient} border border-emerald-400/40`
                }`}>
                  {selectedLevelModal === 'wealth' ? wealthInfo.icon : liveInfo.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    {selectedLevelModal === 'wealth' ? (
                      <>
                        <Crown size={16} className="text-amber-400" />
                        <span>Wealth Level (गिफ्टिङ स्तर)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-emerald-400" />
                        <span>Live Level (लाइभ होस्ट स्तर)</span>
                      </>
                    )}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {selectedLevelModal === 'wealth'
                      ? 'अरुलाई उपहार (Coins) पठाउँदा यो स्तर बढ्छ'
                      : 'लाइभ स्ट्रिममा उपहार पाउँदा यो स्तर बढ्छ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-level-modal"
                onClick={() => setSelectedLevelModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Current Status Banner */}
            <div className="p-4 bg-black/40 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">तपाईंको वर्तमान स्तर</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xl font-black font-mono ${
                      selectedLevelModal === 'wealth' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      Lv.{selectedLevelModal === 'wealth' ? wealthInfo.level : liveInfo.level}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                      selectedLevelModal === 'wealth'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {selectedLevelModal === 'wealth' ? wealthInfo.nepaliTitle : liveInfo.nepaliTitle}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">कुल संकलित</span>
                  <p className={`text-base font-bold font-mono ${
                    selectedLevelModal === 'wealth' ? 'text-amber-300' : 'text-emerald-300'
                  }`}>
                    {selectedLevelModal === 'wealth'
                      ? `${wealthTotal.toLocaleString()} Coins`
                      : `${liveTotal.toLocaleString()} Points`}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden border border-white/10 mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedLevelModal === 'wealth'
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-rose-500'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
                  }`}
                  style={{
                    width: `${selectedLevelModal === 'wealth' ? wealthInfo.progress : liveInfo.progress}%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                <span>{selectedLevelModal === 'wealth' ? `${wealthInfo.progress}% प्रगति` : `${liveInfo.progress}% प्रगति`}</span>
                <span className={selectedLevelModal === 'wealth' ? 'text-amber-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                  {(selectedLevelModal === 'wealth' ? wealthInfo.level : liveInfo.level) >= 10
                    ? 'अधिकतम स्तर प्राप्त भयो (Max Level Reached) 🏆'
                    : selectedLevelModal === 'wealth'
                    ? `Lv.${wealthInfo.level + 1} को लागि ${(wealthInfo.nextVal - wealthTotal).toLocaleString()} Coins बाँकी`
                    : `Lv.${liveInfo.level + 1} को लागि ${(liveInfo.nextVal - liveTotal).toLocaleString()} Points बाँकी`}
                </span>
              </div>
            </div>

            {/* Level Tier Ladder List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1 mb-1">
                <span>स्तर र उपाधि (Tiers)</span>
                <span>आवश्यक आवश्यकता (Requirement)</span>
              </div>

              {(selectedLevelModal === 'wealth' ? WEALTH_TIERS : LIVE_TIERS).map((tier) => {
                const currentLevel = selectedLevelModal === 'wealth' ? wealthInfo.level : liveInfo.level;
                const isCurrent = tier.level === currentLevel;
                const isUnlocked = currentLevel >= tier.level;

                return (
                  <div
                    key={tier.level}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? selectedLevelModal === 'wealth'
                          ? 'bg-amber-500/15 border-amber-400/60 ring-1 ring-amber-400/40'
                          : 'bg-emerald-500/15 border-emerald-400/60 ring-1 ring-emerald-400/40'
                        : isUnlocked
                        ? 'bg-white/5 border-white/10 opacity-90'
                        : 'bg-white/2 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${tier.badgeGradient} border border-white/20 flex items-center justify-center text-sm shadow-sm`}>
                        {tier.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black font-mono ${
                            isCurrent
                              ? selectedLevelModal === 'wealth' ? 'text-amber-300' : 'text-emerald-300'
                              : 'text-white'
                          }`}>
                            Lv.{tier.level}
                          </span>
                          <span className="text-[11px] font-bold text-neutral-200">
                            {tier.nepaliTitle}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-white/20 text-white border border-white/30">
                              वर्तमान
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {selectedLevelModal === 'wealth'
                            ? `Level ${tier.level} Gifter Badge`
                            : `Level ${tier.level} Streamer Badge`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-neutral-300">
                        {tier.min.toLocaleString()} {selectedLevelModal === 'wealth' ? 'Coins' : 'Pts'}
                      </span>
                      {tier.level < 10 && (
                        <div className="text-[10px] text-neutral-500 font-mono">
                          - {(tier.next - 1).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-neutral-950 border-t border-white/10 flex justify-end">
              <button
                type="button"
                id="btn-close-level-details-modal"
                onClick={() => setSelectedLevelModal(null)}
                className="py-1.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                बन्द गर्नुहोस् (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={profile}
        onSave={onUpdateProfile}
      />

      {/* Comprehensive Settings Modal */}
      <AppSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        defaultTab={settingsModalTab}
        userCoins={coinsBalance}
        userPoints={userPoints}
        onOpenRecharge={handleRecharge}
        onOpenWithdraw={handleWithdraw}
        onOpenAdminPanel={onOpenAdminPanel}
        onTriggerTestLiveAlert={onTriggerTestLiveAlert}
        profile={profile}
        authUser={authUser}
        onLogout={onLogout}
        onSwitchAccount={onSwitchAccount}
        onSelectAccountDirectly={onSelectAccountDirectly}
      />

      {/* Following / Followers / Likes Connections Modal */}
      <UserConnectionsModal
        isOpen={isConnectionsModalOpen}
        onClose={() => setIsConnectionsModalOpen(false)}
        initialTab={connectionsTab}
        allVideos={userVideos}
        onOpenSettingsPrivacy={() => {
          setSettingsModalTab('privacy');
          setIsSettingsModalOpen(true);
        }}
        onSelectVideo={(video) => {
          setSelectedVideoToWatch(video);
        }}
      />
    </div>
  );
};
