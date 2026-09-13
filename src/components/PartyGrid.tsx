import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  UserPlus,
  Crown,
  Volume2,
  Video,
  VideoOff,
  LayoutGrid,
  LogOut,
  X,
  Sparkles,
  Info,
  Gift as GiftIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  UserX,
  Star,
  Settings,
  Mail,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PartySeat, PartySeatCount, VideoFilter, PartyAccessMode, SeatJoinRequest, BannedUser } from '../types';
import { LiveCameraStream } from './LiveCameraStream';
import { PartySettingsModal } from './PartySettingsModal';
import { SeatInvitePickerModal } from './SeatInviteModal';

interface PartyGridProps {
  seats: PartySeat[];
  seatCount: PartySeatCount;
  onChangeSeatCount: (count: PartySeatCount) => void;
  onTakeSeat: (seatNumber: number) => void;
  onLeaveSeat: (seatNumber: number) => void;
  onToggleSeatMic: (seatNumber: number) => void;
  onToggleSeatVideo: (seatNumber: number) => void;
  onOpenGiftForSeat?: (seatNumber: number) => void;
  isHost?: boolean;
  isAdmin?: boolean;
  isCameraOn?: boolean;
  facingMode?: 'user' | 'environment';
  filter?: VideoFilter;
  onToggleFacingMode?: () => void;
  // Host & Moderation controls
  accessMode?: PartyAccessMode;
  onChangeAccessMode?: (mode: PartyAccessMode) => void;
  joinRequests?: SeatJoinRequest[];
  onApproveRequest?: (requestId: string) => void;
  onDeclineRequest?: (requestId: string) => void;
  bannedUsers?: BannedUser[];
  onKickFromSeat?: (seatNumber: number, userName: string) => void;
  onBanUser30m?: (userName: string, userAvatar?: string, reason?: string, seatNumber?: number) => void;
  onUnbanUser?: (userId: string) => void;
  onToggleAdmin?: (seatNumber: number, makeAdmin: boolean) => void;
  onSendInvite?: (targetUser: any, seatNumber: number) => void;
  onRequestSeat?: (seatNumber: number) => void;
  isUserFanClub?: boolean;
  onJoinFanClub?: () => void;
  currentUserName?: string;
}

const SEAT_OPTIONS: PartySeatCount[] = [4, 6, 9, 16, 25];

