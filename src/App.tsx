/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Screen, LiveMode, LiveStreamer, PostVideo, PartySeatCount, UserProfile, AppUser, AuthUser, RegisteredAccount } from './types';
import { INITIAL_POST_VIDEOS, DEFAULT_USER_PROFILE, ALL_APP_USERS, EXPLORE_STREAMERS } from './data/mockData';
import { accountToAuthAndProfile, getRegisteredAccounts } from './utils/authDb';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeFeed } from './components/HomeFeed';
import { ExploreView } from './components/ExploreView';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { LiveRoom } from './components/LiveRoom';
import { LiveSetupModal } from './components/LiveSetupModal';
import { CreateMenuModal } from './components/CreateMenuModal';
import { VideoPostModal } from './components/VideoPostModal';
import { WithdrawPointsModal } from './components/WithdrawPointsModal';
import { RechargeCoinsModal } from './components/RechargeCoinsModal';
import { UserSearchModal } from './components/UserSearchModal';
import { LiveNotificationAlert } from './components/LiveNotificationAlert';
import { AuthScreen } from './components/AuthScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CheckCircle2, Film } from 'lucide-react';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  // Mandatory Authentication State (User stays logged in persistently with Shambu Lamsal as default)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('tiktop_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
      // Auto-restore session from last active ID or registered account so user never has to repeatedly log in
      const lastActiveId = localStorage.getItem('tiktop_last_active_user_id');
      const accounts = getRegisteredAccounts();
      if (lastActiveId) {
        const matched = accounts.find((a) => a.id === lastActiveId);
        if (matched) {
          const { authUser: restoredAuth, userProfile: restoredProfile } = accountToAuthAndProfile(matched);
          localStorage.setItem('tiktop_auth_user', JSON.stringify(restoredAuth));
          localStorage.setItem('tiktop_user_profile', JSON.stringify(restoredProfile));
          return restoredAuth;
        }
      }
      if (accounts && accounts.length > 0) {
        const primary = accounts[0];
        const { authUser: restoredAuth, userProfile: restoredProfile } = accountToAuthAndProfile(primary);
        localStorage.setItem('tiktop_auth_user', JSON.stringify(restoredAuth));
        localStorage.setItem('tiktop_user_profile', JSON.stringify(restoredProfile));
        localStorage.setItem('tiktop_last_active_user_id', primary.id);
        return restoredAuth;
      }
    } catch {
      // Ignore
    }
    // Reliable fallback so App is ALWAYS visible immediately
    const fallbackAccounts = getRegisteredAccounts();
    const primary = fallbackAccounts[0];
    if (primary) {
      const { authUser: restoredAuth } = accountToAuthAndProfile(primary);
      return restoredAuth;
    }
    return null;
  });

  // Creator & Wallet Modal States
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState<boolean>(false);
  const [isLiveSetupOpen, setIsLiveSetupOpen] = useState<boolean>(false);
  const [isVideoPostModalOpen, setIsVideoPostModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [isRechargeCoinsModalOpen, setIsRechargeCoinsModalOpen] = useState<boolean>(false);

  // User ID Search & Live Notification States
  const [isUserSearchOpen, setIsUserSearchOpen] = useState<boolean>(false);
  const [activeLiveNotification, setActiveLiveNotification] = useState<AppUser | null>(null);
  const [chatTargetUser, setChatTargetUser] = useState<AppUser | null>(null);

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Live Broadcast State
  const [activeLiveMode, setActiveLiveMode] = useState<LiveMode>('face');
  const [activeRoomTitle, setActiveRoomTitle] = useState<string>('My Awesome Live Broadcast ✨');
  const [activeRoomCategory, setActiveRoomCategory] = useState<string>('General Chat');
  const [activePartySeatCount, setActivePartySeatCount] = useState<PartySeatCount>(6);
  const [isHostStreamer, setIsHostStreamer] = useState<boolean>(true);

  // Trigger Live Friend Alert (लाइभ साथी अलर्ट)
  const handleTriggerLiveAlert = (user?: AppUser) => {
    let target = user;
    if (!target) {
      const liveFriend = ALL_APP_USERS.find((u) => u.isFriend && u.isLive);
      target = liveFriend || ALL_APP_USERS[0];
    }
    setActiveLiveNotification(target);
  };

  // Automated gentle notification demonstration on device
  useEffect(() => {
    const timer = setTimeout(() => {
      const aarav = ALL_APP_USERS.find((u) => u.userId === 'USR-84920');
      if (aarav) {
        setActiveLiveNotification(aarav);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Handle watching live from notification alert
  const handleWatchFromAlert = () => {
    if (!activeLiveNotification) return;
    const streamer = EXPLORE_STREAMERS.find(
      (s) => s.id === activeLiveNotification.liveStreamerId
    );
    if (streamer) {
      handleWatchStream(streamer);
    } else {
      handleLaunchLive('face', `${activeLiveNotification.name}'s Live Stream`);
    }
    setActiveLiveNotification(null);
  };

  // Start direct SMS / chat with any user from Search Modal
  const handleStartChatFromSearch = (user: AppUser) => {
    setChatTargetUser(user);
    setCurrentScreen('chat');
  };

  // Videos List (persisted with initial presets)
  const [videos, setVideos] = useState<PostVideo[]>(() => {
    try {
      const saved = localStorage.getItem('tiktop_posted_videos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with initial presets (without duplicates)
          const ids = new Set(parsed.map((p: PostVideo) => p.id));
          const unadded = INITIAL_POST_VIDEOS.filter((p) => !ids.has(p.id));
          return [...parsed, ...unadded];
        }
      }
    } catch {
      // Ignore
    }
    return INITIAL_POST_VIDEOS;
  });

  // User Coins (Rechargeable, used for sending gifts) - local persistence
  const [userCoins, setUserCoins] = useState<number>(() => {
    try {
      const savedCoins = localStorage.getItem('tiktop_coins');
      if (savedCoins) {
        const parsed = parseInt(savedCoins, 10);
        if (parsed > 0) return parsed;
      }
      const oldDiamonds = localStorage.getItem('tiktop_diamonds');
      if (oldDiamonds) {
        const parsed = parseInt(oldDiamonds, 10);
        if (parsed > 0) return parsed;
      }
      return 500000;
    } catch {
      return 500000;
    }
  });

  // User Points (Accumulated from all live duration rewards and gifts, withdrawable) - local persistence
  const [userPoints, setUserPoints] = useState<number>(() => {
    try {
      const savedPoints = localStorage.getItem('tiktop_points');
      return savedPoints ? parseInt(savedPoints, 10) : 12500;
    } catch {
      return 12500;
    }
  });

  // User Profile (photo, name, handle, bio) with local persistence
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('tiktop_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_USER_PROFILE;
  });

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    try {
      localStorage.setItem('tiktop_user_profile', JSON.stringify(updated));
    } catch {
      // Ignore
    }
    setToastMessage(`🎉 प्रोफाइल सफलतापूर्वक अद्यावधिक गरियो! (${updated.name})`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Save coins to local storage
  const handleUpdateCoins = (newAmount: number) => {
    setUserCoins(newAmount);
    try {
      localStorage.setItem('tiktop_coins', newAmount.toString());
      localStorage.setItem('tiktop_diamonds', newAmount.toString());
    } catch {
      // Ignore storage errors
    }
  };

  // Add coins after recharge
  const handleRechargeCoins = (amount: number) => {
    const total = userCoins + amount;
    handleUpdateCoins(total);
    setToastMessage(`🎉 +${amount.toLocaleString()} Coins सफलतापूर्वक रिचार्ज भयो! 🪙`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Save points to local storage
  const handleUpdatePoints = (newAmount: number) => {
    setUserPoints(newAmount);
    try {
      localStorage.setItem('tiktop_points', newAmount.toString());
    } catch {
      // Ignore storage errors
    }
  };

  // Add points from live stream milestones or received gifts
  const handleAddPoints = (amount: number) => {
    setUserPoints((prev) => {
      const updated = prev + amount;
      try {
        localStorage.setItem('tiktop_points', updated.toString());
      } catch {
        // Ignore
      }
      return updated;
    });
    setToastMessage(`🏆 +${amount.toLocaleString()} Points प्राप्त भयो! (रिवार्ड वालेटमा जम्मा)`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  /**
   * Direct, robust state transition into Live Room.
   */
  const handleLaunchLive = (
    mode: LiveMode,
    title: string = 'My Live Stream',
    category: string = 'General Chat',
    seatCount?: PartySeatCount
  ) => {
    setActiveLiveMode(mode);
    setActiveRoomTitle(title);
    setActiveRoomCategory(category);
    if (seatCount) {
      setActivePartySeatCount(seatCount);
    }
    setIsHostStreamer(true);
    setIsCreateMenuOpen(false);
    setIsLiveSetupOpen(false);
    // Explicitly navigate directly to Live Room with 3-2-1 countdown
    setCurrentScreen('live_room');
  };

  // Watch someone else's live stream
  const handleWatchStream = (streamer: LiveStreamer) => {
    setActiveLiveMode(streamer.mode);
    setActiveRoomTitle(streamer.title);
    setActiveRoomCategory(streamer.category);
    setActivePartySeatCount(6);
    setIsHostStreamer(false);
    setCurrentScreen('live_room');
  };

  // Handle successful video post
  const handlePostVideoSuccess = (newVideo: PostVideo) => {
    setVideos((prev) => [newVideo, ...prev]);
    setCurrentScreen('home');
    setToastMessage('🎉 भिडियो सफलतापूर्वक पोस्ट भयो! (Video posted successfully!)');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // User's own posted videos
  const userVideos = videos.filter(
    (v) => v.authorHandle === userProfile.handle || v.authorHandle === '@creator_np'
  );

  // Auth mode state when returning to login screen (signup vs login)
  const [authInitialMode, setAuthInitialMode] = useState<'signup' | 'login'>('signup');

  // User Authentication Handler (Signup / Login success)
  const handleAuthSuccess = (newAuthUser: AuthUser, newProfile: UserProfile) => {
    setAuthUser(newAuthUser);
    setUserProfile(newProfile);
    try {
      localStorage.removeItem('tiktop_is_logged_out');
      localStorage.setItem('tiktop_auth_user', JSON.stringify(newAuthUser));
      localStorage.setItem('tiktop_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('tiktop_last_active_user_id', newAuthUser.id);
    } catch {
      // Ignore
    }
    // New account signup bonus +500 Coins
    setUserCoins((prev) => {
      const updated = prev + 500;
      try {
        localStorage.setItem('tiktop_coins', updated.toString());
        localStorage.setItem('tiktop_diamonds', updated.toString());
      } catch {}
      return updated;
    });
    setToastMessage(`🎉 स्वागत छ, ${newAuthUser.name} (ID: ${newAuthUser.id})`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleLogout = () => {
    try {
      localStorage.setItem('tiktop_is_logged_out', 'true');
      localStorage.removeItem('tiktop_auth_user');
    } catch {
      // Ignore
    }
    setAuthUser(null);
    setAuthInitialMode('login');
    setCurrentScreen('home');
    setToastMessage('👋 तपाईं लगआउट हुनुभयो। पुनः लगइन गर्न आफ्नो खाता छनोट गर्नुहोस्।');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSwitchAccount = (mode: 'login' | 'signup' = 'login') => {
    try {
      localStorage.setItem('tiktop_is_logged_out', 'true');
      localStorage.removeItem('tiktop_auth_user');
    } catch {
      // Ignore
    }
    setAuthUser(null);
    setAuthInitialMode(mode);
    setCurrentScreen('home');
  };

  const handleSelectAccountDirectly = (account: RegisteredAccount) => {
    const { authUser: newAuthUser, userProfile: newProfile } = accountToAuthAndProfile(account);
    setAuthUser(newAuthUser);
    setUserProfile(newProfile);
    try {
      localStorage.removeItem('tiktop_is_logged_out');
      localStorage.setItem('tiktop_auth_user', JSON.stringify(newAuthUser));
      localStorage.setItem('tiktop_user_profile', JSON.stringify(newProfile));
      localStorage.setItem('tiktop_last_active_user_id', newAuthUser.id);
    } catch {
      // Ignore
    }
    setToastMessage(`🎉 खाता परिवर्तन गरियो: ${account.name} (ID: ${account.id})`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // MANDATORY AUTH GATE: User can sign in, register or skip directly to app
  if (!authUser) {
    const handleSkipToApp = () => {
      const accounts = getRegisteredAccounts();
      const primary = accounts[0];
      const { authUser: restoredAuth, userProfile: restoredProfile } = accountToAuthAndProfile(primary);
      setAuthUser(restoredAuth);
      setUserProfile(restoredProfile);
    };
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        initialMode={authInitialMode}
        onDismissOrSkip={handleSkipToApp}
      />
    );
  }

  // If in Live Room, render the full-screen immersive Live Room View
  if (currentScreen === 'live_room') {
    return (
      <main className="w-full h-[100dvh] bg-black overflow-hidden flex items-center justify-center">
        <LiveRoom
          mode={activeLiveMode}
          roomTitle={activeRoomTitle}
          roomCategory={activeRoomCategory}
          onExit={() => setCurrentScreen('home')}
          userCoins={userCoins}
          userDiamonds={userCoins}
          userPoints={userPoints}
          onUpdateCoins={handleUpdateCoins}
          onUpdateDiamonds={handleUpdateCoins}
          onAddPoints={handleAddPoints}
          onOpenRechargeCoins={() => setIsRechargeCoinsModalOpen(true)}
          showCountdown={isHostStreamer}
          initialSeatCount={activePartySeatCount}
          isHostStreamer={isHostStreamer}
          userProfile={userProfile}
        />
      </main>
    );
  }

  return (
    <div id="tiktop-app-root" className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans antialiased">
      {/* Top Application Navbar */}
      <Navbar
        currentScreen={currentScreen}
        userCoins={userCoins}
        userDiamonds={userCoins}
        userPoints={userPoints}
        onOpenRecharge={() => setIsRechargeCoinsModalOpen(true)}
        onOpenWithdrawPoints={() => setIsWithdrawModalOpen(true)}
        onOpenSearch={() => setIsUserSearchOpen(true)}
        onOpenNotifications={() => handleTriggerLiveAlert()}
      />

      {/* Floating Live Friend Notification Alert Banner */}
      {activeLiveNotification && (
        <LiveNotificationAlert
          user={activeLiveNotification}
          onWatch={handleWatchFromAlert}
          onDismiss={() => setActiveLiveNotification(null)}
        />
      )}

      {/* Floating Global Success Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 animate-bounce">
          <CheckCircle2 size={18} className="text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Screen Views */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentScreen === 'home' && (
          <HomeFeed
            onStartLive={handleLaunchLive}
            onOpenSetupModal={() => setIsLiveSetupOpen(true)}
            onOpenPostVideo={() => setIsVideoPostModalOpen(true)}
            onWatchStream={handleWatchStream}
            userCoins={userCoins}
            userDiamonds={userCoins}
            videos={videos}
          />
        )}

        {currentScreen === 'explore' && (
          <ExploreView
            onWatchStream={handleWatchStream}
            onOpenSearch={() => setIsUserSearchOpen(true)}
          />
        )}

        {currentScreen === 'chat' && (
          <ChatView
            onStartLive={handleLaunchLive}
            onWatchStream={handleWatchStream}
            targetUser={chatTargetUser}
            onClearTargetUser={() => setChatTargetUser(null)}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileView
            userCoins={userCoins}
            userDiamonds={userCoins}
            userPoints={userPoints}
            onOpenRechargeCoins={() => setIsRechargeCoinsModalOpen(true)}
            onOpenWithdrawPoints={() => setIsWithdrawModalOpen(true)}
            onStartLive={handleLaunchLive}
            onOpenPostVideo={() => setIsVideoPostModalOpen(true)}
            userVideos={userVideos}
            profile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onTriggerTestLiveAlert={() => handleTriggerLiveAlert()}
            authUser={authUser}
            onLogout={handleLogout}
            onSwitchAccount={handleSwitchAccount}
            onSelectAccountDirectly={handleSelectAccountDirectly}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar with '+' Create button (Post Video / Go Live) */}
      <BottomNav
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        onOpenCreateMenu={() => setIsCreateMenuOpen(true)}
        unreadCount={3}
        userAvatar={userProfile.avatar}
      />

      {/* ID Search Modal (ID serch garna milne) */}
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onStartChat={handleStartChatFromSearch}
        onWatchStream={handleWatchStream}
      />

      {/* Main Creation Selector Modal (Opens on '+' button tap) */}
      <CreateMenuModal
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        onSelectPostVideo={() => setIsVideoPostModalOpen(true)}
        onSelectLive={(mode) => handleLaunchLive(mode)}
      />

      {/* Video Post Studio Modal (Record / Upload / Sound / Caption / Post) */}
      <VideoPostModal
        isOpen={isVideoPostModalOpen}
        onClose={() => setIsVideoPostModalOpen(false)}
        onPostSuccess={handlePostVideoSuccess}
        userProfile={userProfile}
      />

      {/* Live Stream Setup Modal (Face Live vs Party Live customized) */}
      <LiveSetupModal
        isOpen={isLiveSetupOpen}
        onClose={() => setIsLiveSetupOpen(false)}
        onLaunchLive={handleLaunchLive}
        onSwitchToPostVideo={() => setIsVideoPostModalOpen(true)}
      />

      {/* Withdraw Points Modal (Country specific: eSewa, Khalti, IME Pay, Bank, GCash, Paytm, Google Pay, JazzCash, Easypaisa) */}
      <ErrorBoundary fallbackTitle="निकासी विकल्प लोड गर्न समस्या आयो" onReset={() => setIsWithdrawModalOpen(false)}>
        <WithdrawPointsModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          userPoints={userPoints}
          currentPoints={userPoints}
          onWithdrawSuccess={(deducted, record) => {
            const remaining = Math.max(0, userPoints - deducted);
            handleUpdatePoints(remaining);
            const payoutText = record?.amountFormatted || (record?.netUSD ? `$${record.netUSD.toFixed(2)} USD` : `${deducted} Pts`);
            const methodText = record?.paymentMethod || record?.method || 'Wallet';
            setToastMessage(`💸 निकासी अनुरोध पेश गरियो! (${payoutText} via ${methodText})`);
            setTimeout(() => setToastMessage(null), 4500);
          }}
        />
      </ErrorBoundary>

      {/* Recharge Coins Modal */}
      <ErrorBoundary fallbackTitle="सिक्का रिचार्ज विन्डो लोड गर्न समस्या आयो" onReset={() => setIsRechargeCoinsModalOpen(false)}>
        <RechargeCoinsModal
          isOpen={isRechargeCoinsModalOpen}
          onClose={() => setIsRechargeCoinsModalOpen(false)}
          currentCoins={userCoins}
          userCoins={userCoins}
          onRechargeCoins={handleRechargeCoins}
          authUser={authUser}
          userProfile={userProfile}
        />
      </ErrorBoundary>
    </div>
  );
}
