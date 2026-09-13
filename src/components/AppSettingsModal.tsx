import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Camera,
  Mic,
  Coins,
  Award,
  X,
  Check,
  Bell,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Info,
  ExternalLink,
  Trash2,
  Zap,
  CheckCircle2,
  Radio,
  LogIn,
  LogOut,
  User,
  KeyRound,
  Smartphone,
  Mail,
  AlertCircle,
  Copy,
  UserPlus,
} from 'lucide-react';
import { AuthUser, UserProfile, RegisteredAccount } from '../types';
import { getRegisteredAccounts, accountToAuthAndProfile } from '../utils/authDb';
import { isUserAdminAuthorized } from '../utils/adminFinanceDb';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'permissions' | 'wallet' | 'account';
  userCoins: number;
  userPoints: number;
  onOpenRecharge: () => void;
  onOpenWithdraw: () => void;
  onOpenAdminPanel?: () => void;
  onTriggerTestLiveAlert?: () => void;
  profile?: UserProfile;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onSwitchAccount?: (mode?: 'login' | 'signup') => void;
  onSelectAccountDirectly?: (account: RegisteredAccount) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'permissions',
  userCoins,
  userPoints,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenAdminPanel,
  onTriggerTestLiveAlert,
  profile,
  authUser,
  onLogout,
  onSwitchAccount,
  onSelectAccountDirectly,
}) => {
  const [activeTab, setActiveTab] = useState<'permissions' | 'wallet' | 'account'>(defaultTab);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [liveFriendAlertEnabled, setLiveFriendAlertEnabled] = useState(true);
  const [streamQuality, setStreamQuality] = useState<'720p' | '1080p'>('1080p');
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Registered Accounts on this device
  const [savedAccounts, setSavedAccounts] = useState<RegisteredAccount[]>([]);

  // Clear Cache state
  const [cacheSizeMb, setCacheSizeMb] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tiktop_cache_mb');
      return saved ? parseFloat(saved) : 48.6;
    } catch {
      return 48.6;
    }
  });
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setSavedAccounts(getRegisteredAccounts());
    }
  }, [isOpen, defaultTab]);

  const handleClearCache = () => {
    setIsClearingCache(true);
    setTimeout(() => {
      try {
        const preserveKeys = [
          'tiktop_coins',
          'tiktop_diamonds',
          'tiktop_points',
          'tiktop_user_profile',
          'tiktop_posted_videos',
          'tiktop_registered_users_db',
          'tiktop_auth_user',
          'tiktop_last_active_user_id',
          'tiktop_system_inbox_notices',
        ];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach((key) => {
          if (!preserveKeys.includes(key) && !key.startsWith('tiktop_daily_live_duration_')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem('tiktop_cache_mb', '0.0');
        localStorage.setItem('tiktop_cache_cleared_at', new Date().toISOString());
      } catch {
        // Ignore
      }
      setCacheSizeMb(0.0);
      setIsClearingCache(false);
      setCacheClearSuccess(true);
      setTimeout(() => {
        setCacheClearSuccess(false);
      }, 5000);
    }, 800);
  };

  const handleCopyId = (idToCopy: string) => {
    try {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handlePerformLogout = () => {
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  const handleSwitchToLogin = () => {
    onClose();
    if (onSwitchAccount) {
      onSwitchAccount('login');
    } else if (onLogout) {
      onLogout();
    }
  };

  const handleSwitchToSignup = () => {
    onClose();
    if (onSwitchAccount) {
      onSwitchAccount('signup');
    } else if (onLogout) {
      onLogout();
    }
  };

  if (!isOpen) return null;

  const currentUserId = profile?.userId || authUser?.id || 'USR-99201';
  const currentUserName = profile?.name || authUser?.name || 'TikTop User';
  const currentUserHandle = profile?.handle || authUser?.handle || '@tiktop_user';
  const currentUserAvatar = profile?.avatar || authUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
  const currentUserProvider = profile?.provider || authUser?.provider || 'google';
  const currentUserEmail = profile?.email || authUser?.email;
  const currentUserPhone = profile?.phone || authUser?.phone;

  return (
    <div
      id="app-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="app-settings-modal-card"
        className="w-full max-w-lg bg-neutral-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                Settings (सेटिङ)
              </h2>
              <p className="text-[11px] text-neutral-400">
                अनुमति, वालेट तथा खाता लगइन/लगआउट
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
            title="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher inside Settings (3 TABS: Permissions, Wallet, Account & Login/Logout) */}
        <div className="grid grid-cols-3 p-2 bg-neutral-950/40 border-b border-white/10 gap-1.5">
          <button
            type="button"
            id="tab-btn-settings-permissions"
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all truncate ${
              activeTab === 'permissions'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={14} className="shrink-0" />
            <span className="truncate">अनुमति</span>
          </button>

          <button
            type="button"
            id="tab-btn-settings-wallet"
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all truncate ${
              activeTab === 'wallet'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins size={14} className="shrink-0" />
            <span className="truncate">वालेट</span>
          </button>

          <button
            type="button"
            id="tab-btn-settings-account"
            onClick={() => setActiveTab('account')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all truncate ${
              activeTab === 'account'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={14} className="shrink-0" />
            <span className="truncate">खाता (Auth)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Permissions */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-sky-950/30 border border-sky-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 text-sky-400 font-bold text-xs">
                  <ShieldCheck size={16} />
                  <span>हार्डवेयर अनुमति स्थिति (Device Permissions Status)</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  लाइभ स्ट्रिमिङ (Face Live / Party Live) तथा भिडियो रेकर्डिङका लागि क्यामेरा र माइक्रोफोन अनुमति सक्रिय गरिएको छ।
                </p>
              </div>

              {/* Hardware Toggles */}
              <div className="bg-neutral-950/50 border border-white/10 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-white block">हार्डवेयर स्विच (Hardware Controls)</span>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Camera size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">क्यामेरा पहुँच (Camera Access)</span>
                      <span className="text-[10px] text-neutral-400 block">भिडियो तथा फेस लाइभका लागि</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      cameraEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${
                        cameraEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-1 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Mic size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">माइक्रोफोन पहुँच (Microphone Access)</span>
                      <span className="text-[10px] text-neutral-400 block">अडियो तथा कुराकानीका लागि</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      micEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${
                        micEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Clear Cache */}
              <div className="bg-neutral-950/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">क्यास खाली गर्नुहोस् (Clear Cache)</span>
                  <span className="text-[10px] text-neutral-400 block font-mono">
                    प्रयोग भएको डाटा: {cacheSizeMb.toFixed(1)} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearingCache || cacheSizeMb === 0}
                  className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <Trash2 size={13} />
                  <span>{isClearingCache ? 'सफा हुँदैछ...' : 'Clear'}</span>
                </button>
              </div>

              {cacheClearSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>क्यास सफलतापूर्वक खाली गरियो!</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Wallet */}
          {activeTab === 'wallet' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Coins Balance Card */}
              <div className="bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Coins size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">सिक्का (Coins) मौज्दात</span>
                      <span className="text-[10px] text-neutral-400">उपहार पठाउन प्रयोग हुने</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecharge();
                    }}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-black text-xs shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1"
                  >
                    <span>⚡ रिचार्ज (Recharge)</span>
                  </button>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                  <div>
                    <span className="text-2xl font-black text-amber-400">
                      {userCoins.toLocaleString()}
                    </span>
                    <span className="text-xs text-neutral-400 ml-1.5 font-semibold">Coins</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-300 block">
                      ≈ ${(userCoins / 92000).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Points Balance Card */}
              <div className="bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-950 border border-rose-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                      <Award size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">अंक (Points) मौज्दात</span>
                      <span className="text-[10px] text-rose-300 font-bold">निकासी योग्य रिवार्ड</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWithdraw();
                    }}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-xs shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1"
                  >
                    <span>💸 निकासी (Withdraw)</span>
                  </button>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                  <div>
                    <span className="text-2xl font-black text-rose-400">
                      {userPoints.toLocaleString()}
                    </span>
                    <span className="text-xs text-neutral-400 ml-1.5 font-semibold">Points</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-400 block">
                      ≈ ${(userPoints / 100000).toFixed(2)} USD
                    </span>
                    <span className="text-[9px] text-neutral-400 block font-semibold">(न्यूनतम $५)</span>
                  </div>
                </div>
              </div>

              {/* Restricted Admin Finance & Approval Console Card - Strictly for Authorized Admin */}
              {onOpenAdminPanel && isUserAdminAuthorized(profile || authUser) && (
                <div className="bg-gradient-to-br from-neutral-900 via-rose-950/30 to-amber-950/20 border border-rose-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                          <span>🔒 एडमिन फाइनान्स कन्सोल</span>
                          <span className="text-[9px] bg-rose-500/20 text-rose-300 font-mono px-1.5 py-0.2 rounded border border-rose-500/30">
                            गोप्य
                          </span>
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          रिचार्ज/निकासी स्वीकृति र प्रयोगकर्ता मौज्दात
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-settings-open-admin-console"
                      onClick={() => {
                        onClose();
                        onOpenAdminPanel();
                      }}
                      className="py-1.5 px-3.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>खोल्नुहोस् →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecharge();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Coins size={15} />
                  <span>Coins रिचार्ज</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWithdraw();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Award size={15} />
                  <span>Points निकासी</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ACCOUNT & LOGIN / LOGOUT (User Explicit Request)   */}
          {/* ========================================================= */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Currently Active Logged-in User Profile Card */}
              <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-white/15 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>हाल सक्रिय खाता (Active Account)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    प्रमाणित (Logged In)
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={currentUserAvatar}
                    alt={currentUserName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-rose-500 shadow-md shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-white truncate">{currentUserName}</h3>
                    </div>
                    <span className="text-xs text-neutral-400 block font-mono truncate">{currentUserHandle}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-white/10 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <span>ID: {currentUserId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(currentUserId)}
                          className="text-neutral-400 hover:text-white"
                          title="Copy ID"
                        >
                          {copiedId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        </button>
                      </div>
                      <span className="text-[10px] text-neutral-400 uppercase font-bold px-1.5 py-0.2 rounded bg-white/5 border border-white/10">
                        {currentUserProvider}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email / Phone info */}
                {(currentUserEmail || currentUserPhone) && (
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-neutral-300 flex items-center gap-2 font-mono">
                    {currentUserEmail ? (
                      <>
                        <Mail size={13} className="text-amber-400 shrink-0" />
                        <span className="truncate">{currentUserEmail}</span>
                      </>
                    ) : (
                      <>
                        <Smartphone size={13} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{currentUserPhone}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Login & Logout Actions Section */}
              <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-white block">
                  लगइन तथा लगआउट विकल्पहरू (Login & Logout Options)
                </span>

                {/* 1. Switch / Log In to Another Account */}
                <button
                  type="button"
                  id="settings-btn-switch-login"
                  onClick={handleSwitchToLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-between transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <LogIn size={16} className="text-sky-400" />
                    <span>अर्को खातामा लगइन गर्नुहोस् (Log In with Another Account)</span>
                  </div>
                  <ChevronRight size={15} className="text-neutral-400" />
                </button>

                {/* 2. Create New Account (Sign Up) */}
                <button
                  type="button"
                  id="settings-btn-create-signup"
                  onClick={handleSwitchToSignup}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-between transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus size={16} className="text-emerald-400" />
                    <span>नयाँ खाता बनाउनुहोस् (Sign Up New ID)</span>
                  </div>
                  <ChevronRight size={15} className="text-neutral-400" />
                </button>

                {/* 3. LOG OUT BUTTON */}
                <button
                  type="button"
                  id="settings-btn-logout-action"
                  onClick={handlePerformLogout}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 hover:text-rose-200 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
                >
                  <LogOut size={16} />
                  <span>यस खाताबाट लगआउट गर्नुहोस् (Log Out)</span>
                </button>
              </div>

              {/* Saved accounts on device */}
              {savedAccounts.length > 0 && (
                <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-4 space-y-2.5">
                  <span className="text-[11px] font-bold text-neutral-300 block">
                    यस उपकरणमा सुरक्षित गरिएका खाताहरू ({savedAccounts.length}):
                  </span>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {savedAccounts.map((acc) => {
                      const isCurrent = acc.id === currentUserId;
                      return (
                        <div
                          key={acc.id}
                          className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                            isCurrent
                              ? 'bg-rose-500/10 border-rose-500/40'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={acc.avatar}
                              alt={acc.name}
                              className="w-8 h-8 rounded-full object-cover border border-white/15 shrink-0"
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold text-white block truncate">
                                {acc.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 block font-mono truncate">
                                ID: {acc.id} • {acc.email || acc.phone || acc.handle}
                              </span>
                            </div>
                          </div>

                          {isCurrent ? (
                            <span className="shrink-0 text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                              सक्रिय ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectAccountDirectly) {
                                  onSelectAccountDirectly(acc);
                                  onClose();
                                } else {
                                  handleSwitchToLogin();
                                }
                              }}
                              className="shrink-0 text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg border border-white/15 transition-all"
                            >
                              स्विच गर्नुहोस्
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>TikTop Settings v2.4</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-white hover:text-neutral-300"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