export const PartyGrid: React.FC<PartyGridProps> = ({
  seats,
  seatCount,
  onChangeSeatCount,
  onTakeSeat,
  onLeaveSeat,
  onToggleSeatMic,
  onToggleSeatVideo,
  onOpenGiftForSeat,
  isHost = true,
  isAdmin = false,
  isCameraOn = true,
  facingMode = 'user',
  filter = 'none',
  onToggleFacingMode,
  accessMode = 'free',
  onChangeAccessMode,
  joinRequests = [],
  onApproveRequest,
  onDeclineRequest,
  bannedUsers = [],
  onKickFromSeat,
  onBanUser30m,
  onUnbanUser,
  onToggleAdmin,
  onSendInvite,
  onRequestSeat,
  isUserFanClub = true,
  onJoinFanClub,
  currentUserName,
}) => {
  // Modals state
  const [activeSeatAction, setActiveSeatAction] = useState<PartySeat | null>(null);
  const [inspectedGuestSeat, setInspectedGuestSeat] = useState<PartySeat | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [inviteSeatTarget, setInviteSeatTarget] = useState<number | null>(null);
  const [banTargetSeat, setBanTargetSeat] = useState<PartySeat | null>(null);
  const [banReason, setBanReason] = useState<string>('अनुचित व्यवहार वा गालीगलौज');
  const [emptySeatPromptTarget, setEmptySeatPromptTarget] = useState<number | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Helper to reliably check if a seat is the current user's seat
  const checkIsUserSeat = (seat: PartySeat) => {
    if (!seat.isOccupied) return false;
    if (seat.userName?.includes('You')) return true;
    if (currentUserName && seat.userName && (seat.userName === currentUserName || seat.userName.startsWith(currentUserName))) return true;
    return false;
  };

  // Find user's currently occupied seat
  const userSeat = seats.find((s) => s.isOccupied && checkIsUserSeat(s));

  // Determine current user permissions: Host has supreme, Admin has moderator rights
  const hasModRights = isHost || isAdmin || Boolean(userSeat?.isAdmin);

  // Calculate Grid classes based on seat count
  const getGridColsClass = () => {
    switch (seatCount) {
      case 4:
        return 'grid-cols-2 max-w-sm'; // 2x2
      case 6:
        return 'grid-cols-3 max-w-md'; // 3x2
      case 9:
        return 'grid-cols-3 max-w-md'; // 3x3
      case 16:
        return 'grid-cols-4 max-w-lg'; // 4x4
      case 25:
        return 'grid-cols-5 max-w-xl'; // 5x5
      default:
        return 'grid-cols-3 max-w-md';
    }
  };

  const getSeatAspectClass = () => {
    switch (seatCount) {
      case 4:
        return 'aspect-[4/3] sm:aspect-square';
      case 6:
      case 9:
        return 'aspect-square';
      case 16:
      case 25:
        return 'aspect-square p-1';
      default:
        return 'aspect-square';
    }
  };

  const occupiedCount = seats.filter((s) => s.isOccupied).length;
  const videoOnCount = seats.filter((s) => s.isOccupied && s.isVideoOn).length;

  /**
   * Handling seat click:
   * 1. If empty seat:
   *    - Seat 1 is ALWAYS Host's seat! Block non-hosts.
   *    - If Host or Admin: can take seat or invite.
   *    - If mode is approval: send join request.
   *    - If mode is fanclub: check fanclub.
   *    - If free: take seat.
   * 2. If occupied:
   *    - If user's own seat: open seat controls (mic/cam/leave).
   *    - If another user: open moderation & action sheet!
   */
  const handleSeatClick = (seat: PartySeat) => {
    if (!seat.isOccupied) {
      // RULE: Seat #1 is permanently reserved for the Host
      if (seat.seatNumber === 1 && !isHost) {
        showToast('👑 सिट नम्बर १ होस्टको लागि मात्र आरक्षित छ। कृपया अन्य सिट रोज्नुहोस्।');
        return;
      }

      // If user is already Host, Host is anchored to Seat 1
      if (isHost && userSeat && userSeat.seatNumber === 1 && seat.seatNumber !== 1) {
        // Host clicking empty seat -> offer Invite or options
        setEmptySeatPromptTarget(seat.seatNumber);
        return;
      }

      // If Host/Admin clicks an empty seat: can sit or invite
      if (hasModRights) {
        setEmptySeatPromptTarget(seat.seatNumber);
        return;
      }

      // Regular Viewer clicking empty seat:
      if (accessMode === 'approval') {
        if (onRequestSeat) {
          onRequestSeat(seat.seatNumber);
        } else {
          showToast(`Seat #${seat.seatNumber} मा बस्न अनुरोध पठाइयो। होस्ट वा एडमिनको स्वीकृतिको प्रतीक्षा गर्नुहोस्...`);
        }
        return;
      }

      if (accessMode === 'fanclub') {
        if (!isUserFanClub) {
          showToast('⭐ यो सिट फ्यानक्लब सदस्यहरूका लागि मात्र आरक्षित छ!');
          if (onJoinFanClub) onJoinFanClub();
          return;
        }
      }

      // Free mode
      if (userSeat) {
        showToast(`Seat #${userSeat.seatNumber} बाट Seat #${seat.seatNumber} मा सर्नुभयो`);
      } else {
        showToast(`Seat #${seat.seatNumber} मा बस्नुभयो 🎙️`);
      }
      onTakeSeat(seat.seatNumber);
    } else {
      const isUserSeat = checkIsUserSeat(seat);
      if (isUserSeat) {
        setActiveSeatAction(seat);
      } else {
        // Inspecting other seated person
        setInspectedGuestSeat(seat);
      }
    }
  };

  /**
   * Check if current user can remove/kick the target user:
   * - Host can remove ANYONE (guests, members, AND admins)!
   * - Admin can remove regular guests/members, but CANNOT remove another Admin or the Host!
   * - Regular viewer cannot remove anyone.
   */
  const canRemoveTarget = (targetSeat: PartySeat): { allowed: boolean; reason?: string } => {
    if (targetSeat.isHost) {
      return { allowed: false, reason: 'होस्टलाई कसैले पनि हटाउन मिल्दैन।' };
    }
    if (isHost) {
      return { allowed: true };
    }
    if (isAdmin) {
      if (targetSeat.isAdmin) {
        return { allowed: false, reason: 'एडमिनले अर्को एडमिनलाई हटाउन पाउँदैन।' };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: 'हटाउनका लागि होस्ट वा एडमिन हुनुपर्छ।' };
  };

  return (
    <div id="party-grid-stage" className="w-full px-2 sm:px-4 py-2">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="mx-auto mb-2 py-1.5 px-3 rounded-full bg-indigo-600/90 border border-indigo-400/40 text-white text-[11px] font-bold shadow-lg flex items-center justify-center gap-1.5 animate-bounce-short max-w-sm text-center">
          <Info size={12} className="text-white shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Header Bar: Party Stage, Access Mode Badge & Seater Switcher */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 mb-2.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          {/* Title, Role and Mode stats */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Volume2 size={15} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Party Stage</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.2 rounded-full border border-indigo-500/30">
                  {seatCount} Seats
                </span>

                {/* Access Mode indicator badge */}
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border flex items-center gap-0.5 ${
                    accessMode === 'free'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : accessMode === 'approval'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {accessMode === 'free' && '🔓 खुला'}
                  {accessMode === 'approval' && '🛡️ स्वीकृति'}
                  {accessMode === 'fanclub' && '⭐ फ्यानक्लब'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <span>Occupied: {occupiedCount}/{seatCount}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <Video size={10} /> {videoOnCount} Video ON
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Management Button & User Seat Status */}
          <div className="flex items-center gap-1.5">
            {/* Moderation / Settings button for Host & Admin */}
            {hasModRights && (
              <button
                type="button"
                id="btn-open-party-settings"
                onClick={() => setIsSettingsModalOpen(true)}
                className="relative px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white text-[11px] font-bold shadow-md flex items-center gap-1 transition-all active:scale-95"
                title="Party Live व्यवस्थापन (Seat & Moderation Settings)"
              >
                <Shield size={12} className="text-indigo-200" />
                <span>व्यवस्थापन</span>
                {joinRequests.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {joinRequests.length}
                  </span>
                )}
              </button>
            )}

            {userSeat ? (
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl border border-white/15">
                <span className="text-[10px] text-indigo-200 font-bold">
                  Seat #{userSeat.seatNumber}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleSeatVideo(userSeat.seatNumber)}
                  className={`p-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                    userSeat.isVideoOn
                      ? 'bg-emerald-500 text-black shadow'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                  title="Toggle your seat video"
                >
                  {userSeat.isVideoOn ? <Video size={11} /> : <VideoOff size={11} />}
                  <span className="text-[9px]">{userSeat.isVideoOn ? 'Cam ON' : 'Cam OFF'}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* 4 / 6 / 9 / 16 / 25 Seater Selector Buttons */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1 shrink-0">
            <LayoutGrid size={12} className="text-indigo-400" />
            <span>Layout:</span>
          </span>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {SEAT_OPTIONS.map((count) => {
              const isActive = seatCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  id={`btn-party-seats-${count}`}
                  onClick={() => onChangeSeatCount(count)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-400/40'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10'
                  }`}
                >
                  <span>{count}</span>
                  <span className="text-[9px] opacity-80">Seats</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className={`grid ${getGridColsClass()} mx-auto gap-1.5 sm:gap-2 max-h-[46vh] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-white/20`}>
        {seats.slice(0, seatCount).map((seat) => {
          const isUserSeat = checkIsUserSeat(seat);

          return (
            <div
              key={seat.id}
              id={`party-seat-${seat.seatNumber}`}
              className={`relative ${getSeatAspectClass()} rounded-xl sm:rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all select-none ${
                seat.isOccupied
                  ? 'bg-neutral-900/90 border border-white/20 shadow-lg'
                  : 'bg-black/40 border border-dashed border-white/25 hover:border-indigo-400/60 hover:bg-black/60 cursor-pointer active:scale-95'
              } ${seat.seatNumber === 1 ? 'ring-1 ring-amber-400/40' : ''}`}
              onClick={() => handleSeatClick(seat)}
            >
              {seat.isOccupied ? (
                <>
                  {/* Floating points directly over seat head */}
                  {seat.recentGiftEffect && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center animate-bounce-short">
                      <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-neutral-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full shadow-2xl border-2 border-white flex items-center gap-1 whitespace-nowrap animate-pulse drop-shadow-[0_4px_12px_rgba(245,158,11,0.9)]">
                        <span className="text-xs sm:text-sm">{seat.recentGiftEffect.giftIcon}</span>
                        <span className="tracking-tight">
                          +{seat.recentGiftEffect.points >= 1000 ? `${(seat.recentGiftEffect.points / 1000).toFixed(0)}k` : seat.recentGiftEffect.points} Pts
                        </span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] text-amber-200 font-extrabold bg-neutral-950/90 px-1.5 py-0.2 rounded-full border border-amber-400/50 shadow mt-0.5">
                        {seat.recentGiftEffect.giftName}
                      </span>
                    </div>
                  )}

                  {/* Seat cumulative points badge (Top Right) */}
                  {seat.pointsEarned && seat.pointsEarned > 0 ? (
                    <div
                      className="absolute top-1 right-1 z-20 flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full shadow-md border border-white/40"
                      title={`कुल अंक: ${seat.pointsEarned}`}
                    >
                      <span>💎</span>
                      <span>{seat.pointsEarned >= 1000 ? `${(seat.pointsEarned / 1000).toFixed(1)}k` : seat.pointsEarned}</span>
                    </div>
                  ) : null}

                  {/* Video View */}
                  {seat.isVideoOn ? (
                    <div className="absolute inset-0 z-0 bg-black">
                      {isUserSeat ? (
                        <div className="w-full h-full relative overflow-hidden bg-neutral-950 flex items-center justify-center">
                          <LiveCameraStream
                            isCameraOn={isCameraOn && (seat.isVideoOn ?? true)}
                            isMicOn={!seat.isMuted}
                            facingMode={facingMode}
                            filter={filter}
                            onToggleFacingMode={onToggleFacingMode ?? (() => {})}
                            streamerName="You"
                            isHost={seat.isHost}
                            isMiniBox={true}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
                          <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-emerald-500 text-black text-[8px] font-extrabold px-1 py-0.2 rounded shadow pointer-events-none z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                            <span>CAM</span>
                          </div>
                        </div>
                      ) : seat.videoUrl ? (
                        <div className="w-full h-full relative overflow-hidden bg-black">
                          <video
                            src={seat.videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                        </div>
                      ) : (
                        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-neutral-950 flex items-center justify-center">
                          <img
                            src={seat.userAvatar}
                            alt={seat.userName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                        </div>
                      )}
                    </div>
                  ) : (
                    // Audio voice-only view
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      {seat.isSpeaking && !seat.isMuted && (
                        <div className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
                      )}

                      <div className={`relative rounded-full overflow-hidden border-2 shadow-md ${
                        seatCount <= 6 ? 'w-11 h-11 sm:w-12 sm:h-12' : seatCount <= 9 ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-7 h-7 sm:w-8 sm:h-8'
                      } ${seat.isSpeaking && !seat.isMuted ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-white/40'}`}>
                        <img
                          src={seat.userAvatar}
                          alt={seat.userName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Seat Number & Badges (Top Left) */}
                  <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5">
                    <span className="bg-black/60 backdrop-blur-sm text-[8px] font-bold text-white/90 px-1 rounded">
                      #{seat.seatNumber}
                    </span>
                    {/* Host Crown */}
                    {seat.isHost && (
                      <div className="bg-amber-500 text-black p-0.5 rounded shadow flex items-center gap-0.5" title="Host (Seat #1)">
                        <Crown size={9} className="fill-black" />
                      </div>
                    )}
                    {/* Admin Shield Badge */}
                    {seat.isAdmin && !seat.isHost && (
                      <div className="bg-indigo-600 text-white p-0.5 rounded shadow flex items-center gap-0.5" title="Admin">
                        <Shield size={9} className="fill-white" />
                      </div>
                    )}
                    {/* FanClub Badge */}
                    {seat.isFanClub && (
                      <div className="bg-amber-500/80 text-neutral-950 p-0.5 rounded shadow" title="Fan Club Member">
                        <Star size={8} className="fill-neutral-950" />
                      </div>
                    )}
                  </div>

                  {/* Bottom Overlay Info (Name & Video/Mic controls) */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-1 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-0.5 truncate max-w-[65%]">
                      <span className="text-[9px] font-bold text-white truncate drop-shadow">
                        {isUserSeat ? 'You' : seat.userName}
                      </span>
                      {seat.isAdmin && !seat.isHost && (
                        <span className="text-[7px] bg-indigo-500 text-white px-0.5 rounded font-black">
                          ADM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5">
                      {/* Video Button / Indicator - Self Only */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isUserSeat) {
                            onToggleSeatVideo(seat.seatNumber);
                          } else {
                            showToast('📹 क्यामेरा अन/अफ केवल प्रयोगकर्ता स्वयंले मात्र गर्न सक्नुहुन्छ!');
                          }
                        }}
                        className={`p-0.5 rounded text-[8px] transition-colors ${
                          seat.isVideoOn
                            ? 'bg-emerald-500/80 hover:bg-emerald-500 text-black'
                            : 'bg-black/60 hover:bg-black/80 text-white/60'
                        } ${isUserSeat ? 'cursor-pointer' : 'cursor-default'}`}
                        title={
                          isUserSeat
                            ? (seat.isVideoOn ? 'Video ON (Click to turn off)' : 'Video OFF (Click to turn on)')
                            : (seat.isVideoOn ? 'Video is ON (नियन्त्रण स्वयमले मात्र गर्न मिल्छ)' : 'Video is OFF')
                        }
                      >
                        {seat.isVideoOn ? <Video size={9} /> : <VideoOff size={9} />}
                      </button>

                      {/* Mic Button - Host, Admin, and Self */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const canControlMic = isUserSeat || isHost || isAdmin || userSeat?.isAdmin;
                          if (canControlMic) {
                            onToggleSeatMic(seat.seatNumber);
                            if (!isUserSeat) {
                              showToast(
                                seat.isMuted
                                  ? `🎙️ ${seat.userName} को माइक अनम्युट गरियो`
                                  : `🔇 ${seat.userName} को माइक म्युट गरियो`
                              );
                            }
                          } else {
                            showToast('🎙️ माइक म्युट/अनम्युट गर्न होस्ट, एडमिन वा स्वयं व्यक्तिले मात्र मिल्छ!');
                          }
                        }}
                        className={`p-0.5 rounded text-[8px] transition-colors ${
                          seat.isMuted
                            ? 'bg-rose-600 text-white'
                            : 'bg-black/60 text-emerald-400'
                        } ${!(isUserSeat || isHost || isAdmin || userSeat?.isAdmin) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={
                          (isUserSeat || isHost || isAdmin || userSeat?.isAdmin)
                            ? (seat.isMuted ? 'Muted (Click to unmute)' : 'Speaking (Click to mute)')
                            : (seat.isMuted ? 'Muted' : 'Speaking')
                        }
                      >
                        {seat.isMuted ? <MicOff size={9} /> : <Mic size={9} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty Seat */
                <div className="flex flex-col items-center justify-center p-1 text-center">
                  <div className={`rounded-full bg-white/10 flex items-center justify-center text-white/50 mb-0.5 group-hover:text-white transition-colors ${
                    seatCount <= 9 ? 'w-7 h-7' : 'w-5 h-5'
                  }`}>
                    <UserPlus size={seatCount <= 9 ? 14 : 11} />
                  </div>
                  <span className="text-[9px] font-medium text-white/60">
                    Seat {seat.seatNumber}
                  </span>
                  <span className="text-[8px] text-indigo-300/80 font-bold hidden sm:block">
                    {seat.seatNumber === 1 ? 'Host Only' : 'Join / Invite'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL 1: EMPTY SEAT OPTIONS FOR HOST/ADMIN (Sit or Invite) */}
      {emptySeatPromptTarget !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEmptySeatPromptTarget(null)}
        >
          <div
            className="w-full max-w-xs bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl animate-scale-up text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Empty Seat #{emptySeatPromptTarget}</h4>
                  <span className="text-[10px] text-neutral-400">कार्य छान्नुहोस् (Choose Action)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmptySeatPromptTarget(null)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-3 space-y-2">
              {/* Option 1: Sit down (if not Host who must stay at seat 1) */}
              {!isHost && (
                <button
                  type="button"
                  onClick={() => {
                    const target = emptySeatPromptTarget;
                    setEmptySeatPromptTarget(null);
                    onTakeSeat(target);
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <UserPlus size={14} className="text-emerald-400" />
                  <span>आफैं बस्नुहोस् (Take This Seat)</span>
                </button>
              )}

              {/* Option 2: Invite Audience member */}
              <button
                type="button"
                id="btn-empty-seat-invite"
                onClick={() => {
                  const target = emptySeatPromptTarget;
                  setEmptySeatPromptTarget(null);
                  setInviteSeatTarget(target);
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Mail size={14} className="text-indigo-200" />
                <span>दर्शकलाई सिटमा आमन्त्रण (Invite Audience)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: USER'S OWN SEAT MANAGEMENT MODAL */}
      {activeSeatAction && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveSeatAction(null)}
        >
          <div
            className="w-full max-w-xs bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500">
                  <img
                    src={activeSeatAction.userAvatar}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Seat #{activeSeatAction.seatNumber} (You)</span>
                    {activeSeatAction.isHost && (
                      <span className="text-[9px] bg-amber-500 text-neutral-950 font-black px-1 rounded">
                        Host
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-neutral-400">आफ्नो सिट प्रसारण नियन्त्रण</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSeatAction(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {/* Video ON / OFF */}
              <button
                type="button"
                id="btn-seat-toggle-video"
                onClick={() => {
                  onToggleSeatVideo(activeSeatAction.seatNumber);
                  setActiveSeatAction((prev) => prev ? { ...prev, isVideoOn: !prev.isVideoOn } : null);
                  showToast(activeSeatAction.isVideoOn ? 'Video Turned OFF' : 'Video Turned ON 📹');
                }}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                  activeSeatAction.isVideoOn
                    ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-white/10 border border-white/15 text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeSeatAction.isVideoOn ? <Video size={16} className="text-emerald-400" /> : <VideoOff size={16} className="text-neutral-400" />}
                  <span>Video Stream (भिडियो)</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeSeatAction.isVideoOn ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {activeSeatAction.isVideoOn ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Mic ON / OFF */}
              <button
                type="button"
                id="btn-seat-toggle-mic"
                onClick={() => {
                  onToggleSeatMic(activeSeatAction.seatNumber);
                  setActiveSeatAction((prev) => prev ? { ...prev, isMuted: !prev.isMuted } : null);
                }}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                  activeSeatAction.isMuted
                    ? 'bg-rose-600/20 border border-rose-500/40 text-rose-300'
                    : 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeSeatAction.isMuted ? <MicOff size={16} className="text-rose-400" /> : <Mic size={16} className="text-emerald-400" />}
                  <span>Microphone (माइक)</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeSeatAction.isMuted ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-black'
                }`}>
                  {activeSeatAction.isMuted ? 'MUTED' : 'LIVE'}
                </span>
              </button>

              {/* Leave Seat (Blocked for Host on Seat 1) */}
              {activeSeatAction.seatNumber === 1 && isHost ? (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 text-center font-medium">
                  👑 होस्ट सधैं १ नम्बर सिटमै बस्नुपर्छ। यो सिट खाली गर्न मिल्दैन।
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-seat-leave"
                  onClick={() => {
                    onLeaveSeat(activeSeatAction.seatNumber);
                    setActiveSeatAction(null);
                    showToast(`Seat #${activeSeatAction.seatNumber} छोड्नुभयो`);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut size={15} />
                  <span>Leave Seat (सिट खाली गर्नुहोस्)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INSPECTED GUEST MODAL (Moderation: Appoint Admin, Kick, 30m Ban, Gift) */}
      {inspectedGuestSeat && (
        <div
          id="modal-inspected-guest-action"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fade-in"
          onClick={() => setInspectedGuestSeat(null)}
        >
          <div
            className="w-full max-w-sm bg-neutral-900 border border-white/20 rounded-3xl p-5 shadow-2xl animate-scale-up text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with guest details */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                  <img
                    src={inspectedGuestSeat.userAvatar}
                    alt={inspectedGuestSeat.userName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{inspectedGuestSeat.userName}</span>
                    {inspectedGuestSeat.isHost && (
                      <span className="text-[9px] bg-amber-500 text-neutral-950 px-1 rounded font-black flex items-center gap-0.5">
                        <Crown size={9} /> Host
                      </span>
                    )}
                    {inspectedGuestSeat.isAdmin && !inspectedGuestSeat.isHost && (
                      <span className="text-[9px] bg-indigo-500 text-white px-1 rounded font-black flex items-center gap-0.5">
                        <Shield size={9} /> Admin
                      </span>
                    )}
                    {inspectedGuestSeat.isFanClub && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1 rounded">
                        Fan
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] text-neutral-400">Seat #{inspectedGuestSeat.seatNumber}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedGuestSeat(null)}
                className="p-1 text-white/60 hover:text-white rounded-full hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Points earned badge */}
            <div className="my-2.5 p-2 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
              <span className="text-neutral-400">कमाएको कुल उपहार अंक:</span>
              <span className="font-extrabold text-amber-300 flex items-center gap-1">
                <span>💎</span>
                <span>{(inspectedGuestSeat.pointsEarned || 0).toLocaleString()} Pts</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* 1. Send Gift (Available to everyone) */}
              <button
                type="button"
                id="btn-guest-send-gift"
                onClick={() => {
                  const targetNum = inspectedGuestSeat.seatNumber;
                  setInspectedGuestSeat(null);
                  if (onOpenGiftForSeat) {
                    onOpenGiftForSeat(targetNum);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <GiftIcon size={14} />
                <span>उपहार पठाउनुहोस् (Send Gift to Seat #{inspectedGuestSeat.seatNumber})</span>
              </button>

              {/* 2. Mic Mute / Unmute (Allowed for Host & Admin) */}
              {(isHost || isAdmin || userSeat?.isAdmin) && (
                <button
                  type="button"
                  id="btn-guest-toggle-mic"
                  onClick={() => {
                    onToggleSeatMic(inspectedGuestSeat.seatNumber);
                    const willMute = !inspectedGuestSeat.isMuted;
                    setInspectedGuestSeat((prev) => (prev ? { ...prev, isMuted: willMute } : null));
                    showToast(
                      willMute
                        ? `🔇 ${inspectedGuestSeat.userName} को माइक म्युट गरियो`
                        : `🎙️ ${inspectedGuestSeat.userName} को माइक अनम्युट गरियो`
                    );
                  }}
                  className={`w-full py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    inspectedGuestSeat.isMuted
                      ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {inspectedGuestSeat.isMuted ? <Mic size={14} /> : <MicOff size={14} />}
                  <span>
                    {inspectedGuestSeat.isMuted
                      ? 'माइक अनम्युट गर्नुहोस् (Unmute Mic)'
                      : 'माइक म्युट गर्नुहोस् (Mute Mic)'}
                  </span>
                </button>
              )}

              {/* Camera Privacy Indicator: Camera can only be changed by the user themselves */}
              <div className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-neutral-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Video size={12} className="text-neutral-400" />
                  <span>क्यामेरा स्थिति:</span>
                </span>
                <span className={`font-bold ${inspectedGuestSeat.isVideoOn ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {inspectedGuestSeat.isVideoOn ? 'ON 📹' : 'OFF'}
                  <span className="text-[9px] text-neutral-400 font-normal ml-1">(स्वयमले मात्र अन/अफ गर्न मिल्ने)</span>
                </span>
              </div>

              {/* 2. Admin Management (Only Host can appoint/remove Admin) */}
              {isHost && !inspectedGuestSeat.isHost && (
                <button
                  type="button"
                  id="btn-toggle-admin-role"
                  onClick={() => {
                    const nextAdmin = !inspectedGuestSeat.isAdmin;
                    if (onToggleAdmin) {
                      onToggleAdmin(inspectedGuestSeat.seatNumber, nextAdmin);
                    }
                    showToast(
                      nextAdmin
                        ? `🛡️ ${inspectedGuestSeat.userName} लाई व्यवस्थापक (Admin) बनाइयो!`
                        : `🛡️ ${inspectedGuestSeat.userName} लाई Admin बाट हटाइयो!`
                    );
                    setInspectedGuestSeat(null);
                  }}
                  className={`w-full py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    inspectedGuestSeat.isAdmin
                      ? 'bg-white/10 hover:bg-white/15 text-neutral-300 border border-white/10'
                      : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40'
                  }`}
                >
                  <Shield size={14} className="text-indigo-400" />
                  <span>
                    {inspectedGuestSeat.isAdmin
                      ? 'व्यवस्थापक पदबाट हटाउनुहोस् (Remove Admin)'
                      : 'व्यवस्थापक बनाउनुहोस् (Appoint as Admin)'}
                  </span>
                </button>
              )}

              {/* 3. Moderation Actions: Kick from Seat and 30-min Ban */}
              {hasModRights && !inspectedGuestSeat.isHost && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <ShieldAlert size={12} className="text-amber-400" />
                    <span>मोडरेशन कार्यहरू (Moderation Controls):</span>
                  </div>

                  {(() => {
                    const { allowed, reason } = canRemoveTarget(inspectedGuestSeat);

                    if (!allowed) {
                      return (
                        <div className="p-2.5 rounded-xl bg-neutral-800/90 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                          <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                          <span>{reason || 'हटाउन अनुमति छैन।'}</span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {/* Option 1: Kick from seat ONLY (keeps user in live as viewer) */}
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                          <button
                            type="button"
                            id="btn-kick-from-seat"
                            onClick={() => {
                              if (onKickFromSeat) {
                                onKickFromSeat(inspectedGuestSeat.seatNumber, inspectedGuestSeat.userName || 'Guest');
                              }
                              showToast(`🪑 ${inspectedGuestSeat.userName} लाई सिटबाट हटाइयो (दर्शकको रूपमा लाइभ हेरिरहन सक्नुहुन्छ)`);
                              setInspectedGuestSeat(null);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                          >
                            <UserX size={15} className="text-amber-400" />
                            <span>सिटबाट मात्र हटाउनुहोस् (दर्शक बनाउनुहोस्)</span>
                          </button>
                          <p className="text-[9.5px] text-amber-300/80 text-center px-1">
                            💡 प्रयोगकर्ता सिटबाट मात्र हट्नुहुनेछ, लाइभ प्रसारण भने दर्शक बनेर निरन्तर हेर्न पाउनेछन्।
                          </p>
                        </div>

                        {/* Option 2: 30-Minute Ban from Live (Host & Admin control) */}
                        <div className="p-2.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                          <button
                            type="button"
                            id="btn-open-30m-ban-modal"
                            onClick={() => {
                              const target = inspectedGuestSeat;
                              setInspectedGuestSeat(null);
                              setBanTargetSeat(target);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition-all active:scale-95"
                          >
                            <Ban size={14} />
                            <span>३० मिनेटका लागि निष्कासन / ब्लक (30m Ban)</span>
                          </button>
                          <p className="text-[9.5px] text-rose-300/80 text-center px-1">
                            🚫 अनुचित व्यवहार गर्नेलाई ३० मिनेटका लागि सिट र सम्पूर्ण लाइभबाट निष्कासन गरिन्छ।
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: 30-MINUTE BAN CONFIRMATION MODAL */}
      {banTargetSeat && (
        <div
          id="modal-confirm-30m-ban"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setBanTargetSeat(null)}
        >
          <div
            className="w-full max-w-sm bg-neutral-900 border-2 border-rose-500/60 rounded-3xl p-5 shadow-2xl animate-scale-up text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">३० मिनेटका लागि निष्कासन तथा प्रतिबन्ध</h3>
                <span className="text-[10px] text-neutral-400">अनुचित व्यवहार नियन्त्रण नियम</span>
              </div>
            </div>

            <div className="py-3 text-xs text-neutral-300 space-y-2.5">
              <p>
                तपाईं <strong>{banTargetSeat.userName}</strong> लाई यस लाइभ वा पार्टीबाट ३० मिनेटका लागि हटाउँदै हुनुहुन्छ। यस अवधिमा उहाँ पुनः यस लाइभमा जोडिन पाउनुहुने छैन।
              </p>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                  निष्कासनको कारण छान्नुहोस्:
                </label>
                <select
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-neutral-800 border border-white/20 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="अनुचित बोली वा गालीगलौज">अनुचित बोली वा गालीगलौज (Abusive behavior)</option>
                  <option value="अनावश्यक बाधा वा होहल्ला">अनावश्यक बाधा वा होहल्ला (Disruptive / Spam)</option>
                  <option value="समुदाय नियम उल्लंघन">समुदाय नियम उल्लंघन (Community rules violation)</option>
                  <option value="अन्य अनुचित व्यवहार">अन्य अनुचित व्यवहार (Inappropriate behavior)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setBanTargetSeat(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-bold"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                id="btn-confirm-30m-ban-action"
                onClick={() => {
                  if (onBanUser30m) {
                    onBanUser30m(
                      banTargetSeat.userName || 'User',
                      banTargetSeat.userAvatar,
                      banReason,
                      banTargetSeat.seatNumber
                    );
                  }
                  showToast(`🚫 ${banTargetSeat.userName} लाई ३० मिनेटका लागि लाइभबाट निष्कासन गरियो!`);
                  setBanTargetSeat(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 transition-all"
              >
                पुष्टि गरि ब्लक गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PARTY SETTINGS & SEAT APPROVAL MODAL */}
      <PartySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        accessMode={accessMode}
        onChangeAccessMode={(mode) => onChangeAccessMode && onChangeAccessMode(mode)}
        joinRequests={joinRequests}
        onApproveRequest={(id) => onApproveRequest && onApproveRequest(id)}
        onDeclineRequest={(id) => onDeclineRequest && onDeclineRequest(id)}
        bannedUsers={bannedUsers}
        onUnbanUser={(id) => onUnbanUser && onUnbanUser(id)}
        seats={seats}
        onToggleAdmin={(seatNumber, makeAdmin) => onToggleAdmin && onToggleAdmin(seatNumber, makeAdmin)}
        isHost={isHost}
        isAdmin={isAdmin}
      />

      {/* MODAL 6: SEAT INVITE PICKER MODAL (When Host/Admin invites someone) */}
      <SeatInvitePickerModal
        isOpen={inviteSeatTarget !== null}
        onClose={() => setInviteSeatTarget(null)}
        seatNumber={inviteSeatTarget || 2}
        senderRole={isHost ? 'Host' : 'Admin'}
        onSendInvite={(targetUser, seatNum) => {
          if (onSendInvite) {
            onSendInvite(targetUser, seatNum);
          }
        }}
      />
    </div>
  );
};

