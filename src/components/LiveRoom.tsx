import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Sparkles,
  Gift as GiftIcon,
  Heart,
  Send,
  Users,
  Swords,
  Share2,
  Volume2,
  VolumeX,
  Award,
  AlertTriangle,
  UserCheck,
  UserMinus,
  Ban,
  UserX,
  ShieldAlert,
} from 'lucide-react';
import {
  LiveMode,
  VideoFilter,
  ChatMessage,
  Gift,
  PartySeat,
  PartySeatCount,
  UserProfile,
  PartyAccessMode,
  BannedUser,
  SeatJoinRequest,
  SeatInvitation,
} from '../types';
import { LiveCameraStream } from './LiveCameraStream';
import { PartyGrid } from './PartyGrid';
import { GiftTray } from './GiftTray';
import { FilterSelector } from './FilterSelector';
import { GiftEffectOverlay, ActiveGiftAnimation } from './GiftEffectOverlay';
import { FloatingHearts } from './FloatingHearts';
import { StreamSummaryModal } from './StreamSummaryModal';
import { LeaveLiveModal } from './LeaveLiveModal';
import { LevelUpCelebrationModal } from './LevelUpCelebrationModal';
import { CountdownOverlay } from './CountdownOverlay';
import { SeatInvitePrompt } from './SeatInviteModal';
import {
  getTodayLiveSeconds,
  saveTodayLiveSeconds,
  getNepalDateString,
} from '../utils/liveDurationManager';
import { INITIAL_PARTY_SEATS, generatePartySeats, assignUserToSeat } from '../data/mockData';
import {
  getStoredWealthTotal,
  calculateWealthLevel,
  recordGiftSent,
  getStoredLiveTotal,
  calculateLiveLevel,
  recordGiftReceived,
  LevelInfo,
} from '../utils/levelSystem';
import { saveInboxNotice } from '../utils/inboxNotices';
import { isUserAdminAuthorized } from '../utils/adminFinanceDb';

interface LiveRoomProps {
  mode: LiveMode;
  roomTitle: string;
  roomCategory: string;
  onExit: () => void;
  userCoins?: number;
  userDiamonds?: number;
  userPoints?: number;
  onUpdateCoins?: (newAmount: number) => void;
  onUpdateDiamonds?: (newAmount: number) => void;
  onUpdatePoints?: (newAmount: number) => void;
  onAddPoints?: (amount: number) => void;
  onOpenRechargeCoins?: () => void;
  showCountdown?: boolean;
  initialSeatCount?: PartySeatCount;
  isHostStreamer?: boolean;
  userProfile?: UserProfile;
}

const SAMPLE_FAN_NAMES = ['Aayush', 'Smriti', 'Bipin_07', 'Kritika_K', 'Rohan', 'Sneha', 'Nirav', 'Pooja'];
const SAMPLE_FAN_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

const SAMPLE_COMMENTS = [
  'Welcome to the live! 👋',
  'Namaste everyone! 🙏',
  'Sound and video quality are super clear! ✨',
  'Love this vibe! Keep it going 🔥',
  'Sent a heart! ❤️❤️❤️',
  'Who else is here from Nepal? 🇳🇵',
  'Great energy today! 👏',
  'Party vibes are real! 🎶',
];

