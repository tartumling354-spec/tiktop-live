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
  Info
} from 'lucide-react';
import { PartySeat, PartySeatCount, VideoFilter } from '../types';
import { LiveCameraStream } from './LiveCameraStream';

interface PartyGridProps {
  seats: PartySeat[];
  seatCount: PartySeatCount;
  onChangeSeatCount: (count: PartySeatCount) => void;
  onTakeSeat: (seatNumber: number) => void;
  onLeaveSeat: (seatNumber: number) => void;
  onToggleSeatMic: (seatNumber: number) => void;
  onToggleSeatVideo: (seatNumber: number) => void;
  isHost?: boolean;
  isCameraOn?: boolean;
  facingMode?: 'user' | 'environment';
  filter?: VideoFilter;
  onToggleFacingMode?: () => void;
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
  isHost = true,
  isCameraOn = true,
  facingMode = 'user',
  filter = 'none',
  onToggleFacingMode,
}) => {
  // Modal for managing user's own seat
  const [activeSeatAction, setActiveSeatAction] = useState<PartySeat | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Find user's currently occupied seat
  const userSeat = seats.find((s) => s.isOccupied && s.userName?.includes('You'));

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

  return (
    <div id="party-grid-stage" className="w-full px-2 sm:px-4 py-2">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="mx-auto mb-2 py-1.5 px-3 rounded-full bg-indigo-600/90 border border-indigo-400/40 text-white text-[11px] font-bold shadow-lg flex items-center justify-center gap-1.5 animate-bounce-short max-w-xs text-center">
          <Info size={12} className="text-white shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Header Bar: Party Stage & 4/6/9/16/25 Seater Switcher */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 mb-2.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          {/* Title and stats */}
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

          {/* Quick User Seat Status / Video Toggle */}
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
                <span className="text-[9px]">{userSeat.isVideoOn ? 'Video ON' : 'Video OFF'}</span>
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
              Tap any empty seat to join (१ सिट मात्र)
            </span>
          )}
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
          const isUserSeat = seat.userName?.includes('You');

          return (
            <div
              key={seat.id}
              id={`party-seat-${seat.seatNumber}`}
              className={`relative ${getSeatAspectClass()} rounded-xl sm:rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all select-none ${
                seat.isOccupied
                  ? 'bg-neutral-900/90 border border-white/20 shadow-lg'
                  : 'bg-black/40 border border-dashed border-white/25 hover:border-emerald-400/60 hover:bg-black/60 cursor-pointer active:scale-95'
              }`}
              onClick={() => {
                if (!seat.isOccupied) {
                  // If user is already in another seat, moving frees old seat!
                  if (userSeat) {
                    showToast(`Seat #${userSeat.seatNumber} बाट Seat #${seat.seatNumber} मा सर्नुभयो`);
                  } else {
                    showToast(`Seat #${seat.seatNumber} मा बस्नुभयो`);
                  }
                  onTakeSeat(seat.seatNumber);
                } else if (isUserSeat) {
                  setActiveSeatAction(seat);
                } else {
                  showToast(`Seat #${seat.seatNumber} मा ${seat.userName} हुनुहुन्छ`);
                }
              }}
            >
              {seat.isOccupied ? (
                <>
                  {/* ====== VIDEO VIEW (WHEN VIDEO IS ON) ====== */}
                  {seat.isVideoOn ? (
                    <div className="absolute inset-0 z-0 bg-black">
                      {isUserSeat ? (
                        // Live User Camera Stream ONLY inside user's occupied box!
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
                        // Simulated Guest Video Feed
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
                        // Dynamic Video fallback
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
                    // ====== AUDIO VOICE-ONLY VIEW ======
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      {/* Speaking animated ring */}
                      {seat.isSpeaking && !seat.isMuted && (
                        <div className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
                      )}

                      {/* Avatar */}
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

                  {/* Seat Number & Host Crown Badge (Top Left) */}
                  <div className="absolute top-1 left-1 z-20 flex items-center gap-0.5">
                    <span className="bg-black/60 backdrop-blur-sm text-[8px] font-bold text-white/90 px-1 rounded">
                      #{seat.seatNumber}
                    </span>
                    {seat.isHost && (
                      <div className="bg-amber-500 text-black p-0.5 rounded shadow" title="Host">
                        <Crown size={9} className="fill-black" />
                      </div>
                    )}
                  </div>

                  {/* Bottom Overlay Info (Name & Video/Mic controls) */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-1 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between">
                    <span className="text-[9px] font-bold text-white truncate max-w-[65%] drop-shadow">
                      {isUserSeat ? 'You' : seat.userName}
                    </span>

                    <div className="flex items-center gap-0.5">
                      {/* Video Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSeatVideo(seat.seatNumber);
                        }}
                        className={`p-0.5 rounded text-[8px] transition-colors ${
                          seat.isVideoOn
                            ? 'bg-emerald-500/80 hover:bg-emerald-500 text-black'
                            : 'bg-black/60 hover:bg-black/80 text-white/60'
                        }`}
                        title={seat.isVideoOn ? 'Video is ON (Click to turn off)' : 'Video is OFF (Click to turn on)'}
                      >
                        {seat.isVideoOn ? <Video size={9} /> : <VideoOff size={9} />}
                      </button>

                      {/* Mic Status Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSeatMic(seat.seatNumber);
                        }}
                        className={`p-0.5 rounded text-[8px] transition-colors ${
                          seat.isMuted
                            ? 'bg-rose-600 text-white'
                            : 'bg-black/60 text-emerald-400'
                        }`}
                        title={seat.isMuted ? 'Muted' : 'Speaking'}
                      >
                        {seat.isMuted ? <MicOff size={9} /> : <Mic size={9} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* ====== EMPTY SEAT ====== */
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
                    Join
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Seat Management Action Modal (When user taps their own seat) */}
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
                  <h3 className="text-xs font-bold text-white">Seat #{activeSeatAction.seatNumber} (You)</h3>
                  <span className="text-[10px] text-neutral-400">Manage your seat broadcast</span>
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

              {/* Leave Seat */}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
