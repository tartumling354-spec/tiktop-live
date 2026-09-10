import React, { useState } from 'react';
import { Coins, Award, ShieldCheck, Settings, Film, Play, Heart, MessageSquare, Edit3, Camera, Copy, Check, LogOut } from 'lucide-react';
import { LiveMode, PostVideo, UserProfile, AuthUser, RegisteredAccount } from '../types';
import { EditProfileModal } from './EditProfileModal';
import { AppSettingsModal } from './AppSettingsModal';

interface ProfileViewProps {
  userCoins?: number;
  userDiamonds?: number;
  userPoints?: number;
  onRechargeDiamonds?: () => void;
  onOpenRechargeCoins?: () => void;
  onOpenWithdrawPoints?: () => void;
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
  const [settingsModalTab, setSettingsModalTab] = useState<'permissions' | 'wallet' | 'account'>('permissions');
  const [copiedMyId, setCopiedMyId] = useState(false);

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
          {/* Avatar with Camera badge to change photo */}
          <div className="relative w-22 h-22 mx-auto mb-3">
            <div
              id="avatar-photo-clickable"
              onClick={() => setIsEditProfileOpen(true)}
              className="w-22 h-22 rounded-full overflow-hidden border-3 border-rose-500 shadow-xl cursor-pointer ring-4 ring-rose-500/20 group relative transition-transform hover:scale-105 active:scale-95"
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
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg border-2 border-neutral-900 transition-all active:scale-90"
              title="Change Profile Photo"
            >
              <Camera size={13} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-base sm:text-lg font-bold text-white">{profile.name}</h2>
            <ShieldCheck size={16} className="text-sky-400" />
          </div>
          <span className="text-xs text-neutral-400 font-medium">{profile.handle}</span>

          {/* User ID Badge with Copy */}
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
              <span>ID: {profile.userId || 'USR-99201'}</span>
            </span>
            <button
              type="button"
              id="btn-copy-my-user-id"
              onClick={handleCopyMyId}
              className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Copy User ID"
            >
              {copiedMyId ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>

          <p className="text-xs text-neutral-300 mt-2 max-w-xs mx-auto leading-relaxed">
            {profile.bio || 'Welcome to my official TikTop profile! 🌟'}
          </p>

          {/* Action Buttons: Edit Profile, Settings & Logout */}
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

            <button
              type="button"
              id="btn-open-settings-pill"
              onClick={() => {
                setSettingsModalTab('permissions');
                setIsSettingsModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Settings size={13} className="text-amber-400" />
              <span>Settings</span>
            </button>

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

          {/* Stats Bar */}
          <div className="flex justify-center gap-8 my-4 pt-3 border-t border-white/10">
            <div>
              <span className="block text-sm font-bold text-white">128</span>
              <span className="text-[10px] text-neutral-400 uppercase">Following</span>
            </div>
            <div>
              <span className="block text-sm font-bold text-white">14.8K</span>
              <span className="text-[10px] text-neutral-400 uppercase">Followers</span>
            </div>
            <div>
              <span className="block text-sm font-bold text-white">86.2K</span>
              <span className="text-[10px] text-neutral-400 uppercase">Likes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Wallet: Coins (सिक्का) & Points (अंक) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* 1. Coins (सिक्का) - Used for sending gifts & recharge */}
        <div className="bg-gradient-to-br from-neutral-900 via-amber-950/30 to-neutral-900 border border-amber-500/25 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
                <Coins size={22} className="text-amber-400" />
              </div>
              <div>
                <span className="text-xs text-neutral-200 font-bold block">सिक्का (Coins)</span>
              </div>
            </div>

            <button
              type="button"
              id="btn-profile-recharge-coins"
              onClick={handleRecharge}
              className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 font-black text-[11px] text-neutral-950 shadow-md transition-all active:scale-95 whitespace-nowrap"
            >
              + रिचार्ज (Recharge)
            </button>
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-white/5">
            <span className="text-xl font-black text-amber-300">
              {coinsBalance.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">Coins</span>
          </div>
        </div>

        {/* 2. Points (अंक) - Earned from stream & gifts, with Withdrawal option */}
        <div
          id="profile-points-card"
          onClick={handleWithdraw}
          className="bg-gradient-to-br from-neutral-900 via-rose-950/30 to-neutral-900 border border-rose-500/25 hover:border-rose-500/50 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] active:scale-98 group"
          title="Points निकासी गर्न यहाँ ट्याप गर्नुहोस्"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                <Award size={22} className="text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-neutral-200 font-bold block">अंक (Points)</span>
                  <span className="text-[8px] bg-rose-500/20 text-rose-300 font-extrabold px-1.5 py-0.2 rounded-full border border-rose-500/30">
                    रिवार्ड
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-profile-withdraw-points"
              onClick={(e) => {
                e.stopPropagation();
                handleWithdraw();
              }}
              className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 font-black text-[11px] text-white shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1"
            >
              <span>💸 निकासी (Withdraw)</span>
            </button>
          </div>

          <div className="flex items-baseline justify-between pt-1 border-t border-white/5">
            <span className="text-xl font-black text-rose-400">
              {userPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              ≈ ${(userPoints / 100000).toFixed(2)} USD
            </span>
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
        onTriggerTestLiveAlert={onTriggerTestLiveAlert}
        profile={profile}
        authUser={authUser}
        onLogout={onLogout}
        onSwitchAccount={onSwitchAccount}
        onSelectAccountDirectly={onSelectAccountDirectly}
      />
    </div>
  );
};
