import React, { useState, useEffect } from 'react';
import {
  Radio,
  Smartphone,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  LogIn,
  UserPlus,
  ChevronRight,
  KeyRound,
  X,
} from 'lucide-react';
import { AuthUser, UserProfile, RegisteredAccount } from '../types';
import {
  getRegisteredAccounts,
  saveRegisteredAccount,
  findAccountByGoogleEmail,
  findAccountByFacebookName,
  findAccountByPhone,
  findAccountByIdOrHandle,
  accountToAuthAndProfile,
} from '../utils/authDb';

interface AuthScreenProps {
  onAuthSuccess: (authUser: AuthUser, userProfile: UserProfile) => void;
  initialMode?: 'signup' | 'login';
  onDismissOrSkip?: () => void;
}

interface CountryDial {
  code: string;
  name: string;
  flag: string;
  dial: string;
}

const COUNTRY_DIALS: CountryDial[] = [
  { code: 'NP', name: 'नेपाल (Nepal)', flag: '🇳🇵', dial: '+977' },
  { code: 'IN', name: 'भारत (India)', flag: '🇮🇳', dial: '+91' },
  { code: 'US', name: 'USA / Canada', flag: '🇺🇸', dial: '+1' },
  { code: 'AE', name: 'UAE / Dubai', flag: '🇦🇪', dial: '+971' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dial: '+974' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dial: '+60' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dial: '+966' },
  { code: 'GB', name: 'UK', flag: '🇬🇧', dial: '+44' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dial: '+81' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dial: '+61' },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  initialMode = 'signup',
  onDismissOrSkip,
}) => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>(initialMode);
  const [activeProviderModal, setActiveProviderModal] = useState<'google' | 'facebook' | 'phone' | 'email' | null>(null);

  // Phone Form states
  const [phoneCountry, setPhoneCountry] = useState<CountryDial>(COUNTRY_DIALS[0]);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phonePassword, setPhonePassword] = useState<string>('');
  const [phoneUserName, setPhoneUserName] = useState<string>('');
  const [showPhonePassword, setShowPhonePassword] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [incomingSmsBanner, setIncomingSmsBanner] = useState<string | null>(null);

  // Google Modal State
  const [googleEmail, setGoogleEmail] = useState<string>('tartumling354@gmail.com');
  const [googleName, setGoogleName] = useState<string>(() => {
    try {
      const customName = localStorage.getItem('tiktop_custom_user_name');
      if (customName && customName.trim().length > 0) {
        return customName.trim();
      }
    } catch {
      // Ignore
    }
    return 'tar tumling';
  });
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState<boolean>(false);

  // Facebook Modal State
  const [fbName, setFbName] = useState<string>('Nepal Live Star');

  // Email state
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [emailPassword, setEmailPassword] = useState<string>('');
  const [emailFullName, setEmailFullName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Loading & alerts
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  // Post-Signup ID Creation Modal / Celebration
  const [createdUser, setCreatedUser] = useState<{ authUser: AuthUser; userProfile: UserProfile } | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Registered accounts in storage
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>([]);
  const [directIdInput, setDirectIdInput] = useState<string>('');

  // Load registered accounts on mount
  useEffect(() => {
    setRegisteredAccounts(getRegisteredAccounts());
  }, []);

  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  // Generate a random unique TikTop ID: e.g. USR-58291
  const generateUniqueUserId = (): string => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `USR-${randomDigits}`;
  };

  // Helper to complete registration (Sign Up)
  const completeRegistration = (
    provider: 'google' | 'facebook' | 'phone' | 'email',
    name: string,
    handle: string,
    avatar: string,
    extra?: { email?: string; phone?: string; password?: string }
  ) => {
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessNotice('');

    setTimeout(() => {
      setIsProcessing(false);
      const generatedId = generateUniqueUserId();

      const newAccount: RegisteredAccount = {
        id: generatedId,
        name: name.trim() || 'TikTop User',
        handle: handle.startsWith('@') ? handle : `@${handle.toLowerCase().replace(/\s+/g, '_')}`,
        avatar,
        bio: 'TikTop Creator • Welcome to my Live streams and videos! 🌟',
        email: extra?.email?.trim(),
        phone: extra?.phone?.trim(),
        password: extra?.password?.trim(),
        provider,
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage DB
      const updated = saveRegisteredAccount(newAccount);
      setRegisteredAccounts(updated);

      const { authUser, userProfile } = accountToAuthAndProfile(newAccount);

      try {
        localStorage.removeItem('tiktop_is_logged_out');
        localStorage.setItem('tiktop_auth_user', JSON.stringify(authUser));
        localStorage.setItem('tiktop_user_profile', JSON.stringify(userProfile));
        localStorage.setItem('tiktop_last_active_user_id', authUser.id);
      } catch {}

      // Show celebration card with generated ID and Welcome Bonus
      setCreatedUser({ authUser, userProfile });
    }, 800);
  };

  // Helper to directly log in with an existing registered account
  const executeLogin = (account: RegisteredAccount) => {
    setIsProcessing(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsProcessing(false);
      const { authUser, userProfile } = accountToAuthAndProfile(account);
      try {
        localStorage.removeItem('tiktop_is_logged_out');
        localStorage.setItem('tiktop_auth_user', JSON.stringify(authUser));
        localStorage.setItem('tiktop_user_profile', JSON.stringify(userProfile));
        localStorage.setItem('tiktop_last_active_user_id', authUser.id);
      } catch {}
      onAuthSuccess(authUser, userProfile);
    }, 600);
  };

  // Direct ID Login handler
  const handleDirectIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = directIdInput.trim();
    if (!query) return;

    const matched = findAccountByIdOrHandle(query);
    if (matched) {
      executeLogin(matched);
    } else {
      // If not in registered list, create/restore account with this exact ID so user can log in with their ID
      const restoredAccount: RegisteredAccount = {
        id: query.toUpperCase(),
        name: `TikTop User ${query.toUpperCase()}`,
        handle: `@${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'TikTop Creator 🌟',
        provider: 'phone',
        createdAt: new Date().toISOString(),
      };
      saveRegisteredAccount(restoredAccount);
      executeLogin(restoredAccount);
    }
  };

  // ==========================================
  // 1. GOOGLE AUTH (Sign Up & Log In)
  // ==========================================
  const handleGoogleSignUp = (chosenEmail?: string, chosenName?: string) => {
    const emailToUse = (chosenEmail || googleEmail).trim().toLowerCase();
    const nameToUse = (chosenName || googleName).trim() || 'Google Creator';

    // Validate email
    if (!emailToUse.includes('@') || !emailToUse.includes('.')) {
      setErrorMessage('कृपया मान्य Google इमेल ठेगाना प्रविष्ट गर्नुहोस् (@gmail.com)।');
      return;
    }

    // Check if Google account already exists
    const existing = findAccountByGoogleEmail(emailToUse);
    if (existing) {
      setErrorMessage(`⚠️ यो Google खाता (${emailToUse}) पहिल्यै दर्ता भइसकेको छ! कृपया 'लगइन' गर्नुहोस्।`);
      return;
    }

    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
    const rawHandle = nameToUse.toLowerCase().replace(/[^a-z0-9]/g, '') || emailToUse.split('@')[0];
    completeRegistration('google', nameToUse, `@${rawHandle}`, defaultAvatar, { email: emailToUse });
  };

  const handleGoogleLogin = (chosenEmail?: string) => {
    const emailToUse = (chosenEmail || googleEmail).trim().toLowerCase();

    if (!emailToUse.includes('@')) {
      setErrorMessage('कृपया मान्य Google इमेल प्रविष्ट गर्नुहोस्।');
      return;
    }

    // STRICT CHECK: "सही Google account राखेको भए मात्र Id login हुनु पर्छ"
    const existing = findAccountByGoogleEmail(emailToUse);
    if (!existing) {
      setErrorMessage(
        `⚠️ '${emailToUse}' Google खाता दर्ता भएको छैन! पहिले 'खाता बनाउनुहोस् (Sign Up)' मा गएर खाता खोल्नुहोस्।`
      );
      return;
    }

    // Valid account found -> Log In!
    executeLogin(existing);
  };

  // ==========================================
  // 2. FACEBOOK AUTH (Sign Up & Log In)
  // ==========================================
  const handleFacebookSignUp = () => {
    const nameToUse = fbName.trim();
    if (!nameToUse || nameToUse.length < 2) {
      setErrorMessage('कृपया आफ्नो Facebook नाम प्रविष्ट गर्नुहोस्।');
      return;
    }

    const existing = findAccountByFacebookName(nameToUse);
    if (existing) {
      setErrorMessage(`⚠️ Facebook खाता '${nameToUse}' पहिल्यै दर्ता छ! कृपया लगइन गर्नुहोस्।`);
      return;
    }

    const fbAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';
    const rawHandle = nameToUse.toLowerCase().replace(/[^a-z0-9]/g, '') || 'fb_user';
    completeRegistration('facebook', nameToUse, `@${rawHandle}`, fbAvatar);
  };

  const handleFacebookLogin = (name?: string) => {
    const nameToUse = (name || fbName).trim();
    if (!nameToUse) {
      setErrorMessage('कृपया Facebook नाम प्रविष्ट गर्नुहोस्।');
      return;
    }

    // STRICT CHECK: Facebook account must exist in registered DB
    const existing = findAccountByFacebookName(nameToUse);
    if (!existing) {
      setErrorMessage(`⚠️ Facebook खाता '${nameToUse}' फेला परेन! कृपया पहिले साइनअप गर्नुहोस्।`);
      return;
    }

    executeLogin(existing);
  };

  // ==========================================
  // 3. MOBILE NUMBER + PASSWORD AUTH
  // ==========================================
  // Sign Up with Phone + Password
  const handlePhoneSignUp = () => {
    const rawPhone = phoneNumber.trim();
    if (!rawPhone || rawPhone.length < 6) {
      setErrorMessage('कृपया मान्य मोबाइल नम्बर प्रविष्ट गर्नुहोस्।');
      return;
    }

    const fullPhone = `${phoneCountry.dial} ${rawPhone}`;

    // Validate Password
    if (!phonePassword || phonePassword.length < 4) {
      setErrorMessage('नयाँ पासवर्ड कम्तीमा ४ देखि ६ अक्षरको हुनुपर्छ।');
      return;
    }

    // Check if phone already registered
    const existing = findAccountByPhone(fullPhone);
    if (existing) {
      setErrorMessage(`⚠️ यो मोबाइल नम्बर (${fullPhone}) पहिल्यै दर्ता छ! कृपया पासवर्ड राखेर 'लगइन' गर्नुहोस्।`);
      return;
    }

    const name = phoneUserName.trim() || `User ${rawPhone.slice(-4)}`;
    const handle = `@user_${rawPhone.slice(-4)}`;
    const phoneAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

    completeRegistration('phone', name, handle, phoneAvatar, {
      phone: fullPhone,
      password: phonePassword.trim(),
    });
  };

  // Log In with Phone + Password
  const handlePhoneLogin = () => {
    const rawPhone = phoneNumber.trim();
    if (!rawPhone || rawPhone.length < 6) {
      setErrorMessage('कृपया दर्ता भएको मोबाइल नम्बर प्रविष्ट गर्नुहोस्।');
      return;
    }

    if (!phonePassword.trim()) {
      setErrorMessage('कृपया तपाईंको खाताको पासवर्ड प्रविष्ट गर्नुहोस्।');
      return;
    }

    const fullPhone = `${phoneCountry.dial} ${rawPhone}`;

    // STRICT CHECK: "number वाट login गर्न चाहेको खण्डमा password पनि राख्नु पर्ने व्यवस्था मिलाउनु"
    const existing = findAccountByPhone(fullPhone);

    if (!existing) {
      setErrorMessage(
        `⚠️ मोबाइल नम्बर '${fullPhone}' दर्ता भएको छैन! कृपया पहिले 'खाता बनाउनुहोस् (Sign Up)' मा जानुहोस्।`
      );
      return;
    }

    // Check Password match
    if (existing.password && existing.password !== phonePassword.trim()) {
      setErrorMessage('❌ गलत पासवर्ड! कृपया सही पासवर्ड प्रविष्ट गर्नुहोस्।');
      return;
    }

    // Valid number & password -> Log In!
    executeLogin(existing);
  };

  // Send simulated SMS OTP
  const handleSendOtp = () => {
    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setErrorMessage('कृपया मान्य मोबाइल नम्बर प्रविष्ट गर्नुहोस्');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);

      setIncomingSmsBanner(`📩 TikTop SMS: तपाईंको प्रमाणीकरण कोड (OTP) ${code} हो।`);
      setTimeout(() => {
        setIncomingSmsBanner(null);
      }, 9000);
    }, 700);
  };

  // ==========================================
  // 4. EMAIL & PASSWORD AUTH
  // ==========================================
  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress.includes('@')) {
      setErrorMessage('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्।');
      return;
    }
    if (emailPassword.length < 4) {
      setErrorMessage('पासवर्ड कम्तीमा ४ अक्षरको हुनुपर्छ।');
      return;
    }

    if (authMode === 'signup') {
      const existing = findAccountByGoogleEmail(emailAddress);
      if (existing) {
        setErrorMessage('यो इमेल पहिल्यै दर्ता भइसकेको छ। कृपया लगइन गर्नुहोस्।');
        return;
      }
      const name = emailFullName.trim() || emailAddress.split('@')[0];
      const handle = `@${emailAddress.split('@')[0].replace(/[^a-z0-9]/gi, '_')}`;
      const avatar = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80';
      completeRegistration('email', name, handle, avatar, {
        email: emailAddress,
        password: emailPassword,
      });
    } else {
      const existing = findAccountByGoogleEmail(emailAddress);
      if (!existing) {
        setErrorMessage('यो इमेल दर्ता भएको छैन। कृपया पहिले साइनअप गर्नुहोस्।');
        return;
      }
      if (existing.password && existing.password !== emailPassword) {
        setErrorMessage('❌ गलत पासवर्ड! कृपया सही पासवर्ड प्रविष्ट गर्नुहोस्।');
        return;
      }
      executeLogin(existing);
    }
  };

  // User confirms celebration card and enters the app
  const handleEnterApp = () => {
    if (!createdUser) return;
    onAuthSuccess(createdUser.authUser, createdUser.userProfile);
  };

  return (
    <div
      id="auth-screen-container"
      className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto"
    >
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Simulated SMS Notification Popup */}
      {incomingSmsBanner && (
        <div
          id="sms-notification-banner"
          onClick={() => {
            if (generatedOtp) setEnteredOtp(generatedOtp);
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-11/12 max-w-sm bg-neutral-900/95 border border-amber-500/50 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-bounce cursor-pointer flex items-center justify-between gap-2"
        >
          <div className="text-xs">
            <span className="font-black text-amber-400 block flex items-center gap-1">
              <span>📩 TikTop SMS (नयाँ सन्देश)</span>
            </span>
            <span className="text-[11px] text-neutral-200">{incomingSmsBanner}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (generatedOtp) setEnteredOtp(generatedOtp);
              setIncomingSmsBanner(null);
            }}
            className="shrink-0 text-[10px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black px-2.5 py-1 rounded-lg shadow"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* Quick Direct App Access / Skip Button */}
      {onDismissOrSkip && (
        <div className="w-full max-w-md flex items-center justify-between z-20 mb-2 mt-1">
          <button
            type="button"
            id="btn-skip-to-app-top"
            onClick={onDismissOrSkip}
            className="flex items-center gap-1.5 text-xs bg-rose-600/90 hover:bg-rose-500 text-white font-black px-3.5 py-1.5 rounded-full border border-white/20 transition-all active:scale-95 shadow-lg"
          >
            <span>📱 सिधै TikTop एपमा जानुहोस् (Enter App Directly)</span>
          </button>
          <button
            type="button"
            id="btn-close-auth-screen"
            onClick={onDismissOrSkip}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
            title="फर्कनुहोस् (Close)"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Brand Header */}
      <div className="w-full max-w-md flex flex-col items-center text-center mt-2 sm:mt-4 shrink-0 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 ring-4 ring-white/10 mb-2.5 animate-pulse">
          <Radio size={28} />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">TikTop</h1>
          <span className="bg-rose-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest text-white shadow">
            LIVE
          </span>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xs font-medium">
          {authMode === 'signup'
            ? 'पहिलो पटक प्रयोग गर्दा नयाँ खाता (Sign Up) सिर्जना गर्नुहोस्'
            : 'पहिले दर्ता भएको खातामा सुरक्षित लगइन (Log In) गर्नुहोस्'}
        </p>

        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-300 font-bold">
          <ShieldCheck size={14} className="text-rose-400" />
          <span>सुरक्षित खाता प्रमाणीकरण (Verified Authentication)</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-neutral-900/95 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative z-10 my-3">
        {/* Two-Tab Navigation: Sign Up vs Log In */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 mb-4 text-xs font-black">
          <button
            type="button"
            id="tab-btn-signup"
            onClick={() => {
              setAuthMode('signup');
              setActiveProviderModal(null);
              setErrorMessage('');
              setSuccessNotice('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'signup'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus size={14} />
            <span>खाता बनाउनुहोस् (Sign Up)</span>
          </button>
          <button
            type="button"
            id="tab-btn-login"
            onClick={() => {
              setAuthMode('login');
              setActiveProviderModal(null);
              setErrorMessage('');
              setSuccessNotice('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LogIn size={14} />
            <span>लगइन (Log In)</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Provider Selection View */}
        {!activeProviderModal ? (
          <div className="space-y-3">
            {authMode === 'login' && (
              <form
                onSubmit={handleDirectIdSubmit}
                className="p-3 bg-amber-500/10 border border-amber-500/35 rounded-2xl space-y-2 mb-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <KeyRound size={13} className="text-amber-400" />
                    <span>TikTop ID बाट सिधै लगइन (ID Login):</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">एक पटक लगइन गरे पुग्छ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    id="input-direct-id-login"
                    value={directIdInput}
                    onChange={(e) => setDirectIdInput(e.target.value)}
                    placeholder="तपाईंको TikTop ID (उदा. USR-12345)"
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    id="btn-submit-direct-id-login"
                    disabled={!directIdInput.trim() || isProcessing}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow shrink-0"
                  >
                    लगइन
                  </button>
                </div>
              </form>
            )}

            <span className="text-xs font-bold text-neutral-300 block mb-1">
              {authMode === 'signup'
                ? 'माध्यम छनोट गर्नुहोस् (Choose Registration Method):'
                : 'वा अन्य माध्यमबाट लगइन गर्नुहोस् (Other Login Methods):'}
            </span>

            {/* 1. Google Button */}
            <button
              type="button"
              id="btn-auth-google"
              onClick={() => {
                setActiveProviderModal('google');
                setErrorMessage('');
              }}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 shadow-md"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {authMode === 'signup'
                    ? 'Google खाता छनोट गरी खाता खोल्नुहोस्'
                    : 'Google खाता छनोट गरी लगइन गर्नुहोस्'}
                </span>
              </div>
              <ChevronRight size={16} className="text-neutral-500" />
            </button>

            {/* 2. Mobile Number + Password Button */}
            <button
              type="button"
              id="btn-auth-phone"
              onClick={() => {
                setActiveProviderModal('phone');
                setErrorMessage('');
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 shadow-md"
            >
              <div className="flex items-center gap-3">
                <Smartphone size={18} />
                <span>
                  {authMode === 'signup'
                    ? 'मोबाइल नम्बर र पासवर्डबाट खाता बनाउनुहोस्'
                    : 'नम्बर र पासवर्डबाट लगइन गर्नुहोस्'}
                </span>
              </div>
              <KeyRound size={16} className="text-emerald-200" />
            </button>

            {/* 3. Facebook Button */}
            <button
              type="button"
              id="btn-auth-facebook"
              onClick={() => {
                setActiveProviderModal('facebook');
                setErrorMessage('');
              }}
              className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 shadow-md"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>
                  {authMode === 'signup'
                    ? 'Facebook मार्फत खाता बनाउनुहोस्'
                    : 'Facebook मार्फत लगइन गर्नुहोस्'}
                </span>
              </div>
              <ChevronRight size={16} className="text-blue-200" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                अथवा
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* 4. Email Option */}
            <button
              type="button"
              id="btn-auth-email-toggle"
              onClick={() => {
                setActiveProviderModal('email');
                setErrorMessage('');
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Mail size={15} className="text-amber-400" />
              <span>इमेल ठेगाना प्रयोग गर्नुहोस् (Email Address)</span>
            </button>
          </div>
        ) : null}

        {/* ========================================== */}
        {/* GOOGLE ACCOUNT CHOOSER DIALOG              */}
        {/* ========================================== */}
        {activeProviderModal === 'google' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {authMode === 'signup' ? 'Google खाता छनोट (Sign Up)' : 'Google खाता छनोट (Log In)'}
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    {authMode === 'signup'
                      ? 'नयाँ खाता बनाउन Google ID छनोट गर्नुहोस्'
                      : 'दर्ता भएको सही Google खाता छनोट गर्नुहोस्'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveProviderModal(null)}
                className="text-[11px] text-neutral-400 hover:text-white"
              >
                पछाडि
              </button>
            </div>

            {/* List of Detected / Registered Google Accounts */}
            <div className="space-y-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block">
                {authMode === 'signup' ? 'उपलब्ध Google खाताहरू:' : 'दर्ता भएका Google खाताहरू:'}
              </span>

              {/* Render all registered Google accounts dynamically so edited names like "tar tumling" reflect here */}
              {registeredAccounts
                .filter((acc) => acc.provider === 'google')
                .map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => {
                      if (authMode === 'signup') {
                        handleGoogleSignUp(acc.email, acc.name);
                      } else {
                        handleGoogleLogin(acc.email);
                      }
                    }}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 cursor-pointer flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white shadow">
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-white block group-hover:text-amber-300">
                          {acc.name}
                        </span>
                        <span className="text-[11px] text-neutral-400 block font-mono">
                          {acc.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-full border border-rose-500/30">
                      {authMode === 'signup' ? 'यो खाता छनोट गर्नुहोस्' : 'लगइन गर्नुहोस्'}
                    </span>
                  </div>
                ))}
            </div>

            {/* Manual Google Account Input Option */}
            <div className="pt-2 border-t border-white/10">
              {!showCustomGoogleInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-[11px] text-neutral-300 hover:text-white font-bold transition-all text-center"
                >
                  + अर्को Google खाता प्रयोग गर्नुहोस् (Use another Google account)
                </button>
              ) : (
                <div className="p-3 bg-neutral-950/80 rounded-2xl border border-white/15 space-y-2.5 animate-fade-in">
                  <span className="text-[11px] font-bold text-neutral-300 block">
                    Google खाता विवरण प्रविष्ट गर्नुहोस्:
                  </span>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">पूरा नाम (Full Name):</label>
                    <input
                      type="text"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      placeholder="उदा: Roshan Adhikari"
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Gmail इमेल (Google Email):</label>
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      if (authMode === 'signup') {
                        handleGoogleSignUp();
                      } else {
                        handleGoogleLogin();
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-black text-xs shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing
                      ? 'प्रक्रिया हुँदैछ...'
                      : authMode === 'signup'
                      ? 'Google खाताबाट नयाँ ID बनाउनुहोस्'
                      : 'Google खाताबाट लगइन गर्नुहोस्'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MOBILE NUMBER + PASSWORD FORM              */}
        {/* ========================================== */}
        {activeProviderModal === 'phone' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {authMode === 'signup' ? 'मोबाइल नम्बर र पासवर्डबाट दर्ता' : 'नम्बर र पासवर्डबाट लगइन'}
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    {authMode === 'signup'
                      ? 'सुरक्षित पासवर्ड सेट गरी नयाँ खाता बनाउनुहोस्'
                      : 'आफ्नो मोबाइल नम्बर र पासवर्ड प्रविष्ट गर्नुहोस्'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveProviderModal(null);
                  setOtpSent(false);
                }}
                className="text-[11px] text-neutral-400 hover:text-white"
              >
                पछाडि
              </button>
            </div>

            <div className="space-y-3">
              {/* Country Selection */}
              <div>
                <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                  देश कोड (Country):
                </label>
                <select
                  value={phoneCountry.code}
                  onChange={(e) => {
                    const found = COUNTRY_DIALS.find((c) => c.code === e.target.value);
                    if (found) setPhoneCountry(found);
                  }}
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {COUNTRY_DIALS.map((c) => (
                    <option key={c.code} value={c.code} className="bg-neutral-900 text-white">
                      {c.flag} {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Number Input */}
              <div>
                <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                  मोबाइल नम्बर (Mobile Number):
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-neutral-950 border border-white/15 rounded-xl text-xs font-mono text-emerald-400 font-bold">
                    {phoneCountry.dial}
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98XXXXXXXX"
                    maxLength={15}
                    className="flex-1 bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Name input (Only for Sign Up) */}
              {authMode === 'signup' && (
                <div>
                  <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                    तपाईंको पूरा नाम (Full Name):
                  </label>
                  <input
                    type="text"
                    value={phoneUserName}
                    onChange={(e) => setPhoneUserName(e.target.value)}
                    placeholder="उदा: Roshan Adhikari"
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* PASSWORD INPUT (MANDATORY for both Sign Up & Log In as requested) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-300 font-bold block">
                    {authMode === 'signup' ? 'नयाँ पासवर्ड सेट गर्नुहोस् (Set Password):' : 'खाताको पासवर्ड (Password):'}
                  </label>
                  <span className="text-[10px] text-neutral-400">कम्तीमा ४ अक्षर</span>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPhonePassword ? 'text' : 'password'}
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl pl-9 pr-9 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhonePassword(!showPhonePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPhonePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              {authMode === 'signup' ? (
                <button
                  type="button"
                  id="btn-signup-phone"
                  disabled={isProcessing || !phoneNumber.trim() || !phonePassword.trim()}
                  onClick={handlePhoneSignUp}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isProcessing ? 'खाता बन्दैछ...' : 'पासवर्ड सहित नयाँ TikTop ID बनाउनुहोस्'}
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-login-phone"
                  disabled={isProcessing || !phoneNumber.trim() || !phonePassword.trim()}
                  onClick={handlePhoneLogin}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isProcessing ? 'लगइन हुँदैछ...' : 'नम्बर र पासवर्डबाट लगइन गर्नुहोस्'}
                  <LogIn size={15} />
                </button>
              )}

              {/* Demo Hint */}
              <div className="p-2.5 bg-neutral-950/60 rounded-xl border border-white/5 text-[10px] text-neutral-400">
                <span className="text-emerald-400 font-bold block mb-0.5">परीक्षणका लागि दर्ता भएको नम्बर:</span>
                <span>नम्बर: <strong className="text-white font-mono">+977 9841234567</strong> • पासवर्ड: <strong className="text-white font-mono">password123</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* FACEBOOK AUTH FORM                         */}
        {/* ========================================== */}
        {activeProviderModal === 'facebook' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {authMode === 'signup' ? 'Facebook मार्फत दर्ता' : 'Facebook मार्फत लगइन'}
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    {authMode === 'signup' ? 'फेसबुक नामबाट नयाँ खाता' : 'दर्ता भएको फेसबुक प्रोफाइल'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveProviderModal(null)}
                className="text-[11px] text-neutral-400 hover:text-white"
              >
                पछाडि
              </button>
            </div>

            <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-white/10 space-y-2">
              <label className="text-[10px] text-neutral-400 block">
                फेसबुक खाता नाम (Facebook Name):
              </label>
              <input
                type="text"
                value={fbName}
                onChange={(e) => setFbName(e.target.value)}
                placeholder="उदा: Nepal Live Star"
                className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1877F2]"
              />

              {/* Registered FB accounts list */}
              {authMode === 'login' && (
                <div className="pt-2">
                  <span className="text-[10px] text-neutral-400 block mb-1">दर्ता भएका फेसबुक प्रोफाइलहरू:</span>
                  <div
                    onClick={() => {
                      setFbName('Nepal Live Star');
                      handleFacebookLogin('Nepal Live Star');
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white">Nepal Live Star</span>
                    <span className="text-[10px] text-blue-400 font-bold">१-ट्याप लगइन</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isProcessing || !fbName.trim()}
              onClick={() => {
                if (authMode === 'signup') {
                  handleFacebookSignUp();
                } else {
                  handleFacebookLogin();
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-xs shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isProcessing
                ? 'प्रक्रिया हुँदैछ...'
                : authMode === 'signup'
                ? 'Facebook बाट TikTop ID बनाउनुहोस्'
                : 'Facebook बाट लगइन गर्नुहोस्'}
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ========================================== */}
        {/* EMAIL & PASSWORD FORM                      */}
        {/* ========================================== */}
        {activeProviderModal === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {authMode === 'signup' ? 'इमेल दर्ता (Sign Up)' : 'इमेल लगइन (Log In)'}
                  </h3>
                  <span className="text-[10px] text-neutral-400">Email & Password Credentials</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveProviderModal(null)}
                className="text-[11px] text-neutral-400 hover:text-white"
              >
                पछाडि
              </button>
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                  पूरा नाम (Full Name):
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={emailFullName}
                    onChange={(e) => setEmailFullName(e.target.value)}
                    placeholder="उदा: Sandeep Lama"
                    className="w-full bg-neutral-950 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                इमेल ठेगाना (Email Address):
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-300 font-bold block mb-1">
                पासवर्ड (Password):
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-white/15 rounded-xl pl-9 pr-9 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing
                ? 'प्रमाणीकरण हुँदैछ...'
                : authMode === 'signup'
                ? 'इमेलबाट TikTop ID सिर्जना गर्नुहोस्'
                : 'लगइन गर्नुहोस्'}
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* Quick Registered Accounts on this device */}
        {registeredAccounts.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-white/10">
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block text-center mb-2">
              ⚡ यस उपकरणमा दर्ता भएका खाताहरू (Saved Accounts):
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {registeredAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => executeLogin(acc)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer flex items-center justify-between transition-all group"
                  title="यस खातामा १-ट्याप लगइन गर्नुहोस्"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-7 h-7 rounded-full object-cover border border-rose-500/40 shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-neutral-200 group-hover:text-white block truncate">
                        {acc.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 block font-mono truncate">
                        {acc.email || acc.phone || acc.handle}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      ID: {acc.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-neutral-500 pb-2 relative z-10">
        TikTop Live Streaming • 100% Verified Authentication System
      </div>

      {/* ========================================== */}
      {/* CELEBRATION MODAL (First time ID creation) */}
      {/* ========================================== */}
      {createdUser && (
        <div
          id="auth-celebration-backdrop"
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            id="auth-celebration-card"
            className="w-full max-w-sm bg-neutral-900 border border-amber-500/50 rounded-3xl p-6 text-center text-white shadow-2xl space-y-4 animate-scale-in relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 mx-auto flex items-center justify-center text-neutral-950 font-black shadow-xl shadow-amber-500/30 animate-bounce">
              <Sparkles size={32} />
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 block mb-1">
                🎉 खाता सफलतापूर्वक बन्यो!
              </span>
              <h3 className="text-lg font-black text-white">तपाईंको नयाँ TikTop ID तयार भयो</h3>
            </div>

            {/* User ID Card */}
            <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-amber-500/40 rounded-2xl p-4 space-y-2">
              <img
                src={createdUser.authUser.avatar}
                alt={createdUser.authUser.name}
                className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-400 shadow-md"
              />
              <h4 className="text-base font-black text-white">{createdUser.authUser.name}</h4>
              <span className="text-xs text-neutral-400 block">{createdUser.authUser.handle}</span>

              {/* ID Pill */}
              <div className="pt-2 flex items-center justify-center gap-2">
                <div className="bg-amber-500/15 border border-amber-500/40 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black text-amber-300 flex items-center gap-2">
                  <span>ID: {createdUser.authUser.id}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdUser.authUser.id);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="p-1 rounded bg-black/40 text-neutral-300 hover:text-white"
                  >
                    {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Welcome Bonus Callout */}
              <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5">
                <span>🎁 स्वागत बोनस: +५०० Coins खातामा थपियो!</span>
              </div>
            </div>

            {/* Enter App Button */}
            <button
              type="button"
              id="btn-enter-app-after-auth"
              onClick={handleEnterApp}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm shadow-xl shadow-rose-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>TikTop एप सुरु गर्नुहोस्</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
