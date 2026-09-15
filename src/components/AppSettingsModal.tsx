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
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Globe,
  Users,
  UserX,
  Heart,
  FileText,
  HelpCircle,
  Shield
} from 'lucide-react';
import { AuthUser, UserProfile, RegisteredAccount } from '../types';
import { getRegisteredAccounts, changeAccountPassword } from '../utils/authDb';
import { isUserAdminAuthorized } from '../utils/adminFinanceDb';
import {
  getUserPrivacySettings,
  saveUserPrivacySettings,
  UserPrivacySettings,
  getBlockedUsers,
  unblockUser,
  BlockedUser,
  getAppLanguage,
  setAppLanguage,
  SUPPORTED_LANGUAGES,
  AppLanguageCode
} from '../utils/userPrivacyDb';

export type SettingsTabType =
  | 'privacy'
  | 'account'
  | 'wallet'
  | 'language'
  | 'blocklist'
  | 'about'
  | 'permissions';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTabType;
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
  defaultTab = 'privacy',
  userCoins,
  userPoints,
  onOpenRecharge,
  onOpenWithdraw,
  onOpenAdminPanel,
  profile,
  authUser,
  onLogout,
  onSwitchAccount,
  onSelectAccountDirectly,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(defaultTab);

  // Hardware permissions
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Accounts
  const [savedAccounts, setSavedAccounts] = useState<RegisteredAccount[]>([]);

  // Privacy settings
  const [privacy, setPrivacy] = useState<UserPrivacySettings>(getUserPrivacySettings());
  const [privacySavedMsg, setPrivacySavedMsg] = useState(false);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguageCode>(getAppLanguage());
  const [langToast, setLangToast] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblockedToast, setUnblockedToast] = useState<string | null>(null);

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
      setPrivacy(getUserPrivacySettings());
      setBlockedUsers(getBlockedUsers());
      setSelectedLanguage(getAppLanguage());
      setPasswordMsg(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, defaultTab]);

  const handleUpdatePrivacy = (updates: Partial<UserPrivacySettings>) => {
    const updated = { ...privacy, ...updates };
    setPrivacy(updated);
    saveUserPrivacySettings(updated);
    setPrivacySavedMsg(true);
    setTimeout(() => setPrivacySavedMsg(false), 2500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ text: 'नयाँ पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ (Minimum 6 characters required)', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'नयाँ पासवर्ड र पुष्टि गरिएको पासवर्ड मिलेन (Passwords do not match)', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      const activeId = profile?.userId || authUser?.id || 'USR-35400';
      const result = changeAccountPassword(activeId, currentPassword, newPassword);

      if (result.success) {
        setPasswordMsg({ text: result.message, type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ text: result.message, type: 'error' });
      }
      setIsChangingPassword(false);
    }, 400);
  };

  const handleSelectLang = (code: AppLanguageCode) => {
    setSelectedLanguage(code);
    setAppLanguage(code);
    setLangToast(true);
    setTimeout(() => setLangToast(false), 2500);
  };

  const handleUnblock = (userId: string, name: string) => {
    const updated = unblockUser(userId);
    setBlockedUsers(updated);
    setUnblockedToast(`${name} लाई अनब्लक गरियो!`);
    setTimeout(() => setUnblockedToast(null), 3000);
  };

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
          'tiktop_user_privacy_settings',
          'tiktop_blocked_users_list',
          'tiktop_app_selected_language',
          'tiktop_user_following_ids',
          'tiktop_user_followers_ids',
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
      setTimeout(() => setCacheClearSuccess(false), 4000);
    }, 600);
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
    if (onLogout) onLogout();
  };

  const handleSwitchToLogin = () => {
    onClose();
    if (onSwitchAccount) onSwitchAccount('login');
    else if (onLogout) onLogout();
  };

  const handleSwitchToSignup = () => {
    onClose();
    if (onSwitchAccount) onSwitchAccount('signup');
    else if (onLogout) onLogout();
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="app-settings-modal-card"
        className="w-full max-w-xl bg-neutral-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                Settings & Privacy (सेटिङ र गोपनीयता)
              </h2>
              <p className="text-[11px] text-neutral-400">
                पासवर्ड, गोपनीयता, भाषा, ब्लक सूची तथा खाता व्यवस्थापन
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors cursor-pointer"
            title="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher - Horizontal Scrollable Pill Navigation with Nepali & English titles */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-neutral-950/50 border-b border-white/10 overflow-x-auto scrollbar-none">
          {/* Tab 1: Privacy & Password */}
          <button
            type="button"
            id="tab-btn-settings-privacy"
            onClick={() => setActiveTab('privacy')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock size={13} />
            <span>गोपनीयता र पासवर्ड</span>
          </button>

          {/* Tab 2: Language */}
          <button
            type="button"
            id="tab-btn-settings-language"
            onClick={() => setActiveTab('language')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'language'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe size={13} />
            <span>भाषा (Language)</span>
          </button>

          {/* Tab 3: Block List */}
          <button
            type="button"
            id="tab-btn-settings-blocklist"
            onClick={() => setActiveTab('blocklist')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'blocklist'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserX size={13} />
            <span>ब्लक सूची ({blockedUsers.length})</span>
          </button>

          {/* Tab 4: Wallet */}
          <button
            type="button"
            id="tab-btn-settings-wallet"
            onClick={() => setActiveTab('wallet')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'wallet'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins size={13} />
            <span>वालेट</span>
          </button>

          {/* Tab 5: Account & Auth */}
          <button
            type="button"
            id="tab-btn-settings-account"
            onClick={() => setActiveTab('account')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'account'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={13} />
            <span>खाता (Auth)</span>
          </button>

          {/* Tab 6: About Us */}
          <button
            type="button"
            id="tab-btn-settings-about"
            onClick={() => setActiveTab('about')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'about'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Info size={13} />
            <span>हाम्रो बारेमा</span>
          </button>

          {/* Tab 7: Permissions & Cache */}
          <button
            type="button"
            id="tab-btn-settings-permissions"
            onClick={() => setActiveTab('permissions')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'permissions'
                ? 'bg-neutral-700 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={13} />
            <span>अनुमति र क्यास</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* =================================================================== */}
          {/* TAB 1: PRIVACY & VISIBILITY & PASSWORD CHANGE (User Explicit Ask)   */}
          {/* =================================================================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {privacySavedMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>गोपनीयता सेटिङ सुरक्षित गरियो! (Privacy updated)</span>
                </div>
              )}

              {/* 1. Visibility Controls (अरुले हेर्न सक्ने वा नसक्ने बनाउने विकल्प) */}
              <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    दृश्यता तथा गोपनीयता (List Visibility Controls)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300">
                  तपाईंको Following, Followers र मन परेका भिडियोहरू अरुले हेर्न पाउने वा नपाउने यहाँबाट नियन्त्रण गर्नुहोस्:
                </p>

                {/* A. Following List Visibility */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">फलो गरेको सूची (Following List)</span>
                    <span className="text-[10px] text-neutral-400">कसले हेर्न पाउने?</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdatePrivacy({ followingVisibility: 'everyone' })}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        privacy.followingVisibility === 'everyone'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Globe size={13} />
                      <span>सबैले (Everyone)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePrivacy({ followingVisibility: 'followers' })}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        privacy.followingVisibility === 'followers'
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Users size={13} />
                      <span>फलोअर्स मात्र</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePrivacy({ followingVisibility: 'only_me' })}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        privacy.followingVisibility === 'only_me'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Lock size={13} />
                      <span>म मात्र (गोप्य)</span>
                    </button>
                  </div>
                </div>

                {/* B. Followers List Visibility */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">फलोअरहरूको सूची (Followers List)</span>
                    <span className="text-[10px] text-neutral-400">कसले हेर्न पाउने?</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdatePrivacy({ followersVisibility: 'everyone' })}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        privacy.followersVisibility === 'everyone'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Globe size={13} />
                      <span>सबैले (Everyone)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePrivacy({ followersVisibility: 'followers' })}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        privacy.followersVisibility === 'followers'
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Users size={13} />
                      <span>फलोअर्स मात्र</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePrivacy({ followersVisibility: 'only_me' })}
                      className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        privacy.followersVisibility === 'only_me'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Lock size={13} />
                      <span>म मात्र (गोप्य)</span>
                    </button>
                  </div>
                </div>

                {/* C. Liked Videos Visibility */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">मन परेका भिडियोहरू (Liked Videos)</span>
                    <span className="text-[10px] text-neutral-400">कसले हेर्न पाउने?</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdatePrivacy({ likesVisibility: 'everyone' })}
                      className={`py-2 px-3 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        privacy.likesVisibility === 'everyone'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Globe size={13} />
                      <span>सबैले हेर्न पाउने (Public)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePrivacy({ likesVisibility: 'only_me' })}
                      className={`py-2 px-3 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        privacy.likesVisibility === 'only_me'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Lock size={13} />
                      <span>म मात्र (Private / गोप्य)</span>
                    </button>
                  </div>
                </div>

                {/* D. Private Account Toggle */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">निजी खाता (Private Account)</span>
                    <span className="text-[10px] text-neutral-400 block max-w-[280px]">
                      निजी खाता खोल्दा तपाईंले स्वीकार गरेका साथीहरूले मात्र तपाईंको पोस्ट तथा गतिविधि हेर्न पाउँछन्।
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdatePrivacy({ privateAccount: !privacy.privateAccount })}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      privacy.privateAccount ? 'bg-rose-500' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${
                        privacy.privateAccount ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 2. Password Change Section (User Explicit Ask: password change) */}
              <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    पासवर्ड परिवर्तन गर्नुहोस् (Change Password)
                  </span>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-1">
                  {/* Old Password */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      हालको पासवर्ड (Current Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="पुरानो पासवर्ड प्रविष्ट गर्नुहोस्..."
                        className="w-full pl-3 pr-9 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      नयाँ पासवर्ड (New Password - Minimum 6 chars)
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="कम्तिमा ६ अक्षरको नयाँ पासवर्ड..."
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      नयाँ पासवर्ड पुष्टि गर्नुहोस् (Confirm New Password)
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="नयाँ पासवर्ड पुनः प्रविष्ट गर्नुहोस्..."
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {passwordMsg && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        passwordMsg.type === 'success'
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {passwordMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPassword || !newPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound size={14} />
                    <span>{isChangingPassword ? 'परिवर्तन हुँदैछ...' : 'पासवर्ड अपडेट गर्नुहोस् (Update Password)'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 2: LANGUAGE (भाषा परिवर्तन - User Explicit Ask)                   */}
          {/* =================================================================== */}
          {activeTab === 'language' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-sky-950/30 border border-sky-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5 text-sky-400 font-bold text-xs">
                  <Globe size={16} />
                  <span>एपको भाषा चयन (Select App Language)</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  आफ्नो अनुकूल भाषा छान्नुहोस्। मेनु, बटन तथा सूचनाहरू छानिएको भाषामा प्रस्तुत हुनेछन्।
                </p>
              </div>

              {langToast && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>भाषा सफलतापूर्वक चयन गरियो!</span>
                </div>
              )}

              <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-3 space-y-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <div
                      key={lang.code}
                      onClick={() => handleSelectLang(lang.code)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500/50 text-white'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <span className="text-xs font-bold block">{lang.nativeName}</span>
                          <span className="text-[10px] text-neutral-400">{lang.label}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 3: BLOCK LIST (ब्लक सूची - User Explicit Ask)                   */}
          {/* =================================================================== */}
          {activeTab === 'blocklist' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1 text-red-400 font-bold text-xs">
                  <UserX size={16} />
                  <span>ब्लक गरिएका प्रयोगकर्ताहरू (Blocked Accounts)</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  ब्लक गरिएका व्यक्तिहरूले तपाईंको प्रोफाइल, लाइभ स्ट्रिम हेर्न वा सन्देश पठाउन सक्ने छैनन्।
                </p>
              </div>

              {unblockedToast && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{unblockedToast}</span>
                </div>
              )}

              <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-xs font-bold text-neutral-300">
                    कालोसूचीमा रहेका खाताहरू ({blockedUsers.length})
                  </span>
                </div>

                {blockedUsers.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    <UserX size={32} className="mx-auto mb-2 opacity-30" />
                    <p>कुनै पनि प्रयोगकर्ता ब्लक गरिएको छैन।</p>
                  </div>
                ) : (
                  blockedUsers.map((bUser) => (
                    <div
                      key={bUser.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                          src={bUser.avatar}
                          alt={bUser.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-white block truncate">{bUser.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono block truncate">{bUser.handle}</span>
                          <span className="text-[9px] text-rose-300 block truncate mt-0.5">कारण: {bUser.reason}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUnblock(bUser.id, bUser.name)}
                        className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 border border-white/15 text-xs font-bold text-white transition-all shrink-0 active:scale-95"
                      >
                        अनब्लक
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 4: ABOUT US (हाम्रो बारेमा - User Explicit Ask)                 */}
          {/* =================================================================== */}
          {activeTab === 'about' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* App Brand Header */}
              <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-rose-950/40 border border-white/15 rounded-2xl p-5 text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-rose-600/30">
                  <Radio size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">TikTop LIVE Nepal</h3>
                  <span className="text-xs text-rose-400 font-mono font-bold">Version 2.4.2 (Official Build)</span>
                </div>
                <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed pt-1">
                  नेपाली तथा अन्तर्राष्ट्रिय समुदायका लागि सुरक्षित, मनोरञ्जनात्मक र तीव्र प्रत्यक्ष प्रसारण (Live Streaming) तथा अडियो-भिडियो प्लेटफर्म। 🇳🇵
                </p>
              </div>

              {/* Legal and Guidelines Links */}
              <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-white block">नियम तथा सुरक्षा (Guidelines & Policy)</span>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <Shield size={14} />
                    <span>समुदाय निर्देशिका (Community Guidelines)</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    घृणास्पद अभिव्यक्ति, हिंसा, नक्कली खाता तथा ठगी कार्यहरू पूर्णतः निषेधित छन्। यस्ता गतिविधिमा संलग्न आइडी तुरुन्त बन्द गरिनेछ।
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <FileText size={14} />
                    <span>सेवाका सर्तहरू (Terms of Service)</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    वालेट रिचार्ज, उपहार (Gifts) आदानप्रदान तथा Points निकासी नेपालको प्रचलित कानुन र प्लेटफर्मको नीति अनुसार सञ्चालन हुन्छ।
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <Lock size={14} />
                    <span>गोपनीयता नीति (Privacy Policy)</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    प्रयोगकर्ताको व्यक्तिगत विवरण तथा सुरक्षा इन्क्रिप्सन मार्फत सुरक्षित राखिन्छ। कुनै तेस्रो पक्षसँग डेटा साझा गरिँदैन।
                  </p>
                </div>
              </div>

              {/* Developer & Support Contact */}
              <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">आधिकारिक सहयोग (Official Support)</span>
                  <span className="text-[10px] text-neutral-400 block font-mono">support@tiktop.live</span>
                </div>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-full border border-rose-500/30">
                  २४/७ सहायता
                </span>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 5: WALLET (सिक्का तथा अंक मौज्दात)                              */}
          {/* =================================================================== */}
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
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-black text-xs shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1 cursor-pointer"
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
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-xs shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1 cursor-pointer"
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

              {/* Restricted Admin Finance Console */}
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
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 6: ACCOUNT & LOGIN / LOGOUT                                     */}
          {/* =================================================================== */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Active Profile Card */}
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

              {/* Login & Logout Actions */}
              <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-white block">
                  लगइन तथा लगआउट विकल्पहरू (Login & Logout Options)
                </span>

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
                              <span className="text-xs font-bold text-white block truncate">{acc.name}</span>
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
                              className="shrink-0 text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg border border-white/15 transition-all cursor-pointer"
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

          {/* =================================================================== */}
          {/* TAB 7: PERMISSIONS & CACHE (हार्डवेयर र क्यास)                      */}
          {/* =================================================================== */}
          {activeTab === 'permissions' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-sky-950/30 border border-sky-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 text-sky-400 font-bold text-xs">
                  <ShieldCheck size={16} />
                  <span>हार्डवेयर अनुमति स्थिति (Device Permissions Status)</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  लाइभ स्ट्रिमिङ तथा भिडियो रेकर्डिङका लागि क्यामेरा र माइक्रोफोन अनुमति नियन्त्रण गर्नुहोस्।
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
                  className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
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
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-neutral-950/70 flex items-center justify-between text-xs text-neutral-400">
          <span>TikTop Settings & Security v2.4.2</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-white hover:text-neutral-300 cursor-pointer"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
