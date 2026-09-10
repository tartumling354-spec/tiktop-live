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
import { LiveRewardCelebrationModal } from './LiveRewardCelebrationModal';
import { LiveRewardRulesModal } from './LiveRewardRulesModal';
import { SeatInvitePrompt } from './SeatInviteModal';
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

  // Audience & Activity State
  const [viewersCount, setViewersCount] = useState<number>(mode === 'party' ? 840 : 520);
  const [likesCount, setLikesCount] = useState<number>(142);
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
  const [currentRole, setCurrentRole] = useState<'host' | 'admin' | 'guest'>(
    isHostStreamer ? 'host' : 'guest'
  );
  const effectiveIsHost = currentRole === 'host';
  const effectiveIsAdmin = currentRole === 'admin';

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
  const [streamDuration, setStreamDuration] = useState<number>(0);

  // Live Duration Rewards State & Tracking
  // Rule: Face Live 1 hr -> 10,000 pts, 2 hr -> 10,000 pts (capped at 2 hr, max 20,000 pts)
  // Rule: Party Live 1 hr -> 2,000 pts, 2 hr -> 2,000 pts (capped at 2 hr, max 4,000 pts)
  // After cap, live stream can continue unlimited without further rewards!
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
  const [isRewardRulesOpen, setIsRewardRulesOpen] = useState<boolean>(false);
  const [activeRewardAlert, setActiveRewardAlert] = useState<{
    points: number;
    title: string;
    titleNep: string;
    description: string;
    isCapReached: boolean;
  } | null>(null);

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
    } catch {
      // Audio playback allowed on user interaction
    }
  };

  // Chat stream
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      user: 'TikTop System',
      avatar: '',
      text: `Live broadcast ready! Mode: ${mode === 'face' ? 'Face Live' : 'Party Live'}. Welcome viewers!`,
      type: 'system',
      timestamp: 'Just now',
    },
    {
      id: 'm2',
      user: 'Aayush',
      avatar: SAMPLE_FAN_AVATARS[0],
      text: 'Hey! Glad you are live! 💖',
      type: 'normal',
      timestamp: 'Just now',
    },
  ]);
  const [commentInput, setCommentInput] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Countdown completion handler
  const handleCountdownComplete = () => {
    setIsCountdownActive(false);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `start-${Date.now()}`,
        user: 'TikTop Broadcast Studio',
        avatar: '',
        text: '🔴 YOU ARE NOW LIVE! 3-2-1 countdown completed. Welcome your audience! 🎉',
        type: 'system',
        timestamp: 'Just now',
      },
    ]);
  };

  // Stream Duration Timer (starts only when 3-2-1 countdown finishes)
  useEffect(() => {
    if (isCountdownActive) return;
    const timer = setInterval(() => {
      setStreamDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCountdownActive]);

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
        playCelebrationChime();

        setActiveRewardAlert({
          points: pts,
          title: '1 Hour Face Live Milestone Completed!',
          titleNep: '🎉 १ घण्टा Face Live पूरा भयो!',
          description:
            'बधाई छ! १ घण्टा Face Live पूरा भए बापत १०,००० Points प्राप्त भयो। अर्को १ घण्टा (कुल २ घण्टा) पूरा गरेपछि फेरि १०,००० Points थपिनेछ!',
          isCapReached: false,
        });

        setChatMessages((prev) => [
          ...prev,
          {
            id: `reward-face-1h-${Date.now()}`,
            user: 'TikTop Rewards System',
            avatar: '',
            text: '🏆 बधाई छ! Host ले १ घण्टा Face Live पूरा गरेर १०,००० Points प्राप्त गर्नुभयो! 🎉',
            type: 'system',
            timestamp: 'Just now',
          },
        ]);
      }

      // Milestone 2: 2 Hours Face Live (7200s) -> 10,000 points (Total 20,000, Max Cap)
      if (streamDuration >= 7200 && !claimedMilestones.faceHour2) {
        setClaimedMilestones((prev) => ({ ...prev, faceHour2: true }));
        const pts = 10000;
        if (onAddPoints) onAddPoints(pts);
        if (onUpdateDiamonds) onUpdateDiamonds(userDiamondsRef.current + pts);
        setDiamondsEarned((prev) => prev + pts);
        setLiveDurationRewardPoints((prev) => prev + pts);
        playCelebrationChime();

        setActiveRewardAlert({
          points: pts,
          title: '2 Hours Face Live Milestone Completed (Max Cap)!',
          titleNep: '🏆 २ घण्टा Face Live पूरा भयो!',
          description:
            'बधाई छ! २ घण्टा पूरा भए बापत थप १०,००० Points (कुल २०,००० Points) प्राप्त भयो। २ घण्टा सम्म मात्र रिवार्ड दिइने हुनाले अधिकतम सीमा पूरा भयो। अब थप पोइन्ट दिइने छैन तर तपाईं जति समय पनि निरन्तर लाइभ बस्न सक्नुहुन्छ!',
          isCapReached: true,
        });

        setChatMessages((prev) => [
          ...prev,
          {
            id: `reward-face-2h-${Date.now()}`,
            user: 'TikTop Rewards System',
            avatar: '',
            text: '🏆 अद्भुत! Host ले २ घण्टा Face Live पूरा गरेर थप १०,००० Points (कुल २०,००० Points) प्राप्त गर्नुभयो! अधिकतम रिवार्ड सीमा पूरा भयो। 🎉',
            type: 'system',
            timestamp: 'Just now',
          },
        ]);
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
        playCelebrationChime();

        setActiveRewardAlert({
          points: pts,
          title: '1 Hour Party Live Milestone Completed!',
          titleNep: '🎉 १ घण्टा Party Live पूरा भयो!',
          description:
            'बधाई छ! Party Live १ घण्टा पूरा भए बापत २,००० Points प्राप्त भयो। अर्को १ घण्टा (कुल २ घण्टा) पूरा गरेपछि फेरि २,००० Points थपिनेछ!',
          isCapReached: false,
        });

        setChatMessages((prev) => [
          ...prev,
          {
            id: `reward-party-1h-${Date.now()}`,
            user: 'TikTop Rewards System',
            avatar: '',
            text: '🏆 बधाई छ! Host ले १ घण्टा Party Live पूरा गरेर २,००० Points प्राप्त गर्नुभयो! 🎉',
            type: 'system',
            timestamp: 'Just now',
          },
        ]);
      }

      // Party Live: Milestone 2: 2 Hours (7200s) -> 2,000 points (Total 4,000 Points, Max Cap)
      if (streamDuration >= 7200 && !claimedMilestones.partyHour2) {
        setClaimedMilestones((prev) => ({ ...prev, partyHour2: true }));
        const pts = 2000;
        if (onAddPoints) onAddPoints(pts);
        if (onUpdateDiamonds) onUpdateDiamonds(userDiamondsRef.current + pts);
        setDiamondsEarned((prev) => prev + pts);
        setLiveDurationRewardPoints((prev) => prev + pts);
        playCelebrationChime();

        setActiveRewardAlert({
          points: pts,
          title: '2 Hours Party Live Milestone Completed (Max Cap)!',
          titleNep: '🏆 २ घण्टा Party Live पूरा भयो!',
          description:
            'बधाई छ! Party Live २ घण्टा पूरा भए बापत फेरि २,००० Points (कुल ४,००० Points) प्राप्त भयो। २ घण्टा सम्म मात्र रिवार्ड दिइने हुनाले Party Live को अधिकतम सीमा पूरा भयो। अब थप पोइन्ट दिइने छैन तर साथीहरूसँग जति समय पनि पार्टी च्याट गर्न सक्नुहुन्छ!',
          isCapReached: true,
        });

        setChatMessages((prev) => [
          ...prev,
          {
            id: `reward-party-2h-${Date.now()}`,
            user: 'TikTop Rewards System',
            avatar: '',
            text: '🏆 अद्भुत! Host ले २ घण्टा Party Live पूरा गरेर फेरि २,००० Points (कुल ४,००० Points) प्राप्त गर्नुभयो! Party Live को अधिकतम रिवार्ड पूरा भयो। 🎉',
            type: 'system',
            timestamp: 'Just now',
          },
        ]);
      }
    }
  }, [streamDuration, mode, isCountdownActive, claimedMilestones, onUpdateDiamonds, onAddPoints]);

  // Periodic Viewer Fluctuations & Simulated Fan Activity
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewersCount((prev) => Math.max(12, prev + Math.floor(Math.random() * 7) - 3));
    }, 4000);

    const chatInterval = setInterval(() => {
      const randomFan = SAMPLE_FAN_NAMES[Math.floor(Math.random() * SAMPLE_FAN_NAMES.length)];
      const randomAvatar = SAMPLE_FAN_AVATARS[Math.floor(Math.random() * SAMPLE_FAN_AVATARS.length)];
      const randomComment = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];

      const newMsg: ChatMessage = {
        id: `fan-${Date.now()}`,
        user: randomFan,
        avatar: randomAvatar,
        text: randomComment,
        type: 'normal',
        timestamp: 'Just now',
      };

      setChatMessages((prev) => [...prev.slice(-40), newMsg]);
      setLikesCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 5500);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(chatInterval);
    };
  }, []);

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

  // Moderation: Kick user from seat
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

    const actor = effectiveIsHost ? 'होस्ट (Host)' : 'व्यवस्थापक (Admin)';
    setChatMessages((prev) => [
      ...prev,
      {
        id: `kick-${Date.now()}`,
        user: 'TikTop Moderation 🚪',
        avatar: '',
        text: `🚪 ${actor} ले ${userName} लाई सिट #${seatNumber} बाट हटाउनुभयो।`,
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
      userName: currentUserName,
      userAvatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      requestedSeatNumber: seatNumber,
      isFanClub: isUserFanClub,
      timestamp: Date.now(),
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
    setPartySeats((prev) =>
      prev.map((s) => {
        if (s.seatNumber === seatNumber) {
          const nextMuted = !s.isMuted;
          if (s.userName?.includes('You')) {
            setIsMicOn(!nextMuted);
          }
          return { ...s, isMuted: nextMuted };
        }
        return s;
      })
    );
  };

  const handleToggleSeatVideo = (seatNumber: number) => {
    setPartySeats((prev) =>
      prev.map((s) => {
        if (s.seatNumber === seatNumber) {
          const nextVideo = !s.isVideoOn;
          if (s.userName?.includes('You')) {
            setIsCameraOn(nextVideo);
          }
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
      {/* Background Feed: Face Live = Full Screen Video, Party Live = Ambient Stage Backdrop (Camera only inside seat box) */}
      {mode === 'face' ? (
        <div className="absolute inset-0 z-0">
          <LiveCameraStream
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            facingMode={facingMode}
            filter={filter}
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
                <span className="text-[10px] text-white/70">{formatTime(streamDuration)}</span>
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

            {/* Viewers Pill */}
            <div className="flex items-center gap-1 bg-black/45 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10 text-xs font-semibold">
              <Users size={12} className="text-emerald-400" />
              <span>{viewersCount.toLocaleString()}</span>
            </div>

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

        {/* Live Reward Milestones Clean Tracker (सफा रिवार्ड ब्यानर - नियम/टेस्ट हटाइएको) */}
        <div className="pt-0.5 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-amber-500/30 rounded-full px-2.5 py-1 text-xs shadow-md">
            <span className="text-amber-400 text-xs shrink-0 animate-pulse">🎁</span>
            <span className="text-[11px] font-bold text-amber-300">
              {mode === 'face' ? (
                streamDuration < 3600 ? (
                  `१ घण्टा रिवार्ड: १०,००० Pts (${Math.max(0, Math.ceil((3600 - streamDuration) / 60))} मिनेट बाँकी)`
                ) : streamDuration < 7200 ? (
                  `२ घण्टा रिवार्ड: फेरि +१०,००० Pts (${Math.max(0, Math.ceil((7200 - streamDuration) / 60))} मिनेट बाँकी)`
                ) : (
                  `🏆 २०,००० Pts प्राप्त! (२ घण्टा पूरा)`
                )
              ) : (
                streamDuration < 3600 ? (
                  `पार्टी १ घण्टा रिवार्ड: २,००० Pts (${Math.max(0, Math.ceil((3600 - streamDuration) / 60))} मिनेट बाँकी)`
                ) : (
                  `🏆 Party Live रिवार्ड प्राप्त!`
                )
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ================= PARTY LIVE STAGE (IF PARTY MODE) ================= */}
      {mode === 'party' && (
        <div id="party-live-section" className="relative z-20 my-auto animate-fade-in">
          <PartyGrid
            seats={partySeats}
            seatCount={partySeatCount}
            onChangeSeatCount={handleChangeSeatCount}
            onTakeSeat={handleTakeSeat}
            onLeaveSeat={handleLeaveSeat}
            onToggleSeatMic={handleToggleSeatMic}
            onToggleSeatVideo={handleToggleSeatVideo}
            onOpenGiftForSeat={handleOpenGiftForSeat}
            isHost={isHostStreamer}
            isCameraOn={isCameraOn}
            facingMode={facingMode}
            filter={filter}
            onToggleFacingMode={() =>
              setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
            }
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
        {/* Live Chat Box (Clean compact overlay at the bottom so face is not covered) */}
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
                className="inline-flex items-start gap-1 max-w-[88%] bg-black/50 border border-white/10 text-[11px] px-2 py-0.5 rounded-lg backdrop-blur-md"
              >
                {msg.badge && (
                  <span className="bg-amber-500 text-black font-extrabold text-[8px] px-1 rounded-xs mt-0.5">
                    {msg.badge}
                  </span>
                )}
                <span className="font-bold text-rose-300 shrink-0">{msg.user}:</span>
                <span className="text-white/90 break-words">{msg.text}</span>
              </div>
            );
          })}
        </div>

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

            {/* Video Toggle */}
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

      {/* Live Reward Celebration Popup Dialog */}
      {activeRewardAlert && (
        <LiveRewardCelebrationModal
          isOpen={!!activeRewardAlert}
          points={activeRewardAlert.points}
          title={activeRewardAlert.title}
          titleNep={activeRewardAlert.titleNep}
          description={activeRewardAlert.description}
          isCapReached={activeRewardAlert.isCapReached}
          mode={mode}
          onClose={() => setActiveRewardAlert(null)}
        />
      )}

      {/* Live Reward Rules & Fast-Forward Testing Sheet */}
      <LiveRewardRulesModal
        isOpen={isRewardRulesOpen}
        onClose={() => setIsRewardRulesOpen(false)}
        mode={mode}
        currentDurationSeconds={streamDuration}
        totalRewardPointsEarned={liveDurationRewardPoints}
        claimedFaceHour1={claimedMilestones.faceHour1}
        claimedFaceHour2={claimedMilestones.faceHour2}
        claimedPartyHour1={claimedMilestones.partyHour1}
        claimedPartyHour2={claimedMilestones.partyHour2}
        onFastForward={(secs) => setStreamDuration((prev) => prev + secs)}
        onSetDuration={(target) => {
          if (target === 0) {
            setClaimedMilestones({ faceHour1: false, faceHour2: false, partyHour1: false, partyHour2: false });
          }
          setStreamDuration(target);
        }}
      />

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