export const LiveRoom: React.FC<LiveRoomProps> = ({
  mode,
  roomTitle,
  roomCategory,
  onExit,
  userCoins,
  userDiamonds = 350,
  userPoints = 0,
  onUpdateCoins,
  onUpdateDiamonds,
  onUpdatePoints,
  onAddPoints,
  onOpenRechargeCoins,
  showCountdown = true,
  initialSeatCount = 6 as PartySeatCount,
  isHostStreamer = true,
  userProfile,
}) => {
  const coinsBalance = userCoins !== undefined ? userCoins : userDiamonds;
  const isPartyLive = mode === 'party';
  // 3-2-1 Countdown state
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(showCountdown);

  // Live Room Hardware and Visual State
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [filter, setFilter] = useState<VideoFilter>('none');
  const [isPartyAudioActive, setIsPartyAudioActive] = useState<boolean>(true);

  // Audience & Activity State (only shown when actual viewers arrive)
  const [viewersCount, setViewersCount] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [diamondsEarned, setDiamondsEarned] = useState<number>(0);

  // Dynamic Party Seater Count & Seats (4, 6, 9, 16, 25 Seats)
  const [partySeatCount, setPartySeatCount] = useState<PartySeatCount>(initialSeatCount);
  const [partySeats, setPartySeats] = useState<PartySeat[]>(() =>
    generatePartySeats(initialSeatCount)
  );
  const [heartTrigger, setHeartTrigger] = useState<number>(0);

  // Party Moderation, Access Mode, Bans & Invitations
  const [partyAccessMode, setPartyAccessMode] = useState<PartyAccessMode>('free');
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [seatJoinRequests, setSeatJoinRequests] = useState<SeatJoinRequest[]>([]);
  const [activeSeatInvitation, setActiveSeatInvitation] = useState<SeatInvitation | null>(null);
  const [isUserFanClub, setIsUserFanClub] = useState<boolean>(true);

  // Role switching for interactive testing & simulation:
  // 'host' -> strictly occupies Seat #1, supreme admin power
  // 'admin' -> moderation rights, cannot kick admin, cannot kick host
  // 'guest' -> regular audience, sends requests in approval mode, accepts invites
  const isSystemAdmin = isUserAdminAuthorized(userProfile);
  const [currentRole, setCurrentRole] = useState<'host' | 'admin' | 'guest'>(() => {
    if (isHostStreamer) return 'host';
    if (isSystemAdmin) return 'admin';
    return 'guest';
  });
  const effectiveIsHost = currentRole === 'host';
  const effectiveIsAdmin = currentRole === 'admin' || isSystemAdmin;
  const hasModeratorRights = effectiveIsHost || effectiveIsAdmin;

  // Viewer Moderation (30-Minute Ban & Seat Removal for Host & Admin)
  const [inspectedViewer, setInspectedViewer] = useState<{
    userName: string;
    userAvatar?: string;
    badge?: string;
  } | null>(null);
  const [liveBanReason, setLiveBanReason] = useState<string>('अनुचित बोली वा गालीगलौज');
  const [isViewerListOpen, setIsViewerListOpen] = useState<boolean>(false);

  // PK Battle State for Party Mode
  const [isPkActive, setIsPkActive] = useState<boolean>(false);
  const [pkBlueScore, setPkBlueScore] = useState<number>(180);
  const [pkRedScore, setPkRedScore] = useState<number>(140);
  const [pkTimeLeft, setPkTimeLeft] = useState<number>(60);

  // Dialogs & Sheets
  const [isGiftTrayOpen, setIsGiftTrayOpen] = useState<boolean>(false);
  const [selectedPartyRecipients, setSelectedPartyRecipients] = useState<'all' | number[]>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);

  const handleOpenGiftForSeat = (seatNumber: number) => {
    setSelectedPartyRecipients([seatNumber]);
    setIsGiftTrayOpen(true);
  };
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<ActiveGiftAnimation | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ type: 'wealth' | 'live'; levelInfo: LevelInfo } | null>(null);
  const [myWealthLevel, setMyWealthLevel] = useState<LevelInfo>(() =>
    calculateWealthLevel(getStoredWealthTotal())
  );
  const [hostLiveLevel, setHostLiveLevel] = useState<LevelInfo>(() =>
    calculateLiveLevel(getStoredLiveTotal())
  );
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const currentHostId = userProfile?.userId || userProfile?.handle || 'host';

  // Live stream duration tracking:
  // Continues from today's previous sessions; resets to 0 at 12:00 AM Midnight Nepal Time
  const [streamDuration, setStreamDuration] = useState<number>(() => {
    return isHostStreamer ? getTodayLiveSeconds(currentHostId) : 0;
  });
  const lastRecordedNepalDate = useRef<string>(getNepalDateString());

  const [claimedMilestones, setClaimedMilestones] = useState<{
    faceHour1: boolean;
    faceHour2: boolean;
    partyHour1: boolean;
    partyHour2: boolean;
  }>({
    faceHour1: false,
    faceHour2: false,
    partyHour1: false,
    partyHour2: false,
  });

  const [liveDurationRewardPoints, setLiveDurationRewardPoints] = useState<number>(0);

  // User diamonds ref to avoid stale closures during milestone payouts
  const userDiamondsRef = useRef(userDiamonds);
  useEffect(() => {
    userDiamondsRef.current = userDiamonds;
  }, [userDiamonds]);

  // Audio chime for celebratory milestone rewards
  const playCelebrationChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 1000);
    } catch {
      // Audio playback allowed on user interaction
    }
  };

  // Face Live: Person Presence Tracking, Automatic Pause & Warning System
  // Rule: Face Live मा मान्छे स्पष्ट देखिएको बेला मात्र लाइभ समय गणना हुन्छ।
  // मान्छे बाहिरिएमा तत्काल समय गणना पज (Pause) हुन्छ र स्क्रिन तथा इनबक्समा चेतावनी जान्छ।
  // मान्छे आउनासाथ समय स्वतः सुरु (Auto Resume) हुन्छ।
  const [isPersonPresent, setIsPersonPresent] = useState<boolean>(true);
  const [showFaceAbsentWarning, setShowFaceAbsentWarning] = useState<boolean>(false);
  const isPersonPresentRef = useRef<boolean>(true);
  isPersonPresentRef.current = isPersonPresent;

  const handleTogglePersonPresence = (present?: boolean) => {
    const nextPresent = present !== undefined ? present : !isPersonPresent;
    setIsPersonPresent(nextPresent);
    isPersonPresentRef.current = nextPresent;

    if (!nextPresent && mode === 'face') {
      setShowFaceAbsentWarning(true);
      // Host-only Inbox notification
      if (isHostStreamer) {
        try {
          saveInboxNotice({
            type: 'live_face_absent',
            severity: 'warning',
            title: 'Live Warning: Camera Absent',
            nepaliTitle: '⚠️ लाइभ चेतावनी: क्यामेरा अगाडि मान्छे देखिएन',
            message: 'You left the Face Live frame. Live duration counting is paused until you return.',
            nepaliMessage: 'तपाईं Face Live मा क्यामेरा अगाडिबाट बाहिरिनुभएकोले लाइभ समय गणना रोकिएको छ। तुरुन्त क्यामेरा अगाडि उपस्थित हुनुहोस्!',
          });
        } catch {
          // Ignore
        }
      }
    } else if (nextPresent && mode === 'face') {
      setShowFaceAbsentWarning(false);
    }
  };

  // Chat stream (clean, empty by default so unnecessary comments are not displayed)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [commentInput, setCommentInput] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Countdown completion handler
  const handleCountdownComplete = () => {
    setIsCountdownActive(false);
  };

  // Stream Duration Timer (starts only when 3-2-1 countdown finishes)
  // Accumulates continuously for today; automatically resets to 0 at 12:00 AM Nepal Time
  // STRICT RULE: If mode is Face Live and person is not present, timer is strictly PAUSED!
  useEffect(() => {
    if (isCountdownActive) return;

    const timer = setInterval(() => {
      // In Face Live: if person not present, pause live time counting!
      if (mode === 'face' && !isPersonPresentRef.current) {
        return; // Paused! Time is only counted when person is clearly visible.
      }

      const todayInNepal = getNepalDateString();

      // Check if 12:00 AM Midnight in Nepal has arrived
      if (todayInNepal !== lastRecordedNepalDate.current) {
        lastRecordedNepalDate.current = todayInNepal;
        // 12:00 AM Nepal Time reached: Previous day's time invalid, reset to 0!
        setStreamDuration(0);
        if (isHostStreamer) {
          saveTodayLiveSeconds(0, currentHostId);
        }
        return;
      }

      setStreamDuration((prev) => {
        const nextSecs = prev + 1;
        if (isHostStreamer) {
          saveTodayLiveSeconds(nextSecs, currentHostId);
        }
        return nextSecs;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountdownActive, isHostStreamer, currentHostId, mode]);

  // Live Duration Rewards Evaluation (Strict User Request Compliance):
  // 1) Face Live:
  //    - At 1 Hour (3600s): Host receives 10,000 Points
  //    - At 2 Hours (7200s): Host receives another 10,000 Points (Total: 20,000 Points Max Cap)
  // 2) Party Live:
  //    - At 1 Hour (3600s): Host receives 2,000 Points
  //    - At 2 Hours (7200s): Host receives another 2,000 Points (Total: 4,000 Points Max Cap)
  // After 2 hours cap, live stream can continue indefinitely without additional rewards!
  useEffect(() => {
    if (isCountdownActive) return;

    if (mode === 'face') {
      // Milestone 1: 1 Hour Face Live (3600s) -> 10,000 points
      if (streamDuration >= 3600 && !claimedMilestones.faceHour1) {
        setClaimedMilestones((prev) => ({ ...prev, faceHour1: true }));
        const pts = 10000;
        if (onAddPoints) onAddPoints(pts);
        if (onUpdateDiamonds) onUpdateDiamonds(userDiamondsRef.current + pts);
        setDiamondsEarned((prev) => prev + pts);
        setLiveDurationRewardPoints((prev) => prev + pts);
      }

      // Milestone 2: 2 Hours Face Live (7200s) -> 10,000 points (Total 20,000, Max Cap)
      if (streamDuration >= 7200 && !claimedMilestones.faceHour2) {
        setClaimedMilestones((prev) => ({ ...prev, faceHour2: true }));
        const pts = 10000;
        if (onAddPoints) onAddPoints(pts);
        if (onUpdateDiamonds) onUpdateDiamonds(userDiamondsRef.current + pts);
        setDiamondsEarned((prev) => prev + pts);
        setLiveDurationRewardPoints((prev) => prev + pts);
      }
    } else {
      // Party Live: Milestone 1: 1 Hour (3600s) -> 2,000 points
      if (streamDuration >= 3600 && !claimedMilestones.partyHour1) {
        setClaimedMilestones((prev) => ({ ...prev, partyHour1: true }));
        const pts = 2000;
        if (onAddPoints) onAddPoints(pts);
        if (onUpdateDiamonds) onUpdateDiamonds(userDiamondsRef.current + pts);
        setDiamondsEarned((prev) => prev + pts);
        setLiveDurationRewardPoints((prev) => prev + pts);
      }

      // Party Live: Milestone 2: 2 Hours (7200s) -> 2,000 points (Total 4,000 Points, Max Cap)
      if (streamDuration >= 7200 && !claimedMilestones.partyHour2) {
        setClaimedMilestones((prev) => ({ ...prev, partyHour2: true }));
        const pts = 2000;
        if (onAddPoints) onAddPoints(pts);
        if (onUpdateDiamonds) onUpdateDiamonds(userDiamondsRef.current + pts);
        setDiamondsEarned((prev) => prev + pts);
        setLiveDurationRewardPoints((prev) => prev + pts);
      }
    }
  }, [streamDuration, mode, isCountdownActive, claimedMilestones, onUpdateDiamonds, onAddPoints]);

  // Clean live room: No unsolicited simulated comments or artificial viewer fluctuations

  // PK Timer when PK is active
  useEffect(() => {
    if (!isPkActive) return;

    const timer = setInterval(() => {
      setPkTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPkActive(false);
          return 60;
        }
        return prev - 1;
      });

      // Random PK score changes
      if (Math.random() > 0.4) {
        setPkBlueScore((prev) => prev + Math.floor(Math.random() * 10));
      } else {
        setPkRedScore((prev) => prev + Math.floor(Math.random() * 10));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPkActive]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Send user message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    // Check 30m ban
    const currentUserName = userProfile?.name || 'You';
    const activeBan = bannedUsers.find(
      (b) => (b.userName === currentUserName || b.userName === 'You') && b.expiresAt > Date.now()
    );
    if (activeBan) {
      const remainingMins = Math.max(1, Math.ceil((activeBan.expiresAt - Date.now()) / (60 * 1000)));
      alert(`⚠️ तपाईंलाई अनुचित व्यवहारका कारण ३० मिनेटका लागि प्रतिबन्ध लगाइएको छ। अझै ${remainingMins} मिनेट बाँकी छ।`);
      return;
    }

    const newMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      user: 'You (Host)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      text: commentInput.trim(),
      type: 'normal',
      badge: 'HOST',
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setCommentInput('');
  };

  // Like Heart tap
  const handleLikeTap = () => {
    setLikesCount((prev) => prev + 1);
    setHeartTrigger((prev) => prev + 1);
  };

  // Send Gift (Costs Coins, Host/Seats earn Points, supports multi-seat selection e.g. 1, 3, 8 or all)
  const handleSendGift = (gift: Gift, recipientTarget: 'all' | number | number[] = 'all') => {
    const singleCost = gift.coins ?? gift.diamonds;

    // Identify targets in Party mode
    const occupiedSeats = isPartyLive ? partySeats.filter((s) => s.isOccupied) : [];
    
    let targetSeatNumbers: number[] = [];
    let isGiftingAll = false;

    if (!isPartyLive) {
      targetSeatNumbers = [];
    } else if (recipientTarget === 'all') {
      isGiftingAll = true;
      targetSeatNumbers = occupiedSeats.map((s) => s.seatNumber);
    } else if (Array.isArray(recipientTarget)) {
      targetSeatNumbers = recipientTarget;
      if (targetSeatNumbers.length === 0) {
        targetSeatNumbers = occupiedSeats.length > 0 ? [occupiedSeats[0].seatNumber] : [1];
      }
    } else if (typeof recipientTarget === 'number') {
      targetSeatNumbers = [recipientTarget];
    }

    const matchedTargetSeats = isPartyLive
      ? partySeats.filter((s) => s.isOccupied && targetSeatNumbers.includes(s.seatNumber))
      : [];

    const recipientCount = isPartyLive
      ? Math.max(1, isGiftingAll ? occupiedSeats.length : matchedTargetSeats.length)
      : 1;

    const totalCost = singleCost * recipientCount;

    if (coinsBalance < totalCost) {
      if (onOpenRechargeCoins) {
        onOpenRechargeCoins();
      } else {
        alert(
          `पर्याप्त सिक्का (Coins) छैन! कुल ${totalCost.toLocaleString()} Coins चाहिन्छ, तर तपाईंसँग ${coinsBalance.toLocaleString()} Coins मात्र छ। कृपया Coins रिचार्ज गर्नुहोस्!`
        );
      }
      return;
    }

    // Deduct coins from user balance
    if (onUpdateCoins) {
      onUpdateCoins(coinsBalance - totalCost);
    } else if (onUpdateDiamonds) {
      onUpdateDiamonds(coinsBalance - totalCost);
    }

    // Calculate points per recipient (Lucky category includes surprise multipliers)
    let pointsPerRecipient = singleCost;
    let luckyMultiplier = 1;
    if (gift.category === 'lucky') {
      const multipliers = [1.2, 1.5, 2.0];
      luckyMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
      pointsPerRecipient = Math.round(singleCost * luckyMultiplier);
    }
    const totalPointsAwarded = pointsPerRecipient * recipientCount;

    if (onAddPoints) {
      onAddPoints(totalPointsAwarded);
    }
    setDiamondsEarned((prev) => prev + totalPointsAwarded);

    // Record gift sent -> Updates user's Wealth Level
    const wealthRes = recordGiftSent(totalCost);
    setMyWealthLevel(wealthRes.levelInfo);

    // Record gift received -> Updates Host's Live Level
    const liveRes = recordGiftReceived(totalPointsAwarded);
    setHostLiveLevel(liveRes.levelInfo);

    // Check if either leveled up to celebrate
    if (wealthRes.didLevelUp) {
      setLevelUpData({ type: 'wealth', levelInfo: wealthRes.levelInfo });
    } else if (liveRes.didLevelUp) {
      setLevelUpData({ type: 'live', levelInfo: liveRes.levelInfo });
    }

    // In Party Live: award points and show floating points above the head of the recipient seat(s)
    if (isPartyLive) {
      const now = Date.now();
      setPartySeats((prevSeats) =>
        prevSeats.map((seat) => {
          const isTarget = isGiftingAll
            ? seat.isOccupied
            : targetSeatNumbers.includes(seat.seatNumber) && seat.isOccupied;

          if (isTarget) {
            return {
              ...seat,
              pointsEarned: (seat.pointsEarned || 0) + pointsPerRecipient,
              recentGiftEffect: {
                giftIcon: gift.icon,
                giftName: gift.name,
                points: pointsPerRecipient,
                timestamp: now,
              },
            };
          }
          return seat;
        })
      );

      // Snappy clear of head points badge after 3.2 seconds
      setTimeout(() => {
        setPartySeats((prevSeats) =>
          prevSeats.map((seat) => {
            if (seat.recentGiftEffect && seat.recentGiftEffect.timestamp === now) {
              return { ...seat, recentGiftEffect: undefined };
            }
            return seat;
          })
        );
      }, 3200);
    }

    // Construct Recipient Description
    let recipientLabel = isHostStreamer ? 'Host' : (userProfile?.name || 'Host');
    if (isPartyLive) {
      if (isGiftingAll) {
        recipientLabel = `सबै सिटहरू (${recipientCount} जना)`;
      } else if (matchedTargetSeats.length === 1) {
        recipientLabel = `${matchedTargetSeats[0].userName} (Seat #${matchedTargetSeats[0].seatNumber})`;
      } else if (matchedTargetSeats.length > 1) {
        const seatNumbersStr = matchedTargetSeats.map((s) => `#${s.seatNumber}`).join(', ');
        recipientLabel = `${matchedTargetSeats.length} जना (${seatNumbersStr})`;
      } else if (targetSeatNumbers.length > 0) {
        recipientLabel = targetSeatNumbers.map((n) => `Seat #${n}`).join(', ');
      }
    }

    const luckyBonusText = gift.category === 'lucky' ? ` (🍀 Lucky Bonus x${luckyMultiplier}!)` : '';
    const targetText = isPartyLive ? ` ➔ ${recipientLabel}` : '';
    const giftMsg: ChatMessage = {
      id: `gift-${Date.now()}`,
      user: userProfile?.name || 'You',
      avatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      text: `sent ${gift.name} ${gift.icon}${targetText}${luckyBonusText}`,
      type: 'gift',
      badge: `👑 Lv.${wealthRes.levelInfo.level}`,
      giftName: gift.name,
      giftIcon: gift.icon,
      timestamp: 'Just now',
    };
    setChatMessages((prev) => [...prev, giftMsg]);

    setActiveGiftAnimation({
      id: `anim-${Date.now()}`,
      senderName: userProfile?.name || 'You',
      senderWealthLevel: wealthRes.levelInfo.level,
      recipientName: recipientLabel,
      isAllParty: isGiftingAll,
      recipientCount: isGiftingAll || matchedTargetSeats.length > 1 ? recipientCount : undefined,
      gift,
      luckyMultiplier: gift.category === 'lucky' ? luckyMultiplier : undefined,
    });
    setIsGiftTrayOpen(false);
  };

  // Party Seat Actions & Seater Switcher (4, 6, 9, 16, 25 Seats)
  const handleChangeSeatCount = (count: PartySeatCount) => {
    setPartySeatCount(count);
    setPartySeats((prev) => generatePartySeats(count, prev));
    setChatMessages((prev) => [
      ...prev,
      {
        id: `seat-cnt-${Date.now()}`,
        user: 'TikTop Party',
        avatar: '',
        text: `Party layout switched to ${count} Seats (${count} सिट स्टेज)`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  /**
   * Take a seat with STRICT single-seat occupancy & Host/Moderation rules:
   * 1. 'Host sandhai 1 number seat mai baseko hunu parxa' (Host is always anchored to Seat #1).
   * 2. Non-hosts cannot take Seat #1.
   * 3. Users banned within the 30-minute window cannot take a seat.
   * 4. 'Ek byakti ek mattra seat ma basna milnu parxa' (One person only on one seat).
   */
  const handleTakeSeat = (seatNumber: number) => {
    const currentUserName = userProfile?.name || 'You';

    // Check 30m ban
    const activeBan = bannedUsers.find(
      (b) => (b.userName === currentUserName || b.userName === 'You') && b.expiresAt > Date.now()
    );
    if (activeBan) {
      const remainingMins = Math.max(1, Math.ceil((activeBan.expiresAt - Date.now()) / (60 * 1000)));
      alert(`⚠️ तपाईंलाई अनुचित व्यवहारका कारण ३० मिनेटका लागि प्रतिबन्ध लगाइएको छ। अझै ${remainingMins} मिनेट बाँकी छ।`);
      return;
    }

    // Check Seat 1 Host-only rule
    if (seatNumber === 1 && !effectiveIsHost) {
      alert('👑 सिट नम्बर १ कोठाको होस्टको लागि मात्र आरक्षित छ। कृपया अन्य सिट रोज्नुहोस्।');
      return;
    }

    const previousUserSeat = partySeats.find((s) => s.isOccupied && s.userName?.includes('You'));

    // assignUserToSeat automatically removes 'You' from any previous seat!
    const updated = assignUserToSeat(partySeats, seatNumber, {
      userName: effectiveIsHost ? `${userProfile?.name || 'You'} (Host)` : (userProfile?.name || 'You'),
      userAvatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isHost: effectiveIsHost,
      isVideoOn: isCameraOn,
      isAdmin: effectiveIsAdmin,
      isFanClub: isUserFanClub,
    });

    setPartySeats(updated);

    if (previousUserSeat && previousUserSeat.seatNumber !== seatNumber) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `move-${Date.now()}`,
          user: 'TikTop Party',
          avatar: '',
          text: `You moved to Seat #${seatNumber} (Seat #${previousUserSeat.seatNumber} is now free)! 🎙️`,
          type: 'system',
          timestamp: 'Just now',
        },
      ]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `seat-${Date.now()}`,
          user: 'TikTop Party',
          avatar: '',
          text: `You joined Seat #${seatNumber}! 🎙️`,
          type: 'system',
          timestamp: 'Just now',
        },
      ]);
    }
  };

  const handleLeaveSeat = (seatNumber: number) => {
    // If user is host on seat 1, host cannot leave seat 1
    if (seatNumber === 1 && effectiveIsHost) {
      alert('👑 होस्टले १ नम्बर सिट छोड्न मिल्दैन। तपाईं सधैं १ नम्बर सिटमै रहनुपर्छ।');
      return;
    }

    setPartySeats((prev) =>
      prev.map((s) =>
        s.seatNumber === seatNumber
          ? {
              ...s,
              isOccupied: false,
              userName: undefined,
              userAvatar: undefined,
              isHost: false,
              isAdmin: false,
              isFanClub: false,
              isSpeaking: false,
              isMuted: false,
              isVideoOn: false,
              videoUrl: undefined,
            }
          : s
      )
    );
    setChatMessages((prev) => [
      ...prev,
      {
        id: `leave-${Date.now()}`,
        user: 'TikTop Party',
        avatar: '',
        text: `You left Seat #${seatNumber}.`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Moderation: Remove user from seat only (stays in live as a viewer)
  const handleKickFromSeat = (seatNumber: number, userName: string) => {
    setPartySeats((prev) =>
      prev.map((s) =>
        s.seatNumber === seatNumber
          ? {
              ...s,
              isOccupied: false,
              userName: undefined,
              userAvatar: undefined,
              isHost: false,
              isAdmin: false,
              isFanClub: false,
              isSpeaking: false,
              isMuted: false,
              isVideoOn: false,
              videoUrl: undefined,
            }
          : s
      )
    );

    if (userName?.includes('You')) {
      setIsCameraOn(false);
      setIsMicOn(false);
    }

    const actor = effectiveIsHost ? 'होस्ट (Host)' : 'व्यवस्थापक (Admin)';
    setChatMessages((prev) => [
      ...prev,
      {
        id: `kick-${Date.now()}`,
        user: 'TikTop Moderation 🪑',
        avatar: '',
        text: `🪑 ${actor} ले ${userName} लाई सिट #${seatNumber} बाट हटाउनुभयो (दर्शकको रूपमा लाइभ भने निरन्तर हेरिरहन मिल्नेछ)।`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Moderation: 30 Minutes Ban & Kick for disruptive / inappropriate behavior
  const handleBanUser30m = (
    userName: string,
    userAvatar?: string,
    reason?: string,
    seatNumber?: number
  ) => {
    if (seatNumber) {
      setPartySeats((prev) =>
        prev.map((s) =>
          s.seatNumber === seatNumber
            ? {
                ...s,
                isOccupied: false,
                userName: undefined,
                userAvatar: undefined,
                isHost: false,
                isAdmin: false,
                isFanClub: false,
                isSpeaking: false,
                isMuted: false,
                isVideoOn: false,
                videoUrl: undefined,
              }
            : s
        )
      );
    }

    const now = Date.now();
    const expiresAt = now + 30 * 60 * 1000; // Exactly 30 minutes
    const actor = effectiveIsHost ? 'होस्ट (Host)' : 'व्यवस्थापक (Admin)';
    const banReasonText = reason || 'अनुचित बोली वा गालीगलौज';

    const newBan: BannedUser = {
      id: `ban-${now}`,
      userName,
      userAvatar: userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bannedBy: actor,
      bannedAt: now,
      expiresAt,
      reason: banReasonText,
    };

    setBannedUsers((prev) => [newBan, ...prev]);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `ban-msg-${now}`,
        user: 'TikTop Moderation 🚫',
        avatar: '',
        text: `🚫 [३० मिनेट निष्कासन] ${actor} ले ${userName} लाई अनुचित व्यवहार (${banReasonText}) का कारण ३० मिनेटका लागि लाइभबाट निष्कासन तथा प्रतिबन्ध लगाउनुभयो!`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Moderation: Unban a previously banned user
  const handleUnbanUser = (banId: string) => {
    const target = bannedUsers.find((b) => b.id === banId);
    setBannedUsers((prev) => prev.filter((b) => b.id !== banId));
    if (target) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `unban-${Date.now()}`,
          user: 'TikTop Moderation ✅',
          avatar: '',
          text: `✅ ${target.userName} को ३० मिनेट प्रतिबन्ध फुकुवा गरियो।`,
          type: 'system',
          timestamp: 'Just now',
        },
      ]);
    }
  };

  // Host: Appoint or remove Admin role on a seat
  const handleToggleAdmin = (seatNumber: number, makeAdmin: boolean) => {
    setPartySeats((prev) =>
      prev.map((s) => {
        if (s.seatNumber === seatNumber) {
          return { ...s, isAdmin: makeAdmin };
        }
        return s;
      })
    );

    const seat = partySeats.find((s) => s.seatNumber === seatNumber);
    const targetName = seat?.userName || `Seat #${seatNumber}`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `admin-toggle-${Date.now()}`,
        user: 'TikTop Moderation 🛡️',
        avatar: '',
        text: `🛡️ होस्टले ${targetName} लाई व्यवस्थापक (Admin) ${
          makeAdmin ? 'पदमा नियुक्त गर्नुभयो' : 'पदबाट हटाउनुभयो'
        }!`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Invite an audience member to sit on a specific seat
  const handleSendInvite = (targetUser: any, seatNumber: number) => {
    const inv: SeatInvitation = {
      id: `inv-${Date.now()}`,
      seatNumber,
      invitedBy: effectiveIsHost ? 'Host' : 'Admin',
      invitedUserName: targetUser.name || 'Audience Member',
      invitedUserAvatar: targetUser.avatar,
      timestamp: Date.now(),
    };

    // Set active invitation so it can be previewed/accepted in UI
    setActiveSeatInvitation(inv);

    const actor = effectiveIsHost ? 'होस्ट' : 'एडमिन';
    setChatMessages((prev) => [
      ...prev,
      {
        id: `inv-sent-${Date.now()}`,
        user: 'TikTop Party 📩',
        avatar: '',
        text: `📩 ${actor} ले ${inv.invitedUserName} लाई Seat #${seatNumber} मा बस्न आमन्त्रण पठाउनुभयो!`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Audience accepts seat invitation
  const handleAcceptSeatInvite = (invitation: SeatInvitation) => {
    const updated = assignUserToSeat(partySeats, invitation.seatNumber, {
      userName: `${userProfile?.name || invitation.invitedUserName}`,
      userAvatar: userProfile?.avatar || invitation.invitedUserAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isHost: false,
      isVideoOn: isCameraOn,
      isAdmin: false,
      isFanClub: isUserFanClub,
    });
    setPartySeats(updated);
    setActiveSeatInvitation(null);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `inv-accepted-${Date.now()}`,
        user: 'TikTop Party 🎉',
        avatar: '',
        text: `🎉 ${invitation.invitedUserName} ले आमन्त्रण स्वीकार गरि Seat #${invitation.seatNumber} मा बस्नुभयो!`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Audience declines seat invitation
  const handleDeclineSeatInvite = () => {
    setActiveSeatInvitation(null);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `inv-declined-${Date.now()}`,
        user: 'TikTop Party',
        avatar: '',
        text: `सिट आमन्त्रण अस्वीकार गरियो।`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Audience sends request to join a seat (in Approval Mode)
  const handleRequestSeat = (seatNumber: number) => {
    const currentUserName = userProfile?.name || 'You';

    // Check ban
    const activeBan = bannedUsers.find(
      (b) => (b.userName === currentUserName || b.userName === 'You') && b.expiresAt > Date.now()
    );
    if (activeBan) {
      alert('⚠️ तपाईंलाई प्रतिबन्ध लगाइएको छ, सिट अनुरोध पठाउन मिल्दैन।');
      return;
    }

    const newReq: SeatJoinRequest = {
      id: `req-${Date.now()}`,
      seatNumber: seatNumber,
      requestedSeatNumber: seatNumber,
      userName: currentUserName,
      userAvatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isFanClub: isUserFanClub,
      timestamp: Date.now(),
      requestedAt: Date.now(),
    };

    setSeatJoinRequests((prev) => [newReq, ...prev]);

    setChatMessages((prev) => [
      ...prev,
      {
        id: `req-chat-${Date.now()}`,
        user: 'TikTop Party 🙋',
        avatar: '',
        text: `🙋 ${currentUserName} ले Seat #${seatNumber} मा बस्न अनुरोध पठाउनुभयो।`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Host/Admin approves a seat join request
  const handleApproveRequest = (requestId: string) => {
    const req = seatJoinRequests.find((r) => r.id === requestId);
    if (req) {
      const updated = assignUserToSeat(partySeats, req.requestedSeatNumber, {
        userName: req.userName,
        userAvatar: req.userAvatar,
        isHost: false,
        isVideoOn: true,
        isFanClub: req.isFanClub,
      });
      setPartySeats(updated);
      setSeatJoinRequests((prev) => prev.filter((r) => r.id !== requestId));

      const actor = effectiveIsHost ? 'होस्ट' : 'एडमिन';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `req-appr-${Date.now()}`,
          user: 'TikTop Moderation ✅',
          avatar: '',
          text: `✅ ${actor} ले ${req.userName} को सिट #${req.requestedSeatNumber} अनुरोध स्वीकृत गर्नुभयो!`,
          type: 'system',
          timestamp: 'Just now',
        },
      ]);
    }
  };

  // Host/Admin declines a seat join request
  const handleDeclineRequest = (requestId: string) => {
    setSeatJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // Change party access mode (Free / Approval / FanClub)
  const handleChangeAccessMode = (newMode: PartyAccessMode) => {
    setPartyAccessMode(newMode);
    const modeLabels: Record<PartyAccessMode, string> = {
      free: 'खुला (सबै बस्न मिल्ने)',
      approval: 'स्वीकृति प्रणाली (होस्ट वा एडमिनको स्वीकृति चाहिने)',
      fanclub: 'फ्यानक्लब सदस्य मात्र बस्न मिल्ने',
    };

    setChatMessages((prev) => [
      ...prev,
      {
        id: `mode-change-${Date.now()}`,
        user: 'TikTop Party ⚙️',
        avatar: '',
        text: `⚙️ सिट नियम परिवर्तन: ${modeLabels[newMode]}`,
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  const handleToggleSeatMic = (seatNumber: number) => {
    const target = partySeats.find((s) => s.seatNumber === seatNumber);
    if (!target) return;
    const isSelf = target.userName?.includes('You') || (userProfile?.name && target.userName?.startsWith(userProfile.name));
    const nextMuted = !target.isMuted;

    setPartySeats((prev) =>
      prev.map((s) => {
        if (s.seatNumber === seatNumber) {
          if (isSelf) {
            setIsMicOn(!nextMuted);
          }
          return { ...s, isMuted: nextMuted };
        }
        return s;
      })
    );

    if (!isSelf) {
      const actor = effectiveIsHost ? 'होस्ट' : 'व्यवस्थापक (Admin)';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `mic-${Date.now()}`,
          user: 'TikTop Party 🎙️',
          avatar: '',
          text: `🎙️ ${actor} ले ${target.userName} को माइक ${nextMuted ? 'म्युट (Mute)' : 'अनम्युट (Unmute)'} गर्नुभयो।`,
          type: 'system',
          timestamp: 'Just now',
        },
      ]);
    }
  };

  const handleToggleSeatVideo = (seatNumber: number) => {
    setPartySeats((prev) =>
      prev.map((s) => {
        if (s.seatNumber === seatNumber) {
          // RULE: क्यामेरा अन/अफ केवल प्रयोगकर्ता स्वयंले मात्र गर्न मिल्छ
          const isSelf = s.userName?.includes('You') || (userProfile?.name && s.userName?.startsWith(userProfile.name));
          if (!isSelf) {
            return s;
          }
          const nextVideo = !s.isVideoOn;
          setIsCameraOn(nextVideo);
          return { ...s, isVideoOn: nextVideo };
        }
        return s;
      })
    );
  };

  // Format Duration string (supports hh:mm:ss for longer streams)
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainder = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="live-room-wrapper"
      className="relative w-full h-[100dvh] max-w-md mx-auto bg-black text-white flex flex-col justify-between overflow-hidden select-none shadow-2xl"
    >
      {/* Background Feed: Face Live = Video stream kept visible in upper area when gift tray is open */}
      {mode === 'face' ? (
        <div
          className={`absolute inset-x-0 top-0 z-0 transition-all duration-300 ${
            isGiftTrayOpen ? 'h-[52vh]' : 'h-full'
          }`}
        >
          <LiveCameraStream
            isCameraOn={true}
            isMicOn={isMicOn}
            facingMode={facingMode}
            filter={filter}
            isPersonPresent={isPersonPresent}
            onToggleFacingMode={() =>
              setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
            }
            streamerName={userProfile?.name || 'You (Host)'}
            isHost={true}
          />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-950 overflow-hidden">
          {/* Ambient stage lights for Party Room */}
          <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 right-10 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        </div>
      )}

      {/* Dark scrims for UI legibility */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-black/70 via-transparent to-black/85" />

      {/* ================= TOP HEADER ================= */}
      <div id="live-room-topbar" className="relative z-20 px-3 pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {/* Streamer info pill */}
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/10 shadow-lg">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-rose-500">
              <img
                src={userProfile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                alt="Host avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold truncate max-w-[80px]">{userProfile?.name || 'You (Host)'}</span>
                <span className="bg-rose-500 text-[9px] font-extrabold px-1 rounded-sm uppercase tracking-tight">
                  LIVE
                </span>
                {/* Host Live Level Badge */}
                <span
                  className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5"
                  title={`Live Level: Lv.${hostLiveLevel.level} (${hostLiveLevel.nepaliTitle})`}
                >
                  <span>🎙️</span>
                  <span>Lv.{hostLiveLevel.level}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/70 flex items-center gap-1">
                  <span>{formatTime(streamDuration)}</span>
                  {isHostStreamer && mode === 'face' && !isPersonPresent && (
                    <span className="text-[9px] bg-rose-500/80 text-white font-bold px-1.5 py-0.2 rounded-full border border-rose-400/40">
                      रोकियो (Paused)
                    </span>
                  )}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-[9px] text-amber-300 font-bold flex items-center gap-0.5" title={`तपाईंको Wealth Level: Lv.${myWealthLevel.level}`}>
                  <span>👑</span>
                  <span>Wealth Lv.{myWealthLevel.level}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Mode & Category Pill */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md border ${
                mode === 'face'
                  ? 'bg-rose-600/80 border-rose-400/40 text-rose-100'
                  : 'bg-indigo-600/80 border-indigo-400/40 text-indigo-100'
              }`}
            >
              {mode === 'face' ? '👤 Face Live' : '🎉 Party Live'}
            </span>

            {/* Role Switcher Pill for Interactive Moderation Testing */}
            <div className="flex items-center gap-1 bg-black/55 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/20 text-[10px]">
              <span className="text-neutral-400 text-[9.5px]">भूमिका:</span>
              <select
                id="live-room-role-selector"
                value={currentRole}
                onChange={(e) => {
                  const newRole = e.target.value as 'host' | 'admin' | 'guest';
                  setCurrentRole(newRole);
                  setChatMessages((prev) => [
                    ...prev,
                    {
                      id: `role-${Date.now()}`,
                      user: 'TikTop System 🛡️',
                      avatar: '',
                      text: `🛡️ तपाईंको भूमिका '${newRole === 'host' ? '👑 Host (होस्ट)' : newRole === 'admin' ? '🛡️ Admin (व्यवस्थापक)' : '👁️ Guest (दर्शक)'}' मा परिवर्तन भयो।`,
                      type: 'system',
                      timestamp: 'Just now',
                    },
                  ]);
                }}
                className="bg-transparent text-white font-black text-[10px] focus:outline-none cursor-pointer"
                title="भूमिका छान्नुहोस् (Role: Host / Admin / Guest)"
              >
                <option value="host" className="bg-neutral-900 text-amber-300">👑 Host</option>
                <option value="admin" className="bg-neutral-900 text-indigo-300">🛡️ Admin</option>
                <option value="guest" className="bg-neutral-900 text-white">👁️ Guest</option>
              </select>
            </div>

            {/* Viewers Pill - Only shown when viewers > 0 */}
            {viewersCount > 0 && (
              <button
                type="button"
                id="btn-viewers-list-toggle"
                onClick={() => setIsViewerListOpen(true)}
                className="flex items-center gap-1 bg-black/45 hover:bg-black/65 active:scale-95 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10 text-xs font-semibold cursor-pointer transition-all"
                title="दर्शकहरूको सूची र मोडरेशन हेर्नुहोस्"
              >
                <Users size={12} className="text-emerald-400" />
                <span>{viewersCount.toLocaleString()}</span>
              </button>
            )}

            {/* Safe End Live Button */}
            <button
              type="button"
              id="btn-end-live-stream"
              onClick={() => setShowExitConfirm(true)}
              className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95 ml-1"
              title="End Stream"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Room Title and Diamonds Counter Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-medium text-white/90 truncate">
              {roomTitle || (mode === 'face' ? 'My Face Live Stream' : 'Live Party Chat')}
            </span>
            <span className="text-[10px] text-white/60">#{roomCategory}</span>
          </div>

          <div className="flex items-center gap-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-300 text-[11px] font-bold">
            <span>💎</span>
            <span>{diamondsEarned.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* On-Screen Center Warning Notice: STRICTLY HOST ONLY (दर्शकले देख्दैनन्) */}
      {isHostStreamer && mode === 'face' && !isPersonPresent && (
        <div
          id="host-face-absent-center-notice"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-sm rounded-3xl bg-neutral-950 border-2 border-amber-500 shadow-2xl shadow-amber-500/25 p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <AlertTriangle size={36} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-amber-300">
                क्यामेरा अगाडि मान्छे देखिएन!
              </h3>
              <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-semibold">
                क्यामेरा अगाडि मान्छे नदेखिएकाले <span className="text-rose-400 font-black">लाइभ समय गणना रोकिएको छ</span> (Live Count Paused)।
              </p>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                नियम अनुसार क्यामेरा अगाडि मान्छे उपस्थित भएपछि मात्र लाइभ समय गणना पुनः सुरु हुनेछ।
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 font-medium">
              🔒 यो सूचना तपाईं (होस्ट) लाई मात्र देखाइएको छ। दर्शकलाई देखाइएको छैन।
            </div>

            <button
              type="button"
              id="btn-confirm-return-face"
              onClick={() => handleTogglePersonPresence(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>👤 म क्यामेरा अगाडि आएँ (समय पुन: सुरु गर्नुहोस्)</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= PARTY LIVE STAGE (IF PARTY MODE) ================= */}
      {/* Kept un-obscured in upper half when gift tray is open */}
      {mode === 'party' && (
        <div
          id="party-live-section"
          className={`relative z-20 transition-all duration-300 ${
            isGiftTrayOpen ? 'max-h-[48vh] overflow-y-auto my-1' : 'my-auto'
          } animate-fade-in`}
        >
          <PartyGrid
            seats={partySeats}
            seatCount={partySeatCount}
            onChangeSeatCount={handleChangeSeatCount}
            onTakeSeat={handleTakeSeat}
            onLeaveSeat={handleLeaveSeat}
            onToggleSeatMic={handleToggleSeatMic}
            onToggleSeatVideo={handleToggleSeatVideo}
            onOpenGiftForSeat={handleOpenGiftForSeat}
            isHost={effectiveIsHost}
            isAdmin={effectiveIsAdmin}
            isCameraOn={isCameraOn}
            facingMode={facingMode}
            filter={filter}
            onToggleFacingMode={() =>
              setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
            }
            accessMode={partyAccessMode}
            onChangeAccessMode={handleChangeAccessMode}
            joinRequests={seatJoinRequests}
            onApproveRequest={handleApproveRequest}
            onDeclineRequest={handleDeclineRequest}
            bannedUsers={bannedUsers}
            onKickFromSeat={handleKickFromSeat}
            onBanUser30m={handleBanUser30m}
            onUnbanUser={handleUnbanUser}
            onToggleAdmin={handleToggleAdmin}
            onSendInvite={handleSendInvite}
            onRequestSeat={handleRequestSeat}
            isUserFanClub={isUserFanClub}
            currentUserName={userProfile?.name || 'You'}
          />

          {/* PK Battle Bar (Party Live Feature) */}
          {isPkActive && (
            <div
              id="pk-battle-display"
              className="mx-3 my-1 p-2 rounded-2xl bg-neutral-900/90 border border-white/20 shadow-2xl backdrop-blur-md animate-slide-down"
            >
              <div className="flex items-center justify-between text-xs font-black px-1 mb-1">
                <span className="text-sky-400">BLUE: {pkBlueScore}</span>
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                  PK {pkTimeLeft}s
                </span>
                <span className="text-rose-400">RED: {pkRedScore}</span>
              </div>
              <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-sky-500 transition-all duration-300"
                  style={{ width: `${(pkBlueScore / (pkBlueScore + pkRedScore)) * 100}%` }}
                />
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{ width: `${(pkRedScore / (pkRedScore + pkBlueScore)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Hearts Container */}
      <FloatingHearts triggerCount={heartTrigger} />

      {/* Full-screen Gift Animation Overlay */}
      <GiftEffectOverlay
        activeGift={activeGiftAnimation}
        onFinished={() => setActiveGiftAnimation(null)}
      />

      {/* ================= BOTTOM SECTION: CHAT & CONTROLS ================= */}
      {/* Positioned at the very bottom so face remains completely unobstructed */}
      <div id="live-room-bottom-section" className="relative z-20 px-3 pb-3 mt-auto flex flex-col gap-2">
        {/* Live Chat Box (Clean compact overlay: Only displayed when someone comments) */}
        {chatMessages.length > 0 && (
          <div
            ref={chatScrollRef}
            id="live-chat-scroll-area"
            className="max-h-20 sm:max-h-24 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/20 select-text"
          >
            {chatMessages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="inline-block max-w-[90%] bg-indigo-950/70 border border-indigo-500/30 text-indigo-200 text-[11px] px-2.5 py-0.5 rounded-lg backdrop-blur-md"
                >
                  <span className="font-semibold text-indigo-300">📢 {msg.user}: </span>
                  <span>{msg.text}</span>
                </div>
              );
            }

            if (msg.type === 'gift') {
              return (
                <div
                  key={msg.id}
                  className="inline-flex items-center gap-1.5 max-w-[95%] bg-gradient-to-r from-amber-500/30 to-rose-500/30 border border-amber-400/40 text-white text-[11px] px-2.5 py-0.5 rounded-lg backdrop-blur-md shadow-md animate-bounce-short"
                >
                  {msg.badge && (
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-black text-[9px] px-1.5 py-0.2 rounded-full shadow-sm">
                      {msg.badge}
                    </span>
                  )}
                  <span className="font-bold text-amber-300">{msg.user}</span>
                  <span className="text-white/80">{msg.text}</span>
                  <span className="text-sm">{msg.giftIcon}</span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                onClick={() => {
                  if (msg.user && !msg.user.includes('You') && !msg.user.includes('TikTop')) {
                    setInspectedViewer({
                      userName: msg.user,
                      userAvatar: msg.avatar,
                      badge: msg.badge,
                    });
                  }
                }}
                className="inline-flex items-start gap-1 max-w-[88%] bg-black/50 hover:bg-black/75 cursor-pointer border border-white/10 text-[11px] px-2 py-0.5 rounded-lg backdrop-blur-md transition-all active:scale-98"
                title={hasModeratorRights ? "प्रयोगकर्ता मोडरेशन / ३० मिनेट निष्कासन (क्लिक गर्नुहोस्)" : "उपहार पठाउनुहोस्"}
              >
                {msg.badge && (
                  <span className="bg-amber-500 text-black font-extrabold text-[8px] px-1 rounded-xs mt-0.5">
                    {msg.badge}
                  </span>
                )}
                <span className="font-bold text-rose-300 shrink-0 hover:underline">{msg.user}:</span>
                <span className="text-white/90 break-words">{msg.text}</span>
              </div>
            );
          })}
        </div>
        )}

        {/* Live Comment Input and Quick Bar */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
          <input
            type="text"
            id="input-live-comment"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Say something nice..."
            className="flex-1 bg-black/50 border border-white/20 rounded-full px-3.5 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-rose-500 backdrop-blur-md transition-all"
          />
          <button
            type="submit"
            id="btn-send-comment"
            disabled={!commentInput.trim()}
            className="p-2 rounded-full bg-rose-600 disabled:opacity-40 text-white hover:bg-rose-700 transition-all active:scale-95 shrink-0 shadow-md"
            title="Send"
          >
            <Send size={15} />
          </button>
        </form>

        {/* Stream Controls Action Toolbar */}
        <div id="live-action-toolbar" className="flex items-center justify-between pt-1">
          {/* Left Controls: Mic, Camera, Filter */}
          <div className="flex items-center gap-1.5">
            {/* Mic Toggle */}
            <button
              type="button"
              id="btn-toggle-mic"
              onClick={() => {
                const nextMic = !isMicOn;
                setIsMicOn(nextMic);
                setPartySeats((prev) =>
                  prev.map((s) => (s.userName?.includes('You') ? { ...s, isMuted: !nextMic } : s))
                );
              }}
              className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                isMicOn
                  ? 'bg-white/15 border-white/20 text-white'
                  : 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic size={17} /> : <MicOff size={17} />}
            </button>

            {/* Video Control: Allowed to toggle in Party Live; in Face Live camera cannot be turned off! */}
            {mode === 'party' ? (
              <button
                type="button"
                id="btn-toggle-camera"
                onClick={() => {
                  const nextCam = !isCameraOn;
                  setIsCameraOn(nextCam);
                  setPartySeats((prev) =>
                    prev.map((s) => (s.userName?.includes('You') ? { ...s, isVideoOn: nextCam } : s))
                  );
                }}
                className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                  isCameraOn
                    ? 'bg-white/15 border-white/20 text-white'
                    : 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                }`}
                title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {isCameraOn ? <Video size={17} /> : <VideoOff size={17} />}
              </button>
            ) : (
              <div
                id="face-live-camera-locked"
                className="p-2.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 backdrop-blur-md flex items-center justify-center cursor-default"
                title="Face Live मा क्यामेरा अनिवार्य अन रहन्छ (Camera off forbidden in Face Live)"
              >
                <Video size={17} className="text-emerald-300" />
              </div>
            )}

            {/* Beauty & Visual Filters */}
            <button
              type="button"
              id="btn-open-filters"
              onClick={() => setIsFilterSheetOpen(true)}
              className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                filter !== 'none'
                  ? 'bg-rose-500 border-rose-400 text-white'
                  : 'bg-white/15 border-white/20 text-white hover:bg-white/25'
              }`}
              title="Beauty & Video Filters"
            >
              <Sparkles size={17} />
            </button>

            {/* Host Face Presence Simulation Test (Host Only) */}
            {mode === 'face' && isHostStreamer && (
              <button
                type="button"
                id="btn-simulate-presence-toggle"
                onClick={() => handleTogglePersonPresence()}
                className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                  isPersonPresent
                    ? 'bg-white/15 border-white/20 text-white hover:bg-white/25'
                    : 'bg-amber-500 border-amber-400 text-white animate-pulse'
                }`}
                title={isPersonPresent ? 'मान्छे बाहिरिएको परीक्षण (Step Away)' : 'क्यामेरा अगाडि फर्किनुहोस् (Return)'}
              >
                {isPersonPresent ? <UserMinus size={17} /> : <UserCheck size={17} />}
              </button>
            )}

            {/* Party Mode Special Feature: PK Battle or Party Music */}
            {mode === 'party' && (
              <button
                type="button"
                id="btn-toggle-pk"
                onClick={() => setIsPkActive(!isPkActive)}
                className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                  isPkActive
                    ? 'bg-amber-500 border-amber-400 text-black font-bold animate-pulse'
                    : 'bg-indigo-600/80 border-indigo-400 text-white hover:bg-indigo-500'
                }`}
                title="Start PK Battle"
              >
                <Swords size={17} />
              </button>
            )}

            {/* Party Mode Background Music Audio toggle */}
            {mode === 'party' && (
              <button
                type="button"
                id="btn-toggle-party-music"
                onClick={() => setIsPartyAudioActive(!isPartyAudioActive)}
                className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                  isPartyAudioActive
                    ? 'bg-emerald-600/80 border-emerald-400 text-white'
                    : 'bg-white/10 border-white/15 text-white/60'
                }`}
                title="Party Background Music"
              >
                {isPartyAudioActive ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>
            )}
          </div>

          {/* Right Controls: Share, Gift Tray, Heart Like */}
          <div className="flex items-center gap-2">
            {/* Share */}
            <button
              type="button"
              id="btn-share-stream"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'TikTop Live',
                    text: `Watch my live stream on TikTop: ${roomTitle}`,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Stream link copied to clipboard!');
                }
              }}
              className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-md transition-all active:scale-90"
              title="Share Stream"
            >
              <Share2 size={17} />
            </button>

            {/* Gifts Tray Trigger */}
            <button
              type="button"
              id="btn-open-gift-tray"
              onClick={() => setIsGiftTrayOpen(true)}
              className="p-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 border border-amber-300/40 text-white shadow-lg shadow-amber-500/30 transition-all active:scale-90 animate-pulse"
              title="Send Gift"
            >
              <GiftIcon size={18} />
            </button>

            {/* Like Heart Button */}
            <button
              type="button"
              id="btn-tap-heart-like"
              onClick={handleLikeTap}
              className="relative p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 border border-rose-400/50 transition-all active:scale-125"
              title="Like / Heart"
            >
              <Heart size={20} className="fill-white" />
              <span className="absolute -top-1 -right-1 bg-amber-400 text-black font-extrabold text-[9px] px-1 rounded-full shadow">
                {likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODALS & SHEETS ================= */}

      {/* Gift Tray Drawer */}
      <GiftTray
        isOpen={isGiftTrayOpen}
        userCoins={coinsBalance}
        userDiamonds={coinsBalance}
        isPartyLive={isPartyLive}
        partySeats={partySeats}
        selectedRecipients={selectedPartyRecipients}
        onSelectRecipients={setSelectedPartyRecipients}
        onClose={() => setIsGiftTrayOpen(false)}
        onSendGift={handleSendGift}
        onRechargeCoins={onOpenRechargeCoins}
        onQuickAddTestCoins={() => {
          const added = 100000;
          if (onUpdateCoins) onUpdateCoins(coinsBalance + added);
          else if (onUpdateDiamonds) onUpdateDiamonds(coinsBalance + added);
        }}
        onRechargeDiamonds={onOpenRechargeCoins || (() => {
          if (onUpdateCoins) onUpdateCoins(coinsBalance + 500);
          else if (onUpdateDiamonds) onUpdateDiamonds(coinsBalance + 500);
        })}
      />

      {/* Filter Selector Drawer */}
      <FilterSelector
        isOpen={isFilterSheetOpen}
        activeFilter={filter}
        onSelectFilter={(f) => {
          setFilter(f);
          setIsFilterSheetOpen(false);
        }}
        onClose={() => setIsFilterSheetOpen(false)}
      />

      {/* Leave Live Room System Modal (लाइभ छोड्ने प्रणाली) */}
      <LeaveLiveModal
        isOpen={showExitConfirm}
        isHost={isHostStreamer}
        streamDuration={streamDuration}
        viewersCount={viewersCount}
        diamondsEarned={diamondsEarned}
        likesCount={likesCount}
        onConfirmEnd={() => {
          setShowExitConfirm(false);
          setShowSummary(true);
        }}
        onMinimize={() => {
          setShowExitConfirm(false);
          onExit();
        }}
        onCancel={() => setShowExitConfirm(false)}
      />

      {/* Level Up Celebration Popup Modal (वेल्थ लेभल वा लाइभ लेभल वृद्धि बधाई) */}
      {levelUpData && (
        <LevelUpCelebrationModal
          isOpen={!!levelUpData}
          type={levelUpData.type}
          levelInfo={levelUpData.levelInfo}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {/* Post-Stream Analytics Summary Modal */}
      <StreamSummaryModal
        isOpen={showSummary}
        durationSeconds={streamDuration}
        viewerCount={viewersCount}
        likesCount={likesCount}
        diamondsEarned={diamondsEarned}
        liveRewardPoints={liveDurationRewardPoints}
        onClose={() => {
          setShowSummary(false);
          onExit(); // Safely returns to Home View
        }}
      />

      {/* Viewer Profile & Moderation Modal (30-Minute Ban & Seat Removal for Host & Admin) */}
      {inspectedViewer && (() => {
        const seated = partySeats.find(
          (s) => s.isOccupied && s.userName === inspectedViewer.userName
        );

        return (
          <div
            id="modal-viewer-moderation"
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setInspectedViewer(null)}
          >
            <div
              className="w-full max-w-xs bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-rose-500/50">
                    <img
                      src={inspectedViewer.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                      alt={inspectedViewer.userName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{inspectedViewer.userName}</span>
                      {inspectedViewer.badge && (
                        <span className="text-[9px] bg-amber-500 text-black font-extrabold px-1 rounded">
                          {inspectedViewer.badge}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      {seated ? `🪑 पार्टी सिट #${seated.seatNumber} मा बसेको` : '👁️ लाइभ दर्शक (Viewer)'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedViewer(null)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Host & Admin Moderation Section */}
              {hasModeratorRights && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <ShieldAlert size={15} />
                    <span>मोडरेशन नियन्त्रण ({effectiveIsHost ? 'Host' : 'Admin'})</span>
                  </div>

                  {/* Option 1: Remove from Seat ONLY (stays in live as viewer) */}
                  {seated && (
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                      <button
                        type="button"
                        id="btn-viewer-kick-seat-only"
                        onClick={() => {
                          handleKickFromSeat(seated.seatNumber, inspectedViewer.userName);
                          setInspectedViewer(null);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                      >
                        <UserX size={15} className="text-amber-400" />
                        <span>सिटबाट मात्र हटाउनुहोस् (दर्शक बनाउनुहोस्)</span>
                      </button>
                      <p className="text-[9.5px] text-amber-300/80 text-center px-1">
                        💡 सिटबाट मात्र हट्नुहुनेछ, लाइभ प्रसारण भने दर्शक बनेर निरन्तर हेर्न पाउनेछन्।
                      </p>
                    </div>
                  )}

                  {/* Option 2: 30-Minute Ban from Live */}
                  <div className="p-2.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-rose-300 font-bold block">
                        निष्कासनको कारण (Reason):
                      </label>
                      <select
                        value={liveBanReason}
                        onChange={(e) => setLiveBanReason(e.target.value)}
                        className="w-full bg-black/60 border border-rose-500/40 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="अनुचित बोली वा गालीगलौज">अनुचित बोली वा गालीगलौज</option>
                        <option value="स्पाम वा अनावश्यक विज्ञापन">स्पाम वा अनावश्यक विज्ञापन</option>
                        <option value="समुदाय दिशानिर्देश उल्लंघन">समुदाय दिशानिर्देश उल्लंघन</option>
                        <option value="होस्ट वा अन्य प्रयोगकर्ता अपमान">होस्ट वा अन्य प्रयोगकर्ता अपमान</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      id="btn-viewer-30m-ban"
                      onClick={() => {
                        handleBanUser30m(
                          inspectedViewer.userName,
                          inspectedViewer.userAvatar,
                          liveBanReason,
                          seated?.seatNumber
                        );
                        setInspectedViewer(null);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition-all active:scale-95"
                    >
                      <Ban size={14} />
                      <span>३० मिनेटका लागि निष्कासन / ब्लक (30m Ban)</span>
                    </button>
                    <p className="text-[9.5px] text-rose-300/80 text-center px-1">
                      🚫 प्रयोगकर्तालाई ३० मिनेटका लागि लाइभबाट निष्कासन तथा कमेन्ट/सिट प्रतिबन्ध लगाइन्छ।
                    </p>
                  </div>
                </div>
              )}

              {/* General Actions */}
              <div className="pt-2 border-t border-white/10 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInspectedViewer(null);
                    setIsGiftTrayOpen(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <GiftIcon size={14} />
                  <span>उपहार पठाउनुहोस्</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedViewer(null)}
                  className="py-2 px-3 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/15 transition-all"
                >
                  बन्द गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Active Viewers & Moderation List Modal */}
      {isViewerListOpen && (
        <div
          id="modal-active-viewers-list"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsViewerListOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl space-y-3 animate-scale-up max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  दर्शक तथा मोडरेशन सूची ({viewersCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsViewerListOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[11px] text-neutral-400">
              {hasModeratorRights
                ? 'होस्ट र एडमिनले दर्शकलाई ३० मिनेटका लागि लाइभबाट निष्कासन वा सिटबाट मात्र हटाउन सक्नुहुन्छ:'
                : 'लाइभ हेरिरहेका सक्रिय दर्शकहरू:'}
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {/* Combine seated users and mock audience */}
              {([
                ...partySeats
                  .filter((s) => s.isOccupied && !s.userName?.includes('You (Host)'))
                  .map((s) => ({
                    name: s.userName || 'Guest',
                    avatar: s.userAvatar,
                    isSeated: true,
                    seatNumber: s.seatNumber as number | undefined,
                    badge: s.isAdmin ? 'ADMIN' : s.isFanClub ? 'FAN' : undefined,
                  })),
                {
                  name: 'Aayush Nepal',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                  isSeated: false,
                  seatNumber: undefined,
                  badge: 'FAN',
                },
                {
                  name: 'Sunita Sharma',
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                  isSeated: false,
                  seatNumber: undefined,
                },
                {
                  name: 'Bikram Thapa',
                  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                  isSeated: false,
                  seatNumber: undefined,
                },
              ] as Array<{ name: string; avatar?: string; isSeated: boolean; seatNumber?: number; badge?: string }>).map((viewer, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={viewer.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                      alt={viewer.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{viewer.name}</span>
                        {viewer.badge && (
                          <span className="text-[8px] bg-amber-500 text-black font-extrabold px-1 rounded">
                            {viewer.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {viewer.isSeated ? `🪑 सिट #${viewer.seatNumber}` : 'दर्शक (Viewer)'}
                      </span>
                    </div>
                  </div>

                  {hasModeratorRights && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsViewerListOpen(false);
                        setInspectedViewer({
                          userName: viewer.name,
                          userAvatar: viewer.avatar,
                          badge: viewer.badge,
                        });
                      }}
                      className="py-1 px-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 font-bold text-[10px] flex items-center gap-1 transition-all active:scale-95"
                    >
                      <ShieldAlert size={12} />
                      <span>मोडरेशन</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsViewerListOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-all"
            >
              बन्द गर्नुहोस्
            </button>
          </div>
        </div>
      )}

      {/* 3-2-1 Animated Countdown Overlay Popup Before Stream Starts */}
      {isCountdownActive && (
        <CountdownOverlay
          mode={mode}
          roomTitle={roomTitle}
          roomCategory={roomCategory}
          onComplete={handleCountdownComplete}
        />
      )}
    </div>
  );
};
